import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';

const eventsDir = join(process.cwd(), 'src', 'content', 'events');
// Acepta alias de wikilink: [[people/id]] y [[people/id|Nombre legible]].
const wikiLinkPattern = /\[\[(sources?|people|person|organizations?|org)\/([A-Za-z0-9_.-]+)(?:\|[^\]]*)?\]\]/g;
const cifraPattern = /\[\[cifras\/([a-z_]+)\/(-?[\d.,]+)(?:\/([^\]]+))?\]\]/g;

export type CifraEntry = {
  concepto: string;
  valor: number;
  raw: string;
  unidad?: string;
};

export type QuoteEntry = {
  personId: string;
  text: string;
  eventId: string;
  fecha: string;
  titulo: string;
  sources: string[];
  line: number;
};

export type ExtractedEntities = {
  personas: string[];
  organizaciones: string[];
  fuentes: string[];
  fuentesAll: string[];
  cifras: CifraEntry[];
};

function parseCifraValue(raw: string): number {
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned);
}

function walkMd(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkMd(full));
    } else if (entry.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function extractFromFile(filePath: string): ExtractedEntities {
  const content = readFileSync(filePath, 'utf8');
  const personas = new Set<string>();
  const organizaciones = new Set<string>();
  const fuentes = new Set<string>();
  const fuentesAll: string[] = [];
  const cifras: CifraEntry[] = [];

  let match: RegExpExecArray | null;
  while ((match = wikiLinkPattern.exec(content)) !== null) {
    const [, type, id] = match;
    if (type === 'person' || type === 'people') personas.add(id);
    else if (type === 'org' || type === 'organization' || type === 'organizations') organizaciones.add(id);
    else if (type === 'source' || type === 'sources') {
      fuentes.add(id);
      if (!fuentesAll.includes(id)) fuentesAll.push(id);
    }
  }

  while ((match = cifraPattern.exec(content)) !== null) {
    const [, concepto, raw, unidad] = match;
    cifras.push({
      concepto,
      valor: parseCifraValue(raw),
      raw,
      unidad: unidad || undefined,
    });
  }

  return {
    personas: [...personas],
    organizaciones: [...organizaciones],
    fuentes: [...fuentes],
    fuentesAll,
    cifras,
  };
}

function eventIdFromPath(filePath: string): string {
  const rel = relative(eventsDir, filePath);
  return rel.replace(/\.md$/, '').replace(/\\/g, '/');
}

let cache: Map<string, ExtractedEntities> | null = null;

export function getEntityMap(): Map<string, ExtractedEntities> {
  if (cache) return cache;
  cache = new Map();
  for (const file of walkMd(eventsDir)) {
    cache.set(eventIdFromPath(file), extractFromFile(file));
  }
  return cache;
}

export function getEntitiesForEvent(eventId: string): ExtractedEntities {
  return getEntityMap().get(eventId) ?? { personas: [], organizaciones: [], fuentes: [], fuentesAll: [], cifras: [] };
}

export function getAllPeopleIds(): string[] {
  const ids = new Set<string>();
  for (const entities of getEntityMap().values()) {
    entities.personas.forEach((id) => ids.add(id));
  }
  return [...ids].sort();
}

export function getAllOrgIds(): string[] {
  const ids = new Set<string>();
  for (const entities of getEntityMap().values()) {
    entities.organizaciones.forEach((id) => ids.add(id));
  }
  return [...ids].sort();
}

export function getAllCifras(): Array<CifraEntry & { eventId: string; fecha: Date }> {
  const results: Array<CifraEntry & { eventId: string; fecha: Date }> = [];
  for (const [eventId, entities] of getEntityMap()) {
    const fecha = eventIdToDate(eventId);
    for (const cifra of entities.cifras) {
      results.push({ ...cifra, eventId, fecha });
    }
  }
  return results.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}

function eventIdToDate(eventId: string): Date {
  const parts = eventId.split('/');
  if (parts.length >= 3) {
    const filename = parts[2]; // YYYYMMDD-N
    const y = filename.slice(0, 4);
    const m = filename.slice(4, 6);
    const d = filename.slice(6, 8);
    if (/^\d{4}$/.test(y) && /^\d{2}$/.test(m) && /^\d{2}$/.test(d)) {
      return new Date(`${y}-${m}-${d}`);
    }
    // fallback: usar year/month del path si filename no parseable
    const year = parts[0];
    const month = parts[1];
    return new Date(`${year}-${month}-01`);
  }
  // fallback para IDs planos tipo 20260816-16
  const m = eventId.match(/^(\d{4})(\d{2})(\d{2})-\d+/);
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}`);
  return new Date(0);
}

// Formato: > texto de la cita - [[people/id]] [[sources/id]]
// OJO: el corpus escribe SIEMPRE en plural ([[people/]], [[sources/]]); el
// singular existe en la regla por compatibilidad con notas antiguas, pero usarlo
// solo hacía que 0 de 1.711 citas se detectaran.
// `.+` (greedy) a proposito: la atribucion es el ULTIMO wikilink de la linea.
// Con `> X - [[people/a]] y luego - [[people/b]]` el texto debe ser "X -
// [[people/a]] y luego" y la persona b, no al reves.
const quoteLineRe = /^>\s*(.+)\s+-\s+\[\[(?:people|person)\/([^\]|]+)(?:\|[^\]]*)?\]\]/;
const sourceInLine = /\[\[(?:sources|source)\/([^\]|]+)(?:\|[^\]]*)?\]\]/g;
// Wikilink a una persona citada DENTRO del texto de la frase, que no es la
// atribucion final. Se quita del texto para que el QuoteCard no lo vuelva a
// renderizar como entidad (y para no contarlo como fuente).
const inlinePersonLink = /\[\[(?:people|person|org|organizations?)\/[^\]|]+(?:\|[^\]]*)?\]\]/g;
// "> " a secas: separador de parrafo dentro de un blockquote multilinea.
const isBlankQuoteLine = (line: string) => /^>\s*$/.test(line);

function extractQuotesFromFile(filePath: string): QuoteEntry[] {
  const content = readFileSync(filePath, 'utf8');
  const eventId = eventIdFromPath(filePath);
  const quotes: QuoteEntry[] = [];

  // `\r?` es imprescindible: la mayoria de los eventos estan en CRLF y con el
  // patron estricto (solo LF) se descartaban enteros, con sus citas.
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) return quotes;

  const fm = YAML.parse(fmMatch[1]);
  const fecha = fm.fecha ?? '';
  const titulo = fm.titulo ?? '';

  const body = content.slice(fmMatch[0].length);
  const lines = body.split('\n');

  // Una cita puede ocupar VARIAS lineas de blockquote:
  //
  //   > Parrafo uno de la declaracion.
  //   >
  //   > Parrafo dos.
  //   > - [[people/id]] [[sources/id]]
  //
  // Es una sola cita cuya atribucion va en la ultima linea. Sin acumular el
  // grupo, cada linea se evaluaba por separado y solo sobrevivia la que llevaba
  // la atribucion: de "Con @mbachelet hemos escrito... / Invitamos al
  // Presidente... / Un abrazo" solo se mostraba "Un abrazo".
  //
  // Reglas de agrupacion:
  // - Es grupo toda racha consecutiva de lineas que empiezan por '>'. Una linea
  //   vacia (sin '>') CIERRA el grupo, de modo que dos citas separadas por una
  //   linea en blanco siguen siendo dos citas.
  // - Una linea '>' sola es un separador de parrafo dentro del grupo, no un corte.
  // - Una linea con atribucion CIERRA la cita en curso. Asi, dos citas pegadas
  //   (cada una con su atribucion) siguen siendo dos, y una cita larga con
  //   vinetas se mantiene junta.
  let buffer: string[] = [];

  const flush = () => {
    if (!buffer.length) return;
    const pending = buffer;
    buffer = [];
    // Ultima linea del grupo con atribucion: cierra la cita.
    const attrIdx = pending.map((l) => quoteLineRe.test(l)).lastIndexOf(true);
    if (attrIdx < 0) return;
    const attrLine = pending[attrIdx];
    const personId = attrLine.match(quoteLineRe)![2];
    const sources = [...attrLine.matchAll(sourceInLine)].map((x) => x[1]);

    // Texto = todo el grupo hasta la atribucion. El texto de esa ultima linea
    // es lo que queda ANTES del guion de la atribucion.
    const parrafos: string[] = [];
    for (let i = 0; i < attrIdx; i++) parrafos.push(pending[i].replace(/^>\s?/, '').trim());
    const ultimo = attrLine.match(quoteLineRe)![1].trim();
    if (ultimo) parrafos.push(ultimo);

    // Se limpian los wikilinks a personas citadas DENTRO de la frase (no la
    // atribucion) y se colapsa el espacio de cada parrafo. Los parrafos se
    // conservan separados por \n\n para que el render los muestre como parrafos.
    const text = parrafos
      .map((p) => p.replace(inlinePersonLink, '').replace(/[ \t]{2,}/g, ' ').trim())
      .filter(Boolean)
      .join('\n\n');

    if (!text) return;
    quotes.push({
      personId,
      text,
      eventId,
      fecha,
      titulo,
      sources,
      line: attrIdx,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('>')) {
      buffer.push(line);
      // Una atribucion presente cierra la cita; la siguiente linea '>' empieza
      // una nueva. Las lineas '>' vacias se ignoran como separador.
      if (quoteLineRe.test(line) && !isBlankQuoteLine(line)) flush();
      continue;
    }
    flush();
  }
  flush();

  return quotes;
}

let quotesCache: Map<string, QuoteEntry[]> | null = null;

export function getQuotesMap(): Map<string, QuoteEntry[]> {
  if (quotesCache) return quotesCache;
  quotesCache = new Map();
  for (const file of walkMd(eventsDir)) {
    for (const quote of extractQuotesFromFile(file)) {
      const existing = quotesCache.get(quote.personId) ?? [];
      existing.push(quote);
      quotesCache.set(quote.personId, existing);
    }
  }
  for (const [, quotes] of quotesCache) {
    quotes.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }
  return quotesCache;
}

export function getQuotesForPerson(personId: string): QuoteEntry[] {
  return getQuotesMap().get(personId) ?? [];
}

let _sourceToEventsCache: Map<string, string[]> | null = null;

export function getSourceToEventsMap(): Map<string, string[]> {
  if (_sourceToEventsCache) return _sourceToEventsCache;
  _sourceToEventsCache = new Map();
  for (const [eventId, entities] of getEntityMap()) {
    for (const sourceId of entities.fuentes) {
      const events = _sourceToEventsCache.get(sourceId);
      if (events) {
        events.push(eventId);
      } else {
        _sourceToEventsCache.set(sourceId, [eventId]);
      }
    }
  }
  return _sourceToEventsCache;
}
