import type { APIRoute } from 'astro';
import { getAllEvents } from '../../lib/queries';
import { getSourcesRegistry } from '../../lib/registry';
import { getSourceToEventsMap } from '../../lib/extractEntities';
import { getSueldos } from '../../lib/sueldos';
import { getPresupuesto, refAnchor } from '../../lib/presupuesto';

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

  // /sueldos y /presupuesto citan fuentes desde YAML, no desde wikilinks:
  // getSourceToEventsMap() no las ve. Indexar aparte los usos no-evento para
  // que la ficha no parezca huérfana cuando solo aparece en esas páginas.
  type Uso = { titulo: string; href: string };
  const usos: Record<string, Uso[]> = {};
  const addUso = (id: string, uso: Uso): void => {
    const lista = (usos[id] ??= []);
    if (!lista.some((u) => u.href === uso.href)) lista.push(uso);
  };
  getSueldos().ordenRefs.forEach((id, i) => {
    addUso(id, { titulo: 'Sueldos y brecha salarial', href: `/sueldos#ref-${i + 1}` });
  });
  for (const e of getPresupuesto().ejercicios) {
    e.refs.forEach((id) => {
      addUso(id, { titulo: `Presupuesto ${e.ano}`, href: `/presupuesto#${refAnchor(e.ano, id, e.refs)}` });
    });
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
      usos: usos[id] ?? [],
    };
  });

  return new Response(JSON.stringify({ data, eventsById, tipoLabels }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
