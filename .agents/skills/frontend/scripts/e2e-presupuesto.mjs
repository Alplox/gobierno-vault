// Revision de la pagina /presupuesto en un navegador real: es la unica forma de
// comprobar lo que el verificador de HTML no alcanza (que la cinta abra el panel
// del ano correcto, que el tooltip aparezca, que los saltos funcionen).
import puppeteer from 'puppeteer';

const fallos = [];
const ok = [];
const chk = (cond, msg, extra = '') => (cond ? ok.push(msg) : fallos.push(`${msg} ${extra}`));

const browser = await puppeteer.launch({
  channel: 'chrome',
  headless: true,
  args: ['--no-sandbox', '--window-size=1400,1000'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });

const errores = [];
page.on('pageerror', (e) => errores.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errores.push(`console: ${m.text()}`);
});

await page.goto('http://localhost:4319/presupuesto/', { waitUntil: 'networkidle2' });
chk(errores.length === 0, 'sin errores de JS al cargar', errores.join(' | '));

// --- Estado inicial ---
const inicial = await page.evaluate(() => {
  const paneles = [...document.querySelectorAll('[data-pres-panel]')];
  const activos = paneles.filter((p) => !p.classList.contains('hidden'));
  // Los paneles de año inactivos siguen en el DOM (display:none): se cuentan
  // solo los Sankey realmente visibles.
  const svgs = [...document.querySelectorAll('svg[role="img"]')].filter(
    (s) => s.querySelector('.gv-sk-ribbon') && s.getClientRects().length > 0,
  );
  return {
    paneles: paneles.map((p) => p.getAttribute('data-pres-panel')),
    activos: activos.map((p) => p.getAttribute('data-pres-panel')),
    sankeys: svgs.length,
    anchoSvg: svgs[0]?.getBoundingClientRect().width ?? 0,
    altoSvg: svgs[0]?.getBoundingClientRect().height ?? 0,
    cintas: svgs.reduce((n, s) => n + s.querySelectorAll('.gv-sk-ribbon').length, 0),
    tarjetas: document.querySelectorAll('article[id^="mov-"]').length,
    totales: [...document.querySelectorAll('p.tabular-nums')].slice(0, 2).map((p) => p.textContent.trim()),
  };
});
chk(inicial.paneles.join(',') === '2027,2026,2025', `paneles por ejercicio: ${inicial.paneles.join(',')}`);
chk(inicial.activos.join(',') === '2027', `abre el ejercicio mas reciente: ${inicial.activos.join(',')}`);
chk(inicial.sankeys === 2, `Sankey visibles: ${inicial.sankeys} (global + 2027)`);
chk(inicial.anchoSvg > 600 && inicial.altoSvg > 100, `el Sankey se dibuja con tamano real (${Math.round(inicial.anchoSvg)}x${Math.round(inicial.altoSvg)})`);
chk(inicial.cintas === 39, `cintas visibles (20 global + 19 de 2027): ${inicial.cintas}`);
chk(inicial.tarjetas === 30, `tarjetas de movimiento en el DOM: ${inicial.tarjetas}`);
chk(inicial.totales.length === 2, `titulares de totales: ${inicial.totales.join(' / ')}`);

// --- Tooltip por CSS al pasar por una cinta ---
const sinObjetivo = await page.evaluateHandle(() =>
  document.querySelector('svg[viewBox="0 0 840 705.96054551826"] .gv-sk-band .gv-sk-tip text:nth-of-type(2)')?.parentElement?.parentElement ??
  [...document.querySelectorAll('.gv-sk-band')].find((g) => g.querySelector('.gv-sk-tip text:nth-of-type(2)')?.textContent.includes('Sin objetivo')) ?? null,
);
const target = await page.evaluate(() => {
  const bandas = [...document.querySelectorAll('.gv-sk-band')];
  const i = bandas.findIndex((g) =>
    [...g.querySelectorAll('.gv-sk-tip text')].some((t) => t.textContent.trim() === 'Sin objetivo declarado publicado'),
  );
  return i;
});
chk(target >= 0, `hay cintas sin objetivo para probar el tooltip (indice ${target})`);
if (target >= 0) {
  const bandas = await page.$$('.gv-sk-band');
  await bandas[target].hover();
  await new Promise((r) => setTimeout(r, 260));
  const tras = await page.evaluate(() => {
    const g = [...document.querySelectorAll('.gv-sk-band')].find((x) =>
      [...x.querySelectorAll('.gv-sk-tip text')].some((t) => t.textContent.trim() === 'Sin objetivo declarado publicado'),
    );
    const tip = g.querySelector('.gv-sk-tip');
    return { opacidad: getComputedStyle(tip).opacity, titulo: tip.querySelector('text')?.textContent.trim() };
  });
  chk(Number(tras.opacidad) > 0.9, `el tooltip aparece al pasar el cursor (opacidad ${tras.opacidad})`);
  chk(/Retiro|Inyección/.test(tras.titulo ?? ''), `el tooltip rotula el sentido y el monto: "${tras.titulo}"`);
}

