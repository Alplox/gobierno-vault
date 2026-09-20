// Elimina texto en prosa que repite el nombre que ya renderiza
// [[organizations/id]] (regla event-rules n.º 8: sin duplicar lo que el
// wikilink ya muestra). Solo organizaciones; people se rige por proseNames.
//
// Casos (todos conservan el texto previo al nombre duplicado):
//   A. "Nombre Completo ([[organizations/id]])"  -> "[[organizations/id]]"
//   B. "Nombre Completo [[organizations/id]]"    -> "[[organizations/id]]"
//      (incluye cabeza parcial: "Dirección Nacional del [[.../servicio_civil]]"
//      -> "[[.../servicio_civil]]", que renderiza el nombre completo)
//   C. "[[organizations/id]] de X" donde "de X" es cola del nombre
//      (ej. "[[.../carabineros]] de Chile")      -> "[[organizations/id]]"
//   D. "El|La [[organizations/id]]" donde el nombre parte con ese artículo
//      (ej. "El [[.../elciudadano]]")            -> "[[organizations/id]]"
//   E. "[[organizations/id]] (SIGLA)" donde el nombre ya termina en "(SIGLA)"
//      (ej. "[[.../american_jewish_committee]] (AJC)") -> "[[organizations/id]]"
//
// NOTA: la repetición encabezado→cuerpo ("## ... de [[org/X]]" seguido de
// "[[org/X]] detalló...") es estilo legítimo y NO se toca: cada mención vive
// en su propia oración.
//
// Uso:
//   node scripts/validate/fix-redundant-wikilinks.mjs --dry-run  # solo reporta
//   node scripts/validate/fix-redundant-wikilinks.mjs            # aplica
//
// Comparación insensible a mayúsculas/acentos y con límites de palabra, así
// que "del [[organizations/ministerio_interior]]" o "ministro del
// [[organizations/ministerio_justicia]]" NO se tocan (preposición/cargo + nombre
// completo es gramática correcta, no duplicación).

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

const norm = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Nombre sin la sigla parentética final ("... (AJC)" -> "...") para comparar.
const baseName = (nombre) => norm(nombre.replace(/\s*\([^)]*\)\s*$/, ''));

function loadOrgs() {
  const dir = join(process.cwd(), 'src', 'content', 'organizations');
  const rec = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const id = f.replace(/\.md$/, '');
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (m) rec[id] = YAML.parse(m[1])?.nombre ?? id;
  }
  if (!Object.keys(rec).length) throw new Error('src/content/organizations/*.md no encontrado o vacío');
  return rec;
}

