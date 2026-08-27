#!/usr/bin/env node
// generate-seguimiento-index.mjs — genera TAREAS/SEGUIMIENTO_INDEX.md desde TAREAS/SEGUIMIENTO/*.md
// Formato de fila en los YYYY.md: | ID | Estado | Fecha | Bucket | Título | Evento(s) | Origen: <url> |
// Valida IDs únicos, estado ⬜/🟡, y Origen obligatorio. No toca AGENTS.md.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const ROOT = join(import.meta.dirname || '.', '..');
const SEGUIMIENTO_DIR = join(ROOT, 'TAREAS', 'SEGUIMIENTO');
const INDEX_PATH = join(ROOT, 'TAREAS', 'SEGUIMIENTO_INDEX.md');
const DRY = process.argv.includes('--dry-run');

function parseRows(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const rows = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Tabla: | S-2026-001 | ⬜ | 2026-08-25 | Bucket | Título | `20260821-8` | Origen: https://... |
    if (!line.startsWith('|')) continue;
    if (line.includes('| ID |') || line.includes('|---')) continue;
    const parts = line.split('|').map(s => s.trim());
    // parts[0] is empty before first |, parts[7] is after last |
    if (parts.length < 8) continue;
    const [_, id, estado, fecha, bucket, titulo, eventos, origen] = parts;
    if (!/^([SAV])-(\d{4}|TRANS)-(\d{3})$/.test(id)) continue;
    rows.push({ id, estado, fecha, bucket, titulo, eventos, origen, file: basename(filePath), line: i + 1 });
  }
  return rows;
}

function main() {
  if (!existsSync(SEGUIMIENTO_DIR)) {
    console.error(`No existe ${SEGUIMIENTO_DIR}`);
    process.exit(1);
  }
  const files = readdirSync(SEGUIMIENTO_DIR).filter(f => f.endsWith('.md'));
  if (files.length === 0) {
    console.error(`No hay archivos en ${SEGUIMIENTO_DIR}`);
    process.exit(1);
  }

  const allRows = [];
  const seen = new Map();
  let errors = 0;

  for (const f of files) {
    const rows = parseRows(join(SEGUIMIENTO_DIR, f));
    for (const r of rows) {
      if (seen.has(r.id)) {
        console.error(`✖ ID duplicado ${r.id} en ${f}:${r.line} (ya visto en ${seen.get(r.id).file}:${seen.get(r.id).line})`);
        errors++;
      } else {
        seen.set(r.id, r);
      }
      if (!['⬜', '🟡'].includes(r.estado)) {
        console.error(`✖ Estado inválido "${r.estado}" en ${r.id} (${f}:${r.line}) — debe ser ⬜ o 🟡`);
        errors++;
      }
      if (!r.origen.includes('Origen:')) {
        console.error(`✖ Origen faltante en ${r.id} (${f}:${r.line}) — debe tener "Origen: https://..."`);
        errors++;
      } else if (!r.origen.includes('http') && !r.origen.toLowerCase().includes('catálogo') && !r.origen.toLowerCase().includes('sitemaps')) {
        console.warn(`⚠ Origen sin URL en ${r.id} (${f}:${r.line}) — preferible "Origen: https://..." o "catálogo sitemaps"`);
        // no incrementa errors para no bloquear índice inicial; corregir en siguiente pasada
      }
      if (!r.fecha || !/^\d{4}-\d{2}-\d{2}/.test(r.fecha)) {
        // fecha puede ser TRANS o vacía para transversales, solo warn
      }
      allRows.push(r);
    }
  }

  if (errors > 0 && !DRY) {
    console.error(`\n${errors} error(es) — corrige antes de generar el índice`);
    process.exit(1);
  }

  // Ordenar por ID (S-2026-001 < S-2026-002, A- antes que S? Orden lexicográfico ya agrupa por tipo y año)
  allRows.sort((a, b) => a.id.localeCompare(b.id));

  // Resumen por año y tipo
  const porAno = {};
  const porTipo = {};
  for (const r of allRows) {
    const ano = r.id.split('-')[1];
    porAno[ano] = (porAno[ano] || 0) + 1;
    const tipo = r.id[0];
    porTipo[tipo] = (porTipo[tipo] || 0) + 1;
  }

  let md = `# Índice de Seguimiento\n\n`;
  md += `> Generado por \`pnpm run generate-seguimiento-index\` desde \`TAREAS/SEGUIMIENTO/*.md\`. No editar a mano.\n`;
  md += `> Para retomar: \`rg "S-2026-042" TAREAS/SEGUIMIENTO_INDEX.md\` o \`read TAREAS/SEGUIMIENTO/2026.md\`.\n\n`;
  md += `**Total tareas:** ${allRows.length}\n\n`;
  md += `**Por año:** ${Object.entries(porAno).sort().map(([k,v]) => `${k}: ${v}`).join(' · ') || '—'}\n\n`;
  md += `**Por tipo:** ${Object.entries(porTipo).sort().map(([k,v]) => `${k}: ${v}`).join(' · ') || '—'} (S=seguimiento, A=ampliación, V=verificación)\n\n`;
  md += `| ID | Estado | Fecha | Bucket | Título | Evento(s) | Origen |\n`;
  md += `| --- | --- | --- | --- | --- | --- | --- |\n`;
  for (const r of allRows) {
    md += `| ${r.id} | ${r.estado} | ${r.fecha} | ${r.bucket} | ${r.titulo} | ${r.eventos} | ${r.origen} |\n`;
  }
  md += `\n*Estados: ⬜ pendiente, 🟡 parcial. Al cerrar, la fila se elimina del YYYY.md (como PENDIENTES) y el hecho queda en EVENTS_INDEX.md + git log.*\n`;

  if (DRY) {
    console.log(`DRY-RUN: ${allRows.length} filas válidas, ${errors} errores`);
    console.log(md.slice(0, 2000));
    return;
  }

  writeFileSync(INDEX_PATH, md, 'utf8');
  console.log(`✔ TAREAS/SEGUIMIENTO_INDEX.md generado con ${allRows.length} tareas (${Object.keys(porAno).length} años, ${Object.keys(porTipo).length} tipos)`);
  console.log(`  ${Object.entries(porAno).sort().map(([k,v])=>`${k}:${v}`).join(' ')}`);
}

main();
