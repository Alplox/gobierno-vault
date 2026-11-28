// Descubrimiento de prensa vía Google News RSS (sin API key).
//
// Uso:
//   pnpm run news-search -- "<query>" [--since YYYY-MM-DD] [--from YYYY-MM-DD]
//                          [--to YYYY-MM-DD] [--window Nd] [--medio <texto>]
//                          [--limit N] [--all] [--json] [--no-resolve]
//
// Es el fallback online de `add-source --search`: el catálogo local SIEMPRE va
// primero (regla 14 de AGENTS.md). Esto descubre QUÉ se publicó (título, medio,
// fecha) y resuelve la URL original del artículo —nunca se guarda la URL del
// wrapper de Google (misma regla 10 que los mirrors).
//
// El feed RSS entrega 100 ítems por query (start/count se ignoran) y los links
// rss/articles/CBMi... van cifrados desde 2024 (doble base64 → ruido). La
// resolución es: 1) firma del article page + batchexecute de Google, copiando
// hl/gl/ceid del item; 2) coincidencia de título contra sitemaps/*.jsonl;
// 3) título contra fuentes del vault. Los ítems sin resolución salen como
// [SIN RESOLVER] para `add-source`/`fetch-content`. `--window 7d` parte el
// rango en queries con after:/before: para romper el techo de 100.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeUrlForMatch } from '../extract/add-source.mjs';
import { MEDIA } from './media.mjs';
import { medioDir } from './paths.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SOURCES_DIR = join(ROOT, 'src', 'content', 'sources');

const GN_RSS = 'https://news.google.com/rss/search';
const GN_ARTICLE_UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36';
const BATCHEXECUTE_URL = 'https://news.google.com/_/DotsSplashUi/data/batchexecute';
const GARTURLREQ_CTX = [
  ['X', 'X', ['X', 'X'], null, null, 1, 1, 'US:en', null, 1, null, null, null, null, null, 0, 1],
  'X', 'X', 1, [1, 1, 1], 1, 1, null, 0, 0, null, 0,
];

// Google limita con 429/503: reintento con backoff exponencial y jitter.
async function fetchWithRetry(url, opts = {}, attempts = 4) {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(30000) });
    if (res.status !== 429 && res.status !== 503) return res;
    if (i === attempts - 1) return res;
    await new Promise((r) => setTimeout(r, (Math.min(30, 2 ** i) + Math.random()) * 1000));
  }
}

function esWrapperGoogle(u) {
  try { return /(^|\.)news\.google\.com$/i.test(new URL(u).hostname); }
  catch { return true; }
}

function googleArticleId(link) {
  const m = String(link || '').match(/\/(?:rss\/)?(?:articles|read)\/([A-Za-z0-9_-]+)/);
  return m ? m[1] : null;
}

// Copiar el locale del item es clave: con ceid ajeno batchexecute responde null.
function googleLocale(link) {
  try {
    const q = new URL(link).searchParams;
    return {
      hl: q.get('hl') || 'es-419',
      gl: q.get('gl') || 'CL',
      ceid: q.get('ceid') || 'CL:es-419',
    };
  } catch {
    return { hl: 'es-419', gl: 'CL', ceid: 'CL:es-419' };
  }
}