// --- Una cinta del Sankey global abre el panel de SU ejercicio ---
const cinta2026 = await page.$('svg[role="img"] a[href^="#mov-2026-"]');
chk(Boolean(cinta2026), 'el Sankey global incluye la cinta de 2026');
if (cinta2026) {
  await cinta2026.click();
  await new Promise((r) => setTimeout(r, 500));
  const tras = await page.evaluate(() => {
    const paneles = [...document.querySelectorAll('[data-pres-panel]')];
    const activos = paneles.filter((p) => !p.classList.contains('hidden')).map((p) => p.getAttribute('data-pres-panel'));
    const dest = document.getElementById(location.hash.slice(1));
    const r = dest?.getBoundingClientRect();
    return {
      activos,
      hash: location.hash,
      visible: Boolean(r && r.width > 0) && dest.offsetParent !== null || dest.getClientRects().length > 0,
      enPantalla: Boolean(r && r.top > -50 && r.top < window.innerHeight + 50),
      boton: document.querySelector('[data-pres-ano="2026"]')?.getAttribute('aria-pressed'),
    };
  });
  chk(tras.activos.join(',') === '2026', `la cinta del global abre el panel 2026: ${tras.activos.join(',')}`);
  chk(/^#mov-2026-\d+$/.test(tras.hash), `el hash apunta a la tarjeta: ${tras.hash}`);
  chk(tras.visible, 'la tarjeta destino queda visible (no en un panel oculto)');
  chk(tras.enPantalla, 'la tarjeta destino queda dentro de la pantalla');
  chk(tras.boton === 'true', 'el boton del año queda marcado como activo');
}

// --- El selector de años sigue funcionando ---
await page.click('[data-pres-ano="2025"]');
await new Promise((r) => setTimeout(r, 200));
const tras2025 = await page.evaluate(() => {
  const paneles = [...document.querySelectorAll('[data-pres-panel]')];
  return {
    activos: paneles.filter((p) => !p.classList.contains('hidden')).map((p) => p.getAttribute('data-pres-panel')),
    nota: document.querySelector('[data-pres-panel="2025"]')?.textContent.includes('Sin movimientos de dinero con monto publicado'),
  };
});
chk(tras2025.activos.join(',') === '2025', `el selector abre 2025: ${tras2025.activos.join(',')}`);
chk(tras2025.nota, '2025 explica que no hay movimientos con monto');

// --- Sin desbordes horizontales de la pagina ---
const desborde = await page.evaluate(() => ({
  doc: document.documentElement.scrollWidth,
  win: window.innerWidth,
  svgScroll: [...document.querySelectorAll('.overflow-x-auto')].filter((d) => d.scrollWidth > d.clientWidth + 1).length,
}));
chk(desborde.doc <= desborde.win + 1, `la pagina no desborda a lo ancho (${desborde.doc} <= ${desborde.win})`);

// --- Movil: el Sankey scrollea en su caja, no rompe la pagina ---
await page.setViewport({ width: 390, height: 844 });
await new Promise((r) => setTimeout(r, 300));
const movil = await page.evaluate(() => {
  const caja = document.querySelector('.overflow-x-auto');
  return { doc: document.documentElement.scrollWidth, win: window.innerWidth, cajaScrollable: caja.scrollWidth > caja.clientWidth };
});
chk(movil.doc <= movil.win + 1, `sin desborde en movil (${movil.doc} <= ${movil.win})`);
chk(movil.cajaScrollable, 'en movil el Sankey se desplaza dentro de su caja');

chk(errores.length === 0, 'sin errores de JS durante toda la navegacion', errores.join(' | '));

await browser.close();

console.log(ok.map((m) => `  ok  ${m}`).join('\n'));
if (fallos.length) {
  console.log('\nFALLOS:');
  console.log(fallos.map((m) => `  !!  ${m}`).join('\n'));
  process.exit(1);
}
console.log(`\n${ok.length} comprobaciones ok`);
