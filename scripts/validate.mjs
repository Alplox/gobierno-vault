import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';

const root = join(process.cwd(), 'src');
const dataDir = join(root, 'data');
const eventsDir = join(root, 'content', 'events');

function readYaml(filename) {
  return YAML.parse(readFileSync(join(dataDir, filename), 'utf8')) ?? {};
}

const sourcesData = readYaml('sources.yaml');
const validSourceIds = new Set(Object.keys(sourcesData));

const topicsData = readYaml('topics.yaml');
const validTopicIds = new Set(Object.keys(topicsData));

const colectivosData = readYaml('colectivos.yaml');
const sectoresData = readYaml('sectores.yaml');
const validColectivos = new Set(Array.isArray(colectivosData) ? colectivosData : Object.keys(colectivosData));
const validSectores = new Set(Array.isArray(sectoresData) ? sectoresData : Object.keys(sectoresData));

let errors = 0;

function findDuplicates(list) {
  const seen = new Set();
  const dupes = new Set();
  for (const item of list) {
    if (seen.has(item)) dupes.add(item);
    seen.add(item);
  }
  return [...dupes];
}

function walkMd(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkMd(full));
    } else if (entry.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function eventIdFromPath(filePath) {
  const rel = relative(eventsDir, filePath);
  return rel.replace(/\.md$/, '').replace(/\\/g, '/');
}

const allFiles = walkMd(eventsDir);
const allEventIds = new Set(allFiles.map(eventIdFromPath));
// Also index by basename (e.g. "20250822-1") since relations use that format
const allEventBasenames = new Set(allFiles.map((f) => eventIdFromPath(f).split('/').pop()));

const referencedSources = new Set();
for (const file of allFiles) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(/\[\[source\/([A-Za-z0-9_.-]+)\]\]/g)) {
    referencedSources.add(match[1]);
  }
}
for (const id of validSourceIds) {
  if (!referencedSources.has(id)) {
    console.error(`✖ fuente huerfana en sources.yaml: "${id}" (no citada en ningun evento)`);
    errors++;
  }
}
for (const id of referencedSources) {
  if (!validSourceIds.has(id)) {
    console.error(`✖ fuente citada sin registrar en sources.yaml: "[[source/${id}]]"`);
    errors++;
  }
}

const colectivosDupes = findDuplicates([...validColectivos]);
const sectoresDupes = findDuplicates([...validSectores]);
for (const d of colectivosDupes) {
  console.error(`✖ colectivo duplicado en colectivos.yaml: "${d}"`);
  errors++;
}
for (const d of sectoresDupes) {
  console.error(`✖ sector duplicado en sectores.yaml: "${d}"`);
  errors++;
}

for (const file of allFiles) {
  const content = readFileSync(file, 'utf8');
  const eventId = eventIdFromPath(file);

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const fm = YAML.parse(fmMatch[1]);
  if (!fm) continue;

  // Validate tema (comma-separated string or array)
  const rawTemas = Array.isArray(fm.tema) ? fm.tema : fm.tema ? String(fm.tema).split(',') : [];
  const temas = rawTemas.map((t) => String(t).trim()).filter(Boolean);
  for (const t of temas) {
    if (!validTopicIds.has(t)) {
      console.error(`✖ tema "${t}" no existe en topics.yaml → ${eventId}`);
      errors++;
    }
  }

  // Validate relaciones
  if (fm.relaciones && typeof fm.relaciones === 'object') {
    for (const [tipo, targets] of Object.entries(fm.relaciones)) {
      const ids = Array.isArray(targets) ? targets : [targets];
      for (const id of ids) {
        if (typeof id === 'string' && !allEventIds.has(id) && !allEventBasenames.has(id)) {
          console.error(`✖ relacion "${tipo}: ${id}" no existe → ${eventId}`);
          errors++;
        }
      }
    }
  }

  // Regla AGENTS.md 13: el body de un evento no debe contener notas de editor
  // ni metainstrucciones de gestión (para eso existe TAREAS.md).
  const body = content.replace(/^---[\s\S]*?---/, '');
  const editorNote = body.match(
    /tareas\.md|nota de verificación|nota del editor|nota editorial|pendiente evento|queda pendiente de verificación|registrad[oa] para seguimiento|agenda de pendientes/i
  );
  if (editorNote) {
    console.error(`✖ metanota de editor en body → ${eventId}: "${editorNote[0]}"`);
    errors++;
  }

  // Validate impacto.colectivos and impacto.sectores against YAML registries
  for (const [key, validIds] of [
    ['colectivos', validColectivos],
    ['sectores', validSectores],
  ]) {
    const raw = fm.impacto?.[key];
    if (!raw) continue;
    const ids = Array.isArray(raw) ? raw : String(raw).split(',');
    const clean = ids.map((i) => String(i).trim()).filter(Boolean);
    const dupes = findDuplicates(clean);
    for (const d of dupes) {
      console.error(`✖ ${key} duplicado en ${eventId}: "${d}"`);
      errors++;
    }
    for (const id of clean) {
      if (!validIds.has(id)) {
        console.error(`✖ ${key} "${id}" no existe en ${key}.yaml → ${eventId}`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n✖ ${errors} error(es) de validación`);
  process.exit(1);
} else {
  console.log(`✔ ${allFiles.length} archivos validados`);
}
