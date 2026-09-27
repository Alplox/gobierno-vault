#!/usr/bin/env node
/**
 * add-source.mjs — Genera una fuente para `src/content/sources/<id>.md` (markdown, Obsidian)
 * a partir de una URL, extrayendo titulo, autor y fecha automaticamente.
 * La fuente de verdad es `src/content/sources/<id>.md` (markdown, Obsidian).
 *
 * Uso:
 *   pnpm run add-source -- https://www.latercera.com/articulo/...
 *   pnpm run add-source -- --append https://www.t13.cl/noticia/...
 *   pnpm run add-source            (pregunta interactiva por la URL)
 *   pnpm run add-source -- --search "reforma previsional"   (busca en el catálogo)
 *
 * Flags:
 *   --append   Crea `src/content/sources/<id>.md` directamente (sin colisión, evita editar monolito)
 *   --mirror   Fuerza el uso del espejo r.jina.ai aunque el HTML directo responda *   --verify   Si el origen responde 404/410, exige confirmación para continuar
 *   --catalog-only  No hace fetch web: usa los datos del catálogo de sitemaps
 *                   (título/fecha/medio) si la URL está indexada
 *   --search <texto>  Busca en el catálogo local de sitemaps (título/URL/fecha)
 *                   y deja elegir un artículo; con --fecha y --medio filtra más
 *   --fecha YYYY-MM-DD  Filtro de fecha para --search
 *   --medio <slug>     Filtro de medio para --search (elclarin, biobiochile,
 *                   cooperativa, adnradio, factchecking, ciper, theclinic,
 *                   elmostrador, fastcheck, latercera, cnnchile, eldinamo,
 *                   radio_uchile, el_siglo, la_nacion, ex_ante, el_periodista,
 *                   elfiltrador, meganoticias, eldesconcierto, publimetro)
 *
 * Notas:
 * - Antes de hacer fetch, consulta el catálogo de sitemaps (si existe): si la
 *   URL ya está indexada, pre-carga título/fecha/medio y puede saltarse la red.
 */

import { readFileSync, appendFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import YAML from 'yaml';
import { MEDIA, mediaHosts } from '../sitemaps/media.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SOURCES_MD_DIR = join(ROOT, 'src', 'content', 'sources');

const MIRROR_PREFIXES = {
  jina: 'https://r.jina.ai/',
  paywallskip: 'https://www.paywallskip.com/article?url=',
};

const COMMON_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Herramientas de terminal
// ---------------------------------------------------------------------------
let rl = readline.createInterface({ input, output });
let stdinEnded = false;
// Si el stdin llega a EOF (entrada piped que se agota), las preguntas
// restantes devuelven el default en vez de colgarse o reventar con
// ERR_USE_AFTER_CLOSE. En uso interactivo (terminal) esto no ocurre.
rl.on('close', () => { stdinEnded = true; });

async function ask(question, defaultValue) {
  if (stdinEnded) return defaultValue !== undefined ? String(defaultValue) : '';
  const suffix = defaultValue !== undefined ? ` [${defaultValue}]` : '';
  const answer = (await rl.question(`${question}${suffix}: `)).trim();
  return answer === '' && defaultValue !== undefined ? String(defaultValue) : answer;
}

async function confirm(question, defaultValue = true) {
  const value = await ask(`${question} (s/N)`, defaultValue ? 's' : 'N');
  return /^(s|si|y|yes|true|1)$/i.test(String(value));
}

function log(prefix, text) {
  console.log(`${prefix} ${text}`);
}

function logOk(text) { log('✔️', text); }
function logInfo(text) { log('ℹ️', text); }
function logWarn(text) { log('⚠️', text); }
function logErr(text) { log('❌', text); }


// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------
function decodeEntities(str = '') {
  // No traemos un parser HTML; esto cubre las entidades mas comunes.
  const map = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#39;': "'", '&apos;': "'", '&nbsp;': ' ', '&#x27;': "'",
    '&ndash;': '–', '&mdash;': '—', '&aacute;': 'á', '&eacute;': 'é',
    '&iacute;': 'í', '&oacute;': 'ó', '&uacute;': 'ú', '&ntilde;': 'ñ',
    '&Aacute;': 'Á', '&Eacute;': 'É', '&Iacute;': 'Í', '&Oacute;': 'Ó',
    '&Uacute;': 'Ú', '&Ntilde;': 'Ñ',
  };
  return str.replace(/&[a-zA-Z#0-9]+;/g, (m) => map[m] ?? m);
}

function cleanText(str = '') {
  return decodeEntities(str)
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-–—|:]+/, '')
    .replace(/[\s\-–—|]+$/, '')
    .trim();
}

