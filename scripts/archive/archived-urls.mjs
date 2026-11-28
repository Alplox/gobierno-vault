#!/usr/bin/env node
/**
 * archived-urls.mjs — enumera URLs archivadas de un dominio con waymore.
 *
 * waymore (https://github.com/xnl-h4ck3r/waymore) cruza Wayback Machine, Common
 * Crawl, URLScan y GhostArchive para recuperar URLs de un dominio, incluso las
 * que ya no están en su sitemap. Útil para reconstruir artículos borrados y para
 * la auditoría de puntos ciegos.
 *
 * FRONTERA: solo produce una lista de URLs (metadato). Fuerza `-mode U`, así que
 * NUNCA descarga respuestas archivadas. Toda escritura local queda dentro de la
 * raíz del repo, en `tmp/research/` (transitoria). "Fuera del proyecto" son los
 * servicios online independientes que se consultan — no una carpeta del usuario.
 * Para conservar una referencia duradera, registrar la URL en `respaldos[]` de la
 * fuente con `pnpm run archive-sources -- --apply` (Wayback / archive.today).
 *
 * Uso:
 *   pnpm run archived-urls -- elmostrador.cl
 *   pnpm run archived-urls -- camara.cl --from 2024 --to 2026 --limit-requests 500
 *   pnpm run archived-urls -- ladera.cl --keywords 'presupuesto|rendicion' --dry-run
 *   pnpm run archived-urls -- --self-test
 *
 * Flags:
 *   --from YYYY[MM[DD]]     Desde esta fecha (waymore -from).
 *   --to YYYY[MM[DD]]       Hasta esta fecha (waymore -to).
 *   --keywords <regex>      Solo URLs que matcheen (waymore -ko).
 *   --limit-requests N      Tope de requests por fuente (waymore -lr); usar siempre.
 *   --no-subdomains         No incluir subdominios (waymore -n).
 *   --rate-limit-retry N    Minutos a esperar ante 429 de Wayback (waymore -wrlr).
 *   --out <dir>             Subdirectorio dentro de tmp/ (default: tmp/research/waymore/<dominio>).
 *   --dry-run               Imprime el comando; no crea archivos ni hace red.
 *   --self-test             Verifica argumentos y fronteras, sin red.
 *
 * Requisito: waymore (pipx install git+https://github.com/xnl-h4ck3r/waymore.git).
 * Si no está, el script lo dice y termina con error: no finge éxito.
 * Por default se excluyen VirusTotal e IntelligenceX (API key de pago/academia).
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  ROOT,
  TMP_DIR,
  isInsideRoot,
  isInsideTmp,
  assertInsideTmp,
} from '../lib/paths.mjs';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};

const VALUE_FLAGS = new Set(['--from', '--to', '--keywords', '--limit-requests', '--rate-limit-retry', '--out']);

function domainArg() {
  const positional = args.filter((a, i) => !a.startsWith('--') && (i === 0 || args[i - 1] !== '--out' && !VALUE_FLAGS.has(args[i - 1])));
  return positional.find((a) => /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(a)) || null;
}

function findWaymore() {
  for (const [cmd, prefix] of [['waymore', []], ['python', ['-m', 'waymore']]]) {
    try {
      const r = spawnSync(cmd, [...prefix, '--version'], { encoding: 'utf8', timeout: 20000, windowsHide: true });
      if (r.status === 0) return { cmd, prefix };
    } catch {
      // siguiente candidato
    }
  }
  return null;
}

function buildCommand(domain, outFile, opts) {
  const found = opts.found || null;
  const cmd = [...(found ? [...found.prefix] : ['waymore']), '-i', domain, '-mode', 'U', '-oU', outFile];
  if (opts.from) cmd.push('-from', opts.from);
  if (opts.to) cmd.push('-to', opts.to);
  if (opts.keywords) cmd.push('-ko', opts.keywords);
  if (opts.limitRequests) cmd.push('-lr', String(opts.limitRequests));
  if (opts.noSubdomains) cmd.push('-n');
  if (opts.rateLimitRetry) cmd.push('-wrlr', String(opts.rateLimitRetry));
  cmd.push('-xvt', '-xix'); // credenciales de pago/academia fuera
  return cmd;
}

function selfTest() {
  const checks = [];
  const safe = 'ejemplo.cl';
  const stamp = new Date().toISOString().slice(0, 10);
  const defaultOut = join(TMP_DIR, 'research', 'waymore', safe, `urls-${stamp}.txt`);
  checks.push(['salida default dentro de tmp/', isInsideTmp(defaultOut) && isInsideRoot(defaultOut)]);
  checks.push(['home del usuario rechazado', !isInsideRoot(join(ROOT, '..', '..', 'archivos', 'x.txt'))]);
  let rejected = false;
  try {
    assertInsideTmp(join(ROOT, 'src', 'content', 'x.txt'));
  } catch {
    rejected = true;
  }
  checks.push(['rechaza escribir en src/', rejected]);
  const cmd = buildCommand(safe, defaultOut, { from: '2020', limitRequests: 500, keywords: 'presupuesto' });
  const modeIndex = cmd.indexOf('-mode');
  checks.push(['fuerza -mode U (sin respuestas)', modeIndex >= 0 && cmd[modeIndex + 1] === 'U']);
  checks.push(['sin -oR (no descarga cuerpos)', !cmd.includes('-oR')]);
  checks.push(['excluye APIs de pago', cmd.includes('-xvt') && cmd.includes('-xix')]);
  checks.push(['pasa rango y tope', cmd.includes('2020') && cmd.includes('-lr') && cmd.includes('500')]);

  let ok = true;
  for (const [name, pass] of checks) {
    console.log(`${pass ? 'ok  ' : 'FAIL'}  ${name}`);
    if (!pass) ok = false;
  }
  console.log(ok ? '\nself-test OK (sin red)' : '\nself-test FALLÓ');
  process.exit(ok ? 0 : 1);
}

if (has('--self-test')) selfTest();

const domain = domainArg();
if (!domain) {
  console.error('Uso: pnpm run archived-urls -- <dominio> [--from YYYY] [--to YYYY] [--limit-requests N] [--dry-run] [--out <dir>]');
  process.exit(2);
}

const safe = domain.replace(/[^a-zA-Z0-9.-]/g, '_');
const stamp = new Date().toISOString().slice(0, 10);
const base = val('--out') ? resolve(val('--out')) : join(TMP_DIR, 'research', 'waymore', safe);
const outFile = join(base, `urls-${stamp}.txt`);
try {
  assertInsideTmp(outFile);
} catch (err) {
  console.error(`[archived-urls] ${err.message}`);
  process.exit(2);
}

const opts = {
  from: val('--from'),
  to: val('--to'),
  keywords: val('--keywords'),
  limitRequests: val('--limit-requests'),
  rateLimitRetry: val('--rate-limit-retry'),
  noSubdomains: has('--no-subdomains'),
};

if (!opts.limitRequests) {
  console.warn('[archived-urls] sin --limit-requests waymore no pone tope por fuente; usa -lr N (ej. 500) para no agotar las APIs.');
}

const found = findWaymore();
const cmd = buildCommand(domain, outFile, { ...opts, found });

if (has('--dry-run')) {
  console.log(`[dry-run] waymore ${found ? 'encontrado' : 'NO (instalar con pipx)'}`);
  console.log(`[dry-run] comando:\n  ${cmd.join(' ')}`);
  console.log(`[dry-run] salida (transitoria, dentro del repo): ${outFile}`);
  console.log('[dry-run] modo U: solo URLs, sin descarga de respuestas ni escrituras en src/.');
  process.exit(0);
}

if (!found) {
  console.error('No se encontró waymore. Instalarlo fuera del repo:');
  console.error('  pipx install git+https://github.com/xnl-h4ck3r/waymore.git');
  console.error('  (alternativa: python -m pip install --user waymore)');
  console.error('No se ejecutó nada ni se escribió ningún archivo.');
  process.exit(2);
}

mkdirSync(dirname(outFile), { recursive: true });
console.log(`[archived-urls] ${cmd.join(' ')}`);
const r = spawnSync(found.cmd, cmd.slice(1), { encoding: 'utf8', timeout: 30 * 60 * 1000, windowsHide: true });
if (r.stderr) process.stderr.write(r.stderr);
if (r.status !== 0) {
  console.error(`[archived-urls] waymore terminó con código ${r.status}; revisar salida arriba.`);
  process.exit(r.status || 1);
}

const urls = readFileSync(outFile, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
console.log(`[archived-urls] ${new Set(urls).size} URLs únicas (${urls.length} líneas) → ${outFile}`);
console.log('[archived-urls] Solo metadato local y transitorio. Las copias duraderas son los servicios online; regístralas en respaldos[] con pnpm run archive-sources -- --apply.');
