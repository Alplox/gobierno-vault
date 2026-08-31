import type { APIRoute } from 'astro';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const ALLOWED = new Set(['entities', 'sources', 'topics', 'colectivos', 'sectores', 'sueldos']);

export function getStaticPaths() {
  return [...ALLOWED].map((name) => ({ params: { name } }));
}

export const GET: APIRoute = async ({ params }) => {
  const { name } = params as { name: string };
  if (!ALLOWED.has(name)) {
    return new Response('Not found', { status: 404 });
  }
  try {
    const raw = readFileSync(join(process.cwd(), 'src', 'data', `${name}.yaml`), 'utf8');
    return new Response(raw, {
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    // Fallback: reconstruir YAML desde colecciones markdown (migración Obsidian)
    try {
      let data: Record<string, unknown> = {};
      if (name === 'entities') {
        const peopleDir = join(process.cwd(), 'src', 'content', 'people');
        const orgsDir = join(process.cwd(), 'src', 'content', 'organizations');
        const cifrasDir = join(process.cwd(), 'src', 'content', 'cifras');
        const people: Record<string, unknown> = {};
        const orgs: Record<string, unknown> = {};
        const cifras: Record<string, unknown> = {};
        if (existsSync(peopleDir)) for (const f of readdirSync(peopleDir).filter(f=>f.endsWith('.md'))) { const id=f.replace(/\.md$/,''); const raw=readFileSync(join(peopleDir,f),'utf8'); const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/); if(m) people[id]=YAML.parse(m[1]); }
        if (existsSync(orgsDir)) for (const f of readdirSync(orgsDir).filter(f=>f.endsWith('.md'))) { const id=f.replace(/\.md$/,''); const raw=readFileSync(join(orgsDir,f),'utf8'); const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/); if(m) orgs[id]=YAML.parse(m[1]); }
        if (existsSync(cifrasDir)) for (const f of readdirSync(cifrasDir).filter(f=>f.endsWith('.md'))) { const id=f.replace(/\.md$/,''); const raw=readFileSync(join(cifrasDir,f),'utf8'); const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/); if(m) cifras[id]=YAML.parse(m[1]); }
        data = { people, organizations: orgs, cifras };
      } else if (name === 'sources') {
        const dir = join(process.cwd(), 'src', 'content', 'sources');
        for (const f of readdirSync(dir).filter(f=>f.endsWith('.md'))) { const id=f.replace(/\.md$/,''); const raw=readFileSync(join(dir,f),'utf8'); const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/); if(m) data[id]=YAML.parse(m[1]); }
      } else if (name === 'topics') {
        const dir = join(process.cwd(), 'src', 'content', 'topics');
        for (const f of readdirSync(dir).filter(f=>f.endsWith('.md'))) { const id=f.replace(/\.md$/,''); const raw=readFileSync(join(dir,f),'utf8'); const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/); if(m) data[id]=YAML.parse(m[1]); }
      } else throw new Error('no fallback');
      const yaml = YAML.stringify(data);
      return new Response(yaml, {
        headers: { 'Content-Type': 'text/yaml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  }
};
