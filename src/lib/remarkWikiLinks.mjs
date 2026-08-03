import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const dataDir = join(process.cwd(), 'src', 'data');

function loadSources() {
  return YAML.parse(readFileSync(join(dataDir, 'sources.yaml'), 'utf8')) ?? {};
}

function loadEntities() {
  return YAML.parse(readFileSync(join(dataDir, 'entities.yaml'), 'utf8')) ?? {};
}

function visit(node, callback) {
  callback(node);
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) visit(child, callback);
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function displayName(id, entityMap) {
  const entry = entityMap[id];
  return entry?.nombre ?? id;
}

function parseCifraValue(raw) {
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}

function formatCifraValor(valor, raw) {
  if (Number.isNaN(valor)) return raw;
  return raw;
}

function sourceTooltipNode(id, sources, counter) {
  const source = sources[id];
  const medio = escapeHtml(source?.medio ?? '');
  const titulo = escapeHtml(source?.titulo ?? id);

  return {
    type: 'html',
    value: `<a href="#ref-${counter}" class="source-ref"><sup class="source-ref-num">[${counter}]</sup><span class="source-ref-tip">${medio}\n${titulo}</span></a>`,
  };
}

function personNode(id, peopleMap) {
  const name = escapeHtml(displayName(id, peopleMap));
  return {
    type: 'html',
    value: `<span class="entity-ref entity-person">${name}</span>`,
  };
}

function orgNode(id, orgsMap) {
  const name = escapeHtml(displayName(id, orgsMap));
  return {
    type: 'html',
    value: `<span class="entity-ref entity-org">${name}</span>`,
  };
}

function cifraNode(concepto, raw, unidad) {
  const valor = parseCifraValue(raw);
  const display = formatCifraValor(valor, raw);
  const unitDisplay = unidad && !unidad.startsWith('/') ? ` ${escapeHtml(unidad.replace(/_/g, ' '))}` : '';
  const title = `${escapeHtml(concepto)}: ${escapeHtml(raw)}${unitDisplay}`;
  return {
    type: 'html',
    value: `<span class="cifra-badge" title="${title}">${escapeHtml(display)}${unitDisplay}</span>`,
  };
}

export default function remarkWikiLinks() {
  const sources = loadSources();
  const entities = loadEntities();
  const peopleMap = entities.people ?? {};
  const orgsMap = entities.organizations ?? {};

  return (tree, file) => {
    const sourceNumbers = new Map();
    let nextNum = 0;
    const missing = new Set();

    visit(tree, (node) => {
      if (!Array.isArray(node.children)) return;

      node.children = node.children.flatMap((child) => {
        if (child.type !== 'text' || !child.value.includes('[[')) return [child];

        const parts = [];
        const pattern = /\[\[(source|person|org|cifra)\/([A-Za-z0-9_.-]+)(?:\/(-?[\d.,]+)(?:\/([^\]]+))?)?\]\]/g;
        let lastIndex = 0;
        let match;

        while ((match = pattern.exec(child.value)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: 'text', value: child.value.slice(lastIndex, match.index) });
          }

          const [, type, id, cifraValor, cifraUnidad] = match;
          if (type === 'source') {
            if (!sources[id]) missing.add(`[[source/${id}]]`);
            if (!sourceNumbers.has(id)) sourceNumbers.set(id, ++nextNum);
            parts.push(sourceTooltipNode(id, sources, sourceNumbers.get(id)));
          } else if (type === 'person') {
            if (!peopleMap[id]) missing.add(`[[person/${id}]]`);
            parts.push(personNode(id, peopleMap));
          } else if (type === 'org') {
            if (!orgsMap[id]) missing.add(`[[org/${id}]]`);
            parts.push(orgNode(id, orgsMap));
          } else if (type === 'cifra' && cifraValor) {
            parts.push(cifraNode(id, cifraValor, cifraUnidad));
          }

          lastIndex = pattern.lastIndex;
        }

        if (lastIndex < child.value.length) {
          parts.push({ type: 'text', value: child.value.slice(lastIndex) });
        }

        return parts.length > 0 ? parts : [child];
      });
    });

    if (missing.size > 0) {
      const filePath = file?.history?.[0] ?? file?.path ?? 'unknown';
      for (const ref of missing) {
        console.error(`✖ ${ref} → ${filePath}`);
      }
      throw new Error(`${missing.size} wikilink(s) roto(s) en ${filePath}: ${[...missing].join(', ')}`);
    }
  };
}
