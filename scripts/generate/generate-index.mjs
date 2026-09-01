import { readFileSync, readdirSync, statSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';

const root = join(process.cwd());
const srcRoot = join(root, 'src');
const dataDir = join(srcRoot, 'data');
const eventsDir = join(srcRoot, 'content', 'events');

function readYaml(filename) {
  try {
    return YAML.parse(readFileSync(join(dataDir, filename), 'utf8')) ?? {};
  } catch {
    const map = { 'sources.yaml': 'sources', 'topics.yaml': 'topics' };
    const coll = map[filename];
    if (coll) {
      const dir = join(process.cwd(), 'src', 'content', coll);
      if (existsSync(dir)) {
        const rec = {};
        for (const f of readdirSync(dir).filter(f=>f.endsWith('.md'))) {
          const id = f.replace(/\.md$/, '');
          const raw = readFileSync(join(dir, f), 'utf8');
          const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (m) rec[id] = YAML.parse(m[1]);
        }
        if (Object.keys(rec).length) return rec;
      }
    }
    if (filename === 'entities.yaml') {
      const rec = { people: {}, organizations: {}, cifras: {} };
      let found=false;
      for (const [d,k] of [[join(process.cwd(),'src/content/people'),'people'],[join(process.cwd(),'src/content/organizations'),'organizations'],[join(process.cwd(),'src/content/cifras'),'cifras']]) {
        if (existsSync(d)) for (const f of readdirSync(d).filter(f=>f.endsWith('.md'))) { const id=f.replace(/\.md$/,''); const raw=readFileSync(join(d,f),'utf8'); const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/); if(m){rec[k][id]=YAML.parse(m[1]); found=true;} }
      }
      if(found) return rec;
    }
    throw new Error('fallback failed');
  }
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

function parseEventFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return null;
  return YAML.parse(fmMatch[1]);
}

// Count unique [[sources/...]] IDs referenced in a file body
function countSources(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const ids = new Set();
  for (const match of content.matchAll(/\[\[source\/([A-Za-z0-9_.-]+)\]\]/g)) {
    ids.add(match[1]);
  }
  return ids.size;
}

// Collect all events
const allFiles = walkMd(eventsDir);
const events = [];

for (const file of allFiles) {
  const fm = parseEventFrontmatter(file);
  if (!fm || !fm.titulo) continue;
  
  const eventId = eventIdFromPath(file);
  const relPath = relative(root, file).replace(/\\/g, '/');
  
  // Extract year from path
  const yearMatch = eventId.match(/^(\d{4})/);
  const year = yearMatch ? yearMatch[1] : 'unknown';
  
  events.push({
    id: eventId,
    path: relPath,
    title: fm.titulo,
    year,
    tipo: fm.tipo,
    temas: Array.isArray(fm.tema) ? fm.tema : fm.tema ? String(fm.tema).split(',').map(t => t.trim()) : [],
    fecha: fm.fecha,
    fuentes: countSources(file)
  });
}

// Sort events by date (filename order is chronological)
events.sort((a, b) => a.id.localeCompare(b.id));

// Generate EVENTS_INDEX.md
let eventsIndex = '# Índice de Eventos\n\n';
eventsIndex += '> Este archivo se genera automáticamente con `pnpm run generate-index`\n';
eventsIndex += '> Cada línea indica el número de **fuentes únicas** citadas en el evento (`N fuentes`), es decir, IDs `[[sources/...]]` distintos. Mínimo recomendado: 3 fuentes por evento para reducir sesgo.\n\n';

// Seguimiento: eventos con menos de 3 fuentes
const lowSourceEvents = events
  .filter((e) => e.fuentes < 3)
  .sort((a, b) => a.fuentes - b.fuentes || a.id.localeCompare(b.id));

const lowCount = lowSourceEvents.length;
if (lowCount > 0) {
  eventsIndex += `## ⚠️ Seguimiento: eventos con menos de 3 fuentes (${lowCount})\n\n`;
  eventsIndex += `<details>\n<summary>Ver lista (${lowCount} eventos) — priorizar búsqueda de fuentes adicionales</summary>\n\n`;
  for (const event of lowSourceEvents) {
    const fuenteLabel = event.fuentes === 1 ? 'fuente' : 'fuentes';
    eventsIndex += `- [${event.id} - ${event.title}](${event.path}) — **${event.fuentes} ${fuenteLabel}**\n`;
  }
  eventsIndex += '\n</details>\n\n';
} else {
  eventsIndex += '## ✅ Todos los eventos tienen al menos 3 fuentes\n\n';
}

// Group by year
const eventsByYear = {};
for (const event of events) {
  if (!eventsByYear[event.year]) {
    eventsByYear[event.year] = [];
  }
  eventsByYear[event.year].push(event);
}

// Sort years descending
const sortedYears = Object.keys(eventsByYear).sort((a, b) => b.localeCompare(a));

for (const year of sortedYears) {
  eventsIndex += `## ${year}\n\n`;
  for (const event of eventsByYear[year]) {
    eventsIndex += `- [${event.id} - ${event.title}](${event.path}) — ${event.fuentes} ${event.fuentes === 1 ? 'fuente' : 'fuentes'}\n`;
  }
  eventsIndex += '\n';
}

writeFileSync(join(root, 'EVENTS_INDEX.md'), eventsIndex, 'utf8');
console.log(`✔ EVENTS_INDEX.md generado con ${events.length} eventos`);

