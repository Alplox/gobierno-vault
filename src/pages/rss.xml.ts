import rss from '@astrojs/rss';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { getAllEvents } from '../lib/queries';
import { resolveReferences } from '../lib/registry';
import remarkWikiLinks from '../lib/remarkWikiLinks.mjs';

// Últimos N eventos por fecha descendente (getAllEvents ya viene ordenado).
// Feed completo con miles de items rompería lectores; 100 es un techo razonable.
const RSS_LIMIT = 100;

// [[sources/id]] en orden de primera aparición — misma numeración que el
// plugin remarkWikiLinks usa en la página del evento.
const SOURCE_WIKILINK = /\[\[sources?\/([A-Za-z0-9_.-]+)\]\]/g;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function excerpt(bodyMd: string): string {
  const plain = bodyMd
    .replace(SOURCE_WIKILINK, '')
    .replace(/\[\[(?:[^/\]]+\/)+([^\]]+)\]\]/g, '$1')
    .replace(/[#>*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 280 ? `${plain.slice(0, 280).trimEnd()}…` : plain;
}

export async function GET(context: { site: URL }) {
  const site = context.site;
  const origin = site.origin;
  const events = (await getAllEvents()).slice(0, RSS_LIMIT);
  const processor = await createMarkdownProcessor({ remarkPlugins: [remarkWikiLinks] });

  const items = await Promise.all(
    events.map(async (event) => {
      const { titulo, fecha } = event.data;
      const filename = event.id.split('/').pop() ?? event.id;
      const year = new Date(fecha).getFullYear().toString();
      const path = `/events/${year}/${filename}/`;
      const eventUrl = new URL(path, site).href;

      // Cuerpo = archivo .md fuente sin frontmatter (igual que el botón
      // "copiar markdown" de la página del evento).
      const rawMd = readFileSync(join(process.cwd(), 'src', 'content', 'events', `${event.id}.md`), 'utf8');
      const bodyMd = rawMd.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();

      // Las citas [[sources/id]] apuntarían a #ref-N (anclas de la página del
      // evento, muertas en un lector RSS): se resuelven a [N](url real) y la
      // lista numerada va al pie, como el export markdown. resolveReferences
      // sobre los IDs en orden de aparición garantiza que N coincida.
      const seen: string[] = [];
      for (const m of bodyMd.matchAll(SOURCE_WIKILINK)) {
        if (!seen.includes(m[1])) seen.push(m[1]);
      }
      const refs = resolveReferences(seen);
      const urlById = new Map(seen.map((id, i) => [id, refs[i]?.url]));
      const bodyLinked = bodyMd.replace(SOURCE_WIKILINK, (_, id: string) => {
        const n = seen.indexOf(id) + 1;
        const url = urlById.get(id);
        return url ? `[${n}](${url})` : `[${n}]`;
      });

      // Mismo pipeline markdown del sitio (people/orgs/cifras/eventos se
      // resuelven igual que en la página); luego se absolutizan los href/src.
      const { code } = await processor.render(bodyLinked);
      const html = code.replace(/(href|src)="\//g, `$1="${origin}/`);

      const refItems = seen
        .map((id, i) => {
          const r = refs[i];
          if (!r) return '';
          const title = escapeHtml(r.titulo || id);
          const linked = r.url ? `<a href="${escapeHtml(r.url)}">${title}</a>` : title;
          const meta = [r.medio, r.autor].filter(Boolean).map(escapeHtml).join(', ');
          return `<li>${linked}${meta ? ` — ${meta}` : ''}</li>`;
        })
        .join('');

      const content =
        `${html}<hr/><p><strong>Fuente (Gobierno Vault):</strong> ` +
        `<a href="${eventUrl}">${eventUrl}</a></p>` +
        (refItems ? `<p><strong>Referencias:</strong></p><ol>${refItems}</ol>` : '');

      return {
        title: titulo,
        pubDate: new Date(fecha),
        link: path,
        description: excerpt(bodyMd),
        content,
      };
    })
  );

  return rss({
    title: 'Gobierno Vault',
    description: 'Acontecimientos del gobierno de Chile, documentados con referencias.',
    site,
    customData: '<language>es-CL</language>',
    items,
  });
}
