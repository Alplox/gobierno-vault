// Verifica los gabinetes de src/content/people/*.md (cargos[]) contra los anexos de gabinetes de Wikipedia.
// Descarga el wikitexto (con caché local), parsea las tablas de ministros y compara
// fechas/nombres. Reporte legible; no falla el build (herramienta de auditoría).
//
// Uso:      node scripts/verify-gabinete.mjs [--sin-cache]
// Salida:   resumen por gobierno + listado de discrepancias.
// Trazabilidad de fuentes por gobierno: TAREAS/GABINETES-VERIFICACION.md
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const ROOT = process.cwd();
const CACHE = join(ROOT, 'sitemaps', '.cache', 'gabinete-wiki');
const SIN_CACHE = process.argv.includes('--sin-cache');

const PAGINAS = [
  { file: 'aguirre_cerda.txt', titulo: 'Anexo:Gabinetes ministeriales del gobierno de Pedro Aguirre Cerda', secciones: [{ gobierno: 'aguirre_cerda', re: '.' }] },
  { file: 'gonzalez_videla.txt', titulo: 'Anexo:Gabinetes ministeriales del gobierno de Gabriel González Videla', secciones: [{ gobierno: 'gonzalez_videla', re: '.' }] },
  { file: 'ibanez2.txt', titulo: 'Anexo:Gabinetes ministeriales del segundo gobierno de Carlos Ibáñez del Campo', secciones: [{ gobierno: 'ibanez2', re: '.' }] },
  { file: 'alessandri.txt', titulo: 'Anexo:Gabinetes ministeriales del gobierno de Jorge Alessandri', secciones: [{ gobierno: 'alessandri_jorge', re: '.' }] },
  { file: 'frei_mtva.txt', titulo: 'Anexo:Gabinetes ministeriales del gobierno de Eduardo Frei Montalva', secciones: [{ gobierno: 'frei_mtva', re: '.' }] },
  { file: 'allende.txt', titulo: 'Anexo:Gabinetes ministeriales del gobierno de Salvador Allende', secciones: [{ gobierno: 'allende', re: '.' }] },
  { file: 'pinochet.txt', titulo: 'Anexo:Gabinetes ministeriales de la dictadura militar chilena', secciones: [{ gobierno: 'pinochet', re: '.' }] },
  { file: 'concertacion.txt', titulo: 'Anexo:Gabinetes ministeriales de los gobiernos de la Concertación', secciones: [
    { gobierno: 'aylwin', re: 'Ministros de Estado de Patricio Aylwin' },
    { gobierno: 'frei', re: 'Ministros de Estado de Eduardo Frei' },
    { gobierno: 'lagos', re: 'Ministros de Estado de Ricardo Lagos' },
    { gobierno: 'bachelet1', re: 'Gabinetes ministeriales del primer gobierno de Michelle Bachelet' },
  ] },
  { file: 'pinera1.txt', titulo: 'Anexo:Gabinetes ministeriales del primer gobierno de Sebastián Piñera', secciones: [{ gobierno: 'pinera1', re: 'Ministros' }] },
  { file: 'bachelet2.txt', titulo: 'Anexo:Gabinetes ministeriales del segundo gobierno de Michelle Bachelet', secciones: [{ gobierno: 'bachelet2', re: 'Ministros' }] },
  { file: 'pinera2.txt', titulo: 'Anexo:Gabinetes ministeriales del segundo gobierno de Sebastián Piñera', secciones: [{ gobierno: 'pinera2', re: 'Ministros' }] },
  { file: 'boric.txt', titulo: 'Anexo:Gabinetes ministeriales del gobierno de Gabriel Boric', secciones: [{ gobierno: 'boric', re: 'Ministros' }] },
  { file: 'kast.txt', titulo: 'Anexo:Gabinetes ministeriales del gobierno de José Antonio Kast', secciones: [{ gobierno: 'kast', re: '.' }] },
];

const GOBIERNOS = [
  ['aguirre_cerda', '1938-12-24', '1941-11-25'], ['gonzalez_videla', '1946-11-03', '1952-11-03'],
  ['ibanez2', '1952-11-03', '1958-11-03'], ['alessandri_jorge', '1958-11-03', '1964-11-03'],
  ['frei_mtva', '1964-11-03', '1970-11-03'], ['allende', '1970-11-03', '1973-09-11'],
  ['pinochet', '1973-09-11', '1990-03-11'],
  ['aylwin', '1990-03-11', '1994-03-11'], ['frei', '1994-03-11', '2000-03-11'],
  ['lagos', '2000-03-11', '2006-03-11'], ['bachelet1', '2006-03-11', '2010-03-11'],
  ['pinera1', '2010-03-11', '2014-03-11'], ['bachelet2', '2014-03-11', '2018-03-11'],
  ['pinera2', '2018-03-11', '2022-03-11'], ['boric', '2022-03-11', '2026-03-11'],
  ['kast', '2026-03-11', null],
];

const MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7, agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };

function norm(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function limpiar(c) {
  return c
    .replace(/<ref[^>]*\/>/g, '').replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/^\|\s*/, '')
    .trim();
}

function extraerFechas(txt) {
  const tokens = [...txt.matchAll(/(\d{1,2})[º.°]?\s+de\s+([a-záéíóúñ]+)(?:\s+de\s+(\d{4}))?/gi)]
    .map((m) => ({ d: +m[1], mes: MESES[m[2].toLowerCase()], anio: m[3] ? +m[3] : null }))
    .filter((t) => t.mes);
  // heredar año: un "1 de abril - 7 de diciembre de 1953" comparte el año del rango
  for (let i = tokens.length - 1; i >= 0; i--) {
    if (!tokens[i].anio) {
      const sig = tokens.slice(i + 1).find((t) => t.anio);
      const ant = [...tokens.slice(0, i)].reverse().find((t) => t.anio);
      tokens[i].anio = sig?.anio ?? ant?.anio ?? null;
    }
  }
  return tokens.filter((t) => t.anio).map((t) => `${t.anio}-${String(t.mes).padStart(2, '0')}-${String(t.d).padStart(2, '0')}`);
}

function parseTabla(tabla, gobierno) {
  // Encabezado: unir todas las líneas ! consecutivas al inicio (algunos anexos las parten)
  let header = '';
  for (const l of tabla.split('\n')) {
    if (l.trim().startsWith('!')) header += ' ' + l.trim().replace(/^!/, '');
    else if (header && !l.trim().startsWith('!')) break;
  }
  if (!/ministerio|ministros/i.test(header) || !/nombre|titular/i.test(header) || /subsecretar/i.test(header)) return [];
  let ministerioActual = null;
  const out = [];
  for (const rawRow of tabla.split(/^\|-.*$/m)) {
    const lineas = rawRow.split('\n').filter((l) => l.trim().startsWith('|'));
    if (!lineas.length) continue;
    const fila = lineas.map((l) => l.trim().replace(/^\|/, '')).join(' || ');
    const celdas = fila.split('||').map((c) => c.trim()).filter(Boolean);
    if (celdas.length < 2) continue;
    let idx = 0;
    let ministerio = ministerioActual;
    if (/ministerio|secretar[íi]a general|rowspan/i.test(celdas[0])) {
      ministerio = limpiar(celdas[0])
        .replace(/rowspan="?\d+"?\s*\|?\s*/i, '')
        .replace(/^ministerio\s+(del|de la|de los|de)\s*/i, '')
        .replace(/\(chile\)/gi, '')
        .split(/\s{2,}/)[0].trim();
      idx = 1;
      ministerioActual = ministerio;
    }
    // nombres con sufijo de partido "(PDC)", "(Militar)", etc.
    const nombre = limpiar(celdas[idx] ?? '').replace(/\s*\((?:pdc|pcch|ps|psd|pr|pri|pir|mapu|ic|api|ind\.?|militar|frap|padena|usopo)\)\s*$/i, '').trim();
    if (!nombre || !ministerio) continue;
    const fechas = extraerFechas(celdas.slice(idx + 1).join(' '));
    out.push({ gobierno, ministerio: norm(ministerio), nombre, nombreNorm: norm(nombre), desde: fechas[0] ?? null, hasta: fechas.length > 1 ? fechas[fechas.length - 1] : null });
  }
  return out;
}

