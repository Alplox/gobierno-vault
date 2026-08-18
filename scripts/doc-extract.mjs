#!/usr/bin/env node
/**
 * doc-extract.mjs — Convierte documentos de Office (Word/Excel/PowerPoint) a
 * Markdown estructurado para el vault, usando MarkItDown de Microsoft (Python).
 * Complementa a `pdf-extract.mjs` (que solo cubre PDF): muchas fuentes primarias
 * de gobierno llegan en .docx/.xlsx/.pptx (informes, minutas, tablas,
 * presentaciones) y no se pueden leer con la prensa ni los mirrors.
 *
 * Uso:
 *   pnpm run doc-extract -- https://sitio.cl/documento.docx          # markdown a stdout
 *   pnpm run doc-extract -- https://sitio.cl/documento.xlsx --out /tmp/doc.md
 *   pnpm run doc-extract -- /ruta/documento.pptx                    # archivo local
 *   pnpm run doc-extract -- https://sitio.cl/doc.docx --json         # metadatos + markdown
 *
 * Flags:
 *   --out <ruta>   Guarda el markdown extraido en un archivo
 *   --keep         Conserva el documento descargado (default: lo borra)
 *   --silent       No imprime el markdown (util con --out)
 *   --json         Imprime { formato, tamano, markdown }
 *
 * Requisito: Python 3 + `markitdown` (pip install --user markitdown). En
 * Windows el CLI se instala en el user-site de Python; este script usa
 * `python -m markitdown` (mas robusto que depender del .exe en PATH).
 *
 * Formatos soportados por MarkItDown: docx, xlsx, pptx, pdf, html, csv, json,
 * xml, txt, md, images (via LLM, no activado por defecto), audio/video.
 * Avisa si el documento es un formato no soportado.
 *
 */

import { writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname } from 'node:path';
import { execFileSync } from 'node:child_process';

const EXTENSIONS_SOPORTADAS = new Set([
  '.docx', '.xlsx', '.pptx', '.pdf', '.html', '.htm', '.csv', '.json', '.xml',
  '.txt', '.md', '.epub', '.odt', '.ods', '.odp',
]);

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

async function fetchDoc(url) {
  // Primero intento con fetch directo (Node); si falla, con curl_cffi
  // (impersonacion de navegador, via fetch-impersonate.mjs).
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(60_000),
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch (e) {
    const { fetchImpersonate } = await import('./fetch-impersonate.mjs');
    const buf = await fetchImpersonate(url);
    return buf;
  }
}

function runMarkitdown(filePath) {
  try {
    const stdout = execFileSync('python', ['-m', 'markitdown', filePath], {
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024,
      timeout: 180_000,
    });
    return stdout;
  } catch (e) {
    const msg = e.stderr?.toString?.() || e.message || '';
    if (/No module named 'markitdown'/.test(msg)) {
      throw new Error(
        'MarkItDown no esta instalado. Instalalo con: python -m pip install --user markitdown'
      );
    }
    throw new Error(`MarkItDown fallo: ${msg.split('\n').slice(-3).join(' | ')}`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  let markdown = null;
  let meta = {};

  if (opts.url) {
    const buf = await fetchDoc(opts.url);
    const ext = extname(new URL(opts.url).pathname).toLowerCase() || '.bin';
    if (!EXTENSIONS_SOPORTADAS.has(ext)) {
      console.error(
        `[doc-extract] AVISO: extension '${ext}' no esta en la lista soportada — MarkItDown puede fallar o producir salida vacia.`
      );
    }
    const docPath = join(tmpdir(), `gvault-doc-${Date.now()}${ext}`);
    writeFileSync(docPath, buf);
    meta.tamano = buf.length;
    try {
      markdown = runMarkitdown(docPath);
    } finally {
      if (!opts.keep) rmSync(docPath, { force: true });
    }
    console.error(
      `[doc-extract] ${ext || 'desconocido'} | ${meta.tamano} bytes | ${markdown?.length ?? 0} chars markdown`
    );
  } else if (opts.file && existsSync(opts.file)) {
    meta.tamano = readFileSync(opts.file).length;
    markdown = runMarkitdown(opts.file);
    console.error(
      `[doc-extract] ${extname(opts.file) || 'desconocido'} | ${meta.tamano} bytes | ${markdown?.length ?? 0} chars markdown`
    );
  } else {
    console.error('Uso: doc-extract <URL-del-documento> | <archivo> [flags]');
    process.exit(1);
  }

  if (opts.out) writeFileSync(opts.out, markdown ?? '', 'utf8');

  if (markdown && markdown.trim().length < 200) {
    console.error(
      `[doc-extract] ADVERTENCIA: extraccion casi vacia (${markdown.trim().length} chars) — el archivo puede ser un escaneo, un formato no soportado o requerir el converter extra de MarkItDown.`
    );
  }

  if (opts.json) {
    process.stdout.write(JSON.stringify({ ...meta, markdown: markdown ?? null }, null, 2) + '\n');
    return;
  }

  if (!opts.silent && markdown != null) process.stdout.write(markdown);
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;

if (isMain) {
  main().catch((e) => {
    console.error(`[doc-extract] ${e.message}`);
    process.exit(1);
  });
}
