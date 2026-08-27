import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { brotliCompressSync, constants as Z } from 'node:zlib';
import { MAGIC, sha256 } from './gvault-util.mjs';

const root = process.cwd();
const APP_VERSION = '0.1.0';

// One-liners embebidos en la cabecera INFORMACION de cada .gvault: permiten a
// cualquier persona verificar/restaurar el archivo con solo Node instalado
// (sin el proyecto). La parte `node -e "…"` va seguida de los argumentos
// (nombre del archivo y, para restaurar, la carpeta destino).
// OJO: este one-liner de verificación también vive en src/layouts/Base.astro
// (const GV_VERIFY_CMD, footer del sitio). Mantenerlos IDENTICOS.
const VERIFY_ONELINER =
  `node -e "const{readFileSync}=require('fs'),{createHash}=require('crypto'),{brotliDecompressSync}=require('zlib');const t=readFileSync(process.argv[1],'utf8'),a=t.lastIndexOf('===METADATA==='),n1=t.indexOf('\\n',a),n2=t.indexOf('\\n',n1+1),m=JSON.parse(t.slice(n1+1,n2)),c=Buffer.from(t.slice(n2+1),'base64');if(createHash('sha256').update(c).digest('hex')!==m.sha256){console.error('CORRUPTO, descarta este archivo');process.exit(1)}console.log('OK, integro:',m.kind,m.fileCount,'archivos')"`;

const RESTORE_ONELINER =
  `node -e "const{readFileSync,writeFileSync,mkdirSync}=require('fs'),p=require('path'),{createHash}=require('crypto'),{brotliDecompressSync}=require('zlib');const t=readFileSync(process.argv[1],'utf8'),i=t.lastIndexOf('===METADATA==='),s=t.indexOf('\\n',i)+1,e=t.indexOf('\\n',s),m=JSON.parse(t.slice(s,e)),b=Buffer.from(t.slice(e+1),'base64');if(createHash('sha256').update(b).digest('hex')!==m.sha256)throw Error('CORRUPTO, descarta este archivo');const o=JSON.parse(brotliDecompressSync(b)),d=process.argv[2]||'restaurado';for(const x of o.manifest){const f=p.join(d,x.path);mkdirSync(p.dirname(f),{recursive:true});writeFileSync(f,x.b64?Buffer.from(o.files[x.path],'base64'):o.files[x.path])}console.log('Restaurados',o.manifest.length,'archivos en',d)"`;
// Nota: ambos one-liners usan lastIndexOf('===METADATA===') — la cabecera
// INFORMACION contiene ese texto DENTRO del propio one-liner de verificación,
// así que indexOf() (primera aparición) apuntaría al lugar equivocado.

// Directorios / archivos regenerables o irrelevantes: nunca entran al respaldo.
// 'public' es salida web (incluye la copia del respaldo que genera este script).
const EXCLUDE_DIRS = new Set(['node_modules', 'dist', '.git', '.astro', '.wrangler', 'public']);
const EXCLUDE_FILES = new Set(['.DS_Store']);

// Diálogo de ayuda
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Respaldo de Gobierno Vault — genera UN archivo público (sin contraseña),
comprimido con Brotli e íntegro (checksum SHA-256 verificable).

Uso:  node scripts/backup.mjs [flags]

Flags:
  --out <prefijo>   Prefijo de nombre (default: gob-vault-backup-YYYY-MM-DD)
  --shallow         Solo src/content + src/data (mínimo absoluto)
  -h, --help        Muestra esta ayuda

Genera:  public/backup/<prefijo>.light.gvault  → solo el contenido actual
         (markdown + datos + config, sin dist/) + manifest.json

Verificar/restaurar el archivo resultante:
  node scripts/verify.mjs   public/backup/<archivo.gvault>
  node scripts/restore.mjs  public/backup/<archivo.gvault> [--dest <ruta>]
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
    // ignoreBOM: true para preservar el BOM UTF-8 de archivos como
    // src/scripts/eventListClient.js — sin esto el round-trip pierde 3 bytes
    // y el SHA-256 del manifest no coincide al verificar.
    const txt = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buf);
    return { content: txt, b64: false };
  } catch {
    return { content: buf.toString('base64'), b64: true };
  }
}

