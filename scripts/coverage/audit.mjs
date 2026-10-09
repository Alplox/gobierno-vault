// Auditoría de puntos ciegos: prensa (catálogo local) vs vault vs agenda oficial.
//
// Motiva el sesgo estructural del vault: la cola de eventos la llena la prensa
// (sitemaps + news-search), así que cuando la atención se concentra en una
// historia, lo que ocurre en paralelo nunca entra a la cola y no queda registro
// de la omisión. Este script produce ese registro.
//
// Uso:
//   pnpm run coverage-audit -- [--from YYYY-MM-DD] [--to YYYY-MM-DD]
//                             [--min-medios N] [--top N] [--focus <regex>]
//                             [--json] [--strict]
//
// Con --from/--to acota el rango (por defecto, los 3 días que terminan ayer).
// --min-medios filtra los términos de prensa considerados "historia" (default 6).
// --focus mide cuánta atención concentró una historia dominante (regex sobre
//   título+URL del catálogo, ej. --focus "yo elijo mi pc|becas tic|junaeb").
// --strict sale con código 1 si hay brechas o eventos sin fuente oficial.
//
// Salidas (secciones):
//   PRENSA   términos más extendidos por n.º de medios distintos (concentración)
//   VAULT    eventos del rango con fuentes citadas y fuentes oficiales
//   BRECHAS  términos fuertes en prensa sin evento en el rango (candidatos)
//   OFICIAL  actos oficiales catalogados en el rango + estado de actualización
//
// Advertencia: BRECHAS es un screening por términos de slug/título (ruidoso).
// Cada candidato trae URLs de muestra para juicio humano y el comando sugerido
// (`pnpm run news-search`) para confirmar antes de crear un evento.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { MEDIA } from '../sitemaps/media.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const WEBSITES_DIR = join(ROOT, 'sitemaps', 'websites');
const EVENTS_DIR = join(ROOT, 'src', 'content', 'events');
const SOURCES_DIR = join(ROOT, 'src', 'content', 'sources');
const EVENTS_INDEX = join(ROOT, 'EVENTS_INDEX.md');

// ---------------------------------------------------------------------------
// Dominios del Estado: son la pata "independiente de la prensa" del cruce.
// ---------------------------------------------------------------------------
const OFFICIAL_HOST_RE = new RegExp(
  '(?:^|\\.)(?:' +
    [
      'gob\\.cl', // presidencia, ministerios, servicios (cubre *.gob.cl)
      'senado\\.cl',
      'camara\\.cl',
      'bcn\\.cl',
      'leychile\\.cl',
      'contraloria\\.cl',
      'tribunalconstitucional\\.cl',
      'pjud\\.cl',
      'poderjudicial\\.cl',
      'diariooficial\\.interior\\.gob\\.cl',
      'ine\\.gob\\.cl',
      'servel\\.cl',
      'senapred\\.cl',
      'conaf\\.cl',
    ].join('|') +
    ')$',
  'i'
);

