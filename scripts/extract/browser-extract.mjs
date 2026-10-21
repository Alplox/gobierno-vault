#!/usr/bin/env node
/**
 * browser-extract.mjs — Extracción con Chrome real vía puppeteer-core.
 *
 * Es el penúltimo recurso de fetch-content: se usa cuando los mirrors y
 * fetch-impersonate no alcanzan porque el sitio exige JavaScript, un challenge
 * de Cloudflare o un renderizado que solo ocurre en navegador.
 *
 * No descarga Chromium: usa el Chrome/Edge/Chromium instalado en el sistema
 * (`puppeteer-core` es devDependency; el postinstall de `puppeteer` está
 * bloqueado en pnpm-workspace.yaml). Perfil temporal, parche de
 * navigator.webdriver y cierre con limpieza del árbol de procesos.
 *
 * Uso:
 *   node scripts/extract/browser-extract.mjs -- <URL>
 *   node scripts/extract/browser-extract.mjs -- <URL> --json
 *   node scripts/extract/browser-extract.mjs -- <URL> --wait-for "article" --timeout 45
 *   node scripts/extract/browser-extract.mjs --check
 *
 * Flags:
 *   --url URL        Alternativa al argumento posicional.
 *   --wait-for SEL   Espera un selector CSS antes de extraer.
 *   --selector SEL   Extrae solo ese elemento (por defecto: heurística article/main).
 *   --timeout N      Segundos máximos de espera/render (default: 40).
 *   --wait-ms N      Milisegundos extra tras la carga (default: 1500).
 *   --min-chars N    Mínimo de texto para considerar que salió del challenge (default: 300).
 *   --html           Devuelve HTML del contenedor en vez de texto.
 *   --json           Devuelve JSON con metadatos + contenido.
 *   --headed         Chrome visible (debug).
 *   --check          Solo detecta el navegador y sale.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHALLENGE_MARKERS = [
  'just a moment',
  'checking your browser',
  'verificación de seguridad en curso',
  'verificacion de seguridad en curso',
  'verify you are human',
  'un momento…',
  'attention required',
  'sorry, you have been blocked',
  'you are unable to access',
];

// Selectores de contenedor de artículo, en orden de preferencia. La heurística
// elige el de mayor texto que tenga párrafos suficientes, para no devolver el
// header/nav del medio (que soft404 confundiría con una página de layout).
const ARTICLE_SELECTORS = [
  'article',
  '[role="main"] article',
  'main article',
  'main',
  '[role="main"]',
  '.article-body',
  '.article-content',
  '.article__body',
  '.article__content',
  '.entry-content',
  '.post-content',
  '.post-body',
  '.content-body',
  '.nota-content',
  '.nota__cuerpo',
  '.contenido',
  '.story-body',
  '.cuerpo-nota',
];

function parseArgs(argv) {
  const opts = {
    url: null,
    selector: null,
    waitFor: null,
    timeout: 40,
    waitMs: 1500,
    minChars: 300,
    html: false,
    json: false,
    headed: false,
    check: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') continue;
    if (a === '--url') opts.url = argv[++i];
    else if (a === '--selector') opts.selector = argv[++i];
    else if (a === '--wait-for') opts.waitFor = argv[++i];
    else if (a === '--timeout') opts.timeout = Number(argv[++i]) || opts.timeout;
    else if (a === '--wait-ms') opts.waitMs = Number(argv[++i]) || 0;
    else if (a === '--min-chars') opts.minChars = Number(argv[++i]) || opts.minChars;
    else if (a === '--html') opts.html = true;
    else if (a === '--json') opts.json = true;
    else if (a === '--headed') opts.headed = true;
    else if (a === '--check') opts.check = true;
    else if (a.startsWith('http')) opts.url = a;
  }
  return opts;
}

function envBrowser() {
  return (
    process.env.GV_BROWSER_EXECUTABLE ||
    process.env.BROWSER_EXECUTABLE ||
    process.env.STEALTH_BROWSER_EXECUTABLE ||
    null
  );
}

function which(cmd) {
  try {
    const finder = process.platform === 'win32' ? 'where.exe' : 'which';
    return execFileSync(finder, [cmd], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
      windowsHide: true,
    })
      .split(/\r?\n/)
      .map((s) => s.trim())
      .find(Boolean) || null;
  } catch {
    return null;
  }
}

function findBrowser() {
  const explicit = envBrowser();
  if (explicit && existsSync(explicit)) return explicit;

  const localAppData = process.env.LOCALAPPDATA || '';
  const candidates = {
    win32: [
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
      'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
      'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
      'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
      join(localAppData, 'Google/Chrome/Application/chrome.exe'),
      join(localAppData, 'Microsoft/Edge/Application/msedge.exe'),
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ],
    linux: [
      '/usr/bin/google-chrome',
      '/usr/bin/google-chrome-stable',
      '/usr/bin/chromium',
      '/usr/bin/chromium-browser',
      '/usr/bin/microsoft-edge',
      '/snap/bin/chromium',
    ],
  };

  for (const c of candidates[process.platform] || []) {
    if (c && existsSync(c)) return c;
  }
  for (const cmd of ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'chrome', 'msedge']) {
    const found = which(cmd);
    if (found) return found;
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function killTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        timeout: 10000,
        windowsHide: true,
      });
    } else {
      try {
        process.kill(-pid, 'SIGKILL');
      } catch {
        process.kill(pid, 'SIGKILL');
      }
    }
  } catch {}
}

function isAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function closeBrowser(browser) {
  const proc = browser.process();
  const pid = proc?.pid;
  try {
    await Promise.race([browser.close(), sleep(5000)]);
  } catch {}
  if (pid && isAlive(pid)) killTree(pid);
}

// Heurística de contenido: se ejecuta dentro de la página. Mantener en sync con
// scripts/extract/browser-stealth.py (misma lista de selectores y umbrales).
//
// No basta con elegir el elemento de más texto: el <body> siempre gana y arrastra
// header/nav (que soft404 confunde con página de layout). Se puntúa por texto en
// <p> (los enlaces de navegación no son párrafos) entre contenedores NO-body, y
// solo si ninguno califica se cae a body.
const PICK_CONTENT_JS = `(() => {
  const selectors = ${JSON.stringify(ARTICLE_SELECTORS)};
  const visibleText = (el) => {
    if (!el) return '';
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return '';
    return (el.innerText || '').trim();
  };
  const stats = (el) => {
    if (!el) return { text: '', count: 0, sum: 0, max: 0, ratio: 0 };
    const paragraphs = Array.from(el.querySelectorAll('p'));
    let sum = 0;
    let max = 0;
    for (const p of paragraphs) {
      const len = (p.innerText || '').trim().length;
      sum += len;
      if (len > max) max = len;
    }
    const text = visibleText(el);
    return { text, count: paragraphs.length, sum, max, ratio: sum / Math.max(1, text.length) };
  };

  let best = null;
  let bestStats = null;
  for (const selector of selectors) {
    for (const el of document.querySelectorAll(selector)) {
      const s = stats(el);
      if (s.count < 2 || s.sum < 400) continue;
      if (!bestStats || s.sum > bestStats.sum || (s.sum === bestStats.sum && s.ratio > bestStats.ratio)) {
        best = el;
        bestStats = s;
      }
    }
  }
  if (!best) {
    best = document.body;
    bestStats = stats(best);
  }
  return {
    title: document.title,
    url: location.href,
    text: visibleText(best),
    pCount: bestStats ? bestStats.count : 0,
    maxParagraph: bestStats ? bestStats.max : 0,
    pSum: bestStats ? bestStats.sum : 0,
    rootTag: best?.tagName || null,
    rootId: best?.id || null,
    rootClass: typeof best?.className === 'string' ? best.className : null,
    webdriver: navigator.webdriver,
    bodyHtml: document.documentElement ? document.documentElement.outerHTML : '',
    rootHtml: best ? best.outerHTML : ''
  };
})()`;

async function extractPage(page, opts) {
  if (opts.selector) {
    return page.evaluate((sel) => {
      const root = document.querySelector(sel);
      const text = root ? (root.innerText || '').trim() : '';
      const paragraphs = root ? Array.from(root.querySelectorAll('p')) : [];
      let pSum = 0;
      let maxParagraph = 0;
      for (const p of paragraphs) {
        const len = (p.innerText || '').trim().length;
        pSum += len;
        if (len > maxParagraph) maxParagraph = len;
      }
      return {
        title: document.title,
        url: location.href,
        text,
        pCount: paragraphs.length,
        maxParagraph,
        pSum,
        rootTag: root?.tagName || null,
        rootId: root?.id || null,
        rootClass: typeof root?.className === 'string' ? root.className : null,
        webdriver: navigator.webdriver,
        bodyHtml: document.documentElement ? document.documentElement.outerHTML : '',
        rootHtml: root ? root.outerHTML : '',
      };
    }, opts.selector);
  }
  return page.evaluate(PICK_CONTENT_JS);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.check) {
    const executablePath = findBrowser();
    process.stdout.write(
      JSON.stringify(
        {
          ok: Boolean(executablePath),
          platform: process.platform,
          executablePath,
          node: process.version,
        },
        null,
        2,
      ) + '\n',
    );
    process.exit(executablePath ? 0 : 2);
  }

  if (!opts.url) {
    process.stderr.write(
      'Uso: node scripts/extract/browser-extract.mjs -- <URL> [--json] [--timeout 40]\n',
    );
    process.exit(1);
  }

  const executablePath = findBrowser();
  if (!executablePath) {
    process.stderr.write(
      'No se encontró Chrome/Chromium/Edge. Instala uno o define GV_BROWSER_EXECUTABLE.\n',
    );
    process.exit(2);
  }

  let puppeteer;
  try {
    puppeteer = (await import('puppeteer-core')).default;
  } catch (e) {
    process.stderr.write(
      `puppeteer-core no está disponible (${e.message}). Ejecuta pnpm install.\n`,
    );
    process.exit(2);
  }

  const profile = mkdtempSync(join(tmpdir(), 'gv-browser-'));
  let browser = null;
  let code = 0;

  try {
    browser = await puppeteer.launch({
      executablePath,
      headless: !opts.headed,
      userDataDir: profile,
      ignoreDefaultArgs: ['--enable-automation'],
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--lang=es-CL',
        ...(process.platform === 'linux' ? ['--no-sandbox', '--disable-dev-shm-usage'] : []),
      ],
      defaultViewport: { width: 1366, height: 900 },
    });

    const page = await browser.newPage();
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      Object.defineProperty(navigator, 'languages', {
        get: () => ['es-CL', 'es', 'en-US', 'en'],
      });
      window.chrome = window.chrome || { runtime: {} };
    });

    let status = null;
    page.on('response', (response) => {
      if (response.request().isNavigationRequest()) status = response.status();
    });

    const started = Date.now();
    await page.goto(opts.url, { waitUntil: 'domcontentloaded', timeout: opts.timeout * 1000 });
    const elapsed = () => (Date.now() - started) / 1000;

    if (opts.waitFor) {
      try {
        await page.waitForSelector(opts.waitFor, {
          timeout: Math.max(1000, opts.timeout * 1000 - (Date.now() - started)),
        });
      } catch {}
    } else {
      // Deja que XHR/fetch y el challenge avancen sin exigir networkidle
      // (muchos medios mantienen polling/ads abiertos y nunca quedan idle).
      await page
        .waitForNetworkIdle({
          idleTime: 800,
          timeout: Math.min(12000, Math.max(1000, opts.timeout * 1000 - (Date.now() - started))),
        })
        .catch(() => {});
    }

    let last = await extractPage(page, opts);
    let previousLength = -1;
    while (elapsed() < opts.timeout) {
      const challenge = CHALLENGE_MARKERS.some((m) => last.text.toLowerCase().includes(m));
      const hasContainer = last.rootTag !== 'BODY' && last.text.length >= opts.minChars;
      const hasParagraphs =
        (Number(last.pCount) || 0) >= 2 &&
        (Number(last.maxParagraph) || 0) >= 250 &&
        (Number(last.pSum) || 0) >= 600;
      const stable = last.text.length === previousLength;
      if (!challenge && (hasContainer || hasParagraphs)) break;
      // Sin contenedor semántico: no esperar el timeout completo si la página
      // ya se estabilizó (evita 30-40 s en portadas/paywalls solo-nav).
      if (!challenge && last.rootTag === 'BODY' && ((stable && elapsed() > 8) || elapsed() > 12)) break;
      previousLength = last.text.length;
      await sleep(1000);
      last = await extractPage(page, opts);
    }

    if (opts.waitMs > 0) await sleep(opts.waitMs);
    last = await extractPage(page, opts);

    const content = opts.html ? last.rootHtml || last.bodyHtml || '' : last.text;
    const pCount = Number(last.pCount) || 0;
    const maxParagraph = Number(last.maxParagraph) || 0;
    const pSum = Number(last.pSum) || 0;
    const bodyOnlyNav =
      last.rootTag === 'BODY' &&
      (pCount < 2 || maxParagraph < 250 || pSum < 600);
    const ok = content.length >= opts.minChars && !bodyOnlyNav;

    if (opts.json) {
      process.stdout.write(
        JSON.stringify(
          {
            ok,
            status,
            ms: Date.now() - started,
            finalUrl: last.url,
            title: last.title,
            chars: content.length,
            pCount,
            maxParagraph,
            pSum,
            rootTag: last.rootTag,
            rootId: last.rootId,
            rootClass: last.rootClass,
            webdriver: last.webdriver,
            content,
          },
          null,
          2,
        ) + '\n',
      );
    } else {
      process.stdout.write(content + '\n');
    }
  } catch (e) {
    process.stderr.write(`browser-extract: ${e.message}\n`);
    code = 1;
  } finally {
    if (browser) await closeBrowser(browser);
    for (let i = 0; i < 5 && existsSync(profile); i++) {
      try {
        rmSync(profile, { recursive: true, force: true, maxRetries: 2, retryDelay: 200 });
      } catch {}
      if (existsSync(profile)) await sleep(300);
    }
  }

  process.exit(code);
}

main();
