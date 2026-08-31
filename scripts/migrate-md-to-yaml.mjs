#!/usr/bin/env node
// migrate-md-to-yaml.mjs — Reconstruye src/data/*.yaml desde src/content/*/*.md
// Inverso de migrate-yaml-to-md.mjs. Útil si alguien prefiere el formato monolito
// o para verificar round-trip: md -> yaml -> md debe ser idempotente.
// Uso:
//   node scripts/migrate-md-to-yaml.mjs --dry-run
//   node scripts/migrate-md-to-yaml.mjs              # sobrescribe YAML

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

function readCollection(collection) {
  const dir = join(ROOT, 'src', 'content', collection);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const record = {};
  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    const raw = readFileSync(join(dir, file), 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!m) continue;
    record[id] = YAML.parse(m[1]);
  }
  return record;
}

if (!DRY) console.log('Reconstruyendo YAML desde markdown...');

const people = readCollection('people');
const orgs = readCollection('organizations');
if (people || orgs) {
  const entities = {
    people: people ?? {},
    organizations: orgs ?? {},
    // cifras se mantienen en YAML (no migradas); cargar del YAML existente para no perder
    ...( (() => { try { return { cifras: YAML.parse(readFileSync(join(ROOT,'src/data/entities.yaml'),'utf8')).cifras }; } catch { return {}; }})()),
  };
  const out = YAML.stringify(entities);
  if (!DRY) writeFileSync(join(ROOT, 'src/data/entities.yaml'), out, 'utf8');
  console.log(`✔ entities.yaml: ${Object.keys(people||{}).length} people + ${Object.keys(orgs||{}).length} orgs${DRY?' [dry-run]':''}`);
}

const topics = readCollection('topics');
if (topics) {
  const out = YAML.stringify(topics);
  if (!DRY) writeFileSync(join(ROOT, 'src/data/topics.yaml'), out, 'utf8');
  console.log(`✔ topics.yaml: ${Object.keys(topics).length}${DRY?' [dry-run]':''}`);
}

const sources = readCollection('sources');
if (sources) {
  const out = YAML.stringify(sources);
  if (!DRY) writeFileSync(join(ROOT, 'src/data/sources.yaml'), out, 'utf8');
  console.log(`✔ sources.yaml: ${Object.keys(sources).length}${DRY?' [dry-run]':''}`);
}

console.log(DRY ? '[dry-run] sin escribir' : 'Listo. Verifica con git diff y pnpm run validate.');