function isOfficialHost(host) {
  return OFFICIAL_HOST_RE.test(String(host || '').replace(/^www\./i, ''));
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------------------
// Normalización y términos
// ---------------------------------------------------------------------------
const STOPWORDS = new Set(
  (
    'de la el los las un una unos unas y o u e en a al del con sin por para que se su sus es son como mas más ' +
    'pero ni desde hasta entre sobre tras durante cuando donde quien quienes cual cuales este esta esto estos estas ' +
    'ese esa eso esos esas aquel aquella no si ya lo le les me te nos mi tu yo el ella ellos ellas otro otra ' +
    'otros otras mismo misma tan tanto como cada todo toda todos todas hay fue ser estar hace hacer tiene tienen ' +
    'solo sólo tambien también aunque ademas además luego tras segun según contra ante bajo cabe hacia ' +
    'chile chileno chilena chilenos chilenas nacional internacional noticias noticia video videos fotos galeria ' +
    'galería resumen minuto minuto-a-minuto minuto a minuto ultima últimas ultimo último ultimas últimas hora horas ' +
    'live vivo directo podcast programa programas episodio episodios temporada capitulo capítulo ' +
    'actualidad regiones region zona norte sur centro mundo economia economía deportes tendencias tecnologia ' +
    'ciencia ciencias tecnologia-y-ciencias espectaculos espectáculos cultura politica política opinión opinion ' +
    'columnas blogs temas site html htm php index article articulos artículo articulo news www http https cl com ' +
    'net org este esta esto esas esos sobre puede pueden debe deben tras aqui aquí ahora desde mayor menor nuevo ' +
    'nueva nuevos nuevas tras paso pasos dia dia dias días mes meses ano anos años semana semanas ' +
    'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre ' +
    'lunes martes miercoles miércoles jueves viernes sabado sábado domingo 2024 2025 2026 2027 ' +
    'dos tres cuatro cinco seis siete ocho nueve diez once doce primer primera primero segundo segunda tercer ' +
    'tercera ministro ministra diputado diputada senador senadora presidente presidenta gobierno millones mil ' +
    'personas persona nuevo nueva tras caso casos parte partes puede podria podrían dice dijo asegura segun ' +
    'video audio vivo directo especial especiales opinion opinión columna columnas hora horas minuto minutos ' +
    'proyecto proyectos vehiculo motor empleo desempleo ataque fuerte busca recursos obras obra mujer mujeres ' +
    'presenta presento regreso retorno termino confirma haber sobrevive condenada condenado cyber ' +
    'real evitar mato tenido debido palabra reacciona inesperada promociones reality guardiola ' +
    'tras pasa pasan quedo queda dejan deja suman suma llega llegan ' +
    'banco cafe apunta critica impacto tragedia monday estudio nadie mejor estan adulto detras posibles ' +
    'vamos proteger requisitos obtener minimo tenemos david romance poblacion error ' +
    'cristiano ronaldo futbol seleccion partido futbolista champions tenis ' +
    'texto completo aqu\u00ed ahora d\u00eda d\u00edas anos años ano mes meses semana semanas'
  )
    .split(/\s+/)
    .filter(Boolean)
);

const stripAccents = (s) => String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function normText(s) {
  return stripAccents(String(s || '').toLowerCase())
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokensOf(s) {
  return normText(s).split(' ').filter(Boolean);
}

// Términos de un artículo: unigramas (>=4 letras) y bigramas (>=3 letras por
// token) que capturan temas compuestos ("punta arenas", "alerta roja").
function termsOf(text) {
  const toks = tokensOf(text);
  const out = new Set();
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t)) out.add(t);
    const n = toks[i + 1];
    if (n && t.length >= 3 && n.length >= 3 && !STOPWORDS.has(t) && !STOPWORDS.has(n) && !/^\d+$/.test(t) && !/^\d+$/.test(n)) {
      out.add(`${t} ${n}`);
    }
  }
  return out;
}

// "contiene la frase como palabra(s) completa(s)" sobre texto ya normalizado.
function hasPhrase(normHaystack, term) {
  return ` ${normHaystack} `.includes(` ${term} `);
}

// ---------------------------------------------------------------------------
// Catálogo de prensa
// ---------------------------------------------------------------------------
function daterange(from, to) {
  const out = [];
  const cur = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(cur.getTime()) || Number.isNaN(end.getTime()) || cur > end) return out;
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

function yearsOf(dates) {
  return [...new Set(dates.map((d) => d.slice(0, 4)))];
}

function readCatalogEntries(dir, years) {
  const out = [];
  for (const y of years) {
    const f = join(dir, `${y}.jsonl`);
    if (!existsSync(f)) continue;
    let raw;
    try {
      raw = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      try {
        out.push(JSON.parse(line));
      } catch {
        /* línea corrupta */
      }
    }
  }
  return out;
}

// Escanea todos los medios y devuelve las entradas del rango + agregación de
// términos (medios distintos, artículos, muestras de URL) + actividad oficial.
// Medios de alcance nacional: un tema con cobertura nacional pesa más como
// candidato que una noticia local sindicada a una cadena regional. Editable.
const NATIONAL_MEDIA = new Set([
  '24horas', 'adnradio', 'biobiochile', 'chilevision', 'ciper', 'cnnchile', 'cooperativa', 'df', 'duna',
  'eldesconcierto', 'eldefinido', 'eldinamo', 'elmostrador', 'elpais', 'emol', 'ex_ante', 'holanews',
  'la_hora', 'lacuarta', 'lasegunda', 'latercera', 'meganoticias', 'publimetro', 'radio_uchile', 'reuters',
  'theclinic', 'tvn',
]);

