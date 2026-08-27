// Genera `TAREAS/tareas_sitemap.md`: bitácora de sitios de prensa chilenos pendientes de
// sincronizar su sitemap al catálogo local (sitemaps/<medio>/), para ampliar la
// variedad de puntos de vista al verificar eventos de gobiernos pasados.
//
// Fuentes de datos:
//   - awesome-chilean-rss (https://github.com/Alplox/awesome-chilean-rss):
//     `feeds-database.json` (sites[] con feeds verificados) + `watchlist.json`
//     (sitios candidatos, muchos sin feed RSS). Se requiere un clone local;
//     pasar la ruta con `--source <dir>` (default: `../awesome-chilean-rss`).
//   - `sitemaps/_manifest.json` (medios ya sincronizados en el catálogo).
//   - `src/data/sources.yaml` (campo `medio:` de las fuentes ya usadas).
//   - `src/data/entities.yaml` (orgs tipo medio_comunicacion/red_social/etc.).
//
// Solo se listan categorías de prensa y afines (noticias, regional, gobierno,
// radio, partidos, negocios, comunidad, medio ambiente, educación, salud,
// cultura e internacional) y solo la URL del sitio (no los feeds).

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Categorías de prensa y afines (se excluyen sports, gaming, jobs, entertainment, technology).
const CATEGORIAS_PRENSA = new Set([
  'news', 'news-international', 'regional', 'government', 'radio',
  'political-parties', 'business', 'community', 'environment',
  'education', 'health', 'culture',
]);

