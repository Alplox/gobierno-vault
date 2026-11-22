#!/usr/bin/env node
/**
 * archive-sources.mjs — respaldo externo de fuentes en Internet Archive (Wayback).
 *
 * Guarda la referencia del snapshot en el campo `respaldos[]` de
 * `src/content/sources/<id>.md`, NUNCA en `notas` y NUNCA dentro del proyecto.
 * Cada entrada lleva `servicio`, `url` y opcionalmente `fecha`/`snapshot`/`notas`;
 * el array permite varias copias de la misma fuente en distintos archivos.
 * La URL original citada en los eventos no se modifica.
 *
 * Uso:
 *   pnpm run archive-sources -- --dry-run --limit 20          # default: solo lista
 *   pnpm run archive-sources -- --apply --since 2026-11-01    # archiva y escribe respaldos
 *   pnpm run archive-sources -- --apply --all --limit 50      # tanda amplia
 *   pnpm run archive-sources -- --apply --id 24horas-2026-10-24-kast-burnham-malvinas
 *   pnpm run archive-sources -- --id a,b --id c               # varios IDs (o argumentos sueltos)
 *   pnpm run archive-new -- --apply                            # solo fuentes sin commitear
 *   pnpm run archive-sources -- --new --new-days 2             # plus las agregadas en los últimos 2 días
 *   pnpm run archive-sources -- --migrate-only --all          # mueve markers viejos de notas
 *   pnpm run archive-sources -- --self-test                   # tests sin red
 *
 * Flags:
 *   --apply             Ejecuta red + escritura. Sin esto es DRY-RUN (default).
 *   --migrate-only      Solo migra `Respaldo Wayback: ...` desde `notas` a `respaldos`, sin red.
 *   --new               Solo fuentes nuevas según git: sin commitear. Con --new-days N
 *                       también incluye las agregadas en los últimos N días.
 *                       Ignora --since para no perder fuentes con fecha antigua escritas hoy.
 *   --new-days N        Días de alta reciente para --new (default 0 = solo sin commitear).
 *   --since YYYY-MM-DD  Solo fuentes con fecha >= (default: últimos 30 días).
 *   --all               Todas las fechas.
 *   --limit N           Máximo de fuentes a procesar (default 20; se ignora con --id).
 *   --id <id>           ID exacto de una fuente (o IDs separados por coma / flag repetible).
 *                       Acepta con o sin `.md`. Ignora fecha/límite y la marca de "ya respaldada".
 *   --medio <texto>     Filtro por medio o ID (substring, insensible a mayúsculas; se ignora con --id).
 *   --include-backed-up Procesar fuentes que ya tienen respaldo del servicio.
 *   --delay N           Pausa entre Save Page Now en ms (default 4000; anónimo ~15 req/min).
 *   --check-delay N     Pausa entre chequeos de disponibilidad en ms (default 700).
 *   --timeout N         Timeout de cada request en ms (default 60000 para save).
 *
 * Estrategia por fuente:
 *   1. Chequear `archive.org/wayback/available?url=...`. Si existe snapshot se reutiliza
 *      (así se respaldan también fuentes ya muertas).
 *   2. Si no, `web.archive.org/save/<URL>` y leer la URL canónica del redirect / Content-Location.
 *   3. Insertar la entrada en `respaldos[]` con edición quirúrgica (respeta CRLF y bloques),
 *      idempotente por `servicio` + `url`.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { getNewSourceIds } from '../lib/newSources.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SOURCES_DIR = join(ROOT, 'src', 'content', 'sources');

const MARKER = 'Respaldo Wayback';
// Marker legacy en `notas` (fase de transición). Se migra automáticamente a `respaldos[]`.
const LEGACY_INLINE_RE = /;[ \t]*Respaldo Wayback:[ \t]*(https:\/\/web\.archive\.org\/[^\s"'\r\n]+)/g;
const LEGACY_LINE_RE = /^[ \t]*Respaldo Wayback:[ \t]*(https:\/\/web\.archive\.org\/[^\s"'\r\n]+)[ \t]*(?:\r?\n|$)/gm;
const LEGACY_STRIP_INLINE_RE = /;[ \t]*Respaldo Wayback:[ \t]*https:\/\/web\.archive\.org\/[^\s"'\r\n]+/g;
const LEGACY_STRIP_LINE_RE = /^[ \t]*Respaldo Wayback:.*(?:\r?\n|$)/gm;

const UA = 'GobiernoVault/1.0 (preservacion de fuentes; https://github.com/iipc/awesome-web-archiving)';

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const val = (f) => {
  const i = args.indexOf(f);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VALUE_FLAGS = new Set(['--id', '--since', '--limit', '--medio', '--delay', '--check-delay', '--timeout', '--new-days']);

/** IDs pasados con `--id` (repetible o separados por coma) o como argumento suelto. */
function explicitIds() {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--id') {
      if (args[i + 1]) out.push(args[i + 1]);
      i++;
      continue;
    }
    if (!args[i].startsWith('--') && !(i > 0 && VALUE_FLAGS.has(args[i - 1]))) out.push(args[i]);
  }
  return [...new Set(out.flatMap((s) => String(s).split(',')).map((s) => s.trim().replace(/\.md$/, '')).filter(Boolean))];
}

