import { readFileSync } from 'node:fs';
import { parseBackup, verifyManifest } from '../lib/gvault-util.mjs';

// pnpm reenvía el `--` literal (pnpm run verify -- <file>), se filtra para
// que ambos formatos funcionen: con y sin separador.
const args = process.argv.slice(2).filter((a) => a !== '--');
const file = args[0];
if (!file || args.includes('--help') || args.includes('-h')) {
  console.log(`
Verifica la integridad de un respaldo .gvault (uso público, sin contraseña).

Uso:  node scripts/backup/verify.mjs <archivo.gvault>
`);
  process.exit(file ? 0 : 1);
}

try {
  const text = readFileSync(file, 'utf8');
  const { meta, payload } = parseBackup(text);
  const { mismatches } = verifyManifest(payload);

  console.log(`\nRespaldo: ${file}`);
  console.log(`  versión:  ${meta.app ?? meta.version}`);
  console.log(`  fecha:    ${meta.created}`);
  console.log(`  tipo:     ${meta.kind}  (${meta.fileCount} archivos)`);


  if (mismatches.length === 0) {
    console.log(`\n✔ INTEGRIDAD OK — ${payload.manifest.length} archivos verificados, sin discrepancias.`);
    process.exit(0);
  } else {
    console.log(`\n✗ Se detectaron ${mismatches.length} archivos con hash incorrecto:`);
    for (const m of mismatches) console.log(`    - ${m.path}`);
    process.exit(1);
  }
} catch (err) {
  console.error(`\n✗ Error de verificación: ${err.message}`);
  process.exit(1);
}
