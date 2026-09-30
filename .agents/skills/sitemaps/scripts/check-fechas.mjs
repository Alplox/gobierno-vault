#!/usr/bin/env node
/**
 * Verifica que la fecha guardada de cada artículo (campo `d`) sea la fecha real
 * del medio, comparándola con la que se deduce de la URL.
 *
 *   node .agents/skills/sitemaps/scripts/check-fechas.mjs [slug...]
 *
 * Sin argumentos revisa todos los medios que tienen `locDateRe` configurado: son
 * los que pueden tener la fecha tomada del path, y por lo tanto los que se
 * pueden auditar de forma objetiva.
 *
 * Por qué importa: hay dos formas de fecha que fallan en silencio, sin error y
 * sin entrada descartada. (1) Cuando el sitio regenera sus shards, el
 * `<lastmod>` es uniforme y falso: sin `locDateRe` cientos de URLs caen todas en
 * la fecha de la migración. (2) Cuando el medio publica en hora local pero su
 * `lastmod` es el instante en UTC, lo publicado después de las 20:00 queda
 * fechado D+1 (~12% del catálogo de `la_hora` fue justo eso). En ambos casos el
 * síntoma es el mismo: fechas equivocadas que nadie detecta.
 *
 * Un 100% de coincidencia es el estado esperado. Si aparece un medio con
 * desajuste, el arreglo casi siempre es `locDateRe` (o `preferLocDate` si el
 * problema es el huso), y después hay que reconstruir con `--replace`: el merge
 * incremental no corrige fechas ya guardadas.
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs from 'node:fs';

// La raíz del repo son 4 niveles arriba desde .agents/skills/sitemaps/scripts/.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const { MEDIA } = await import(pathToFileURL(join(ROOT, 'scripts/sitemaps/media.mjs')).href);
const { medioDir } = await import(pathToFileURL(join(ROOT, 'scripts/sitemaps/paths.mjs')).href);
const pedidos = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const conLocDate = Object.entries(MEDIA).filter(([slug, c]) => c.locDateRe && (!pedidos.length || pedidos.includes(slug)));
const soloConCatalogo = process.argv.includes('--solo-con-catalogo');

if (!conLocDate.length) {
  console.log(pedidos.length ? `Ninguno de esos slugs tiene locDateRe: ${pedidos.join(', ')}` : 'Ningún medio tiene locDateRe.');
  process.exit(0);
}

console.log(`Medios con locDateRe: ${conLocDate.map(([s, c]) => s + (c.preferLocDate ? '*' : '')).join(', ')}`);
console.log('(* = preferLocDate activo)\n');

let conProblemas = 0;
for (const [slug, cfg] of conLocDate) {
  const dir = medioDir(slug);
  if (!fs.existsSync(dir)) {
    if (!soloConCatalogo) console.log(`${slug}: sin catálogo local (corrá sitemaps-sync -- ${slug} primero)`);
    continue;
  }
  let total = 0, ok = 0, sinPath = 0;
  const ejemplos = [];
  for (const f of fs.readdirSync(dir).filter((x) => /^\d{4}\.jsonl$/.test(x))) {
    for (const line of fs.readFileSync(join(dir, f), 'utf8').split('\n').filter(Boolean)) {
      const e = JSON.parse(line);
      const m = e.u.match(cfg.locDateRe);
      // El regex puede traer 2 grupos (YYYY/MM, día 01) o 3 (YYYY/MM/DD).
      if (!m) { sinPath++; continue; }
      const d = `${m[1]}-${m[2]}-${m[3] ?? '01'}`;
      total++;
      if (e.d === d) ok++;
      else if (ejemplos.length < 2) ejemplos.push(`d=${e.d} vs path=${d}`);
    }
  }
  if (!total) { console.log(`${slug}: el locDateRe no matchea ninguna URL — revisá el patrón`); conProblemas++; continue; }
  const pct = ((ok / total) * 100).toFixed(2);
  const mal = total - ok;
  if (mal) conProblemas++;
  console.log(
    `${mal ? 'REVISAR' : 'OK     '} ${slug.padEnd(18)} ${String(ok).padStart(9)}/${String(total).padEnd(9)} (${pct}%)` +
    (sinPath ? ` · ${sinPath} sin fecha en el path` : '') +
    (mal ? `\n         desajustes: ${mal}. ejemplos: ${ejemplos.join(' | ')}` : ''),
  );
}

console.log(conProblemas ? `\n${conProblemas} medio(s) con fechas a revisar.` : '\nTodas las fechas coinciden con la URL.');
process.exit(conProblemas ? 1 : 0);
