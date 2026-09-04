import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

export type CargoEntry = {
  cargo: string;
  organizacion?: string;
  desde?: string;
  hasta?: string;
};

type EntityData = {
  nombre: string;
  cargo?: string;
  organizacion?: string;
  cargos?: CargoEntry[];
  tipo?: string;
  pais?: string;
  notas?: string;
  bio?: string;
  aliases?: string[];
};

type TopicData = {
  nombre: string;
  descripcion?: string;
  relacionados?: string[];
  bio?: string;
};

export type RegistryEntry = {
  id: string;
  data: EntityData;
};

export type TopicRegistryEntry = {
  id: string;
  data: TopicData;
};

export type SourceData = {
  tipo: string;
  medio: string;
  titulo: string;
  autor: string;
  fecha: Date;
  url?: string;
};

export type SourceReference = string | SourceData;

const contentDir = join(process.cwd(), 'src', 'content');

function readMarkdownCollection<T>(collection: string): Record<string, T> | null {
  const dir = join(contentDir, collection);
  if (!existsSync(dir)) return null;
  let files: string[] = [];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.md'));
  } catch {
    return null;
  }
  if (files.length === 0) return null;
  const record: Record<string, T> = {};
  for (const file of files) {
    const id = file.replace(/\.md$/, '');
    try {
      const raw = readFileSync(join(dir, file), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (!m) continue;
      const data = YAML.parse(m[1]) as T;
      record[id] = data;
    } catch {
      // skip corrupt
    }
  }
  return Object.keys(record).length ? record : null;
}

function toEntries(record: Record<string, EntityData> = {}): RegistryEntry[] {
  return Object.entries(record)
    .map(([id, data]) => ({ id, data }))
    .sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'));
}

let _peopleEntriesCache: RegistryEntry[] | null = null;
let _orgEntriesCache: RegistryEntry[] | null = null;

export function getPeopleRegistry(): RegistryEntry[] {
  if (!_peopleEntriesCache) {
    const md = readMarkdownCollection<EntityData>('people');
    if (!md) throw new Error('src/content/people/*.md no encontrado o vacío');
    _peopleEntriesCache = toEntries(md);
  }
  return _peopleEntriesCache;
}

export function getOrganizationsRegistry(): RegistryEntry[] {
  if (!_orgEntriesCache) {
    const md = readMarkdownCollection<EntityData>('organizations');
    if (!md) throw new Error('src/content/organizations/*.md no encontrado o vacío');
    _orgEntriesCache = toEntries(md);
  }
  return _orgEntriesCache;
}

export function getPersonRegistryById(id: string): RegistryEntry | undefined {
  return getPeopleRegistry().find((person) => person.id === id);
}

export function getOrganizationRegistryById(id: string): RegistryEntry | undefined {
  return getOrganizationsRegistry().find((org) => org.id === id);
}

let _topicsEntriesCache: TopicRegistryEntry[] | null = null;

export function getTopicsRegistry(): TopicRegistryEntry[] {
  if (!_topicsEntriesCache) {
    const md = readMarkdownCollection<TopicData>('topics');
    if (!md) throw new Error('src/content/topics/*.md no encontrado o vacío');
    const topics = md;
    _topicsEntriesCache = Object.entries(topics)
      .map(([id, data]) => ({ id, data }))
      .sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'));
  }
  return _topicsEntriesCache;
}

export function getTopicRegistryById(id: string): TopicRegistryEntry | undefined {
  const md = readMarkdownCollection<TopicData>('topics');
  if (!md) return undefined;
  const data = md[id];
  return data ? { id, data } : undefined;
}

let _sourcesCache: Record<string, SourceData> | null = null;

export function getSourcesRegistry(): Record<string, SourceData> {
  if (!_sourcesCache) {
    const md = readMarkdownCollection<Omit<SourceData, 'fecha'> & { fecha: string | Date; notas?: string }>('sources');
    if (!md) throw new Error('src/content/sources/*.md no encontrado o vacío');
    const raw: Record<string, Omit<SourceData, 'fecha'> & { fecha: string | Date; notas?: string }> = md;
    _sourcesCache = Object.fromEntries(
      Object.entries(raw).map(([id, source]) => [
        id,
        { ...source, fecha: new Date(source.fecha as string | Date) },
      ])
    );
  }
  return _sourcesCache;
}

export function resolveReferences(references: SourceReference[] = []): SourceData[] {
  const sources = getSourcesRegistry();
  return references.map((reference) => {
    if (typeof reference !== 'string') return reference;
    return sources[reference] ?? {
      tipo: 'documento',
      medio: 'Referencia no registrada',
      titulo: reference,
      autor: '',
      fecha: new Date(0),
    };
  });
}
