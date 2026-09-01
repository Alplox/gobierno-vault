import type { CollectionEntry } from 'astro:content';
import { getAllEvents } from './queries';

const SITE = import.meta.env.SITE || 'https://gobierno-vault.pages.dev';

function eventUrl(eventId: string, fecha: Date): string {
  const year = new Date(fecha).getFullYear();
  const id = eventId.split('/').pop() ?? eventId;
  return `${SITE}/events/${year}/${id}`;
}

function fmtFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Genera el contenido de llm.txt / llms.txt (convención llmstxt.org adaptada):
 * guía de navegación + enlaces a páginas y a los formatos crudos (markdown/YAML).
 */
export async function buildLlmIndex(): Promise<string> {
  const events = await getAllEvents();

  const lines: string[] = [];
  lines.push('# Gobierno Vault');
  lines.push('');
  lines.push('> Base de conocimiento estática sobre eventos de gobierno en Chile.');
  lines.push('> Generada desde Astro (SSG) con contenido en `src/content/events/YYYY/MM/YYYYMMDD-N.md` y registros YAML en `src/data/`.');
  lines.push('> Idioma: español. Actualización: continua vía agentes de edición.');
  lines.push('');
  lines.push('## Navegación');
  lines.push('');
  lines.push(`- [Inicio](${SITE}/)`);
  lines.push(`- [Eventos (índice filtrable con búsqueda)](${SITE}/events)`);
  lines.push(`- [Personas](${SITE}/people)`);
  lines.push(`- [Organizaciones](${SITE}/organizations)`);
  lines.push(`- [Fuentes periodísticas](${SITE}/sources)`);
  lines.push(`- [Temas](${SITE}/topics)`);
  lines.push(`- [Estadísticas y cifras](${SITE}/stats)`);
  lines.push(`- [Gabinete](${SITE}/gabinete)`);
  lines.push('');
  lines.push('## Formatos crudos (recomendados para lectura por agentes)');
  lines.push('');
  lines.push('Cada evento está disponible en **markdown fuente** (frontmatter + body con wikilinks):');
  lines.push('');
  lines.push(`- Evento individual: \`${SITE}/events/AAAA/ID.md\` (ej. \`${SITE}/events/2026/20260814-2.md\`)`);
  lines.push(`- Todos los eventos: ver el índice completo al final de este archivo.`);
  lines.push('');
  lines.push('Los registros de datos están disponibles como **YAML crudo**:');
  lines.push('');
  lines.push(`- Personas, organizaciones y cifras: \`${SITE}/data/entities.yaml\``);
  lines.push(`- Fuentes periodísticas: \`${SITE}/data/sources.yaml\``);
  lines.push(`- Temas (taxonomía): \`${SITE}/data/topics.yaml\``);
  lines.push(`- Colectivos afectados: \`${SITE}/data/colectivos.yaml\``);
  lines.push(`- Sectores: \`${SITE}/data/sectores.yaml\``);
  lines.push(`- Datos de la página /sueldos (montos, series y referencias): \`${SITE}/data/sueldos.yaml\``);
  lines.push('');
  lines.push('## Cómo leer un evento');
  lines.push('');
  lines.push('Cada archivo de evento es Markdown con frontmatter YAML:');
  lines.push('');
  lines.push('```yaml');
  lines.push('titulo, fecha (ISO UTC), tipo (declaracion/accion/anuncio/decreto/proyecto/ley/');
  lines.push('votacion/fallo_judicial/entrevista/publicacion/documento/investigacion/reaccion/resultado),');
  lines.push('tema (IDs de topics.yaml), etiquetas, impacto (colectivos/sectores), relaciones, creado, actualizado');
  lines.push('```');
  lines.push('');
  lines.push('En el body, los wikilinks tienen esta forma:');
  lines.push('');
  lines.push('- `[[people/id]]` → persona registrada en entities.yaml');
  lines.push('- `[[organizations/id]]` → organización o medio de prensa');
  lines.push('- `[[sources/id]]` → fuente de sources.yaml (medio, título, autor, fecha, URL)');
  lines.push('- `[[cifra/concepto/valor/unidad]]` → cifra destacada');
  lines.push('- `[[events/ID]]` o ID desnudo `20260101-1` → enlace a otro evento');
  lines.push('');
  lines.push('## Cifras');
  lines.push('');
  lines.push(`- [Estadísticas del vault (conteos, temas, tipos)](${SITE}/stats)`);
  lines.push('');
  lines.push(`## Índice completo de eventos (${events.length})`);
  lines.push('');
  lines.push('Formato: `fecha | título | markdown crudo | página`.');
  lines.push('');

  for (const event of events) {
    const id = event.id.split('/').pop() ?? event.id;
    const fecha = fmtFecha(new Date(event.data.fecha));
    const md = `${eventUrl(event.id, new Date(event.data.fecha))}.md`;
    lines.push(`- ${fecha} | ${event.data.titulo} | [.md](${md}) | [página](${eventUrl(event.id, new Date(event.data.fecha))})`);
  }

  lines.push('');
  lines.push(`## Nota para agentes`);
  lines.push('');
  lines.push('Este vault es de **lectura factual**: cada evento cita fuentes inline con `[[sources/...]]`');
  lines.push('y no incluye notas de gestión. Las relaciones entre eventos (`relaciones` en el frontmatter)');
  lines.push('permiten reconstruir cadenas causales. Para citar un evento, referir el título y la URL de la');
  lines.push('página; los datos verificables están en las fuentes (`[[sources/...]]` → sources.yaml → URL original).');
  lines.push('');

  return lines.join('\n');
}

export { SITE };
export type LlmEventEntry = CollectionEntry<'events'>;
