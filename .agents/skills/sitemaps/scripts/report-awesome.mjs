#!/usr/bin/env node
// report-awesome.mjs — Cruce con awesome-chilean-rss en ambas direcciones.
//
//   node .agents/skills/sitemaps/scripts/report-awesome.mjs [--out <archivo.md>]
//        [--fuente <dir>] [--verificar] [--min-articulos N] [--include-nochilenos]
//
// Dirección 1 (`nuevos`): sitios del repo que la bitácora TAREAS/tareas_sitemap.md
// todavía no evaluó. Si sale 0, el repo no trajo nada nuevo desde la última
// regeneración de la bitácora.
//
// Dirección 2 (`faltantes`): medios que el vault cita o tiene en catálogo y que el
// repo NO lista. Es lo que se puede devolver al repo como issue/PR. Se filtra
// duro porque el vault cita mucho más que prensa chilena: sin el filtro aparecen
// X, Reddit, YouTube, organismos del Estado (Presidencia, Senado, INE, BCN,
// Diario Oficial) y prensa internacional, que no son el objeto de ese repo.
//
//   --verificar   además consulta /feed/, /rss/, /rss.xml y /feed/atom.xml de
//                 cada candidato y anota cuáles responden con un feed real. Sin
//                 esto el reporte es una lista dedomains; con esto es una lista
//                 de feeds, que es lo que el repo puede usar.
//
// Es de solo lectura: no escribe nada en el repo salvo el --out.

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import YAML from 'yaml';
import { MEDIA } from '../../../../scripts/sitemaps/media.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../../..');
const SRC_POR_DEFECTO = join(ROOT, '..', 'awesome-chilean-rss');

const norm = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const bare = (h = '') => h.replace(/^www\./, '').toLowerCase();
const dominiosDe = (u = '') => { try { return bare(new URL(u).hostname); } catch { return ''; } };
const baseDe = (u = '') => { try { const x = new URL(u); return `${x.protocol}//${x.hostname}`; } catch { return ''; } };

// ── Filtro "no es prensa chilena catalogable" ────────────────────────────────
// El vault cita 400+ "medios" que no le interesan a un repo de RSS chileno.
const NO_CHILENO = [
  /(^|\.)(x|twitter|facebook|instagram|youtube|tiktok|threads|mastodon|reddit|linkedin|medium|substack|blogspot|wordpress)\./,
  /\b(reddit|r\/)/,
];
const ORGANISMOS_ESTADO = [
  /presidencia|senado|camara|congreso|bcn|ine\.gob|diariooficial|interior\.gob|contraloria|ministerio|INEP|defensa\.cl|aduana|registrocivil|ine\.cl$/,
  /hacienda|dipres|hacienda\.cl|bancoestado|superintendencia|服務|服务/,
];
const INTERNACIONAL = [
  /^(elpais|clarin|lanacion|nytimes|apnews|bbc|reuters|dw|afp|efe|infobae|eluniversal|elobservador|elnacional|el-tiempo|eldeber|elcomercio|abc\.com|swissinfo|rfi|france24|euronews|voanews|aljazeera|theguardian|axios|washingtonpost|politico|vox)\./,
  /\.(ec|bo|py|uy|ar|br|mx|ve|cu|pe|co|pa|ni|hn|sv|gt|cr|do|pr|jm|tt)\/?$/,
];
const REDES_SOCIALES = /^(x|twitter|facebook|instagram|youtube|tiktok|reddit|mastodon)\./;

function esCandidatoChileno(dominio) {
  if (!dominio) return false;
  if (NO_CHILENO.some(r => r.test(dominio))) return false;
  if (ORGANISMOS_ESTADO.some(r => r.test(dominio))) return false;
  if (INTERNACIONAL.some(r => r.test(dominio))) return false;
  if (REDES_SOCIALES.test(dominio)) return false;
  return /\.(cl|com|net|org|news|io)$/.test(dominio) || /^www\./.test(dominio);
}

