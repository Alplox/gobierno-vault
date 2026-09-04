// Descubrimiento de prensa vía Google News RSS (sin API key).
//
// Uso:
//   pnpm run news-search -- "<query>" [--since YYYY-MM-DD] [--medio <texto>]
//                          [--limit N] [--all] [--json]
//
// Es el fallback online de `add-source --search`: el catálogo local SIEMPRE va
// primero (regla 14 de AGENTS.md). Esto descubre QUÉ se publicó (título, medio,
// fecha) y resuelve la URL original del artículo contra el catálogo por
// coincidencia de título —nunca se guarda la URL del wrapper de Google
// (misma regla 10 que los mirrors).
//
// Nota técnica: los links rss/articles/CBMi... de Google van cifrados desde
// 2024+ (doble base64 → ruido; verificado sep-2026) y GDELT no responde desde
// esta red, así que la resolución es por título contra sitemaps/*.jsonl. Los
// ítems sin match en el catálogo salen como [SIN RESOLVER] para resolución
// manual con `add-source`/`fetch-content`.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeUrlForMatch } from '../extract/add-source.mjs';
import { MEDIA } from './sync.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CATALOG_DIR = join(ROOT, 'sitemaps');
const SOURCES_DIR = join(ROOT, 'src', 'content', 'sources');

const GN_RSS = 'https://news.google.com/rss/search';

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
  const dir = join(CATALOG_DIR, slug);
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
    }
    out.push(...catalogCache.get(key));
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

function parseArgs(argv) {
  const o = { query: null, since: null, medio: null, limit: 20, all: false, json: false };
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--since') o.since = argv[++i];
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
  console.log(`Uso: pnpm run news-search -- "<query>" [--since YYYY-MM-DD] [--medio <texto>] [--limit N] [--all] [--json]

  <query>   búsqueda libre (acepta operadores de Google News: comillas, site:, when:7d)
  --since   filtra resultados desde la fecha (after: + filtro local)
  --medio   filtra por nombre o dominio del medio (subcadena, insensible a caso)
  --limit   máximo de resultados (default 20)
  --all     muestra también URLs ya presentes en el vault (marcadas)
  --json    salida JSON en vez de lista legible

Ejemplos:
  pnpm run news-search -- "Democracia Siempre" --since 2026-08-30
  pnpm run news-search -- "marcha estudiantil" --medio biobio --limit 10`);
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

  let q = o.query;
  if (o.since && !/after:/i.test(q) && !/when:/i.test(q)) q += ` after:${o.since}`;
  const url = `${GN_RSS}?q=${encodeURIComponent(q)}&hl=es-419&gl=CL&ceid=CL:es-419`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (gobierno-vault news-search; contacto editorial)' },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    console.error(`✖ Google News respondió HTTP ${res.status}`);
    process.exit(1);
  }
  const { known, titles } = vaultUrls();
  const out = [];
  for (const it of parseRss(await res.text())) {
    if (o.since && it.fecha && it.fecha < o.since) continue;
    if (o.medio) {
      const hay = `${it.medio || ''} ${it.dominio || ''}`.toLowerCase();
      if (!hay.includes(o.medio)) continue;
    }
    const nt = normTitle(it.titulo);
    let { url: original, slug } = resolveInCatalog(it);
    let enVault = false;
    if (original) {
      const norm = (() => { try { return normalizeUrlForMatch(original); } catch { return original; } })();
      enVault = known.has(norm);
    } else {
      // Catálogo desactualizado: probar título contra fuentes del vault.
      const hit = vaultTitleHit(titles, nt);
      if (hit) { original = hit; enVault = true; }
    }
    if (enVault && !o.all) continue;
    out.push({ ...it, url: original, slug, en_vault: enVault, sin_resolver: !original });
    if (out.length >= o.limit) break;
  }

  if (o.json) {
    console.log(JSON.stringify(out, null, 2));
    return;
  }
  if (!out.length) {
    console.log('(sin resultados nuevos — prueba con --all para ver duplicados, o ajusta la query)');
    return;
  }
  out.forEach((it, i) => {
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
  console.error(`\n${out.length} resultado(s) para: ${o.query}`);
}

main().catch((e) => { console.error(`✖ ${e.message}`); process.exit(1); });
