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
 *   pnpm run pdf-extract -- /ruta/doc-ya-extraido.md                    # re-imprimir sin red
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

async function fetchPdf(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4 || buf.subarray(0, 4).toString('latin1') !== '%PDF') {
    throw new Error(`La respuesta de ${url} no parece un PDF (magic %PDF ausente)`);
  }
  return buf;
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
      const result = processPdf(buf);
      classification = result;
      markdown = result.markdown;
    } finally {
      if (!opts.keep) rmSync(pdfPath, { force: true });
    }
    console.error(
      `[pdf-extract] ${classification.pdfType} | confianza ${classification.confidence} | ` +
      `${classification.pageCount ?? '?'} paginas | ${markdown?.length ?? 0} chars markdown`
    );
    if (
      markdown == null ||
      (classification.pdfType !== 'TextBased' && classification.pdfType !== 'Mixed')
    ) {
      console.error(
        '[pdf-extract] ADVERTENCIA: PDF escaneado o sin capa de texto confiable — el markdown puede estar vacio o incompleto; requiere OCR.'
      );
    }
  } else if (opts.file && existsSync(opts.file)) {
    markdown = readFileSync(opts.file, 'utf8');
  } else {
    console.error('Uso: pdf-extract <URL-del-PDF> | <archivo.md> [flags]  (ver --help en el encabezado del script)');
    process.exit(1);
  }

  if (opts.out) writeFileSync(opts.out, markdown ?? '', 'utf8');

  if (markdown && markdown.trim().length < 500) {
    console.error(
      `[pdf-extract] ADVERTENCIA: extraccion casi vacia (${markdown.trim().length} chars) — posible PDF escaneado/imagen sin capa de texto.`
    );
  }

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
