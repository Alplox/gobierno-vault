#!/usr/bin/env node
/**
 * video-transcript.mjs — Extracción de transcripciones de videos.
 *
 * Usa yt-dlp (ya instalado) para extraer subtítulos/auto-subtítulos de YouTube.
 * Para TikTok/Instagram, usa servicios web externos.
 *
 * Uso:
 *   node scripts/video-transcript.mjs -- https://www.youtube.com/watch?v=XXXXX
 *   node scripts/video-transcript.mjs -- https://www.youtube.com/watch?v=XXXXX --lang es
 *   node scripts/video-transcript.mjs -- https://www.youtube.com/watch?v=XXXXX --out transcripcion.txt
 *   node scripts/video-transcript.mjs -- https://www.youtube.com/watch?v=XXXXX --auto
 *   node scripts/video-transcript.mjs --check
 *
 * Flags:
 *   --lang X   Idioma de los subtítulos (default: es). Usa 'auto' para auto-generados.
 *   --out X    Guarda resultado en archivo
 *   --auto     Solo usa auto-subtítulos (no subtítulos manuales)
 *   --list     Lista subtítulos disponibles
 *   --check    Verifica si yt-dlp está disponible
 *
 * Soporte por plataforma:
 *   - YouTube: ✅ subtítulos + auto-subtítulos (via yt-dlp)
 *   - TikTok: 🟡 usar videotranscriber.ai
 *   - Instagram: 🟡 usar getthescript.app
 *   - Otros: 🟡 intentar yt-dlp (puede funcionar)
 *
 * Requisito: yt-dlp (ya instalado en este proyecto)
 *   pip install --user yt-dlp
 */

import { execFileSync } from 'node:child_process';
import { writeFileSync, readdirSync, readFileSync, unlinkSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const checkMode = args.includes('--check');
const listMode = args.includes('--list');
const autoOnly = args.includes('--auto');
const langIdx = args.indexOf('--lang');
const lang = langIdx !== -1 ? args[langIdx + 1] : 'es';
const outIdx = args.indexOf('--out');
const outFile = outIdx !== -1 ? args[outIdx + 1] : null;
const url = args.find(a => a.startsWith('http'));

// ═══════════════════════════════════════════════════════════════
// Platform detection
// ═══════════════════════════════════════════════════════════════

function detectPlatform(u) {
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('facebook.com')) return 'facebook';
  return 'unknown';
}

// ═══════════════════════════════════════════════════════════════
// YouTube transcript via yt-dlp
// ═══════════════════════════════════════════════════════════════

function ytDlpListSubs(u) {
  try {
    const output = execFileSync('yt-dlp', ['--list-subs', '--no-download', u], {
      encoding: 'utf-8',
      timeout: 30000,
    });
    return output;
  } catch (e) {
    return null;
  }
}

function ytDlpGetTranscript(u, langCode, autoOnly) {
  const args = [
    autoOnly ? '--write-auto-sub' : '--write-sub',
    '--sub-lang', langCode,
    '--skip-download',
    '--sub-format', 'vtt',
    '-o', '-',  // output to stdout won't work for subs, use temp
    '--no-warnings',
    u,
  ];

  // yt-dlp writes subtitle files, not to stdout
  // Use --print to get the URL, then fetch it
  try {
    // First, get the subtitle URL
    const subUrl = execFileSync('yt-dlp', [
      '--print', 'requested_subtitles',
      '--no-download',
      autoOnly ? '--write-auto-sub' : '--write-sub',
      '--sub-lang', langCode,
      u,
    ], {
      encoding: 'utf-8',
      timeout: 30000,
    });

    // The output format is like: {'url': 'https://...', 'ext': 'vtt'}
    const urlMatch = subUrl.match(/'url':\s*'([^']+)'/);
    if (!urlMatch) {
      // Try alternative: just download the subtitle directly
      return ytDlpDownloadSub(u, langCode, autoOnly);
    }

    return { ok: true, url: urlMatch[1] };
  } catch (e) {
    return ytDlpDownloadSub(u, langCode, autoOnly);
  }
}

