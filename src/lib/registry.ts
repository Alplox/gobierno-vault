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

type EntitiesFile = {
  people?: Record<string, EntityData>;
  organizations?: Record<string, EntityData>;
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

const dataDir = join(process.cwd(), 'src', 'data');
const contentDir = join(process.cwd(), 'src', 'content');

const yamlCache = new Map<string, unknown>();

function readYaml<T>(filename: string): T {
  if (!yamlCache.has(filename)) {
    yamlCache.set(filename, YAML.parse(readFileSync(join(dataDir, filename), 'utf8')));
  }
  return yamlCache.get(filename) as T;
}

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

function entities(): EntitiesFile {
  return readYaml<EntitiesFile>('entities.yaml');
}

export function getPeopleRegistry(): RegistryEntry[] {
  if (!_peopleEntriesCache) {
    const md = readMarkdownCollection<EntityData>('people');
    if (md) _peopleEntriesCache = toEntries(md);
    else _peopleEntriesCache = toEntries(entities().people);
  }
  return _peopleEntriesCache;
}

export function getOrganizationsRegistry(): RegistryEntry[] {
  if (!_orgEntriesCache) {
    const md = readMarkdownCollection<EntityData>('organizations');
    if (md) _orgEntriesCache = toEntries(md);
    else _orgEntriesCache = toEntries(entities().organizations);
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
    const topics = md ?? readYaml<Record<string, TopicData>>('topics.yaml');
    _topicsEntriesCache = Object.entries(topics)
      .map(([id, data]) => ({ id, data }))
      .sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'));
  }
  return _topicsEntriesCache;
}

export function getTopicRegistryById(id: string): TopicRegistryEntry | undefined {
  const md = readMarkdownCollection<TopicData>('topics');
  if (md) {
    const data = md[id];
    return data ? { id, data } : undefined;
  }
  const topics = readYaml<Record<string, TopicData>>('topics.yaml');
  const data = topics[id];
  return data ? { id, data } : undefined;
}

let _sourcesCache: Record<string, SourceData> | null = null;

export function getSourcesRegistry(): Record<string, SourceData> {
  if (!_sourcesCache) {
    const md = readMarkdownCollection<Omit<SourceData, 'fecha'> & { fecha: string | Date; notas?: string }>('sources');
    const raw: Record<string, Omit<SourceData, 'fecha'> & { fecha: string | Date; notas?: string }> =
      md ?? readYaml<Record<string, Omit<SourceData, 'fecha'> & { fecha: string | Date }>>('sources.yaml');
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
