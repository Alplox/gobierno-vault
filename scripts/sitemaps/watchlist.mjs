// Genera `TAREAS/tareas_sitemap.md`: bitácora de sitios de prensa chilenos pendientes de
// sincronizar su sitemap al catálogo local (sitemaps/<medio>/), para ampliar la
// variedad de puntos de vista al verificar eventos de gobiernos pasados.
//
// Fuentes de datos:
//   - awesome-chilean-rss (https://github.com/Alplox/awesome-chilean-rss):
//     `feeds-database.json` (sites[] con feeds verificados) + `watchlist.json`
//     (sitios candidatos, muchos sin feed RSS). Por defecto se descargan online
//     desde raw.githubusercontent.com; `--source <dir>` fuerza copia local
//     (o `--offline` usa el clone hermano `../awesome-chilean-rss` sin red).
//   - `sitemaps/_manifest.json` (medios ya sincronizados en el catálogo).
//   - `src/content/sources/*.md` (campo `medio:` de las fuentes ya usadas).
//   - `src/content/organizations/*.md` (orgs tipo medio_comunicacion/red_social/etc.).
//
// Solo se listan categorías de prensa y afines (noticias, regional, gobierno,
// radio, partidos, negocios, comunidad, medio ambiente, educación, salud,
// cultura e internacional) y solo la URL del sitio (no los feeds).

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import YAML from 'yaml';
import { MEDIA, mediaHosts } from './media.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

// Categorías de prensa y afines (se excluyen sports, gaming, jobs, entertainment, technology).
const CATEGORIAS_PRENSA = new Set([
  'news', 'news-international', 'regional', 'government', 'radio',
  'political-parties', 'business', 'community', 'environment',
  'education', 'health', 'culture',
]);

