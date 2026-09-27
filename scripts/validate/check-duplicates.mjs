/**
 * check-duplicates — detector de entidades duplicadas por nombre/alias/ID.
 *
 * Escanea colecciones markdown (`organizations`, `people`, `sources`) y reporta
 * candidatos a duplicado con tres señales:
 *
 *   1. `nombre`    — dos entidades con el MISMO nombre normalizado y mismo `pais`.
 *   2. `alias`     — un `nombre` o `alias` de A es idéntico al de otra entidad B.
 *   3. `id_sigla`  — ID corto (sigla) contenido en otro ID Y con nombre compatible.
 *
 * La normalización (`normName`) quita acentos, puntuación, paréntesis de
 * btw de país/idioma y colapsa espacios, para que "Dirección General de
 * Aeronáutica Civil (DGAC)" y "Dirección General de Aeronáutica Civil" colisionen,
 * mientras que "El País (Chile)" y "El País (España)" NO colisionen (el discriminante
 * `pais` los separa). Sin ese discriminante, el barrido producía ~245 falsos
 * positivos (p. ej. `Radio Agricultura` vs `Ministerio de Agricultura`).
 *
 * Uso:
 *   node scripts/validate/check-duplicates.mjs              # solo organizations
 *   node scripts/validate/check-duplicates.mjs --all         # + people (sources se excluye)
 *   node scripts/validate/check-duplicates.mjs --strict     # solo señales 1 y 2
 *   node scripts/validate/check-duplicates.mjs --json
 *
 * Exit: 0 sin candidatos, 1 con candidatos (apto para CI/pre-commit).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const contentDir = join(process.cwd(), 'src', 'content');

/** Normaliza para comparar: sin acentos, sin paréntesis, sin puntuación, espacios colapsados. */
function normName(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\([^)]*\)/g, ' ')   // quita paréntesis: "(Chile)", "(DGAC)", "(Argentina)"
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function readCollection(name) {
  const dir = join(contentDir, name);
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir).filter(f => f.endsWith('.md'))) {
    const id = f.replace(/\.md$/, '');
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    let data = {};
    try {
      data = YAML.parse(m[1]) ?? {};
    } catch {
      continue; // frontmatter inválido: lo reporta validate.mjs
    }
    // En `sources` NO hay campo `nombre`: la identidad es el ID del artículo
    // (medio-fecha-slug), que el validador de wikilinks ya cubre. Usar `medio`
    // como nombre haría colisionar todos los artículos de un mismo medio, así
    // que la colección se excluye de las señales de nombre/alias.
    const nombre = name === 'sources' ? '' : (data.nombre || '');
    const aliases = (Array.isArray(data.aliases) ? data.aliases : []).filter(Boolean);
    out.push({
      id,
      nombre,
      nombreN: normName(nombre),
      pais: (data.pais || '').toLowerCase().trim(),
      aliases,
      aliasN: aliases.map(a => normName(a)).filter(v => v.length >= 5),
      tipo: data.tipo || '',
    });
  }
  return out;
}

/** Señal 1: mismo nombre normalizado, y `pais` compatible (ambos vacíos, o iguales). */
function findSameName(entries) {
  const byKey = new Map();
  for (const e of entries) {
    if (!e.nombreN || e.nombreN.length < 5) continue;
    if (!byKey.has(e.nombreN)) byKey.set(e.nombreN, []);
    byKey.get(e.nombreN).push(e);
  }
  const out = [];
  for (const [, group] of byKey) {
    // Sub-agrupar por pais: entidades homónimas de países distintos NO son duplicados
    const byPais = new Map();
    for (const e of group) {
      const k = e.pais || '(sin pais)';
      if (!byPais.has(k)) byPais.set(k, []);
      byPais.get(k).push(e);
    }
    for (const [pais, sub] of byPais) {
      if (sub.length < 2) continue;
      out.push({ senal: 'nombre', nombre: sub[0].nombre, pais, ids: sub.map(e => e.id) });
    }
  }
  return out;
}

