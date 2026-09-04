// Limpieza mecánica del backlog de la regla AGENTS.md n.º 8 (menciones de
// personas en prosa sin wikilink). Usa la MISMA lógica que validate.mjs
// (scripts/proseNames.mjs), así que tras correrlo validate debe quedar en 0.
//
// Uso:
//   node scripts/fix-prose-wikilinks.mjs            # aplica los cambios
//   node scripts/fix-prose-wikilinks.mjs --dry-run  # solo reporta
//   node scripts/fix-prose-wikilinks.mjs --limit 20 # solo los primeros 20 archivos
//
// El texto visible cambia al nombre canónico de src/content/people/*.md (la regla elegida:
// "Kast" → [[people/jose_antonio_kast]] renderiza "José Antonio Kast").

import { readFileSync, writeFileSync } from 'node:fs';
import { findReplaceableMentions, loadPeopleIndex, walkEventFiles } from '../lib/proseNames.mjs';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

const peopleIndex = loadPeopleIndex();
const files = walkEventFiles();

let changed = 0;
let totalReplacements = 0;
const perKind = { full: 0, surname: 0 };

for (const file of files) {
  if (changed >= limit) break;
  let content = readFileSync(file, 'utf8');
  // CRLF-tolerante (core.autocrlf=true entrega \r\n en checkout de Windows).
  const fmMatch = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  if (!fmMatch) continue;
  const bodyStart = fmMatch[0].length;

  // Iterar hasta punto fijo (máx. 8 pasadas): enlazar el nombre completo de una
  // persona la convierte en "enlazada", lo que habilita la detección de sus
  // menciones por apellido en la pasada siguiente (ej. "Augusto Pinochet" →
  // habilita "Pinochet" a secas).
  let replacedAny = false;
  for (let iter = 0; iter < 8; iter++) {
    const body = content.slice(bodyStart);
    const { mentions } = findReplaceableMentions(body, peopleIndex);
    if (mentions.length === 0) break;

    for (const m of mentions) perKind[m.kind]++;
    totalReplacements += mentions.length;
    replacedAny = true;

    if (dryRun && iter === 0) {
      console.log(`${file}: ${mentions.length} mención(es) (${mentions.map((m) => `"${m.phrase}"→[[people/${m.personId}]]`).slice(0, 4).join(', ')}${mentions.length > 4 ? ', …' : ''})`);
    }

    let out = body;
    for (let i = mentions.length - 1; i >= 0; i--) {
      const m = mentions[i];
      out = out.slice(0, m.start) + `[[people/${m.personId}]]` + out.slice(m.end);
    }
    content = content.slice(0, bodyStart) + out;
  }

  if (replacedAny) {
    if (!dryRun) writeFileSync(file, content);
    changed++;
  }
}

console.log(
  `${dryRun ? '[dry-run] ' : ''}${changed} archivo(s) con cambios, ${totalReplacements} reemplazo(s) ` +
    `(full: ${perKind.full}, apellido: ${perKind.surname})`
);
