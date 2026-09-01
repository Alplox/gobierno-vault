import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { getCollection } from 'astro:content';
import {
  getOrganizationsRegistry,
  getPeopleRegistry,
  getTopicsRegistry,
  getTopicRegistryById,
} from './registry';
import {
  getAllPeopleIds,
  getAllOrgIds,
  getEntitiesForEvent,
  getAllCifras,
  getQuotesForPerson,
  type CifraEntry,
  type QuoteEntry,
} from './extractEntities';

function basename(entryId: string): string {
  return entryId.split('/').pop() ?? entryId;
}

let _allEventsCache: Awaited<ReturnType<typeof getCollection>> | null = null;

export async function getAllEvents() {
  if (_allEventsCache) return _allEventsCache;
  const events = await getCollection('events');
  _allEventsCache = events.sort(
    (a, b) => new Date(b.data.fecha).getTime() - new Date(a.data.fecha).getTime()
  );
  return _allEventsCache;
}

export async function getEventsByYear(year: string) {
  const events = await getAllEvents();
  return events.filter((e) => new Date(e.data.fecha).getFullYear().toString() === year);
}

export async function getEventByFilename(filename: string) {
  const events = await getAllEvents();
  return events.find((e) => basename(e.id) === filename);
}

export async function getAllPeople() {
  return getPeopleRegistry();
}

export async function getPersonById(id: string) {
  return getPeopleRegistry().find((p) => p.id === id);
}

export async function getAllOrganizations() {
  return getOrganizationsRegistry();
}

export async function getOrganizationById(id: string) {
  return getOrganizationsRegistry().find((o) => o.id === id);
}

export async function getAllTopics() {
  return getTopicsRegistry();
}

export async function getTopicById(id: string) {
  return getTopicRegistryById(id);
}

export async function getUniqueTopics(): Promise<string[]> {
  const events = await getAllEvents();
  const ids = new Set<string>();
  for (const e of events) {
    for (const t of e.data.tema) ids.add(t);
  }
  return [...ids].sort();
}

// ponytail: people and orgs are extracted from [[people/...]] and [[organizations/...]] in body text
export { getAllPeopleIds as getUniquePeople };
export { getAllOrgIds as getUniqueOrgs };

export async function getPeopleMap(): Promise<Map<string, string>> {
  const people = getPeopleRegistry();
  const map = new Map<string, string>();
  for (const p of people) map.set(p.id, p.data.nombre);
  return map;
}

export async function getTopicsMap(): Promise<Map<string, string>> {
  const topics = getTopicsRegistry();
  const map = new Map<string, string>();
  for (const t of topics) map.set(t.id, t.data.nombre);
  return map;
}

export async function getOrgsMap(): Promise<Map<string, string>> {
  const orgs = getOrganizationsRegistry();
  const map = new Map<string, string>();
  for (const o of orgs) map.set(o.id, o.data.nombre);
  return map;
}

export function getEventEntities(eventId: string) {
  return getEntitiesForEvent(eventId);
}

export function eventHasPerson(eventId: string, personId: string): boolean {
  return getEntitiesForEvent(eventId).personas.includes(personId);
}

export function eventHasOrg(eventId: string, orgId: string): boolean {
  return getEntitiesForEvent(eventId).organizaciones.includes(orgId);
}

type CifraRegistryEntry = {
  nombre: string;
  unidad_default: string;
};

let cifrasRegistryCache: Record<string, CifraRegistryEntry> | null = null;

function readCifrasFallback(): Record<string, CifraRegistryEntry> | null { try { const dir = join(process.cwd(), 'src', 'content', 'cifras'); if (!existsSync(dir)) return null; const rec: Record<string, CifraRegistryEntry> = {}; for (const f of readdirSync(dir).filter(f=>f.endsWith('.md'))) { const id=f.replace(/\.md$/,''); const raw=readFileSync(join(dir,f),'utf8'); const m=raw.match(/^---\r?\n([\s\S]*?)\r?\n---/); if(m) rec[id]=YAML.parse(m[1]); } return Object.keys(rec).length?rec:null; } catch { return null; } }
export function getCifrasRegistry(): Record<string, CifraRegistryEntry> {
  if (!cifrasRegistryCache) {
    const md = readCifrasFallback();
    if (md) cifrasRegistryCache = md;
    else {
      const entities = YAML.parse(readFileSync(join(process.cwd(), 'src', 'data', 'entities.yaml'), 'utf8'));
      cifrasRegistryCache = entities.cifras ?? {};
    }
  }
  return cifrasRegistryCache!;
}

export { getAllCifras, getQuotesForPerson };
export type { CifraEntry, QuoteEntry };
