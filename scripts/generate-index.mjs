import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';

const root = join(process.cwd());
const srcRoot = join(root, 'src');
const dataDir = join(srcRoot, 'data');
const eventsDir = join(srcRoot, 'content', 'events');

function readYaml(filename) {
  return YAML.parse(readFileSync(join(dataDir, filename), 'utf8')) ?? {};
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

// Count unique [[source/...]] IDs referenced in a file body
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
eventsIndex += '> Cada línea indica el número de **fuentes únicas** citadas en el evento (`N fuentes`), es decir, IDs `[[source/...]]` distintos. Mínimo recomendado: 3 fuentes por evento para reducir sesgo.\n\n';

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

// Estadísticas para editores: ya no se inyectan en AGENTS.md (desde 2026-08-26) para evitar diffs ruidosos.
// Se generan como sitemaps/ESTADISTICAS.md (útil para editores) además de EVENTS_INDEX.md.
// AGENTS.md solo apunta a ambos archivos.
let statsSection = '# Estadísticas del vault\n\n';
statsSection += '> Generado por `pnpm run generate-index` (no editar a mano). Para el índice por evento ver `EVENTS_INDEX.md`.\n\n';
statsSection += `**Total de eventos:** ${stats.totalEvents}\n\n`;
statsSection += `**Cobertura de fuentes:** ${events.length - lowCount} de ${events.length} eventos con 3+ fuentes (${lowCount} requieren más fuentes para reducir sesgo)\n\n`;
statsSection += '**Eventos por año:**\n';
const sortedYearsStats = Object.keys(stats.eventsByYear).sort((a, b) => b.localeCompare(a));
for (const year of sortedYearsStats) {
  statsSection += `- ${year}: ${stats.eventsByYear[year]}\n`;
}
statsSection += '\n';
const sortedTemas = Object.entries(stats.temasCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
if (sortedTemas.length > 0) {
  statsSection += '**Temas más frecuentes (Top 10):**\n';
  for (const [tema, count] of sortedTemas) {
    const temaName = topicsData[tema]?.nombre || tema;
    statsSection += `- ${temaName} (${count})\n`;
  }
  statsSection += '\n';
}
const sortedTipos = Object.entries(stats.tiposCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
if (sortedTipos.length > 0) {
  statsSection += '**Tipos de eventos más frecuentes (Top 10):**\n';
  for (const [tipo, count] of sortedTipos) {
    statsSection += `- ${tipo} (${count})\n`;
  }
  statsSection += '\n';
}
statsSection += '**Entidades registradas:**\n';
statsSection += `- Personas: ${totalPeople}\n`;
statsSection += `- Organizaciones: ${totalOrgs}\n`;
statsSection += `- Cifras: ${totalCifras}\n`;
statsSection += `- Fuentes: ${totalSources}\n`;
statsSection += `- Temas: ${totalTopics}\n`;

const estadisticasPath = join(root, 'sitemaps', 'ESTADISTICAS.md');
writeFileSync(estadisticasPath, statsSection, 'utf8');
console.log(`✔ sitemaps/ESTADISTICAS.md generado: ${stats.totalEvents} eventos, ${events.length - lowCount}/${events.length} con 3+ fuentes`);
console.log(`  Personas: ${totalPeople} · Orgs: ${totalOrgs} · Cifras: ${totalCifras} · Fuentes: ${totalSources} · Temas: ${totalTopics}`);