function ytDlpDownloadSub(u, langCode, autoOnly) {
  const tmpDir = process.env.TMP || process.env.TEMP || '/tmp';
  const tmpFile = `${tmpDir}/yt_sub_${Date.now()}`;

  try {
    const cmdArgs = [
      autoOnly ? '--write-auto-sub' : '--write-sub',
      '--sub-lang', langCode,
      '--sub-format', 'vtt',
      '--skip-download',
      '-o', tmpFile,
      '--no-warnings',
      u,
    ];

    execFileSync('yt-dlp', cmdArgs, {
      encoding: 'utf-8',
      timeout: 60000,
    });

    // Find the subtitle file

    const files = readdirSync(tmpDir).filter(f => f.startsWith('yt_sub_') && f.endsWith('.vtt'));

    if (files.length === 0) {
      // Try with es-419 or es
      const altArgs = cmdArgs.map(a => a === langCode ? (langCode === 'es' ? 'es-419' : 'es') : a);
      execFileSync('yt-dlp', altArgs, {
        encoding: 'utf-8',
        timeout: 60000,
      });
      const altFiles = readdirSync(tmpDir).filter(f => f.startsWith('yt_sub_') && f.endsWith('.vtt'));
      if (altFiles.length === 0) {
        return { ok: false, error: 'No se encontraron subtítulos' };
      }
      return parseVTT(readFileSync(`${tmpDir}/${altFiles[0]}`, 'utf-8'));
    }

    const vttContent = readFileSync(`${tmpDir}/${files[0]}`, 'utf-8');
    // Cleanup
    try { unlinkSync(`${tmpDir}/${files[0]}`); } catch {}

    return parseVTT(vttContent);
  } catch (e) {
    return { ok: false, error: e.message?.slice(0, 200) };
  }
}

function parseVTT(vtt) {
  // Remove VTT headers and timing, keep just text
  const lines = vtt.split('\n');
  const textLines = [];
  let lastLine = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip VTT headers, timing lines, and empty lines
    if (trimmed === '' || trimmed === 'WEBVTT' || trimmed.startsWith('Kind:') || trimmed.startsWith('Language:')) continue;
    if (trimmed.match(/^\d{2}:\d{2}:\d{2}/) || trimmed.match(/^\d+$/)) continue;
    // Skip position/style lines
    if (trimmed.startsWith('align:') || trimmed.startsWith('position:') || trimmed.startsWith('line:') || trimmed.startsWith('size:')) continue;
    // Clean HTML tags
    const clean = trimmed.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    if (clean && clean !== lastLine) {
      textLines.push(clean);
      lastLine = clean;
    }
  }

  const text = textLines.join('\n');
  return { ok: text.length > 100, content: text, chars: text.length, method: 'yt-dlp-vtt' };
}

// ═══════════════════════════════════════════════════════════════
// Check mode
// ═══════════════════════════════════════════════════════════════

if (checkMode) {
  try {
    const ver = execFileSync('yt-dlp', ['--version'], { encoding: 'utf-8', timeout: 5000 });
    console.log(`✅ yt-dlp disponible (v${ver.trim()})`);
    process.exit(0);
  } catch {
    console.error('❌ yt-dlp no disponible');
    console.error('Instalar: pip install --user yt-dlp');
    process.exit(1);
  }
}

if (!url) {
  console.error('Uso: node scripts/video-transcript.mjs -- <URL> [--lang es] [--auto] [--list] [--out archivo.txt]');
  console.error('     node scripts/video-transcript.mjs --check');
  console.error('\nPlataformas soportadas:');
  console.error('  YouTube:   ✅ subtítulos + auto-subtítulos (yt-dlp)');
  console.error('  TikTok:    ✅ download + Whisper transcription (yt-dlp + whisper)');
  console.error('  Instagram: ✅ download + Whisper transcription (yt-dlp + whisper)');
  console.error('  Twitter/X: ✅ download + Whisper transcription (yt-dlp + whisper)');
  console.error('  Facebook:  ✅ download + Whisper transcription (yt-dlp + whisper)');
  process.exit(1);
}

const platform = detectPlatform(url);
console.error(`\n═══ Transcripción: ${platform} ═══\n`);

// ═══════════════════════════════════════════════════════════════
// Platform-specific handling
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// Download + Whisper transcription for non-YouTube platforms
// ═══════════════════════════════════════════════════════════════

