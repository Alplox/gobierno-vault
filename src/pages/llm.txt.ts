import type { APIRoute } from 'astro';
import { buildLlmIndex } from '../lib/llmIndex';

export const GET: APIRoute = async () => {
  const body = await buildLlmIndex();
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
