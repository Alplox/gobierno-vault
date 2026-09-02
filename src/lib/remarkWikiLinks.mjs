import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

const dataDir = join(process.cwd(), 'src', 'data');

function loadSources() {
  try {
    const dir = join(process.cwd(), 'src', 'content', 'sources');
    if (existsSync(dir) && readdirSync(dir).some(f=>f.endsWith('.md'))) {
      const rec = {};
      for (const f of readdirSync(dir).filter(f=>f.endsWith('.md'))) {
        const id = f.replace(/\.md$/, '');
        const raw = readFileSync(join(dir, f), 'utf8');
        const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (m) rec[id] = YAML.parse(m[1]);
      }
      if (Object.keys(rec).length) return rec;
    }
  } catch {}
  return YAML.parse(readFileSync(join(dataDir, 'sources.yaml'), 'utf8')) ?? {};
}

function loadEntities() {
  try {
    const peopleDir = join(process.cwd(), 'src', 'content', 'people');
    const orgsDir = join(process.cwd(), 'src', 'content', 'organizations');
    const cifrasDir = join(process.cwd(), 'src', 'content', 'cifras');
    if (existsSync(peopleDir) || existsSync(orgsDir) || existsSync(cifrasDir)) {
      const rec = { people: {}, organizations: {}, cifras: {} };
      let found = false;
      for (const [dir, key] of [[peopleDir,'people'],[orgsDir,'organizations'],[cifrasDir,'cifras']]) {
        if (existsSync(dir)) {
          for (const f of readdirSync(dir).filter(f=>f.endsWith('.md'))) {
            const id = f.replace(/\.md$/, '');
            const raw = readFileSync(join(dir, f), 'utf8');
            const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (m) { rec[key][id] = YAML.parse(m[1]); found = true; }
          }
        }
      }
      if (found) return rec;
    }
  } catch {}
  return YAML.parse(readFileSync(join(dataDir, 'entities.yaml'), 'utf8')) ?? {};
}

// Índice de eventos (id -> { titulo, fecha }) construido una sola vez por proceso.
// Se camina src/content/events/**/*.md y se parsea el frontmatter (YAML).
function buildEventIndex() {
  const dir = join(process.cwd(), 'src', 'content', 'events');
  const index = {};
  function walk(d) {
    let entries;
    try {
      entries = readdirSync(d);
    } catch {
      return;
    }
    for (const name of entries) {
      const p = join(d, name);
      const st = statSync(p);
      if (st.isDirectory()) {
        walk(p);
      } else if (name.endsWith('.md')) {
        const id = name.replace(/\.md$/, '');
        const raw = readFileSync(p, 'utf8');
        const fm = raw.split('---')[1];
        if (!fm) continue;
        try {
          const data = YAML.parse(fm);
          index[id] = {
            titulo: data?.titulo ?? id,
            fecha: data?.fecha ? String(data.fecha).slice(0, 10) : '',
          };
        } catch {
          index[id] = { titulo: id, fecha: '' };
        }
      }
    }
  }
  walk(dir);
  return index;
}

const eventIndex = buildEventIndex();

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

function eventHref(id) {
  // La ruta de detalle es /events/[year]/[id] (ver getStaticPaths en
  // pages/events/[year]/[id].astro); el año se toma de la fecha del evento
  // (consistente con getFullYear de la página) con fallback al prefijo del ID.
  const entry = eventIndex[id];
  const year = entry?.fecha ? entry.fecha.slice(0, 4) : id.slice(0, 4);
  return `/events/${year}/${id}/`;
}

function eventNode(id) {
  const entry = eventIndex[id];
  const titulo = escapeHtml(entry?.titulo ?? id);
  const fecha = entry?.fecha ? ` · ${entry.fecha}` : '';
  return {
    type: 'html',
    value: `<a href="${eventHref(id)}" class="event-ref" title="${titulo}${fecha}">${titulo}</a>`,
  };
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

// Solo wikilinks explícitos [[people|organizations|sources|cifras|events/...]] — no hay auto-enlace de IDs desnudos (no es markdown puro).
const WIKILINK_OR_EVENT = /\[\[(sources?|people|person|organizations?|org|cifras|events?|event)\/([A-Za-z0-9_.-]+)(?:\/(-?[\d.,]+)(?:\/([^\]]+))?)?\]\]/g;

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
        if (child.type !== 'text') return [child];
        if (!child.value.includes('[[')) return [child];

        const parts = [];
        let lastIndex = 0;
        let match;

        // El regex global comparte estado (lastIndex) entre llamadas; hay que
        // reiniciarlo por cada nodo de texto para no saltar coincidencias.
        WIKILINK_OR_EVENT.lastIndex = 0;
        while ((match = WIKILINK_OR_EVENT.exec(child.value)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ type: 'text', value: child.value.slice(lastIndex, match.index) });
          }

          const [, rawType, id, cifraValor, cifraUnidad] = match;
          const type = rawType === 'people' ? 'person' : rawType === 'organizations' || rawType === 'organization' ? 'org' : rawType === 'sources' ? 'source' : rawType === 'cifras' ? 'cifra' : rawType === 'events' ? 'event' : rawType;
          if (type === 'source') {
            if (!sources[id]) missing.add(`[[${rawType}/${id}]]`);
            if (!sourceNumbers.has(id)) sourceNumbers.set(id, ++nextNum);
            parts.push(sourceTooltipNode(id, sources, sourceNumbers.get(id)));
          } else if (type === 'person') {
            if (!peopleMap[id]) missing.add(`[[${rawType}/${id}]]`);
            parts.push(personNode(id, peopleMap));
          } else if (type === 'org') {
            if (!orgsMap[id]) missing.add(`[[${rawType}/${id}]]`);
            parts.push(orgNode(id, orgsMap));
          } else if (type === 'cifra' && cifraValor) {
            parts.push(cifraNode(id, cifraValor, cifraUnidad));
          } else if (type === 'event') {
            if (!eventIndex[id]) missing.add(`[[${rawType}/${id}]]`);
            else parts.push(eventNode(id));
          }

          lastIndex = WIKILINK_OR_EVENT.lastIndex;
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