// Dominios verificados SIN sitemap (revisado a mano el 2026-08-19): no se
// reintentan en cada regeneración. Key: dominio, value: nota.
const SIN_SITEMAP = {
  'efe.cl': 'verificado sin sitemap (solo RSS /feed/)',
  'fiscaliadechile.cl': 'verificado sin sitemap (Drupal 10 sin xmlsitemap)',
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

function parseArgs(argv) {
  const out = { source: join(ROOT, '..', 'awesome-chilean-rss') };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source' && argv[i + 1]) out.source = argv[i + 1];
    if (argv[i] === '--out' && argv[i + 1]) out.out = argv[i + 1];
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

function main() {
  const { source, out = join(ROOT, 'TAREAS', 'tareas_sitemap.md') } = parseArgs(process.argv.slice(2));

  const db = loadJson(join(source, 'feeds-database.json'));
  const wl = loadJson(join(source, 'watchlist.json'));
  if (!db || !db.sites || !Array.isArray(wl)) {
    console.error('No se pudo leer feeds-database.json/watchlist.json en', source);
    console.error('Clona el repo: git clone --depth 1 https://github.com/Alplox/awesome-chilean-rss.git');
    process.exit(1);
  }

  // Medios ya sincronizados en el catálogo local (por dominio real derivado
  // de las URLs de sus JSONL, o del mapa de add-source.mjs).
  const manifest = loadJson(join(ROOT, 'sitemaps', '_manifest.json'));
  const catalogoDom = new Set();
  const catalogoNombres = new Set();
  const catalogoSlugs = new Map(); // dominio -> slug
  if (manifest?.medios) {
    for (const [slug, info] of Object.entries(manifest.medios)) {
      catalogoNombres.add(norm(info.nombre || slug));
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
  // Refuerzo con el mapa de dominios de add-source.mjs (medios del catálogo).
  const addSource = readFileSync(join(ROOT, 'scripts', 'add-source.mjs'), 'utf8');
  for (const m of addSource.matchAll(/CATALOG_MEDIO_BY_DOMAIN\s*=\s*\{([\s\S]*?)\n\};/g)) {
    for (const e of m[1].matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)) {
      catalogoDom.add(e[1].replace(/^www\./, ''));
      if (!catalogoSlugs.has(e[1].replace(/^www\./, ''))) catalogoSlugs.set(e[1].replace(/^www\./, ''), e[2]);
    }
  }

  // Medios usados en sources.yaml (campo `medio:`).
  const sourcesYaml = readFileSync(join(ROOT, 'src/data/sources.yaml'), 'utf8');
  const mediosSources = new Set();
  for (const m of sourcesYaml.matchAll(/^\s+medio:\s*(.+)$/gm)) {
    mediosSources.add(norm(m[1].replace(/^["']|["']$/g, '')));
  }

  // Orgs de prensa en entities.yaml (nombre + notas con dominio cuando existe).
  const entitiesYaml = readFileSync(join(ROOT, 'src/data/entities.yaml'), 'utf8');
  const doc = YAML.parse(entitiesYaml);
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
    // 1) ¿Ya sincronizado en el catálogo local? (por nombre o dominio real)
    const slugCat = catalogoSlugs.get(s.d) || (catalogoDom.has(s.d) ? s.d : null);
    if (catalogoNombres.has(n) || slugCat) {
      estado = 'catalogo';
      detalle = `sitemap en catálogo${slugCat ? ` (${slugCat})` : ''}`;
    } else if (SIN_SITEMAP[s.d]) {
      estado = 'sin_sitemap';
      detalle = SIN_SITEMAP[s.d];
    } else if (mediosSources.has(n) || orgsPrensa.has(n)) {
      // 2) ¿Ya referenciado en sources.yaml o como org de prensa?
      estado = 'en_uso';
      const org = orgsPrensa.get(n);
      detalle = mediosSources.has(n) ? 'referenciado en sources.yaml' : 'org de prensa en entities.yaml';
      if (org && org.notas) {
        const m = String(org.notas).match(/https?:\/\/[a-z0-9.\-]+\.[a-z]{2,}/i);
        if (m) detalle += ` (${dominio(m[0])})`;
      }
    }
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
> Este archivo se genera con \`pnpm run sitemaps-watchlist -- --source <ruta-al-repo>\`.
>
> **Cómo usar:** cada fila pendiente (\`⬜\`) se sincroniza con
> \`pnpm run sitemaps-sync -- <slug>\` (tras agregar el medio a \`MEDIA\` en
> \`scripts/sync-sitemaps.mjs\`) o se descarta si el sitio no tiene sitemap.
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
    const notas = limpiar((f.razon || f.detalle || f.desc || '').slice(0, 90));
    md += `| ${EMOJI[f.estado]} | **${limpiar(f.nombre)}** | \`${f.d}\` | ${region} | ${fuente} | ${notas} |\n`;
  }

  md += `\n## Leyenda\n\n- ✅ **En catálogo:** el sitemap del medio ya está sincronizado en \`sitemaps/<slug>/\`.\n- 🟡 **En uso:** el medio ya aparece como fuente en \`sources.yaml\` o como org de prensa en \`entities.yaml\`, pero su sitemap aún no se sincroniza — prioridad para ampliar el catálogo.\n- 🔒 **Sin sitemap:** el sitio fue verificado y no expone sitemap; no reintentar.\n- ⬜ **Pendiente:** sitio de prensa sin sitemap en el catálogo ni referencia en el vault.\n\n## Instrucciones para agregar un medio nuevo\n\n1. Verificar el sitemap del sitio (robots.txt o \`/sitemap.xml\`).\n2. Agregar la entrada a \`MEDIA\` en \`scripts/sync-sitemaps.mjs\` (slug, nombre, sitemaps, filtro).\n3. Sincronizar: \`pnpm run sitemaps-sync -- <slug>\`.\n4. Regenerar README/AGENTS: \`pnpm run sitemaps-index\`.\n5. Agregar dominio y nombre a \`CATALOG_MEDIO_BY_DOMAIN\`/\`CATALOG_MEDIO_NAMES\` de \`scripts/add-source.mjs\`.\n6. Registrar la org de prensa en \`entities.yaml\` si no existe (regla de wikilinks).\n7. Actualizar este archivo: \`pnpm run sitemaps-watchlist -- --source <ruta-al-repo>\`.\n`;

  writeFileSync(out, md, 'utf8');
  console.log(`✔ ${filas.length} sitios de prensa → ${out}`);
  console.log(`  catálogo: ${conteo.catalogo} | en uso: ${conteo.en_uso} | pendientes: ${conteo.pendiente}`);
}

main();
