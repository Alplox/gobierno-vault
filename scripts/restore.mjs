import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBackup, verifyManifest, entryBytes } from './gvault-util.mjs';

const file = process.argv[2];
const getFlag = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
};
const dest = getFlag('--dest') || process.cwd();
const testOnly = process.argv.includes('--test') || process.argv.includes('--dry-run');

if (!file || process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Restaura un respaldo .gvault a disco.

Uso:  node scripts/restore.mjs <archivo.gvault> [flags]

Flags:
  --dest <ruta>    Directorio destino (default: carpeta actual)
  --test, --dry-run  Verifica integridad sin escribir nada

`);
  process.exit(file ? 0 : 1);
}

try {
  const text = readFileSync(file, 'utf8');
  const { meta, payload } = parseBackup(text);
  const { mismatches } = verifyManifest(payload);

  console.log(`\nRespaldo: ${file}  (${meta.kind}, ${meta.fileCount} archivos, ${meta.created})`);

  if (mismatches.length > 0) {
    for (const m of mismatches) console.error(`  ✗ hash incorrecto: ${m.path}`);
    throw new Error(`${mismatches.length} archivo(s) no pasan la verificación de integridad.`);
  }

  console.log(`  ✔ integridad verificada (${manifestCount(payload)} archivos)`);

  if (testOnly) {
    console.log(`  (modo prueba: no se escribe nada)\n`);
    process.exit(0);
  }

  let written = 0;
  for (const entry of payload.manifest) {
    const out = join(dest, entry.path.split('/').join('\\'));
    mkdirSync(join(out, '..'), { recursive: true });
    writeFileSync(out, entryBytes(payload, entry));
    written++;
  }

  console.log(`  ✔ ${written} archivo(s) restaurado(s) en: ${dest}`);
  console.log('');
  process.exit(0);
} catch (err) {
  console.error(`\n✗ Error al restaurar: ${err.message}`);
  process.exit(1);
}

function manifestCount(payload) {
  return payload.manifest ? payload.manifest.length : 0;
}
