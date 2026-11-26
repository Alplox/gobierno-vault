// Verificación en navegador del contraste AAA (≥7:1) de los enlaces del sitio
// con el tema cupcake, el peor caso de los temas claros.
//
//   pnpm run build
//   node .agents/skills/frontend/scripts/serve-dist.mjs   # background, puerto 4319
//   node .agents/skills/frontend/scripts/check-text-contrast.mjs
import puppeteer from 'puppeteer';

function resolve(s) {
  if (!s) return null;
  let m = s.match(/oklch\(([\d.]+)(%)?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
  if (m) {
    const L = parseFloat(m[1]) / (m[2] ? 100 : 1);
    const C = parseFloat(m[3]);
    const H = parseFloat(m[4]) * Math.PI / 180;
    const a = C * Math.cos(H), b = C * Math.sin(H);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const mm_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const ss_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, mm = mm_ ** 3, ss = ss_ ** 3;
    const lin = [4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
      -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
      -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss];
    return { lin, alpha: m[5] ? parseFloat(m[5]) : 1 };
  }
  m = s.match(/oklab\(([\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
  if (m) {
    const L = parseFloat(m[1]), a = parseFloat(m[2]), b = parseFloat(m[3]);
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const mm_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const ss_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, mm = mm_ ** 3, ss = ss_ ** 3;
    return {
      lin: [4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * ss,
        -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * ss,
        -0.0041960863 * l - 0.7034186147 * mm + 1.707614701 * ss],
      alpha: m[4] ? parseFloat(m[4]) : 1,
    };
  }
  m = s.match(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/);
  if (!m) m = s.match(/rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\)/);
  if (m) {
    const v = [m[1], m[2], m[3]].map((x) => parseFloat(x) / 255);
    return {
      lin: v.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)),
      alpha: m[4] ? parseFloat(m[4]) : 1,
    };
  }
  return null;
}
const gamma = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
const composite = (fg, bg) => fg.lin.map((v, i) => {
  const a = fg.alpha;
  const fgG = gamma(v), bgG = gamma(bg.lin[i]);
  const out = a * fgG + (1 - a) * bgG;
  return out <= 0.04045 ? out / 12.92 : ((out + 0.055) / 1.055) ** 2.4;
});
const lum = (l) => 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
const ratio = (fg, bg) => {
  const [x, y] = [lum(composite(fg, bg)), lum(bg.lin)].sort((a, b) => b - a);
  return (x + 0.05) / (y + 0.05);
};

const browser = await puppeteer.launch({ channel: 'chrome', headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1000 });
await page.goto('http://localhost:4319/', { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.setItem('gv-theme', 'cupcake'));
await page.goto('http://localhost:4319/events/2026/20261112-4/', { waitUntil: 'networkidle2' });

const data = await page.evaluate(() => {
  const pick = (sel, label) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    let bgEl = el;
    let bg = cs.backgroundColor;
    while (bg === 'rgba(0, 0, 0, 0)' && bgEl.parentElement) {
      bgEl = bgEl.parentElement;
      bg = getComputedStyle(bgEl).backgroundColor;
    }
    return {
      label,
      color: cs.color,
      bg,
      fontSize: cs.fontSize,
      weight: cs.fontWeight,
      decoration: cs.textDecorationLine,
    };
  };
  return {
    theme: document.documentElement.dataset.theme,
    pageBg: getComputedStyle(document.body).backgroundColor,
    htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    items: [
      pick('.event-ref', 'event-ref'),
      pick('.gv-event-toc-list a.is-active', 'TOC activo'),
      pick('.gv-event-toc-list a:not(.is-active)', 'TOC link'),
      pick('.gv-event-toc-label', 'TOC etiqueta'),
      pick('.cifra-badge', 'cifra-badge'),
      pick('.source-ref-num', 'source-ref-num'),
    ].filter(Boolean),
  };
});

const pageBg = composite(resolve(data.pageBg), resolve(data.htmlBg));
const asColor = { lin: pageBg, alpha: 1 };
let fail = 0;
console.log('tema:', data.theme, '| fondo body:', data.pageBg, '| fondo html:', data.htmlBg);
for (const it of data.items) {
  const fg = resolve(it.color);
  const rawBg = resolve(it.bg) ?? asColor;
  const bg = { lin: composite(rawBg, asColor), alpha: 1 };
  const r = ratio(fg, bg);
  const ok = r >= 7;
  if (!ok) fail++;
  console.log(`  ${ok ? 'OK ' : 'FAIL'} ${it.label.padEnd(16)} ${r.toFixed(2).padStart(6)}:1  ${it.fontSize}/${it.weight}  fg=${it.color} bg=${it.bg} deco=${it.decoration}`);
}
await browser.close();
if (fail) process.exit(1);
console.log('TODO OK (AAA ≥7:1)');