// Resuelve los IDs cifrados en lotes de 10: un GET por artículo para la firma
// y un POST de batchexecute por lote. Devuelve Map url_google → url real.
async function decodeGoogleUrls(items) {
  const resueltas = new Map();
  for (let ini = 0; ini < items.length; ini += 10) {
    const lote = items.slice(ini, ini + 10);
    const firmas = await Promise.all(lote.map(async (it) => {
      const id = googleArticleId(it.url_google);
      if (!id) return null;
      const loc = googleLocale(it.url_google);
      const page = `https://news.google.com/rss/articles/${id}?hl=${encodeURIComponent(loc.hl)}&gl=${encodeURIComponent(loc.gl)}&ceid=${encodeURIComponent(loc.ceid)}`;
      try {
        const res = await fetchWithRetry(page, { headers: { 'User-Agent': GN_ARTICLE_UA } });
        if (!res.ok) return null;
        const html = await res.text();
        const sg = html.match(/data-n-a-sg="([^"]+)"/)?.[1];
        const ts = html.match(/data-n-a-ts="([^"]+)"/)?.[1];
        return sg && ts ? { id, ts, sg } : null;
      } catch { return null; }
    }));
    const pendientes = firmas.map((f, i) => (f ? [i, f] : null)).filter(Boolean);
    if (!pendientes.length) continue;
    const envelopes = pendientes.map(([i, f]) => [
      'Fbv4je',
      JSON.stringify(['garturlreq', GARTURLREQ_CTX, f.id, Number(f.ts), f.sg]),
      null,
      String(i),
    ]);
    try {
      const res = await fetchWithRetry(BATCHEXECUTE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'User-Agent': GN_ARTICLE_UA,
        },
        body: 'f.req=' + encodeURIComponent(JSON.stringify([envelopes])),
      });
      if (!res.ok) continue;
      const texto = (await res.text()).replace(/^\)\]\}'\s*/, '').trim();
      const filas = JSON.parse(texto);
      for (const fila of filas) {
        if (fila[0] !== 'wrb.fr' || typeof fila[2] !== 'string' || !fila[2].includes('garturlres')) continue;
        let real;
        try { real = JSON.parse(fila[2])[1]; } catch { continue; }
        // El request ID va en la última celda no nula (wrb.fr, Fbv4je, payload,
        // null, null, null, "3"), no siempre en la misma posición.
        let rid = null;
        for (let k = fila.length - 1; k >= 3; k--) {
          if (fila[k] !== null && fila[k] !== undefined && fila[k] !== '') { rid = fila[k]; break; }
        }
        const idx = Number(rid);
        if (!Number.isInteger(idx) || !lote[idx]) continue;
        try {
          const u = new URL(real);
          if (/^https?:$/.test(u.protocol) && !esWrapperGoogle(real)) resueltas.set(lote[idx].url_google, real);
        } catch { /* URL inválida: se deja sin resolver */ }
      }
    } catch { /* un lote fallido no tumba la búsqueda */ }
  }
  return resueltas;
}

