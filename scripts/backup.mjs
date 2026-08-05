import { readFileSync, readdirSync, statSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { brotliCompressSync, constants as Z } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { MAGIC, sha256 } from './gvault-util.mjs';

const root = process.cwd();
const APP_VERSION = '0.1.0';

// Directorios / archivos regenerables o irrelevantes: nunca entran al respaldo.
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.git', '.astro', '.wrangler']);
const EXCLUDE_FILES = new Set(['.DS_Store']);

// Diálogo de ayuda
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Respaldo de Gobierno Vault — genera 2 archivos públicos (sin contraseña),
comprimidos con Brotli e íntegros (checksums SHA-256 verificables).

Uso:  node scripts/backup.mjs [flags]

Flags:
  --out <prefijo>   Prefijo de nombre (default: gob-vault-backup-YYYY-MM-DD)
  --shallow         Solo src/content + src/data (mínimo absoluto)
  --no-full         Genera solo la versión .light (sin historial git)
  --no-light        Genera solo la versión .full (con historial git)
  -h, --help        Muestra esta ayuda

Genera:  <prefijo>.light.gvault  → solo el contenido actual (más chico)
         <prefijo>.full.gvault   → contenido + historial git completo (git bundle)

Verificar/restaurar los archivos resultantes:
  node scripts/verify.mjs   <archivo.gvault>
  node scripts/restore.mjs  <archivo.gvault> [--dest <ruta>]
`);
  process.exit(0);
}

function isExcludedRel(rel) {
  const parts = rel.split(/[\\/]/);
  if (parts.some((p) => EXCLUDE_DIRS.has(p))) return true;
  const last = parts[parts.length - 1];
  if (EXCLUDE_FILES.has(last) || last.toLowerCase().endsWith('.gvault')) return true;
  return false;
}

function encodeFile(buf) {
  try {
    const txt = new TextDecoder('utf-8', { fatal: true }).decode(buf);
    return { content: txt, b64: false };
  } catch {
    return { content: buf.toString('base64'), b64: true };
  }
}

const ROOT_FILES = [
  'package.json',
  'package-lock.json',
  'astro.config.mjs',
  'tailwind.config.mjs',
  'tsconfig.json',
  'wrangler.jsonc',
  '.npmrc',
  '.gitattributes',
  '.gitignore',
  'AGENTS.md',
  'README.md',
  'EVENTS_INDEX.md',
  'TAREAS.md',
  'FUENTES_GUBERNAMENTALES.md',
  'TEMPLATE.md',
];

function collectFiles(shallow) {
  const roots = shallow ? ['src/content', 'src/data'] : ['src', ...ROOT_FILES];
  const files = {};
  const manifest = [];
  let plaintextBytes = 0;

  function add(absRel) {
    const abs = join(root, absRel);
    if (!existsSync(abs)) return;
    const st = statSync(abs);
    if (st.isDirectory()) {
      for (const e of readdirSync(abs)) add(join(absRel, e));
      return;
    }
    const buf = readFileSync(abs);
    const { content, b64 } = encodeFile(buf);
    const rp = absRel.split('\\').join('/');
    files[rp] = content;
    manifest.push({ path: rp, sha256: sha256(buf), b64 });
    plaintextBytes += buf.length;
  }

  for (const r of roots) {
    const rr = r.split('/').join('\\');
    if (!isExcludedRel(rr)) add(rr);
  }
  return { files, manifest, plaintextBytes };
}

function createGitBundle() {
  const dir = mkdtempSync(join(tmpdir(), 'gvault-'));
  const bundlePath = join(dir, 'history.bundle');
  const res = spawnSync('git', ['bundle', 'create', bundlePath, '--all'], {
    cwd: root,
    encoding: 'utf8',
  });
  if (res.status !== 0) {
    rmSync(dir, { recursive: true, force: true });
    throw new Error('No se pudo crear el bundle de git: ' + (res.stderr || res.stdout || 'status ' + res.status));
  }
  return { bundlePath, dir };
}

function buildInfo(meta) {
  const mid = '='.repeat(50);
  const bar = mid;
  return [
    bar,
    '  GOBIERNO VAULT - RESPALDO PUBLICO',
    '  Base de conocimiento de eventos de gobierno en Chile',
    bar,
    '',
    'QUE ES ESTE ARCHIVO',
    '-------------------',
    `Snapshot completo (comprimido con Brotli) del proyecto Gobierno Vault,`,
    `un blog sobre eventos de gobierno en Chile (politica, economia,`,
    `justicia, casos de corrupcion/sensibilidad). Es un respaldo offline`,
    `por si el repositorio de GitHub desapareciera o fuera dado de baja.`,
    '',
    'NOMBRE ESPERADO DEL ARCHIVO',
    '---------------------------',
    `  gob-vault-backup-YYYY-MM-DD.${meta.kind}.gvault`,
    '',
    'Si al descargar este archivo en otro sitio (pastebin, Drive, etc.)',
    `perdiste el nombre original, guardalo con el formato de arriba`,
    `usando la letra del 'tipo' de este backup (ver abajo).`,
    '',
    `Tipo de este backup: ${meta.kind}`,
    '  .light  -> solo el contenido actual (markdown + datos + config), el mas chico.',
    '  .full   -> lo anterior + TODO el historial de git (clonable con git clone).',
    '',
    'CODIGO VERIFICADOR (integridad, sin password)',
    '---------------------------------------------',
    `SHA-256 del payload: ${meta.sha256}`,
    '',
    'Para comprobar que el archivo NO esta corrupto ni fue editado,',
    'cualquier persona puede ejecutar esto (solo necesita Node instalado,',
    'no requiere el proyecto):',
    '',
    `  node -e "const{readFileSync}=require('fs'),{createHash}=require('crypto'),{brotliDecompressSync}=require('zlib');const t=readFileSync(process.argv[1],'utf8'),a=t.lastIndexOf('===METADATA==='),n1=t.indexOf('\\n',a),n2=t.indexOf('\\n',n1+1),m=JSON.parse(t.slice(n1+1,n2)),c=Buffer.from(t.slice(n2+1),'base64');if(createHash('sha256').update(c).digest('hex')!==m.sha256){console.error('CORRUPTO, descarta este archivo');process.exit(1)}console.log('OK, integro:',m.kind,m.fileCount,'archivos')" <este-archivo>`,
    '',
    'Si imprime OK es integro y restaurable. Si imprime CORRUPTO,',
    'descartalo y busca otra copia.',
    '',
    'RESTAURAR LOS ARCHIVOS',
    '----------------------',
    'Con el proyecto (Node + npm):',
    '  npm run verify --  <archivo.gvault>',
    '  npm run restore -- <archivo.gvault> --dest <carpeta-destino>',
    '',
    'Sin el proyecto (solo Node): decodifica el payload base64 que va',
    'despues de la linea ===METADATA=== y descomprimelo con brotli',
    '(el contenido interno es un JSON {path: contenido}).',
    '',
    'RECUPERAR TODO EL HISTORIAL GIT (solo tipo .full)',
    '--------------------------------------------------',
    'Al restaurar un .full se extrae ademas el archivo git-history.bundle:',
    '  git clone git-history.bundle',
    'Esto reproduce el repositorio completo con su historia, ramas y tags.',
    '',
    'GENERADO',
    '--------',
    `Fecha:     ${meta.created}`,
    `Version:   ${meta.app  || 'desconocida'}`,
    bar,
  ].join('\n');
}

function serialize(files, manifest, plaintextBytes, kind, gitBundle) {
  const payloadObj = { kind, created: new Date().toISOString(), app: APP_VERSION, files, manifest };
  if (gitBundle) payloadObj.gitBundle = gitBundle;
  const json = JSON.stringify(payloadObj);
  const compressed = brotliCompressSync(Buffer.from(json, 'utf8'), {
    params: { [Z.BROTLI_PARAM_QUALITY]: 11 },
  });
  const metadata = {
    version: 1,
    kind,
    created: payloadObj.created,
    fileCount: manifest.length + (gitBundle ? 1 : 0),
    plaintextBytes,
    compressedBytes: compressed.length,
    sha256: sha256(compressed),
    app: APP_VERSION,
  };
  const info = buildInfo(metadata);
  const text =
    MAGIC + '\n' +
    '===INFORMACION===\n' + info + '\n' +
    '===METADATA===\n' + JSON.stringify(metadata) + '\n' +
    compressed.toString('base64');
  return { text, metadata, info };
}

function writeBackup(kind, text, outPrefix) {
  const filename = `${outPrefix}.${kind}.gvault`;
  writeFileSync(join(root, filename), text, 'utf8');
  return filename;
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

function printResult(filename, meta) {
  const ratio = (meta.plaintextBytes / meta.compressedBytes).toFixed(1);
  console.log(`  ✔ ${filename}`);
  console.log(`      ${formatBytes(meta.plaintextBytes)} → ${formatBytes(meta.compressedBytes)}  (comprimido ${ratio}×, ${meta.fileCount} archivos)`);
}

// ---- main ----
const has = (f) => process.argv.includes(f);
const getFlag = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
};
const shallow = has('--shallow');
const noFull = has('--no-full');
const noLight = has('--no-light');
const outPrefix = getFlag('--out') || `gob-vault-backup-${new Date().toISOString().slice(0, 10)}`;

const { files, manifest, plaintextBytes } = collectFiles(shallow);

console.log('\n🔐 Respaldo de Gobierno Vault');
console.log(`Carpeta: ${root}`);
console.log(`Archivos recogidos: ${manifest.length}`);
console.log(`Tamaño original (sin comprimir): ${formatBytes(plaintextBytes)}${shallow ? '  [modo shallow]' : ''}`);

// Versión light (sin historial)
let lightName = null;
if (!noLight) {
  const { text, metadata } = serialize(files, manifest, plaintextBytes, 'light');
  lightName = writeBackup('light', text, outPrefix);
  printResult(lightName, metadata);
}

// Versión full (con historial git)
let fullName = null;
if (!noFull) {
  const { bundlePath, dir } = createGitBundle();
  const buf = readFileSync(bundlePath);
  const gitBundle = {
    path: 'git-history.bundle',
    b64: buf.toString('base64'),
    sha256: sha256(buf),
    bytes: buf.length,
  };
  const { text, metadata } = serialize(files, manifest, plaintextBytes + buf.length, 'full', gitBundle);
  fullName = writeBackup('full', text, outPrefix);
  rmSync(dir, { recursive: true, force: true });
  printResult(fullName, metadata);
}

console.log('\nListo. Verifica los archivos generados:');
if (lightName) console.log(`  node scripts/verify.mjs  ${lightName}`);
if (fullName) console.log(`  node scripts/verify.mjs  ${fullName}`);
console.log('');

