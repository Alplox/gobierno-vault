/**
 * soft404.mjs — clasificador de falsos éxitos ("poison pills") para fetch-content.
 *
 * Un mirror puede responder HTTP 200 y devolver la página de bloqueo/error del
 * sitio en vez del artículo (caso 20260902-7, sep-2026: r.jina.ai devolvió
 * 12603 chars del home de ADN Radio para una URL que en origen es 404).
 * Este módulo centraliza la detección para que todos los métodos de
 * scripts/extract/fetch-content.mjs la apliquen igual.
 */

// Patrones de página de error/bloqueo (case-insensitive). Incluye la tabla de
// poison pills de .agents/skills/tools/SKILL.md + señales de 404 blando.
export const SOFT404_PATTERNS = [
  // 404 / no encontrado
  'page not found',
  'página no encontrada',
  'pagina no encontrada',
  'error 404',
  'no se encontró la página',
  'contenido no disponible',
  'this page could not be found',
  // Paywall (mantener: el mirror no trae el artículo)
  'subscribe to continue',
  'subscription required',
  "you've reached your limit",
  'create an account to continue reading',
  // Captcha / bot
  'verify you are human',
  "prove you're not a robot",
  "confirm you're not a bot",
  // Cloudflare / WAF challenge
  'checking your browser',
  'just a moment',
  'ddos protection',
  // Login
  'sign in to continue',
  'log in required',
  // Navegación/layout sin artículo (casos documentados en fetch-content)
  'selecciona tu región',
  'ingresa a comunidad bío bío',
];

// Marcadores de chrome/boilerplate (reproductor, compartir, píxeles de ads).
// Un cuerpo real no debería estar dominado por ellos.
const BOILERPLATE_MARKERS = [
  'compartir en',
  'copiar enlace',
  'pixel.gif',
  'getuid?',
  'bidswitch.net',
  'cookie sync',
  'cambiar emisora',
  'selecciona tu emisora',
];

const BOILERPLATE_THRESHOLD = 5; // coincidencias distintas para sospechar
const MIN_BODY_PARAGRAPH = 400; // párrafo más largo bajo el cual no hay cuerpo

function longestParagraph(text) {
  return text
    .split(/\n+/)
    .reduce((max, p) => Math.max(max, p.trim().length), 0);
}

// El slug de un artículo real deriva de su titular. Si el `Title:` del mirror
// no comparte vocabulario con el slug de la URL, el mirror trajo otra página
// (home, sección, 404 blanda). Caso ADN sep-2026: slug
// "oficialismo-bancada-...-milei" vs título "ADN Radio | Actualidad...".
function slugTitleOverlap(text, url) {
  const titleMatch = text.match(/^title:\s*(.+)$/im);
  if (!titleMatch) return null;
  const seg = url.split('?')[0].replace(/\/$/, '').split('/').pop() || '';
  const norm = (s) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3);
  const slugWords = norm(seg).filter((w) => !['html', 'shtml', 'php', 'aspx'].includes(w));
  if (slugWords.length < 4) return null;
  const titleWords = new Set(norm(titleMatch[1]));
  const hit = slugWords.filter((w) => titleWords.has(w)).length;
  return hit / slugWords.length;
}

/**
 * isSoft404(text, { url }) → { soft: boolean, reason?: string }
 * `text` es el markdown devuelto por un mirror (incluye línea "Title: ...").
 */
export function isSoft404(text, { url = '' } = {}) {
  if (!text || !text.trim()) return { soft: true, reason: 'contenido vacío' };
  const lower = text.toLowerCase();

  for (const p of SOFT404_PATTERNS) {
    if (lower.includes(p)) return { soft: true, reason: `patrón "${p}"` };
  }

  const markers = BOILERPLATE_MARKERS.filter((m) => lower.includes(m));
  if (markers.length >= BOILERPLATE_THRESHOLD && longestParagraph(text) < MIN_BODY_PARAGRAPH) {
    return { soft: true, reason: `boilerplate sin cuerpo (${markers.length} marcadores)` };
  }

  // Título genérico del home del sitio en vez de titular del artículo:
  // jina antepone "Title: ...". Un titular real rara vez tiene < 4 palabras.
  const titleMatch = text.match(/^title:\s*(.+)$/im);
  if (titleMatch && titleMatch[1].trim().split(/\s+/).length < 4) {
    return { soft: true, reason: `título genérico "${titleMatch[1].trim()}"` };
  }

  // El slug no comparte vocabulario con el titular: el mirror trajo otra página.
  const overlap = slugTitleOverlap(text, url);
  if (overlap !== null && overlap < 0.3) {
    return { soft: true, reason: `titular no corresponde al slug (overlap ${overlap.toFixed(2)})` };
  }

  return { soft: false };
}

const ORIGIN_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (GobiernoVault/1.0)';

/**
 * checkOriginStatus(url) → { status: number|null, error?: string }
 * HEAD/GET al origen con redirect manual: un 404/410 es decisivo (la URL no
 * existe) aunque un mirror devuelva texto. Un 403 es WAF/bot-block, NO
 * veredicto (caso Ex-Ante 2026-08-28: 403 en directo, artículo real vía
 * mirror) — el llamador decide.
 */
export async function checkOriginStatus(url, timeoutMs = 12000) {
  try {
    const r = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': ORIGIN_UA },
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    // Evita descargar el body: solo importa el status.
    try { await r.arrayBuffer(); } catch {}
    return { status: r.status };
  } catch (e) {
    return { status: null, error: e.name === 'AbortError' ? 'timeout' : e.message };
  }
}