// Normaliza títulos para comparar (minúsculas, sin tildes, solo [a-z0-9]).
function normTitle(s = '') {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

// slug del catálogo ↔ hostnames de MEDIA (robots/index).
const SLUG_HOSTS = {};
for (const [slug, cfg] of Object.entries(MEDIA)) {
  for (const k of ['robots', 'index']) {
    if (!cfg[k]) continue;
    try {
      const h = new URL(cfg[k]).hostname.replace(/^www\./i, '').toLowerCase();
      (SLUG_HOSTS[slug] ||= []).push(h);
    } catch { /* skip */ }
  }
}

function slugForDomain(domain) {
  const d = String(domain || '').replace(/^www\./i, '').toLowerCase();
  if (!d) return null;
  for (const [slug, hosts] of Object.entries(SLUG_HOSTS)) {
    if (hosts.some((h) => d === h || d.endsWith(`.${h}`) || h.endsWith(`.${d}`))) return slug;
  }
  const core = d.split('.')[0];
  for (const slug of Object.keys(MEDIA)) {
    if (slug.includes(core) || core.includes(slug)) return slug;
  }
  return null;
}

// Cache de entradas del catálogo por slug+año.
const catalogCache = new Map();
function catalogEntries(slug, years) {
  const out = [];
  const dir = medioDir(slug);
  if (!existsSync(dir)) return out;
  for (const y of years) {
    const key = `${slug}/${y}`;
    if (!catalogCache.has(key)) {
      const f = join(dir, `${y}.jsonl`);
      const arr = [];
      if (existsSync(f)) {
        for (const line of readFileSync(f, 'utf8').split('\n')) {
          if (!line.trim()) continue;
          try {
            const e = JSON.parse(line);
            if (e.u) arr.push({ u: e.u, t: normTitle(e.t || ''), news: e.s === 'news' });
          } catch { /* línea mala */ }
        }
      }
      catalogCache.set(key, arr);
    }      // push(...) con spread explota (stack overflow) en JSONL grandes;
      // loop plano en su lugar.
      for (const e of catalogCache.get(key)) out.push(e);
  }
  return out;
}

// Resuelve la URL original buscando el título en el catálogo del medio.
// Prefiere título real (news) y fecha cercana; devuelve la URL o null.
function resolveInCatalog(item) {
  const slug = slugForDomain(item.dominio);
  if (!slug) return { url: null, slug: null };
  const nt = normTitle(item.titulo);
  if (nt.length < 15) return { url: null, slug };
  const years = new Set([String(new Date().getUTCFullYear())]);
  if (item.fecha) years.add(item.fecha.slice(0, 4));
  const cands = [];
  for (const e of catalogEntries(slug, [...years])) {
    if (!e.t || e.t.length < 15) continue;
    if (nt.includes(e.t) || e.t.includes(nt)) cands.push(e);
  }
  if (!cands.length) {
    // Fallback: overlap de palabras significativas (>=5 palabras de 4+ letras).
    const words = new Set(nt.split(' ').filter((w) => w.length >= 4));
    for (const e of catalogEntries(slug, [...years])) {
      const ew = e.t.split(' ').filter((w) => w.length >= 4);
      const hit = ew.filter((w) => words.has(w)).length;
      if (hit >= 5 && hit / Math.max(1, ew.length) >= 0.5) cands.push(e);
    }
  }
  cands.sort((a, b) => (b.news ? 1 : 0) - (a.news ? 1 : 0));
  return { url: cands.length ? cands[0].u : null, slug };
}

function vaultUrls() {
  const known = new Set();
  const titles = [];
  if (!existsSync(SOURCES_DIR)) return { known, titles };
  for (const f of readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.md'))) {
    const raw = readFileSync(join(SOURCES_DIR, f), 'utf8');
    const fm = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    const url = fm[1].match(/^url:\s*(.+)$/m);
    const tit = fm[1].match(/^titulo:\s*(.+)$/m);
    let cleanUrl = null;
    if (url && /^https?:\/\//i.test(url[1].trim())) {
      cleanUrl = url[1].trim();
      try { known.add(normalizeUrlForMatch(cleanUrl)); } catch { /* skip */ }
    }
    if (tit) {
      const t = tit[1].trim().replace(/^"|"$/g, '');
      if (cleanUrl) titles.push({ t: normTitle(t), url: cleanUrl });
    }
  }
  return { known, titles };
}

// ¿Está el título (o viceversa) en una fuente del vault? (cubre catálogo
// desactualizado: la URL ya existe en src/content/sources aunque el JSONL no).
function vaultTitleHit(titles, nt) {
  if (nt.length < 15) return null;
  for (const e of titles) {
    if (!e.t || e.t.length < 15) continue;
    if (nt.includes(e.t) || e.t.includes(nt)) return e.url;
  }
  return null;
}

function isoDay(d) { return d.toISOString().slice(0, 10); }

function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return isoDay(new Date(Date.UTC(y, m - 1, d + n)));
}

function diasDeWindow(s) {
  const m = String(s || '').match(/^(\d+)([dwm])$/i);
  if (!m) return null;
  return Math.max(1, parseInt(m[1], 10) * { d: 1, w: 7, m: 30 }[m[2].toLowerCase()]);
}

// Una query por ventana cuando se pide --window; si no, una sola con el rango.
function buildQueries(o) {
  const hoy = isoDay(new Date());
  const dias = o.window ? diasDeWindow(o.window) : null;
  if (o.window && !dias) throw new Error('--window usa formato Nd/Nw/Nm (ej: 7d)');
  const conRango = Boolean(o.from || o.to || o.window);
  let desde = o.from || null;
  let hasta = o.to || null;
  if (dias && !desde) desde = addDays(hoy, -30);
  if (dias && !hasta) hasta = addDays(hoy, 1);
  if (conRango && desde && !hasta) hasta = addDays(desde, 30);
  if (conRango && hasta && !desde) desde = addDays(hasta, -30);
  // --since solo filtra hacia adelante: no le agregamos un before: artificial.
  if (!conRango) { desde = o.since || null; hasta = null; }

  const ventanas = [];
  if (dias && desde && hasta) {
    for (let cursor = desde; cursor < hasta;) {
      const fin = addDays(cursor, dias) > hasta ? hasta : addDays(cursor, dias);
      ventanas.push({ desde: cursor, hasta: fin });
      cursor = fin;
      if (ventanas.length > 60) throw new Error('Demasiadas ventanas; acota --from/--to o usa una unidad mayor en --window');
    }
  } else {
    ventanas.push({ desde, hasta });
  }

  return ventanas.map((w) => {
    let q = o.query;
    if (w.desde && !/after:/i.test(q) && !/when:/i.test(q)) q += ` after:${w.desde}`;
    if (w.hasta && !/before:/i.test(q)) q += ` before:${w.hasta}`;
    return {
      url: `${GN_RSS}?q=${encodeURIComponent(q)}&hl=es-419&gl=CL&ceid=CL:es-419`,
      desde: w.desde,
      hasta: w.hasta,
    };
  });
}

