#!/usr/bin/env node
/**
 * sitemaps-index.mjs — Genera `sitemaps/README.md`, un índice de estadísticas
 * del catálogo de artículos (totales y conteo por medio). El dato fuente son
 * los JSONL de `sitemaps/<medio>/<año>.jsonl` (generados con `pnpm run sitemaps-sync`).
 *
 * Uso:
 *   pnpm run sitemaps-index
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA } from './sync-sitemaps.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SITEMAPS_DIR = join(ROOT, 'sitemaps');
const MANIFEST_PATH = join(SITEMAPS_DIR, '_manifest.json');
const OUT = join(SITEMAPS_DIR, 'README.md');

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  } catch {
    return { actualizado: null, medios: {} };
  }
}

// Carga todos los JSONL: [{ medio, fecha, url, titulo, source }]
function loadCatalog() {
  const items = [];
  if (!existsSync(SITEMAPS_DIR)) return items;
  for (const medio of readdirSync(SITEMAPS_DIR)) {
    const medioDir = join(SITEMAPS_DIR, medio);
    if (!statSync(medioDir).isDirectory() || medio.startsWith('.')) continue;
    for (const file of readdirSync(medioDir)) {
      if (!/^\d{4}\.jsonl$/.test(file)) continue;
      const raw = readFileSync(join(medioDir, file), 'utf8');
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        try {
          const e = JSON.parse(line);
          items.push({ medio, d: e.d, u: e.u, t: e.t ?? null, s: e.s ?? null });
        } catch {
          /* línea corrupta: se omite */
        }
      }
    }
  }
  return items;
}

function buildMarkdown(items, manifest) {
  const l = [];
  l.push('# Catálogo de Sitemaps');
  l.push('');
  l.push('> Este archivo se genera automáticamente con `pnpm run sitemaps-index`');
  l.push('> Los datos crudos viven en `sitemaps/<medio>/<año>.jsonl` (una línea JSON por artículo).');
  l.push('');

  const actualizado = manifest.actualizado;
  const totalMedios = Object.keys(manifest.medios ?? {}).length;
  l.push(`- **Última sincronización:** ${actualizado ? new Date(actualizado).toLocaleString('es-ES') : 'pendiente'}`);
  l.push(`- **Medios registrados:** ${totalMedios}`);
  l.push(`- **Artículos indexados:** ${items.length.toLocaleString('es-ES')}`);
  l.push('');

  // Conteo por medio
  const porMedio = {};
  for (const it of items) porMedio[it.medio] = (porMedio[it.medio] ?? 0) + 1;
  if (Object.keys(porMedio).length) {
    l.push('## Por medio');
    l.push('');
    l.push('| Medio | Artículos |');
    l.push('|---|---|');
    for (const [medio, n] of Object.entries(porMedio).sort((a, b) => b[1] - a[1])) {
      const nombre = manifest.medios?.[medio]?.nombre ?? medio;
      l.push(`| ${nombre} | ${n.toLocaleString('es-ES')} |`);
    }
    l.push('');
  }

  return l.join('\n');
}

// ---------------------------------------------------------------------------
// Sección "Medios registrados" en AGENTS.md (AUTO-GENERATED)
// ---------------------------------------------------------------------------
// Reemplaza el bloque delimitado por los marcadores con la tabla generada desde
// el registro MEDIA (scripts/sync-sitemaps.mjs) + _manifest.json, para que el
// listado de sitios sincronizados nunca quede desincronizado con el script.
const AGENTS_PATH = join(ROOT, 'AGENTS.md');
const MEDIOS_MARKER_START = '<!-- AUTO-GENERATED-SITEMAPS-MEDIOS -->';
const MEDIOS_MARKER_END = '<!-- /AUTO-GENERATED-SITEMAPS-MEDIOS -->';