if (platform !== 'youtube') {
  // Try to download audio and transcribe with Whisper
  const tmpDir = process.env.TMP || process.env.TEMP || '/tmp';
  const tmpAudio = `${tmpDir}/vid_${Date.now()}.mp3`;

  console.error(`Descargando audio de ${platform}...`);
  try {
    execFileSync('yt-dlp', [
      '-x',  // extract audio
      '--audio-format', 'mp3',
      '--audio-quality', '5',  // lower quality = faster
      '-o', tmpAudio,
      '--no-warnings',
      url,
    ], {
      encoding: 'utf-8',
      timeout: 120000,
    });

    // Find the actual audio file (yt-dlp may add extension)

    const audioFiles = readdirSync(tmpDir).filter(f => f.startsWith('vid_') && (f.endsWith('.mp3') || f.endsWith('.webm') || f.endsWith('.m4a')));
    const actualAudio = audioFiles.length > 0 ? `${tmpDir}/${audioFiles[0]}` : tmpAudio;

    console.error(`Audio descargado: ${actualAudio}`);
    console.error(`Transcribiendo con Whisper...`);

    // Try multiple Whisper backends
    let transcript = null;

    // 1. Try whisper.cpp (whisper-cli)
    if (!transcript) {
      try {
        console.error('  Intentando whisper.cpp...');
        const cppOut = `${tmpDir}/whisper_out`;
        execFileSync('whisper-cli', [
          '-m', 'models/ggml-large-v3.bin',
          '-f', actualAudio,
          '-l', lang,
          '-otxt', '-osrt',
          '-of', cppOut,
        ], { encoding: 'utf-8', timeout: 300000 });
        const cppTxt = `${cppOut}.txt`;
        if (existsSync(cppTxt)) {
          transcript = readFileSync(cppTxt, 'utf-8');
          console.error('  ✅ whisper.cpp');
          try { unlinkSync(cppTxt); } catch {}
          try { unlinkSync(`${cppOut}.srt`); } catch {}
        }
      } catch {}
    }

    // 2. Try openai-whisper (Python)
    if (!transcript) {
      try {
        console.error('  Intentando openai-whisper...');
        execFileSync('whisper', [actualAudio, '--language', lang, '--output_format', 'txt', '--output_dir', tmpDir], {
          encoding: 'utf-8', timeout: 300000,
        });
        const txtFile = actualAudio.replace(/\.[^.]+$/, '.txt');
        if (existsSync(txtFile)) {
          transcript = readFileSync(txtFile, 'utf-8');
          console.error('  ✅ openai-whisper');
          try { unlinkSync(txtFile); } catch {}
        }
      } catch {}
    }

    // 3. Try faster-whisper (Python)
    if (!transcript) {
      try {
        console.error('  Intentando faster-whisper...');
        const fwScript = `${tmpDir}/fw_transcribe.py`;
        writeFileSync(fwScript, `
import sys
from faster_whisper import WhisperModel
model = WhisperModel("large-v3", device="cpu", compute_type="int8")
segments, info = model.transcribe(sys.argv[1], language=sys.argv[2])
for seg in segments:
    print(seg.text)
`);
        transcript = execFileSync('python', [fwScript, actualAudio, lang], {
          encoding: 'utf-8', timeout: 300000,
        });
        console.error('  ✅ faster-whisper');
        try { unlinkSync(fwScript); } catch {}
      } catch {}
    }

    if (transcript && transcript.trim().length > 50) {
      if (outFile) {
        writeFileSync(outFile, transcript);
        console.error(`\n✅ Transcripción guardada en ${outFile} (${transcript.length} caracteres)\n`);
      } else {
        console.log(transcript);
      }
      try { unlinkSync(actualAudio); } catch {}
      process.exit(0);
    } else {
      console.error('\n⚠️  Ningún backend de Whisper disponible.');
      console.error('Instalar uno de estos:');
      console.error('  pip install --user openai-whisper     (CPU, más simple)');
      console.error('  pip install --user faster-whisper      (más rápido, CPU/GPU)');
      console.error('  # whisper.cpp: https://github.com/ggerganov/whisper.cpp');
      console.error(`\nAudio descargado en: ${actualAudio}`);
      console.error('Puedes transcribirlo manualmente con cualquiera de las herramientas anteriores.');
      process.exit(1);
    }
  } catch (dlError) {
    console.error(`\nError descargando video: ${dlError.message?.slice(0, 200)}`);
    console.error('\nEl video puede ser privado, restringido o la plataforma bloqueó la descarga.');
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// YouTube transcript
// ═══════════════════════════════════════════════════════════════

if (platform === 'youtube') {
  if (listMode) {
    console.error('Subtítulos disponibles:');
    const subs = ytDlpListSubs(url);
    console.log(subs || 'No se pudieron listar subtítulos');
    process.exit(0);
  }

  // Try manual subs first, then auto
  console.error(`Buscando subtítulos (${autoOnly ? 'auto-generados' : 'manuales + auto'}) en idioma: ${lang}...`);

  let result = ytDlpDownloadSub(url, lang, autoOnly);

  // If not found, try es-419
  if (!result.ok && lang === 'es') {
    console.error(`Intentando es-419...`);
    result = ytDlpDownloadSub(url, 'es-419', autoOnly);
  }

  // If not found and not auto-only, try auto
  if (!result.ok && !autoOnly) {
    console.error(`Intentando auto-subtítulos...`);
    result = ytDlpDownloadSub(url, lang, true);
  }

  // If still not found, try English as fallback
  if (!result.ok && lang !== 'en') {
    console.error(`Intentando English...`);
    result = ytDlpDownloadSub(url, 'en', autoOnly);
  }

  if (result.ok) {
    console.error(`\n✅ Transcripción obtenida (${result.chars} caracteres)\n`);
    if (outFile) {
      writeFileSync(outFile, result.content);
      console.error(`Guardado en: ${outFile}`);
    } else {
      console.log(result.content);
    }
  } else {
    console.error(`\n❌ No se pudo obtener transcripción: ${result.error}`);
    console.error('\nPosibles causas:');
    console.error('  - El video no tiene subtítulos (ni manuales ni auto-generados)');
    console.error('  - Los subtítulos están en un idioma no disponible');
    console.error('  - El video es privado o restringido');
    console.error('\nAlternativa: usar whisper para transcribir el audio del video.');
    process.exit(1);
  }
}
