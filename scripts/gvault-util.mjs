import { createHash } from 'node:crypto';
import { brotliDecompressSync } from 'node:zlib';

export const MAGIC = 'GOBIERNO-VAULT-BACKUP v1';

export function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex');
}

/**
 * Parsea un archivo .gvault, valida el hash top-level (integridad pública) y
 * descomprime el payload. Lanza Error si el archivo no es válido o está corrupto.
 * @param {string} text contenido textual del .gvault
 * @returns {{ meta: object, payload: object }}
 */
export function parseBackup(text) {
  const lines = text.split('\n');
  if (lines.length < 2 || lines[0] !== MAGIC) {
    throw new Error('No es un respaldo de Gobierno Vault (cabecera desconocida).');
  }
  const metaIndex = lines.indexOf('===METADATA===');
  if (metaIndex < 0) throw new Error('Formato inválido: no se encontró el marcador ===METADATA===');

  const info = lines.slice(1, metaIndex).join('\n');
  const meta = JSON.parse(lines[metaIndex + 1]);
  const compressed = Buffer.from(lines.slice(metaIndex + 2).join('\n'), 'base64');
  const topSha = sha256(compressed);
  if (topSha !== meta.sha256) {
    throw new Error(`INTEGRIDAD: el hash del archivo no coincide (esperado ${meta.sha256}, obtenido ${topSha}). ¿El archivo está corrupto o fue editado?`);
  }

  const payload = JSON.parse(brotliDecompressSync(compressed).toString('utf8'));
  return { meta, payload, info };
}

/** Devuelve el Buffer original (bytes planos) de una entrada del manifest. */
export function entryBytes(payload, entry) {
  return entry.b64
    ? Buffer.from(payload.files[entry.path], 'base64')
    : Buffer.from(payload.files[entry.path], 'utf8');
}

/**
 * Verifica los checksums SHA-256 de todos los archivos del manifest.
 * @returns {{ results: Array<{path:string, ok:boolean}>, mismatches: Array<object> }}
 */
export function verifyManifest(payload) {
  const results = [];
  const mismatches = [];
  for (const entry of payload.manifest) {
    const ok = sha256(entryBytes(payload, entry)) === entry.sha256;
    results.push({ path: entry.path, ok });
    if (!ok) mismatches.push(entry);
  }
  return { results, mismatches };
}
