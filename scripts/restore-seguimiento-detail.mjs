#!/usr/bin/env node
// restore-seguimiento-detail.mjs — restaura el detalle operativo de TAREAS/SEGUIMIENTO/*.md
// desde el monolito original (git show HEAD:TAREAS/SEGUIMIENTO.md), que la migración
// original (migrate-seguimiento.mjs, hoy perdida) truncó a ~120 chars en la columna Título.
//
// Estrategia: cruza cada fila de la tabla (ID estable S/A/V-YYYY-NNN) con su bullet del
// monolito por URL de Origen; fallback por prefijo de título normalizado. Los bullets del
// monolito sin fila se restauran como "sin ID" para no perder datos (reporte al final).
//
// Formato resultante por YYYY.md: tabla corta (parseable con rg) + "## Detalle" con el
// bullet completo por bucket. La tabla no se toca → SEGUIMIENTO_INDEX.md no cambia.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname || '.', '..');
const DIR = join(ROOT, 'TAREAS', 'SEGUIMIENTO');
const ARGS = process.argv.slice(2);
const MONOLITH_ARG = ARGS.find(a => !a.startsWith('--'));
const DRY = ARGS.includes('--dry-run');

const normalize = s => s
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/\*+/g, '')
  .replace(/\.\.\s*$/, '')
  .replace(/\s+/g, ' ')
  .trim();

const normUrl = u => u.replace(/^<|>$/g, '').replace(/[).,]+$/, '').replace(/\/+$/, '').toLowerCase();

// --- monolito ---
const monolith = MONOLITH_ARG
  ? readFileSync(MONOLITH_ARG, 'utf8')
  : execSync('git show HEAD:TAREAS/SEGUIMIENTO.md', { maxBuffer: 1e8 }).toString('utf8');

const bullets = []; // { bucket, sub, text, url }
let bucket = '(sin bucket)';
let sub = null;
for (const raw of monolith.split('\n')) {
  const line = raw.trim();
  if (line.startsWith('## ') && !line.startsWith('### ')) { bucket = line.slice(3).trim(); sub = null; continue; }
  if (line.startsWith('### ')) { sub = line.slice(4).trim(); continue; }
  if (!line.startsWith('- ')) continue;
  const text = line.slice(2).trim();
  const m = text.match(/Origen:?\s*<?(https?:\/\/[^\s>)]+)/i);
  bullets.push({ bucket, sub, text, url: m ? normUrl(m[1]) : null });
}

// --- filas existentes ---
function parseRows(filePath) {
  const rows = [];
  for (const [i, raw] of readFileSync(filePath, 'utf8').split('\n').entries()) {
    const line = raw.trim();
    if (!line.startsWith('|') || line.includes('| ID |') || line.includes('|---')) continue;
    const parts = line.split('|').map(s => s.trim());
    if (parts.length < 8) continue;
    const [, id, estado, fecha, bucketCol, titulo, eventos, origen] = parts;
    if (!/^([SAV])-(\d{4}|TRANS)-(\d{3})$/.test(id)) continue;
    const m = origen.match(/(https?:\/\/[^\s>)]+)/i);
    rows.push({ id, estado, fecha, bucket: bucketCol, titulo, eventos, origen, url: m ? normUrl(m[1]) : null, file: filePath });
  }
  return rows;
}

const files = readdirSync(DIR).filter(f => /^\d{4}\.md$|^TRANSVERSAL\.md$/.test(f));
const allRows = [];
for (const f of files) allRows.push(...parseRows(join(DIR, f)));

// --- matching fila -> bullet ---
const byUrl = new Map();
const bulletUsed = new Set();
for (const b of bullets) if (b.url) { if (!byUrl.has(b.url)) byUrl.set(b.url, []); byUrl.get(b.url).push(b); }

let matchedUrl = 0, matchedTitle = 0;
const unmatchedRows = [];
const detail = new Map(); // row.id -> bullet
for (const r of allRows) {
  let hit = null;
  if (r.url && byUrl.has(r.url)) hit = byUrl.get(r.url).find(b => !bulletUsed.has(b)) || byUrl.get(r.url)[0];
  if (hit) matchedUrl++;
  if (!hit) {
    const prefix = normalize(r.titulo).slice(0, 50);
    if (prefix.length >= 25) {
      hit = bullets.find(b => !bulletUsed.has(b) && normalize(b.text).startsWith(prefix));
      if (hit) matchedTitle++;
    }
  }
  if (hit) { bulletUsed.add(hit); detail.set(r.id, hit); } else unmatchedRows.push(r);
}
const orphanBullets = bullets.filter(b => !bulletUsed.has(b));

// --- matching difuso para lo restante: tokens raros + refs de evento ---
const tok = s => normalize(s).replace(/[^\p{L}\p{N} ]+/gu, ' ').split(' ').filter(w => w.length >= 5);
const freq = new Map();
for (const b of bullets) for (const w of new Set(tok(b.text))) freq.set(w, (freq.get(w) || 0) + 1);
const evRefs = s => new Set((s.match(/\b\d{8}-\d{1,3}\b/g) || []));
const bulletToks = bullets.map(b => new Set(tok(b.text)));
const bulletEvs = bullets.map(b => evRefs(b.text));

