#!/usr/bin/env node
// Barrido de frontmatter mal cerrado en las colecciones markdown del vault.
//
// Por qué existe: `readCollection()` de scripts/validate/validate.mjs carga cada
// archivo con /^---\r?\n([\s\S]*?)\r?\n---/ y, si no matchea, lo salta SIN
// error. El síntoma es un "wikilink roto … fuente no registrada" puzzling y un
// conteo de colecciones que no sube. El recorte sistemático afecta a los
// archivos cuyo frontmatter termina en un bloque `notas:` multilínea.
//
// Uso:
//   node .agents/skills/data-yaml/scripts/check-frontmatter.mjs            # todo el vault
//   node .agents/skills/data-yaml/scripts/check-frontmatter.mjs <archivo>… # solo estos
//
// Salida: lista de archivos sin delimitador de cierre (o con YAML inválido) y
// código de salida 1 si hay alguno. No modifica nada: la reparación es añadir
// `---\n` al final del frontmatter.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const FM_RE = /^---\r?\n([\s\S]*?)\r?\n---/;
const ROOT = process.cwd();
const COLLECCIONES = ['sources', 'people', 'organizations', 'cifras', 'topics'];

let yaml = null;
try {
  yaml = (await import('yaml')).default;
} catch {
  console.error('aviso: no se pudo importar "yaml"; se omite la comprobación de parseo');
}

const args = process.argv.slice(2);
const archivos = args.length
  ? args
  : COLLECCIONES.flatMap((c) => {
      const dir = join(ROOT, 'src', 'content', c);
      let out = [];
      try {
        out = readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f));
      } catch {
        /* colección ausente */
      }
      return out;
    });

const malos = [];
for (const f of archivos) {
  let raw;
  try {
    raw = readFileSync(f, 'utf8');
  } catch {
    console.error(`ilegible: ${f}`);
    malos.push(f);
    continue;
  }
  const m = raw.match(FM_RE);
  if (!m) {
    malos.push(f);
    console.log(`frontmatter sin cierre "---": ${f}`);
    continue;
  }
  if (yaml) {
    try {
      yaml.parse(m[1]);
    } catch (e) {
      malos.push(f);
      console.log(`YAML inválido: ${f} → ${String(e.message).split('\n')[0]}`);
    }
  }
}

console.log(malos.length ? `${malos.length} archivo(s) con frontmatter roto` : `OK: ${archivos.length} archivo(s)`);
process.exit(malos.length ? 1 : 0);