const ROOT_FILES = [
  'package.json',
  'pnpm-lock.yaml',
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
  'TAREAS',
  'TEMPLATE.md',
  '.agents',
  '.telegram-scrape/scrape.py',
  '.telegram-scrape/extract.py',
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
    `perdiste el nombre original, guardalo con el formato de arriba.`,
    '',
    `Tipo de este backup: ${meta.kind}  ->  solo el contenido actual`,
    '  (markdown + datos + config), sin historial de git.',
    '',
    'CODIGO VERIFICADOR (integridad, sin password)',
    '---------------------------------------------',
    `SHA-256 del payload: ${meta.sha256}`,
    '',
    'COMO COMPROBAR QUE EL ARCHIVO ESTA BIEN (5 pasos)',
    '------------------------------------------------',
    'Necesitas Node.js, que es gratis y seguro. Si no lo tienes instalado:',
    '  1) Abre https://nodejs.org y pulsa el boton verde "LTS".',
    '  2) Instalalo aceptando los valores por defecto (Siguiente, Siguiente...).',
    '  3) Si tenias una ventana de terminal abierta, cierrala y abre una nueva.',
    '',
    'Luego, para verificar este respaldo:',
    '  4) Abre una terminal: en Windows busca "PowerShell"; en Mac o Linux abre',
    '     la aplicacion "Terminal".',
    '  5) Escribe  cd  + un espacio + la carpeta donde guardaste este archivo',
    '     (ejemplo:  cd Descargas ) y pulsa Enter. Despues copia y pega esta',
    '     linea completa, cambia NOMBRE por el nombre real del archivo, y pulsa',
    '     Enter:',
    '',
    `  ${VERIFY_ONELINER} NOMBRE.gvault`,
    '',
    'Si aparece  OK, integro  el archivo es correcto y completo. Si aparece',
    'CORRUPTO, descartalo y busca otra copia.',
    '',
    'COMO RECUPERAR (RESTAURAR) LOS ARCHIVOS DEL RESPALDO',
    '---------------------------------------------------',
    'Opcion A - si tienes el proyecto (Node + pnpm):',
    '  pnpm run verify --  <archivo.gvault>',
    '  pnpm run restore -- <archivo.gvault> --dest <carpeta-destino>',
    '',
    'Opcion B - sin el proyecto (solo Node), con UN comando. Abre la terminal',
    '(como en los pasos 4-5 de arriba), pega esta linea completa cambiando',
    'NOMBRE por el archivo y DESTINO por la carpeta donde quieres los archivos,',
    'y pulsa Enter:',
    '',
    `  ${RESTORE_ONELINER} NOMBRE.gvault DESTINO`,
    '',
    'Si el nombre del archivo o la carpeta tienen espacios, escribelos entre',
    'comillas (ej:  "Mi Copia.gvault"  o  "C:/Users/Mi Usuario/Mis Respaldos").',
    '',
    'Eso crea la carpeta DESTINO con todos los archivos del respaldo (eventos,',
    'datos y config) listos para abrir.',
    '',
    'GENERADO',
    '--------',
    `Fecha:     ${meta.created}`,
    `Version:   ${meta.app  || 'desconocida'}`,
    bar,
  ].join('\n');
}

function serialize(files, manifest, plaintextBytes, kind) {
  const payloadObj = { kind, created: new Date().toISOString(), app: APP_VERSION, files, manifest };
  const json = JSON.stringify(payloadObj);
  const compressed = brotliCompressSync(Buffer.from(json, 'utf8'), {
    params: { [Z.BROTLI_PARAM_QUALITY]: 11 },
  });
  const metadata = {
    version: 1,
    kind,
    created: payloadObj.created,
    fileCount: manifest.length,
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

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(2)} MB`;
}

// ---- main ----
const has = (f) => process.argv.includes(f);
const getFlag = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : undefined;
};
const shallow = has('--shallow');
const outPrefix = getFlag('--out') || `gob-vault-backup-${new Date().toISOString().slice(0, 10)}`;

const { files, manifest, plaintextBytes } = collectFiles(shallow);

console.log('\n🔐 Respaldo de Gobierno Vault (solo light)');
console.log(`Carpeta: ${root}`);
console.log(`Archivos recogidos: ${manifest.length}`);
console.log(`Tamaño original (sin comprimir): ${formatBytes(plaintextBytes)}${shallow ? '  [modo shallow]' : ''}`);

const { text, metadata } = serialize(files, manifest, plaintextBytes, 'light');
// basename: el nombre del archivo debe ser un nombre plano (no rutas), por si
// `--out` incluyó un prefijo con separadores.
const baseName = basename(`${outPrefix}.light.gvault`);

// Ubicacion canonica: public/backup/ (SE COMMITEA). El footer del sitio la sirve
// en /backup/ sin CPU extra en build y GitHub la expone con un solo clic.
const webDir = join(root, 'public', 'backup');
mkdirSync(webDir, { recursive: true });
// limpiar respaldos viejos (nombres versionados de corridas anteriores);
// solo archivos, nunca subdirectorios (guard contra rm no recursivo)
for (const f of readdirSync(webDir)) {
  const fp = join(webDir, f);
  if (!statSync(fp).isDirectory() && f.endsWith('.gvault')) rmSync(fp, { force: true });
}
const webFile = join(webDir, baseName);
writeFileSync(webFile, text, 'utf8');
const bytes = Buffer.byteLength(text, 'utf8');
const fileSha = sha256(Buffer.from(text, 'utf8'));
const manifestWeb = {
  archivo: baseName,
  url: `/backup/${baseName}`,
  tamanoBytes: bytes,
  tamano: formatBytes(bytes),
  sha256: fileSha,
  creado: metadata.created,
  tipo: metadata.kind,
};
writeFileSync(join(webDir, 'manifest.json'), JSON.stringify(manifestWeb, null, 2) + '\n', 'utf8');

console.log('  ✔ public/backup/' + baseName);
console.log(`      ${formatBytes(metadata.plaintextBytes)} → ${formatBytes(metadata.compressedBytes)}  (comprimido ${(metadata.plaintextBytes / metadata.compressedBytes).toFixed(1)}×, ${metadata.fileCount} archivos)`);
console.log('  ✔ public/backup/manifest.json');
console.log('      SHA-256 del archivo: ' + fileSha + '  (' + formatBytes(bytes) + ')');

console.log('\nListo. Verifica el archivo generado:');
console.log(`  node scripts/verify.mjs  public/backup/${baseName}`);
console.log('');