async function descargar(titulo, destino) {
  if (!SIN_CACHE && existsSync(destino)) return readFileSync(destino, 'utf8');
  const url = `https://es.wikipedia.org/w/index.php?title=${encodeURIComponent(titulo)}&action=raw`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${titulo}`);
  const txt = await res.text();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(destino, txt, 'utf8');
  return txt;
}

function nombresCompatibles(a, b) {
  if (a === b) return true;
  const ta = new Set(a.split(' ')), tb = new Set(b.split(' '));
  let comunes = 0;
  for (const t of ta) if (tb.has(t)) comunes++;
  return comunes >= 2 && comunes >= Math.min(ta.size, tb.size) - 1;
}

function loadPeopleFromMarkdown() {
  // Fuente de verdad: src/content/people/*.md (monolito eliminado ago-2026, sin fallback).
  const dir = join(ROOT, 'src', 'content', 'people');
  const rec = {};
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    const id = f.replace(/\.md$/, '');
    const raw = readFileSync(join(dir, f), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (m) rec[id] = YAML.parse(m[1]);
  }
  if (!Object.keys(rec).length) throw new Error('src/content/people/*.md no encontrado o vacío');
  return rec;
}

async function main() {
  const people = loadPeopleFromMarkdown();
  const RE = /^(ministr[oa]|biministr[oa]?)\b/i;
  const EX = /corte|desregulaci[óo]n|\(\d{4}\)|de (china|estados unidos|argentina|brasil|per[uú]|bolivia|ecuador|colombia|venezuela|paraguay|uruguay|m[eé]xico|espa[ñn]a|francia|israel|rusia|russia|jap[oó]n|corea del norte|corea del sur|corea|india|reino unido)\b/i;

  const vault = [];
  for (const [id, p] of Object.entries(people)) {
    for (const c of p.cargos ?? []) {
      const cargo = c.cargo ?? '';
      if (!RE.test(cargo) || EX.test(cargo) || !c.desde) continue;
      let gob = null;
      for (const [gid, ini, fin] of GOBIERNOS) {
        if (c.desde >= ini && (!fin || c.desde < fin)) { gob = gid; break; }
      }
      if (!gob) continue;
      vault.push({ id, nombre: p.nombre, nombreNorm: norm(p.nombre), cargo, desde: c.desde, hasta: c.hasta ?? null, gob });
    }
  }

  const wiki = [];
  for (const pag of PAGINAS) {
    const txt = await descargar(pag.titulo, join(CACHE, pag.file));
    for (const sec of pag.secciones) {
      let body = txt;
      if (sec.re !== '.') {
        const sm = txt.match(new RegExp(`={2,3}\\s*${sec.re}[^=\\n]*={2,3}`));
        if (!sm) { console.error(`⚠ sección no encontrada: ${sec.re} en ${pag.file}`); continue; }
        const rest = txt.slice(sm.index + sm[0].length);
        const nx = rest.match(/\n={2}\s/);
        body = nx ? rest.slice(0, nx.index) : rest;
      }
      for (const m of body.matchAll(/\{\|([\s\S]*?)\|\}/g)) wiki.push(...parseTabla(m[1], sec.gobierno));
    }
  }

  console.log(`Vault: ${vault.length} nombramientos fechados | Wikipedia: ${wiki.length} filas\n`);

  let exactos = 0;
  const difFecha = [], soloVault = [];
  const usados = new Set();
  for (const v of vault) {
    const cand = wiki.map((w, i) => ({ w, i })).filter(({ w }) => w.gobierno === v.gob && nombresCompatibles(w.nombreNorm, v.nombreNorm));
    if (!cand.length) { soloVault.push(v); continue; }
    const m = cand.find(({ w }) => w.desde === v.desde && (w.hasta ?? null) === v.hasta)
      ?? cand.find(({ w }) => w.desde === v.desde)
      ?? cand[0];
    usados.add(m.i);
    const w = m.w;
    if (w.desde === v.desde && (w.hasta ?? null) === v.hasta) { exactos++; continue; }
    difFecha.push({ v, w });
  }
  const soloWiki = wiki.filter((_, i) => !usados.has(i));

  console.log('=== RESUMEN POR GOBIERNO ===');
  for (const [gid] of GOBIERNOS) {
    const v = vault.filter((r) => r.gob === gid).length;
    const w = wiki.filter((r) => r.gobierno === gid).length;
    if (v || w) console.log(`  ${gid.padEnd(15)} vault: ${String(v).padStart(3)} | wiki: ${String(w).padStart(3)}`);
  }
  console.log(`\nEXACTOS: ${exactos}/${vault.length}`);

  if (difFecha.length) {
    console.log(`\n=== DIFERENCIA DE FECHAS (${difFecha.length}) — revisar manualmente; muchas son artefactos de rowspan del parser ===`);
    for (const { v, w } of difFecha) {
      console.log(`[${v.gob}] ${v.id} (${v.cargo}) | vault: ${v.desde} → ${v.hasta ?? 'VIGENTE'} | wiki: ${w.desde} → ${w.hasta ?? 'VIGENTE'} [${w.ministerio}]`);
    }
  }
  if (soloVault.length) {
    console.log(`\n=== SOLO EN VAULT (${soloVault.length}) — sin match por nombre en el anexo ===`);
    for (const v of soloVault.slice(0, 40)) console.log(`[${v.gob}] ${v.id} | ${v.cargo} | ${v.desde} → ${v.hasta ?? 'VIGENTE'}`);
    if (soloVault.length > 40) console.log(`  … y ${soloVault.length - 40} más`);
  }
  if (soloWiki.length) {
    console.log(`\n=== SOLO EN WIKI (${soloWiki.length}) — servicios no ministeriales, subrogancias o personas sin ficha en el vault ===`);
    for (const w of soloWiki.slice(0, 40)) console.log(`[${w.gobierno}] ${w.nombre} | ${w.ministerio} | ${w.desde} → ${w.hasta ?? 'VIGENTE'}`);
    if (soloWiki.length > 40) console.log(`  … y ${soloWiki.length - 40} más`);
  }
  console.log(`\nTrazabilidad: TAREAS/GABINETES-VERIFICACION.md | caché de anexos: sitemaps/.cache/gabinete-wiki/`);
}

main().catch((err) => { console.error('✗', err.message); process.exit(1); });
