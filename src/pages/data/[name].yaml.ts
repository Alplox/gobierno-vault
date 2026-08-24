import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ALLOWED = new Set(['entities', 'sources', 'topics', 'colectivos', 'sectores', 'sueldos']);

export function getStaticPaths() {
  return [...ALLOWED].map((name) => ({ params: { name } }));
}

export const GET: APIRoute = async ({ params }) => {
  const { name } = params as { name: string };
  if (!ALLOWED.has(name)) {
    return new Response('Not found', { status: 404 });
  }
  const raw = readFileSync(join(process.cwd(), 'src', 'data', `${name}.yaml`), 'utf8');
  return new Response(raw, {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