// Clasificación para que quien envíe el issue elija: el repo es de prensa
// chilena, así que un think tank con feed o una ONG internacional son otra cosa.
// El orden importa: `.gob.cl` y las palabras de institución se evalúan antes que
// el `.cl` genérico, si no un archivo nacional o un observatorio con feed
// cuentan como "prensa" solo por su TLD.
const INSTITUCIONAL_DOM = /\.(gob|mil|edu|edu\.cl|ac\.cl)\b|\.gob\.cl$|\.mil\.cl$|\.edu\.cl$/;
const INSTITUCIONAL_NOM = /think|observatorio|instituto|fundaci|corporaci|comisi|consejo|colegio|universidad|iglesia|diputad|senado|congreso|municipalidad|ong\b|amig|sociedad|fundac/;
function clasificar(c) {
  if (INSTITUCIONAL_DOM.test(c.dominio) || INSTITUCIONAL_NOM.test(c.nombre)) return 'institución';
  if (/\.cl$/.test(c.dominio)) return 'prensa';
  if (/\.(com|net|org|io|news)$/.test(c.dominio)) return 'internacional/otros';
  return 'otros';
}

function parseArgs(argv) {
  const o = { fuente: SRC_POR_DEFECTO, verificar: false, min: 20, includeNoChilenos: false, out: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--fuente' && argv[i + 1]) o.fuente = argv[i + 1];
    if (argv[i] === '--out' && argv[i + 1]) o.out = argv[i + 1];
    if (argv[i] === '--min-articulos' && argv[i + 1]) o.min = +argv[i + 1];
    if (argv[i] === '--verificar') o.verificar = true;
    if (argv[i] === '--include-nochilenos') o.includeNoChilenos = true;
  }
  return o;
}

async function fetchConTimeout(url, ms = 8000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal, redirect: 'follow', headers: { 'User-Agent': 'gobierno-vault/report-awesome' } });
    const txt = r.ok ? (await r.text()).slice(0, 4000) : '';
    return { ok: r.ok, status: r.status, tipo: r.headers.get('content-type') || '', cuerpo: txt, final: r.url };
  } catch (e) {
    return { ok: false, status: 0, tipo: '', cuerpo: '', error: e.message };
  } finally {
    clearTimeout(t);
  }
}

// Un feed "real" es XML con <rss|<feed|<rdf:RDF, no un HTML de home ni un 404 blando.
const pareceFeed = (r) =>
  r.ok && /xml|rss|atom/i.test(r.tipo) && /<(rss|feed|rdf:RDF)[\s>]/i.test(r.cuerpo);

