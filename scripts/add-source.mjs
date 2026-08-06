#!/usr/bin/env node
/**
 * add-source.mjs — Genera el bloque YAML de una fuente para `src/data/sources.yaml`
 * a partir de una URL, extrayendo titulo, autor y fecha automaticamente.
 *
 * Uso:
 *   pnpm run add-source -- https://www.latercera.com/articulo/...
 *   pnpm run add-source -- --append https://www.t13.cl/noticia/...
 *   pnpm run add-source            (pregunta interactiva por la URL)
 *
 * Flags:
 *   --append   Agrega el bloque generado directamente al final de sources.yaml
 *   --mirror   Fuerza el uso del espejo r.jina.ai aunque el HTML directo responda
 */

import { readFileSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SOURCES_PATH = join(ROOT, 'src', 'data', 'sources.yaml');

const MIRROR_PREFIXES = {
  jina: 'https://r.jina.ai/',
  paywallskip: 'https://www.paywallskip.com/article?url=',
};

const COMMON_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

// ---------------------------------------------------------------------------
// Herramientas de terminal
// ---------------------------------------------------------------------------
const rl = readline.createInterface({ input, output });

async function ask(question, defaultValue) {
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
const DEFAULT_DOMAIN_MEDIO = {
  'latercera.com': 'La Tercera',
  'emol.com': 'Emol',
  'cnnchile.com': 'CNN Chile',
  't13.cl': 'T13',
  'adnradio.cl': 'ADN Radio',
  'biobiochile.cl': 'Radio Bío Bío',
  'cooperativa.cl': 'Cooperativa',
  'radio.uchile.cl': 'Radio Universidad de Chile',
  'lasegunda.com': 'La Segunda',
  'lacuarta.com': 'La Cuarta',
  'theclinic.cl': 'The Clinic',
  'ciperchile.cl': 'CIPER Chile',
  'ex-ante.cl': 'Ex-Ante',
  'elmostrador.cl': 'El Mostrador',
  'eldinamo.cl': 'El Dínamo',
  'pagina7.cl': 'Página 7',
  'publimetro.cl': 'Publimetro',
  'chvnoticias.cl': 'CHV Noticias',
  'meganoticias.cl': 'Meganoticias',
  '24horas.cl': '24 Horas',
  'gob.cl': 'Gobierno de Chile',
  'senado.cl': 'Senado de Chile',
  'camara.cl': 'Cámara de Diputados',
  'pjud.cl': 'Poder Judicial',
  'bcn.cl': 'Biblioteca del Congreso',
  'ine.cl': 'INE',
  'senapred.cl': 'SENAPRED',
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
  const map = { ...DEFAULT_DOMAIN_MEDIO };
  try {
    const data = YAML.parse(readFileSync(SOURCES_PATH, 'utf8')) ?? {};
    for (const [id, src] of Object.entries(data)) {
      if (!src?.url || !src?.medio) continue;
      const host = hostnameOf(src.url);
      if (host) map[host] = src.medio;
    }
  } catch (err) {
    logWarn(`No se pudo leer sources.yaml para el mapa de medios: ${err.message}`);
  }
  return map;
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
// YAML helpers
// ---------------------------------------------------------------------------
function yamlStr(value) {
  const s = String(value);
  // Solo deja plano si es seguro; si no, entrecomilla con dobles.
  if (/^[A-Za-z0-9_ ,.()%$€/]+$/.test(s) && !/[:#]/.test(s)) return s;
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function buildBlock(id, fields) {
  const lines = [
    `${id}:`,
    `  tipo: ${fields.tipo}`,
    `  medio: ${yamlStr(fields.medio)}`,
    `  titulo: ${yamlStr(fields.titulo)}`,
    `  autor: ${yamlStr(fields.autor)}`,
    `  fecha: ${fields.fecha}`,
    `  url: ${fields.url}`,
  ];
  if (fields.notas) lines.push(`  notas: ${yamlStr(fields.notas)}`);
  return lines.join('\n');
}


// ---------------------------------------------------------------------------
// Flujo principal
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const urlArg = args.find((a) => !a.startsWith('--'));

  logInfo('Generador de fuentes para sources.yaml');
  logInfo('--------------------------------------');

  let url = urlArg;
  if (!url) {
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

  // --- Fetch ------------------------------------------------
  let html = null;
  let jina = null;
  let resolvedUrl = url;

  if (!flags.has('--mirror')) {
    logInfo(`Obteniendo ${url} ...`);
    const res = await fetchText(url);
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

  if (!html) {
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

  // --- Extraccion -------------------------------------------
  let titulo = html ? extractHtmlTitle(html) : null;
  let autor = html ? extractHtmlAuthor(html) : null;
  let fecha = html ? extractHtmlDate(html) : null;

  if (jina) {
    const j = extractJina(jina);
    titulo = titulo || j.title;
    autor = autor || j.author;
    fecha = fecha || j.date;
  }

  // Normalizar la URL a la del articulo original (nunca el espejo).
  if (/^https?:\/\//i.test(resolvedUrl)) url = resolvedUrl;

  // --- Medio ------------------------------------------------
  const domainMedio = buildDomainMedioMap();
  let medio = domainMedio[host] || '';
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
  console.log('BLOQUE GENERADO — copia esto en sources.yaml:');
  console.log('='.repeat(64));
  console.log(block);
  console.log('-'.repeat(64));
  console.log(`Wikilink para usar inline en eventos:  [[source/${id}]]`);
  console.log('='.repeat(64) + '\n');

  // --- Colision e indicaciones ------------------------------
  try {
    const data = YAML.parse(readFileSync(SOURCES_PATH, 'utf8')) ?? {};
    if (Object.prototype.hasOwnProperty.call(data, id)) {
      logWarn(`OJO: el ID "${id}" ya existe en sources.yaml. Revisa antes de pegar.`);
    }
  } catch { /* ignorar */ }

  if (flags.has('--append')) {
    if (await confirm('Agregar este bloque al final de sources.yaml?')) {
      appendFileSync(SOURCES_PATH, `\n${block}\n`);
      logOk(`BLOQUE AGREGADO a ${SOURCES_PATH}`);
    }
  } else {
    logInfo('Para agregarlo automaticamente al archivo, vuelve a correr con --append.');
  }

  rl.close();
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});

