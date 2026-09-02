#!/usr/bin/env node
/**
 * pdf-extract.mjs — Lee un PDF como Markdown estructurado para el vault:
 * descarga el archivo y lo procesa con `@firecrawl/pdf-inspector` (libreria
 * Rust nativa via NAPI, sin OCR, offline, ~5-6 MB). Conserva titulos (H1-H4),
 * listas, tablas, negritas/cursivas, subrayados y el orden de lectura
 * multicolumna. Pensado para leer documentos primarios durante
 * investigaciones/correcciones (planes filtrados, informes oficiales, fallos).
 *
 * Uso:
 *   pnpm run pdf-extract -- https://sitio.cl/documento.pdf              # markdown a stdout
 *   pnpm run pdf-extract -- https://sitio.cl/documento.pdf --out /tmp/doc.md
 *   pnpm run pdf-extract -- https://sitio.cl/documento.pdf --json       # clasificacion + markdown
 *   pnpm run pdf-extract -- /ruta/documento.pdf                         # PDF LOCAL (tambien cifrado)
 *   pnpm run pdf-extract -- /ruta/doc-ya-extraido.md                    # re-imprimir sin red
 *
 * Notas:
 *   - PDFs locales: si el argumento es una ruta existente cuyo contenido empieza
 *     con %PDF se procesa igual que uno descargado (soporta encriptacion de solo
 *     permisos, tipica de documentos oficiales como los del Banco Central).
 *   - Bloqueo bot: si la descarga directa devuelve HTTP 200 pero el cuerpo no es
 *     un PDF (challenge HTML, ej. bcentral.cl), se reintenta automaticamente con
 *     fetch-impersonate.mjs antes de fallar.
 *
 * Flags:
 *   --out <ruta>   Guarda el markdown extraido en un archivo
 *   --keep         Conserva el PDF descargado (default: lo borra)
 *   --silent       No imprime el markdown (util con --out)
 *   --json         Imprime { pdfType, confidence, pageCount, pagesNeedingOcr, markdown }
 *
 * Requisito: devDependency `@firecrawl/pdf-inspector` (binario nativo por
 * plataforma, sin modelos ML ni servicios externos). Si el PDF es escaneado
 * (sin capa de texto) la clasificacion lo detecta y avisa (requiere OCR).
 *
 */

import { writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { processPdf } from '@firecrawl/pdf-inspector';
import { fetchImpersonate } from './fetch-impersonate.mjs';

function parseArgs(argv) {
  const o = { url: null, file: null, out: null, keep: false, silent: false, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--keep') o.keep = true;
    else if (a === '--silent') o.silent = true;
    else if (a === '--json') o.json = true;
    else if (a.startsWith('http')) o.url = a;
    else if (!a.startsWith('-') && !o.file) o.file = a;
  }
  return o;
}

function isPdf(buf) {
  return Buffer.isBuffer(buf) && buf.subarray(0, 1024).includes('%PDF');
}

async function fetchPdf(url) {
  // Primero fetch directo de Node; si falla (bloqueo por fingerprinting TLS,
  // 403 de Cloudflare, etc.), relega a fetch-impersonate.mjs (curl_cffi, el
  // motor de curl-impersonate compatible con Windows).
  let buf = null;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(60_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  } catch {
    return await fetchImpersonate(url, { binary: true });
  }
  // Algunos sitios responden 200 con un challenge HTML en vez del PDF
  // (ej. bcentral.cl): en ese caso reintentar con impersonacion.
  if (!isPdf(buf)) {
    buf = await fetchImpersonate(url, { binary: true });
  }
  if (!isPdf(buf)) {
    throw new Error('La respuesta no es un PDF (posible bloqueo bot, login o 404).');
  }
  return buf;
}

function processBuffer(buf) {
  const result = processPdf(buf);
  const markdown = result.markdown;
  console.error(
    `[pdf-extract] ${result.pdfType} | confianza ${result.confidence} | ` +
    `${result.pageCount ?? '?'} paginas | ${markdown?.length ?? 0} chars markdown`
  );
  if (
    markdown == null ||
    (result.pdfType !== 'TextBased' && result.pdfType !== 'Mixed')
  ) {
    console.error(
      '[pdf-extract] ADVERTENCIA: PDF escaneado o sin capa de texto confiable — el markdown puede estar vacio o incompleto; requiere OCR.'
    );
  }
  if (markdown && markdown.trim().length < 500) {
    console.error(
      `[pdf-extract] ADVERTENCIA: extraccion casi vacia (${markdown.trim().length} chars) — posible PDF escaneado/imagen sin capa de texto.`
    );
  }
  return { classification: result, markdown };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  let markdown;
  let classification = null;

  if (opts.url) {
    const buf = await fetchPdf(opts.url);
    const pdfPath = join(tmpdir(), `gvault-pdf-${Date.now()}.pdf`);
    writeFileSync(pdfPath, buf);
    try {
      ({ classification, markdown } = processBuffer(buf));
    } finally {
      if (!opts.keep) rmSync(pdfPath, { force: true });
    }
  } else if (opts.file && existsSync(opts.file)) {
    const head = readFileSync(opts.file).subarray(0, 1024);
    if (head.includes('%PDF')) {
      // PDF local (incluye cifrados de solo permisos): mismo pipeline que URL.
      ({ classification, markdown } = processBuffer(readFileSync(opts.file)));
    } else {
      // Archivo .md ya extraido: solo re-imprimir.
      markdown = readFileSync(opts.file, 'utf8');
    }
  } else {
    console.error('Uso: pdf-extract <URL-del-PDF> | <archivo.pdf> | <archivo.md> [flags]  (ver --help en el encabezado del script)');
    process.exit(1);
  }

  if (opts.out) writeFileSync(opts.out, markdown ?? '', 'utf8');

  if (opts.json) {
    process.stdout.write(
      JSON.stringify({ ...(classification ?? {}), markdown: markdown ?? null }, null, 2) + '\n'
    );
    return;
  }

  if (!opts.silent && markdown != null) process.stdout.write(markdown);
}

// Solo ejecutar el CLI cuando el script se invoca directamente (no al importar).
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  main().catch((e) => {
    console.error(`[pdf-extract] ${e.message}`);
    process.exit(1);
  });
}