function buildMediosSection(manifest, eol = '\n') {
  const l = [];
  l.push(MEDIOS_MARKER_START);
  l.push('');
  l.push('### Medios registrados (generado automáticamente)');
  l.push('');
  l.push('> Esta sección se genera con `pnpm run sitemaps-index` a partir del registro `MEDIA`');
  l.push('> de `scripts/sync-sitemaps.mjs` y de `sitemaps/_manifest.json`. NO editar a mano.');
  l.push('');
  l.push('| Slug | Nombre | Sitemap(s) | Filtro | Artículos | Años |');
  l.push('|---|---|---|---|---|---|');
  const slugs = Object.keys(MEDIA).sort((a, b) => a.localeCompare(b));
  for (const slug of slugs) {
    const conf = MEDIA[slug];
    const estado = manifest.medios?.[slug];
    const urls = [
      ...(conf.robots ? [conf.robots] : []),
      ...(conf.index ? [conf.index] : []),
      ...(conf.extra ?? []),
    ];
    const sitemaps = urls.map((u) => u.replace(/^https?:\/\//, '')).join(', ');
    const filtro = conf.includeRe
      ? 'includeRe'
      : conf.articleOnly
        ? 'articleOnly (Yoast)'
        : '—';
    const articulos = estado?.articulos != null ? String(estado.articulos).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
    const años = estado?.años != null ? estado.años : '—';
    l.push(`| \`${slug}\` | ${conf.nombre} | \`${sitemaps}\` | ${filtro} | ${articulos} | ${años} |`);
  }
  l.push('');
  l.push('Nota: los JSONL no se commitean (regenerables); el estado vive en `_manifest.json`.');
  l.push('');
  l.push(MEDIOS_MARKER_END);
  return l.join(eol);
}

// El bloque debe usar el mismo EOL que el AGENTS.md existente (CRLF en
// Windows) para no dejar el archivo con finales de línea mezclados.
function detectEol(content) {
  const crlf = (content.match(/\r\n/g) || []).length;
  const lf = (content.match(/(?<!\r)\n/g) || []).length;
  return crlf >= lf && crlf > 0 ? '\r\n' : '\n';
}

function updateAgentsMedios(manifest) {
  if (!existsSync(AGENTS_PATH)) return;
  const content = readFileSync(AGENTS_PATH, 'utf8');
  const startIdx = content.indexOf(MEDIOS_MARKER_START);
  const endIdx = content.indexOf(MEDIOS_MARKER_END);
  const eol = detectEol(content);
  const block = buildMediosSection(manifest, eol);
  // Edge case: marcadores incompletos (uno sin el otro) = AGENTS.md tocado a
  // mano. Mejor avisar que sobrescribir o duplicar en silencio.
  if ((startIdx === -1) !== (endIdx === -1)) {
    console.warn('⚠ AGENTS.md tiene marcadores AUTO-GENERATED-SITEMAPS-MEDIOS incompletos (falta ' +
      (startIdx === -1 ? 'inicio' : 'fin') + '). Corrige a mano antes de regenerar.');
    return;
  }
  const joiner = `${eol}${eol}`;
  if (startIdx === -1) {
    // Insertar antes de la sección de estadísticas auto-generadas (si existe)
    const statsMarker = '<!-- AUTO-GENERATED-STATS -->';
    const insertAt = content.indexOf(statsMarker);
    if (insertAt === -1) {
      writeFileSync(AGENTS_PATH, `${content.trim()}${joiner}${block}${eol}`, 'utf8');
    } else {
      writeFileSync(
        AGENTS_PATH,
        `${content.slice(0, insertAt).trim()}${joiner}${block}${joiner}${content.slice(insertAt).trim()}${eol}`,
        'utf8'
      );
    }
  } else if (endIdx !== -1) {
    writeFileSync(
      AGENTS_PATH,
      content.slice(0, startIdx).trimEnd() + joiner + block + joiner + content.slice(endIdx + MEDIOS_MARKER_END.length).trimStart(),
      'utf8'
    );
  }
}

const items = loadCatalog();
const manifest = readManifest();
const md = buildMarkdown(items, manifest);
writeFileSync(OUT, md, 'utf8');
console.log(`✔ sitemaps/README.md generado: ${items.length.toLocaleString('es-ES')} artículos`);
updateAgentsMedios(manifest);
console.log('✔ AGENTS.md actualizado con la sección de medios del catálogo');