// ---------------------------------------------------------------------------
// Campo `respaldos[]` — edición quirúrgica del frontmatter
// ---------------------------------------------------------------------------

function servicioFromUrl(url) {
  const u = String(url).toLowerCase();
  if (u.includes('web.archive.org')) return 'wayback';
  if (u.includes('archive.ph') || u.includes('archive.today')) return 'archivetoday';
  return 'otro';
}

function normalizeRespaldo(r) {
  if (typeof r === 'string') return { servicio: servicioFromUrl(r), url: r };
  if (r && typeof r === 'object' && typeof r.url === 'string') {
    const out = { servicio: String(r.servicio || servicioFromUrl(r.url)), url: r.url };
    for (const k of ['fecha', 'snapshot', 'notas']) {
      if (r[k] != null) out[k] = String(r[k]);
    }
    return out;
  }
  return null;
}

function legacyUrls(fm) {
  return [
    ...[...fm.matchAll(LEGACY_INLINE_RE)].map((m) => m[1]),
    ...[...fm.matchAll(LEGACY_LINE_RE)].map((m) => m[1]),
  ];
}

function hasLegacyMarker(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return !!m && legacyUrls(m[1]).length > 0;
}

/**
 * Inserta/actualiza una entrada en `respaldos[]`. Migra markers legacy de `notas`.
 * Devuelve { ok, changed, migrated, raw }. No re-serializa el resto del frontmatter.
 */
