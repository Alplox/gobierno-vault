import type { APIRoute } from 'astro';
import { getAllEvents, getEventEntities } from '../../../lib/queries';
import { resolveReferences } from '../../../lib/registry';
import { readEventBody, buildEventMarkdown } from '../../../lib/eventMarkdown';

// Un archivo markdown por mes (YYYYMM) en vez de uno por evento. Cada evento
// es una seccion `## ID`, asi que el mismo archivo sirve para el boton de la
// ficha y para que un agente baje solo ~95 KB y elija su evento por ID.
type EventEntry = Awaited<ReturnType<typeof getAllEvents>>[number];

function filenameOf(event: EventEntry): string {
  return event.id.split('/').pop() ?? event.id;
}

function periodoOf(event: EventEntry): string {
  return filenameOf(event).slice(0, 6); // YYYYMM
}

export async function getStaticPaths() {
  const events = await getAllEvents();
  const periodos = [...new Set(events.map(periodoOf))].sort();
  return periodos.map((periodo) => ({
    params: { periodo },
    props: {
      periodo,
      ids: events.filter((e) => periodoOf(e) === periodo).map((e) => e.id),
    },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { periodo, ids } = props as { periodo: string; ids: string[] };
  const events = await getAllEvents();
  const byId = new Map(events.map((e) => [e.id, e]));
  const site = import.meta.env.SITE ?? 'https://gobierno-vault.pages.dev';
  const parts = [
    `<!-- Markdown de eventos ${periodo}. Una seccion ## ID por evento. -->`,
    '',
  ];

  for (const id of ids) {
    const event = byId.get(id);
    if (!event) continue;
    const filename = filenameOf(event);
    const year = new Date(event.data.fecha).getFullYear();
    const eventUrl = new URL(`/events/${year}/${filename}/`, site).href;
    const refs = resolveReferences(getEventEntities(id).fuentesAll);
    parts.push(
      `## ${filename}`,
      '',
      buildEventMarkdown({ titulo: event.data.titulo, eventUrl, refs, bodyMd: readEventBody(id) }),
      '',
    );
  }

  return new Response(parts.join('\n'), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
