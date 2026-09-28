#!/usr/bin/env node
/**
 * Sondeo de candidatos a medio del catálogo de sitemaps.
 *
 *   node .agents/skills/sitemaps/scripts/probe-sitemap.mjs <dominio>...
 *   node .agents/skills/sitemaps/scripts/probe-sitemap.mjs --json cahuquenesnet.cl
 *
 * Para cada dominio:
 *   1. Lo cruza contra MEDIA (scripts/sitemaps/media.mjs) y avisa si el dominio
 *      YA está catalogado, con el slug — el alta es por slug, no por dominio, así
 *      que sin este chequeo es fácil crear `lahora` junto a `la_hora`.
 *   2. Lo cruza contra SIN_SITEMAP (watchlist.mjs) e imprime el motivo ya
 *      registrado, para no re-sondear lo que otra tanda ya descartó.
 *   3. Parsea las líneas `Sitemap:` del robots.txt y prueba los endpoints
 *      estándar, informando código, cantidad de <loc>, si es índice o urlset,
 *      una muestra de locs y la firma del CMS.
 *
 * No escribe nada: es solo lectura. El alta se hace en media.mjs y después
 * `pnpm run sitemaps-sync -- <slug>`.
 * Sale con código 1 si algún dominio ya está catalogado o ya fue descartado,
 * para que el flujo no siga en silencio.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Raíz del repo: 4 niveles arriba desde .agents/skills/sitemaps/scripts/.
// Import relativo para que el script funcione en cualquier clon (un import con
// ruta absoluta Windows o file:/// ataría el archivo a una máquina). El
// pathToFileURL es necesario porque en Windows `import()` exige una URL.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const { MEDIA, mediaHosts } = await import(pathToFileURL(join(ROOT, 'scripts/sitemaps/media.mjs')).href);
const { SIN_SITEMAP } = await import(pathToFileURL(join(ROOT, 'scripts/sitemaps/watchlist.mjs')).href);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const TIMEOUT = 12000;

// slug -> dominios declarados en su config
const BY_HOST = new Map();
for (const [slug, cfg] of Object.entries(MEDIA)) {
  for (const h of mediaHosts(cfg)) {
    if (!BY_HOST.has(h)) BY_HOST.set(h, []);
    BY_HOST.get(h).push(slug);
  }
}

const norm = (d) => d.toLowerCase().replace(/^www\./, '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');

async function get(url) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(TIMEOUT) });
    return { status: r.status, text: await r.text() };
  } catch (e) {
    return { status: 0, text: '', error: e.message };
  }
}

const locsOf = (t) => [...t.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));

/** Firma del CMS a partir de los nombres de los sub-sitemaps que declaró. */
function fingerprint(locs) {
  const names = locs.map((u) => u.replace(/^https?:\/\/[^/]+/, '')).join('\n');
  if (/post-sitemap\d*\.xml/.test(names)) return 'Yoast (articleOnly)';
  if (/wp-sitemap-posts-post-\d+\.xml/.test(names)) return 'WP 5.5+ nativo';
  if (/blog-posts-sitemap\.xml/.test(names)) return 'Wix (CPT blog-posts)';
  if (/sitemap_pt-post|posttype-post|pt-post/.test(names)) return 'WP tema con sitemap propio';
  if (/sitemap_pags|sitemap_pags_\d{6}\.xml\.gz/.test(names)) return 'Prontus';
  if (/sitemap-\d+\.xml/.test(names) || /sitemap-\d+\.xml\.gz/.test(names)) return 'Arc XP paginado';
  if (/(?:articles|content-noticias)\/\d{4}-\d{2}\.xml/.test(names)) return 'CMS propio mensual';
  if (/sitemap\d+_\d{4}\.xml/.test(names)) return 'CMS propio por año';
  if (/sitemap\/news\/\d+\/sitemap\.xml/.test(names)) return 'indice paginado de 100';
  if (/sitemap\/sitemap-\d{2}-\d{2}-\d{4}\.xml/.test(names)) return 'indice diario';
  return 'desconocido';
}

async function probeOne(host) {
  const r = { host, enCatalogo: [], descartado: null, robots: [], endpoints: [], cms: null, total: 0 };

  r.enCatalogo = BY_HOST.get(host) ?? [];
  r.descartado = SIN_SITEMAP[host] ?? null;

  // 1) robots.txt
  const rob = await get(`https://${host}/robots.txt`);
  r.robotsStatus = rob.status;
  if (rob.status === 200) {
    r.robots = [...rob.text.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1]);
  }

  // 2) endpoints estándar + los que declaró robots
  const seen = new Set();
  const candidates = [...r.robots, `https://${host}/sitemap.xml`, `https://${host}/sitemap_index.xml`, `https://${host}/wp-sitemap.xml`];
  for (const url of candidates) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const res = await get(url);
    if (!res.status) { r.endpoints.push({ url, status: 0, locs: 0, error: res.error }); continue; }
    const locs = locsOf(res.text);
    const isIndex = /<sitemapindex[\s>]/i.test(res.text);
    r.endpoints.push({ url, status: res.status, locs: locs.length, isIndex, muestra: locs.slice(0, 2) });
    if (res.status === 200 && locs.length) r.cms ??= fingerprint(locs);
  }
  // El mayor número de locs de un urlset plano indica volumen real; un índice
  // con muchas entradas indica paginación (habrá que mirar los hijos).
  r.total = Math.max(0, ...r.endpoints.map((e) => e.locs));
  r.veredicto = r.enCatalogo.length
    ? 'YA CATALOGADO'
    : r.descartado
      ? 'YA DESCARTADO'
      : r.total > 1
        ? 'CANDIDATO'
        : 'sin sitemap util';
  return r;
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const hosts = args.filter((a) => !a.startsWith('--')).map(norm).filter(Boolean);

if (!hosts.length) {
  console.error('uso: probe-sitemap.mjs [--json] <dominio>...');
  process.exit(2);
}

const results = [];
for (const h of hosts) results.push(await probeOne(h));

if (asJson) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const r of results) {
    console.log(`\n=== ${r.host} — ${r.veredicto}`);
    if (r.enCatalogo.length) {
      console.log(`  slug(s) en MEDIA: ${r.enCatalogo.join(', ')}`);
      console.log('  → NO crear otro slug: mejorar el includeRe del existente y resincronizar.');
    }
    if (r.descartado) console.log(`  SIN_SITEMAP: ${r.descartado}`);
    console.log(`  robots.txt [${r.robotsStatus}] → ${r.robots.length ? r.robots.join(' ') : 'sin línea Sitemap'}`);
    for (const e of r.endpoints) {
      const extra = e.locs ? `${e.isIndex ? 'índice' : 'urlset plano'} · ${e.muestra?.join(' ') ?? ''}` : '';
      const err = e.error ? ` (${e.error})` : '';
      console.log(`  ${e.status || 'FALLA'} ${e.url.replace(`https://${r.host}`, '')} → ${e.locs} locs ${extra}${err}`);
    }
    if (r.cms) console.log(`  firma CMS: ${r.cms}`);
    if (r.veredicto === 'CANDIDATO') {
      console.log('  → siguiente paso: leer el sub-sitemap hijo mayor para confirmar artículos y fechas,');
      console.log('    luego agregar a MEDIA y correr `pnpm run sitemaps-sync -- <slug>`.');
    }
  }
}

const conflictos = results.filter((r) => r.enCatalogo.length || r.descartado).length;
process.exit(conflictos ? 1 : 0);
