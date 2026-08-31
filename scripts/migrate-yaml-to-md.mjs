#!/usr/bin/env node
// migrate-yaml-to-md.mjs — Migra src/data/*.yaml a src/content/*/*.md (Obsidian vault)
// Lee entities.yaml (people, organizations), topics.yaml, sources.yaml y genera
// un .md por entrada con frontmatter YAML. Idempotente: sobrescribe solo si cambia.
// Uso:
//   node scripts/migrate-yaml-to-md.mjs              # migra todo
//   node scripts/migrate-yaml-to-md.mjs --dry-run    # solo reporta
//   node scripts/migrate-yaml-to-md.mjs --people     # solo people
//   node scripts/migrate-yaml-to-md.mjs --sources    # solo sources
// Reversible: cada .md contiene frontmatter 1:1 con el YAML original.

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DRY = process.argv.includes('--dry-run');
const onlyPeople = process.argv.includes('--people');
const onlyOrgs = process.argv.includes('--organizations');
const onlyTopics = process.argv.includes('--topics');
const onlySources = process.argv.includes('--sources');
const onlyCifras = process.argv.includes('--cifras');
const filterActive = onlyPeople || onlyOrgs || onlyTopics || onlySources || onlyCifras;

function shouldRun(kind) {
  if (!filterActive) return true;
  if (kind === 'people' && onlyPeople) return true;
  if (kind === 'organizations' && onlyOrgs) return true;
  if (kind === 'topics' && onlyTopics) return true;
  if (kind === 'sources' && onlySources) return true;
  if (kind === 'cifras' && onlyCifras) return true;
  return false;
}

function ensureDir(dir) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

function toFrontmatter(data) {
  // Filtrar undefined/null para frontmatter limpio, mantener orden estable
  const clean = {};
  for (const [k, v] of Object.entries(data)) {
    if (v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)) {
      clean[k] = v;
    } else if (k === 'autor' && v === '') {
      clean[k] = '';
    }
  }
  // YAML.stringify maneja multilínea con |, quotes, etc.
  const yaml = YAML.stringify(clean).trim();
  return `---\n${yaml}\n---\n`;
}

function writeIfChanged(path, content) {
  if (existsSync(path)) {
    const prev = readFileSync(path, 'utf8');
    if (prev === content) return false;
  }
  if (!DRY) writeFileSync(path, content, 'utf8');
  return true;
}

let total = 0;
let created = 0;
let updated = 0;

// --- people & organizations (entities.yaml) ---
if (shouldRun('people') || shouldRun('organizations')) {
  const entitiesPath = join(ROOT, 'src', 'data', 'entities.yaml');
  const entities = YAML.parse(readFileSync(entitiesPath, 'utf8'));
  const people = entities.people || {};
  const orgs = entities.organizations || {};

  if (shouldRun('people')) {
    const dir = join(ROOT, 'src', 'content', 'people');
    ensureDir(dir);
    for (const [id, data] of Object.entries(people)) {
      const front = {
        nombre: data.nombre,
        cargo: data.cargo,
        organizacion: data.organizacion,
        cargos: data.cargos,
        tipo: data.tipo,
        pais: data.pais,
        notas: data.notas,
        bio: data.bio,
        aliases: data.aliases,
      };
      const content = toFrontmatter(front);
      const path = join(dir, `${id}.md`);
      const changed = writeIfChanged(path, content);
      if (changed) {
        if (existsSync(path)) updated++; else created++;
      }
      total++;
    }
    console.log(`✔ people: ${Object.keys(people).length} → ${dir}`);
  }

  if (shouldRun('organizations')) {
    const dir = join(ROOT, 'src', 'content', 'organizations');
    ensureDir(dir);
    for (const [id, data] of Object.entries(orgs)) {
      const front = {
        nombre: data.nombre,
        cargo: data.cargo,
        organizacion: data.organizacion,
        cargos: data.cargos,
        tipo: data.tipo,
        pais: data.pais,
        notas: data.notas,
        bio: data.bio,
        aliases: data.aliases,
      };
      const content = toFrontmatter(front);
      const path = join(dir, `${id}.md`);
      writeIfChanged(path, content);
      total++;
    }
    console.log(`✔ organizations: ${Object.keys(orgs).length} → ${dir}`);
  }
}

// --- cifras (entities.yaml -> cifras) ---
if (shouldRun('cifras')) {
  const entitiesPath = join(ROOT, 'src', 'data', 'entities.yaml');
  const entities = YAML.parse(readFileSync(entitiesPath, 'utf8'));
  const cifras = entities.cifras || {};
  const dir = join(ROOT, 'src', 'content', 'cifras');
  ensureDir(dir);
  for (const [id, data] of Object.entries(cifras)) {
    const front = {
      nombre: data.nombre,
      unidad_default: data.unidad_default,
      notas: data.notas,
    };
    const content = toFrontmatter(front);
    const path = join(dir, `${id}.md`);
    writeIfChanged(path, content);
    total++;
  }
  console.log(`✔ cifras: ${Object.keys(cifras).length} → ${dir}`);
}

// --- topics ---
if (shouldRun('topics')) {
  const topicsPath = join(ROOT, 'src', 'data', 'topics.yaml');
  const topics = YAML.parse(readFileSync(topicsPath, 'utf8'));
  const dir = join(ROOT, 'src', 'content', 'topics');
  ensureDir(dir);
  for (const [id, data] of Object.entries(topics)) {
    const front = {
      nombre: data.nombre,
      descripcion: data.descripcion,
      relacionados: data.relacionados,
      bio: data.bio,
    };
    const content = toFrontmatter(front);
    const path = join(dir, `${id}.md`);
    writeIfChanged(path, content);
    total++;
  }
  console.log(`✔ topics: ${Object.keys(topics).length} → ${dir}`);
}

// --- sources ---
if (shouldRun('sources')) {
  const sourcesPath = join(ROOT, 'src', 'data', 'sources.yaml');
  const sources = YAML.parse(readFileSync(sourcesPath, 'utf8'));
  const dir = join(ROOT, 'src', 'content', 'sources');
  ensureDir(dir);
  for (const [id, data] of Object.entries(sources)) {
    // fecha puede ser Date o string; normalizar a YYYY-MM-DD
    let fecha = data.fecha;
    if (fecha instanceof Date) fecha = fecha.toISOString().slice(0, 10);
    else if (typeof fecha === 'string') fecha = fecha.slice(0, 10);
    const front = {
      tipo: data.tipo,
      medio: data.medio,
      titulo: data.titulo,
      autor: data.autor ?? '',
      fecha,
      url: data.url,
      notas: data.notas,
    };
    const content = toFrontmatter(front);
    const path = join(dir, `${id}.md`);
    writeIfChanged(path, content);
    total++;
  }
  console.log(`✔ sources: ${Object.keys(sources).length} → ${dir}`);
}

console.log(`${DRY ? '[dry-run] ' : ''}Total: ${total} archivos procesados`);
if (DRY) console.log('Re-ejecuta sin --dry-run para escribir.');
