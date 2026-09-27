#!/usr/bin/env node
/**
 * sitemaps/sync.mjs — Sincroniza el catálogo de artículos de prensa
 * (`sitemaps/<medio>/<año>.jsonl`) a partir de los sitemaps de cada medio.
 *
 * Pipeline: robots.txt → sitemap_index.xml → sub-sitemaps → parseo de <url>
 * (loc, lastmod, news:title, news:publication_date) → dedupe por URL →
 * escritura de JSONL particionado por medio y año.
 *
 * Uso:
 *   pnpm run sitemaps-sync -- <medio>        # sincroniza un medio (slug)
 *   pnpm run sitemaps-sync -- --all          # sincroniza todos los registrados
 *   pnpm run sitemaps-sync -- --list         # lista los medios conocidos
 *
 * Flags:
 *   --fresh       Ignora el caché local y re-descarga todo
 *   --no-cache    No guarda el XML crudo en .cache/
 *   --limit <n>   Máximo de URLs por sub-sitemap (útil en pruebas)
 *   --stale <h>   Horas de tolerancia del caché (default 24)
 *   --no-delay    Sin espera entre sub-sitemaps (el rate-limit de 300ms
 *                 solo aplica a descargas reales, no a caché)
 *   --delay <ms>  Milisegundos de espera entre sub-sitemaps (default 300)
 *   --incremental No re-parsea sub-sitemaps servidos desde caché fresco:
 *                 solo re-descarga lo que expiró (típicamente los
 *                 news-sitemaps). Para resync diario (sitemaps-resync).
 *   --replace     Reconstruye los JSONL desde cero (DESTRUYE datos que el
 *                 sitemap ya no liste). Por defecto es modo MERGE: nunca se
 *                 borra una URL existente y los títulos solo se mejoran
 *                 (news > slug), nunca se degradan.
 *   --since-last-sync
 *                 Usa como ventana la fecha UTC de `ultima_sync` de cada medio
 *                 en `_manifest.json` (inclusiva). Si no existe o no es válida,
 *                 ese medio se sincroniza completo. No se puede combinar con
 *                 `--since`, `--days` ni `--replace`.
 *   --since <YYYY-MM-DD>
 *                 Solo sincroniza contenido reciente, sin recargar el
 *                 catálogo completo (ideal cuando los sitemaps ya se
 *                 obtuvieron y solo se quiere el año en curso). Filtra en
 *                 3 niveles: (1) sub-sitemaps históricos por la fecha que
 *                 lleva su URL (BioBio static-sitemap-YYYY-MM, CNN YYYY/MM,
 *                 Meganoticias sitemap-YYYY-MM, Mestizos sitemap-DD-MM-YYYY,
 *                 Publimetro YYYY-MM-DD, FastCheck posts-YYYY); (2) para los
 *                 sitemaps sin fecha en la URL (Yoast post-sitemapN, Arc XP
 *                 ?from=N) se mira el rango de fechas del XML ya cacheado y
 *                 si es puramente histórico se omite sin re-descargar;
 *                 (3) las entradas anteriores a la fecha nunca se tocan
 *                 (modo merge: no se borran ni se re-agregan).
 *   --days <n>    Equivalente a --since con la fecha de hace n días (default 7).
 *                 NO compatible con --replace (borraría la historia).
 *
 * Notas:
 * - Node fetch descomprime gzip automáticamente (varios medios sirven los
 *   sitemaps comprimidos, ej. El Clarín).
 * - Los post-sitemaps normalmente NO traen título (solo loc + lastmod); los
 *   news-sitemaps sí (<news:title> + fecha exacta). El título derivado del
 *   slug se marca con s:"slug" para no confundirlo con el real (s:"news").
 * - Se respeta el caché por medio: solo se re-descarga lo que cambió.
 * - Modo merge (default): carga los JSONL existentes, agrega URLs nuevas y
 *   actualiza títulos solo si el nuevo es mejor; NUNCA borra entradas.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, openSync, closeSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SITEMAPS_DIR = join(ROOT, 'sitemaps');
const CACHE_DIR = join(SITEMAPS_DIR, '.cache');
const MANIFEST_PATH = join(SITEMAPS_DIR, '_manifest.json');
const MANIFEST_LOCK_PATH = `${MANIFEST_PATH}.lock`;

const COMMON_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// Registro de medios (MEDIA): vive en ./media.mjs (mismo directorio). Se importa
// aquí y se re-exporta abajo para compatibilidad (index/resync/news-search).
import { MEDIA } from './media.mjs';

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------
function log(prefix, text) {
  console.log(`${prefix} ${text}`);
}
const logOk = (t) => log('✔️', t);
const logInfo = (t) => log('ℹ️', t);
const logWarn = (t) => log('⚠️', t);
const logErr = (t) => log('❌', t);

function slugify(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isoDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  const m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // TVN (Prontus): <lastmod> con timestamp Unix en segundos (ej. 1790520424).
  if (/^\d{10}$/.test(s)) {
    const d = new Date(Number(s) * 1000);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Filtro de ventana temporal (--since / --days): decidir si un sub-sitemap
// cubre contenido reciente SIN descargarlo, y no tocar entradas antiguas.
// ---------------------------------------------------------------------------

// Fecha de cobertura detectable en la URL de un sub-sitemap, si la lleva:
//   YYYY-MM-DD  → Publimetro (/sitemap/2026-08-09/)
//   DD-MM-YYYY  → Mestizos (sitemap-30-11-2024.xml)
//   YYYY-MM     → BioBio (static-sitemap-2026-08.xml), CNN (_files/sitemaps/
//                 2026/08.xml), Meganoticias (sitemap-2026-08.xml), El Dínamo
//   YYYY suelto → FastCheck (posts-2026.xml)
// Solo se mira el PATH (sin query string): la paginación de Arc XP
// (?from=N) no debe confundirse con un año.
function sitemapUrlDate(u) {
  let path;
  try {
    path = new URL(u).pathname;
  } catch {
    return null;
  }
  let m = path.match(/((?:19|20)\d{2})[-/](\d{2})[-/](\d{2})/);
  if (m) return { y: +m[1], mo: +m[2], d: +m[3] };
  m = path.match(/(?:^|[^\d])(\d{2})[-/](\d{2})[-/]((?:19|20)\d{2})/);
  if (m) return { y: +m[3], mo: +m[2], d: +m[1] };
  m = path.match(/((?:19|20)\d{2})[-/](\d{2})(?=\D|$)/);
  if (m) return { y: +m[1], mo: +m[2] };
  m = path.match(/(?:^|[^\d])((?:19|20)\d{2})(?:[^\d]|$)/);
  if (m) return { y: +m[1] };
  return null;
}

// ¿El sub-sitemap (por su URL) cae dentro de la ventana desde `since`?
//   true  → reciente, descargar
//   false → histórico, omitir
//   null  → sin fecha detectable en la URL (se decide por caché/contenido)
function sitemapUrlInWindow(u, since) {
  const sd = sitemapUrlDate(u);
  if (!sd) return null;
  if (sd.y > since.y) return true;
  if (sd.y < since.y) return false;
  if (sd.mo !== undefined) {
    if (sd.mo > since.mo) return true;
    if (sd.mo < since.mo) return false;
  }
  if (sd.d !== undefined && sd.d < since.d) return false;
  return true;
}

// Fecha máxima de los primeros bloques <url> de un XML cacheado (sin
// re-descargar). Los sitemaps se ordenan nuevo→viejo, así que si el máximo
// de los primeros bloques ya es anterior a `since`, el archivo completo es
// histórico y no vale la pena re-descargarlo (caso Yoast post-sitemapN,
// Arc XP ?from=N y paginados Prontus, que no llevan fecha en la URL).
function peekCachedMaxDate(cachePath, blocks = 50) {
  try {
    const xml = readFileSync(cachePath, 'utf8');
    const blockRe = /<url>([\s\S]*?)<\/url>/g;
    let n = 0;
    let m;
    let max = null;
    while (n < blocks && (m = blockRe.exec(xml)) !== null) {
      const lastmod = m[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim() || null;
      const newsDate = m[1].match(/<(?:news|n):publication_date>([\s\S]*?)<\/(?:news|n):publication_date>/i)?.[1] || null;
      const f = isoDate(newsDate) ?? isoDate(lastmod);
      if (f && (!max || f > max)) max = f;
      n++;
    }
    return max;
  } catch {
    return null;
  }
}

function stripCdata(str) {
  return String(str).replace(/<!\[CDATA\[|\]\]>/g, '').trim();
}

function decodeEntities(str = '') {
  const map = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
  };
  return str.replace(/&[a-zA-Z#0-9]+;/g, (m) => map[m] ?? m);
}

function cleanText(str = '') {
  return decodeEntities(stripCdata(str))
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—|:]+/, '')
    .replace(/[\s\-–—|]+$/, '')
    .trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function emptyManifest() {
  return { version: 1, descripcion: '', actualizado: null, medios: {} };
}

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (err) {
    // Solo ausencia equivale a un manifest nuevo. Un JSON truncado o ilegible
    // debe abortar: replace-all con un manifest vacío perdería todos los estados.
    if (err?.code === 'ENOENT') return emptyManifest();
    throw err;
  }
}

// Fecha UTC de la última sincronización guardada para un medio. `--since-last-sync`
// la usa como cutoff inclusivo por medio: no necesita conocer qué sitemap cambia,
// solo vuelve a evaluar los endpoints cuyo rango de fechas pueda intersectar la
// ventana. Un medio sin timestamp válido conserva el sync completo.
function lastSyncSince(manifest, medio) {
  const raw = manifest?.medios?.[medio]?.ultima_sync;
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

async function acquireManifestLock() {
  const deadline = Date.now() + 20_000;
  const transient = new Set(['EEXIST', 'EACCES', 'EBUSY', 'EPERM', 'UNKNOWN']);
  while (Date.now() < deadline) {
    let fd;
    try {
      fd = openSync(MANIFEST_LOCK_PATH, 'wx');
      writeFileSync(fd, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }) + '\n', 'utf8');
      closeSync(fd);
      return;
    } catch (err) {
      if (fd !== undefined) {
        try { closeSync(fd); } catch {}
        try { rmSync(MANIFEST_LOCK_PATH, { force: true }); } catch {}
      }
      if (!transient.has(err?.code)) throw err;

      // Un proceso que murió puede dejar el lock. El update normal tarda
      // milisegundos, así que 10s es holgadamente stale.
      try {
        if (Date.now() - statSync(MANIFEST_LOCK_PATH).mtimeMs > 10_000) {
          rmSync(MANIFEST_LOCK_PATH, { force: true });
          continue;
        }
      } catch (statErr) {
        if (statErr?.code === 'ENOENT') continue;
      }
      await sleep(100 + Math.floor(Math.random() * 100));
    }
  }
  throw new Error(`No se pudo bloquear ${MANIFEST_LOCK_PATH} después de 20s`);
}

async function releaseManifestLock() {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      rmSync(MANIFEST_LOCK_PATH, { force: true });
      return;
    } catch {
      await sleep(50 * (attempt + 1));
    }
  }
}

// Windows/antivirus pueden bloquear momentáneamente el open (`UNKNOWN`,
// `EPERM`, `EBUSY`). Se escribe primero a un temporal único y se renombra de
// forma atómica; el rename garantiza que nunca quede un manifest truncado.
async function writeManifest(manifest) {
  const data = JSON.stringify(manifest, null, 2) + '\n';
  const tempPath = `${MANIFEST_PATH}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
  let lastError;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      writeFileSync(tempPath, data, { encoding: 'utf8', flag: 'wx' });
      renameSync(tempPath, MANIFEST_PATH);
      return;
    } catch (err) {
      lastError = err;
      try { rmSync(tempPath, { force: true }); } catch {}
      if (attempt < 9) await sleep(Math.min(100 * 2 ** attempt, 1_000));
    }
  }
  throw new Error(
    `No se pudo escribir ${MANIFEST_PATH} tras 10 intentos (${lastError?.code ?? 'UNKNOWN'})`,
    { cause: lastError },
  );
}

// Read-modify-write protegido entre procesos. El lock evita lost updates cuando
// varios syncs terminan a la vez; el rename atómico evita lecturas parciales.
async function updateManifest(mutate) {
  await acquireManifestLock();
  try {
    const manifest = readManifest();
    const result = mutate(manifest);
    await writeManifest(manifest);
    return result;
  } finally {
    await releaseManifestLock();
  }
}

// ---------------------------------------------------------------------------
// Fetch con caché en disco (evita re-descargar XML que no cambió)
// ---------------------------------------------------------------------------
async function fetchText(url, { cacheKey, cacheDir, staleHours = 24, fresh = false, noCache = false } = {}) {
  if (cacheKey && cacheDir && !fresh) {
    const cachedPath = join(cacheDir, `${cacheKey}.xml`);
    if (existsSync(cachedPath)) {
      const ageMs = Date.now() - statSync(cachedPath).mtimeMs;
      if (ageMs < staleHours * 3600_000) {
        return { ok: true, text: readFileSync(cachedPath, 'utf8'), fromCache: true, cachedPath };
      }
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);
  let direct = null;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': COMMON_UA,
        'accept': 'application/xml,text/xml,application/xhtml+xml,*/*;q=0.8',
        'accept-language': 'es-CL,es;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) direct = { ok: false, text: '', status: res.status };
    else {
      const ct = res.headers.get('content-type') || '';
      let text;
      if (ct.includes('gzip') || ct.includes('x-gzip') || url.endsWith('.gz')) {
        const buf = Buffer.from(await res.arrayBuffer());
        text = gunzipSync(buf).toString('utf8');
      } else {
        text = await res.text();
      }
      direct = { ok: true, text, fromCache: false, status: res.status };
    }
  } catch (err) {
    direct = { ok: false, text: '', status: 0, error: err.message };
  } finally {
    clearTimeout(timer);
  }

  // Fallback con Crawlee (retries + backoff) para errores de red o bloqueos
  // (403/429). Lazy import: solo se carga si el fetch directo falla. Usa
  // HttpCrawler (sin navegador); para sitios con JS pesado o Cloudflare
  // avanzado, curl_cffi via fetch-impersonate.mjs es el siguiente escalon.
  if (!direct.ok) {
    const crawlee = await fetchWithCrawlee(url);
    if (crawlee.ok) {
      direct = crawlee;
    }
  }

  if (direct.ok) {
    const text = direct.text;
    if (cacheKey && cacheDir && !noCache) {
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(join(cacheDir, `${cacheKey}.xml`), text, 'utf8');
    }
    return { ok: true, text, fromCache: false, status: direct.status };
  }
  return direct;
}

