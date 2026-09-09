#!/usr/bin/env node
/**
 * validate-sources.mjs — audita que las URLs de src/content/sources/*.md existan.
 *
 * validate.mjs solo verifica que el archivo exista y el `medio` sea válido;
 * una URL inventada o muerta pasa el build sin reclamo (caso 20260902-7,
 * sep-2026: 3 URLs 404 creadas por un agente). Este script hace el chequeo
 * con red que el build no puede permitirse (5218 fuentes × request).
 *
 * Uso:
 *   pnpm run validate-sources                  # fuentes con fecha >= hace 30 días
 *   pnpm run validate-sources -- --since 2026-09-01
 *   pnpm run validate-sources -- --all          # todas (lento: ~1h)
 *   pnpm run validate-sources -- --medio biobio --since 2026-08-01
 *   pnpm run validate-sources -- --limit 20     # corta tras N chequeos
 *   pnpm run validate-sources -- --strict       # timeouts/errores también fallan
 *
 * Clasificación: OK (200) | WAF 403 (aceptado: bot-block, no veredicto —
 * caso Ex-Ante) | DEAD (404/410) | FAIL (otro 4xx/5xx) | ERROR (timeout/red).
 * Exit 1 si hay DEAD o FAIL (con --strict, también si hay ERROR).
 * Aviso (no bloqueante): `fecha` del frontmatter distinta de la fecha
 * embebida en la URL (/YYYY/MM/DD/), típico de copy-paste.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const args = process.argv.slice(2);
const flagVal = (name) => {
  const i = args.indexOf(name);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};
const all = args.includes('--all');
const strict = args.includes('--strict');
const limit = parseInt(flagVal('--limit') || '0', 10);
const medioFilter = (flagVal('--medio') || '').toLowerCase();
const sinceArg = flagVal('--since');
const since = sinceArg || new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (GobiernoVault/1.0)';
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function splitFm(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try { return YAML.parse(m[1]); } catch { return null; }
}

const dir = join(process.cwd(), 'src', 'content', 'sources');
const files = readdirSync(dir).filter((f) => f.endsWith('.md'));
const queue = [];
for (const f of files) {
  const fm = splitFm(readFileSync(join(dir, f), 'utf8'));
  if (!fm?.url || typeof fm.url !== 'string' || !/^https?:\/\//.test(fm.url)) {
    console.log(`SKIP      ${f} (sin URL válida)`);
    continue;
  }
  const id = f.replace(/\.md$/, '');
  if (medioFilter && !`${fm.medio ?? ''} ${id}`.toLowerCase().includes(medioFilter)) continue;
  if (!all && String(fm.fecha ?? '') < since) continue;
  queue.push({ id, url: fm.url.trim(), fecha: String(fm.fecha ?? ''), medio: fm.medio ?? '' });
  if (limit && queue.length >= limit) break;
}

console.log(`\nChequeando ${queue.length} fuente(s)${all ? ' (todas)' : ` (fecha >= ${since})`}...\n`);

let ok = 0, waf = 0, dead = 0, fail = 0, err = 0;
const problems = [];
for (const { id, url, fecha, medio } of queue) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12000);
  const start = Date.now();
  const attempt = async () => fetch(url, {
    signal: ctrl.signal,
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  });
  try {
    let res = await attempt();
    clearTimeout(t);
    const ms = Date.now() - start;
    const moved = res.url !== url ? ` -> ${res.url}` : '';
    if (res.status === 200) {
      ok++;
      console.log(`OK        ${url} (${ms}ms)${moved}`);
    } else if (res.status === 403) {
      waf++;
      console.log(`WAF/403   ${url} (${ms}ms) — bot-block, no veredicto${moved}`);
    } else if (res.status === 404 || res.status === 410) {
      dead++;
      problems.push(`DEAD ${res.status} ${id} [${medio}] ${url}`);
      console.log(`DEAD      ${res.status} ${url} (${ms}ms) ← ${id}`);
    } else {
      fail++;
      problems.push(`FAIL ${res.status} ${id} [${medio}] ${url}`);
      console.log(`FAIL      ${res.status} ${url} (${ms}ms) ← ${id}`);
    }
  } catch (e) {
    clearTimeout(t);
    const ms = Date.now() - start;
    const msg = e.name === 'AbortError' ? 'TIMEOUT 12s' : e.message.slice(0, 120);
    err++;
    problems.push(`ERROR ${msg} ${id} [${medio}] ${url}`);
    console.log(`ERROR     ${msg} ${url} (${ms}ms) ← ${id}`);
  }
  // Fecha del frontmatter vs fecha embebida en la URL (/YYYY/MM/DD/): aviso.
  const m = url.match(/\/(\d{4})\/(\d{2})\/(\d{2})\//);
  if (m && fecha && `${m[1]}-${m[2]}-${m[3]}` !== fecha.slice(0, 10)) {
    console.log(`AVISO     fecha ${fecha} ≠ fecha en URL ${m[1]}-${m[2]}-${m[3]} ← ${id}`);
  }
  await delay(350);
}

console.log(`\nResumen: OK ${ok} | WAF/403 ${waf} | DEAD ${dead} | FAIL ${fail} | ERROR ${err} | Total ${queue.length}`);
if (problems.length) {
  console.log('\nProblemas:');
  for (const p of problems) console.log(`  ${p}`);
}
const failed = dead + fail + (strict ? err : 0);
if (failed > 0) {
  console.error(`\n✖ ${failed} fuente(s) con URL muerta o fallida`);
  process.exit(1);
}
console.log('\n✔ URLs verificadas');