function parseArgs(argv) {
  const o = { query: null, since: null, from: null, to: null, window: null, medio: null, limit: 20, all: false, json: false, noResolve: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--since') o.since = argv[++i];
    else if (a === '--from' || a === '--to') {
      const v = argv[++i];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) throw new Error(`${a} espera YYYY-MM-DD`);
      o[a === '--from' ? 'from' : 'to'] = v;
    }
    else if (a === '--window') o.window = argv[++i];
    else if (a === '--no-resolve') o.noResolve = true;
    else if (a === '--medio') o.medio = argv[++i].toLowerCase();
    else if (a === '--limit') o.limit = Math.max(1, parseInt(argv[++i], 10) || 20);
    else if (a === '--all') o.all = true;
    else if (a === '--json') o.json = true;
    else if (a === '--help' || a === '-h') o.help = true;
    else rest.push(a);
  }
  o.query = rest.join(' ').trim() || null;
  return o;
}

function help() {
  console.log(`Uso: pnpm run news-search -- "<query>" [--since YYYY-MM-DD] [--from YYYY-MM-DD] [--to YYYY-MM-DD]
                            [--window Nd|Nw|Nm] [--medio <texto>] [--limit N] [--all] [--json] [--no-resolve]

  <query>      búsqueda libre (acepta operadores de Google News: comillas, site:, when:7d)
  --since      filtra resultados desde la fecha (after: + filtro local)
  --from/--to  rango de fechas; el RSS entrega 100 ítems por query
  --window     parte el rango en ventanas (ej: 7d, 1w, 1m) para sumar hasta 100 por ventana
  --medio      filtra por nombre o dominio del medio (subcadena, insensible a caso)
  --limit      máximo de resultados (default 20)
  --all        muestra también URLs ya presentes en el vault (marcadas)
  --json       salida JSON en vez de lista legible (el resumen va a stderr)
  --no-resolve omite la resolución de links cifrados de Google (solo catálogo/vault)

Ejemplos:
  pnpm run news-search -- "Democracia Siempre" --since 2026-08-30
  pnpm run news-search -- "marcha estudiantil" --medio biobio --limit 10
  pnpm run news-search -- "aluvión" --from 2026-10-01 --to 2026-10-12 --window 3d`);
}

function escXml(s) {
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}