async function fetchWithCrawlee(url, attempts = 3) {
  try {
    const { HttpCrawler, Configuration, MemoryStorage } = await import('crawlee');
    // Storage en memoria: evita que Crawlee cree el directorio ./storage en el repo.
    const config = new Configuration({ storageClient: new MemoryStorage() });
    let result = { ok: false, text: '', status: 0, error: 'crawlee sin resultado' };
    const crawler = new HttpCrawler(
      {
        maxRequestsPerCrawl: 1,
        retryOnBlocked: true,
        maxRequestRetries: attempts - 1,
        // SessionError tiene un límite de rotaciones separado (10 por defecto).
        // Alinearlo para que `attempts` también sea el tope real.
        maxSessionRotations: attempts - 1,
        requestHandler: async (ctx) => {
          const body = ctx.body;
          const status =
            ctx.statusCode ?? ctx.response?.statusCode ?? ctx.response?.status ?? 200;
          let buf = typeof body === 'string' ? Buffer.from(body, 'utf8') : Buffer.from(body ?? []);
          const ct = ctx.response?.headers?.['content-type'] || '';
          if (ct.includes('gzip') || ct.includes('x-gzip') || url.endsWith('.gz')) {
            try { buf = gunzipSync(buf); } catch {}
          }
          const text = buf.toString('utf8');
          // Filtra respuestas de bloqueo tipo Cloudflare (cuerpo HTML de error).
          const isErrHtml = /just a moment|attention required|cf-error|access denied/i.test(
            text.slice(0, 400)
          );
          if (text.length > 50 && !isErrHtml) {
            result = { ok: true, text, fromCache: false, status };
          } else {
            result = { ok: false, text: '', status, error: 'cuerpo vacio o pagina de bloqueo' };
          }
        },
      },
      config
    );
    await crawler.run([{ url, headers: { 'user-agent': COMMON_UA } }]);
    return result;
  } catch (err) {
    return { ok: false, text: '', status: 0, error: `crawlee: ${err.message}` };
  }
}

