#!/usr/bin/env node
/**
 * fetch-impersonate.mjs — Helper de fetch con impersonacion de navegador real.
 *
 * Envuelve `curl_cffi` (Python), el binding del motor curl-impersonate
 * (https://github.com/lwthiker/curl-impersonate) compatible con Windows vía
 * wheels. Curl-impersonate modifica el handshake TLS + HTTP/2 de curl para que
 * sea indistinguible del de Chrome/Firefox/Edge/Safari, lo que permite leer
 * sitios que bloquean por fingerprinting (Cloudflare challenge, rate-limit por
 * TLS, etc.) — el caso documentado de The Clinic, El Ciudadano, araucaniadiario.
 *
 * Uso (desde otros scripts o CLI):
 *   node scripts/fetch-impersonate.mjs -- https://sitio.cl/articulo
 *   node scripts/fetch-impersonate.mjs -- https://sitio.cl/doc.pdf --binary
 *
 * Flags:
 *   --binary   Devuelve el body como Buffer (para binarios: PDFs, docs)
 *   --headers  Imprime los headers de la respuesta (util para diagnosticar
 *              bloqueos: 403 + 'Just a moment' => Cloudflare)
 *
 * Requisito: Python 3 + `curl_cffi` (pip install --user curl_cffi).
 *
 * Orden de escalera recomendado al leer una URL (ver AGENTS.md):
 *   1) fetch directo de Node (ya usado en add-source/pdf-extract)
 *   2) mirrors: r.jina.ai / defuddle.md / paywallskip.com / archive.ph
 *   3) este helper (curl_cffi) para sitios con fingerprinting TLS
 */

import { execFileSync } from 'node:child_process';

const PYTHON_SNIPPET = `
import sys
from curl_cffi import requests

binary = '--binary' in sys.argv
url = sys.argv[sys.argv.index('--url') + 1] if '--url' in sys.argv else None
if not url:
    sys.stderr.write('falta --url\\n')
    sys.exit(2)

impersonate = 'chrome'
if '--impersonate' in sys.argv:
    impersonate = sys.argv[sys.argv.index('--impersonate') + 1]

r = requests.get(url, impersonate=impersonate, timeout=45, allow_redirects=True)
sys.stderr.write(f'[fetch-impersonate] status {r.status_code} | {len(r.content)} bytes\\n')
if '--headers' in sys.argv:
    for k, v in r.headers.items():
        sys.stderr.write(f'  {k}: {v}\\n')
if binary:
    sys.stdout.buffer.write(r.content)
else:
    sys.stdout.write(r.text)
`;

function pythonAvailable() {
  try {
    execFileSync('python', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Descarga una URL impersonando un navegador real (Chrome por defecto).
 * @param {string} url
 * @param {{binary?: boolean, headers?: boolean, impersonate?: string}} [opts]
 * @returns {Promise<Buffer|string>}
 */
export async function fetchImpersonate(url, opts = {}) {
  if (!pythonAvailable()) {
    throw new Error('Python no esta disponible en el PATH; curl_cffi requiere Python 3.');
  }
  const args = ['-c', PYTHON_SNIPPET, '--url', url];
  if (opts.binary) args.push('--binary');
  if (opts.headers) args.push('--headers');
  if (opts.impersonate) args.push('--impersonate', opts.impersonate);
  try {
    const stdout = execFileSync('python', args, {
      encoding: opts.binary ? 'buffer' : 'utf8',
      maxBuffer: 200 * 1024 * 1024,
      timeout: 90_000,
      windowsHide: true,
    });
    return opts.binary ? stdout : stdout.toString();
  } catch (e) {
    const msg = e.stderr?.toString?.() || e.message || '';
    if (/No module named 'curl_cffi'/.test(msg)) {
      throw new Error('curl_cffi no esta instalado. Instalalo con: python -m pip install --user curl_cffi');
    }
    throw new Error(`curl_cffi fallo (${url}): ${msg.split('\n').slice(-3).join(' | ')}`);
  }
}

const isMain = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, '/')}`).href;

if (isMain) {
  const args = process.argv.slice(2);
  const url = args.find((a) => a.startsWith('http'));
  if (!url) {
    console.error('Uso: fetch-impersonate -- <URL> [--binary] [--headers]');
    process.exit(1);
  }
  fetchImpersonate(url, {
    binary: args.includes('--binary'),
    headers: args.includes('--headers'),
  })
    .then((body) => {
      if (!args.includes('--binary')) process.stdout.write(body);
      else process.stdout.write(body);
    })
    .catch((e) => {
      console.error(`[fetch-impersonate] ${e.message}`);
      process.exit(1);
    });
}