export function upsertRespaldos(raw, entry) {
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  const m = raw.match(/^(---\r?\n)([\s\S]*?)\r?\n(---)/);
  if (!m) return { ok: false, reason: 'sin frontmatter', raw, migrated: 0 };

  let fm = m[2];
  const old = legacyUrls(fm);
  if (old.length) {
    fm = fm.replace(LEGACY_STRIP_INLINE_RE, '').replace(LEGACY_STRIP_LINE_RE, '');
  }

  let parsed = {};
  try { parsed = YAML.parse(fm) ?? {}; } catch { /* frontmatter raro: se reconstruye solo respaldos */ }
  const items = [];
  const seen = new Set();
  for (const r of (Array.isArray(parsed.respaldos) ? parsed.respaldos : [])) {
    const norm = normalizeRespaldo(r);
    if (norm && !seen.has(norm.url)) { seen.add(norm.url); items.push(norm); }
  }
  for (const url of old) {
    if (!seen.has(url)) {
      seen.add(url);
      items.push({ servicio: servicioFromUrl(url), url, snapshot: url.match(/web\/(\d{14})\//)?.[1] });
    }
  }
  const newEntry = normalizeRespaldo(entry);
  const added = !!newEntry && !seen.has(newEntry.url);
  if (added) items.push(newEntry);
  if (!added && !old.length) return { ok: true, changed: false, migrated: 0, raw };

  const blockLines = YAML.stringify({ respaldos: items }, { lineWidth: 0 }).trim().split('\n');
  const lines = fm.split(/\r?\n/);
  // Al quitar un marker legacy que era la última línea, queda un renglón vacío
  // colgando: se poda antes de insertar `respaldos:` para no dejar líneas huecas.
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const idx = lines.findIndex((l) => /^respaldos\s*:/.test(l));
  if (idx === -1) {
    lines.push(...blockLines);
  } else {
    let end = idx;
    // Un bloque `respaldos:` con items sigue con líneas indentadas; una forma
    // inline (`respaldos: []` / `respaldos: [url]`) se reemplaza en una línea.
    while (end + 1 < lines.length && /^\s+\S/.test(lines[end + 1])) end++;
    lines.splice(idx, end - idx + 1, ...blockLines);
  }

  const rebuilt = m[1] + lines.join(eol) + eol + m[3] + raw.slice(m[0].length);
  return { ok: true, changed: true, migrated: old.length, raw: rebuilt };
}

function selfTest() {
  const snap = 'https://web.archive.org/web/20261122000000/https://ejemplo.cl/noticia';
  const entry = { servicio: 'wayback', url: snap, fecha: '2026-11-22', snapshot: '20261122000000' };
  const parseFm = (out) => YAML.parse(out.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1]);
  const cases = [];
  const check = (name, raw, expectFn) => {
    const r = upsertRespaldos(raw, entry);
    let pass = r.ok;
    try { pass = pass && expectFn(r.raw, r, parseFm(r.raw)); } catch { pass = false; }
    cases.push({ name, pass, out: r.raw });
  };

  check('sin respaldos', '---\ntipo: prensa\nurl: https://ejemplo.cl/x\n---\n', (out, r, fm) =>
    r.changed && fm.respaldos?.[0]?.url === snap && fm.respaldos[0].servicio === 'wayback');
  check('multiple respaldos', '---\nrespaldos:\n  - servicio: archivetoday\n    url: https://archive.ph/abc\nurl: https://ejemplo.cl/x\n---\n', (out, r, fm) =>
    fm.respaldos.length === 2 && fm.respaldos[0].url === 'https://archive.ph/abc' && fm.respaldos[1].servicio === 'wayback');
  check('idempotente', `---\nrespaldos:\n  - servicio: wayback\n    url: ${snap}\n---\n`, (out, r, fm) =>
    !r.changed && fm.respaldos.length === 1);
  check('inline legacy array', '---\nrespaldos: [https://archive.ph/abc]\n---\n', (out, r, fm) =>
    fm.respaldos.length === 2 && fm.respaldos[0].servicio === 'archivetoday');
  check('migra marker inline de notas', '---\nnotas: "leida; Respaldo Wayback: https://web.archive.org/web/20260101000000/https://ejemplo.cl/x"\n---\n', (out, r, fm) =>
    r.migrated === 1 && fm.respaldos.length === 2 && !String(fm.notas).includes('Respaldo Wayback'));
  check('migra marker en bloque de notas', '---\nnotas: |\n  verificada\n  Respaldo Wayback: https://web.archive.org/web/20260101000000/https://ejemplo.cl/x\n---\n', (out, r, fm) =>
    r.migrated === 1 && fm.respaldos.length === 2 && !String(fm.notas).includes('Respaldo Wayback'));
  check('CRLF y url original intactos', '---\r\nurl: https://ejemplo.cl/x\r\nnotas: hola\r\n---\r\n', (out, r, fm) =>
    fm.url === 'https://ejemplo.cl/x' && !/(^|[^\r])\n/.test(out));

  for (const c of cases) console.log(`  ${c.pass ? '✔' : '✖'} ${c.name}`);
  const failed = cases.filter((c) => !c.pass);
  console.log(`\nself-test: ${cases.length - failed.length}/${cases.length} OK`);
  if (failed.length) {
    for (const f of failed) console.log(`\n--- ${f.name} ---\n${f.out}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Red: Wayback availability + Save Page Now
// ---------------------------------------------------------------------------

function normalizeSnapUrl(u) {
  return String(u).replace(/^http:\/\/web\.archive\.org\//i, 'https://web.archive.org/');
}

async function fetchTimed(url, opts, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal, headers: { 'user-agent': UA, ...(opts?.headers ?? {}) } });
  } finally {
    clearTimeout(t);
  }
}

async function checkSnapshot(url) {
  const api = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetchTimed(api, {}, 15000);
    if (!res.ok) return null;
    const data = await res.json();
    const snap = data?.archived_snapshots?.closest;
    // La API devuelve status HTTP como string ("200"), no "ok".
    const usable = snap && snap.available !== false && /^(ok|2\d\d|3\d\d)$/i.test(String(snap.status ?? ''));
    if (usable && snap.url) {
      return { url: normalizeSnapUrl(snap.url), when: snap.timestamp ?? '', via: 'disponible' };
    }
  } catch { /* sin snapshot o red caída: se intenta guardar */ }
  return null;
}

function canonicalFromSave(res) {
  const candidates = [res.url, res.headers.get('content-location') ?? ''];
  for (const c of candidates) {
    const mm = c.match(/https?:\/\/web\.archive\.org\/web\/\d{14}\/[^?\s]*/);
    if (mm) {
      const norm = normalizeSnapUrl(mm[0]);
      return norm.replace(/\/$/, '') || norm;
    }
    const rel = c.match(/^\/web\/\d{14}\/[^?\s]*/);
    if (rel) return `https://web.archive.org${rel[0]}`;
  }
  return null;
}

async function saveSnapshot(url, timeoutMs) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchTimed(`https://web.archive.org/save/${url}`, { redirect: 'follow' }, timeoutMs);
      const canonical = canonicalFromSave(res);
      if (res.ok && canonical) return { url: canonical, via: 'save' };
      if (res.status === 429 || res.status === 503) {
        await sleep(2500 * (attempt + 1));
        continue;
      }
      return { error: `HTTP ${res.status}${canonical ? '' : ' (sin URL canónica)'}` };
    } catch (e) {
      if (attempt === 1) return { error: e.name === 'AbortError' ? 'timeout' : e.message.slice(0, 100) };
      await sleep(1500);
    }
  }
  return { error: 'sin snapshot tras reintentos' };
}

