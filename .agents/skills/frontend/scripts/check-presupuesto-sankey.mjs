// Verificador de la geometria del Sankey en el HTML construido.
// No confia en el calculo del componente: relee el SVG publicado y contrasta
// cada cinta contra el monto que la propia pagina imprime en su tabla accesible.
//
//   node tmp/check-sankey.mjs
import { readFileSync } from 'node:fs';

const html = readFileSync('dist/presupuesto/index.html', 'utf8');

const fallos = [];
const ok = [];
const chk = (cond, msg, extra = '') => (cond ? ok.push(msg) : fallos.push(`${msg} ${extra}`));

const attr = (tag, k) => tag.match(new RegExp(`${k}="([^"]*)"`))?.[1] ?? null;
const nums = (d) => [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(Number);
const clp = (s) => Number(s.replace(/[^\d]/g, ''));
// Un banda inclinada tiene el mismo grosor en sus dos extremos: se mide en el
// extremo externo (y1Bot - y1Top). El desnivel vertical NO es el grosor.
const alturaDe = (d) => {
  const n = nums(d);
  return Math.abs(n[9] - n[7]);
};

// Cada bloque del Sankey = su <svg> + la tabla accesible que lo sigue.
const bloques = [];
for (let i = html.indexOf('<svg'); i !== -1; i = html.indexOf('<svg', i + 1)) {
  const endSvg = html.indexOf('</svg>', i);
  if (endSvg === -1) break;
  const svg = html.slice(i, endSvg);
  if (!svg.includes('class="gv-sk-ribbon"')) continue;
  const endTabla = html.indexOf('</table>', endSvg);
  bloques.push({ svg, tabla: html.slice(endSvg, endTabla === -1 ? html.length : endTabla) });
}
chk(bloques.length === 3, `bloques de Sankey (global + 2027 + 2026): ${bloques.length}`);

const SIN_OBJETIVO = 'Sin objetivo ni destino publicado';

const analisis = bloques.map(({ svg, tabla }) => {
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const W = +vb[1];
  const H = +vb[2];
  const cuerpo = svg.replace(/<defs[\s\S]*?<\/defs>/g, '');

  const ribbons = [...cuerpo.matchAll(/<path\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((t) => t.includes('class="gv-sk-ribbon"'))
    .map((t) => ({ d: attr(t, 'd'), x0: nums(attr(t, 'd'))[0], h: alturaDe(attr(t, 'd')) }));

  const ejes = [...cuerpo.matchAll(/<rect([^>]*rx="2"[^>]*)>/g)].map((m) => {
    const g = (k) => +(m[1].match(new RegExp(`${k}="([\\d.-]+)"`))?.[1] ?? NaN);
    return { x: g('x'), y: g('y'), h: g('height') };
  });

  const labels = [...cuerpo.matchAll(/<text\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((t) => t.includes('class="gv-sk-label"'))
    .map((t) => ({ x: +attr(t, 'x'), y: +attr(t, 'y') }));

  // Astro agrega data-astro-cid-* a las etiquetas, asi que hay que tolerar atributos.
  const filas = [...tabla.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/g)]
    .map((m) => m[0])
    .filter((t) => /<th[^>]*scope="row"/.test(t))
    .map((t) => ({
      lado: t.match(/<th[^>]*scope="row"[^>]*>([^<]*)<\/th>/)[1],
      monto: clp(t.match(/\$([\d.]+)<\/td>/)?.[1] ?? '0'),
      sinObjetivo: t.includes(SIN_OBJETIVO),
    }));

  const hatch = (svg.match(/url\(#gv-sk-hatch/g) || []).length;
  return { W, H, ribbons, ejes, labels, filas, hatch };
});

const [global, anual2027, anual2026] = analisis;

for (const [i, a] of analisis.entries()) {
  const et = i === 0 ? 'global' : `anual#${i}`;
  chk(a.ribbons.length > 0, `${et}: cintas dibujadas (${a.ribbons.length})`);
  chk(a.ribbons.length === a.filas.length, `${et}: una fila accesible por cinta (${a.filas.length} vs ${a.ribbons.length})`);
  chk(a.ribbons.every((b) => nums(b.d).every(Number.isFinite)), `${et}: coordenadas finitas`);

  const ys = a.ribbons.flatMap((b) => nums(b.d).filter((_, j) => j % 2 === 1));
  chk(Math.min(...ys) >= 0 && Math.max(...ys) <= a.H, `${et}: cintas dentro del viewBox (0..${a.H.toFixed(0)})`);
  chk(a.H < 1500, `${et}: alto razonable (${a.H.toFixed(0)}px)`);

  chk(a.ejes.length >= 1 && a.ejes.length <= 2, `${et}: ejes dibujados (1 o 2): ${a.ejes.length}`);
  chk(a.ejes.length < 2 || a.ejes[0].x < a.ejes[1].x, `${et}: el eje de retiros queda a la izquierda`);

  chk(a.labels.length > 0 && a.labels.every((l) => l.y > 0 && l.y <= a.H), `${et}: etiquetas dentro del alto (${a.labels.length})`);
  const izq = a.labels.filter((l) => l.x < a.W / 2).map((l) => l.y).sort((p, q) => p - q);
  const der = a.labels.filter((l) => l.x > a.W / 2).map((l) => l.y).sort((p, q) => p - q);
  const minGap = (arr) => arr.slice(1).reduce((m, y, k) => Math.min(m, y - arr[k]), Infinity);
  chk(minGap(izq) >= 9.5, `${et}: etiquetas de la izquierda sin pisarse (min ${minGap(izq).toFixed(1)}px)`);
  chk(minGap(der) >= 9.5, `${et}: etiquetas de la derecha sin pisarse (min ${minGap(der).toFixed(1)}px)`);

  // El eje resume sus propias cintas.
  const izqRibbons = a.ribbons.filter((b) => b.x0 < a.W / 2);
  const derRibbons = a.ribbons.filter((b) => b.x0 > a.W / 2);
  const suma = (arr) => arr.reduce((s, b) => s + b.h, 0);
  if (a.ejes.length === 2) {
    chk(Math.abs(a.ejes[0].h - suma(izqRibbons)) < 0.51, `${et}: el eje de retiros es la suma de sus cintas (${a.ejes[0].h.toFixed(1)} vs ${suma(izqRibbons).toFixed(1)})`);
    chk(Math.abs(a.ejes[1].h - suma(derRibbons)) < 0.51, `${et}: el eje de inyecciones es la suma de sus cintas (${a.ejes[1].h.toFixed(1)} vs ${suma(derRibbons).toFixed(1)})`);
  } else {
    chk(Math.abs(a.ejes[0].h - suma(izqRibbons)) < 0.51, `${et}: el unico eje es la suma de sus cintas`);
  }

  // PROPORCIONALIDAD: alto / monto debe ser el mismo factor en todas las cintas
  // que no cayeron al minimo de espesor.
  const todos = a.ribbons.map((b, k) => ({ h: b.h, monto: a.filas[k].monto })).filter((p) => p.monto > 0);
  const sobreMinimo = todos.filter((p) => p.h > 3.01);
  const enMinimo = todos.filter((p) => p.h <= 3.01);
  const factores = sobreMinimo.map((p) => p.h / p.monto);
  const media = factores.reduce((s, f) => s + f, 0) / factores.length;
  const peor = Math.max(...factores.map((f) => Math.abs(f - media) / media));
  chk(sobreMinimo.length >= Math.min(3, a.ribbons.length), `${et}: cintas sobre el minimo de espesor (${sobreMinimo.length} de ${a.ribbons.length})`);
  chk(peor < 0.02, `${et}: alto proporcional al monto (desvio max ${(peor * 100).toFixed(2)}%)`);
  // Las que caen al minimo son exactamente las cuyo alto proporcional no llega:
  // el minimo no se usa para inflar cintas que ya se verian.
  const minimoBien = enMinimo.every((p) => Math.abs(p.h - 3) < 0.011 && p.monto * media <= 3.011);
  chk(minimoBien, `${et}: el minimo de 3 px solo cubre cintas que no alcanzarian (${enMinimo.length})`);

  // La textura marca exactamente los movimientos sin objetivo declarado.
  const sinObj = a.filas.filter((f) => f.sinObjetivo).length;
  chk(a.hatch === sinObj, `${et}: textura = movimientos sin objetivo (${a.hatch} dibujadas vs ${sinObj} filas)`);
}

// El global es la union de los ejercicios.
chk(
  global.ribbons.length === anual2026.ribbons.length + anual2027.ribbons.length,
  `el global suma los ejercicios (${global.ribbons.length} = ${anual2026.ribbons.length} + ${anual2027.ribbons.length})`,
);

// La razon dibujada entre los dos ejes contra los totales impresos en la pagina.
const titulares = [...html.matchAll(/tabular-nums text-base-content mt-1">\$([\d.]+)</g)].map((m) => clp(m[1]));
chk(titulares.length === 2, `totales impresos (retiros/inyecciones): ${titulares.length}`);
if (titulares.length === 2 && global.ejes.length === 2) {
  const [ret, iny] = titulares;
  const razonImpresa = ret / iny;
  const razonDibujada = global.ejes[0].h / global.ejes[1].h;
  const desvio = Math.abs(razonDibujada - razonImpresa) / razonImpresa;
  console.log(`  --  ${ret.toLocaleString('es-CL')} retirados / ${iny.toLocaleString('es-CL')} inyectados (razon ${razonImpresa.toFixed(2)}, dibujada ${razonDibujada.toFixed(2)}, desvio ${(desvio * 100).toFixed(1)}%)`);
  chk(desvio < 0.08, `la razon dibujada sigue la de los montos (desvio ${(desvio * 100).toFixed(1)}%)`);
}

// Honestidad declarada y anclas.
chk(html.includes('no afirma que lo retirado de'), 'la pagina declara que las cintas no son transferencias');
chk(html.includes('Textura = sin objetivo'), 'leyenda de la textura sin objetivo');
chk(/mínimo de 3 px/.test(html), 'el pie declara el minimo de espesor');
chk(/comparten la misma escala/.test(html), 'el pie declara la escala compartida');
const hrefs = [...new Set([...html.matchAll(/href="#(mov-\d{4}-\d+)"/g)].map((m) => m[1]))];
const ids = new Set([...html.matchAll(/id="(mov-\d{4}-\d+)"/g)].map((m) => m[1]));
const huerfanas = hrefs.filter((a) => !ids.has(a));
chk(huerfanas.length === 0, `todo enlace a tarjeta resuelve (${hrefs.length} enlaces, ${ids.size} tarjetas)`, huerfanas.join(', '));

console.log(ok.map((m) => `  ok  ${m}`).join('\n'));
if (fallos.length) {
  console.log('\nFALLOS:');
  console.log(fallos.map((m) => `  !!  ${m}`).join('\n'));
  process.exit(1);
}
console.log(`\n${ok.length} comprobaciones ok`);