function parseRss(xml) {
  const items = [];
  for (const chunk of xml.match(/<item>[\s\S]*?<\/item>/g) || []) {
    const pick = (re) => {
      const m = chunk.match(re);
      return m ? escXml(m[1].trim()) : null;
    };
    const titulo = pick(/<title>([\s\S]*?)<\/title>/);
    const link = pick(/<link>([\s\S]*?)<\/link>/);
    const pubDate = pick(/<pubDate>([\s\S]*?)<\/pubDate>/);
    const srcM = chunk.match(/<source[^>]*url="([^"]*)"[^>]*>([\s\S]*?)<\/source>/);
    if (titulo && link) {
      items.push({
        titulo,
        url_google: link,
        fecha: pubDate ? new Date(pubDate).toISOString().slice(0, 10) : null,
        medio: srcM ? escXml(srcM[2].trim()) : null,
        dominio: srcM ? srcM[1].replace(/^https?:\/\/(www\.)?/i, '').split('/')[0].toLowerCase() : null,
      });
    }
  }
  return items;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help || !o.query) { help(); process.exit(o.query ? 0 : 1); }

  const queries = buildQueries(o);
  const { known, titles } = vaultUrls();
  const vistos = new Set();
  const crudos = [];
  for (const q of queries) {
    const res = await fetchWithRetry(q.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (gobierno-vault news-search; contacto editorial)' },
    });
    if (!res.ok) {
      console.error(`✖ Google News respondió HTTP ${res.status}`);
      process.exit(1);
    }
    for (const it of parseRss(await res.text())) {
      if (q.desde && it.fecha && it.fecha < q.desde) continue;
      if (q.hasta && it.fecha && it.fecha >= q.hasta) continue;
      if (o.medio) {
        const hay = `${it.medio || ''} ${it.dominio || ''}`.toLowerCase();
        if (!hay.includes(o.medio)) continue;
      }
      // Un titular puede repetirse en el feed o volver en otra ventana.
      const clave = `${normTitle(it.titulo)}|${it.dominio || ''}|${it.fecha || ''}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      crudos.push(it);
    }
  }

  // Orden de resolución: 1) Google (IDs cifrados), 2) catálogo por título,
  // 3) fuentes del vault. Nunca se guarda la URL del wrapper de Google.
  const decoded = o.noResolve ? new Map() : await decodeGoogleUrls(crudos);
  const out = [];
  for (const it of crudos) {
    let original = null;
    let via = null;
    let slug = null;
    if (!esWrapperGoogle(it.url_google)) {
      original = it.url_google;
      via = 'directo';
    } else if (decoded.has(it.url_google)) {
      original = decoded.get(it.url_google);
      via = 'google';
    }
    if (!original) {
      const r = resolveInCatalog(it);
      slug = r.slug;
      if (r.url) { original = r.url; via = 'catalogo'; }
    }
    if (!original) {
      const hit = vaultTitleHit(titles, normTitle(it.titulo));
      if (hit) { original = hit; via = 'vault'; }
    }
    let enVault = false;
    if (original) {
      const norm = (() => { try { return normalizeUrlForMatch(original); } catch { return original; } })();
      enVault = known.has(norm);
    }
    if (enVault && !o.all) continue;
    out.push({ ...it, url: original, via, slug, en_vault: enVault, sin_resolver: !original });
  }

  const resultados = out.slice(0, o.limit);
  if (o.json) {
    console.log(JSON.stringify(resultados, null, 2));
  } else if (!resultados.length) {
    console.log('(sin resultados nuevos — prueba con --all para ver duplicados, o ajusta la query)');
  } else {
    resultados.forEach((it, i) => {
      const tag = it.en_vault ? ' [EN VAULT]' : it.sin_resolver ? ' [SIN RESOLVER]' : '';
      console.log(`${i + 1}. ${it.titulo}${tag}`);
      console.log(`   ${it.medio || '?'}${it.dominio ? ` (${it.dominio})` : ''} · ${it.fecha || 's/f'}`);
      if (it.url) {
        console.log(`   ${it.url}`);
      } else {
        const hint = it.titulo.split(' ').slice(0, 8).join(' ');
        console.log(`   → resolver con: pnpm run add-source -- --search "${hint}"${it.slug ? ` --medio ${it.slug}` : ''}`);
      }
    });
  }

  const porMedio = {};
  for (const it of resultados) {
    const m = it.dominio || it.medio || '?';
    porMedio[m] = (porMedio[m] || 0) + 1;
  }
  const cuenta = (via) => resultados.filter((it) => it.via === via).length;
  const top = Object.entries(porMedio).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([m, n]) => `${m} (${n})`).join(', ');
  console.error(`\n${resultados.length} resultado(s) para: ${o.query} · ${Object.keys(porMedio).length} medio(s) único(s)`);
  console.error(`resueltos: google ${cuenta('google')}, directo ${cuenta('directo')}, catálogo ${cuenta('catalogo')}, vault ${cuenta('vault')}, sin resolver ${resultados.filter((it) => it.sin_resolver).length}`);
  if (top) console.error(`medios más repetidos: ${top}`);
}

main().catch((e) => { console.error(`✖ ${e.message}`); process.exit(1); });
