// Revisión del ego-grafo del detalle de evento en navegador real: comprueba que
// el SVG interactivo reemplaza al fallback, que «cargar más» revela el segundo
// salto en tandas sin reconstruir el grafo, y que el tooltip indica «vía».
//
//   pnpm run build
//   node .agents/skills/frontend/scripts/serve-dist.mjs   # background, puerto 4319
//   node .agents/skills/frontend/scripts/e2e-ego-graph.mjs
import puppeteer from 'puppeteer';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

function countIndirect(html) {
  const m = html.match(/<script type="application\/json" data-gv-ego-data>([\s\S]*?)<\/script>/);
  if (!m) return 0;
  try { return JSON.parse(m[1]).indirect?.length ?? 0; } catch { return 0; }
}

function findEvents(dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) findEvents(p, found);
    else if (entry.name === 'index.html') {
      const html = readFileSync(p, 'utf8');
      if (html.includes('data-gv-ego-more')) found.push({ p, n: countIndirect(html) });
    }
  }
  return found;
}

const all = findEvents(join(process.cwd(), 'dist', 'events'));
if (!all.length) {
  console.error('No hay evento con nodos indirectos en dist/');
  process.exit(1);
}
// Preferir uno con más de un lote (12) para probar la carga incremental.
all.sort((a, b) => b.n - a.n);
const chosen = all.find((x) => x.n > 12) ?? all[0];
const rel = chosen.p.split(join(process.cwd(), 'dist'))[1]
  .replace(/index\.html$/, '').replace(/\\/g, '/');
const URL = `http://localhost:4319${rel}`;

const fallos = [];
const chk = (cond, msg, extra = '') => {
  if (cond) console.log(`OK  ${msg}`);
  else { fallos.push(msg); console.error(`FAIL ${msg} ${extra}`); }
};

const browser = await puppeteer.launch({
  channel: 'chrome',
  headless: true,
  args: ['--no-sandbox', '--window-size=1400,1000'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });
const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errores.push(`console: ${m.text()}`); });

await page.goto(URL, { waitUntil: 'networkidle2' });
chk(errores.length === 0, 'sin errores de JS al cargar', errores.join(' | '));

const estado = () => page.evaluate(() => {
  const root = document.querySelector('[data-gv-ego-widget]');
  const btn = root?.querySelector('[data-gv-ego-more]');
  const svg = root?.querySelector('[data-gv-ego-stage] svg');
  const payload = JSON.parse(root?.querySelector('[data-gv-ego-data]')?.textContent ?? '{}');
  return {
    fallback: !!root?.querySelector('[data-gv-ego-fallback]'),
    nodos: svg?.querySelectorAll('a[data-node-id]').length ?? 0,
    aristas: svg?.querySelectorAll('line').length ?? 0,
    indirectos: svg?.querySelectorAll('a.is-extra').length ?? 0,
    btnVisible: btn ? !btn.classList.contains('hidden') : false,
    btnTexto: btn?.textContent?.trim() ?? '',
    totalPayload: payload.indirect?.length ?? 0,
  };
});

await page.waitForSelector('[data-gv-ego-stage] svg a[data-node-id]', { timeout: 15000 });
const ini = await estado();
console.log('URL:', URL, JSON.stringify(ini));
chk(!ini.fallback, 'fallback SVG eliminado al iniciar');
chk(ini.nodos >= 2, `nodos iniciales: ${ini.nodos}`);
chk(ini.indirectos === 0, `sin indirectos antes de cargar: ${ini.indirectos}`);
chk(ini.btnVisible, 'botón «cargar más» visible');
chk(ini.btnTexto.includes(String(ini.totalPayload)), `texto del botón: ${ini.btnTexto}`);

// Caso reportado: los inferidos antes mostraban «Mismo contexto · Mismo contexto».
const inferred = await page.evaluate(() => {
  const root = document.querySelector('[data-gv-ego-widget]');
  const data = JSON.parse(root?.querySelector('[data-gv-ego-data]')?.textContent ?? '{}');
  return (data.nodes ?? []).find((n) => n.kind === 'inferred') ?? null;
});
if (inferred) {
  // El nodo puede quedar fuera del viewport del stage; disparar el evento
  // directamente prueba el mismo handler sin depender de la posición del layout.
  await page.evaluate((id) => {
    const a = document.querySelector(`[data-gv-ego-stage] svg a[data-node-id="${id}"]`);
    a?.dispatchEvent(new PointerEvent('pointerenter', { clientX: 400, clientY: 300, bubbles: true }));
  }, inferred.id);
  await new Promise((r) => setTimeout(r, 200));
  const t = await page.evaluate(() => document.querySelector('[data-gv-ego-tip]')?.textContent ?? '');
  chk(t.includes('Mismo contexto') && !t.includes('Mismo contexto · Mismo contexto'),
    `tooltip inferido sin repetir la relación: ${t}`);
}

if (ini.totalPayload > 12) {
  await page.click('[data-gv-ego-more]');
  await new Promise((r) => setTimeout(r, 400));
  const dos = await estado();
  chk(dos.nodos > ini.nodos, `nodos tras 1 click: ${ini.nodos} → ${dos.nodos}`);
  chk(dos.indirectos === 12, `indirectos visibles tras 1 click: ${dos.indirectos}`);
  chk(dos.btnTexto.includes(String(ini.totalPayload - 12)), `botón tras 1 click: ${dos.btnTexto}`);
  chk(dos.aristas > ini.aristas, `aristas tras 1 click: ${ini.aristas} → ${dos.aristas}`);

  await page.hover('[data-gv-ego-stage] svg a.is-extra');
  await new Promise((r) => setTimeout(r, 200));
  const tipInfo = await page.evaluate(() => {
    const root = document.querySelector('[data-gv-ego-widget]');
    const id = root?.querySelector('[data-gv-ego-stage] svg a.is-extra')?.dataset.nodeId;
    const data = JSON.parse(root?.querySelector('[data-gv-ego-data]')?.textContent ?? '{}');
    const n = [...(data.nodes ?? []), ...(data.indirect ?? [])].find((x) => x.id === id);
    return {
      tip: document.querySelector('[data-gv-ego-tip]')?.textContent ?? '',
      relation: n?.relation ?? '',
    };
  });
  const { tip, relation } = tipInfo;
  chk(tip.includes('vía'), `tooltip indirecto con «vía»: ${tip}`);
  chk(!/[a-z]+_[a-z]+/.test(tip), `sin claves internas en el tooltip: ${tip}`);
  if (relation) {
    const veces = (tip.match(new RegExp(relation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []).length;
    chk(veces === 1, `relación no repetida en el tooltip (${veces}×): ${tip}`);
  }
  chk(errores.length === 0, 'sin errores de JS tras cargar más', errores.join(' | '));
}

await browser.close();
if (fallos.length) process.exit(1);
console.log('TODO OK');