/** Señal 2: un valor (nombre o alias) de A es idéntico al nombre/alias de B. */
function findAliasCollision(entries) {
  const claims = new Map();
  for (const e of entries) {
    const values = new Set([e.nombreN, ...e.aliasN].filter(v => v.length >= 6));
    for (const v of values) {
      if (!claims.has(v)) claims.set(v, new Map()); // valor -> id -> entidad
      claims.get(v).set(e.id, e);
    }
  }
  const out = [];
  for (const [value, holders] of claims) {
    if (holders.size < 2) continue;
    const list = [...holders.values()];
    // Si comparten nombre normalizado y pais, ya lo cubre la señal 1
    const first = list[0];
    const rest = list.slice(1);
    const soloAlias = rest.filter(e =>
      (e.pais || '(sin pais)') !== (first.pais || '(sin pais)') && !e.aliasN.includes(first.nombreN)
    );
    if (!soloAlias.length && first.nombreN === rest[0]?.nombreN) continue;
    // Reportar si al menos uno de los claimants llega por alias
    const viaAlias = list.filter(e => e.aliasN.includes(value) && e.nombreN !== value);
    if (!viaAlias.length) continue;
    out.push({ senal: 'alias', valor: value, ids: list.map(e => e.id) });
  }
  return out;
}

/** Señal 3: ID corto (sigla) contenido en otro ID + nombres compatibles (uno contiene al otro). */
function findIdSigla(entries) {
  const out = [];
  for (const a of entries) {
    if (a.id.length > 12) continue;
    if (a.aliases.length) continue;            // ya declara alias → no candidata
    if (a.nombreN.length < 4) continue;
    for (const b of entries) {
      if (a.id === b.id) continue;
      if (b.aliases.length) continue;          // b ya Canónico
      if (!b.id.includes(a.id)) continue;
      if (b.id.length - a.id.length < 4) continue;
      // Debe ser la misma clase de entidad: "Argentina" (país) ⊂ "Armada Argentina"
      // (fuerza armada) no es un duplicado, es una subentidad legítima.
      if (a.tipo && b.tipo && a.tipo !== b.tipo) continue;
      // Ni homónimos de país distinto: "El País (Chile)" ⊂ "El País (España)".
      if (a.pais && b.pais && a.pais !== b.pais) continue;
      const aInB = b.nombreN.includes(a.nombreN);
      const bInA = a.nombreN.includes(b.nombreN);
      if (!aInB && !bInA) continue;
      out.push({ senal: 'id_sigla', sigla: a.id, completa: b.id, nombreA: a.nombre, nombreB: b.nombre });
    }
  }
  return out;
}

const argv = process.argv.slice(2);
const jsonMode = argv.includes('--json');
const strict = argv.includes('--strict');
const all = argv.includes('--all');
const colls = all ? ['organizations', 'people', 'sources'] : ['organizations'];

const findings = [];
for (const coll of colls) {
  const entries = readCollection(coll);
  findings.push(...findSameName(entries).map(f => ({ coleccion: coll, ...f })));
  findings.push(...findAliasCollision(entries).map(f => ({ coleccion: coll, ...f })));
  if (!strict) findings.push(...findIdSigla(entries).map(f => ({ coleccion: coll, ...f })));
}

// Deduplicar: si una señal ya está cubierta por otra más fuerte, no repetir
const seen = new Set();
const unique = findings.filter(f => {
  const k = [f.senal, [...(f.ids || []).concat(f.sigla || '', f.completa || '')].sort().join('|')].join('#');
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

if (jsonMode) {
  console.log(JSON.stringify(unique, null, 2));
} else if (!unique.length) {
  console.log(`✓ Sin duplicados: ${colls.join(', ')}`);
} else {
  console.log(`⚠ ${unique.length} candidato(s) a duplicado en ${colls.join(', ')}:`);
  const bySignal = unique.reduce((acc, f) => ((acc[f.senal] ||= []).push(f), acc), {});
  for (const [senal, list] of Object.entries(bySignal)) {
    console.log(`\n[${senal}] ${list.length}`);
    for (const f of list) {
      if (senal === 'nombre') console.log(`  "${f.nombre}" (${f.pais}): ${f.ids.join(' | ')}`);
      else if (senal === 'alias') console.log(`  "${f.valor}" declarado por: ${f.ids.join(' | ')}`);
      else console.log(`  ${f.sigla} ("${f.nombreA}") ⊂ ${f.completa} ("${f.nombreB}")`);
    }
  }
}

process.exit(unique.length ? 1 : 0);
