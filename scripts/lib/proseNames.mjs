// Regla AGENTS.md n.º 8: toda mención de una persona en el body debe llevar su
// wikilink [[people/id]] — no solo la primera aparición. Este módulo centraliza
// la detección de menciones en prosa "reemplazables" (nombre completo o apellido
// de una persona registrada en src/content/people/*.md) para que scripts/validate.mjs
// (enforcement: error si queda alguna) y scripts/fix-prose-wikilinks.mjs
// (limpieza del backlog) usen EXACTAMENTE la misma definición.
//
// Heurística de apellidos (nombres chilenos/españoles):
// - "José Antonio Kast" → segundo nombre "Antonio" (en GIVEN_NAMES) ⇒ apellidos ["Kast"]
// - "Eduardo Macaya Zentilli" → "Macaya" no es nombre de pila ⇒ apellidos ["Macaya", "Macaya Zentilli"]
// - "María José Hoffmann Opazo" → "José" es nombre de pila ⇒ apellidos ["Hoffmann", "Hoffmann Opazo"]
// Con el guard de ambigüedad (apellido único entre las personas YA enlazadas en
// el evento) se evita enlazar "Kast" cuando hay dos Kast vinculados, o apellidos
// compartidos con otra persona mencionada.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const LH = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ-';
const WORD_BOUNDS = `(?<![${LH}])|(?![${LH}])`;

// Nombres de pila comunes (chilenos/españoles), sin acentos y en minúsculas,
// para distinguir el segundo nombre del primer apellido en nombres de 3+ tokens.
const GIVEN_NAMES = new Set([
  'jose', 'antonio', 'juan', 'miguel', 'luis', 'carlos', 'jorge', 'pablo', 'andres',
  'pedro', 'diego', 'francisco', 'manuel', 'ignacio', 'cristian', 'ricardo', 'mario',
  'raul', 'gabriel', 'rodrigo', 'mauricio', 'alvaro', 'alejandro', 'patricio', 'claudio',
  'sergio', 'fernando', 'eduardo', 'marcos', 'marcelo', 'nelson', 'guillermo', 'arturo',
  'daniel', 'felipe', 'gonzalo', 'hector', 'hugo', 'ivan', 'javier', 'jaime', 'julio',
  'leonardo', 'marco', 'matias', 'nicolas', 'oscar', 'roberto', 'ruben', 'salvador',
  'samuel', 'sebastian', 'tomas', 'vicente', 'victor', 'enrique', 'esteban', 'fabian',
  'german', 'gustavo', 'hernan', 'leopoldo', 'lorenzo', 'maximiliano', 'ramiro',
  'rolando', 'romulo', 'simon', 'tito', 'waldo', 'amaro', 'benjamin', 'camilo',
  'cristobal', 'danilo', 'elias', 'emilio', 'ernesto', 'gregorio', 'italo', 'joaquin',
  'julian', 'leonel', 'octavio', 'osvaldo', 'raimundo', 'renato', 'teodoro', 'dario',
  'eugenio', 'felix', 'isidoro', 'luciano', 'mariano', 'milovan', 'nabor', 'orlando',
  'pascual', 'querubin', 'reinaldo', 'saul', 'ulises', 'valentin', 'yasna', 'zacarias',
  'maria', 'carolina', 'camila', 'catalina', 'claudia', 'daniela', 'francisca',
  'gabriela', 'javiera', 'karina', 'leonarda', 'lorena', 'macarena', 'marcela',
  'margarita', 'nicole', 'pamela', 'paulina', 'paula', 'rocio', 'sandra', 'sofia',
  'susana', 'valentina', 'veronica', 'andrea', 'alejandra', 'ana', 'beatriz', 'carmen',
  'cecilia', 'constanza', 'cristina', 'diana', 'elena', 'elizabeth', 'emilia',
  'fernanda', 'gloria', 'isabel', 'jacqueline', 'jessica', 'johanna', 'julia', 'karen',
  'katherine', 'laura', 'liliana', 'loreto', 'lucia', 'magdalena', 'manuela', 'marcia',
  'mariana', 'marta', 'mercedes', 'monica', 'natalia', 'patricia', 'pilar', 'raquel',
  'ruth', 'sara', 'silvia', 'soledad', 'tatiana', 'teresa', 'trinidad', 'violeta',
  'yerka', 'ximena', 'bernardita', 'marisol', 'pascuala', 'rosa', 'elisa', 'evelyn',
  'ingrid', 'jeanette', 'luz', 'paulina', 'rosa', 'silvana', 'ursula',
  // Compuestos: "María Paz Grandjean" / "María Pía Silva" → el apellido es el último
  'paz', 'pia',
]);

const stripAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Construye el source de un regex "flexible" para una frase: escapa metacaracteres
// y hace los acentos opcionales (José → Jos[eé]) para tolerar variantes sin tilde.
function flexSource(phrase) {
  const ACCENTED = {
    a: '[aá]', e: '[eé]', i: '[ií]', o: '[oó]', u: '[uúü]', n: '[nñ]',
    A: '[AÁ]', E: '[EÉ]', I: '[IÍ]', O: '[OÓ]', U: '[UÚÜ]', N: '[NÑ]',
  };
  let out = '';
  for (const ch of phrase) {
    if (ACCENTED[ch]) out += ACCENTED[ch];
    else out += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return out;
}

function phraseRe(phrase) {
  const flex = flexSource(phrase);
  return new RegExp(`(?<![${LH}])${flex}(?![${LH}])`, 'gi');
}

// Prefijos que indican que la palabra siguiente forma parte de un nombre de
// organización/relación, no una mención de la persona ("Fundación Kast",
// "familia Macaya", "Hospital Barros Luco"). Solo se aplica a menciones por
// apellido (las de nombre completo son coincidencias exactas de bajo riesgo).
const ORG_PREFIX_RE = new RegExp(
  '(?:fundaci[oó]n|familia|familiares|herman[oa]s?|hij[oa]s?|padre|madre|' +
    'se[ñn]ora|espos[oa]|viud[oa]|c[ií]rculo|club|instituto|colegio|hospital|' +
    'universidad|calle|avenida|plaza|paseo|estadio|monumento|biblioteca|museo|' +
    'teatro|parque|liceo|escuela|iglesia|aeropuerto|banco|empresa|sociedad|' +
    'compa[ñn][ií]a|corporaci[oó]n|asociaci[oó]n|comit[eé]|junta|gobierno|' +
    'ministerio|subsecretar[ií]a|servicio|direcci[oó]n|fiscal[ií]a|tribunal|' +
    'corte|poder|ej[eé]rcito|armada|fuerza|senado|c[aá]mara|partido|convenci[oó]n|' +
    'mesa|comisi[oó]n|sala|consejo|grupo|red|agrupaci[oó]n|comunidad|' +
    'federaci[oó]n|confederaci[oó]n|central|sindicato|estado|presidencia|' +
    'vicepresidencia|secretar[ií]a|fundaci[oó]n)\\s+$',
  'i'
);

// Índice de personas: id → { nombre, firstToken, fullRe, surnamePhrases }.
// El cálculo de apellidos se hace UNA vez (no por archivo) para que validate
// siga siendo rápido.
export function buildPeopleIndex(peopleData) {
  const index = new Map();
  for (const [id, p] of Object.entries(peopleData)) {
    if (!p || typeof p.nombre !== 'string') continue;
    const nombre = p.nombre.trim();
    if (nombre.length < 3) continue;
    const tokens = nombre.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) continue;

    // Primer apellido: el primer token (desde el penúltimo hacia el final) que
    // NO sea un nombre de pila conocido.
    let surnameStart = -1;
    for (let i = Math.max(1, tokens.length - 2); i < tokens.length; i++) {
      if (!GIVEN_NAMES.has(stripAccents(tokens[i]).toLowerCase())) {
        surnameStart = i;
        break;
      }
    }
    if (surnameStart === -1) surnameStart = tokens.length - 1;
    const surnames = tokens.slice(surnameStart);
    const phrases = [surnames[0]];
    if (surnames.length > 1) phrases.push(surnames.join(' '));
    // Apellidos simples de 3 letras se descartan: "del", "san", "mas", "paz",
    // "van", "rau", "cid"… son palabras comunes del español y generarían falsos
    // positivos (ej. "más de 40%"). El nombre completo sigue siendo detectado.
    const uniq = [...new Set(phrases)].filter((ph) => ph.length >= 4);

    index.set(id, {
      nombre,
      firstToken: tokens[0],
      fullRe: phraseRe(nombre),
      surnamePhrases: uniq.map((ph) => ({
        phrase: ph,
        firstToken: ph.split(/\s+/)[0],
        re: phraseRe(ph),
      })),
    });
  }
  return index;
}

