#!/usr/bin/env node
/**
 * links-check.mjs — chequeo de enlaces de las fuentes del vault con lychee.
 *
 * `validate.mjs` revisa wikilinks, frontmatter, `medio` y respaldos, pero NO
 * comprueba que las URLs sigan vivas. lychee (https://lychee.cli.rs/) cubre ese
 * hueco: lee las `url:` originales de `src/content/sources/*.md` y clasifica el
 * resultado. Un 403/429 se marca como "revisar a mano" (WAF / rate-limit ya
 * documentados), no como fuente muerta.
 *
 * FRONTERA: el reporte y la lista temporal se escriben DENTRO del repo, en
 * `tmp/research/` (gitignored, transitorios). "Fuera del proyecto" son los
 * servicios online independientes, no directorios del usuario. NUNCA se
 * modifica `src/content/sources/*.md` ni se guarda contenido de las fuentes.
 *
 * Uso:
 *   pnpm run links-check -- --dry-run
 *   pnpm run links-check -- --since 2025-01-01 --limit 200
 *   pnpm run links-check -- --medio elmostrador --include-respaldos
 *   pnpm run links-check -- --self-test
 *
 * Flags:
 *   --since YYYY-MM-DD   Solo fuentes con fecha >= (slice de `fecha:` del frontmatter).
 *   --limit N            Máximo de fuentes a chequear (tandas pequeñas; default: todas).
 *   --medio <texto>      Filtro substring insensible a mayúsculas sobre `medio:`.
 *   --include-respaldos  Incluye también `respaldos[].url` (por default solo la original).
 *   --out <dir>          Subdirectorio dentro de tmp/ (default: tmp/research/links-check).
 *   --dry-run            Cuenta y muestra el comando; sin red ni escrituras.
 *   --self-test          Verifica parseo CRLF y fronteras, sin red.
 *
 * Requisito: lychee (winget install --id lycheeverse.lychee / scoop / brew /
 * cargo binstall lychee). Si no está, el script lo dice y termina con error.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import YAML from 'yaml';
import {
  ROOT,
  TMP_DIR,
  isInsideRoot,
  isInsideTmp,
  assertInsideTmp,
} from '../lib/paths.mjs';

const SOURCES_DIR = join(ROOT, 'src', 'content', 'sources');
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};

const UA = 'GobiernoVault/1.0 (chequeo de fuentes; https://github.com/iipc/awesome-web-archiving)';

/** Lee `url:` (y opcionalmente `respaldos[].url`) con regex tolerante a CRLF. */
function collect({ since, limit, medio, includeRespaldos }) {
  const out = [];
  const seen = new Set();
  for (const file of readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.md')).sort()) {
    const raw = readFileSync(join(SOURCES_DIR, file), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    const fm = YAML.parse(m[1]) || {};
    if (since && String(fm.fecha ?? '').slice(0, 10) < since) continue;
    if (medio && !String(fm.medio ?? '').toLowerCase().includes(medio.toLowerCase())) continue;
    const id = file.replace(/\.md$/, '');
    const candidates = [{ tipo: 'original', url: fm.url }];
    if (includeRespaldos && Array.isArray(fm.respaldos)) {
      for (const r of fm.respaldos) {
        if (r && r.url) candidates.push({ tipo: `respaldo:${r.servicio || '?'}`, url: r.url });
      }
    }
    for (const c of candidates) {
      const url = String(c.url ?? '').trim();
      if (!/^https?:\/\//i.test(url) || seen.has(url)) continue;
      seen.add(url);
      out.push({ id, tipo: c.tipo, url });
    }
  }
  return limit ? out.slice(0, Number(limit)) : out;
}

function findLychee() {
  try {
    const r = spawnSync('lychee', ['--version'], { encoding: 'utf8', timeout: 20000, windowsHide: true });
    return r.status === 0;
  } catch {
    return false;
  }
}

function buildCommand(tmpFile, report) {
  return [
    'lychee',
    '--no-progress',
    '--format', 'json',
    '--output', report,
    '--method', 'head,get',
    '--host-concurrency', '2',
    '--host-request-interval', '500ms',
    '--max-concurrency', '8',
    '--timeout', '20',
    '-u', UA,
    '--default-extension', 'txt',
    tmpFile,
  ];
}

function selfTest() {
  const entries = collect({});
  const stamp = new Date().toISOString().slice(0, 10);
  const report = join(TMP_DIR, 'research', 'links-check', `${stamp}.json`);
  const checks = [];
  checks.push(['lee fuentes con frontmatter CRLF', entries.length > 0]);
  checks.push(['todas las URLs son http(s)', entries.every((e) => /^https?:\/\//i.test(e.url))]);
  checks.push(['sin duplicados', new Set(entries.map((e) => e.url)).size === entries.length]);
  checks.push(['reporte dentro de tmp/', isInsideTmp(report) && isInsideRoot(report)]);
  checks.push(['home del usuario rechazado', !isInsideRoot(join(ROOT, '..', '..', 'archivos', 'x.json'))]);
  checks.push(['lista temporal dentro de tmp/', isInsideTmp(join(TMP_DIR, 'links-check-urls.txt'))]);

  let ok = true;
  for (const [name, pass] of checks) {
    console.log(`${pass ? 'ok  ' : 'FAIL'}  ${name}`);
    if (!pass) ok = false;
  }
  console.log(`Fuentes con URL original: ${entries.length}`);
  console.log(ok ? '\nself-test OK (sin red)' : '\nself-test FALLÓ');
  process.exit(ok ? 0 : 1);
}

if (has('--self-test')) selfTest();

const stamp = new Date().toISOString().slice(0, 10);
const base = val('--out') ? resolve(val('--out')) : join(TMP_DIR, 'research', 'links-check');
const report = join(base, `${stamp}.json`);
const tmpFile = join(TMP_DIR, 'links-check-urls.txt');
try {
  assertInsideTmp(report);
  assertInsideTmp(tmpFile);
} catch (err) {
  console.error(`[links-check] ${err.message}`);
  process.exit(2);
}

const entries = collect({
  since: val('--since'),
  limit: val('--limit'),
  medio: val('--medio'),
  includeRespaldos: has('--include-respaldos'),
});
if (!entries.length) {
  console.error('No hay fuentes que coincidan con los filtros.');
  process.exit(2);
}

if (entries.length > 500 && !has('--limit')) {
  console.warn(`[links-check] ${entries.length} URLs es una tanda grande: usa --limit N, --since o --medio para no saturar los servidores.`);
}

const cmd = buildCommand(tmpFile, report);

if (has('--dry-run')) {
  console.log(`[dry-run] ${entries.length} URLs a chequear (lychee ${findLychee() ? 'encontrado' : 'NO instalado'})`);
  console.log(`[dry-run] comando:\n  ${cmd.join(' ')}`);
  console.log(`[dry-run] reporte (transitorio, dentro del repo): ${report}`);
  console.log(`[dry-run] primeras URLs: ${entries.slice(0, 5).map((e) => e.url).join(', ')}`);
  process.exit(0);
}

if (!findLychee()) {
  console.error('No se encontró lychee. Instalarlo fuera del repo:');
  console.error('  winget install --id lycheeverse.lychee   # Windows');
  console.error('  scoop install lychee / brew install lychee / cargo binstall lychee');
  console.error('No se ejecutó nada ni se escribió ningún archivo.');
  process.exit(2);
}

mkdirSync(dirname(tmpFile), { recursive: true });
mkdirSync(dirname(report), { recursive: true });
writeFileSync(tmpFile, entries.map((e) => e.url).join('\n') + '\n', 'utf8');

let status = 0;
try {
  console.log(`[links-check] ${entries.length} URLs → ${report}`);
  const r = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', timeout: 30 * 60 * 1000, windowsHide: true });
  if (r.stderr) process.stderr.write(r.stderr);
  status = r.status ?? 1;
} finally {
  if (existsSync(tmpFile)) unlinkSync(tmpFile);
}

if (!existsSync(report)) {
  console.error('[links-check] lychee no escribió el reporte; revisar la salida de error arriba.');
  process.exit(status || 1);
}

let rows = [];
try {
  const data = JSON.parse(readFileSync(report, 'utf8'));
  rows = Array.isArray(data)
    ? data
    : Array.isArray(data.results) ? data.results
    : Array.isArray(data.links) ? data.links
    : [];
} catch {
  console.error(`[links-check] no se pudo parsear el JSON de lychee: ${report}`);
  process.exit(1);
}

const byUrl = new Map(entries.map((e) => [e.url, e]));
const groups = { ok: [], revisar: [], muertas: [] };
for (const row of rows) {
  const url = String(row.url || row.uri || row.link || '');
  const code = Number(row.status ?? row.status_code ?? 0);
  const src = byUrl.get(url);
  const label = `${url}${src ? `  [${src.id}]` : ''}`;
  if (code >= 200 && code < 300) groups.ok.push(label);
  else if ([403, 429, 999].includes(code) || code === 0) groups.revisar.push(`${code || 'timeout'}  ${label}`);
  else groups.muertas.push(`${code}  ${label}`);
}

console.log(`\nOK: ${groups.ok.length}  |  revisar a mano (403/429/timeout): ${groups.revisar.length}  |  caídas: ${groups.muertas.length}`);
for (const [name, list] of [['REVISAR', groups.revisar], ['CAÍDAS', groups.muertas]]) {
  if (!list.length) continue;
  console.log(`\n${name} (máx 10):`);
  for (const line of list.slice(0, 10)) console.log(`  ${line}`);
}
console.log(`\nReporte transitorio (dentro del repo): ${report}`);
console.log('403/429 suelen ser WAF o rate-limit documentados: verificar con pnpm run fetch-content antes de dar la fuente por muerta.');
console.log('Ningún cuerpo de fuente se guardó en el repo; solo el reporte y la URL original.');
process.exit(0);
