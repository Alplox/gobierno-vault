/**
 * paths.mjs — frontera de escritura local: TODO queda dentro de la raíz del repo.
 *
 * "Fuera del proyecto" NO es el home del usuario ni otro disco: son servicios
 * online independientes del vault (Wayback Machine, archive.today, Internet
 * Archive, Perma.cc). Sus referencias se guardan en `respaldos[]` de las fuentes,
 * no como archivos locales. Localmente solo existen datos transitorios bajo
 * `tmp/` (gitignored), que se borran al terminar la investigación.
 */

import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, '../..');
export const TMP_DIR = join(ROOT, 'tmp');
export const SCRATCH_DIR = join(TMP_DIR, 'research');

function contains(parent, p) {
  const rel = relative(parent, resolve(p));
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel));
}

export const isInsideRoot = (p) => contains(ROOT, p);
export const isInsideTmp = (p) => contains(TMP_DIR, p);
export const isScratch = (p) => contains(SCRATCH_DIR, p);

export function assertInsideRoot(p) {
  if (!isInsideRoot(p)) throw new Error(`Ruta fuera de la raíz del proyecto: ${p}. Toda escritura local queda dentro de ${ROOT}.`);
  return resolve(p);
}

export function assertInsideTmp(p) {
  assertInsideRoot(p);
  if (!isInsideTmp(p)) throw new Error(`Dato generado fuera de tmp/: ${p}. Usa tmp/research/ (transitorio).`);
  return resolve(p);
}

/** Construye una ruta bajo tmp/ y crea su directorio padre. */
export function resolveInTmp(...parts) {
  const p = assertInsideTmp(join(TMP_DIR, ...parts));
  mkdirSync(dirname(p), { recursive: true });
  return p;
}

export function writeTmp(path, content) {
  const p = assertInsideTmp(path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content, 'utf8');
  return p;
}

/** Nombre de archivo transitorio: YYYY-MM-DD-<engine>-<slug>.<ext>. */
export function scratchPath(engine, name, ext = 'md', create = true) {
  const stamp = new Date().toISOString().slice(0, 10);
  const slug = String(name || engine).toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || engine;
  const p = join(SCRATCH_DIR, `${stamp}-${engine}-${slug}.${ext}`);
  assertInsideTmp(p);
  if (create) mkdirSync(SCRATCH_DIR, { recursive: true });
  return p;
}

/** Borra SOLO el contenido de tmp/research; devuelve la cantidad de elementos. */
export function cleanScratch() {
  if (!existsSync(SCRATCH_DIR)) return 0;
  const entries = readdirSync(SCRATCH_DIR, { withFileTypes: true });
  for (const entry of entries) rmSync(join(SCRATCH_DIR, entry.name), { recursive: true, force: true });
  return entries.length;
}