async function buscarFeed(base) {
  const rutas = ['/feed/', '/rss/', '/rss.xml', '/feed/atom.xml', '/index.xml', '/atom.xml', '/feeds/posts/default'];
  for (const r of rutas) {
    const res = await fetchConTimeout(base + r);
    if (pareceFeed(res)) return { url: res.final || base + r, status: res.status, tipo: res.tipo };
  }
  return null;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const dbPath = join(o.fuente, 'feeds-database.json');
  const wlPath = join(o.fuente, 'watchlist.json');
  if (!existsSync(dbPath) || !existsSync(wlPath)) {
    console.error(`No se encontró feeds-database.json/watchlist.json en ${o.fuente}`);
    console.error('Clónalo: git clone --depth 1 https://github.com/Alplox/awesome-chilean-rss.git ../awesome-chilean-rss');
    process.exit(1);
  }
  const db = JSON.parse(readFileSync(dbPath, 'utf8'));
  const wl = JSON.parse(readFileSync(wlPath, 'utf8'));

  const repoDom = new Set();
  const repoNombre = new Map();
  const repoPorDominio = new Map(); // dominio -> {nombre, url, categoria, fuente}
  for (const [arr, fuente] of [[db.sites, 'feeds-database'], [wl, 'watchlist']])
    for (const s of arr) {
      const d = dominiosDe(s.url);
      if (d) {
        repoDom.add(d);
        if (!repoPorDominio.has(d)) repoPorDominio.set(d, { ...s, fuente });
      }
      const k = norm(s.name || '');
      if (k && !repoNombre.has(k)) repoNombre.set(k, { ...s, fuente });
    }

  // ── Dirección 1: nuevos del repo ────────────────────────────────────────────
  // La bitácora solo cubre categorías de prensa y afines (CATEGORIAS_PRENSA en
  // watchlist.mjs): un sitio de sports/tecnología/empleo aparece acá como
  // "nuevo" sin serlo. Hay que separar ambos grupos o el número asusta sin
  // significar nada — el conteo relevante es el de prensa.
  const CATEGORIAS_PRENSA = new Set([
    'news', 'news-international', 'regional', 'government', 'radio',
    'political-parties', 'business', 'community', 'environment',
    'education', 'health', 'culture',
  ]);
  const bitacora = join(ROOT, 'TAREAS', 'tareas_sitemap.md');
  const yaEvaluados = new Set();
  if (existsSync(bitacora)) {
    for (const line of readFileSync(bitacora, 'utf8').split('\n')) {
      const m = line.match(/^\| (?:✅|🟡|🔒|⬜) \| \*\*.+?\*\* \| `([^`]+)`/u);
      if (m) yaEvaluados.add(m[1]);
    }
  }
  const nuevosPrensa = [];
  const nuevosFueraDeAlcance = [];
  let yaPrensa = 0;
  let yaFuera = 0;
  for (const [d, meta] of repoPorDominio) {
    // OJO: el campo del repo es `category` en inglés, no `categoria`.
    if (CATEGORIAS_PRENSA.has(meta.category)) yaPrensa++; else yaFuera++;
    if (yaEvaluados.has(d)) continue;
    (CATEGORIAS_PRENSA.has(meta.category) ? nuevosPrensa : nuevosFueraDeAlcance).push(d);
  }
  const dominiosPrensa = yaPrensa + nuevosPrensa.length;
  nuevosPrensa.sort();
  nuevosFueraDeAlcance.sort();

  // ── Dirección 2: nuestros medios ausentes del repo ──────────────────────────
  const manifest = JSON.parse(readFileSync(join(ROOT, 'sitemaps', '_manifest.json'), 'utf8'));
  const candidatos = new Map(); // dominio -> {dominio, nombre, arts, anios, vias: Set}

  for (const [slug, cfg] of Object.entries(MEDIA)) {
    const info = manifest.medios[slug] || {};
    const arts = info.articulos | 0;
    if (arts < o.min) continue;
    for (const u of [cfg.robots, cfg.index, ...(cfg.extra || [])].filter(Boolean)) {
      const d = dominiosDe(u);
      if (!d || repoDom.has(d)) continue;
      if (!o.includeNoChilenos && !esCandidatoChileno(d)) continue;
      if (!candidatos.has(d)) candidatos.set(d, { dominio: d, nombre: cfg.nombre, arts, anios: info.años ?? 0, vias: new Set() });
      candidatos.get(d).vias.add('catálogo:' + slug);
    }
  }

  const sourcesDir = join(ROOT, 'src', 'content', 'sources');
  if (existsSync(sourcesDir)) {
    for (const f of readdirSync(sourcesDir).filter(x => x.endsWith('.md'))) {
      const raw = readFileSync(join(sourcesDir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) continue;
      let d;
      try { d = YAML.parse(m[1]); } catch { continue; }
      const url = d?.url || d?.urls?.[0];
      if (!url) continue;
      const dom = dominiosDe(String(url));
      if (!dom || repoDom.has(dom) || repoNombre.has(norm(String(d.medio || '')))) continue;
      if (!o.includeNochilenos && !esCandidatoChileno(dom)) continue;
      if (!candidatos.has(dom)) candidatos.set(dom, { dominio: dom, nombre: String(d.medio || dom), arts: 0, anios: 0, vias: new Set() });
      candidatos.get(dom).vias.add('fuente:' + d.medio);
    }
  }

  const faltantes = [...candidatos.values()].sort((a, b) => b.arts - a.arts || a.dominio.localeCompare(b.dominio));
  for (const c of faltantes) c.tipo = clasificar(c);
  const ORDEN_TIPO = { prensa: 0, institución: 1, 'internacional/otros': 2, otros: 3 };
  faltantes.sort((a, b) => ORDEN_TIPO[a.tipo] - ORDEN_TIPO[b.tipo] || b.arts - a.arts || a.dominio.localeCompare(b.dominio));

  if (o.verificar) {
    console.log(`Verificando feeds de ${faltantes.length} candidatos...`);
    let i = 0;
    const LOTE = 6;
    for (let ini = 0; ini < faltantes.length; ini += LOTE) {
      const lote = faltantes.slice(ini, ini + LOTE);
      await Promise.all(lote.map(async (c) => {
        c.feed = await buscarFeed('https://' + c.dominio);
        process.stdout.write(`\r  ${++i}/${faltantes.length}   `);
      }));
    }
    console.log('\r' + ' '.repeat(40) + '\r');
  }

  // ── Reporte ─────────────────────────────────────────────────────────────────
  const conFeed = faltantes.filter(c => c.feed);
  const conFeedPrensa = conFeed.filter(c => c.tipo === 'prensa');
  const conFeedNoPrensa = conFeed.filter(c => c.tipo !== 'prensa');
  const hoy = new Date().toISOString().slice(0, 10);
  const vias = (c) => [...c.vias].join(', ');

  let md = `# Reporte de cruce con awesome-chilean-rss

> Generado por \`node .agents/skills/sitemaps/scripts/report-awesome.mjs\` el ${hoy},
> cruzando el catálogo de sitemaps del vault (\`sitemaps/_manifest.json\`,
> ${Object.keys(manifest.medios).length} medios) y las fuentes citadas en
> \`src/content/sources/*.md\` contra \`feeds-database.json\` (${db.sites.length} sitios) y
> \`watchlist.json\` (${wl.length} sitios) de awesome-chilean-rss${o.verificar ? ', con verificación de feed en vivo' : ''}.

## 1. Sitios nuevos en el repo que aún no evaluamos

**${nuevosPrensa.length === 0 ? 'Ninguno.' : `${nuevosPrensa.length} sitios de prensa.**`}
${nuevosPrensa.length === 0
  ? `La bitácora \`TAREAS/tareas_sitemap.md\` ya cubre los ${repoDom.size} dominios del repo: los
${dominiosPrensa} que caen en las ${CATEGORIAS_PRENSA.size} categorías de prensa que el vault
rastrea, más los ${yaFuera} de categorías excluidas, que no generan fila. Para que aparezcan
sitios nuevos basta con regenerar la bitácora (\`pnpm run sitemaps-watchlist\`), que vuelve a
cruzar contra el repo.`
  : `\n| Dominio | Nombre | Categoría |\n| --- | --- | --- |\n${nuevosPrensa.map(d => { const m = repoPorDominio.get(d); return `| \`${d}\` | ${m.name || '—'} | ${m.category} |`; }).join('\n')}\n`}
${nuevosFueraDeAlcance.length > 0 ? `Aparte, el repo suma ${nuevosFueraDeAlcance.length} dominios en categorías que
el vault excluye **por diseño** (deportes, gaming, empleos, entretenimiento,
tecnología, blogs personales), así que no generan tareas:
${nuevosFueraDeAlcance.slice(0, 12).map(d => `\`${d}\``).join(', ')}${nuevosFueraDeAlcance.length > 12 ? ', …' : ''}
` : ''}

## 2. Medios del vault que awesome-chilean-rss NO lista

Estos son los candidatos a reportarse al repo. ${conFeed.length > 0
  ? `**${conFeed.length} de ${faltantes.length} respondieron con un feed RSS/Atom real** y son proposal-ready (${conFeedPrensa.length} de ellos son de tipo \`prensa\`, o sea dominios \`.cl\`); los ${faltantes.length - conFeed.length} sin feed se listan aparte para no proponer feeds rotos.`
  : `Sin verificación de feeds: ${faltantes.length} candidatos por dominio. Corre con \`--verificar\` para separar los que tienen feed real.`}