const suggestions = []; // {row, bi, score}
unmatchedRows.forEach((r, ri) => {
  const rToks = new Set(tok(r.titulo));
  const rEvs = evRefs(r.eventos + ' ' + r.titulo + ' ' + r.origen);
  bullets.forEach((b, bi) => {
    if (bulletUsed.has(b)) return;
    let shared = 0;
    for (const w of rToks) if (bulletToks[bi].has(w)) shared += 1 / Math.min(freq.get(w) || 1, 8);
    const evBonus = [...rEvs].filter(e => bulletEvs[bi].has(e)).length * 2;
    const score = shared + evBonus;
    if (score > 0) suggestions.push({ row: r, bi, score });
  });
});
suggestions.sort((a, b) => b.score - a.score);
const fuzzy = new Map(); // row.id -> bullet
for (const s of suggestions) {
  if (s.score < 0.5 || fuzzy.has(s.row.id) || bulletUsed.has(bullets[s.bi])) continue;
  fuzzy.set(s.row.id, bullets[s.bi]);
  bulletUsed.add(bullets[s.bi]);
}
let fuzzyN = 0;
for (const [id, b] of fuzzy) {
  detail.set(id, b);
  unmatchedRows.splice(unmatchedRows.findIndex(r => r.id === id), 1);
  fuzzyN++;
  const r = allRows.find(x => x.id === id);
  console.log(`  ~ difuso ${id}: "${r.titulo.slice(0, 45)}" => "${b.text.slice(0, 60)}"`);
}
orphanBullets.length = 0;
orphanBullets.push(...bullets.filter(b => !bulletUsed.has(b)));

// --- reporte ---
console.log(`filas: ${allRows.length} | bullets monolito: ${bullets.length}`);
console.log(`matched por URL: ${matchedUrl} | por titulo: ${matchedTitle} | difuso: ${fuzzyN} | sin match: ${unmatchedRows.length}`);
console.log(`bullets sin fila (se restauran "sin ID"): ${orphanBullets.length}`);
for (const r of unmatchedRows) console.log(`  x fila sin detalle: ${r.id} - ${r.titulo.slice(0, 60)}`);
if (DRY) process.exit(0);

// --- regenerar YYYY.md: tabla intacta + ## Detalle ---
const yearOfBucket = new Map();
for (const r of allRows) if (!yearOfBucket.has(r.bucket)) yearOfBucket.set(r.bucket, r.file);

for (const f of files) {
  const path = join(DIR, f);
  const rows = parseRows(path);
  const year = f.replace('.md', '');
  const idYear = year === 'TRANSVERSAL' ? 'TRANS' : year;
  let md = `# Seguimiento ${year}\n\n`;
  md += `> Cada fila de la tabla es una tarea con ID estable \`S/A/V-${idYear}-NNN\`. El detalle operativo completo está en **## Detalle** (restaurado desde el monolito original; la columna Título es resumen corto).\n`;
  md += `> Para retomar: \`rg "S-${idYear}-042" TAREAS/SEGUIMIENTO_INDEX.md\` y leer la sección Detalle de este archivo.\n\n`;
  md += `| ID | Estado | Fecha | Bucket | Título | Evento(s) | Origen |\n| --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const r of rows) md += `| ${r.id} | ${r.estado} | ${r.fecha} | ${r.bucket} | ${r.titulo} | ${r.eventos} | ${r.origen} |\n`;

  const det = rows.filter(r => detail.has(r.id));
  const noDet = rows.filter(r => !detail.has(r.id));
  const orphansHere = orphanBullets.filter(b => (yearOfBucket.get(b.bucket) || join(DIR, 'TRANSVERSAL.md')) === path);
  if (det.length || orphansHere.length) {
    md += `\n## Detalle\n`;
    const byBucket = new Map();
    const push = (key, item) => { if (!byBucket.has(key)) byBucket.set(key, []); byBucket.get(key).push(item); };
    for (const r of det) {
      const b = detail.get(r.id);
      push(r.bucket, { id: r.id, estado: r.estado, sub: b.sub, text: b.text });
    }
    for (const b of orphansHere) {
      push(b.bucket + (b.sub ? ` - ${b.sub}` : ''), { id: null, estado: '\u2B1C', sub: null, text: b.text });
    }
    for (const [bk, items] of byBucket) {
      md += `\n### ${bk}\n\n`;
      for (const it of items) md += `- **${it.id ?? 'sin ID'}** ${it.estado} - ${it.text.replace(/^[\u2B1C\u{1F7E1}\u2705]+\s*/u, '')}\n`;
    }
  }
  if (noDet.length) {
    md += `\n### Sin detalle recuperado (fila creada tras el último commit del monolito — reconstruir a mano si hace falta)\n\n`;
    for (const r of noDet) md += `- **${r.id}** ${r.estado} - ${r.titulo} | ${r.origen}\n`;
  }
  writeFileSync(path, md, 'utf8');
  console.log(`OK ${f}: ${rows.length} filas, ${det.length} con detalle, ${noDet.length} sin detalle, ${orphansHere.length} huerfanos restaurados`);
}

const report = `# Reporte restore-seguimiento-detail\n\n- Filas: ${allRows.length}; bullets monolito: ${bullets.length}\n- Matched por URL: ${matchedUrl}; por titulo: ${matchedTitle}; sin match: ${unmatchedRows.length}\n- Bullets sin fila restaurados como "sin ID": ${orphanBullets.length}\n\n${unmatchedRows.map(r => `- fila sin detalle: ${r.id}`).join('\n')}\n`;
writeFileSync(join(ROOT, 'TAREAS', 'SEGUIMIENTO', '_restore-report.md'), report, 'utf8');
console.log('OK TAREAS/SEGUIMIENTO/_restore-report.md');
