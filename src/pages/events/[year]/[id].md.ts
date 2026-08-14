import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllEvents } from '../../../lib/queries';

export async function getStaticPaths() {
  const events = await getAllEvents();
  return events.map((event) => {
    const filename = event.id.split('/').pop() ?? event.id;
    return {
      params: {
        year: new Date(event.data.fecha).getFullYear().toString(),
        id: filename,
      },
      props: { eventId: event.id },
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { eventId } = props as { eventId: string };
  const raw = readFileSync(join(process.cwd(), 'src', 'content', 'events', `${eventId}.md`), 'utf8');
  return new Response(raw, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