// Dominios verificados SIN sitemap utilizable (revisado a mano): no se
// reintentan en cada regeneración. Incluye sitemaps existentes pero no
// catalogables como prensa. Key: dominio, value: nota.
// Exportado para que scripts/probe-sitemap.mjs pueda avisar "ya descartado por X"
// sin volver a sondear el dominio.
export const SIN_SITEMAP = {
  'efe.cl': 'verificado sin sitemap (solo RSS /feed/)',
  'fiscaliadechile.cl': 'verificado sin sitemap (Drupal 10 sin xmlsitemap)',
  'pjud.cl': 'verificado sin sitemap (robots.txt 404)',
  'ssff.cl': 'verificado sin sitemap (robots.txt 404)',
  'chvnoticias.cl': 'verificado sin sitemap (todos los endpoints devuelven la home)',
  'bcn.cl': 'sitemap de portal con ~70k sub-sitemaps (normas LeyChile, no prensa) — no catalogable',
  // Intentos previos documentados en scripts/sitemaps/media.mjs (flat urlset /
  // DNS / 450 / 403 / 0 artículos): no reintentar. Solo dominios hoy ⬜ —
  // jamás 🟡 (la referencia en el vault tiene precedencia).
  'radiocamara.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'subturismo.gob.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'minmujeryeg.gob.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'sence.gob.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'sernac.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'ispch.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'chilenafm.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'chilenoticias.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'codeff.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'inach.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'meteored.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'utalca.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'ufro.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'udp.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'pcchile.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'pdc.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'ppd.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'democratas.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'elsancarlino.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'elurbanorural.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'frutillarhoy.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'guardiandelsur.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'lanoticia.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'pautalosrios.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'primeranota.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'pucontv.com': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'ladiscusion.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'datossur.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'eltrabajo.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'elregional.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'elprovincial.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'aricaldia.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'antofagasta.tv': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'diariosol.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'linaresnoticia.cl': 'DNS ENOTFOUND (verificado)',
  'aqua.cl': 'DNS ENOTFOUND (verificado)',
  'cobquecura.cl': 'verificado sin artículos en el catálogo',
  'inoticias.cl': 'verificado sin artículos en el catálogo',
  'ellanquihue.cl': 'verificado sin artículos en el catálogo',
  'estrellaantofagasta.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'laestrellachiloe.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'estrellaloa.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'mercurioantofagasta.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'mercuriocalama.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'australosorno.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'australtemuco.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'elamaule.cl': 'HTTP 403 Cloudflare (verificado)',
  // ── Descartes de las tandas 16-19 (28 y 27-09-2026) ────────────────────────
  // Regla: TODO medio que se descarte después de sondearlo se anota acá con su
  // motivo, para que la fila pase a 🔒 y no se reintente en cada regeneración.
  // La nota debe decir qué se verificó, no solo "no sirve".
  // Batch 16:
  'lun.com': 'robots.txt (en www) 200 sin línea Sitemap y con `Googlebot: Disallow: /`; el apex falla el handshake TLS (verificado 28-09-2026)',
  'elmatutino.cl': '/sitemap.xml es un urlset de 1 loc (la home)',
  'noticiasimportantes.cl': '/sitemap.xml responde 0 locs (declarado en robots)',
  'sancarlosaldia.cl': 'robots declara /sitemap.xml pero responde HTTP 404',
  'diarioelcondor.cl': 'wp-sitemap.xml solo declara posts-page + taxonomías, sin posts',
  'eldiariodecuracavi.cl': 'wp-sitemap con un único post-sitemap residual',
  'm360.cl': 'DNS fail al pedir /noticias/sitemap_pags.xml (declarado en robots)',
  // Batch 17:
  'davidnoticias.cl': 'índice de 1.292 shards íntegramente SEO spam (?id=link-slot*), sin un solo artículo',
  'radiocristalina.cl': 'wp-sitemap con un solo shard wp-sitemap-posts-post-1.xml',
  'radioaustralvaldivia.cl': 'wp-sitemap con shards de posts residuales; radio sin volumen',
  'radioguayacan.cl': 'robots.txt vacío (0 bytes), sin sitemap',
  'radiobuenanueva.cl': 'robots.txt 404, sin sitemap',
  'diariolaguino.cl': '/sitemap.xml es un urlset plano de 180 páginas, sin artículos',
  'diarioriobueno.cl': '/sitemap.xml es un urlset plano de 180 páginas, sin artículos',
  'diariolanco.cl': '/sitemap.xml es un urlset plano de 180 páginas, sin artículos',
  'diariomafil.cl': '/sitemap.xml es un urlset plano de 180 páginas, sin artículos',
  'ceinoticias.cl': 'DNS ENOTFOUND (verificado 27-09-2026)',
  'estrellavalpo.cl': 'DNS ENOTFOUND (verificado 27-09-2026)',
  // Batch 18:
  'werken.cl': 'índice plano de ~90 artículos (temática mapuche), sin paginación',
  'chilenews.cl': '/sitemap.xml es un urlset plano de 100 URLs',
  'laopiniononline.cl': 'wp-sitemap con shards de posts residuales (volumen bajo)',
  'montealegre.cl': 'wp-sitemap con shards de posts residuales (volumen bajo)',
  'laliguanoticias.cl': 'wp-sitemap con shards de posts residuales (volumen bajo)',
  'angelino.cl': 'wp-sitemap con shards de posts residuales (volumen bajo)',
  'prensacurico.cl': 'los 4 endpoints WP (wp-sitemap/sitemap_index/sitemap) devuelven 0 locs',
  'maulealdia.cl': 'los 4 endpoints WP devuelven 0 locs',
  'quintainterior.cl': 'los 4 endpoints WP devuelven 0 locs',
  'radioaraucania.cl': 'los 4 endpoints WP devuelven 0 locs',
  'eldiariopanguipulli.cl': 'los 4 endpoints WP devuelven 0 locs',
  'lapaia.cl': '/sitemap.xml es un índice de 3 entradas (categorías), sin artículos',
  'terceradosis.cl': '/sitemap.xml es un índice de 3 entradas (pags/image/video), sin artículos',
  'informechile.cl': '/sitemap.xml es un índice de 2 entradas, sin artículos',
  // Batch 19:
  'tehuelchenoticias.cl': 'Wix: store/sitemap-dru-index.xml responde 0 locs',
  'region2.cl': '/sitemap.xml es un urlset plano de 500 URLs, sin historia',
  'temucoya.cl': 'sitemap mensual WP válido (sitemap-pt-post-YYYY-MM, 76 meses) pero solo ~1.000 artículos: reevaluar si crece',
  'chillanonline.cl': 'sin sitemap (robots, wp-sitemap, sitemap_index, sitemap y news-sitemap sin locs útiles)',
  'centralnoticias.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'periodicolosrios.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'lavozdevaldivia.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'arica365.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'mapuexpress.org': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'rengonotas.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'redvalparaiso.com': 'Prontus: sitemap_pags.xml plano de 1.001 locs SIN <lastmod> ni fecha en el path, y sin shards paginados (los sitemap_pags_YYYYMM.xml.gz dan 404). El sitemap_news.xml publica los <loc> de diariosenred.com, otro dominio',
};