// ---------------------------------------------------------------------------
// Parseo de XML con regex (sin dependencias, patrón del proyecto)
// ---------------------------------------------------------------------------
function extractPairs(xml, { pathDate = null, locDateRe = null, forceHttps = false } = {}) {
  // Devuelve [{loc, lastmod, newsTitle, newsDate, locDate}] por bloque <url>...</url>
  // pathDate: fecha derivada del nombre del sub-sitemap (YYYY-MM-01) para
  // medios cuyo <lastmod> es la fecha de regeneración y no la del artículo
  // (ver cnnchile/dateFromSitemapPath).
  // locDateRe: regex que extrae la fecha real del path del ARTÍCULO (grupos
  // YYYY/MM/DD) para medios sin <lastmod> ni news:date (ej. Emol:
  // /noticias/<seccion>/YYYY/MM/DD/<id>/<slug>.html). El día es opcional:
  // si el path solo lleva YYYY/MM (ej. La Segunda), se usa día 01
  // (aproximación a nivel de mes, como pathDate).
  // forceHttps: normaliza los <loc> http:// → https:// (el site solo responde
  // por https aunque el sitemap liste http; ej. Emol).
  // Prevalencia: newsDate (real, con día) > locDate (del path del artículo) >
  // pathDate (mes del sitemap) > lastmod (puede ser falso/uniforme).
  const out = [];
  const blockRe = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = blockRe.exec(xml)) !== null) {
    const block = m[1];
    let loc = block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim();
    if (!loc) continue;
    // AIOSEO (ej. El Regionalista) envuelve los <loc> de artículos en CDATA.
    loc = stripCdata(loc);
    if (forceHttps && /^http:\/\//i.test(loc)) loc = `https://${loc.slice(7)}`;
    const lastmod = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim() || null;
    // El prefijo del namespace news varía por medio: `<news:title>` (estándar,
    // FastCheck/Cooperativa) o `<n:title>` (El Mostrador). Se restringe a esos
    // dos prefijos a propósito: un regex genérico `[\w-]+` capturaría también
    // `<image:title>`/`<video:title>` de las extensiones de sitemap, marcando
    // títulos de imágenes como `s:"news"` (dato de calidad incorrecto).
    const newsTitle = block.match(/<(?:news|n):title>([\s\S]*?)<\/(?:news|n):title>/i)?.[1] || null;
    const newsDate = block.match(/<(?:news|n):publication_date>([\s\S]*?)<\/(?:news|n):publication_date>/i)?.[1] || null;
    let locDate = null;
    if (locDateRe) {
      const lm = loc.match(locDateRe);
      if (lm) locDate = `${lm[1]}-${lm[2]}-${lm[3] ?? '01'}`;
    }
    out.push({ loc, lastmod, newsTitle: newsTitle ? cleanText(newsTitle) : null, newsDate, locDate });
  }
  return out;
}