// Devuelve las menciones en prosa reemplazables del body (sin frontmatter).
// { mentions: [{ personId, phrase, kind, start, end }], linkedIds: Set }
// Las posiciones son relativas al `body` original (los rangos bloqueados —
// wikilinks existentes, código fenced/inline, URLs — se excluyen sin desplazar).
export function findReplaceableMentions(body, peopleIndex) {
  // Rangos bloqueados: no se toca dentro de wikilinks, código ni URLs.
  const blocked = [];
  for (const m of body.matchAll(/```[\s\S]*?```/g)) blocked.push([m.index, m.index + m[0].length]);
  for (const m of body.matchAll(/`[^`\n]*`/g)) blocked.push([m.index, m.index + m[0].length]);
  for (const m of body.matchAll(/\[\[[^\]]*\]\]/g)) blocked.push([m.index, m.index + m[0].length]);
  for (const m of body.matchAll(/https?:\/\/[^\s<>"')\]]+/g)) blocked.push([m.index, m.index + m[0].length]);
  const isBlocked = (start, end) => blocked.some(([s, e]) => start < e && end > s);

  const linkedIds = new Set();
  for (const m of body.matchAll(/\[\[person\/([A-Za-z0-9_.-]+)\]\]/g)) linkedIds.add(m[1]);

  // Normalización sin acentos: los tokens del índice ("maria", "jose") deben
  // compararse contra el body también normalizado, si no los nombres que
  // empiezan con vocal acentuada (José, Álvaro, Óscar, María…) se pierden.
  const bodyLower = stripAccents(body.toLowerCase());
  const bodyWords = new Set(bodyLower.match(/[a-zñ]+/g) ?? []);

  const candidates = [];
  for (const [id, person] of peopleIndex) {
    // Prefiltro barato: el primer token del nombre debe aparecer en el body.
    if (bodyWords.has(stripAccents(person.firstToken).toLowerCase())) {
      candidates.push({ personId: id, phrase: person.nombre, re: person.fullRe, kind: 'full' });
    }
  }
  for (const id of linkedIds) {
    const person = peopleIndex.get(id);
    if (!person) continue;
    for (const sp of person.surnamePhrases) {
      if (bodyLower.includes(stripAccents(sp.firstToken).toLowerCase())) {
        candidates.push({ personId: id, phrase: sp.phrase, re: sp.re, kind: 'surname' });
      }
    }
  }

  const matches = [];
  for (const c of candidates) {
    // Nota: en este entorno RegExp.prototype.matchAll no está disponible;
    // usar String.prototype.matchAll (body.matchAll(re)) es equivalente.
    for (const m of body.matchAll(c.re)) {
      matches.push({
        personId: c.personId,
        phrase: c.phrase,
        kind: c.kind,
        start: m.index,
        end: m.index + c.phrase.length,
      });
    }
  }

  // Guard de ambigüedad: un apellido solo se reemplaza si es único entre las
  // personas ENLAZADAS en el evento (dos Kast vinculados ⇒ "Kast" se omite).
  const surnamePeople = new Map();
  for (const c of candidates) {
    if (c.kind !== 'surname') continue;
    const key = c.phrase.toLowerCase();
    if (!surnamePeople.has(key)) surnamePeople.set(key, new Set());
    surnamePeople.get(key).add(c.personId);
  }

  // Más largos primero (el nombre completo "Eduardo Frei Ruiz-Tagle" gana sobre
  // "Eduardo Frei"), luego por posición.
  matches.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);

  const selected = [];
  const taken = [];
  for (const m of matches) {
    if (m.kind === 'surname') {
      const set = surnamePeople.get(m.phrase.toLowerCase());
      if (!set || set.size > 1) continue;
      // Guard de nombre de pila: si el apellido va precedido por un nombre de
      // pila conocido ("Fernando Matthei", "Evelyn Matthei"), es un nombre
      // completo —de otra persona o de la misma (la cubre el pase de nombre
      // completo, más largo)—, así que el apellido solo se omite.
      const wordBefore = body
        .slice(0, m.start)
        .match(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ-]+\s*$/)?.[0]
        ?.trim();
      if (wordBefore && GIVEN_NAMES.has(stripAccents(wordBefore).toLowerCase())) continue;
      const before = body.slice(Math.max(0, m.start - 24), m.start);
      if (ORG_PREFIX_RE.test(before)) continue;
    }
    if (isBlocked(m.start, m.end)) continue;
    if (taken.some(([s, e]) => m.start < e && m.end > s)) continue;
    taken.push([m.start, m.end]);
    selected.push(m);
  }
  selected.sort((a, b) => a.start - b.start);
  return { mentions: selected, linkedIds };
}

// Carga las personas desde src/content/people/*.md (helper para scripts CLI).
export function loadPeopleIndex() {
  const dir = join(process.cwd(), 'src', 'content', 'people');
  const rec = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const id = f.replace(/\.md$/, '');
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (m) rec[id] = YAML.parse(m[1]);
  }
  if (!Object.keys(rec).length) throw new Error('src/content/people/*.md no encontrado o vacío');
  return buildPeopleIndex(rec);
}

// Recorre los archivos .md de src/content/events (helper para scripts CLI).
export function walkEventFiles() {
  const dir = join(process.cwd(), 'src', 'content', 'events');
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk(dir);
  return out;
}