const NOMBRES_CATEGORIA = {
  news: 'Noticias nacionales',
  'news-international': 'Noticias internacionales',
  regional: 'Regional',
  government: 'Gobierno / instituciones',
  radio: 'Radio',
  'political-parties': 'Partidos políticos',
  business: 'Negocios / economía',
  community: 'Comunidad / sociedad civil',
  environment: 'Medio ambiente',
  education: 'Educación',
  health: 'Salud',
  culture: 'Cultura',
};

const REMOTE_BASE = 'https://raw.githubusercontent.com/Alplox/awesome-chilean-rss/main';
const REMOTE_DB_URL = `${REMOTE_BASE}/feeds-database.json`;
const REMOTE_WL_URL = `${REMOTE_BASE}/watchlist.json`;

function parseArgs(argv) {
  const out = { source: null, offline: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source' && argv[i + 1]) out.source = argv[i + 1];
    if (argv[i] === '--out' && argv[i + 1]) out.out = argv[i + 1];
    if (argv[i] === '--offline') out.offline = true;
  }
  return out;
}

function loadJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

async function fetchJsonRemote(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'gobierno-vault/watchlist' } });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function norm(s = '') {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function dominio(url = '') {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').toLowerCase();
  }
}

async function main() {
  const { source, offline, out = join(ROOT, 'TAREAS', 'tareas_sitemap.md') } = parseArgs(process.argv.slice(2));

  let db = null;
  let wl = null;
  let origen = '';

  // 1) Fuente explícita --source => solo local
  if (source) {
    db = loadJson(join(source, 'feeds-database.json'));
    wl = loadJson(join(source, 'watchlist.json'));
    origen = source;
    if (!db || !db.sites || !Array.isArray(wl)) {
      console.error('No se pudo leer feeds-database.json/watchlist.json en', source);
      console.error('Verifica --source <dir> (debe contener ambos JSON) o usa sin --source para descarga online.');
      process.exit(1);
    }
  } else if (offline) {
    const local = join(ROOT, '..', 'awesome-chilean-rss');
    db = loadJson(join(local, 'feeds-database.json'));
    wl = loadJson(join(local, 'watchlist.json'));
    origen = local;
    if (!db || !db.sites || !Array.isArray(wl)) {
      console.error('Modo --offline: no se pudo leer', local);
      console.error('Clona el repo: git clone --depth 1 https://github.com/Alplox/awesome-chilean-rss.git ../awesome-chilean-rss');
      process.exit(1);
    }
  } else {
    // 2) Por defecto: remoto online con fallback a clone hermano si existe
    try {
      console.log(`Descargando awesome-chilean-rss online...`);
      [db, wl] = await Promise.all([fetchJsonRemote(REMOTE_DB_URL), fetchJsonRemote(REMOTE_WL_URL)]);
      origen = REMOTE_BASE;
      console.log(`✔ remoto: ${db.sites?.length ?? '?'} sites + ${Array.isArray(wl) ? wl.length : '?'} watchlist`);
    } catch (e) {
      console.warn(`⚠ fallo remoto (${e.message}), intentando clone local hermano...`);
      const local = join(ROOT, '..', 'awesome-chilean-rss');
      db = loadJson(join(local, 'feeds-database.json'));
      wl = loadJson(join(local, 'watchlist.json'));
      origen = local;
      if (!db || !db.sites || !Array.isArray(wl)) {
        console.error('No se pudo leer feeds-database.json/watchlist.json ni remoto ni en', local);
        console.error('Opciones: (a) reintenta con red, (b) git clone --depth 1 https://github.com/Alplox/awesome-chilean-rss.git ../awesome-chilean-rss, (c) pnpm run sitemaps-watchlist -- --source <dir>');
        process.exit(1);
      }
      console.log(`✔ fallback local: ${local}`);
    }
  }

  // Medios ya sincronizados en el catálogo local (por dominio real derivado
  // de las URLs de sus JSONL, o del mapa de add-source.mjs).
  const manifest = loadJson(join(ROOT, 'sitemaps', '_manifest.json'));
  const catalogoDom = new Set();
  const catalogoSlugPorNombre = new Map(); // nombre normalizado -> { slug, articulos } (gana el de más artículos)
  const catalogoSlugs = new Map(); // dominio -> slug
  if (manifest?.medios) {
    for (const [slug, info] of Object.entries(manifest.medios)) {
      const key = norm(info.nombre || slug);
      const prev = catalogoSlugPorNombre.get(key);
      if (!prev || (info.articulos | 0) > prev.articulos) {
        catalogoSlugPorNombre.set(key, { slug, articulos: info.articulos | 0 });
      }
      // Dominio derivado de la primera URL del JSONL del medio.
      const dir = join(ROOT, 'sitemaps', slug);
      if (existsSync(dir)) {
        const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
        for (const f of files) {
          const line = readFileSync(join(dir, f), 'utf8').split('\n').find(Boolean);
          if (line) {
            try {
              const d = dominio(JSON.parse(line).u);
              if (d) {
                catalogoDom.add(d);
                catalogoSlugs.set(d, slug);
              }
              break;
            } catch { /* línea inválida */ }
          }
        }
      }
    }
  }
  // Refuerzo con los dominios de MEDIA (scripts/sitemaps/media.mjs): cubre
  // medios registrados cuyo JSONL aún no existe o falló el parseo anterior.
  // (Antes se parseaba el literal CATALOG_MEDIO_BY_DOMAIN de add-source.mjs;
  // ahora ese mapa también deriva de MEDIA, así que se usa la fuente.)
  for (const [slug, cfg] of Object.entries(MEDIA)) {
    for (const d of mediaHosts(cfg)) {
      const bare = d.replace(/^www\./, '');
      catalogoDom.add(bare);
      if (!catalogoSlugs.has(bare)) catalogoSlugs.set(bare, slug);
    }
  }

  // Medios usados en fuentes (campo `medio:` de src/content/sources/*.md)
  let mediosSources = new Set();
  {
    const sourcesDir = join(ROOT, 'src', 'content', 'sources');
    for (const f of readdirSync(sourcesDir).filter(f=>f.endsWith('.md'))) {
      const raw = readFileSync(join(sourcesDir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (m) {
        const d = YAML.parse(m[1]);
        if (d?.medio) mediosSources.add(norm(String(d.medio).replace(/^["']|["']$/g, '')));
      }
    }
    if (mediosSources.size===0) throw new Error('src/content/sources/*.md sin medios');
  }

  // Orgs de prensa (src/content/organizations/*.md)
  let doc;
  {
    const orgDir = join(ROOT, 'src', 'content', 'organizations');
    const orgs = {};
    for (const f of readdirSync(orgDir).filter(f=>f.endsWith('.md'))) {
      const raw = readFileSync(join(orgDir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (m) orgs[f.replace(/\.md$/,'')] = YAML.parse(m[1]);
    }
    if (!Object.keys(orgs).length) throw new Error('src/content/organizations/*.md vacío');
    doc = { organizations: orgs };
  }
  const orgsPrensa = new Map(); // nombre normalizado -> { nombre, url? }
  for (const org of Object.values(doc.organizations || {})) {
    const t = org.tipo || '';
    if (['medio_comunicacion', 'canal_television', 'programa_tv', 'programa_streaming', 'red_social'].includes(t)) {
      const n = norm(org.nombre);
      if (!orgsPrensa.has(n)) orgsPrensa.set(n, org);
    }
  }

  // Unir database + watchlist (dedupe por dominio), con procedencia.
  const sitios = new Map();
  const agregar = (s, fuente) => {
    const d = dominio(s.url);
    if (!d) return;
    if (!CATEGORIAS_PRENSA.has(s.category)) return;
    // La database se procesa primero y tiene prioridad sobre la watchlist
    // (feed verificado); las entradas de la watchlist con dominio duplicado se omiten.
    if (sitios.has(d)) return;
    sitios.set(d, {
      nombre: s.name, url: s.url, d, categoria: s.category,
      region: s.region || '', fuente, razon: s.reason || '',
      desc: s.description || '',
    });
  };
  for (const s of db.sites) agregar(s, 'db');
  for (const s of wl) agregar(s, 'wl');

  const filas = [...sitios.values()].map((s) => {
    const n = norm(s.nombre);
    let estado = 'pendiente';
    let detalle = '';
    // 1) ¿Ya sincronizado en el catálogo local? Solo por dominio real
    // (catalogoSlugs o el propio slug). El match solo-por-nombre NO marca ✅:
    // la fila es por dominio — ej. lasegunda.cl (muerto) vs lasegunda.com
    // catalogado. En ese caso se anota el slug como referencia.
    const slugCat = catalogoSlugs.get(s.d) || (catalogoDom.has(s.d) ? s.d : null);
    // Nota si el MEDIO tiene datos en catálogo bajo otro dominio (solo si el
    // slug trae artículos reales: un slug huérfano con 0 artículos no respalda nada).
    const alias = !slugCat ? catalogoSlugPorNombre.get(n) : null;
    const notaAlias = alias && alias.articulos > 0 ? `[medio en catálogo como ${alias.slug}]` : '';
    if (slugCat) {
      estado = 'catalogo';
      detalle = `sitemap en catálogo (${slugCat})`;
    } else if (SIN_SITEMAP[s.d]) {
      estado = 'sin_sitemap';
      detalle = SIN_SITEMAP[s.d];
    } else if (mediosSources.has(n) || orgsPrensa.has(n)) {
      // 2) ¿Ya referenciado en src/content/sources/*.md o como org de prensa?
      estado = 'en_uso';
      const org = orgsPrensa.get(n);
      detalle = mediosSources.has(n) ? 'referenciado en src/content/sources/*.md' : 'org de prensa en src/content/organizations/*.md';
      if (org && org.notas) {
        const m = String(org.notas).match(/https?:\/\/[a-z0-9.\-]+\.[a-z]{2,}/i);
        if (m) detalle += ` (${dominio(m[0])})`;
      }
    }
    if (notaAlias && estado !== 'catalogo') detalle = (detalle ? detalle + ' ' : '') + notaAlias;
    return { ...s, estado, detalle };
  });

  filas.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre));

  const conteo = { catalogo: 0, en_uso: 0, sin_sitemap: 0, pendiente: 0 };
  for (const f of filas) conteo[f.estado]++;

  const EMOJI = { catalogo: '✅', en_uso: '🟡', sin_sitemap: '🔒', pendiente: '⬜' };
  const ESTADO_TXT = {
    catalogo: 'Sitemap ya sincronizado',
    en_uso: 'Ya usado en el vault (sin sitemap)',
    sin_sitemap: 'Verificado sin sitemap',
    pendiente: 'Pendiente de sincronizar',
  };

  let md = `# Tareas — Ampliación del catálogo de sitemaps

> Bitácora de sitios de prensa chilenos para sincronizar su sitemap al catálogo
> local (\`sitemaps/<medio>/\`) y así poder revisar eventos de gobiernos pasados
> con mayor variedad de puntos de vista al verificar datos.
>
> **Fuente de sitios:** [awesome-chilean-rss](https://github.com/Alplox/awesome-chilean-rss)
> — \`feeds-database.json\` (sitios con feeds verificados) y \`watchlist.json\`
> (candidatos, muchos sin feed RSS o con solo proxies de Google/Bing News).
> Este archivo se genera con \`pnpm run sitemaps-watchlist\` (online por defecto) o \`pnpm run sitemaps-watchlist -- --source <ruta-al-repo>\` / \`--offline\`.
>
> **Cómo usar:** cada fila pendiente (\`⬜\`) se sincroniza con
> \`pnpm run sitemaps-sync -- <slug>\` (tras agregar el medio a \`MEDIA\` en
> \`scripts/sitemaps/media.mjs\`) o se descarta si el sitio no tiene sitemap.
> Los sitios de la watchlist suelen no tener sitemap (solo RSS) — se marcan para
> intentar el sync y registrar el resultado.

## Resumen

- **Total de sitios de prensa listados:** ${filas.length}
- ✅ En catálogo local: **${conteo.catalogo}**
- 🟡 Ya usados en el vault (sources.yaml/orgs) sin sitemap: **${conteo.en_uso}**
- 🔒 Verificados sin sitemap: **${conteo.sin_sitemap}**
- ⬜ Pendientes de sincronizar: **${conteo.pendiente}**

Categorías consideradas (prensa y afines): ${Object.values(NOMBRES_CATEGORIA).join(', ')}.
Se excluyen: deportes, gaming, empleos, entretenimiento y tecnología.

## Sitios por categoría

`;

  let catActual = '';
  for (const f of filas) {
    if (f.categoria !== catActual) {
      catActual = f.categoria;
      md += `### ${NOMBRES_CATEGORIA[catActual] || catActual} (${f.categoria})\n\n`;
      md += `| Estado | Sitio | Web | Región | Fuente | Notas |\n| --- | --- | --- | --- | --- | --- |\n`;
    }
    const region = f.region ? f.region.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';
    const fuente = f.fuente === 'db' ? 'database' : 'watchlist';
    const limpiar = (s) => String(s).replace(/\|/g, '/').replace(/[\r\n]+/g, ' ').trim();
    // El veredicto de catálogo (detalle) manda sobre el estado del feed (razon):
    // es lo que la bitácora cruza (✅/🔒 y notas de alias van en detalle).
    const notas = limpiar((f.detalle || f.razon || f.desc || '').slice(0, 90));
    md += `| ${EMOJI[f.estado]} | **${limpiar(f.nombre)}** | \`${f.d}\` | ${region} | ${fuente} | ${notas} |\n`;
  }

  md += `\n## Leyenda\n\n- ✅ **En catálogo:** el sitemap del medio ya está sincronizado en \`sitemaps/<slug>/\`.\n- 🟡 **En uso:** el medio ya aparece como fuente en \`sources.yaml\` o como org de prensa en \`entities.yaml\`, pero su sitemap aún no se sincroniza — prioridad para ampliar el catálogo.\n- 🔒 **Sin sitemap:** el sitio fue verificado y no expone sitemap; no reintentar.\n- ⬜ **Pendiente:** sitio de prensa sin sitemap en el catálogo ni referencia en el vault.\n\n## Instrucciones para agregar un medio nuevo\n\n1. Verificar el sitemap del sitio (robots.txt o \`/sitemap.xml\`).\n2. Agregar la entrada a \`MEDIA\` en \`scripts/sitemaps/media.mjs\` (slug, nombre, sitemaps, filtro).\n3. Sincronizar: \`pnpm run sitemaps-sync -- <slug>\`.\n4. Regenerar README/AGENTS: \`pnpm run sitemaps-index\`.\n5. Registrar la org de prensa en \`entities.yaml\` si no existe (regla de wikilinks).\n6. Actualizar este archivo: \`pnpm run sitemaps-watchlist\` (o \`--source <ruta>\` / \`--offline\`).\n`;

  writeFileSync(out, md, 'utf8');
  console.log(`✔ ${filas.length} sitios de prensa → ${out} (origen: ${origen})`);
  console.log(`  catálogo: ${conteo.catalogo} | en uso: ${conteo.en_uso} | pendientes: ${conteo.pendiente}`);
}

// Guard: solo regenera TAREAS/tareas_sitemap.md si se corre directo. Importar el
// módulo (p. ej. desde scripts/probe-sitemap.mjs para leer SIN_SITEMAP) no debe
// disparar la descarga online de awesome-chilean-rss. Mismo patrón que
// add-source.mjs.
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
    process.argv[1].replace(/\\/g, '/').toLowerCase();

if (isMain) {
  main().catch(e => { console.error(e); process.exit(1); });
}
