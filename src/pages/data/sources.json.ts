import type { APIRoute } from 'astro';
import { getAllEvents } from '../../lib/queries';
import { getSourcesRegistry } from '../../lib/registry';
import { getSourceToEventsMap } from '../../lib/extractEntities';

const tipoLabels: Record<string, string> = {
  oficial: 'Oficial', prensa: 'Prensa', agencia: 'Agencia',
  documento: 'Documento', entrevista: 'Entrevista', video: 'Video',
  audio: 'Audio', red_social: 'Red social', tribunal: 'Tribunal',
  parlamento: 'Parlamento', organismo_internacional: 'Organismo internacional',
  base_de_datos: 'Base de datos',
};

export const GET: APIRoute = async () => {
  const registry = getSourcesRegistry();
  const sourceToEvents = getSourceToEventsMap();
  const events = await getAllEvents();

  const eventsById: Record<string, { titulo: string; href: string }> = {};
  for (const e of events) {
    const id = e.id.split('/').pop() ?? e.id;
    const d = new Date(e.data.fecha);
    const year = Number.isNaN(d.getTime()) ? 0 : d.getFullYear();
    eventsById[id] = { titulo: e.data.titulo, href: `/events/${year}/${id}` };
  }

  const data = Object.entries(registry).map(([id, s]) => {
    const d = s.fecha ? new Date(s.fecha) : null;
    return {
      id,
      titulo: s.titulo ?? '',
      medio: s.medio ?? '',
      tipo: s.tipo ?? 'prensa',
      fecha: d && !Number.isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '',
      autor: s.autor ?? '',
      url: s.url ?? '',
      eventIds: sourceToEvents.get(id) ?? [],
    };
  });

  return new Response(JSON.stringify({ data, eventsById, tipoLabels }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