// Rutas de sección que no corresponden al ámbito del vault (gobierno de Chile):
// noticias internacionales, deportes, farándula, clima y servicios.
const OFFTOPIC_SECTION_RE = /\/(internacional|mundo|deportes|deporte|espectaculos|tendencias|tecnologia|el-tiempo|horoscopo|te-sirve|revista)(\/|$)/i;

// Medios extranjeros: sus notas no son eventos del gobierno de Chile.
const FOREIGN_HOST_RE = /(france24|bbc\.|dw\.com|deutsche|reuters|elpais\.com|infobae|holanews|mercopress|ntn24|cnn\.com|eluniversal|clarin\.com|lanacion|actualidad\.rt|sputnik|telesur|apnews|efe\.com|ansa\.it|teleSUR)/i;

function scanPress(dates, years, opts = {}) {
  const { focusRe = null, nacionalOnly = false } = opts;
  const dateSet = new Set(dates);

  // 1) Entradas del rango en memoria (≈2.500 para 3 días): permite deduplicar
  //    el contenido sindicado entre dominios antes de contar términos.
  const raw = [];
  let totalDirs = 0;
  if (existsSync(WEBSITES_DIR)) {
    for (const slug of readdirSync(WEBSITES_DIR)) {
      totalDirs++;
      let entries;
      try {
        entries = readCatalogEntries(join(WEBSITES_DIR, slug), years);
      } catch {
        continue;
      }
      for (const e of entries) {
        if (!e.d || !dateSet.has(e.d)) continue;
        let pathname = '';
        let host = '';
        try {
          const u = new URL(e.u);
          pathname = u.pathname;
          host = u.hostname.replace(/^www\./i, '').toLowerCase();
        } catch {
          /* url rara */
        }
        raw.push({ slug, url: e.u, fecha: e.d, title: e.t || '', pathname, host });
      }
    }
  }

  // 2) "Marca": si un mismo pathname aparece en 2+ dominios es la misma nota
  //    republicada (cadenas regionales); cuenta como una sola marca para no
  //    inflar artificialmente la extensión de un tema local.
  const pathDomains = new Map();
  for (const e of raw) {
    if (!e.pathname) continue;
    if (!pathDomains.has(e.pathname)) pathDomains.set(e.pathname, new Set());
    pathDomains.get(e.pathname).add(e.slug);
  }
  const brandOf = (e) =>
    e.pathname && (pathDomains.get(e.pathname)?.size || 0) > 1 ? `syn:${e.pathname}` : e.slug;

  const terms = new Map();
  const officialEntries = [];
  const mediaHit = new Set();
  const focusMedia = new Set();
  let focusArticles = 0;

  for (const e of raw) {
    const brand = brandOf(e);
    mediaHit.add(e.slug);
    if (e.host && isOfficialHost(e.host)) {
      officialEntries.push({
        medio: MEDIA[e.slug]?.nombre || e.slug,
        slug: e.slug,
        fecha: e.fecha,
        titulo: e.title,
        url: e.url,
      });
    }
    const haystack = `${e.title} ${e.pathname.replace(/[/-]+/g, ' ')}`;
    if (focusRe && focusRe.test(haystack)) {
      focusArticles++;
      focusMedia.add(brand);
    }
    if (nacionalOnly && !NATIONAL_MEDIA.has(e.slug)) continue;
    const offTopic = OFFTOPIC_SECTION_RE.test(e.pathname) || FOREIGN_HOST_RE.test(e.host);
    for (const term of termsOf(haystack)) {
      let t = terms.get(term);
      if (!t) {
        t = { brands: new Map(), nacional: new Set(), offTopic: 0, count: 0, samples: [] };
        terms.set(term, t);
      }
      t.brands.set(brand, (t.brands.get(brand) || 0) + 1);
      if (NATIONAL_MEDIA.has(e.slug)) t.nacional.add(e.slug);
      if (offTopic) t.offTopic++;
      t.count++;
      if (t.samples.length < 3) t.samples.push(e.url);
    }
  }

  return {
    terms,
    officialEntries,
    articles: raw.length,
    media: mediaHit.size,
    totalDirs,
    focusArticles,
    focusMedia,
  };
}

