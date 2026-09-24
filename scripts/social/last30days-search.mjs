#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(fileURLToPath(new URL('../..', import.meta.url)));
const PINNED_TAG = 'v3.25.0';
const PINNED_COMMIT = 'beb7ed1868f034f198842174bfe2694e44b78363';
const REPOSITORY = 'https://github.com/mvanhorn/last30days-skill.git';
const LOCAL_TOOL_DIR = join(ROOT, '.tools', 'last30days');
const SKILL_RELATIVE_PATH = join('skills', 'last30days', 'SKILL.md');
const ENGINE_RELATIVE_PATH = join('skills', 'last30days', 'scripts', 'last30days.py');

function printHelp() {
  console.log(`Uso:
  pnpm run social-search -- --setup
  pnpm run social-search -- --check
  pnpm run social-search -- "<tema>" [--days N] [--quick|--deep] [--subreddits <lista>] [--x-handle <@usuario>]

Busca reacciones recientes en Reddit, X y YouTube mediante last30days ${PINNED_TAG}.
La salida es JSON crudo; no crea eventos, fuentes ni archivos dentro del vault.`);
}

function fail(message, exitCode = 2) {
  console.error(message);
  process.exit(exitCode);
}

function parseArgs(argv) {
  const options = {
    topic: [],
    days: 30,
    depth: 'default',
    subreddits: null,
    xHandle: null,
    setup: false,
    check: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === '--setup') {
      options.setup = true;
    } else if (argument === '--check') {
      options.check = true;
    } else if (argument === '--quick' || argument === '--deep') {
      if (options.depth !== 'default') {
        fail('Usa solo una de --quick o --deep.');
      }
      options.depth = argument.slice(2);
    } else if (argument === '--days') {
      const value = Number(argv[++index]);
      if (!Number.isInteger(value) || value < 1 || value > 365) {
        fail('--days debe ser un entero entre 1 y 365.');
      }
      options.days = value;
    } else if (argument === '--subreddits') {
      options.subreddits = argv[++index];
      if (!options.subreddits) fail('--subreddits requiere una lista, por ejemplo chile.');
    } else if (argument === '--x-handle') {
      options.xHandle = argv[++index];
      if (!options.xHandle) fail('--x-handle requiere un usuario, por ejemplo Kast.');
    } else if (argument === '--help' || argument === '-h') {
      printHelp();
      process.exit(0);
    } else if (argument.startsWith('--')) {
      fail(`Opción desconocida: ${argument}`);
    } else {
      options.topic.push(argument);
    }
  }

  if (options.setup && options.check) fail('Usa solo --setup o --check.');
  if (!options.setup && !options.check && options.topic.length === 0) {
    printHelp();
    process.exit(2);
  }

  return options;
}

function enginePath(skillDirectory) {
  return join(skillDirectory, ENGINE_RELATIVE_PATH);
}

function hasPinnedVersion(skillDirectory) {
  const skillFile = join(skillDirectory, SKILL_RELATIVE_PATH);
  if (!existsSync(enginePath(skillDirectory)) || !existsSync(skillFile)) return false;

  const version = readFileSync(skillFile, 'utf8').match(/^version:\s*["']?([^"'\s]+)["']?/m)?.[1];
  return version === PINNED_TAG.replace(/^v/, '');
}

function resolveSkillDirectory() {
  return hasPinnedVersion(LOCAL_TOOL_DIR) ? LOCAL_TOOL_DIR : null;
}

function installPinnedTool() {
  const existingDirectory = resolveSkillDirectory();
  if (existingDirectory) {
    console.log(`last30days ya está disponible en ${existingDirectory}.`);
    return;
  }
  if (existsSync(LOCAL_TOOL_DIR)) {
    fail(`${LOCAL_TOOL_DIR} existe pero no corresponde a ${PINNED_TAG}. Elimínalo y vuelve a ejecutar --setup.`);
  }

  mkdirSync(join(ROOT, '.tools'), { recursive: true });
  console.log(`Descargando last30days ${PINNED_TAG} en ${LOCAL_TOOL_DIR}...`);

  const result = spawnSync(
    'git',
    ['clone', '--branch', PINNED_TAG, '--depth', '1', REPOSITORY, LOCAL_TOOL_DIR],
    { stdio: 'inherit' },
  );

  if (result.error || result.status !== 0) {
    fail(`No se pudo instalar last30days ${PINNED_TAG}.`, result.status ?? 1);
  }

  const revision = spawnSync('git', ['-C', LOCAL_TOOL_DIR, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  });
  if (revision.error || revision.status !== 0 || revision.stdout.trim() !== PINNED_COMMIT) {
    fail(`La revisión descargada no coincide con ${PINNED_COMMIT}; no se usará.`);
  }
}

function resolvePython() {
  const candidates = process.platform === 'win32'
    ? [['py', ['-3.12']], ['python', []]]
    : [['python3', []], ['python', []]];

  for (const [command, prefix] of candidates) {
    const result = spawnSync(command, [...prefix, '-c', 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")'], {
      encoding: 'utf8',
    });
    if (result.error || result.status !== 0) continue;

    const [major, minor] = result.stdout.trim().split('.').map(Number);
    if (major > 3 || (major === 3 && minor >= 12)) return { command, prefix };
  }

  fail('Se requiere Python 3.12 o superior.', 1);
}

function cleanEnvironment() {
  return {
    ...process.env,
    FROM_BROWSER: 'off',
    LAST30DAYS_CONFIG_DIR: '',
    LAST30DAYS_MEMORY_DIR: join(tmpdir(), 'gobierno-vault-last30days'),
    LAST30DAYS_SKIP_KEYCHAIN: '1',
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
  };
}

function runEngine(skillDirectory, options) {
  const { command, prefix } = resolvePython();
  const engineArguments = [
    ...prefix,
    enginePath(skillDirectory),
  ];

  if (options.check) {
    engineArguments.push('--preflight', '--no-browser-cookies');
  } else {
    engineArguments.push(
      '--emit=json',
      '--json-profile=raw',
      '--search=reddit,x,youtube',
      '--no-browser-cookies',
      '--web-backend=none',
      '--no-verify-freshness',
      `--days=${options.days}`,
    );

    if (options.depth !== 'default') engineArguments.push(`--${options.depth}`);
    if (options.subreddits) engineArguments.push(`--subreddits=${options.subreddits}`);
    if (options.xHandle) engineArguments.push(`--x-handle=${options.xHandle.replace(/^@/, '')}`);

    engineArguments.push('--', ...options.topic);
  }

  console.error(`last30days ${PINNED_TAG} · ${options.check ? 'preflight' : 'búsqueda social'} · cookies de navegador desactivadas`);
  const result = spawnSync(command, engineArguments, {
    env: cleanEnvironment(),
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}

const options = parseArgs(process.argv.slice(2));

if (options.setup) {
  installPinnedTool();
  process.exit(0);
}

const skillDirectory = resolveSkillDirectory();
if (!skillDirectory) {
  fail(
    'last30days no está instalado. Ejecuta primero:\n'
    + '  pnpm run social-search -- --setup',
  );
}

runEngine(skillDirectory, options);
