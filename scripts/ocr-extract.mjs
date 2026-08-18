#!/usr/bin/env node
/**
 * ocr-extract.mjs — OCR de imágenes y screenshots.
 *
 * Usa Tesseract OCR via Python (pytesseract) para extraer texto de imágenes.
 * Si pytesseract no está instalado, ofrece instrucciones de instalación.
 *
 * Uso:
 *   node scripts/ocr-extract.mjs -- imagen.png
 *   node scripts/ocr-extract.mjs -- imagen.png --lang spa
 *   node scripts/ocr-extract.mjs -- imagen.png --out resultado.txt
 *   node scripts/ocr-extract.mjs --check  (verifica si OCR está disponible)
 *
 * Flags:
 *   --lang X   Idioma del OCR (default: spa+eng)
 *   --out X    Guarda resultado en archivo
 *   --check    Solo verifica si OCR está disponible
 *
 * Requisito: Python 3 + pytesseract + Tesseract OCR
 *   pip install --user pytesseract
 *   # Windows: descargar Tesseract de https://github.com/UB-Mannheim/tesseract/wiki
 *   # Linux: sudo apt install tesseract-ocr tesseract-ocr-spa
 *   # macOS: brew install tesseract tesseract-lang
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const checkMode = args.includes('--check');
const langIdx = args.indexOf('--lang');
const lang = langIdx !== -1 ? args[langIdx + 1] : 'spa+eng';
const outIdx = args.indexOf('--out');
const outFile = outIdx !== -1 ? args[outIdx + 1] : null;
const inputPath = args.find(a => a.startsWith('/') || a.startsWith('./') || a.match(/^[A-Z]:\\/i) || a.endsWith('.png') || a.endsWith('.jpg') || a.endsWith('.jpeg') || a.endsWith('.tiff') || a.endsWith('.bmp') || a.endsWith('.gif'));

// ═══════════════════════════════════════════════════════════════
# Python snippet for OCR
// ═══════════════════════════════════════════════════════════════

const PYTHON_SNIPPET = `
import sys
import os

try:
    import pytesseract
    from PIL import Image
except ImportError:
    print("ERROR: pytesseract no está instalado.", file=sys.stderr)
    print("Instalar con: pip install --user pytesseract Pillow", file=sys.stderr)
    print("Además necesita Tesseract OCR instalado:", file=sys.stderr)
    print("  Windows: https://github.com/UB-Mannheim/tesseract/wiki", file=sys.stderr)
    print("  Linux: sudo apt install tesseract-ocr tesseract-ocr-spa", file=sys.stderr)
    print("  macOS: brew install tesseract tesseract-lang", file=sys.stderr)
    sys.exit(1)

try:
    import tesseract
    # Check if tesseract binary is accessible
except Exception:
    pass

image_path = sys.argv[1] if len(sys.argv) > 1 else None
lang = sys.argv[2] if len(sys.argv) > 2 else 'spa+eng'

if not image_path or not os.path.exists(image_path):
    print(f"ERROR: Archivo no encontrado: {image_path}", file=sys.stderr)
    sys.exit(1)

try:
    img = Image.open(image_path)
    text = pytesseract.image_to_string(img, lang=lang)
    print(text)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)
`;

// ═══════════════════════════════════════════════════════════════
# Check if OCR is available
// ═══════════════════════════════════════════════════════════════

function checkOcr() {
  try {
    execFileSync('python', ['-c', 'import pytesseract; print("OK")'], {
      encoding: 'utf-8',
      timeout: 10000,
    });
    return true;
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
# Main
// ═══════════════════════════════════════════════════════════════

if (checkMode) {
  if (checkOcr()) {
    console.log('✅ OCR disponible (pytesseract + Tesseract)');
    process.exit(0);
  } else {
    console.error('❌ OCR no disponible');
    console.error('Instalar:');
    console.error('  pip install --user pytesseract Pillow');
    console.error('  # Windows: https://github.com/UB-Mannheim/tesseract/wiki');
    console.error('  # Linux: sudo apt install tesseract-ocr tesseract-ocr-spa');
    console.error('  # macOS: brew install tesseract tesseract-lang');
    process.exit(1);
  }
}

if (!inputPath) {
  console.error('Uso: node scripts/ocr-extract.mjs -- <imagen> [--lang spa+eng] [--out archivo.txt]');
  console.error('     node scripts/ocr-extract.mjs --check');
  process.exit(1);
}

const absPath = resolve(inputPath);
if (!existsSync(absPath)) {
  console.error(`Archivo no encontrado: ${absPath}`);
  process.exit(1);
}

console.error(`\n═══ OCR: ${inputPath} (idioma: ${lang}) ═══\n`);

try {
  // Write python snippet to temp file
  const tmpFile = resolve(process.cwd(), '_tmp_ocr.py');
  writeFileSync(tmpFile, PYTHON_SNIPPET);

  const output = execFileSync('python', [tmpFile, absPath, lang], {
    encoding: 'utf-8',
    timeout: 60000,
    maxBuffer: 10 * 1024 * 1024,
  });

  // Clean up temp file
  try { require('fs').unlinkSync(tmpFile); } catch {}

  if (outFile) {
    writeFileSync(outFile, output);
    console.error(`\n✅ Texto guardado en ${outFile} (${output.length} caracteres)\n`);
  } else {
    console.log(output);
  }
} catch (e) {
  console.error(`Error: ${e.message}`);
  if (e.message.includes('pytesseract')) {
    console.error('\nInstalar dependencias:');
    console.error('  pip install --user pytesseract Pillow');
  }
  process.exit(1);
}
