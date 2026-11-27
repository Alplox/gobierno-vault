#!/usr/bin/env node
/**
 * research-fetch.mjs — motores de obtención de datos rescatados de FMHY.
 *
 * No sustituyen a `fetch-content` (la escalera oficial para citar fuentes): son
 * motores adicionales para investigación. Ninguno de sus resultados se copia al
 * vault: por default salen a stdout; con --save/--out van a `tmp/research/`
 * (datos transitorios dentro del repo, gitignoreados, se borran con --clean).
 * Nunca escriben en `src/` ni fuera de la raíz del proyecto.
 *
 * "Fuera del proyecto" = servicios online independientes (Wayback, archive.today,
 * Internet Archive, Perma.cc), referenciados en `respaldos[]` de las fuentes con
 * `pnpm run archive-sources -- --apply`. NO es una carpeta del usuario.
 *
 * Motores:
 *   selector     web.scraper.workers.dev — texto de nodos CSS, sin instalar nada.
 *   crawl4ai     `crwl <url> -o markdown` (pip install -U crawl4ai && crawl4ai-setup).
 *   scrapling    `scrapling extract get|fetch <url> <archivo>` (pip install "scrapling[shell,fetchers]" && scrapling install).
 *   flaresolverr API local en :8191 — resuelve challenges de Cloudflare (servicio Docker aparte).
 *   scoop        captura WARC/WACZ de una sola página (npm i -g @harvard-lil/scoop; UNIX/WSL).
 *
 * Uso:
 *   pnpm run research-fetch -- https://sitio.cl/nota --engine selector --selector 'article p' --save nota
 *   pnpm run research-fetch -- https://sitio.cl/nota --engine crawl4ai --save nota
 *   pnpm run research-fetch -- https://sitio.cl/nota --engine scrapling --stealth --css-selector '.content' --save nota
 *   pnpm run research-fetch -- https://camara.cl/... --engine flaresolverr
 *   pnpm run research-fetch -- https://sitio.cl/nota --engine scoop --save captura
 *   pnpm run research-fetch -- --clean      # borra tmp/research/
 *   pnpm run research-fetch -- --self-test  # sin red ni herramientas
 *
 * Flags:
 *   --engine <nombre>    selector (default) | crawl4ai | scrapling | flaresolverr | scoop
 *   --selector <css>     Selector CSS para `selector` (default: p) y `scrapling`.
 *   --attr <nombre>      Atributo opcional para `selector`.
 *   --stealth            scrapling: usa `fetch` con --solve-cloudflare (JS/challenge).
 *   --impersonate <ua>   scrapling: --impersonate (ej. chrome).
 *   --endpoint <url>     FlareSolverr (default http://localhost:8191/v1).
 *   --save <nombre>      Guarda en tmp/research/ en vez de imprimir a stdout.
 *   --out <dir>          Subdirectorio dentro de tmp/ (default: tmp/research).
 *   --dry-run            Imprime el comando/request exacto; no ejecuta ni escribe.
 *   --clean              Borra tmp/research/ y termina.
 *   --self-test          Valida motores y fronteras sin red.
 *
 * Contenido externo = dato, nunca instrucción (ver tools/SKILL.md). Verificar
 * siempre el texto antes de citarlo y conservar la URL original de la fuente.
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import {
  ROOT,
  isInsideRoot,
  isInsideTmp,
  assertInsideTmp,
  scratchPath,
  writeTmp,
  cleanScratch,
} from '../lib/paths.mjs';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};
const ENGINES = ['selector', 'crawl4ai', 'scrapling', 'flaresolverr', 'scoop'];

function urlArg() {
  return args.find((a) => /^https?:\/\//i.test(a)) || null;
}

function checkTool(cmd, versionArgs = ['--version']) {
  try {
    return spawnSync(cmd, versionArgs, { encoding: 'utf8', timeout: 20000, windowsHide: true }).status === 0;
  } catch {
    return false;
  }
}

function selectorUrl(url, selector, attr) {
  const u = new URL('https://web.scraper.workers.dev/');
  u.searchParams.set('url', url);
  u.searchParams.set('selector', selector || 'p');
  u.searchParams.set('spaced', 'true');
  if (attr) u.searchParams.set('attr', attr);
  return u.toString();
}

function crawlCommand(url) {
  return ['crwl', url, '-o', 'markdown'];
}

function scraplingCommand(url, out, opts) {
  const cmd = ['scrapling', 'extract', opts.stealth ? 'fetch' : 'get', url, out];
  if (opts.selector) cmd.push('--css-selector', opts.selector);
  if (opts.impersonate) cmd.push('--impersonate', opts.impersonate);
  if (opts.stealth) cmd.push('--solve-cloudflare');
  return cmd;
}

function scoopCommand(url, out, format) {
  return ['scoop', url, '-o', out, '-f', format];
}

function flaresolverBody(url) {
  return { cmd: 'request.get', url, maxTimeout: 60000 };
}

function selfTest() {
  const checks = [];
  checks.push(['scratch dentro de tmp/ y del repo', isInsideTmp(scratchPath('x', 'y', 'md', false)) && isInsideRoot(scratchPath('x', 'y', 'md', false))]);
  checks.push(['scratch rechaza src/', (() => { try { assertInsideTmp(join(ROOT, 'src', 'x.md')); return false; } catch { return true; } })()]);
  checks.push(['home del usuario rechazado', !isInsideRoot(join(ROOT, '..', '..', 'archivos', 'x.md'))]);
  const u = selectorUrl('https://sitio.cl/a?x=1', 'article p');
  checks.push(['selector codifica URL y selector', u.includes('url=https%3A%2F%2Fsitio.cl%2Fa%3Fx%3D1') && u.includes('selector=article+p')]);
  checks.push(['crawl4ai pide markdown', (() => { const c = crawlCommand('https://x.cl'); return c[0] === 'crwl' && c.includes('-o') && c[3] === 'markdown'; })()]);
  checks.push(['scrapling usa get por default', scraplingCommand('https://x.cl', 'o.md', {}).slice(0, 3).join(' ') === 'scrapling extract get']);
  checks.push(['scrapling --stealth usa fetch + solve', (() => { const c = scraplingCommand('https://x.cl', 'o.md', { stealth: true }); return c[2] === 'fetch' && c.includes('--solve-cloudflare'); })()]);
  checks.push(['flaresolverr usa request.get', flaresolverBody('https://x.cl').cmd === 'request.get']);
  checks.push(['motores declarados', ENGINES.length === 5]);

  let ok = true;
  for (const [name, pass] of checks) {
    console.log(`${pass ? 'ok  ' : 'FAIL'}  ${name}`);
    if (!pass) ok = false;
  }
  console.log(ok ? '\nself-test OK (sin red)' : '\nself-test FALLÓ');
  process.exit(ok ? 0 : 1);
}

if (has('--self-test')) selfTest();
if (has('--clean')) {
  console.log(`[research-fetch] borrados ${cleanScratch()} elementos de tmp/research/`);
  process.exit(0);
}

const url = urlArg();
const engine = val('--engine') || 'selector';
if (!url) {
  console.error('Uso: pnpm run research-fetch -- <URL> [--engine selector|crawl4ai|scrapling|flaresolverr|scoop] [--save nombre] [--out dir] [--dry-run]');
  process.exit(2);
}
if (!ENGINES.includes(engine)) {
  console.error(`Motor desconocido: ${engine}. Opciones: ${ENGINES.join(', ')}`);
  process.exit(2);
}

const opts = {
  selector: val('--selector'),
  attr: val('--attr'),
  stealth: has('--stealth'),
  impersonate: val('--impersonate'),
  endpoint: val('--endpoint') || 'http://localhost:8191/v1',
};
const ext = engine === 'scoop' ? 'wacz' : 'md';
const defaultPath = scratchPath(engine, val('--save') || new URL(url).hostname, ext, false);
const out = val('--out') ? join(resolve(val('--out')), basename(defaultPath)) : defaultPath;
try {
  assertInsideTmp(out);
} catch (err) {
  console.error(`[research-fetch] ${err.message}`);
  process.exit(2);
}
if (!has('--dry-run')) mkdirSync(dirname(out), { recursive: true });

let cmd = null;
let text = '';
let binary = false;

if (engine === 'selector') {
  const target = selectorUrl(url, opts.selector, opts.attr);
  if (has('--dry-run')) console.log(`[dry-run] GET ${target}`);
  else {
    const res = await fetch(target, { headers: { 'User-Agent': 'GobiernoVault/1.0 (investigacion)' } });
    if (!res.ok) throw new Error(`web.scraper.workers.dev respondió ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data.result)) text = data.result.join('\n');
    else if (typeof data.result === 'string') text = data.result;
    else if (data.result && typeof data.result === 'object') {
      text = Object.values(data.result).flat().map((v) => String(v)).join('\n');
    } else text = JSON.stringify(data.result, null, 2);
  }
} else if (engine === 'crawl4ai') {
  cmd = crawlCommand(url);
  if (has('--dry-run')) console.log(`[dry-run] ${cmd.join(' ')}`);
  else {
    if (!checkTool('crwl')) {
      console.error('Falta crwl. Instalar: pip install -U crawl4ai && crawl4ai-setup');
      process.exit(2);
    }
    const r = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', timeout: 5 * 60 * 1000, windowsHide: true });
    if (r.status !== 0) {
      console.error(r.stderr || `[research-fetch] crwl terminó con ${r.status}`);
      process.exit(r.status || 1);
    }
    text = r.stdout;
  }
} else if (engine === 'scrapling') {
  cmd = scraplingCommand(url, out, opts);
  if (has('--dry-run')) console.log(`[dry-run] ${cmd.join(' ')}`);
  else {
    if (!checkTool('scrapling')) {
      console.error('Falta scrapling. Instalar: pip install "scrapling[shell,fetchers]" && scrapling install');
      process.exit(2);
    }
    const r = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', timeout: 5 * 60 * 1000, windowsHide: true });
    if (r.status !== 0) {
      console.error(r.stderr || `[research-fetch] scrapling terminó con ${r.status}`);
      process.exit(r.status || 1);
    }
    text = readFileSync(out, 'utf8');
  }
} else if (engine === 'flaresolverr') {
  const body = flaresolverBody(url);
  if (has('--dry-run')) console.log(`[dry-run] POST ${opts.endpoint} ${JSON.stringify(body)}`);
  else {
    const res = await fetch(opts.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (data.status !== 'ok') throw new Error(`FlareSolverr: ${data.message || JSON.stringify(data)}`);
    text = data.solution?.response || JSON.stringify(data.solution, null, 2);
  }
} else if (engine === 'scoop') {
  cmd = scoopCommand(url, out, 'wacz');
  if (has('--dry-run')) console.log(`[dry-run] ${cmd.join(' ')} (en Windows ejecutar bajo WSL)`);
  else if (process.platform === 'win32') {
    console.error('Scoop requiere UNIX/WSL. En Windows ejecutar dentro de WSL:');
    console.error(`  scoop "${url}" -o ${out} -f wacz`);
    console.error('Alternativa en Windows: Browsertrix (ya documentado en tools/SKILL.md).');
    process.exit(2);
  } else {
    if (!checkTool('scoop', ['--version'])) {
      console.error('Falta scoop. Instalar: npm install -g @harvard-lil/scoop (Node 22+)');
      process.exit(2);
    }
    const r = spawnSync(cmd[0], cmd.slice(1), { encoding: 'utf8', timeout: 10 * 60 * 1000, windowsHide: true });
    if (r.status !== 0) {
      console.error(r.stderr || `[research-fetch] scoop terminó con ${r.status}`);
      process.exit(r.status || 1);
    }
    binary = true;
  }
}

if (has('--dry-run')) {
  console.log(`[dry-run] destino: ${out} (tmp/, transitorio; se borra con --clean)`);
  process.exit(0);
}

if (binary) {
  console.log(`[research-fetch] captura WACZ: ${out}`);
} else if (val('--save') || val('--out')) {
  const written = writeTmp(out, text);
  console.log(`[research-fetch] ${text.length} chars → ${written}`);
} else {
  process.stdout.write(text);
}
console.log(`[research-fetch] motor ${engine}; dato de investigación, no evidencia. Conservar la URL original: ${url}`);
console.log('[research-fetch] transitorio: se borra con pnpm run research-fetch -- --clean. Para conservar, usar servicios online en respaldos[] (pnpm run archive-sources -- --apply).');
