#!/usr/bin/env node
/**
 * sitemaps-resync.mjs — Resync manual del catálogo de sitemaps (correr a diario).
 *
 * Cadena de 3 pasos:
 *   1) sync-sitemaps.mjs  → modo MERGE incremental: nunca borra datos existentes.
 *      - `--incremental` omite sub-sitemaps servidos desde caché fresco (los ya
 *        capturados en sync previos; solo expiran los que cambian, ej. news-sitemaps).
 *      - Solo se sincronizan los medios YA presentes en `_manifest.json`
 *        (los recién agregados se suman con `pnpm run sitemaps-sync -- <medio>`).
 *   2) sitemaps-index.mjs → regenera sitemaps/README.md.
 *   3) sitemaps-backup.mjs → regenera sitemaps/sitemaps.gvault.
 *
 * Seguridad anti-borrado: el modo merge NUNCA elimina URLs ya existentes, ni
 * siquiera si un sub-sitemap falló en este run o si cambió un titular (los
 * títulos solo se mejoran: news > slug > ninguno). Para reconstruir desde cero
 * usar explícitamente `pnpm run sitemaps-sync -- --all --replace`.
 *
 * Uso:
 *   pnpm run sitemaps-resync                 # resync de los medios del catálogo
 *   pnpm run sitemaps-resync -- --stale 12   # caché más corto (news frescas)
 *   pnpm run sitemaps-resync -- --days 7     # solo contenido reciente (sin
 *                                            # recargar el catálogo completo)
 */

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// MEDIA ya se exporta de sync-sitemaps.mjs (con guard isMain: importarlo no
// dispara un sync). Sirve para filtrar los slugs del manifest que ya no
// existen en el registro (entradas huérfanas de intentos descartados) antes
// de pasárselos como argumentos — sync-sitemaps.mjs valida todos los targets
// upfront y hace exit(1) al primer slug desconocido, abortando TODO el resync.
import { MEDIA } from './sync-sitemaps.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const MANIFEST_PATH = join(ROOT, 'sitemaps/_manifest.json');
const NODE = process.execPath;

const args = process.argv.slice(2);
const staleArg = args.indexOf('--stale');
const stale = staleArg >= 0 && args[staleArg + 1] ? args[staleArg + 1] : '24';
// Flags opcionales de ventana temporal, pasados tal cual a sync-sitemaps.mjs
// (--since <YYYY-MM-DD> o --days <n>): resync solo de contenido reciente.
const sinceArg = args.indexOf('--since');
const daysArg = args.indexOf('--days');
const syncExtra = [
  ...(sinceArg >= 0 ? ['--since', args[sinceArg + 1]] : []),
  ...(daysArg >= 0 ? ['--days', args[daysArg + 1]] : []),
];

function run(script, scriptArgs = []) {
  console.log(`\n▶ node scripts/${script} ${scriptArgs.join(' ')}`);
  const r = spawnSync(NODE, [join(__dirname, script), ...scriptArgs], {
    stdio: 'inherit',
    cwd: ROOT,
  });
  if (r.status !== 0) {
    console.error(`❌ ${script} falló (exit ${r.status ?? 'signal'}). Los datos existentes NO se tocaron (modo merge).`);
    process.exit(r.status ?? 1);
  }
}

// Medios a resincronizar: solo los ya presentes en el catálogo.
let manifest;
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
} catch {
  console.error('❌ No existe sitemaps/_manifest.json. Primero: pnpm run sitemaps-sync -- <medio>');
  process.exit(1);
}
const enManifest = Object.keys(manifest.medios ?? {});
if (enManifest.length === 0) {
  console.error('❌ El catálogo está vacío. Primero: pnpm run sitemaps-sync -- <medio>');
  process.exit(1);
}
// El manifest puede tener entradas huérfanas: slugs sincronizados una vez con
// un registro MEDIA distinto (ej. medios de la watchlist que resultaron sin
// sitemap y quedaron con articulos: 0). Si se pasaran tal cual, sync-sitemaps.mjs
// abortaría completo con "Medio desconocido". Se omiten con aviso.
const medios = enManifest.filter((k) => !!MEDIA[k]);
const huerfanos = enManifest.filter((k) => !MEDIA[k]);
if (huerfanos.length > 0) {
  console.warn(`⚠️  ${huerfanos.length} slug(s) del manifest ya no están en el registro MEDIA de sync-sitemaps.mjs; se omiten:`);
  console.warn(`   ${huerfanos.join(', ')}`);
}
if (medios.length === 0) {
  console.error('❌ Ningún medio del manifest está registrado en sync-sitemaps.mjs.');
  process.exit(1);
}

console.log(`Resync incremental de: ${medios.join(', ')}`);
run('sync-sitemaps.mjs', [...medios, '--incremental', '--no-delay', '--stale', stale, ...syncExtra]);
run('sitemaps-index.mjs');
run('sitemaps-backup.mjs');
console.log('\n✅ Resync completo (catálogo, README y backup actualizados).');