/**
 * API reutilizable para `add-source`: genera (o reutiliza) el respaldo de una URL
 * y devuelve la entrada lista para `respaldos[]`. No escribe archivos.
 * Nunca lanza: si falla devuelve { error } para que la fuente se cree igual.
 */
export async function archiveOne(url, { checkDelayMs = 0 } = {}) {
  try {
    let found = await checkSnapshot(url);
    if (found) {
      await sleep(checkDelayMs);
    } else {
      found = await saveSnapshot(url, timeout);
    }
    if (found?.error) return { error: found.error };
    return {
      servicio: 'wayback',
      url: found.url,
      fecha: new Date().toISOString().slice(0, 10),
      snapshot: found.url.match(/web\/(\d{14})\//)?.[1],
      via: found.via,
    };
  } catch (e) {
    return { error: e.message.slice(0, 120) };
  }
}

// ---------------------------------------------------------------------------
// Cola de fuentes
// ---------------------------------------------------------------------------

function splitFm(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  try { return YAML.parse(m[1]); } catch { return null; }
}

function buildQueue() {
  const files = readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.md'));
  const medio = (val('--medio') ?? '').toLowerCase();
  const ids = explicitIds();
  const explicit = ids.length > 0;
  const newIds = has('--new') ? getNewSourceIds(newDays) : null;
  const queue = [];
  for (const f of files) {
    const path = join(SOURCES_DIR, f);
    const raw = readFileSync(path, 'utf8');
    const fm = splitFm(raw);
    if (!fm?.url || typeof fm.url !== 'string' || !/^https?:\/\//.test(fm.url)) continue;
    const id = f.replace(/\.md$/, '');
    if (explicit && !ids.includes(id)) continue;
    if (newIds && !newIds.has(id)) continue;
    const fecha = String(fm.fecha ?? '').slice(0, 10);
    // --new ignora --since: una fuente escrita hoy puede documentar un hecho de 2025.
    if (!explicit && !newIds && !has('--all') && !has('--migrate-only') && fecha < since) continue;
    if (!explicit && medio && !`${fm.medio ?? ''} ${id}`.toLowerCase().includes(medio)) continue;
    const respaldos = (Array.isArray(fm.respaldos) ? fm.respaldos : []).map(normalizeRespaldo).filter(Boolean);
    const legacy = hasLegacyMarker(raw);
    const backedUp = respaldos.some((r) => r.servicio === 'wayback');
    if (backedUp && !legacy && !has('--include-backed-up') && !explicit) continue;
    if (has('--migrate-only') && !legacy) continue;
    queue.push({ id, file: path, url: fm.url.trim(), fecha, backedUp, legacy });
    if (!explicit && limit && queue.length >= limit) break;
  }
  return queue;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const apply = has('--apply') || has('--migrate-only');
const newDays = parseInt(val('--new-days') ?? '0', 10);
const limit = parseInt(val('--limit') ?? (has('--new') ? '200' : '20'), 10);
const since = val('--since') ?? new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
const delaySave = parseInt(val('--delay') ?? '4000', 10);
const delayCheck = parseInt(val('--check-delay') ?? '700', 10);
const timeout = parseInt(val('--timeout') ?? '60000', 10);

async function main() {
  if (has('--self-test')) return selfTest();

  const queue = buildQueue();
  console.log(`\nFuentes candidate: ${queue.length}`);
  console.log(`Modo: ${has('--migrate-only') ? 'MIGRATE (sin red)' : apply ? 'APPLY (red + escritura)' : 'DRY-RUN (solo lista, sin red)'}`);
  const ids = explicitIds();
  console.log(ids.length
    ? `Filtro: id = ${ids.join(', ')} (explícito: ignora fecha/límite y re-procesa aunque ya tenga respaldo)\n`
    : has('--new')
      ? `Filtro: fuentes nuevas según git (sin commitear${newDays > 0 ? ` o agregadas en los últimos ${newDays} días` : ''}), medio = ${val('--medio') ?? '(todos)'}, limite = ${limit}\n`
      : `Filtro: fecha >= ${since}${has('--all') || has('--migrate-only') ? ' (todas)' : ''}, medio = ${val('--medio') ?? '(todos)'}, limite = ${limit}\n`);

  if (!apply) {
    for (const s of queue) console.log(`  ${s.id.padEnd(58)} ${s.url}${s.legacy ? '  [migrar notas]' : ''}${s.backedUp ? '  [ya tiene respaldo]' : ''}`);
    console.log('\nPara ejecutar: pnpm run archive-new -- --apply  (solo nuevas)  |  pnpm run archive-sources -- --apply --id <id>  (o --id a,b --limit N / --since / --all / --new / --migrate-only)');
    return;
  }

  let ok = 0, migradas = 0, guardadas = 0, reutilizadas = 0, errores = 0, sinCambios = 0;
  for (const s of queue) {
    let result = null;
    if (!has('--migrate-only')) {
      result = await checkSnapshot(s.url);
      if (!result) {
        await sleep(delaySave);
        result = await saveSnapshot(s.url, timeout);
      } else {
        await sleep(delayCheck);
      }
      if (result?.error) {
        errores++;
        console.log(`ERROR     ${s.id} — ${result.error}`);
        continue;
      }
    }

    const entry = result ? {
      servicio: 'wayback',
      url: result.url,
      fecha: new Date().toISOString().slice(0, 10),
      snapshot: result.url.match(/web\/(\d{14})\//)?.[1],
    } : null;
    const raw = readFileSync(s.file, 'utf8');
    const upd = upsertRespaldos(raw, entry);
    if (!upd.ok) {
      errores++;
      console.log(`ERROR     ${s.id} — ${upd.reason}`);
      continue;
    }
    if (upd.changed) {
      writeFileSync(s.file, upd.raw, 'utf8');
      ok++;
      migradas += upd.migrated;
      if (has('--migrate-only')) {
        console.log(`MIGRADA   ${s.id}`);
      } else if (result.via === 'save') {
        guardadas++;
        console.log(`GUARDADA  ${s.id} — ${result.url}`);
      } else {
        reutilizadas++;
        console.log(`REUSADA   ${s.id} — ${result.url} (${result.when})`);
      }
    } else {
      sinCambios++;
      console.log(`SIN CAMBIO ${s.id}`);
    }
  }

  console.log(`\nResumen: escritas ${ok} (save ${guardadas} | reutilizadas ${reutilizadas} | migradas ${migradas}) | sin cambio ${sinCambios} | errores ${errores} | total ${queue.length}`);
  if (errores) process.exitCode = 1;
}

// Guard: solo ejecuta el flujo principal si se corre directo (no al importar).
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
    process.argv[1].replace(/\\/g, '/').toLowerCase();

if (isMain) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { checkSnapshot, saveSnapshot, buildQueue };
