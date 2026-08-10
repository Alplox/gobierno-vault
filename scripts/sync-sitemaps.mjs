#!/usr/bin/env node
/**
 * sync-sitemaps.mjs — Sincroniza el catálogo de artículos de prensa
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

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITEMAPS_DIR = join(ROOT, 'sitemaps');
const CACHE_DIR = join(SITEMAPS_DIR, '.cache');
const MANIFEST_PATH = join(SITEMAPS_DIR, '_manifest.json');

const COMMON_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Registro de medios. Cada entrada define cómo descubrir sus sitemaps:
//   robots  → leer el robots.txt y parsear líneas "Sitemap:"
//   index   → URL directa del sitemap index (o del sitemap único)
//   extra   → sitemaps adicionales que no están en robots.txt (opcional)
// ---------------------------------------------------------------------------
const MEDIA = {
  elclarin: {
    nombre: 'El Clarín',
    index: 'https://www.elclarin.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: solo post-sitemap* / news-sitemap*
  },
  biobiochile: {
    nombre: 'Radio Bío Bío',
    robots: 'https://www.biobiochile.cl/robots.txt',
  },
  cooperativa: {
    nombre: 'Cooperativa',
    robots: 'https://www.cooperativa.cl/robots.txt',
  },
  adnradio: {
    nombre: 'ADN Radio',
    index: 'https://www.adnradio.cl/arc/outboundfeeds/sitemap/?outputType=xml',
  },
  factchecking: {
    nombre: 'Factchecking.cl',
    index: 'https://factchecking.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap + descarta page/category/author/gp_*
  },
  ciper: {
    nombre: 'CIPER Chile',
    index: 'https://www.ciperchile.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: solo post-sitemap* (descarta newsletters, radar, etc.)
  },
  theclinic: {
    nombre: 'The Clinic',
    index: 'https://www.theclinic.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elmostrador: {
    nombre: 'El Mostrador',
    robots: 'https://www.elmostrador.cl/robots.txt',
  },
  fastcheck: {
    nombre: 'Fast Check CL',
    index: 'https://www.fastcheck.cl/sitemap.xml',
    // Sitemap custom (no Yoast): index → posts-YYYY.xml (artículos) +
    // news.xml (títulos reales). Se descartan pages/categories/authors.xml.
    includeRe: /(?:posts-\d{4}|news)\.xml$/i,
  },
  latercera: {
    nombre: 'La Tercera',
    robots: 'https://www.latercera.com/robots.txt',
    // Arc XP: robots declara sitemap-index (paginado por from=N, 100 URLs
    // por sub-sitemap, ~10.000 artículos) + news-sitemap-index (títulos
    // reales, últimos ~400 artículos) + sitemap único. Los `<loc>` del index
    // llegan con `&amp;` que extractSitemapIndexLocs decodifica a `&`.
  },
  cnnchile: {
    nombre: 'CNN Chile',
    robots: 'https://www.cnnchile.com/robots.txt',
    // CMS propio: sitemap_index.xml (sub-sitemaps por mes desde 2011) +
    // sitemap_lasts.xml (últimos artículos) + sitemap_news.xml (títulos).
    // OJO: los sub-sitemaps mensuales regeneran el <lastmod> a la fecha del
    // crawl (uniforme y falso: todos los artículos de 2011-2026 salen con la
    // misma fecha). La fecha real del artículo está en el path YYYY/MM del
    // sub-sitemap, así que se usa como fallback (dateFromSitemapPath).
    dateFromSitemapPath: /_files\/sitemaps\/(\d{4})\/(\d{2})\.xml$/,
  },
  eldinamo: {
    nombre: 'El Dínamo',
    robots: 'https://www.eldinamo.cl/robots.txt',
    // Mismo CMS que CNN Chile: index por mes desde 2010 + lasts + news.
  },
  radio_uchile: {
    nombre: 'Radio Universidad de Chile',
    index: 'https://radio.uchile.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml + news-sitemap*.xml
  },
  el_siglo: {
    nombre: 'El Siglo',
    index: 'https://elsiglo.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (canónico sin www)
  },
  la_nacion: {
    nombre: 'La Nación',
    index: 'https://www.lanacion.cl/sitemap_index.xml',
    articleOnly: true, // Yoast
  },
  ex_ante: {
    nombre: 'Ex-Ante',
    index: 'https://www.ex-ante.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (post-sitemap1.xml; el robots.txt no declara sitemaps)
  },
  el_periodista: {
    nombre: 'El Periodista',
    index: 'https://www.elperiodista.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (mezcla http/https en los <loc>)
  },
  meganoticias: {
    nombre: 'Meganoticias',
    robots: 'https://www.meganoticias.cl/robots.txt',
    // CMS propio: sitemap-noticias-index-content.xml (index mensual por
    // content-noticias/sitemap-YYYY-MM.xml desde 2011) + sitemap-news.xml
    // (títulos reales). Se descartan videos, secciones, autores, columnistas,
    // seccion-temas y hemeroteca (páginas de listado, no artículos).
    // OJO: los sub-sitemaps mensuales no traen lastmod fiable; la fecha real
    // está en el path YYYY-MM del archivo (dateFromSitemapPath).
    includeRe: /(?:content-noticias\/sitemap-\d{4}-\d{2}\.xml|sitemap-news\.xml)$/i,
    dateFromSitemapPath: /content-noticias\/sitemap-(\d{4})-(\d{2})\.xml$/,
  },
  eldesconcierto: {
    nombre: 'El Desconcierto',
    robots: 'https://eldesconcierto.cl/robots.txt',
    // Sitemaps SIN historia: sitemap.xml (~8 recientes) + sitemap-news.xml
    // (~20 con títulos reales de los últimos días). No hay índices por año
    // (todas las variantes históricas devuelven 404).
  },
  publimetro: {
    nombre: 'Publimetro',
    index: 'https://www.publimetro.cl/arc/outboundfeeds/sitemap-index/?outputType=xml',
    // Arc XP: el índice solo lista `latest` + el día actual (sin paginación
    // histórica). Existen sitemaps por fecha (`/sitemap/YYYY-MM-DD/`) con
    // decenas de URLs, pero no hay índice que los enumere: el sync captura
    // lo reciente (latest).
  },
};

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
  const m = String(value).match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
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

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return { version: 1, descripcion: '', actualizado: null, medios: {} };
  }
}

function writeManifest(manifest) {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
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
    if (!res.ok) return { ok: false, text: '', status: res.status };
    const text = await res.text();
    if (cacheKey && cacheDir && !noCache) {
      mkdirSync(cacheDir, { recursive: true });
      writeFileSync(join(cacheDir, `${cacheKey}.xml`), text, 'utf8');
    }
    return { ok: true, text, fromCache: false, status: res.status };
  } catch (err) {
    return { ok: false, text: '', status: 0, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Parseo de XML con regex (sin dependencias, patrón del proyecto)
// ---------------------------------------------------------------------------
function extractPairs(xml, { pathDate = null } = {}) {
  // Devuelve [{loc, lastmod, newsTitle, newsDate}] por bloque <url>...</url>
  // pathDate: fecha derivada del nombre del sub-sitemap (YYYY-MM-01) para
  // medios cuyo <lastmod> es la fecha de regeneración y no la del artículo
  // (ver cnnchile/dateFromSitemapPath). Prevalencia: newsDate (real, con
  // día) > pathDate (mes del sitemap) > lastmod (puede ser falso/uniforme).
  const out = [];
  const blockRe = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = blockRe.exec(xml)) !== null) {
    const block = m[1];
    const loc = block.match(/<loc>([\s\S]*?)<\/loc>/i)?.[1]?.trim();
    if (!loc) continue;
    const lastmod = block.match(/<lastmod>([\s\S]*?)<\/lastmod>/i)?.[1]?.trim() || null;
    // El prefijo del namespace news varía por medio: `<news:title>` (estándar,
    // FastCheck/Cooperativa) o `<n:title>` (El Mostrador). Se restringe a esos
    // dos prefijos a propósito: un regex genérico `[\w-]+` capturaría también
    // `<image:title>`/`<video:title>` de las extensiones de sitemap, marcando
    // títulos de imágenes como `s:"news"` (dato de calidad incorrecto).
    const newsTitle = block.match(/<(?:news|n):title>([\s\S]*?)<\/(?:news|n):title>/i)?.[1] || null;
    const newsDate = block.match(/<(?:news|n):publication_date>([\s\S]*?)<\/(?:news|n):publication_date>/i)?.[1] || null;
    out.push({ loc, lastmod, newsTitle: newsTitle ? cleanText(newsTitle) : null, newsDate });
  }
  return out;
}

function extractSitemapIndexLocs(xml) {
  // Devuelve las URLs de los sub-sitemaps de un sitemap index.
  // Se decodifican entidades XML (`&amp;` → `&`): Arc XP (La Tercera, ADN)
  // pagina sus sub-sitemaps con `?outputType=xml&amp;from=100`, que sin
  // decodificar devolvería 404 al fetchear.
  const out = [];
  const re = /<loc>([\s\S]*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) out.push(decodeEntities(m[1].trim()));
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
  const { cacheDir, fresh, staleHours, noCache, limit, delayMs, incremental, replace } = opts;
  logInfo(`=== Sincronizando ${conf.nombre} (${medio}) ===`);

  const discovered = await discoverSitemapUrls(medio, conf, opts);
  if (discovered.length === 0) {
    logWarn(`${conf.nombre}: no se encontraron sitemaps.`);
    return { medio, nombre: conf.nombre, urls: 0, fromCache: 0 };
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
  for (const u of discovered) {
    const res = await expandIndex(u, opts);
    if (res.ok && res.isIndex) {
      for (const sub of res.urls) {
        if (!isArticleSitemap(sub)) {
          logInfo(`descartado (no es articulo): ${sub.replace('https://', '')}`);
          continue;
        }
        flat.push(sub);
      }
    } else if (res.ok) {
      if (!isArticleSitemap(u)) {
        logInfo(`descartado (no es articulo): ${u.replace('https://', '')}`);
        continue;
      }
      flat.push(u);
    } else {
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
    const res = await fetchText(u, { cacheKey: key, cacheDir, fresh, staleHours, noCache });
    if (!res.ok) {
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
      for (const sub of extractSitemapIndexLocs(res.text)) {
        if (!uniqueFlat.includes(sub)) uniqueFlat.push(sub);
      }
      continue;
    }
    // Fecha de fallback desde el path del sub-sitemap (ej. CNN: YYYY/MM).
    const mm = conf.dateFromSitemapPath?.exec(u);
    const pathDate = mm ? `${mm[1]}-${mm[2]}-01` : null;
    const batch = extractPairs(res.text, { pathDate });
    for (const e of batch) {
      const seenBefore = seen.has(e.loc);
      if (!seenBefore) seen.add(e.loc);
      const fecha = isoDate(e.newsDate) ?? pathDate ?? isoDate(e.lastmod);
      if (!fecha) continue;
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
  return { medio, nombre: conf.nombre, urls: total, added, upgraded, kept, fromCache, years: Object.keys(years).length };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  // Los argumentos posicionales excluyen los valores de flags con parámetro
  // (--limit N, --stale N) para que no se confundan con slugs de medios.
  const flagWithValue = new Set(['--limit', '--stale', '--delay']);
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
  const opts = { cacheDir, fresh, staleHours, noCache, limit, delayMs, incremental, replace };
  for (const t of targets) {
    const r = await syncMedio(t, MEDIA[t], opts);
    results.push(r);
    // Escribir el manifest POR MEDIO (read-modify-write): si otro proceso
    // sincroniza otro medio en paralelo, su entrada no se pisa (los JSONL de
    // cada medio ya quedaron escritos por syncMedio). Sin esto, dos syncs
    // simultáneos perdían las entradas del manifest del que terminaba primero
    // (los JSONL quedaban, el estado se perdía).
    const m = readManifest();
    m.medios[t] = {
      nombre: MEDIA[t].nombre,
      ultima_sync: new Date().toISOString(),
      articulos: r.urls,
      nuevos: r.added ?? 0,
      años: r.years,
    };
    m.actualizado = new Date().toISOString();
    writeManifest(m);
  }

  console.log('\n=== Resumen ===');
  for (const r of results) {
    console.log(`  ${r.nombre}: ${r.urls} artículos en ${r.years} año(s) (+${r.added ?? 0} nuevos)`);
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

export { MEDIA };