// Calculate statistics
const stats = {
  totalEvents: events.length,
  eventsByYear: {},
  temasCount: {},
  tiposCount: {}
};

for (const event of events) {
  // Count by year
  stats.eventsByYear[event.year] = (stats.eventsByYear[event.year] || 0) + 1;
  
  // Count temas
  for (const tema of event.temas) {
    stats.temasCount[tema] = (stats.temasCount[tema] || 0) + 1;
  }
  
  // Count tipos
  if (event.tipo) {
    stats.tiposCount[event.tipo] = (stats.tiposCount[event.tipo] || 0) + 1;
  }
}

// Load entities for stats (with error handling)
let entitiesData, sourcesData, topicsData;
try {
  entitiesData = readYaml('entities.yaml');
} catch (e) {
  console.warn('⚠ Error leyendo entities.yaml:', e.message);
  entitiesData = { people: {}, organizations: {}, cifras: {} };
}
try {
  sourcesData = readYaml('sources.yaml');
} catch (e) {
  console.warn('⚠ Error leyendo sources.yaml:', e.message);
  sourcesData = {};
}
try {
  topicsData = readYaml('topics.yaml');
} catch (e) {
  console.warn('⚠ Error leyendo topics.yaml:', e.message);
  topicsData = {};
}

const totalPeople = Object.keys(entitiesData.people || {}).length;
const totalOrgs = Object.keys(entitiesData.organizations || {}).length;
const totalCifras = Object.keys(entitiesData.cifras || {}).length;
const totalSources = Object.keys(sourcesData).length;
const totalTopics = Object.keys(topicsData).length;

// Estadísticas para editores: se inyectan en README.md entre marcadores (desde 2026-08-31).
// Antes vivían en sitemaps/ESTADISTICAS.md (eliminado). EVENTS_INDEX.md se genera aparte.
let statsBody = '';
statsBody += '> Generado por `pnpm run generate-index` (no editar a mano). Para el índice por evento ver `EVENTS_INDEX.md`.\n\n';
statsBody += `**Total de eventos:** ${stats.totalEvents}\n\n`;
statsBody += `**Cobertura de fuentes:** ${events.length - lowCount} de ${events.length} eventos con 3+ fuentes (${lowCount} requieren más fuentes para reducir sesgo)\n\n`;
statsBody += '**Eventos por año:**\n';
const sortedYearsStats = Object.keys(stats.eventsByYear).sort((a, b) => b.localeCompare(a));
for (const year of sortedYearsStats) {
  statsBody += `- ${year}: ${stats.eventsByYear[year]}\n`;
}
statsBody += '\n';
const sortedTemas = Object.entries(stats.temasCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
if (sortedTemas.length > 0) {
  statsBody += '**Temas más frecuentes (Top 10):**\n';
  for (const [tema, count] of sortedTemas) {
    const temaName = topicsData[tema]?.nombre || tema;
    statsBody += `- ${temaName} (${count})\n`;
  }
  statsBody += '\n';
}
const sortedTipos = Object.entries(stats.tiposCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
if (sortedTipos.length > 0) {
  statsBody += '**Tipos de eventos más frecuentes (Top 10):**\n';
  for (const [tipo, count] of sortedTipos) {
    statsBody += `- ${tipo} (${count})\n`;
  }
  statsBody += '\n';
}
statsBody += '**Entidades registradas:**\n';
statsBody += `- Personas: ${totalPeople}\n`;
statsBody += `- Organizaciones: ${totalOrgs}\n`;
statsBody += `- Cifras: ${totalCifras}\n`;
statsBody += `- Fuentes: ${totalSources}\n`;
statsBody += `- Temas: ${totalTopics}\n`;

// Inyectar en README.md entre marcadores AUTO-GENERATED:ESTADISTICAS
const START = '<!-- AUTO-GENERATED:ESTADISTICAS:START -->';
const END = '<!-- AUTO-GENERATED:ESTADISTICAS:END -->';
const statsSection = `${START}\n## Estadísticas del vault\n\n${statsBody}${END}`;
const readmePath = join(root, 'README.md');
let readme = readFileSync(readmePath, 'utf8');
if (readme.includes(START) && readme.includes(END)) {
  readme = readme.replace(new RegExp(`${START}[\\s\\S]*?${END}`), statsSection);
} else {
  // fallback: insertar antes de ## Requisitos (o al final si no existe)
  const anchor = '## Requisitos';
  if (readme.includes(anchor)) {
    readme = readme.replace(anchor, `${statsSection}\n\n${anchor}`);
  } else {
    readme = readme.trimEnd() + `\n\n${statsSection}\n`;
  }
}
writeFileSync(readmePath, readme, 'utf8');
console.log(`✔ README.md » Estadísticas del vault actualizado: ${stats.totalEvents} eventos, ${events.length - lowCount}/${events.length} con 3+ fuentes`);
console.log(`  Personas: ${totalPeople} · Orgs: ${totalOrgs} · Cifras: ${totalCifras} · Fuentes: ${totalSources} · Temas: ${totalTopics}`);
// Limpieza: eliminar archivo legacy si quedó
try { const legacy = join(root, 'sitemaps', 'ESTADISTICAS.md'); if (existsSync(legacy)) unlinkSync(legacy); } catch {}