function slugify(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// Extraccion desde HTML (regex, sin dependencias de parser)
// ---------------------------------------------------------------------------
function getMeta(html, key) {
  const metaRe = /<meta\b[^>]*>/gi;
  let m;
  while ((m = metaRe.exec(html)) !== null) {
    const tag = m[0];
    const hasKey = new RegExp(`(?:property|name|itemprop)=["']${key}["']`, 'i').test(tag);
    if (!hasKey) continue;
    const cm = tag.match(/content=["']([^"']*)["']/i);
    if (cm) return cleanText(cm[1]);
  }
  return null;
}

function extractHtmlTitle(html) {
  const og = getMeta(html, 'og:title') || getMeta(html, 'twitter:title');
  if (og) return og;
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return t ? cleanText(t[1]) : null;
}

function extractHtmlAuthor(html) {
  const candidates = ['author', 'dc.creator', 'article:author', 'parsely-author'];
  for (const c of candidates) {
    const v = getMeta(html, c);
    if (v && v !== '') return cleanText(v);
  }
  const rel = html.match(/rel=["']author["'][^>]*content=["']([^"']*)["']/i);
  return rel ? cleanText(rel[1]) : null;
}

function extractHtmlDate(html) {
  const candidates = [
    'article:published_time', 'datePublished', 'og:updated_time',
    'article:modified_time', 'parsely-pub-date', 'pubdate',
  ];
  for (const c of candidates) {
    const v = getMeta(html, c);
    if (v) {
      const d = parseDate(v);
      if (d) return d;
    }
  }
  const time = html.match(/<time[^>]*datetime=["']([^"']+)["']/i);
  if (time) {
    const d = parseDate(time[1]);
    if (d) return d;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Extraccion desde markdown de espejo (r.jina.ai)
// ---------------------------------------------------------------------------
function extractJina(md) {
  const out = { title: null, author: null, date: null };

  const titleMatch = md.match(/^Title:\s*(.+)$/m);
  if (titleMatch) out.title = cleanText(titleMatch[1]);

  const authorMatch = md.match(/^Author:\s*(.+)$/m);
  if (authorMatch) out.author = cleanText(authorMatch[1]);

  const dateMatch = md.match(/^Published Time:\s*(.+)$/m);
  if (dateMatch) {
    const d = parseDate(dateMatch[1]);
    if (d) out.date = d;
  }

  // Si el remitente no incluyo cabecera, intentar en el cuerpo.
  if (!out.title) {
    const h1 = md.match(/^#\s+(.+)$/m);
    if (h1) out.title = cleanText(h1[1]);
  }
  if (!out.author) {
    const byline = md.match(/^\s*(?:By|Por)\s+(.+)$/m);
    if (byline) out.author = cleanText(byline[1]);
  }
  if (!out.date) {
    const d = parseDate(md.match(/^\d{4}-\d{2}-\d{2}/m)?.[0] ?? '');
    if (d) out.date = d;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Parseo de fechas
// ---------------------------------------------------------------------------
function parseDate(value) {
  if (!value) return null;
  const v = String(value).trim();
  // ISO 2026-07-20 o 2026-07-20T11:00:00Z
  let m = v.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // 20/07/2026 o 20-07-2026 (dia/mes/anio)
  m = v.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  return null;
}


// ---------------------------------------------------------------------------
// Mapeo dominio -> medio
// ---------------------------------------------------------------------------
// Fallback manual host -> nombre de medio, SOLO para dominios sin catálogo
// (sin entrada en MEDIA): lo derivado de MEDIA vía mediaHostNames() ya cubre
// todo lo demás con valores idénticos, así que no se duplica aquí.
// ---------------------------------------------------------------------------
const DEFAULT_DOMAIN_MEDIO = {
  't13.cl': 'T13',
  'lasegunda.com': 'La Segunda',
  'pagina7.cl': 'Página 7',
  'chvnoticias.cl': 'CHV Noticias',
  'camara.cl': 'Cámara de Diputados',
  'pjud.cl': 'Poder Judicial',
  'bcn.cl': 'Biblioteca del Congreso',
  'ine.gob.cl': 'INE',
  'ssff.cl': 'Superintendencia de Seguridad Social',
};

function hostnameOf(url) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

function buildDomainMedioMap() {
  // Base derivada de MEDIA (host -> nombre); DEFAULT la pisa donde coincide
  // (valores idénticos) y aporta dominios fuera del catálogo
  // (t13, lasegunda, pagina7, chvnoticias, camara, pjud, bcn, ine, ssff).
  const map = { ...mediaHostNames(), ...DEFAULT_DOMAIN_MEDIO };
  const mdDir = SOURCES_MD_DIR;
  if (!existsSync(mdDir)) return map;
  for (const f of readdirSync(mdDir).filter(f => f.endsWith('.md'))) {
    try {
      const raw = readFileSync(join(mdDir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) continue;
      const src = YAML.parse(m[1]);
      if (!src?.url || !src?.medio) continue;
      const host = hostnameOf(src.url);
      if (host) map[host] = src.medio;
    } catch {}
  }
  return map;
}

// ---------------------------------------------------------------------------
// Catálogo de sitemaps (índice local de prensa, ver sitemaps/README.md)
// ---------------------------------------------------------------------------
const CATALOG_DIR = join(ROOT, 'sitemaps');

// dominio (sin www) -> slug de medio en el catálogo. Se DERIVA de MEDIA
// (robots/index/extra de ../sitemaps/media.mjs): agregar un medio ahí basta
// para que el lookup lo reconozca, sin editar este archivo.
function mediaHostNames() {
  const out = {};
  for (const slug of Object.keys(MEDIA)) {
    for (const h of mediaHosts(MEDIA[slug])) {
      if (!out[h]) out[h] = MEDIA[slug].nombre;
    }
  }
  return out;
}

// Preferencia explícita donde dos slugs de MEDIA comparten dominio
// (first-wins elegiría el otro; valores del mapa manual anterior).
const CATALOG_HOST_OVERRIDES = {
  'corporacionuteusach-noticias.cl': 'uteusachnoticias',
  'lanacion.cl': 'lanacion',
  'elsiglo.cl': 'elsiglo',
  'lahora.cl': 'lahora',
};

// Dominios de slugs con datos en sitemaps/ pero sin entrada en MEDIA
// (usm, colegiocordillera) o históricos sin sitemap vigente.
const CATALOG_HOST_LEGACY = {
  'elnuevodia.com': 'el_nuevo_dia',
  '3y4alamos.com': 'corporacion_3_y_4_alamos',
  'usm.cl': 'usm',
  'colegiocordillera.cl': 'colegiocordillera',
};

function buildCatalogByDomain() {
  const map = {};
  const owner = {};
  for (const slug of Object.keys(MEDIA)) {
    for (const h of mediaHosts(MEDIA[slug])) {
      if (owner[h] && owner[h] !== slug && !(h in CATALOG_HOST_OVERRIDES)) {
        console.warn(`⚠️  dominio ${h} compartido por ${owner[h]} y ${slug}: agregar a CATALOG_HOST_OVERRIDES`);
      }
      if (!map[h]) {
        map[h] = slug;
        owner[h] = slug;
      }
    }
  }
  return { ...map, ...CATALOG_HOST_OVERRIDES, ...CATALOG_HOST_LEGACY };
}

// dominio -> slug de medio en el catálogo
const CATALOG_MEDIO_BY_DOMAIN = buildCatalogByDomain();

// slug -> nombre de medio. Se DERIVA de MEDIA; LEGACY cubre slugs con datos
// en sitemaps/ o históricos sin entrada en MEDIA.
const CATALOG_MEDIO_LEGACY = {
  'el_nuevo_dia': 'El Nuevo Día',
  'corporacion_3_y_4_alamos': 'Corporación 3 y 4 Álamos',
  'puntal': 'Puntal',
  'tvc': 'TVC',
  'usm': 'USM',
  'uantof': 'Universidad de Antofagasta',
  'colegiocordillera': 'Colegio Cordillera',
};

const CATALOG_MEDIO_NAMES = Object.fromEntries([
  ...Object.entries(MEDIA).map(([slug, cfg]) => [slug, cfg.nombre]),
  ...Object.entries(CATALOG_MEDIO_LEGACY),
]);

function catalogExists() {
  return existsSync(CATALOG_DIR);
}

function catalogMedioForHost(host) {
  return CATALOG_MEDIO_BY_DOMAIN[host] || null;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Normaliza una URL para comparar con las del catálogo (quita hash, params de
// tracking y slash final; minúsculas).
function normalizeUrlForMatch(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    u.hostname = u.hostname.replace(/^www\./i, ''); // el catálogo mezcla www y no-www
    for (const k of [...u.searchParams.keys()]) {
      if (/^(utm_|fbclid|gclid|ref|source|mc_|s|i|p)/i.test(k)) u.searchParams.delete(k);
    }
    return u.toString().replace(/\/+$/, '').toLowerCase();
  } catch {
    return String(url).replace(/\/+$/, '').toLowerCase();
  }
}

// Año candidato dentro de una URL (sirve para acotar la búsqueda).
function yearFromUrl(url) {
  const m = String(url).match(/20\d{2}/);
  return m ? m[0] : null;
}

// Archivos de un medio del catálogo, del año más reciente al más antiguo.
function catalogFilesFor(medio) {
  const dir = join(CATALOG_DIR, medio);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^\d{4}\.jsonl$/.test(f))
    .sort((a, b) => b.localeCompare(a));
}

// Busca una URL exacta en el catálogo. Devuelve { medio, entry, year } o null.
function lookupCatalogUrl(url) {
  if (!catalogExists()) return null;
  const medio = catalogMedioForHost(hostnameOf(url));
  if (!medio) return null;
  const target = normalizeUrlForMatch(url);
  // Pre-filtro barato: si el path no aparece crudo en el archivo, saltar.
  let pathCore = '';
  let pathCoreRe = null;
  try {
    pathCore = new URL(url).pathname.replace(/\/+$/, '').toLowerCase();
    if (pathCore) pathCoreRe = new RegExp(escapeRegExp(pathCore), 'i');
  } catch { /* sin pathCore */ }
  const yearHint = yearFromUrl(url);
  const files = catalogFilesFor(medio);
  const ordered = yearHint
    ? files.filter((f) => f.startsWith(yearHint)).concat(files.filter((f) => !f.startsWith(yearHint)))
    : files;
  for (const f of ordered) {
    const raw = readFileSync(join(CATALOG_DIR, medio, f), 'utf8');
    if (pathCore && !raw.includes(pathCore)) {
      // URLs con mayúsculas en el path (ej. /Deportes/ de emol): el pre-filtro
      // sensible falla aunque el artículo esté indexado. Fallback insensible
      // con regex (evita duplicar el string en memoria: hay JSONL de 307MB).
      if (!pathCoreRe.test(raw)) continue;
    }
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        if (normalizeUrlForMatch(e.u) === target) {
          return { medio, entry: e, year: f.slice(0, 4) };
        }
      } catch { /* línea corrupta: se omite */ }
    }
  }
  return null;
}

// Busca por texto en el catálogo (título/URL/fecha) con filtros opcionales.
// Devuelve hasta MAX_RESULTS resultados; los archivos (años) se recorren del
// más reciente al más antiguo y los medios livianos antes que BioBio.
async function catalogSearchAndPick(query, fechaFilter, medioFilter) {
  const MAX_RESULTS = 25;
  const results = [];
  // BioBio tiene ~1.17M líneas / 307MB: escanearlo completo sin --medio es
  // lento. Los medios livianos van primero (rompe temprano al llenar 25), y
  // BioBio solo se lee si los demás no alcanzaron resultados.
  const heavy = 'biobiochile';
  const medios = medioFilter
    ? [medioFilter]
    : Object.keys(CATALOG_MEDIO_NAMES).filter((m) => m !== heavy).concat(heavy);
  if (!medioFilter) {
    logInfo(`Buscando en todo el catálogo (${Object.keys(CATALOG_MEDIO_NAMES).length} medios). Para acotar usa --medio <slug>.`);
  }
  for (const medio of medios) {
    if (results.length >= MAX_RESULTS) break;
    if (medio === heavy && !medioFilter) {
      logWarn('Escaneando Radio Bío Bío (~307MB); si el término es raro esto puede tardar.');
    }
    const files = catalogFilesFor(medio);
    for (const f of files) {
      if (results.length >= MAX_RESULTS) break;
      const year = f.slice(0, 4);
      if (fechaFilter && year !== fechaFilter.slice(0, 4)) continue;
      let raw;
      try {
        raw = readFileSync(join(CATALOG_DIR, medio, f), 'utf8');
      } catch {
        continue;
      }
      const q = String(query ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        try {
          const e = JSON.parse(line);
          if (fechaFilter && e.d !== fechaFilter) continue;
          if (q) {
            const haystack = `${e.t ?? ''} ${e.u} ${e.d}`
              .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (!haystack.includes(q)) continue;
          }
          results.push({ medio, entry: e, year });
          if (results.length >= MAX_RESULTS) break;
        } catch { /* línea corrupta */ }
      }
    }
  }

  if (results.length === 0) {
    logWarn('Sin resultados en el catálogo. (Para búsquedas exhaustivas usa grep sobre sitemaps/<medio>/<año>.jsonl).');
    return null;
  }
  logOk(`${results.length} resultado(s) en el catálogo de sitemaps:`);
  results.forEach((r, i) => {
    const nombre = CATALOG_MEDIO_NAMES[r.medio] ?? r.medio;
    const titulo = r.entry.t ? ` — ${r.entry.t}` : '';
    console.log(`  [${String(i + 1).padStart(2)}] ${r.entry.d} | ${nombre}${titulo}`);
    console.log(`        ${r.entry.u}`);
  });
  console.log('');
  const pick = await ask('Elegir un artículo (número) o Enter para salir');
  const n = parseInt(pick, 10);
  if (Number.isInteger(n) && n >= 1 && n <= results.length) {
    return results[n - 1];
  }
  return null;
}

// ---------------------------------------------------------------------------
// Fetch con fallback a espejo
// ---------------------------------------------------------------------------
async function fetchText(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'user-agent': COMMON_UA,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'es-CL,es;q=0.9,en;q=0.8',
      },
    });
    if (!res.ok) return { ok: false, text: '', status: res.status };
    return { ok: true, text: await res.text(), status: res.status };
  } catch (err) {
    return { ok: false, text: '', status: 0, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Frontmatter para src/content/sources/<id>.md
// ---------------------------------------------------------------------------
function buildBlock(id, fields) {
  // Frontmatter plano para src/content/sources/<id>.md (mismo formato que --append).
  // El formato antiguo con prefijo `<id>:` era del monolito sources.yaml (eliminado) — no usar.
  void id;
  const fm = YAML.stringify({ tipo: fields.tipo, medio: fields.medio, titulo: fields.titulo, autor: fields.autor, fecha: fields.fecha, url: fields.url, ...(fields.notas ? { notas: fields.notas } : {}) }).trim();
  return `---\n${fm}\n---`;
}


// ---------------------------------------------------------------------------
// Flujo principal
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const flagWithValue = new Set(['--search', '--fecha', '--medio']);
  const urlArg = args.find((a, i) => !a.startsWith('--') && !flagWithValue.has(args[i - 1]));
  // Solo leer el valor de un flag si el flag existe: si `--fecha` no esta,
  // indexOf devuelve -1 y args[0] seria el valor equivocado (bug real).
  const flagValue = (name) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const searchQuery = flagValue('--search');
  const fechaFilter = flagValue('--fecha');
  const medioFilter = flagValue('--medio');
  const catalogOnly = flags.has('--catalog-only');

  logInfo('Generador de fuentes para src/content/sources/*.md');
  logInfo('--------------------------------------');

  // --- Modo búsqueda en el catálogo (grep por fecha/medio) --
  let catalogHit = null;
  let url = urlArg;
  if (flags.has('--search')) {
    if (!catalogExists()) {
      logErr('No existe el catálogo sitemaps/. Corre primero: pnpm run sitemaps-sync -- <medio>');
      rl.close();
      process.exit(1);
    }
    catalogHit = await catalogSearchAndPick(searchQuery, fechaFilter, medioFilter);
    if (!catalogHit) {
      rl.close();
      process.exit(0);
    }
    url = catalogHit.entry.u;
    logOk(`Artículo elegido del catálogo: ${catalogHit.entry.d} (${CATALOG_MEDIO_NAMES[catalogHit.medio] ?? catalogHit.medio})`);
  } else if (!url) {
    url = await ask('Pega la URL del articulo');
    if (!url) {
      logErr('No se ingreso ninguna URL.');
      rl.close();
      process.exit(1);
    }
  }
  if (!/^https?:\/\//i.test(url) && !url.startsWith('http')) {
    url = (await ask('Escribe la URL completa (con http/https)', url)).trim();
  }
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    logErr(`URL invalida: ${url}`);
    rl.close();
    process.exit(1);
  }
  const host = hostnameOf(url);
  if (!host) {
    logErr('No se pudo determinar el dominio de la URL.');
    rl.close();
    process.exit(1);
  }

  // --- Consulta al catálogo de sitemaps (antes del fetch) ---
  if (!catalogHit && catalogExists()) {
    catalogHit = lookupCatalogUrl(url);
  }
  if (catalogHit && catalogHit.entry.t) {
    const fuente = catalogHit.entry.s === 'news' ? 'titulo real' : 'titulo aprox. (slug)';
    logOk(`Indexado en el catálogo de sitemaps (${catalogHit.entry.d}, ${fuente}): ${catalogHit.entry.t}`);
  } else if (catalogHit) {
    logOk(`URL indexada en el catálogo de sitemaps (fecha ${catalogHit.entry.d}).`);
  }

  // --- Fetch (se puede saltar con --catalog-only o si el catálogo ya trae
  // título real; con título aprox. del slug conviene intentar el fetch) -----
  let html = null;
  let jina = null;
  let resolvedUrl = url;
  let directStatus = 0;
  const skipFetch = catalogOnly || (catalogHit && catalogHit.entry.s === 'news');
  if (catalogHit && !skipFetch && catalogHit.entry.t) {
    logInfo('El catálogo solo trae título aproximado (slug). Intentando fetch para el título real...');
  }

  if (!skipFetch && !flags.has('--mirror')) {
    logInfo(`Obteniendo ${url} ...`);
    const res = await fetchText(url);
    directStatus = res.status;
    if (res.ok && /<html[\s>]/i.test(res.text)) {
      html = res.text;
      if (!extractHtmlTitle(html)) {
        logWarn('HTML obtenido pero sin titulo detectable; reintentando con espejo.');
        html = null;
      }
    } else {
      logInfo('El HTML directo no respondio o no es HTML; probando r.jina.ai ...');
    }
  }

  if (!html && !skipFetch) {
    logInfo('Consultando espejo r.jina.ai ...');
    const res = await fetchText(MIRROR_PREFIXES.jina + url);
    if (res.ok && res.text.trim()) {
      jina = res.text;
      const proxied = res.text.match(/URL Source:\s*(\S+)/i);
      if (proxied) resolvedUrl = proxied[1];
    } else {
      logWarn('El espejo r.jina.ai tampoco respondio. Tendras que completar los datos a mano.');
    }
  }

  // --- Extraccion (el catálogo gana si el fetch no aporta) --
  // URL muerta en origen (404/410): el título del espejo/catálogo puede ser
  // de otra página (caso 20260902-7). Siempre se avisa; con --verify se exige
  // confirmación para continuar.
  if (directStatus === 404 || directStatus === 410) {
    logWarn(`La URL origen responde HTTP ${directStatus} (no existe). Verifica el slug antes de crear la fuente.`);
    if (flags.has('--verify') && !(await confirm('La URL no existe en origen. ¿Continuar de todos modos?', false))) {
      process.exit(1);
    }
  }
  let titulo = html ? extractHtmlTitle(html) : null;
  let autor = html ? extractHtmlAuthor(html) : null;
  let fecha = html ? extractHtmlDate(html) : null;

  if (jina) {
    const j = extractJina(jina);
    titulo = titulo || j.title;
    autor = autor || j.author;
    fecha = fecha || j.date;
  }

  if (catalogHit) {
    titulo = titulo || catalogHit.entry.t || null;
    fecha = fecha || catalogHit.entry.d || null;
  }

  // Normalizar la URL a la del articulo original (nunca el espejo).
  if (/^https?:\/\//i.test(resolvedUrl)) url = resolvedUrl;

  // --- Medio ------------------------------------------------
  const domainMedio = buildDomainMedioMap();
  let medio = domainMedio[host] || (catalogHit ? CATALOG_MEDIO_NAMES[catalogHit.medio] : '') || '';
  if (medio) {
    if (!(await confirm(`Se detecto el medio "${medio}" (${host}). Es correcto?`))) {
      medio = await ask('Nombre del medio');
    }
  } else {
    logWarn(`Dominio "${host}" no esta mapeado a un medio.`);
    medio = await ask('Nombre del medio');
  }


  // --- Titulo / autor / fecha editables ---------------------
  if (!titulo) {
    logWarn('No se pudo extraer el titulo. Ingresalo manualmente.');
    titulo = await ask('Titulo del articulo');
  } else {
    logOk(`Titulo extraido: ${titulo}`);
  }
  if (autor) {
    logOk(`Autor extraido: ${autor}`);
  } else {
    logInfo('No se detecto autor. Puedes dejarlo vacio.');
  }
  autor = await ask('Autor (Enter para dejar como esta)', autor || '');

  if (fecha) {
    logOk(`Fecha extraida: ${fecha}`);
  } else {
    logWarn('No se detecto fecha. Ingresala en formato YYYY-MM-DD.');
  }
  fecha = await ask('Fecha (YYYY-MM-DD)', fecha);

  // --- tipo ------------------------------------------------
  const tipos = ['prensa', 'comunicado_oficial', 'documento', 'informe', 'opinion',
    'investigacion', 'red_social', 'entrevista', 'video', 'agencia', 'institucional'];
  logInfo(`Tipos frecuentes: ${tipos.join(', ')}`);
  const tipo = await ask('Tipo', 'prensa');

  // --- ID --------------------------------------------------
  const medioSlug = slugify(medio) || 'medio';
  const tituloSlug = slugify(titulo) || 'noticia';
  const id = `${medioSlug}-${fecha}-${tituloSlug}`;

  const notas = (await ask('Notas (opcional, Enter para omitir)')) || undefined;

  const fields = { tipo, medio, titulo, autor: autor || '', fecha, url, notas };
  const block = buildBlock(id, fields);

  console.log('\n' + '='.repeat(64));
  console.log('BLOQUE GENERADO — frontmatter para src/content/sources/' + id + '.md:');
  console.log('='.repeat(64));
  console.log(block);
  console.log('-'.repeat(64));
  console.log(`Wikilink para usar inline en eventos:  [[sources/${id}]]`);
  console.log('='.repeat(64) + '\n');

  // --- Colision: verificar que el .md no exista ---
  const mdPath = join(SOURCES_MD_DIR, `${id}.md`);
  try {
    if (existsSync(mdPath)) logWarn(`OJO: el ID "${id}" ya existe en ${mdPath}. Revisa antes de crear.`);
  } catch { /* ignorar */ }

  if (flags.has('--append')) {
    if (await confirm(`Crear src/content/sources/${id}.md?`)) {
      mkdirSync(SOURCES_MD_DIR, { recursive: true });
      const fm = YAML.stringify({ tipo: fields.tipo, medio: fields.medio, titulo: fields.titulo, autor: fields.autor, fecha: fields.fecha, url: fields.url, ...(fields.notas ? { notas: fields.notas } : {}) }).trim();
      const md = `---\n${fm}\n---\n`;
      writeFileSync(mdPath, md, 'utf8');
      logOk(`FUENTE CREADA en ${mdPath}`);
    }
  } else {
    logInfo('Para crear src/content/sources/<id>.md automaticamente, vuelve a correr con --append.');
    logInfo('O crea el archivo manualmente con el frontmatter de arriba.');
  }

  rl.close();
}

// Guard: solo ejecuta el flujo principal si se corre directo (no al importar),
// para poder testear las funciones puras del catálogo desde otro módulo.
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
    process.argv[1].replace(/\\/g, '/').toLowerCase();

if (isMain) {
  main().catch((err) => {
    console.error(err);
    rl.close();
    process.exit(1);
  });
}

export {
  normalizeUrlForMatch,
  lookupCatalogUrl,
  catalogSearchAndPick,
  buildBlock,
  catalogExists,
  CATALOG_MEDIO_BY_DOMAIN,
  CATALOG_MEDIO_NAMES,
};

