#!/usr/bin/env node
/**
 * sitemaps/youtube.mjs — Sincroniza el catálogo de videos de un canal de YouTube
 * (`sitemaps/youtube_channels/yt_<slug>/<AAAA>.jsonl`) con yt-dlp --flat-playlist.
 *
 * No es un sitemap XML: el RSS de YouTube (`feeds/videos.xml`) devuelve 404
 * incluso para canales vigentes (verificado sep-2026), así que la única vía es
 * yt-dlp, que ya está instalado en el proyecto (ver video-transcript.mjs).
 *
 * Formato JSONL: el mismo que el resto del catálogo ({u, d, t, s} + dur/views
 * opcionales), para que el mismo `rg -uu -g '*.jsonl'` cubra prensa y videos.
 *
 * Fechas: el tab del canal trae fecha ESTIMADA (parseada del texto relativo
 * "hace N días/meses" con `youtubetab:approximate_date`): exacta en lo reciente
 * y con error creciente en profundidad (1 día a 20 videos, ~28 días a 2.500).
 * Se marca `s:"yt"`; `exactifyDates()` fija la fecha real (`s:"yt-exact"`) de
 * los N videos que se van a citar (cuesta ~1.25 s por video, inviable masivo).
 *
 * Modo merge (default): nunca borra entradas; los títulos/fechas solo mejoran
 * (yt-exact > yt). `--replace` reconstruye desde cero.
 *
 * Uso (vía sync.mjs, no directo):
 *   pnpm run sitemaps-sync -- yt_t13                  # sync completo (~9 min T13)
 *   pnpm run sitemaps-sync -- yt_t13 --playlist-end 200  # prueba acotada
 *   pnpm run sitemaps-sync -- yt_t13 --exact 50       # fija fecha real (50 oldest)
 *   pnpm run sitemaps-sync -- yt_t13 --exact-id a1b2c3,d4e5f6  # videos puntuales
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { medioDir as catalogDir } from './paths.mjs';

export function isYoutubeConf(conf) {
  return conf?.tipo === 'youtube';
}

export function channelUrl(conf) {
  return `https://www.youtube.com/${conf.channel}/${conf.tab || 'videos'}`;
}

function log(prefix, text) {
  console.log(`${prefix} ${text}`);
}
const logOk = (t) => log('✔️', t);
const logInfo = (t) => log('ℹ️', t);
const logWarn = (t) => log('⚠️', t);
const logErr = (t) => log('❌', t);

// ---------------------------------------------------------------------------
// yt-dlp
// ---------------------------------------------------------------------------

function checkYtDlp() {
  try {
    const r = spawnSync('yt-dlp', ['--version'], { encoding: 'utf8', timeout: 30000 });
    if (r.status === 0) return (r.stdout || '').trim();
  } catch { /* sigue al error claro de abajo */ }
  throw new Error('yt-dlp no está disponible en el PATH (se usa para el catálogo YouTube)');
}

// Patrones de bloqueo anti-bot / rate-limit de YouTube en la salida de yt-dlp.
const BOT_RES = [
  /sign in to confirm/i,
  /not a bot/i,
  /HTTP Error 429/,
  /rate.?limit/i,
  /too many requests/i,
];

function botBlocked(text = '') {
  return BOT_RES.some((re) => re.test(text));
}

