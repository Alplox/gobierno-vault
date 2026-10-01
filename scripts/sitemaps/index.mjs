#!/usr/bin/env node
/**
 * sitemaps-index.mjs — Genera `sitemaps/README.md`, un índice de estadísticas
 * del catálogo de artículos (totales y conteo por medio). El dato fuente son
 * los JSONL de `sitemaps/websites/<medio>/<año>.jsonl` y
 * `sitemaps/youtube_channels/<slug>/<año>.jsonl` (generados con `pnpm run sitemaps-sync`).
 *
 * Uso:
 *   pnpm run sitemaps-index
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MEDIA } from './media.mjs';
import { CHANNELS } from './channels.mjs';
import { WEBSITES_DIR, CHANNELS_DIR } from './paths.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
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
  for (const root of [WEBSITES_DIR, CHANNELS_DIR]) {
    if (!existsSync(root)) continue;
    for (const medio of readdirSync(root)) {
      const medioDir = join(root, medio);
      // `_` y `.` reservan directorios auxiliares que no son medios (copias de
      // trabajo, catálogos de referencia). No son slugs indexables.
      if (!statSync(medioDir).isDirectory() || medio.startsWith('.') || medio.startsWith('_')) continue;
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
  }
  return items;
}

// Nombre legible de un slug. El registro (`MEDIA`/`CHANNELS`) es la fuente
// autoritativa; `_manifest.json` es solo cache de estado de sync y sus entradas
// se pueden perder (lectura-modificación-escritura entre procesos), así que
// nunca se usa como única fuente del nombre. `porMedio`/`porCanal` ya traen el
// conteo leído del disco, que tampoco depende del manifest.
function nombreDe(medio, manifest) {
  return MEDIA[medio]?.nombre ?? CHANNELS[medio]?.nombre ?? manifest.medios?.[medio]?.nombre ?? medio;
}

function buildMarkdown(items, manifest) {
  const l = [];
  l.push('# Catálogo de Sitemaps');
  l.push('');
  l.push('> Este archivo se genera automáticamente con `pnpm run sitemaps-index`');
  l.push('> Los datos crudos viven en `sitemaps/websites/<medio>/<año>.jsonl` y `sitemaps/youtube_channels/<slug>/<año>.jsonl` (una línea JSON por artículo/video).');
  l.push('');

  const actualizado = manifest.actualizado;
  const totalMedios = Object.keys(manifest.medios ?? {}).length;
  const totalCanales = Object.keys(CHANNELS).length;
  const totalVideos = items.filter((it) => !!CHANNELS[it.medio]).length;
  l.push(`- **Última sincronización:** ${actualizado ? new Date(actualizado).toLocaleString('es-ES') : 'pendiente'}`);
  l.push(`- **Medios registrados:** ${totalMedios}`);
  l.push(`- **Artículos indexados:** ${items.length.toLocaleString('es-ES')}`);
  l.push(`- **Canales de YouTube:** ${totalCanales} (${totalVideos.toLocaleString('es-ES')} videos)`);
  l.push('');

  // Conteo por medio (prensa) y por canal (YouTube): los videos viven en el
  // mismo JSONL pero se reportan aparte para no mezclarlos con artículos.
  const isYt = (medio) => !!CHANNELS[medio];
  const porMedio = {};
  const porCanal = {};
  const rangoCanal = {};
  for (const it of items) {
    if (isYt(it.medio)) {
      porCanal[it.medio] = (porCanal[it.medio] ?? 0) + 1;
      const y = (it.d || '').slice(0, 4);
      if (/^\d{4}$/.test(y)) {
        const r = rangoCanal[it.medio] ??= { min: y, max: y };
        if (y < r.min) r.min = y;
        if (y > r.max) r.max = y;
      }
    } else {
      porMedio[it.medio] = (porMedio[it.medio] ?? 0) + 1;
    }
  }
  if (Object.keys(porMedio).length) {
    l.push('## Por medio');
    l.push('');
    l.push('| Medio | Artículos |');
    l.push('| --- | --- |');
    for (const [medio, n] of Object.entries(porMedio).sort((a, b) => b[1] - a[1])) {
      l.push(`| ${nombreDe(medio, manifest)} | ${n.toLocaleString('es-ES')} |`);
    }
    l.push('');
  }
  if (Object.keys(porCanal).length) {
    l.push('## Canales de YouTube');
    l.push('');
    l.push('| Canal | Videos | Años |');
    l.push('| --- | --- | --- |');
    for (const [medio, n] of Object.entries(porCanal).sort((a, b) => b[1] - a[1])) {
      const r = rangoCanal[medio];
      const años = r ? (r.min === r.max ? r.min : `${r.min}–${r.max}`) : '—';
      l.push(`| ${nombreDe(medio, manifest)} | ${n.toLocaleString('es-ES')} | ${años} |`);
    }
    l.push('');
  }

  return l.join('\n');
}

// AGENTS.md ya no contiene la tabla de medios (desde modularizacion 2026-08-26) para evitar diffs ruidosos.
// Para editores, la tabla completa se genera aqui como sitemaps/MEDIOS.md (antes vivia en AGENTS.md).
const MEDIOS_OUT = join(SITEMAPS_DIR, 'MEDIOS.md');

function buildMediosMd(manifest) {
  const l = [];
  l.push('# Medios registrados');
  l.push('');
  l.push('> Generado por `pnpm run sitemaps-index` desde `scripts/sitemaps/media.mjs:MEDIA` + `scripts/sitemaps/channels.mjs:CHANNELS` + `sitemaps/_manifest.json`. No editar a mano.');
  l.push('> Para el resumen por conteo ver `sitemaps/README.md`; el nombre y el total salen del registro y del disco, y `_manifest.json` aporta solo el estado de sync.');
  l.push('');
  l.push('| Slug | Nombre | Sitemap(s) | Filtro | Artículos | Años |');
  l.push('| --- | --- | --- | --- | --- | --- |');
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
    const filtro = conf.includeRe ? 'includeRe' : conf.articleOnly ? 'articleOnly (Yoast)' : '—';
    const articulos = estado?.articulos != null ? String(estado.articulos).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
    const años = estado?.años != null ? estado.años : '—';
    l.push(`| \`${slug}\` | ${conf.nombre} | \`${sitemaps}\` | ${filtro} | ${articulos} | ${años} |`);
  }
  l.push('');
  l.push('## Canales de YouTube');
  l.push('');
  l.push('> Sincronizados con yt-dlp (`scripts/sitemaps/youtube.mjs`), no con sitemaps XML.');
  l.push('> `s:"yt"` = fecha estimada del tab · `s:"yt-exact"` = fecha real verificada.');
  l.push('');
  l.push('| Slug | Nombre | Canal | Tab | Videos | Años |');
  l.push('| --- | --- | --- | --- | --- | --- |');
  for (const slug of Object.keys(CHANNELS).sort()) {
    const conf = CHANNELS[slug];
    const estado = manifest.medios?.[slug];
    const videos = estado?.articulos != null ? String(estado.articulos).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';
    const anos = estado?.años != null ? estado.años : '—';
    l.push(`| \`${slug}\` | ${conf.nombre} | \`${conf.channel}\` | ${conf.tab ?? 'videos'} | ${videos} | ${anos} |`);
  }
  l.push('');
  l.push('Nota: los JSONL no se commitean (regenerables); el estado vive en `_manifest.json`.');
  l.push('');
  return l.join('\n');
}

const items = loadCatalog();
const manifest = readManifest();
const md = buildMarkdown(items, manifest);
writeFileSync(OUT, md, 'utf8');
console.log(`✔ sitemaps/README.md generado: ${items.length.toLocaleString('es-ES')} artículos`);
const mediosMd = buildMediosMd(manifest);
writeFileSync(MEDIOS_OUT, mediosMd, 'utf8');
console.log(`✔ sitemaps/MEDIOS.md generado: ${Object.keys(MEDIA).length} slugs`);