### 2.1 Con feed verificado (enviables al repo)
${conFeed.length === 0 ? '_Ninguno (corrí el script sin `--verificar`, o ninguno respondió)._' : ''}
La columna **Tipo** separa lo que el repo probablemente quiere de lo que no:
solo los \`prensa\` (dominio \`.cl\`) son candidatos directos; los \`institución\` y
\`internacional/otros\` son think tanks, organismos o medios foráneos que citamos
como fuente y que se decide aparte.

| Medio | Tipo | Dominio | Artículos catálogo | Años | Feed detectado | Visto en |
| --- | --- | --- | ---: | ---: | --- | --- |
${conFeed.map(c => `| ${c.nombre} | ${c.tipo} | \`${c.dominio}\` | ${c.arts ? c.arts.toLocaleString('es-CL') : '—'} | ${c.anios || '—'} | ${c.feed.url} | ${vias(c)} |`).join('\n')}

### 2.2 Sin feed detectado (no proponer todavía)
${faltantes.filter(c => !c.feed).length === 0 ? '_Ninguno._' : ''}
| Medio | Tipo | Dominio | Artículos catálogo | Años | Visto en |
| --- | --- | --- | ---: | ---: | --- |
${faltantes.filter(c => !c.feed).map(c => `| ${c.nombre} | ${c.tipo} | \`${c.dominio}\` | ${c.arts ? c.arts.toLocaleString('es-CL') : '—'} | ${c.anios || '—'} | ${vias(c)} |`).join('\n')}