function walkEventFiles() {
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

// Palabras alfanuméricas con sus spans [start, end) sobre el texto dado.
function wordsWithSpans(text) {
  const out = [];
  const re = /[A-Za-z0-9ñÑáéíóúüÁÉÍÓÚÜ]+/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push({ w: norm(m[0]), start: m.index, end: m.index + m[0].length });
  return out;
}

const ORG_RE = /\[\[(?:organizations|org)\/([A-Za-z0-9_.-]+)\]\]/g;

function fixBody(body, orgs, report) {
  // Recolectar matches primero; se aplican de atrás hacia adelante.
  const matches = [];
  let m;
  ORG_RE.lastIndex = 0;
  while ((m = ORG_RE.exec(body)) !== null) matches.push({ id: m[1], start: m.index, end: m.index + m[0].length, markup: m[0] });

  const edits = []; // {start, end, replacement, rule}
  const taken = []; // rangos ya reclamados (para no solapar)
  const overlaps = (s, e) => taken.some(([a, b]) => s < b && e > a);
  const claim = (s, e) => taken.push([s, e]);

  for (let i = matches.length - 1; i >= 0; i--) {
    const { id, start, end, markup } = matches[i];
    const nombre = orgs[id];
    if (!nombre) continue;
    const base = baseName(nombre);
    const baseWords = base.split(' ').filter(Boolean);
    if (!baseWords.length) continue;

    const after = body.slice(end, end + 80);

    // Regla E: "[[org]] (SIGLA)" donde el nombre ya termina en "(SIGLA)".
    const parenAfter = after.match(/^[ \t]*\(([^)\n]{1,15})\)/);
    if (parenAfter) {
      const tailParen = nombre.match(/\(\s*([^)]*?)\s*\)\s*$/);
      if (tailParen && norm(tailParen[1]) === norm(parenAfter[1]) && !overlaps(end, end + parenAfter[0].length)) {
        edits.push({ start: end, end: end + parenAfter[0].length, replacement: '', rule: 'E', detail: `${markup} ${parenAfter[0].trim()} (sigla ya en nombre)` });
        claim(end, end + parenAfter[0].length);
      }
    }

    // Regla C: "[[org]] de X" donde "de X" es cola del nombre. Se prueba de
    // más largo a más corto para no tragarse la frase siguiente
    // ("de Punta Arenas para..." -> solo "de Punta Arenas").
    const sufM = after.match(/^[ \t]+((?:de\s+la|de\s+los|de\s+las|del|de)\s+[A-Za-zñÑáéíóúü][A-Za-zñÑáéíóúü-]*(?:\s+[A-Za-zñÑáéíóúü][A-Za-zñÑáéíóúü-]*){0,2})/);
    if (sufM) {
      const sufStart = end + (sufM[0].indexOf(sufM[1]));
      const sufSpans = wordsWithSpans(sufM[1]);
      for (let len = sufSpans.length; len >= 2; len--) {
        const candNorm = sufSpans.slice(0, len).map((w) => w.w).join(' ');
        if (norm(nombre) === candNorm || norm(nombre).endsWith(' ' + candNorm)) {
          const removeEnd = sufStart + sufSpans[len - 1].end;
          if (!overlaps(end, removeEnd)) {
            edits.push({ start: end, end: removeEnd, replacement: '', rule: 'C', detail: `${markup} "${body.slice(end, removeEnd)}" (cola de "${nombre}")` });
            claim(end, removeEnd);
          }
          break;
        }
      }
    }

    // Reglas A/B/D: texto previo que repite el nombre (total o cabeza).
    // Si lo previo es otro wikilink (termina en "]]"), no tocar.
    const preWindow = body.slice(Math.max(0, start - 160), start);
    if (/]]\s*$/.test(preWindow)) continue;
    // Regla A: paréntesis de apertura justo antes del wikilink.
    const openParen = preWindow.match(/\(\s*$/);
    const preForName = openParen ? preWindow.slice(0, openParen.index) : preWindow;
    const words = wordsWithSpans(preForName);
    if (!words.length) continue;
    const tailWords = words.map((w) => w.w);

    // Candidatos: nombre completo al final del pre (A/B) o cabeza del nombre (B).
    let cutStart = -1;
    let cutEnd = preForName.length;
    // 1) El pre termina con el nombre base completo.
    if ((' ' + tailWords.join(' ')).endsWith(' ' + baseWords.join(' '))) {
      cutStart = words[words.length - baseWords.length].start;
    } else {
      // 2) Las últimas k palabras del pre son las primeras k del nombre (k>=2,
      //    o k==1 solo para artículo inicial El/La/Los/Las).
      const maxK = Math.min(tailWords.length, baseWords.length);
      for (let k = maxK; k >= 1; k--) {
        const tailK = tailWords.slice(-k).join(' ');
        const headK = baseWords.slice(0, k).join(' ');
        if (tailK !== headK) continue;
        if (k === 1 && !/^(el|la|los|las)$/.test(tailK) && tailK.length < 5) continue;
        if (k === 1 && !/^(el|la|los|las)$/.test(baseWords[0])) {
          // k==1 no-artículo: solo si el pre ES el nombre de una palabra
          // (ej. "Evópoli [[.../evopoli]]").
          if (tailWords.length !== 1 || baseWords.length !== 1) continue;
        }
        cutStart = words[words.length - k].start;
        break;
      }
    }
    if (cutStart < 0) continue;

    // Expandir a comillas/cursivas que envuelvan el nombre ("Nombre", *Nombre*).
    // El reemplazo es SOLO el wikilink: el texto previo a editStart se conserva
    // tal cual en el output (incluirlo aquí lo duplicaría).
    let spanStart = cutStart;
    const spanEnd = cutEnd;
    const beforeChar = preForName[spanStart - 1];
    const afterTrimmed = preForName.slice(spanEnd).trim();
    if ((beforeChar === '"' || beforeChar === '*' || beforeChar === '_' || beforeChar === '“') && afterTrimmed === '') {
      spanStart -= 1;
    }
    // Extender a la izquierda sobre aperturas huérfanas pegadas ("**Nombre",
    // '"Nombre') para no dejar "*" o '"' sueltos.
    let editStart = start - preWindow.length + spanStart;
    while (editStart > 0 && (body[editStart - 1] === '*' || body[editStart - 1] === '_' || body[editStart - 1] === '"' || body[editStart - 1] === '“')) {
      const prev2 = editStart - 2 >= 0 ? body[editStart - 2] : '\n';
      if (/[\s([>\-]/.test(prev2)) editStart -= 1;
      else break;
    }

    if (openParen) {
      // Regla A: quitar también "(...)" que envuelve el wikilink.
      const closeParen = after.match(/^[ \t]*\)/);
      const editEnd = closeParen ? end + closeParen[0].length : end;
      if (!overlaps(editStart, editEnd)) {
        edits.push({
          start: editStart,
          end: editEnd,
          replacement: markup,
          rule: 'A',
          detail: `"${body.slice(editStart, start).trim().slice(-60)}" + ${markup}`,
        });
        claim(editStart, editEnd);
      }
    } else {
      // Regla B/D: quitar el nombre previo pegado al wikilink (el gap puede
      // incluir el salto de línea del patrón "Nombre\n\n[[org]]").
      const removedPre = preForName.slice(spanStart).replace(/^["*“_]+|["*”_]+$/g, '').trim();
      const rule = /^(el|la|los|las)$/i.test(removedPre) ? 'D' : 'B';
      if (!overlaps(editStart, end)) {
        edits.push({
          start: editStart,
          end,
          replacement: markup,
          rule,
          detail: `"${body.slice(editStart, start).replace(/\n/g, ' ').trim().slice(-60)}" + ${markup}`,
        });
        claim(editStart, end);
      }
    }
  }

  // Aplicar de atrás hacia adelante.
  edits.sort((a, b) => b.start - a.start);
  let out = body;
  for (const e of edits) {
    out = out.slice(0, e.start) + e.replacement + out.slice(e.end);
    if (report) report.push(`[${e.rule}] ${e.detail}`);
  }
  return { out, count: edits.length };
}

const orgs = loadOrgs();
const files = walkEventFiles();

let changedFiles = 0;
let totalEdits = 0;
for (const file of files) {
  const content = readFileSync(file, 'utf8');
  const fmMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!fmMatch) continue;
  const bodyStart = fmMatch[0].length;
  const body = content.slice(bodyStart);
  const report = [];
  const { out, count } = fixBody(body, orgs, dryRun ? report : null);
  if (count > 0) {
    changedFiles++;
    totalEdits += count;
    if (dryRun) {
      console.log(`${file}: ${count} edición(es)`);
      for (const r of report.slice(0, 6)) console.log(`   ${r}`);
      if (report.length > 6) console.log(`   … +${report.length - 6} más`);
    } else {
      writeFileSync(file, content.slice(0, bodyStart) + out, 'utf8');
    }
  }
}

console.log(`${dryRun ? '[dry-run] ' : ''}${changedFiles} archivo(s), ${totalEdits} edición(es)`);
