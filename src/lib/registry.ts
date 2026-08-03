import { readFileSync } from 'node:fs';
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

const yamlCache = new Map<string, unknown>();

function readYaml<T>(filename: string): T {
  if (!yamlCache.has(filename)) {
    yamlCache.set(filename, YAML.parse(readFileSync(join(dataDir, filename), 'utf8')));
  }
  return yamlCache.get(filename) as T;
}

function toEntries(record: Record<string, EntityData> = {}): RegistryEntry[] {
  return Object.entries(record)
    .map(([id, data]) => ({ id, data }))
    .sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'));
}

function entities(): EntitiesFile {
  return readYaml<EntitiesFile>('entities.yaml');
}

export function getPeopleRegistry(): RegistryEntry[] {
  return toEntries(entities().people);
}

export function getOrganizationsRegistry(): RegistryEntry[] {
  return toEntries(entities().organizations);
}

export function getPersonRegistryById(id: string): RegistryEntry | undefined {
  return getPeopleRegistry().find((person) => person.id === id);
}

export function getOrganizationRegistryById(id: string): RegistryEntry | undefined {
  return getOrganizationsRegistry().find((org) => org.id === id);
}

export function getTopicsRegistry(): TopicRegistryEntry[] {
  const topics = readYaml<Record<string, TopicData>>('topics.yaml');
  return Object.entries(topics)
    .map(([id, data]) => ({ id, data }))
    .sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'));
}

export function getTopicRegistryById(id: string): TopicRegistryEntry | undefined {
  const topics = readYaml<Record<string, TopicData>>('topics.yaml');
  const data = topics[id];
  return data ? { id, data } : undefined;
}

export function getSourcesRegistry(): Record<string, SourceData> {
  const sources = readYaml<Record<string, Omit<SourceData, 'fecha'> & { fecha: string | Date }>>(
    'sources.yaml'
  );

  return Object.fromEntries(
    Object.entries(sources).map(([id, source]) => [
      id,
      { ...source, fecha: new Date(source.fecha) },
    ])
  );
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