function extractSitemapIndexLocs(xml) {
  // Devuelve las URLs de los sub-sitemaps de un sitemap index.
  // Se decodifican entidades XML (`&amp;` → `&`): Arc XP (La Tercera, ADN)
  // pagina sus sub-sitemaps con `?outputType=xml&amp;from=100`, que sin
  // decodificar devolvería 404 al fetchear.
  // También se limpia CDATA (`<![CDATA[url]]>`): algunos sitemaps (ej.
  // Chile País Minero) envuelven los `<loc>` del index en CDATA; sin el
  // strip la URL queda con los marcadores y el fetch falla.
  const out = [];
  const re = /<loc>([\s\S]*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const raw = m[1].trim();
    const cleaned = stripCdata(raw).replace(/^\s+|\s+$/g, '');
    // Algunos sitemaps (ej. Chile País Minero) omiten el protocolo dentro
    // del CDATA (`<![CDATA[dominio.com/post-sitemap.xml]]>`): se normaliza.
    out.push(decodeEntities(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`));
  }
  return out;
}

// Palabras claramente inglesas que delatan contenido demo/plantilla de WordPress
// (ej: "is-running-good-for-you-health-benefits-of-morning-running-2").
// Solo palabras sin uso como anglicismo en prensa chilena (evita falsos
// positivos con `fitness`, `blog`, `tips`, `top`, etc.).
const ENGLISH_NOISE = new Set([
  'the', 'and', 'for', 'with', 'from', 'this', 'that', 'you', 'your', 'are',
  'how', 'why', 'what', 'when', 'where', 'who', 'is', 'of', 'to', 'in', 'on',
  'health', 'benefits', 'good', 'best', 'free', 'privacy', 'terms', 'services',
  'shop', 'store', 'cart', 'checkout', 'account', 'welcome', 'hello', 'morning',
  'template', 'sample', 'these', 'more', 'product', 'products',
]);

// Título aproximado desde el slug de la URL (para post-sitemaps sin título).
function titleFromSlug(url) {
  try {
    const path = new URL(url).pathname;
    const last = path.split('/').filter(Boolean).pop() || '';
    const withoutExt = last.replace(/\.s?html?$/i, '').replace(/\.\d+$/, '');
    const words = withoutExt
      .split(/[-_]+/)
      .filter((w) => !/^\d{4,}$/.test(w) && !/^\d{1,2}\/\d{1,2}$/.test(w))
      .join(' ');
    // P4: descartar slugs con alto contenido de palabras inglesas (plantillas demo)
    const tokens = words.split(' ');
    const englishHits = tokens.filter((w) => ENGLISH_NOISE.has(w)).length;
    if (englishHits >= 3) return null;
    if (words.length < 4) return null;
    return words.charAt(0).toUpperCase() + words.slice(1);
  } catch {
    return null;
  }
}

// Calidad del título de una entrada: news (real) > slug (derivado) > ninguno.
function titleQuality(e) {
  if (e.s === 'news') return 2;
  if (e.s === 'slug') return 1;
  return 0;
}

// Carga los JSONL existentes de un medio: { año: Map<url, entry> }.
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
        map.set(e.u, e);
      } catch {
        /* línea corrupta: se ignora */
      }
    }
    years[year] = map;
  }
  return years;
}

// ---------------------------------------------------------------------------
// Sincronización de un medio
// ---------------------------------------------------------------------------
async function discoverSitemapUrls(medio, conf, { cacheDir, fresh, staleHours, noCache }) {
  const urls = new Set();
  if (conf.robots) {
    const res = await fetchText(conf.robots, {
      cacheKey: `${medio}-robots`, cacheDir, fresh, staleHours, noCache,
    });
    if (res.ok) {
      for (const line of res.text.split('\n')) {
        const m = line.match(/^Sitemap:\s*(\S+)/i);
        if (m) urls.add(m[1].trim());
      }
      logInfo(`robots.txt: ${urls.size} sitemap(s) declarado(s) para ${conf.nombre}`);
    } else {
      logWarn(`No se pudo leer robots.txt de ${conf.nombre} (${res.status ?? res.error})`);
    }
  }
  if (conf.index) urls.add(conf.index);
  for (const extra of conf.extra ?? []) urls.add(extra);
  return [...urls];
}

async function expandIndex(url, { cacheDir, fresh, staleHours, noCache }) {
  // Si el sitemap es un index (<sitemapindex>), devuelve sus sub-sitemaps.
  const key = slugify(url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 80));
  const res = await fetchText(url, { cacheKey: key, cacheDir, fresh, staleHours, noCache });
  if (!res.ok) return { ok: false, status: res.status };
  if (/<sitemapindex[\s>]/i.test(res.text)) {
    const subs = extractSitemapIndexLocs(res.text);
    logInfo(`index ${url.replace('https://', '')}: ${subs.length} sub-sitemap(s)`);
    return { ok: true, isIndex: true, urls: subs, fromCache: res.fromCache };
  }
  return { ok: true, isIndex: false, urls: [url], text: res.text, fromCache: res.fromCache };
}

async function syncMedio(medio, conf, opts) {
  const { cacheDir, fresh, staleHours, noCache, limit, delayMs, incremental, replace, since } = opts;
  // since viene como 'YYYY-MM-DD' (string ISO); se parte en componentes para
  // comparar contra las fechas detectadas en las URLs de los sub-sitemaps.
  const sinceObj = since ? { y: +since.slice(0, 4), mo: +since.slice(5, 7), d: +since.slice(8, 10) } : null;
  // Contadores del filtro de ventana (--since/--days). Se declaran arriba
  // porque la expansión de sub-sitemaps ya los usa (TDZ si fueran más abajo).
  let urlFiltered = 0;      // sub-sitemaps omitidos por fecha en su URL
  let cacheFiltered = 0;    // sub-sitemaps omitidos por rango del XML cacheado
  let entriesFiltered = 0;  // entradas fuera de la ventana (no se tocan)
  let failed = 0;           // endpoints que no se pudieron leer en este run
  logInfo(`=== Sincronizando ${conf.nombre} (${medio}) ===`);

  const discovered = await discoverSitemapUrls(medio, conf, opts);
  if (discovered.length === 0) {
    failed++;
    logWarn(`${conf.nombre}: no se encontraron sitemaps.`);
    return { medio, nombre: conf.nombre, urls: null, years: null, fromCache: 0, failed, complete: false };
  }

  // Sitemaps que NO contienen artículos de noticias (tags, categorías,
  // autores, páginas estáticas, adjuntos y CPTs de plantillas como gp_*):
  // se descartan para mantener el catálogo limpio.
  const NON_ARTICLE_RE = /(?:tag|category|author|page|attachment|gp_|slide|portfolio|review|hubs|product|media)-sitemap/i;
  // Para sitios WordPress/Yoast (articleOnly): whitelist estricta. Los artículos
  // viven solo en post-sitemap*.xml y news-sitemap*.xml; todo lo demás (CPTs
  // tipo form_newsletter, radar, personaje, estado_donaciones, etc.) se descarta.
  const ARTICLE_ONLY_RE = /(?:^|\/)(?:post|news)-sitemap\d*\.xml$/i;
  // Whitelist por medio (includeRe): solo los sub-sitemaps que matcheen entran.
  const includeRe = conf.includeRe ?? null;

  // Decide si un sub-sitemap es de artículos: includeRe (whitelist por medio) >
  // articleOnly (whitelist Yoast: solo post/news-sitemap) > NON_ARTICLE_RE
  // (denylist genérica para sitios sin whitelist).
  const isArticleSitemap = (u) =>
    includeRe ? includeRe.test(u) : (conf.articleOnly ? ARTICLE_ONLY_RE.test(u) : !NON_ARTICLE_RE.test(u));

  // Expandir índices (cada uno puede apuntar a sub-sitemaps)
  const flat = [];
  // --since: sub-sitemap con fecha en la URL anterior a la ventana → se omite
  // sin descargar (ej. static-sitemap-2010-01.xml de BioBio con --days 30).
  // Los que no llevan fecha (Yoast post-sitemapN, Arc XP ?from=N) pasan y se
  // deciden más abajo por el rango del XML cacheado o por el contenido.
  // Emol lista los sub-sitemaps en http:// pero solo responde https://
  // (curl/node fetch fallan con http): se normalizan antes del fetch.
  const fixProto = (u) => conf.forceHttps && /^http:\/\//i.test(u) ? `https://${u.slice(7)}` : u;
  for (const u of discovered) {
    const res = await expandIndex(u, opts);
    if (res.ok && res.isIndex) {
      for (let sub of res.urls) {
        sub = fixProto(sub);
        if (!isArticleSitemap(sub)) {
          logInfo(`descartado (no es articulo): ${sub.replace('https://', '')}`);
          continue;
        }
        if (since && sitemapUrlInWindow(sub, sinceObj) === false) {
          urlFiltered++;
          continue;
        }
        flat.push(sub);
      }
    } else if (res.ok) {
      if (!isArticleSitemap(u)) {
        logInfo(`descartado (no es articulo): ${u.replace('https://', '')}`);
        continue;
      }
      if (since && sitemapUrlInWindow(u, sinceObj) === false) {
        urlFiltered++;
        continue;
      }
      flat.push(u);
    } else {
      failed++;
      logWarn(`Sitemap inaccesible: ${u} (${res.status ?? 'error'})`);
    }
  }
  const uniqueFlat = [...new Set(flat)];
  logInfo(`${uniqueFlat.length} sitemap(s) a descargar`);

  // Modo merge (default): cargar lo existente para NO perder nada.
  const medioDir = join(SITEMAPS_DIR, medio);
  mkdirSync(medioDir, { recursive: true });
  const years = replace ? {} : loadExistingJsonl(medioDir);
  let added = 0;      // URLs nuevas
  let upgraded = 0;   // títulos mejorados (news > slug > ninguno)
  let kept = 0;       // entradas existentes sin cambios
  const dirty = new Set(); // años con cambios (solo se reescriben estos)
  const seen = new Set(); // URLs vistas en este run (dedupe del parse y --limit)
  let fromCache = 0;

  // Descargar y parsear cada sub-sitemap
  for (const [i, u] of uniqueFlat.entries()) {
    const key = slugify(u.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 80));
    // --since: si la URL no lleva fecha (caso Yoast post-sitemapN, Arc XP
    // ?from=N, Prontus), mirar el rango de fechas del XML ya cacheado: si es
    // puramente histórico se omite sin re-descargar (los sitemaps se ordenan
    // nuevo→viejo, así que el máximo de los primeros bloques basta).
    if (since && cacheDir && !noCache && sitemapUrlDate(u) === null) {
      const cachedPath = join(cacheDir, `${key}.xml`);
      if (existsSync(cachedPath)) {
        const maxDate = peekCachedMaxDate(cachedPath);
        if (maxDate && maxDate < since) {
          cacheFiltered++;
          logInfo(`[${i + 1}/${uniqueFlat.length}] omitido (caché sin URLs recientes): ${u.replace('https://', '')}`);
          continue;
        }
      }
    }
    const res = await fetchText(u, { cacheKey: key, cacheDir, fresh, staleHours, noCache });
    if (!res.ok) {
      failed++;
      logWarn(`[${i + 1}/${uniqueFlat.length}] no descargable: ${u} (${res.status ?? res.error})`);
      continue;
    }
    if (res.fromCache) fromCache++;
    // Incremental: un sub-sitemap servido desde caché fresco ya fue capturado
    // en un sync anterior (solo expiran los que cambian, ej. news-sitemaps).
    if (incremental && res.fromCache && !fresh) {
      logInfo(`[${i + 1}/${uniqueFlat.length}] omitido (caché, ya sincronizado): ${u.replace('https://', '')}`);
      continue;
    }
    if (/<sitemapindex[\s>]/i.test(res.text)) {
      // Doble nivel (index dentro de index): expandir recursivamente
      for (const sub of extractSitemapIndexLocs(res.text).map(fixProto)) {
        if (since && sitemapUrlInWindow(sub, sinceObj) === false) {
          urlFiltered++;
          continue;
        }
        if (!uniqueFlat.includes(sub)) uniqueFlat.push(sub);
      }
      continue;
    }
    // Fecha de fallback desde el path del sub-sitemap (ej. CNN: YYYY/MM).
    const mm = conf.dateFromSitemapPath?.exec(u);
    const pathDate = mm ? `${mm[1]}-${mm[2]}-01` : null;
    const batch = extractPairs(res.text, { pathDate, locDateRe: conf.locDateRe, forceHttps: conf.forceHttps });
    for (const e of batch) {
      // Filtro por URL individual (urlRe por medio): sitios cuyo sitemap mezcla
      // artículos con secciones/páginas estáticas (ej. Senado: solo
      // /comunicaciones/noticias/).
      if (conf.urlRe && !conf.urlRe.test(e.loc)) continue;
      const seenBefore = seen.has(e.loc);
      if (!seenBefore) seen.add(e.loc);
      const fecha = isoDate(e.newsDate) ?? e.locDate ?? pathDate ?? isoDate(e.lastmod);
      if (!fecha) continue;
      // --since: las entradas anteriores a la ventana no se tocan (ni se
      // agregan ni se mejoran sus títulos). En modo merge lo existente se
      // conserva intacto; solo se actualiza lo reciente.
      if (since && fecha < since) {
        entriesFiltered++;
        continue;
      }
      const tSlug = e.newsTitle ? null : titleFromSlug(e.loc);
      const entry = {
        u: e.loc,
        d: fecha,
        ...(e.newsTitle ? { t: e.newsTitle, s: 'news' } : {}),
        ...(tSlug ? { t: tSlug, s: 'slug' } : {}),
      };
      const year = fecha.slice(0, 4);
      const map = years[year] ??= new Map();
      const prev = map.get(e.loc);
      if (!prev) {
        map.set(e.loc, entry);
        added++;
        dirty.add(year);
      } else if (titleQuality(entry) > titleQuality(prev) ||
                 // Medios con dateFromSitemapPath (CNN): el lastmod puede ser
                 // la fecha de regeneración (falsa); si la fecha derivada del
                 // path del sub-sitemap difiere, se actualiza (más confiable).
                 (conf.dateFromSitemapPath && entry.d !== prev.d)) {
        // Mejora real de título (ej. ahora el news-sitemap trae el real):
        // se actualiza sin borrar la URL. IMPORTANTE: esto puede ocurrir
        // aunque la URL ya se haya visto en OTRO sub-sitemap del mismo run
        // (ej. El Mostrador lista la misma URL en sitemap.xml sin título y
        // en sitemap_news.xml con título real).
        map.set(e.loc, entry);
        upgraded++;
        dirty.add(year);
      } else {
        kept++;
      }
      if (limit && seen.size >= limit) break;
    }
    logInfo(`[${i + 1}/${uniqueFlat.length}] ${u.replace('https://', '')}: ${batch.length} urls`);
    if (limit && seen.size >= limit) break;
    // Rate-limit cortés entre sub-sitemaps (solo si hubo descarga real;
    // los hits de caché no necesitan espera). Ver `--no-delay`/`--delay`.
    if (!res.fromCache && delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }

  // Escribir solo los años con cambios (o todos en --replace)
  const yearKeys = replace ? Object.keys(years) : [...dirty];
  let written = 0;
  for (const year of yearKeys.sort((a, b) => b.localeCompare(a))) {
    const list = [...years[year].values()].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.u.localeCompare(b.u)));
    const file = join(medioDir, `${year}.jsonl`);
    const lines = list.map((e) => JSON.stringify(e));
    writeFileSync(file, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
    written += lines.length;
  }
  // En --replace: limpiar archivos de años que ya no tienen entradas.
  // (En modo merge esto NUNCA ocurre: lo que no se re-parsea se conserva.)
  if (replace && existsSync(medioDir)) {
    for (const f of readdirSync(medioDir)) {
      if (/^\d{4}\.jsonl$/.test(f) && !years[f.slice(0, 4)]) {
        writeFileSync(join(medioDir, f), '', 'utf8');
      }
    }
  }

  const total = Object.values(years).reduce((acc, m) => acc + m.size, 0);
  logOk(`${conf.nombre}: ${total} artículos totales (+${added} nuevos, ${upgraded} títulos mejorados, ${kept} sin cambios; ${fromCache} desde caché)`);
  if (since) {
    logOk(`   └ ventana --since ${since}: ${urlFiltered} sub-sitemap(s) históricos filtrados por URL, ${cacheFiltered} omitidos por caché, ${entriesFiltered} entradas fuera de ventana no tocadas`);
  }
  if (failed > 0) {
    logWarn(`   └ ${failed} endpoint(s) fallaron; ultima_sync no avanzará para ${conf.nombre}.`);
  }
  if (limit) {
    logWarn(`   └ --limit ${limit} puede truncar el recorrido; ultima_sync no avanzará para ${conf.nombre}.`);
  }
  return { medio, nombre: conf.nombre, urls: total, added, upgraded, kept, fromCache, failed, complete: failed === 0 && !limit, years: Object.keys(years).length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  // Los argumentos posicionales excluyen los valores de flags con parámetro
  // (--limit N, --stale N) para que no se confundan con slugs de medios.
  const flagWithValue = new Set(['--limit', '--stale', '--delay', '--since', '--days']);
  const posArgs = args.filter((a, i) => {
    if (a.startsWith('--')) return false;
    return !flagWithValue.has(args[i - 1]);
  });

  if (flags.has('--list')) {
    logInfo('Medios registrados:');
    for (const [slug, conf] of Object.entries(MEDIA)) {
      logInfo(`  ${slug.padEnd(14)} ${conf.nombre}`);
    }
    return;
  }

  const fresh = flags.has('--fresh');
  const noCache = flags.has('--no-cache');
  const staleHours = parseInt(args[args.indexOf('--stale') + 1] ?? '24', 10) || 24;
  const limit = parseInt(args[args.indexOf('--limit') + 1] ?? '0', 10) || 0;
  const noDelay = flags.has('--no-delay');
  const delayRaw = parseInt(args[args.indexOf('--delay') + 1] ?? '300', 10);
  const delayMs = noDelay ? 0 : (Number.isNaN(delayRaw) ? 300 : delayRaw);
  const incremental = flags.has('--incremental');
  const replace = flags.has('--replace');
  const sinceLastSync = flags.has('--since-last-sync');

  if (sinceLastSync && (flags.has('--since') || flags.has('--days'))) {
    logErr('--since-last-sync no se puede combinar con --since ni --days.');
    process.exit(1);
  }

  // --since <YYYY-MM-DD> / --days <n>: ventana temporal para sincronizar solo
  // lo reciente (ver comentario de cabecera). --replace + ventana borraría la
  // historia completa de los años fuera de la ventana, así que se rechaza.
  let since = null;
  if (flags.has('--since')) {
    const raw = args[args.indexOf('--since') + 1] ?? '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      logErr('--since requiere una fecha YYYY-MM-DD (ej. --since 2026-08-01)');
      process.exit(1);
    }
    since = raw;
  } else if (flags.has('--days')) {
    const n = parseInt(args[args.indexOf('--days') + 1] ?? '7', 10);
    const days = Number.isNaN(n) || n < 1 ? 7 : n;
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    since = d.toISOString().slice(0, 10);
    logInfo(`Ventana temporal: últimos ${days} día(s) (desde ${since})`);
  }
  if ((since || sinceLastSync) && replace) {
    logErr('--since/--days/--since-last-sync no es compatible con --replace (borraría la historia). Usa el modo merge por defecto o --incremental.');
    process.exit(1);
  }

  const targets = flags.has('--all') ? Object.keys(MEDIA) : posArgs;
  if (targets.length === 0) {
    logErr('Indica un medio (slug) o usa --all. Ver `--list` para los medios.');
    process.exit(1);
  }
  for (const t of targets) {
    if (!MEDIA[t]) {
      logErr(`Medio desconocido: ${t}. Usa --list para ver los registrados.`);
      process.exit(1);
    }
  }

  const cacheDir = noCache ? null : CACHE_DIR;
  const results = [];
  const opts = { cacheDir, fresh, staleHours, noCache, limit, delayMs, incremental, replace, since };
  // Snapshot ANTES del loop: `ultima_sync` se actualiza al final de cada medio y
  // no debe cambiar el cutoff de los medios siguientes.
  const manifestBefore = readManifest();
  for (const t of targets) {
    const targetSince = sinceLastSync ? lastSyncSince(manifestBefore, t) : since;
    if (sinceLastSync) {
      if (targetSince) {
        logInfo(`Ventana desde la última sync de ${MEDIA[t].nombre}: ${targetSince} (inclusive)`);
      } else {
        logWarn(`${MEDIA[t].nombre}: sin ultima_sync válida; se sincronizará completo.`);
      }
    }
    const r = await syncMedio(t, MEDIA[t], { ...opts, since: targetSince });
    results.push(r);
    // Update atómico y serializado POR MEDIO: si otro proceso sincroniza otro
    // medio en paralelo, el lock + read-modify-write conserva ambas entradas.
    const failed = r.failed ?? 0;
    const complete = r.complete ?? failed === 0;
    await updateManifest((m) => {
      m.medios ??= {};
      const now = new Date().toISOString();
      const previous = m.medios[t] ?? {};
      // `ultima_sync` es un watermark de cobertura, no solo de intento: si un
      // endpoint falló o --limit truncó el recorrido, no se avanza. Así el próximo
      // --since-last-sync reintenta desde la última ventana realmente completa.
      m.medios[t] = {
        nombre: MEDIA[t].nombre,
        ultima_sync: complete ? now : (previous.ultima_sync ?? null),
        articulos: r.urls ?? previous.articulos ?? 0,
        nuevos: r.added ?? 0,
        años: r.years ?? previous.años ?? 0,
      };
      m.actualizado = now;
    });
  }

  console.log('\n=== Resumen ===');
  for (const r of results) {
    if (r.urls == null) {
      console.log(`  ${r.nombre}: sincronización incompleta; estado anterior conservado`);
      continue;
    }
    const warning = r.complete === false
      ? `; ${r.failed ? `${r.failed} endpoint(s) fallaron` : 'recorrido incompleto'}, ultima_sync conservada`
      : '';
    console.log(`  ${r.nombre}: ${r.urls} artículos en ${r.years} año(s) (+${r.added ?? 0} nuevos)${warning}`);
  }
}

// Guard: solo ejecuta el flujo principal si se corre directo (no al importar),
// para que otros scripts (ej. sitemaps-index.mjs) puedan leer el registro MEDIA.
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

export { MEDIA, isoDate, lastSyncSince, sitemapUrlDate, sitemapUrlInWindow, peekCachedMaxDate };