function ymd(uploadDate) {
  const m = String(uploadDate || '').match(/^(\d{4})(\d{2})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// Fecha de una entrada del tab: en el JSON plano (-J) la fecha viene como
// `timestamp` unix (el --print la deriva a upload_date, el JSON no). Es la
// misma estimación de approximate_date, en día UTC.
function entryDate(e) {
  const ts = Number(e?.timestamp);
  if (Number.isFinite(ts) && ts > 0) {
    const d = new Date(ts * 1000);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return ymd(e?.upload_date);
}

function watchUrl(id) {
  return `https://www.youtube.com/watch?v=${id}`;
}

// Carga los JSONL existentes de un canal: { año: Map<url, entry> }.
function loadExistingJsonl(medioDir) {
  const years = {};
  if (!existsSync(medioDir)) return years;
  for (const f of readdirSync(medioDir)) {
    if (!/^\d{4}\.jsonl$/.test(f)) continue;
    const year = f.slice(0, 4);
    const map = new Map();
    for (const line of readFileSync(join(medioDir, f), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        if (e.u) map.set(e.u, e);
      } catch { /* línea corrupta: se ignora */ }
    }
    years[year] = map;
  }
  return years;
}

function writeYears(medioDir, years, yearKeys) {
  let written = 0;
  for (const year of [...yearKeys].sort((a, b) => b.localeCompare(a))) {
    const list = [...years[year].values()]
      .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.u.localeCompare(b.u)));
    const lines = list.map((e) => JSON.stringify(e));
    writeFileSync(join(medioDir, `${year}.jsonl`), lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
    written += lines.length;
  }
  return written;
}

// ---------------------------------------------------------------------------
// Sync de un canal: tab completo (o acotado) → JSONL por año, modo merge.
// ---------------------------------------------------------------------------
// Una pasada del tab con los extractor-args dados. Devuelve { entries } o
// { error } (bloqueo anti-bot, fallo de yt-dlp o JSON inválido).
function fetchTab(url, { playlistEnd = 0, extractorArgs = [] } = {}) {
  const args = ['--flat-playlist'];
  for (const a of extractorArgs) args.push('--extractor-args', a);
  args.push('-J');
  if (playlistEnd > 0) args.push('--playlist-end', String(playlistEnd));
  args.push(url);

  // -J vuelca un solo JSON con `entries[]`: robusto contra títulos con `|`,
  // tabs o saltos de línea (un --print por líneas se rompería con ellos).
  const r = spawnSync('yt-dlp', args, {
    encoding: 'utf8',
    timeout: 1800000, // 30 min: el tab /videos de T13 (~68K) tarda ~9 min por pasada
    maxBuffer: 256 * 1024 * 1024,
  });
  const combined = `${r.stdout || ''}\n${r.stderr || ''}\n${r.error?.message || ''}`;
  if (botBlocked(combined)) return { error: 'bloqueo anti-bot/429 de YouTube' };
  if (r.error || r.status !== 0) {
    const tail = (r.stderr || '').trim().split('\n').slice(-3).join(' | ');
    return { error: `yt-dlp falló (${r.error?.message ?? `exit ${r.status}`})${tail ? `: ${tail}` : ''}` };
  }
  try {
    return { entries: JSON.parse(r.stdout || '').entries ?? [] };
  } catch {
    return { error: 'la salida de yt-dlp no es JSON parseable' };
  }
}

export async function syncCanalYoutube(medio, conf, { playlistEnd = 0, replace = false } = {}) {
  if (!conf?.channel) {
    logErr(`${medio}: config youtube sin 'channel' (handle, ej. @T13_cl).`);
    return { medio, nombre: conf?.nombre ?? medio, urls: null, years: null, failed: 1, complete: false };
  }
  let version;
  try {
    version = checkYtDlp();
  } catch (err) {
    logErr(`${conf.nombre}: ${err.message}`);
    return { medio, nombre: conf.nombre, urls: null, years: null, failed: 1, complete: false };
  }
  const url = channelUrl(conf);
  logInfo(`=== Sincronizando ${conf.nombre} (${medio}) [yt-dlp ${version}] ===`);
  logInfo(`canal: ${url}${playlistEnd > 0 ? ` (primeros ${playlistEnd})` : ''}`);

  // Doble pasada: con lang=es el tab trae titulos originales pero SIN fechas
  // (las relativas vienen en espanol y approximate_date no las parsea); sin lang
  // trae fechas pero titulos auto-traducidos al ingles. Join por id.
  const pass1 = fetchTab(url, { playlistEnd, extractorArgs: ['youtubetab:approximate_date'] });
  if (pass1.error) {
    // Guarda anti-bloqueo: abortar sin escribir nada, nunca un parcial silencioso.
    logErr(conf.nombre + ': ' + pass1.error + '. Catalogo intacto; reintentar mas tarde.');
    return { medio, nombre: conf.nombre, urls: null, years: null, failed: 1, complete: false };
  }
  const pass2 = fetchTab(url, { playlistEnd, extractorArgs: ['youtube:lang=es'] });
  const titlesEs = new Map();
  if (pass2.error) {
    logWarn(conf.nombre + ': pasada de titulos en espanol fallo (' + pass2.error + '); se usan los del tab por defecto.');
  } else {
    for (const e of pass2.entries) if (e && e.id && e.title) titlesEs.set(e.id, String(e.title));
  }
  const entries = pass1.entries;
  let titlesFallback = 0;
  if (entries.length === 0) {
    // Un canal con contenido nunca devuelve 0: tratarlo como fallo, no como
    // catálogo vacío (un merge con 0 no borraría, pero el run sería engañoso).
    logErr(`${conf.nombre}: yt-dlp devolvió 0 videos (¿bloqueo parcial? ultima_sync no avanza).`);
    return { medio, nombre: conf.nombre, urls: null, years: null, failed: 1, complete: false };
  }
  logInfo(`yt-dlp: ${entries.length} video(s) en el tab`);

  const dir = catalogDir(medio);
  const years = replace ? {} : loadExistingJsonl(dir);
  let added = 0;
  let upgraded = 0;
  let kept = 0;
  let skipped = 0;
  const dirty = new Set();

  for (const e of entries) {
    if (!e?.id) { skipped++; continue; }
    const fecha = entryDate(e);
    // Sin fecha no hay año donde archivar (pasa en /shorts sin approximate_date):
    // se salta y se cuenta, no se inventa.
    if (!fecha) { skipped++; continue; }
    const u = watchUrl(e.id);
    const entry = { u, d: fecha, s: 'yt' };
    // Título en español de la 2ª pasada; si el id no vino (el tab se movió
    // entre pasadas), fallback al título del tab por defecto (puede ser EN).
    const tEs = titlesEs.get(e.id);
    if (tEs) entry.t = tEs;
    else if (e.title) { entry.t = String(e.title); titlesFallback++; }
    const dur = Number(e.duration);
    if (Number.isFinite(dur) && dur > 0) entry.dur = Math.round(dur);
    const views = Number(e.view_count);
    if (Number.isFinite(views) && views >= 0) entry.views = views;
    const year = fecha.slice(0, 4);
    const map = years[year] ??= new Map();
    const prev = map.get(u);
    if (!prev) {
      map.set(u, entry);
      added++;
      dirty.add(year);
    } else if (prev.s === 'yt' && entry.s === 'yt-exact') {
      map.set(u, entry);
      upgraded++;
      dirty.add(year);
    } else {
      kept++;
    }
  }

  // En --replace: limpiar años que ya no tienen entradas (igual que sync.mjs).
  if (replace && existsSync(dir)) {
    for (const f of readdirSync(dir)) {
      if (/^\d{4}\.jsonl$/.test(f) && !years[f.slice(0, 4)]) {
        writeFileSync(join(dir, f), '', 'utf8');
      }
    }
  }
  const yearKeys = replace ? Object.keys(years) : [...dirty];
  writeYears(dir, years, yearKeys);

  const total = Object.values(years).reduce((acc, m) => acc + m.size, 0);
  const truncated = playlistEnd > 0;
  logOk(`${conf.nombre}: ${total} videos totales (+${added} nuevos, ${upgraded} mejorados, ${kept} sin cambios${skipped ? `, ${skipped} sin fecha omitidos` : ''}${titlesFallback ? `, ${titlesFallback} con titulo EN (fallback)` : ''})`);
  if (truncated) logWarn(`   └ --playlist-end ${playlistEnd}: recorrido acotado; ultima_sync no avanza.`);
  return { medio, nombre: conf.nombre, urls: total, added, upgraded, kept, fromCache: 0, failed: 0, complete: !truncated, years: Object.keys(years).length };
}

// ---------------------------------------------------------------------------
// Fijar fecha real: yt-dlp por video (~1.25 s c/u) → s:"yt-exact".
// Selección: ids explícitos (--exact-id) o los N más antiguos con s:"yt"
// (son los de mayor error de approximate_date).
// ---------------------------------------------------------------------------
export async function exactifyDates(medio, conf, { count = 0, ids = [] } = {}) {
  const dir = catalogDir(medio);
  const byUrl = new Map(); // u → { entry, year }
  for (const [year, map] of Object.entries(years)) {
    for (const [u, e] of map) byUrl.set(u, { entry: e, year });
  }
  let targets;
  if (ids.length > 0) {
    targets = [];
    for (const id of ids) {
      const hit = byUrl.get(watchUrl(id));
      if (hit) targets.push({ id, ...hit });
      else logWarn(`${id}: no está en el catálogo (sync primero).`);
    }
  } else {
    targets = [...byUrl.entries()]
      .filter(([, { entry }]) => entry.s === 'yt')
      .sort((a, b) => (a[1].entry.d < b[1].entry.d ? -1 : 1))
      .slice(0, count)
      .map(([u, hit]) => ({ id: u.split('v=')[1], ...hit }));
  }
  if (targets.length === 0) {
    logInfo(`${conf.nombre}: nada que fijar (¿todo yt-exact ya?).`);
    const total = [...byUrl.values()].length;
    return { medio, nombre: conf.nombre, exact: true, urls: total, added: 0, upgraded: 0, kept: total, failed: 0, complete: true, years: Object.keys(years).length };
  }
  try {
    checkYtDlp();
  } catch (err) {
    logErr(`${conf.nombre}: ${err.message}`);
    return { medio, nombre: conf.nombre, urls: null, years: null, failed: 1, complete: false };
  }
  logInfo(`=== Fijando fecha exacta de ${targets.length} video(s) de ${conf.nombre} ===`);

  const urls = targets.map((t) => watchUrl(t.id));
  // Se pide también el título por si la entrada no lo trae (rara vez).
  const r = spawnSync('yt-dlp', ['--skip-download', '--no-warnings', '--print', '%(id)s|%(upload_date)s|%(title)s', ...urls], {
    encoding: 'utf8',
    timeout: Math.max(120000, targets.length * 10000),
    maxBuffer: 16 * 1024 * 1024,
  });
  const combined = `${r.stdout || ''}\n${r.stderr || ''}\n${r.error?.message || ''}`;
  if (botBlocked(combined)) {
    logErr(`${conf.nombre}: YouTube bloqueó la descarga (anti-bot/429). Nada se escribió.`);
    return { medio, nombre: conf.nombre, urls: null, years: null, failed: 1, complete: false };
  }
  let upgraded = 0;
  let failed = 0;
  const dirty = new Set();
  const seen = new Set();
  for (const line of (r.stdout || '').split('\n')) {
    const m = line.trim().match(/^([A-Za-z0-9_-]{6,})\|(\d{8}|NA)\|(.*)$/);
    if (!m) continue;
    seen.add(m[1]);
    const fecha = ymd(m[2] === 'NA' ? null : m[2]);
    if (!fecha) { failed++; continue; }
    const hit = byUrl.get(watchUrl(m[1]));
    if (!hit) continue;
    const { entry, year: oldYear } = hit;
    entry.d = fecha;
    entry.s = 'yt-exact';
    const tReal = (m[3] || '').trim();
    // Solo si no había título: un título con salto de línea partiría el
    // --print en dos y el match traería un título truncado. No se pisa nunca.
    if (!entry.t && tReal && tReal !== 'NA') entry.t = tReal;
    const newYear = fecha.slice(0, 4);
    if (newYear !== oldYear) {
      years[oldYear].delete(entry.u);
      const map = years[newYear] ??= new Map();
      map.set(entry.u, entry);
      dirty.add(oldYear);
      dirty.add(newYear);
    } else {
      dirty.add(oldYear);
    }
    upgraded++;
  }
  failed += targets.length - seen.size;
  // Años que quedaron vacíos tras mover entradas se reescriben vacíos.
  writeYears(dir, years, dirty);

  const total = Object.values(years).reduce((acc, m) => acc + m.size, 0);
  logOk(`${conf.nombre}: ${upgraded} fecha(s) fijada(s) a yt-exact${failed ? `, ${failed} sin resolver` : ''}`);
  return { medio, nombre: conf.nombre, exact: true, urls: total, added: 0, upgraded, kept: total - upgraded, failed, complete: failed === 0, years: Object.keys(years).length };
}
