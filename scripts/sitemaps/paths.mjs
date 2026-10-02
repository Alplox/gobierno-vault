/**
 * paths.mjs — Dónde vive cada slug del catálogo en disco.
 *
 * Layout:
 *   sitemaps/websites/<slug>/<AAAA>.jsonl          prensa (MEDIA, sitemaps XML)
 *   sitemaps/youtube_channels/<slug>/<AAAA>.jsonl  canales (CHANNELS, yt-dlp)
 *   sitemaps/.cache/  XML crudo (compartido) · sitemaps/_manifest.json (estado)
 *
 * Todos los scripts resuelven el directorio con `medioDir(slug)`: nunca
 * hardcodear `sitemaps/<slug>`. Todo lo que no está en CHANNELS (prensa y
 * slugs legados del manifest) cae en websites/, que es donde siempre vivió.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHANNELS } from './channels.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SITEMAPS_DIR = join(ROOT, 'sitemaps');
export const WEBSITES_DIR = join(SITEMAPS_DIR, 'websites');
export const CHANNELS_DIR = join(SITEMAPS_DIR, 'youtube_channels');

export function medioDir(slug) {
  return join(CHANNELS[slug] ? CHANNELS_DIR : WEBSITES_DIR, String(slug));
}

export function isChannelSlug(slug) {
  return Boolean(CHANNELS[slug]);
}