## 3. Texto listo para el issue / PR del repo

> NOTE: revisar antes de enviar — los nombres salen de \`MEDIA\` y del campo
> \`medio:\` de las fuentes, así que algunos no coinciden con el nombre editorial
> que usa el repo. Esta sección lista solo los de tipo \`prensa\`, que son los
> que el repo puede usar tal cual.

${conFeedPrensa.length === 0 ? '_Sin candidatos de prensa verificados._' : `Estos ${conFeedPrensa.length} sitios tienen feed funcionando y no figuran en
\`feeds-database.json\` ni en \`watchlist.json\`:

${conFeedPrensa.map(c => `- **${c.nombre}** — https://${c.dominio} (\`${c.feed.url}\`)${c.arts ? `, ${c.arts.toLocaleString('es-CL')} artículos indexados` : ''}`).join('\n')}

Sugerencia de categoría según el cruce: revisar si encaja en \`regional\`,
\`news\`, \`political-parties\`, \`community\` o \`business\`.`}

${conFeedNoPrensa.length > 0 ? `Quedan ${conFeedNoPrensa.length} candidatos de tipo \`institución\` o
\`internacional/otros\` (${conFeedNoPrensa.length} verificados) listados en 2.1; no los incluyo
en el texto de arriba porque un repo de prensa chilena normalmente no los quiere.` : ''}

## 4. Cómo reproducir

\`\`\`bash
node .agents/skills/sitemaps/scripts/report-awesome.mjs --verificar
node .agents/skills/sitemaps/scripts/report-awesome.mjs --verificar --min-articulos 0
node .agents/skills/sitemaps/scripts/report-awesome.mjs --fuente <dir-del-clon> --verificar
node .agents/skills/sitemaps/scripts/report-awesome.mjs --include-nochilenos   # sin el filtro de prensa chilena
\`\`\`

Solo lectura: no escribe en el vault ni en el repo del otro proyecto.
`;

  if (o.out) { writeFileSync(o.out, md, 'utf8'); console.log(`✔ reporte → ${o.out}`); }
  else process.stdout.write(md);

  console.error(`\nresumen: ${nuevosPrensa.length} nuevos de prensa (${nuevosFueraDeAlcance.length} fuera de alcance) | ${faltantes.length} nuestros ausentes del repo (${conFeed.length} con feed verificado)`);
}

if (process.argv[1] && fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() === process.argv[1].replace(/\\/g, '/').toLowerCase()) {
  main().catch(e => { console.error(e); process.exit(1); });
}
