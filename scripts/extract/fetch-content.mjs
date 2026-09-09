#!/usr/bin/env node
/**
 * fetch-content.mjs — Fetch de contenido con cadena de fallbacks para agentes.
 *
 * Intenta múltiples métodos para obtener el contenido legible de una URL:
 *   0. pre-chequeo de origen (404/410 aborta; 403 sigue a mirrors)
 *   1. fetch directo (Node)
 *   2. r.jina.ai (Jina AI reader)
 *   3. defuddle.md (Defuddle reader)
 *   4. markdown.new (Markdown converter)
 *   5. paywallskip.com (Paywall bypass)
 *   6. archive.ph (Web archive)
 *   7. fetch-impersonate (curl_cffi con impersonación TLS)
 *   8. add-source (extracción de metadata)
 *
 * Cada resultado pasa por el clasificador soft-404 de scripts/lib/soft404.mjs:
 * un mirror con HTTP 200 puede traer la página de error/bloqueo del sitio.
 *
 * Uso:
 *   node scripts/extract/fetch-content.mjs -- https://sitio.cl/articulo
 *   node scripts/extract/fetch-content.mjs -- https://sitio.cl/articulo --verbose
 *   node scripts/extract/fetch-content.mjs -- https://sitio.cl/articulo --method r.jina.ai
 *
 * Flags:
 *   --verbose    Muestra detalles de cada intento
 *   --method X   Solo usa el método especificado (jina, defuddle, markdown, paywallskip, archive, impersonate, add-source)
 *   --min-chars N Mínimo de caracteres para considerar exitoso (default: 500)
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { isSoft404, checkOriginStatus } from '../lib/soft404.mjs';

const args = process.argv.slice(2);
const url = args.find(a => a.startsWith('http'));
const verbose = args.includes('--verbose');
const methodOnly = args.find((a, i) => args[i - 1] === '--method');
const minChars = parseInt(args.find((a, i) => args[i - 1] === '--min-chars') || '500');

if (!url) {
  console.error('Uso: node scripts/extract/fetch-content.mjs -- <URL> [--verbose] [--method X] [--min-chars N]');
  process.exit(1);
}

const log = verbose ? (msg) => console.error(`  ${msg}`) : () => {};

// Acepta un texto como contenido real: largo mínimo + sin señales de
// soft-404 (scripts/lib/soft404.mjs). Un mirror con HTTP 200 puede traer la
// página de error del sitio en vez del artículo.
function acceptResult(text, method, min = minChars, url = '') {
  if (!(text.length > min)) return { ok: false, chars: text.length };
  const verdict = isSoft404(text, { url });
  if (verdict.soft) return { ok: false, error: `soft-404 (${verdict.reason})`, chars: text.length };
  return { ok: true, content: text, chars: text.length, method };
}

// ═══════════════════════════════════════════════════════════════
// Métodos de obtención
// ═══════════════════════════════════════════════════════════════

async function tryJina(u) {
  log(`Intentando r.jina.ai...`);
  try {
    const r = await fetch(`https://r.jina.ai/${u}`, {
      headers: { 'Accept': 'text/plain' },
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const text = await r.text();
    return acceptResult(text, 'r.jina.ai', minChars, u);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function tryDefuddle(u) {
  log(`Intentando defuddle.md...`);
  try {
    const r = await fetch(`https://defuddle.md/${u}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const text = await r.text();
    return acceptResult(text, 'defuddle.md', minChars, u);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function tryMarkdownNew(u) {
  log(`Intentando markdown.new...`);
  try {
    const r = await fetch(`https://markdown.new/${u}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const text = await r.text();
    return acceptResult(text, 'markdown.new', minChars, u);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function tryPaywallskip(u) {
  log(`Intentando paywallskip.com...`);
  try {
    const r = await fetch(`https://www.paywallskip.com/article?url=${encodeURIComponent(u)}`, {
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const text = await r.text();
    return acceptResult(text, 'paywallskip.com', minChars, u);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function tryArchive(u) {
  log(`Intentando archive.ph...`);
  try {
    const r = await fetch(`https://archive.ph/${u}`, {
      signal: AbortSignal.timeout(30000),
      redirect: 'follow',
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const text = await r.text();
    // Archive.ph returns HTML, check for actual content
    if (text.includes('This URL has never been archived')) {
      return { ok: false, error: 'URL nunca archivada' };
    }
    return acceptResult(text, 'archive.ph', minChars, u);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function tryImpersonate(u) {
  log(`Intentando fetch-impersonate (curl_cffi)...`);
  try {
    const output = execFileSync('node', ['scripts/extract/fetch-impersonate.mjs', '--', u], {
      encoding: 'utf-8',
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return acceptResult(output, 'fetch-impersonate', minChars, u);
  } catch (e) {
    return { ok: false, error: e.message?.slice(0, 200) };
  }
}

async function tryHtmlRaw(u) {
  log(`Intentando descarga HTML crudo...`);
  try {
    const r = await fetch(u, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(30000),
      redirect: 'follow',
    });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status}` };
    const html = await r.text();
    // Try to extract content from common patterns
    // 1. Look for article body in common selectors
    const articleMatch = html.match(/<article[\s\S]*?>([\s\S]*?)<\/article>/i)
      || html.match(/<div[^>]*class="[^"]*(?:article|post|entry|content|body)[^"]*"[\s\S]*?>([\s\S]*?)<\/div>/i);
    if (articleMatch) {
      // Strip HTML tags but keep text
      const text = articleMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length > minChars) {
        return acceptResult(text, 'html-raw', minChars, u);
      }
    }
    // 2. Try to find JSON-LD structured data
    const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
    if (jsonLdMatch) {
      try {
        const data = JSON.parse(jsonLdMatch[1]);
        const text = data.articleBody || data.description || '';
        if (text.length > minChars) {
          return acceptResult(text, 'html-jsonld', minChars, u);
        }
      } catch {}
    }
    // 3. Fallback: strip all tags from full HTML
    const fullText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Check if it's just navigation/layout
    if (fullText.includes('Selecciona tu región') && fullText.length < 5000) {
      return { ok: false, error: 'HTML es solo navigation/layout', chars: fullText.length };
    }
    return acceptResult(fullText, 'html-full', minChars * 2, u);
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function tryAddSource(u) {
  log(`Intentando add-source (metadata)...`);
  try {
    const output = execFileSync('node', ['scripts/extract/add-source.mjs', '--', u], {
      encoding: 'utf-8',
      timeout: 30000,
    });
    // Extract the generated block
    const match = output.match(/BLOQUE GENERADO[\s\S]*?={3,}\n([\s\S]*?)={3,}/);
    if (match) {
      return { ok: true, content: match[1].trim(), chars: match[1].length, method: 'add-source', metadata: true };
    }
    return { ok: false, error: 'No se pudo extraer bloque YAML' };
  } catch (e) {
    return { ok: false, error: e.message?.slice(0, 200) };
  }
}

// ═══════════════════════════════════════════════════════════════
// Cadena de fallback
// ═══════════════════════════════════════════════════════════════

const FALLBACK_CHAIN = [
  { name: 'r.jina.ai', fn: tryJina },
  { name: 'defuddle.md', fn: tryDefuddle },
  { name: 'markdown.new', fn: tryMarkdownNew },
  { name: 'paywallskip.com', fn: tryPaywallskip },
  { name: 'archive.ph', fn: tryArchive },
  { name: 'fetch-impersonate', fn: tryImpersonate },
  { name: 'html-raw', fn: tryHtmlRaw },
  { name: 'add-source', fn: tryAddSource },
];

async function main() {
  console.error(`\n═══ Fetching: ${url} ═══\n`);

  // Pre-chequeo de origen (scripts/lib/soft404.mjs): un 404/410 es decisivo
  // —la URL no existe— y se omite la cadena para evitar falsos éxitos de los
  // mirrors (un 200 del mirror con la página de error del sitio). Un 403 es
  // WAF/bot-block, no veredicto: se sigue con mirrors.
  const origin = await checkOriginStatus(url);
  if (origin.status === 404 || origin.status === 410) {
    console.error(`✖ El origen responde HTTP ${origin.status}: la URL no existe. Cadena omitida.`);
    process.exit(1);
  }
  if (origin.status === 403) log('Origen 403 (WAF/bot-block): se intenta vía mirrors.');
  else if (origin.status) log(`Origen HTTP ${origin.status}.`);
  else log(`Origen sin respuesta directa (${origin.error}): se intenta vía mirrors.`);

  const results = [];

  if (methodOnly) {
    // Single method mode
    const method = FALLBACK_CHAIN.find(m => m.name === methodOnly);
    if (!method) {
      console.error(`Método desconocido: ${methodOnly}. Disponibles: ${FALLBACK_CHAIN.map(m => m.name).join(', ')}`);
      process.exit(1);
    }
    const result = await method.fn(url);
    results.push({ ...result, name: method.name });
    if (result.ok) {
      console.error(`\n✅ Éxito con ${method.name} (${result.chars} caracteres)\n`);
      console.log(result.content);
      return;
    }
  } else {
    // Full chain
    for (const method of FALLBACK_CHAIN) {
      const result = await method.fn(url);
      results.push({ ...result, name: method.name });
      log(`${method.name}: ${result.ok ? `✅ ${result.chars} chars` : `❌ ${result.error}`}`);

      if (result.ok) {
        console.error(`\n✅ Éxito con ${method.name} (${result.chars} caracteres)\n`);
        console.log(result.content);
        return;
      }
    }
  }

  // All methods failed
  console.error('\n═══ TODOS LOS MÉTODOS FALLARON ═══\n');
  console.error('Resumen de intentos:');
  for (const r of results) {
    console.error(`  ${r.name}: ❌ ${r.error || 'contenido insuficiente'}${r.chars ? ` (${r.chars} chars)` : ''}`);
  }
  console.error('\nPosibles causas:');
  console.error('  - Sitio requiere JavaScript pesado (no resuelve ningún mirror)');
  console.error('  - Sitio bloquea por geolocación o rate-limit');
  console.error('  - Paywall requiere suscripción');
  console.error('  - URL es un video/embebido sin contenido textual');
  console.error('\nAcción sugerida: pedir al usuario que copie y pegue el contenido del artículo.');
  process.exit(1);
}

main().catch(e => {
  console.error(`Error inesperado: ${e.message}`);
  process.exit(1);
});