// ---------------------------------------------------------------------------
// Vault: eventos y fuentes
// ---------------------------------------------------------------------------
function eventFilesInRange(dates) {
  const byMonth = new Map();
  for (const d of dates) {
    const y = d.slice(0, 4);
    const m = d.slice(5, 7);
    const key = `${y}/${m}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(d.replace(/-/g, ''));
  }
  const files = [];
  for (const [key, days] of byMonth) {
    const dir = join(EVENTS_DIR, key);
    if (!existsSync(dir)) continue;
    const set = new Set(days);
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.md')) continue;
      if (set.has(f.slice(0, 8))) files.push({ id: f.replace(/\.md$/, ''), path: join(dir, f) });
    }
  }
  return files.sort((a, b) => a.id.localeCompare(b.id));
}

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const SOURCE_LINK_RE = /\[\[sources\/([^\]|]+)(?:\|[^\]]*)?\]\]/g;

function readRangeEvents(dates) {
  const events = [];
  const sourceIdsUsed = new Set();
  for (const { id, path } of eventFilesInRange(dates)) {
    let raw;
    try {
      raw = readFileSync(path, 'utf8');
    } catch {
      continue;
    }
    const m = raw.match(FM_RE);
    let fm = {};
    if (m) {
      try {
        fm = YAML.parse(m[1]) || {};
      } catch {
        fm = {};
      }
    }
    const body = m ? raw.slice(m[0].length) : raw;
    const srcIds = new Set();
    for (const s of body.matchAll(SOURCE_LINK_RE)) {
      const sid = s[1].trim();
      srcIds.add(sid);
      sourceIdsUsed.add(sid);
    }
    const asArr = (v) => (Array.isArray(v) ? v : v ? String(v).split(/[,;]/).map((x) => x.trim()) : []);
    events.push({
      id,
      titulo: String(fm.titulo || ''),
      tipo: String(fm.tipo || ''),
      fecha: fm.fecha ? String(fm.fecha).slice(0, 10) : '',
      tema: asArr(fm.tema),
      etiquetas: asArr(fm.etiquetas),
      fuentes: srcIds,
    });
  }
  return { events, sourceIdsUsed };
}

// Mapa id→{url} de las fuentes referenciadas (perezoso: solo las usadas).
function sourceUrlMap(ids) {
  const map = new Map();
  for (const id of ids) {
    const f = join(SOURCES_DIR, `${id}.md`);
    if (!existsSync(f)) continue;
    let raw;
    try {
      raw = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    const m = raw.match(FM_RE);
    if (!m) continue;
    const urlM = m[1].match(/^url:\s*(.+)$/m);
    const medioM = m[1].match(/^medio:\s*(.+)$/m);
    map.set(id, {
      url: urlM ? urlM[1].trim().replace(/^"|"$/g, '') : '',
      medio: medioM ? medioM[1].trim().replace(/^"|"$/g, '') : '',
    });
  }
  return map;
}

// Historial: ¿cuántos eventos del vault mencionan el término en su título?
// Se lee del índice generado (títulos de TODO el vault) — barato y suficiente.
function loadHistoryLines() {
  if (!existsSync(EVENTS_INDEX)) return [];
  let raw;
  try {
    raw = readFileSync(EVENTS_INDEX, 'utf8');
  } catch {
    return [];
  }
  const lines = [];
  for (const line of raw.split('\n')) {
    if (!line.includes('src/content/events/')) continue;
    lines.push(normText(line));
  }
  return lines;
}

// ---------------------------------------------------------------------------
// Estado del catálogo oficial (¿está al día para el rango pedido?)
// ---------------------------------------------------------------------------
function officialCatalogStatus(dates, years) {
  const slugs = new Set();
  for (const [slug, cfg] of Object.entries(MEDIA)) {
    for (const k of ['robots', 'index']) {
      if (cfg[k] && isOfficialHost(hostOf(cfg[k]))) slugs.add(slug);
    }
  }
  let last = '';
  let entries = 0;
  for (const slug of slugs) {
    const dir = join(WEBSITES_DIR, slug);
    if (!existsSync(dir)) continue;
    for (const e of readCatalogEntries(dir, years)) {
      if (!e.d) continue;
      entries++;
      if (e.d > last) last = e.d;
    }
  }
  return { slugs: [...slugs].sort(), last, entries };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const o = {
    from: null,
    to: null,
    minMedios: 3,
    top: 20,
    focus: null,
    json: false,
    strict: false,
    nacionalOnly: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from') o.from = argv[++i];
    else if (a === '--to') o.to = argv[++i];
    else if (a === '--min-medios') o.minMedios = Math.max(1, parseInt(argv[++i], 10) || 3);
    else if (a === '--top') o.top = Math.max(1, parseInt(argv[++i], 10) || 20);
    else if (a === '--focus') o.focus = argv[++i];
    else if (a === '--nacional-only') o.nacionalOnly = true;
    else if (a === '--json') o.json = true;
    else if (a === '--strict') o.strict = true;
    else if (a === '--help' || a === '-h') o.help = true;
  }
  return o;
}

function help() {
  console.log(`Uso: pnpm run coverage-audit -- [--from YYYY-MM-DD] [--to YYYY-MM-DD]
                                     [--min-medios N] [--top N] [--focus <regex>]
                                     [--json] [--strict]

  --from/--to   rango inclusivo (por defecto: los 3 días que terminan ayer)
  --min-medios  n.º mínimo de marcas (medios; se deduplica sindicación) para
                considerar un término "historia" (default 3)
  --top         máximo de términos/brechas a mostrar (default 20)
  --focus       mide cuánta atención concentró una historia (regex sobre título+URL)
  --nacional-only  agrega términos solo de medios nacionales (mayor precisión,
                 menor recall: pierde señales locales como la de Punta Arenas)
  --json        salida JSON (para pipelines) en vez de texto
  --strict      sale con código 1 si hay brechas o eventos sin fuente oficial

Ejemplos:
  pnpm run coverage-audit -- --from 2026-10-01 --to 2026-10-03
  pnpm run coverage-audit -- --from 2026-10-01 --to 2026-10-03 --focus "yo elijo|becas tic|junaeb"
  pnpm run coverage-audit -- --from 2026-10-01 --to 2026-10-03 --json > tmp/audit.json`);
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help) {
    help();
    return 0;
  }

  const today = new Date();
  const defTo = new Date(today.getTime() - 86400000).toISOString().slice(0, 10);
  const defFrom = new Date(today.getTime() - 3 * 86400000).toISOString().slice(0, 10);
  const from = o.from || defFrom;
  const to = o.to || defTo;
  const dates = daterange(from, to);
  if (!dates.length) {
    console.error('✖ rango inválido: usa --from/--to en formato YYYY-MM-DD (from <= to)');
    return 1;
  }

  const years = yearsOf(dates);

  let focusRe = null;
  if (o.focus) {
    try {
      focusRe = new RegExp(o.focus, 'i');
    } catch {
      console.error(`✖ --focus no es un regex válido: ${o.focus}`);
      return 1;
    }
  }
  const press = scanPress(dates, years, { focusRe, nacionalOnly: o.nacionalOnly });

  // Vault
  const { events, sourceIdsUsed } = readRangeEvents(dates);
  const urlMap = sourceUrlMap(sourceIdsUsed);
  const rangeCoverage = normText(
    events.map((e) => `${e.titulo} ${e.tema.join(' ')} ${e.etiquetas.join(' ')}`).join(' ')
  );

  for (const e of events) {
    const official = [...e.fuentes].filter((id) => isOfficialHost(hostOf(urlMap.get(id)?.url || '')));
    e.oficiales = official;
  }
  const totalFuentes = events.reduce((n, e) => n + e.fuentes.size, 0);
  const eventosSinOficial = events.filter((e) => e.oficiales.length === 0);
  const sinFuentesSuficientes = events.filter((e) => e.fuentes.size < 3);

  // Prensa: ranking por medios distintos
  // Especificidad: un término "historia" (un solo hecho replicado en muchos
  // medios) tiene ~1 artículo por medio. Los genéricos ("presupuesto",
  // "gobierno") se repiten dentro del mismo medio y se descartan como unigrama.
  const ranked = [...press.terms.entries()]
    .map(([term, e]) => ({
      term,
      medios: e.brands.size,
      nacional: e.nacional.size,
      articulos: e.count,
      maxMedio: Math.max(1, ...e.brands.values()),
      offTopic: e.offTopic,
      bi: term.includes(' '),
      ej: e.samples,
    }))
    // Especificidad por dispersión: un hecho concreto lo publica cada marca
    // una vez (maxMedio bajo); una palabra genérica se repite dentro de la
    // misma marca. Se descarta además lo ajeno al ámbito del vault
    // (internacional, deportes, clima, servicios).
    .filter((t) => t.offTopic / Math.max(1, t.articulos) < 0.5)
    // Los bigramas son específicos por construcción ("punta arenas", "tenencia
    // fronteriza"); los unigramas necesitan dispersión baja para no ser genéricos.
    .filter((t) => t.maxMedio <= (t.bi ? 8 : 2))
    .sort((a, b) => b.nacional - a.nacional || b.medios - a.medios || b.articulos - a.articulos);

  // Concentración (opcional)
  const focus = o.focus
    ? { patron: o.focus, articulos: press.focusArticles, medios: press.focusMedia.size, total: press.articles }
    : null;

  // Brechas: términos fuertes en prensa que NO están en título/tema/etiquetas de
  // ningún evento del rango.
  const histLines = loadHistoryLines();
  const raw = ranked
    .filter((t) => t.medios >= o.minMedios)
    .filter((t) => !hasPhrase(rangeCoverage, t.term))
    .map((t) => {
      let hist = 0;
      for (const line of histLines) if (hasPhrase(line, t.term)) hist++;
      return { ...t, hist };
    })
    .sort((a, b) => b.nacional - a.nacional || b.medios - a.medios || a.hist - b.hist);

  // Colapsa términos que apuntan a la MISMA noticia (comparten URL de muestra),
  // porque un mismo artículo genera varios bigramas ("camion vuelca",
  // "cruce manao", "vientos tornadicos"...). Representante: el de mayor señal.
  const byStory = new Map();
  for (const t of raw) {
    const key = (t.ej[0] || t.term).replace(/[?#].*$/, '');
    let g = byStory.get(key);
    if (!g) {
      g = { ...t, coTerminos: [] };
      byStory.set(key, g);
    } else {
      g.coTerminos.push(t.term);
      if (
        t.nacional > g.nacional ||
        (t.nacional === g.nacional && t.articulos > g.articulos) ||
        (t.nacional === g.nacional && t.articulos === g.articulos && t.term.length > g.term.length)
      ) {
        const co = g.coTerminos;
        g = { ...t, coTerminos: [...co, g.term].slice(0, 6) };
        byStory.set(key, g);
      }
    }
  }
  const brechas = [...byStory.values()].sort(
    (a, b) => b.nacional - a.nacional || b.medios - a.medios || a.hist - b.hist
  );

  // Agenda oficial del rango + estado del catálogo
  const officialStatus = officialCatalogStatus(dates, years);
  const officialInRange = press.officialEntries;

  const report = {
    rango: { desde: from, hasta: to, dias: dates.length },
    prensa: {
      articulos: press.articles,
      medios: press.media,
      medios_escaneados: press.totalDirs,
      focus,
      top: ranked.slice(0, o.top),
    },
    vault: {
      eventos: events.map((e) => ({
        id: e.id,
        fecha: e.fecha,
        tipo: e.tipo,
        titulo: e.titulo,
        fuentes: e.fuentes.size,
        oficiales: e.oficiales.length,
      })),
      total_fuentes: totalFuentes,
      eventos_sin_oficial: eventosSinOficial.map((e) => e.id),
      eventos_bajo_minimo: sinFuentesSuficientes.map((e) => ({ id: e.id, fuentes: e.fuentes.size })),
    },
    brechas: brechas.slice(0, o.top),
    oficial: {
      catalogo_en_rango: officialInRange.slice(0, o.top),
      total_en_rango: officialInRange.length,
      ultimo_catalogado: officialStatus.last,
      desactualizado: !officialStatus.last || officialStatus.last < to,
      slugs: officialStatus.slugs,
    },
  };

  if (o.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(report, o);
  }

  if (o.strict && (brechas.length > 0 || eventosSinOficial.length > 0 || officialStatus.last < to)) return 1;
  return 0;
}

// ---------------------------------------------------------------------------
// Salida legible
// ---------------------------------------------------------------------------
function printReport(r, o) {
  const line = '─'.repeat(64);
  console.log(`\n══ Auditoría de puntos ciegos · ${r.rango.desde} → ${r.rango.hasta} ══\n`);

  console.log('── PRENSA (catálogo local) ' + line.slice(0, 36));
  console.log(`  ${r.prensa.articulos} artículos · ${r.prensa.medios} medios con publicaciones · ${r.prensa.medios_escaneados} medios escaneados`);
  if (r.prensa.focus) {
    const pct = r.prensa.focus.total ? ((r.prensa.focus.articulos / r.prensa.focus.total) * 100).toFixed(1) : '0';
    console.log(`  concentración: /${r.prensa.focus.patron}/ ≈ ${r.prensa.focus.articulos} de ${r.prensa.focus.total} artículos (${pct}%) en ${r.prensa.focus.medios} medios`);
  } else {
    console.log('  (usa --focus "<regex>" para medir la atención que concentró la historia dominante)');
  }
  console.log('  términos más extendidos (por n.º de medios):');
  for (const t of r.prensa.top.slice(0, 12)) {
    console.log(`    ${String(t.medios).padStart(3)} medios ${String(t.articulos).padStart(5)} art  ${t.term}`);
  }

  console.log(`\n── VAULT ` + line.slice(0, 56));
  console.log(`  ${r.vault.eventos.length} eventos · ${r.vault.total_fuentes} fuentes citadas (únicas)`);
  for (const e of r.vault.eventos) {
    const flag = e.fuentes < 3 ? '⚠ ' : '  ';
    const off = e.oficiales > 0 ? `· ${e.oficiales} oficial${e.oficiales > 1 ? 'es' : ''}` : '· sin fuente oficial';
    console.log(`  ${flag}${e.id}  ${String(e.fuentes).padStart(3)} fuentes ${off}  ${e.titulo.slice(0, 64)}`);
  }

  console.log(`\n── BRECHAS (prensa fuerte, sin evento en el rango) ` + line.slice(0, 16));
  if (!r.brechas.length) {
    console.log(`  sin candidatos con ≥ ${o.minMedios} medios`);
  } else {
    console.log(`  ${r.brechas.length} candidato(s) — lista de EXPLORACIÓN (por eco nacional, no por daño):`);
    console.log('  es un screening por términos de slug/título, con ruido; verificar antes de crear evento.');
    for (const b of r.brechas) {
      const co = b.coTerminos?.length ? `  (también: ${b.coTerminos.slice(0, 4).join(', ')})` : '';
      console.log(`  • ${b.nacional} nacional(es) · ${b.medios} medios · ${b.articulos} art · ${b.hist} evento(s) histórico(s)  "${b.term}"${co}`);
      for (const u of b.ej.slice(0, 2)) console.log(`      ${u}`);
      console.log(`      → pnpm run news-search -- "${b.term}" --since ${r.rango.desde}`);
    }
  }

  console.log(`\n── AGENDA OFICIAL ` + line.slice(0, 47));
  console.log(`  actos oficiales catalogados en el rango: ${r.oficial.total_en_rango}`);
  for (const e of r.oficial.catalogo_en_rango.slice(0, 8)) {
    console.log(`  • ${e.fecha}  ${e.medio}  ${e.titulo.slice(0, 60)}`);
    console.log(`      ${e.url}`);
  }
  if (r.oficial.desactualizado) {
    console.log(`  ⚠ catálogo oficial sin cobertura hasta ${r.rango.hasta} (último acto: ${r.oficial.ultimo_catalogado || 'ninguno'}).`);
    console.log(`     refrescar: ${r.oficial.slugs.slice(0, 6).map((s) => `pnpm run sitemaps-sync -- ${s}`).join(' ; ')}`);
  }
  if (r.vault.eventos_sin_oficial.length) {
    console.log(`  ⚠ ${r.vault.eventos_sin_oficial.length} evento(s) sin ninguna fuente oficial: ${r.vault.eventos_sin_oficial.slice(0, 10).join(', ')}`);
  }
  console.log('');
}

const code = main();
process.exit(code);
