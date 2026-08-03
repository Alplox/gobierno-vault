import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

export function getEditorData() {
  const dataDir = join(process.cwd(), 'src', 'data');

  const entities = YAML.parse(readFileSync(join(dataDir, 'entities.yaml'), 'utf8'));
  const sources = YAML.parse(readFileSync(join(dataDir, 'sources.yaml'), 'utf8'));
  const topicsData = YAML.parse(readFileSync(join(dataDir, 'topics.yaml'), 'utf8'));
  const colectivosData = YAML.parse(readFileSync(join(dataDir, 'colectivos.yaml'), 'utf8')) ?? [];
  const sectoresData = YAML.parse(readFileSync(join(dataDir, 'sectores.yaml'), 'utf8')) ?? [];

  const people = Object.entries(entities.people ?? {}).map(([id, p]: [string, any]) => ({
    id,
    nombre: p.nombre,
    cargo: p.cargo ?? '',
  }));

  const orgs = Object.entries(entities.organizations ?? {}).map(([id, o]: [string, any]) => ({
    id,
    nombre: o.nombre,
    tipo: o.tipo ?? '',
  }));

  const cifras = Object.entries(entities.cifras ?? {}).map(([id, c]: [string, any]) => ({
    id,
    nombre: c.nombre,
    unidad_default: c.unidad_default ?? '',
  }));

  const sourceList = Object.entries(sources).map(([id, s]: [string, any]) => ({
    id,
    titulo: s.titulo ?? id,
    medio: s.medio ?? '',
  }));

  const topics = Object.entries(topicsData).map(([id, t]: [string, any]) => ({
    id,
    nombre: t.nombre,
  }));

  // Collect etiquetas, colectivos, sectores from existing events
  const etiquetasSet = new Set<string>();
  const colectivosSet = new Set<string>();
  const sectoresSet = new Set<string>();
  const eventIds: string[] = [];

  // ponytail: sync read of event markdown files for autocomplete data
  const eventsDir = join(process.cwd(), 'src', 'content', 'events');

  function walkEvents(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkEvents(fullPath);
      } else if (entry.name.endsWith('.md')) {
        const content = readFileSync(fullPath, 'utf8');
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (fmMatch) {
          const fm = YAML.parse(fmMatch[1]);
          if (fm.etiquetas) {
            const tags = Array.isArray(fm.etiquetas) ? fm.etiquetas : [fm.etiquetas];
            tags.forEach((t: string) => etiquetasSet.add(t));
          }
          if (fm.impacto?.colectivos) {
            const c = Array.isArray(fm.impacto.colectivos) ? fm.impacto.colectivos : [fm.impacto.colectivos];
            c.forEach((v: string) => colectivosSet.add(v));
          }
          if (fm.impacto?.sectores) {
            const s = Array.isArray(fm.impacto.sectores) ? fm.impacto.sectores : [fm.impacto.sectores];
            s.forEach((v: string) => sectoresSet.add(v));
          }
          // Build event ID from path: events/YYYY/MM/YYYYMMDD-N.md
          const rel = fullPath.replace(eventsDir, '').replace(/\\/g, '/').replace(/^\//, '');
          const parts = rel.replace(/\.md$/, '').split('/');
          if (parts.length >= 3) {
            eventIds.push(`${parts[0]}/${parts[1]}/${parts[2]}`);
          }
        }
      }
    }
  }
  walkEvents(eventsDir);

  const etiquetas = [...etiquetasSet].sort();
  const colectivos = [...new Set([...colectivosData, ...colectivosSet])].sort();
  const sectores = [...new Set([...sectoresData, ...sectoresSet])].sort();

  const sourceTipos = ['oficial', 'prensa', 'agencia', 'documento', 'entrevista', 'video', 'audio', 'red_social', 'tribunal', 'parlamento', 'organismo_internacional', 'base_de_datos'];

  const eventTipos = ['declaracion', 'accion', 'anuncio', 'decreto', 'proyecto', 'ley', 'votacion', 'fallo_judicial', 'entrevista', 'publicacion', 'documento', 'investigacion', 'reaccion', 'resultado'];

  const relationTipos = ['contradice', 'confirma', 'cumple', 'incumple', 'amplia', 'corrige', 'rectifica', 'responde_a', 'deriva_en', 'provoca', 'cita', 'reemplaza', 'actualiza'];

  return { people, orgs, cifras, sourceList, topics, etiquetas, colectivos, sectores, eventIds, sourceTipos, eventTipos, relationTipos };
}
