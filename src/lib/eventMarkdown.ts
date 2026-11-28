import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { SourceData } from './registry';

// Unica representacion canonica del markdown exportable de un evento. La usan
// la ficha (boton copiar / ver) y los shards mensuales de /data/events-md/.
// El body conserva los wikilinks: son la forma de citar entidades del vault.

export function readEventBody(eventId: string): string {
  const raw = readFileSync(join(process.cwd(), 'src', 'content', 'events', `${eventId}.md`), 'utf8');
  return raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
}

export type EventMarkdownInput = {
  titulo: string;
  eventUrl: string;
  refs: SourceData[];
  bodyMd: string;
};

export function buildReferenceLines(refs: SourceData[]): string {
  return refs
    .map((r, i) => `- [${i + 1}] ${r.titulo}${r.url ? ` — ${r.url}` : ''}${r.medio ? ` (${r.medio}${r.autor ? `, ${r.autor}` : ''})` : ''}`)
    .join('\n');
}

// Bloque de referencias tal como aparece en el markdown exportable. Lo usa el
// boton "copiar referencias" de la ficha y el exportador completo: una sola
// representacion canonica para no desfasar ambos formatos.
export function buildReferencesMarkdown(refs: SourceData[]): string {
  const refLines = buildReferenceLines(refs);
  return refLines ? `**Referencias:**\n${refLines}` : '';
}

// Mismo bloque para /sueldos y /presupuesto, cuyas fuentes viven en YAML y no
// tienen `tipo`/`autor`: así el botón "copiar referencias" entrega idéntico
// formato en las tres páginas.
export function buildReferencesMarkdownFrom(
  refs: Array<Pick<SourceData, 'titulo' | 'url' | 'medio' | 'autor'>>,
): string {
  return buildReferencesMarkdown(refs.map((r) => ({ ...r, tipo: '', fecha: new Date(0) })));
}

export function buildEventMarkdown({ titulo, eventUrl, refs, bodyMd }: EventMarkdownInput): string {
  return [
    `# ${titulo}`,
    '',
    bodyMd,
    '',
    '---',
    '',
    `**Fuente (Gobierno Vault):** ${eventUrl}`,
    buildReferencesMarkdown(refs),
  ].join('\n');
}
