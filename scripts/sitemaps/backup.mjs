#!/usr/bin/env node
/**
 * sitemaps-backup.mjs — Empaqueta el catálogo `sitemaps/` en un solo archivo
 * comprimido `sitemaps/sitemaps.gvault`, con el mismo formato de los backups
 * del repo (Brotli + checksums SHA-256 + manifest por archivo; ver
 * `scripts/gvault-util.mjs` para el formato compartido).
 *
 * Esto permite: (1) descargar TODO el catálogo de artículos de un solo clic,
 * (2) regenerar `sitemaps/` desde el .gvault sin re-sincronizar (ver restore),
 * (3) compartir una string compacta verificable (integridad sin secreto).
 *
 * Formato del payload: v3 (2026-08-11) = header JSON pequeño (índice de
 * offsets por archivo + manifest SHA-256) + blob binario con los archivos
 * concatenados. Motivo: v2 serializaba los archivos como base64 dentro de un
 * único JSON.stringify y con el catálogo creciendo (~500MB+ de JSONL) ese
 * string superaba el límite de V8 (`RangeError: Invalid string length`).
 * `--restore` sigue leyendo los .gvault v2 (base64) existentes.
 *
 * Uso:
 *   pnpm run sitemaps-backup [--out <prefijo>]   # default sitemaps/sitemaps.gvault
 *   pnpm run sitemaps-backup --restore           # regenera sitemaps/ desde el .gvault
 *
 * Flags:
 *   --src <dir>     Carpeta a empaquetar (default sitemaps/; útil para subsets)
 *   --out <path>    Archivo de salida del .gvault (default sitemaps/sitemaps.gvault)
 *   --quality <n>   Calidad Brotli 1-11 (default 7; 11 es lento en 300MB+)
 *   --compact       (default) Transforma los JSONL a un formato compacto lossless
 *                   antes de comprimir (guarda ~3x menos; restore regenera el
 *                   JSONL idéntico, verificado por SHA-256).
 *   --no-compact    Desactiva la transformación (guardar JSONL crudo, como v1).
 *   --bin           (default) Contenedor binario: el payload Brotli se escribe
 *                   como bytes crudos tras la cabecera (sin base64, ~25% menos).
 *   --text          Contenedor texto (base64) — formato v1, legible con cat.
 *   --chunk-size <MB> Parte el .gvault en trozos de ~<MB> (default 50, por el
 *                   límite blando de GitHub). Genera `<out>.part1, .part2, ...`
 *                   (cada parte con cabecera completa + fracción del payload;
 *                   `meta.chunks` = N). El restore los une automáticamente;
 *                   `--join` regenera el .gvault único desde las partes.
 *   --restore [src] Regenera sitemaps/ desde el .gvault (o de `src`; si está
 *                   partido, une las partes automáticamente)
 *   --dest <dir>    Carpeta destino del restore (default sitemaps/; útil para
 *                   validar en un directorio temporal sin pisar los datos)
 *   --join [src]    Une las partes `.partN` de `src` (default out) en un .gvault
 *                   único (mismo nombre sin `.partN`).
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, isAbsolute, normalize, relative, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, brotliDecompressSync, constants as Z } from 'node:zlib';
import { MAGIC, sha256 } from '../lib/gvault-util.mjs';

// Guard: solo ejecuta main() cuando se corre directo (permite importar las
// funciones de compactación desde tests/otros scripts).
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
    process.argv[1].replace(/\\/g, '/').toLowerCase();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');
const SITEMAPS_DIR = join(ROOT, 'sitemaps');
const DEFAULT_OUT = join(SITEMAPS_DIR, 'sitemaps.gvault');

const EXCLUDE = new Set(['.cache', 'sitemaps.gvault', 'sitemaps.gvault.part1', 'sitemaps.gvault.part2', 'sitemaps.gvault.part3', 'sitemaps.gvault.part4', 'sitemaps.gvault.part5', 'sitemaps.gvault.part6', 'sitemaps.gvault.part7', 'sitemaps.gvault.part8', 'sitemaps.gvault.part9', 'sitemaps.gvault.part10', 'sitemaps.gvault.part11', 'sitemaps.gvault.part12', 'sitemaps.gvault.part13', 'sitemaps.gvault.part14', 'sitemaps.gvault.part15', 'sitemaps.gvault.part16']);

// ¿Es un nombre de parte del snapshot (sitemaps.gvault.partN)? Se excluye del
// empaquetado para que un backup no se empaquete a sí mismo.
function isChunkPart(name) {
  return /^sitemaps\.gvault\.part\d+$/.test(name);
}

// Marcador de modo binario en el METADATA: el payload Brotli va como bytes
// crudos (no base64) tras la línea del JSON de metadata.
const BIN_MARKER = 'GV-BIN';

// Lee el .gvault y retorna { meta, compressed } soportando ambos contenedores.
// El METADATA siempre vive en los primeros KB, así que solo se convierte a
// string la cabecera (latin1: 1 byte = 1 char → los índices coinciden con los
// byte-offsets del buffer).
function readGvault(path) {
  const buf = readFileSync(path);
  const head = buf.subarray(0, Math.min(buf.length, 64 * 1024)).toString('latin1');
  // lastIndexOf: la palabra '===METADATA===' aparece también en el bloque
  // INFORMACION; el encabezado real es el último.
  const metaIdx = head.lastIndexOf('===METADATA===');
  if (metaIdx < 0) throw new Error('Formato inválido: falta ===METADATA===');
  const nl1 = head.indexOf('\n', metaIdx);
  const nl2 = head.indexOf('\n', nl1 + 1);
  if (nl2 < 0) throw new Error('Formato inválido: METADATA truncado.');
  const metaLine = buf.subarray(nl1 + 1, nl2).toString('utf8');
  const meta = JSON.parse(metaLine);
  let compressed;
  if (meta.enc === BIN_MARKER) {
    // Cabecera en UTF-8 hasta el \n tras METADATA; el resto son bytes crudos.
    compressed = buf.subarray(nl2 + 1);
  } else {
    compressed = Buffer.from(buf.subarray(nl2 + 1).toString('utf8').trim(), 'base64');
  }
  if (sha256(compressed) !== meta.sha256) {
    throw new Error('INTEGRIDAD: el hash del archivo no coincide. ¿Está corrupto o fue editado?');
  }
  return { meta, compressed };
}

// Cabecera texto de una parte: MAGIC + INFO + METADATA.
function gvaultHeader(info, meta) {
  return MAGIC + '\n' +
    '===INFORMACION===\n' + info + '\n' +
    '===METADATA===\n' + JSON.stringify(meta) + '\n';
}

// Extrae la sección INFORMACION de un .gvault (texto plano legible).
function extractInfo(path) {
  const buf = readFileSync(path);
  const head = buf.subarray(0, Math.min(buf.length, 64 * 1024)).toString('latin1');
  const start = head.indexOf('===INFORMACION===');
  const end = head.indexOf('===METADATA===');
  if (start < 0 || end < 0 || end <= start) return '';
  return buf.subarray(start + '===INFORMACION==='.length + 1, end).toString('utf8').replace(/\n$/, '');
}

// Escribe el .gvault: cabecera texto + payload Brotli (binario o base64).
// Con chunkSizeMB > 0 parte el payload en `<out>.part1, .part2, ...` (cada
// parte con cabecera completa + fracción). meta.chunks indica el total y el
// restore los une automáticamente.
function writeGvault(outPath, info, meta, compressed, binary, chunkSizeMB = 0) {
  mkdirSync(dirname(outPath), { recursive: true });
  if (chunkSizeMB > 0) {
    const budget = Math.floor(chunkSizeMB * 1024 * 1024);
    // En binario se parte el buffer; en texto se parte la string base64
    // (los trozos base64 no son decodificables por separado, solo unidos).
    const b64 = binary ? null : compressed.toString('base64');
    const payloadLen = binary ? compressed.length : b64.length;
    const headBudget = 64 * 1024;
    const n = Math.max(1, Math.ceil(payloadLen / Math.max(1, budget - headBudget)));
    const sliceLen = Math.ceil(payloadLen / n);
    const metaPart = { ...meta, chunks: n, chunkSizeMB };
    const header = gvaultHeader(info, metaPart);
    for (let i = 0; i < n; i++) {
      const from = i * sliceLen;
      const to = Math.min((i + 1) * sliceLen, payloadLen);
      const path = `${outPath}.part${i + 1}`;
      if (binary) {
        writeFileSync(path, Buffer.concat([Buffer.from(header, 'utf8'), compressed.subarray(from, to)]));
      } else {
        writeFileSync(path, header + b64.slice(from, to), 'utf8');
      }
    }
    console.log(`   → ${n} parte(s) (~${chunkSizeMB} MB c/u: ${displayPath(outPath)}.part1 … .part${n})`);
    return;
  }
  const header = gvaultHeader(info, meta);
  if (binary) {
    writeFileSync(outPath, Buffer.concat([Buffer.from(header, 'utf8'), compressed]));
  } else {
    writeFileSync(outPath, header + compressed.toString('base64'), 'utf8');
  }
}

// Lee un .gvault (único o parte). Retorna { meta, compressed, payloadOffset }.
// Para texto, `compressed` es el Buffer binario del payload ya base64-decoded
// — pero en modo partido los trozos de texto NO se pueden decodear por
// separado (base64 se corta en el medio de un grupo de 4). Por eso en modo
// texto partido el restore une primero los trozos de TEXTO y luego decodifica.
function readPartPayload(path) {
  const buf = readFileSync(path);
  const head = buf.subarray(0, Math.min(buf.length, 64 * 1024)).toString('latin1');
  const metaIdx = head.lastIndexOf('===METADATA===');
  if (metaIdx < 0) throw new Error(`Formato inválido en ${path}: falta ===METADATA===`);
  const nl1 = head.indexOf('\n', metaIdx);
  const nl2 = head.indexOf('\n', nl1 + 1);
  if (nl2 < 0) throw new Error(`Formato inválido en ${path}: METADATA truncado.`);
  const meta = JSON.parse(buf.subarray(nl1 + 1, nl2).toString('utf8'));
  return { meta, body: buf.subarray(nl2 + 1), text: meta.enc === BIN_MARKER ? null : buf.subarray(nl2 + 1).toString('utf8') };
}

// Une las partes `.partN` de un .gvault partido. Retorna { meta, compressed }.
function joinChunks(basePath, binary) {
  const part1 = readPartPayload(basePath + '.part1');
  const meta = part1.meta;
  const n = meta.chunks ?? 0;
  if (!n) throw new Error(`No es un .gvault partido (sin meta.chunks): ${basePath}`);
  if (binary) {
    const parts = [];
    for (let i = 1; i <= n; i++) {
      const p = readPartPayload(basePath + '.part' + i);
      if (p.meta.enc !== BIN_MARKER) throw new Error(`Mezcla de contenedores: ${basePath}.part${i}`);
      parts.push(p.body);
    }
    const compressed = Buffer.concat(parts);
    if (sha256(compressed) !== meta.sha256) {
      throw new Error('INTEGRIDAD: el payload unido no coincide con su checksum.');
    }
    return { meta, compressed };
  }
  let b64 = '';
  for (let i = 1; i <= n; i++) {
    const p = readPartPayload(basePath + '.part' + i);
    if (p.text === null) throw new Error(`Mezcla de contenedores: ${basePath}.part${i}`);
    b64 += p.text.trim();
  }
  const compressed = Buffer.from(b64, 'base64');
  if (sha256(compressed) !== meta.sha256) {
    throw new Error('INTEGRIDAD: el payload unido no coincide con su checksum.');
  }
  return { meta, compressed };
}

// Resuelve rutas de flags: respeta rutas absolutas, resto relativo a ROOT.
function resolvePath(p) {
  return isAbsolute(p) ? p : join(ROOT, p);
}

// Ruta PORTABLE para mostrar dentro del .gvault (cabecera INFORMACION). Nunca
// una ruta absoluta local: eso filtraría el nombre de usuario y la ruta de
// disco de quien generó el backup. Si el path cae dentro del repo se muestra
// relativo al repo (con /); si no, solo el nombre del archivo.
function displayPath(p) {
  const rel = relative(ROOT, p);
  if (rel && !rel.startsWith('..') && !isAbsolute(rel)) return rel.split('\\').join('/');
  return basename(p);
}

// Asegura que `dest` quede dentro de `base` (previene traversal con `..`).
function assertInside(base, dest) {
  const rel = relative(base, dest);
  if (rel.startsWith('..') || isAbsolute(rel)) {
    throw new Error(`Ruta fuera del destino permitido: ${dest}`);
  }
}

// Recoge los archivos de la carpeta. Con `compact`, los .jsonl se transforman
// a formato compacto ANTES de comprimir; el resto de archivos (README, manifest)
// se guardan tal cual. Retorna los archivos como BUFFERS (no base64) más un
// índice con la posición de cada uno en el blob final, y el manifest con el
// SHA-256 del JSONL ORIGINAL (para verificar la reconstrucción byte-idéntica).
//
// Motivo del diseño binario (v3): el catálogo completo pesa cientos de MB en
// JSONL; serializarlo como base64 dentro de un único JSON.stringify superaba el
// límite de string de V8 (~536M caracteres) con `RangeError: Invalid string
// length`. El payload ahora es un header JSON pequeño + blob de bytes crudos.
function collectFiles(dir, compact) {
  const files = [];
  const index = [];
  const manifest = [];
  const compactPaths = [];
  let offset = 0;
  function walk(abs, rel) {
    for (const name of readdirSync(abs)) {
      if (EXCLUDE.has(name) || isChunkPart(name)) continue;
      const p = join(abs, name);
      const r = rel ? `${rel}/${name}` : name;
      if (statSync(p).isDirectory()) {
        walk(p, r);
      } else {
        const buf = readFileSync(p);
        const isJsonl = r.endsWith('.jsonl');
        const compacted = compact && isJsonl ? compactEncodeFile(buf) : null;
        const stored = compacted ? compacted.buf : buf;
        files.push(stored);
        index.push({ path: r, off: offset, len: stored.length, compact: !!compacted });
        if (compacted) compactPaths.push(r);
        manifest.push({ path: r, sha256: sha256(buf), b64: false, bytes: buf.length });
        offset += stored.length;
      }
    }
  }
  walk(dir, '');
  return { files, index, manifest, compactPaths };
}

// ---------------------------------------------------------------------------
// Formato compacto (v2): reduce el JSONL a ~50% de su tamaño antes de Brotli
// ---------------------------------------------------------------------------
// Cada línea JSONL {u,d,t,s} se transforma a una línea tab-separada:
//   tipo<TAB>path<TAB>fecha[<TAB>titulo]
// donde `path` es la URL sin esquema ni dominio (dominio se guarda una vez por
// archivo en la cabecera) y el título se omite cuando es derivable del slug
// (misma regla de titleFromSlug en sitemaps/sync.mjs).
//
// Tipos:
//   s  → entrada slug con título idéntico al derivado del slug; el título NO
//        se guarda (se reconstruye al restaurar).
//   t  → entrada slug con título NO derivable; el título se guarda.
//   n  → entrada news con título; el título se guarda tal cual.
//   x  → entrada SIN título ni tipo (solo u+d); se guarda sin más.
//
// Cabecera por archivo:
//   #GVCOMPACT
//   base-key<TAB>url-base  (una por esquema+host distinto, ej. https://www.x / http://tv.x)
//
// El restore reconstruye el JSONL byte-idéntico (verificado por SHA-256).
const COMPACT_MAGIC = '#GVCOMPACT';

// Título derivado de un slug — debe replicar EXACTAmente `titleFromSlug` de
// sitemaps/sync.mjs (excepto el filtro ENGLISH_NOISE, que solo se aplica al
// crear entradas, no al reconstruirlas).
function titleFromSlugPath(lastSegment) {
  const withoutExt = String(lastSegment || '').replace(/\.s?html?$/i, '').replace(/\.\d+$/, '');
  const words = withoutExt
    .split(/[-_]+/)
    .filter((w) => !/^\d{4,}$/.test(w) && !/^\d{1,2}\/\d{1,2}$/.test(w))
    .join(' ');
  if (words.length < 4) return null;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Codifica un JSONL completo a texto compacto. Retorna { text, baseMap }.
function compactEncode(jsonlText) {
  const lines = [];
  const baseMap = new Map();
  const baseId = (base) => {
    const key = base.replace(/[^a-z0-9]/gi, '_');
    if (!baseMap.has(key)) baseMap.set(key, base);
    return key;
  };
  for (const line of String(jsonlText).split('\n')) {
    if (!line.trim()) continue;
    let e;
    try { e = JSON.parse(line); } catch { continue; }
    const u = e.u;
    if (typeof u !== 'string') continue;
    const proto = u.indexOf('//');
    let path = u;
    let hasPath = false;
    let baseKey = null;
    if (proto >= 0) {
      const slash = u.indexOf('/', proto + 2);
      if (slash >= 0) {
        const p = u.slice(slash + 1);
        if (p.length > 0) {
          path = p;
          hasPath = true;
          baseKey = baseId(u.slice(0, slash + 1));
        }
      }
    }
    const d = e.d ?? '';
    const t = typeof e.t === 'string' ? e.t : '';
    // x: sin título (solo u+d) o sin path (dominio raíz): se guarda la URL
    // completa tal cual, sin normalizar ni añadir campos que no existían.
    if (typeof e.t !== 'string' || !hasPath) {
      lines.push('x\t' + u + '\t' + d);
      continue;
    }
    const last = path.split('/').pop() || '';
    if (e.s === 'slug' && last) {
      if (titleFromSlugPath(last) === t) {
        lines.push('s\t' + baseKey + '\t' + path + '\t' + d);
      } else {
        lines.push('t\t' + baseKey + '\t' + path + '\t' + d + '\t' + t);
      }
    } else {
      // news con título, o entrada con título pero sin tipo s (ej. cooperativa).
      // El token preserva el campo s original ('news', ausente, o cualquier
      // valor raro) para que el restore sea byte-idéntico.
      const sToken = e.s === undefined ? '-' : (e.s === 'news' ? 'n' : 'b' + Buffer.from(String(e.s)).toString('base64'));
      lines.push('n\t' + baseKey + '\t' + path + '\t' + d + '\t' + sToken + '\t' + t);
    }
  }
  const header = [COMPACT_MAGIC];
  for (const [key, base] of baseMap) header.push(key + '\t' + base);
  header.push('#'); // sentinela: fin de cabecera
  return { text: header.join('\n') + '\n' + lines.join('\n'), baseMap };
}

// Decodifica texto compacto a JSONL original (byte-idéntico).
function compactDecode(text) {
  const raw = String(text);
  const nl = raw.indexOf('\n');
  const magic = raw.slice(0, nl);
  if (magic !== COMPACT_MAGIC) {
    throw new Error('No es un archivo compacto (falta cabecera ' + COMPACT_MAGIC + ')');
  }
  // Cabecera: línea base-key<TAB>url-base por esquema+host distinto, terminada
  // por la línea sentinela '#'.
  const bases = new Map();
  let cursor = nl + 1;
  let body = '';
  for (;;) {
    const eol = raw.indexOf('\n', cursor);
    if (eol < 0) { body = raw.slice(cursor); break; }
    const line = raw.slice(cursor, eol);
    if (line === '#') { body = raw.slice(eol + 1); break; }
    const tab = line.indexOf('\t');
    bases.set(line.slice(0, tab), line.slice(tab + 1));
    cursor = eol + 1;
  }
  const out = [];
  for (const line of body.split('\n')) {
    if (!line) continue;
    const parts = line.split('\t');
    const kind = parts[0];
    if (kind === 'x') {
      // Entrada original sin t/s: formato x<TAB>url-completa<TAB>fecha
      const urlX = parts[1] ?? '';
      const dX = parts[2] ?? '';
      out.push('{"u":' + JSON.stringify(urlX) + ',"d":' + JSON.stringify(dX) + '}');
      continue;
    }
    const base = bases.get(parts[1]) ?? '';
    const path = parts[2] ?? '';
    const d = parts[3] ?? '';
    let t, s;
    if (kind === 's') {
      s = 'slug';
      t = titleFromSlugPath(path.split('/').pop() || '') ?? '';
      out.push('{"u":' + JSON.stringify(base + path) + ',"d":' + JSON.stringify(d) + ',"t":' + JSON.stringify(t) + ',"s":' + JSON.stringify(s) + '}');
      continue;
    }
    if (kind === 't') {
      t = parts.slice(4).join('\t');
      out.push('{"u":' + JSON.stringify(base + path) + ',"d":' + JSON.stringify(d) + ',"t":' + JSON.stringify(t) + ',"s":' + JSON.stringify('slug') + '}');
      continue;
    }
    // kind === 'n': el 5º campo es el token del campo s original
    const sTok = parts[4] ?? 'n';
    t = parts.slice(5).join('\t');
    const url = base + path;
    if (sTok === '-') {
      out.push('{"u":' + JSON.stringify(url) + ',"d":' + JSON.stringify(d) + ',"t":' + JSON.stringify(t) + '}');
    } else if (sTok === 'n') {
      out.push('{"u":' + JSON.stringify(url) + ',"d":' + JSON.stringify(d) + ',"t":' + JSON.stringify(t) + ',"s":' + JSON.stringify('news') + '}');
    } else if (sTok.startsWith('b')) {
      out.push('{"u":' + JSON.stringify(url) + ',"d":' + JSON.stringify(d) + ',"t":' + JSON.stringify(t) + ',"s":' + JSON.stringify(Buffer.from(sTok.slice(1), 'base64').toString('utf8')) + '}');
    } else {
      out.push('{"u":' + JSON.stringify(url) + ',"d":' + JSON.stringify(d) + ',"t":' + JSON.stringify(t) + ',"s":' + JSON.stringify(sTok) + '}');
    }
  }
  return out.join('\n') + '\n';
}

// Para que el restore sea byte-idéntico hay que reproducir el salto final
// exacto del JSONL original. Se registra con un tag al final del texto
// compacto: presente = el original terminaba en \n, ausente = no.
const EOL_TAG = '\n#GVNL';

function compactEncodeFile(buf) {
  const jsonl = buf.toString('utf8');
  const { text } = compactEncode(jsonl);
  const tagged = jsonl.endsWith('\n') ? text + EOL_TAG : text;
  return { buf: Buffer.from(tagged, 'utf8'), compact: true };
}

function compactDecodeFile(buf) {
  let text = buf.toString('utf8');
  let endsNl = true;
  if (text.endsWith(EOL_TAG)) {
    text = text.slice(0, -EOL_TAG.length);
  } else {
    endsNl = text.endsWith('\n');
  }
  const jsonl = compactDecode(text);
  return Buffer.from(endsNl ? jsonl : jsonl.replace(/\n$/, ''), 'utf8');
}

function buildPayload(srcDir = SITEMAPS_DIR, quality = 7, compact = true) {
  const { files, index, manifest, compactPaths } = collectFiles(srcDir, compact);
  // Header JSON pequeño (índice + manifest) + blob binario con todos los
  // archivos concatenados. El header nunca crece con el contenido: solo el
  // blob lo hace, y los Buffers de Node no tienen el límite de string de V8.
  const header = Buffer.from(JSON.stringify({
    kind: 'sitemaps',
    version: 3,
    compact: true,
    compactPaths,
    created: new Date().toISOString(),
    files: index,
    manifest,
  }) + '\n', 'utf8');
  const payload = Buffer.concat([header, ...files]);
  const compressed = brotliCompressSync(payload, {
    params: { [Z.BROTLI_PARAM_QUALITY]: quality },
  });
  const rawBytes = manifest.reduce((acc, e) => acc + e.bytes, 0);
  const meta = {
    version: 3,
    kind: 'sitemaps',
    created: new Date().toISOString(),
    fileCount: manifest.length,
    plaintextBytes: rawBytes,
    compressedBytes: compressed.length,
    sha256: sha256(compressed),
  };
  return { compressed, meta };
}

function restoreFromGvault(path, destDir = SITEMAPS_DIR) {
  // Detecta si está partido (existe `<path>.part1`) y une las partes.
  let meta, compressed;
  if (existsSync(`${path}.part1`)) {
    const joined = joinChunks(path, !readPartPayload(`${path}.part1`).text);
    meta = joined.meta;
    compressed = joined.compressed;
  } else {
    const r = readGvault(path);
    meta = r.meta;
    compressed = r.compressed;
  }
  const payloadBuf = brotliDecompressSync(compressed);
  // Formato v3 (binario): header JSON en la primera línea, luego el blob de
  // bytes crudos. El separador es el primer '\n' — el header es JSON puro sin
  // saltos de línea, así que indexOf encuentra el límite exacto.
  const nl = payloadBuf.indexOf(0x0a);
  let header = null;
  let blob = null;
  if (nl > 0) {
    const candidate = JSON.parse(payloadBuf.subarray(0, nl).toString('utf8'));
    if (candidate && candidate.kind === 'sitemaps' && candidate.version === 3 && Array.isArray(candidate.files)) {
      header = candidate;
      blob = payloadBuf.subarray(nl + 1);
    }
  }
  if (header) {
    // v3: cada archivo se ubica por offset/length dentro del blob binario.
    const compactSet = new Set(header.compactPaths ?? []);
    for (const entry of header.manifest) {
      const f = header.files.find((x) => x.path === entry.path);
      if (!f) throw new Error(`INTEGRIDAD: ${entry.path} falta en el índice del payload.`);
      const stored = blob.subarray(f.off, f.off + f.len);
      const buf = f.compact ? compactDecodeFile(stored) : stored;
      if (sha256(buf) !== entry.sha256) {
        throw new Error(`INTEGRIDAD: ${entry.path} no coincide con su checksum.`);
      }
      const dest = join(destDir, normalize(entry.path));
      assertInside(destDir, dest);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
    }
    console.log(`✔ Restaurado ${header.manifest.length} archivo(s) desde ${path}` +
      (meta.chunks ? ` (${meta.chunks} partes unidas)` : '') +
      (compactSet.size ? ` (${compactSet.size} reconstruidos del formato compacto)` : ''));
    return;
  }
  // v2 (legacy): payload JSON con archivos base64.
  const payload = JSON.parse(payloadBuf.toString('utf8'));
  if (payload.kind !== 'sitemaps') {
    throw new Error(`Este .gvault no es un catálogo de sitemaps (kind: ${payload.kind ?? 'desconocido'}).`);
  }
  const compactSet = new Set(payload.compactPaths ?? []);
  for (const entry of payload.manifest) {
    const stored = Buffer.from(payload.files[entry.path], 'base64');
    const buf = compactSet.has(entry.path) ? compactDecodeFile(stored) : stored;
    if (sha256(buf) !== entry.sha256) {
      throw new Error(`INTEGRIDAD: ${entry.path} no coincide con su checksum.`);
    }
    const dest = join(destDir, normalize(entry.path));
    assertInside(destDir, dest);
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, buf);
  }
  console.log(`✔ Restaurado ${payload.manifest.length} archivo(s) desde ${path}` +
    (meta.chunks ? ` (${meta.chunks} partes unidas)` : '') +
    (compactSet.size ? ` (${compactSet.size} reconstruidos del formato compacto)` : ''));
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--restore')) {
    const idx = args.indexOf('--restore');
    const src = args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : DEFAULT_OUT;
    const destIdx = args.indexOf('--dest');
    const destDir = destIdx >= 0 && args[destIdx + 1]
      ? resolvePath(args[destIdx + 1])
      : SITEMAPS_DIR;
    if (!existsSync(src) && !existsSync(src + '.part1')) {
      console.error(`❌ No existe ${src}. Genera primero con: pnpm run sitemaps-backup`);
      process.exit(1);
    }
    restoreFromGvault(src, destDir);
    return;
  }

  if (args.includes('--join')) {
    const idx = args.indexOf('--join');
    const base = args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : DEFAULT_OUT;
    if (!existsSync(base + '.part1')) {
      console.error(`❌ No hay partes en ${base}.part1. Genera con: pnpm run sitemaps-backup --chunk-size <MB>`);
      process.exit(1);
    }
    const joined = joinChunks(base, !readPartPayload(base + '.part1').text);
    // El .gvault unido es un archivo único: ya no está partido. Se conserva la
    // sección INFORMACION original (instrucciones legibles) y se limpian los
    // campos de chunking del metadata.
    const meta = { ...joined.meta };
    const n = meta.chunks;
    delete meta.chunks;
    delete meta.chunkSizeMB;
    const info = extractInfo(base + '.part1');
    const header = gvaultHeader(info, meta);
    const binary = meta.enc === BIN_MARKER;
    if (binary) {
      writeFileSync(base, Buffer.concat([Buffer.from(header, 'utf8'), joined.compressed]));
    } else {
      writeFileSync(base, header + joined.compressed.toString('base64'), 'utf8');
    }
    console.log(`✔ Unidas ${n} partes → ${base} (${meta.sha256.slice(0, 12)}…)`);
    return;
  }

  const srcIdx = args.indexOf('--src');
  const srcDir = srcIdx >= 0 && args[srcIdx + 1]
    ? resolvePath(args[srcIdx + 1])
    : SITEMAPS_DIR;
  const outIdx = args.indexOf('--out');
  const outPath = outIdx >= 0 && args[outIdx + 1] ? resolvePath(args[outIdx + 1]) : DEFAULT_OUT;
  const qIdx = args.indexOf('--quality');
  const quality = Math.min(11, Math.max(1, qIdx >= 0 ? (parseInt(args[qIdx + 1], 10) || 7) : 7));
  const compact = !args.includes('--no-compact');
  const binary = !args.includes('--text');
  const csIdx = args.indexOf('--chunk-size');
  const chunkSizeMB = csIdx >= 0 && args[csIdx + 1] ? (parseFloat(args[csIdx + 1]) || 0) : 0;

  if (!existsSync(srcDir)) {
    console.error(`❌ No existe la carpeta ${srcDir}. Sincroniza primero: pnpm run sitemaps-sync -- <medio>`);
    process.exit(1);
  }
  const { compressed, meta: baseMeta } = buildPayload(srcDir, quality, compact);
  const meta = { ...baseMeta, enc: binary ? BIN_MARKER : undefined };
  const infoFor = (m) => [
    '='.repeat(50),
    '  GOBIERNO VAULT - CATALOGO DE SITEMAPS',
    '  Indice local de articulos de prensa (URL + fecha + titulo si existe)',
    '='.repeat(50),
    '',
    'QUE ES ESTE ARCHIVO',
    '-------------------',
    'Snapshot comprimido (Brotli) de la carpeta sitemaps/: los JSONL por',
    'medio/año + README.md + _manifest.json. Permite regenerar el catalogo',
    'completo sin re-sincronizar los sitemaps de cada medio.',
    compact ? 'Formato: JSONL compacto lossless (el restore regenera el JSONL' : '',
    compact ? 'original byte-identico, verificado por SHA-256).' : '',
    binary ? 'Contenedor: binario (payload Brotli en bytes crudos tras METADATA).' : 'Contenedor: texto (base64).',
    m.chunks ? `PARTIDO: ${m.chunks} partes (~${m.chunkSizeMB} MB c/u). Descargar TODAS y restaurar la 1ª:` : '',
    '',
    `SHA-256 del payload: ${m.sha256}`,
    `Artículos en archivos: ${m.fileCount} archivo(s)`,
    `Comprimido: ${(m.compressedBytes / 1024).toFixed(1)} KB (origen ${(m.plaintextBytes / 1024).toFixed(1)} KB)`,
    '',
    'RESTAURAR',
    '--------',
    `  node scripts/sitemaps-backup.mjs --restore [${displayPath(outPath)}${m.chunks ? ' o la 1ª parte' : ''}]`,
    '  (o: pnpm run sitemaps-backup --restore)',
    m.chunks ? `  Unir partes en un .gvault único: node scripts/sitemaps-backup.mjs --join [${displayPath(outPath)}]` : '',
    '',
    binary ? 'Verificar integridad sin el proyecto (solo Node, sobre la 1ª parte):' : '',
    binary ? '  node -e "const{readFileSync}=require(\'fs\'),{createHash}=require(\'crypto\'),{brotliDecompressSync}=require(\'zlib\');const b=readFileSync(process.argv[1]);const s=b.toString(\'latin1\');const a=s.lastIndexOf(\'===METADATA===\'),n1=s.indexOf(\'\\n\',a),n2=s.indexOf(\'\\n\',n1+1);const m=JSON.parse(b.subarray(n1+1,n2));const c=m.enc===\'GV-BIN\'?b.subarray(n2+1):Buffer.from(b.subarray(n2+1).toString(),\'base64\');if(createHash(\'sha256\').update(c).digest(\'hex\')!==m.sha256){console.error(\'CORRUPTO\');process.exit(1)}const p=JSON.parse(brotliDecompressSync(c));console.log(\'OK\',p.kind,p.fileCount??p.manifest.length,\'archivos\')" <este-archivo>' : '',
    '',
    'GENERADO',
    '--------',
    `Fecha: ${m.created}`,
    '='.repeat(50),
  ].join('\n');
  const info = infoFor(meta);

  writeGvault(outPath, info, meta, compressed, binary, chunkSizeMB);
  console.log(`✔ ${displayPath(outPath)}${chunkSizeMB > 0 ? ' (partido)' : ''} (${binary ? 'contenedor binario' : 'contenedor texto'})`);
  console.log(`   ${(meta.plaintextBytes / 1024).toFixed(1)} KB → ${(meta.compressedBytes / 1024).toFixed(1)} KB comprimido (Brotli)`);
}

if (isMain) {
  main();
}

export { compactEncode, compactDecode, compactEncodeFile, compactDecodeFile };
