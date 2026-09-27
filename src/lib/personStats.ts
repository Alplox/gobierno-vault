// Panorama de una persona: indice invertido persona -> eventos y estadisticas
// derivadas (actividad por ano, reparto por tipo, temas, organizaciones,
// co-apariciones y declaraciones). Todo se calcula en build; no hay runtime.
//
// Por que un indice invertido: `/people/[id]` se genera para las ~2.500 fichas
// y antes cada una filtraba `getAllEvents()` completa (1.543 x 2.500 lecturas).
// El indice se construye una vez por build y cada ficha lee su lista en O(1).

import type { CollectionEntry } from 'astro:content';
import {
  getAllEvents,
  getEventEntities,
  getQuotesForPerson,
  getPeopleMap,
  getTopicsMap,
  getOrgsMap,
  type QuoteEntry,
} from './queries';
import { getSourcesRegistry } from './registry';
import { eventYearFromDate } from './relations';

type EventEntry = CollectionEntry<'events'>;

export type Bucket<T> = { id: T; n: number };
export type NamedCount = { id: string; nombre: string; n: number };

export type YearBucket = {
  year: number;
  total: number;
  citas: number;
  /** Reparto por tipo dentro del ano, de mayor a menor. */
  tipos: { tipo: string; n: number }[];
};

export type PersonPanorama = {
  personId: string;
  /** Eventos de la persona, del mas reciente al mas antiguo. */
  events: EventEntry[];
  total: number;
  /** Fechas extremas dentro del vault (no son las de la vida de la persona). */
  first: Date | null;
  last: Date | null;
  yearFrom: number | null;
  yearTo: number | null;
  /** Anos con al menos un evento, ascendente. */
  years: YearBucket[];
  porTipo: Bucket<string>[];
  temas: NamedCount[];
  etiquetas: Bucket<string>[];
  orgs: NamedCount[];
  /** Otras personas con las que comparte eventos, de mas a menos. */
  coPeople: NamedCount[];
  citas: QuoteEntry[];
  /** Declaraciones por ano (misma clave de ano que `years`). */
  citasPorAnio: Map<number, number>;
  /** Dias distintos con actividad registrada. */
  diasActivos: number;
  /** Eventos por ano con actividad (promedio, 1 decimal). */
  mediaAnual: number;
  /** Anos consecutivos con actividad hasta el ultimo registrado. */
  racha: number;
  /** Eventos de tipo `declaracion` o `entrevista` (voz propia). */
  vozPropia: number;
  /** Total de fuentes citadas en sus eventos (con repeticion). */
  fuentesTotales: number;
  /** Medios distintos que cubrieron su actividad. */
  mediosDistintos: number;
};

type MetaEntry = {
  personas: string[];
  organizaciones: string[];
  fuentes: string[];
};

let _byPerson: Map<string, EventEntry[]> | null = null;
let _metaByPerson: Map<string, MetaEntry> | null = null;
let _allEvents: EventEntry[] = [];

const ymdFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Santiago',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function ymd(fecha: Date): string {
  return ymdFmt.format(fecha);
}

function build(): void {
  const byPerson = new Map<string, EventEntry[]>();
  const meta = new Map<string, MetaEntry>();
  for (const event of _allEvents) {
    const e = getEventEntities(event.id);
    if (!e.personas.length) continue;
    meta.set(event.id, {
      personas: e.personas,
      organizaciones: e.organizaciones,
      fuentes: e.fuentes,
    });
    for (const pid of e.personas) {
      const arr = byPerson.get(pid);
      if (arr) arr.push(event);
      else byPerson.set(pid, [event]);
    }
  }
  _byPerson = byPerson;
  _metaByPerson = meta;
}

// El indice necesita `getAllEvents()` (async). `primePersonIndex()` lo resuelve
// una sola vez por build y guarda el resultado para las lecturas sincronas;
// todas las funciones de este modulo lo llaman primero.
let _seeded = false;
export async function primePersonIndex(): Promise<void> {
  if (_seeded) return;
  _seeded = true;
  _allEvents = await getAllEvents();
  build();
}

function ensure(): void {
  if (!_byPerson) build();
}

function bump(map: Map<string, number>, key: string, by = 1): void {
  map.set(key, (map.get(key) ?? 0) + by);
}

function topN<T extends { n: number }>(entries: T[], n: number): T[] {
  return entries
    .sort((a, b) => b.n - a.n || String(a.id).localeCompare(String(b.id), 'es'))
    .slice(0, n);
}

export async function getPersonPanorama(personId: string): Promise<PersonPanorama> {
  await primePersonIndex();
  ensure();
  const events = _byPerson!.get(personId) ?? [];
  const meta = _metaByPerson!;

  const [peopleMap, topicsMap, orgsMap] = await Promise.all([
    getPeopleMap(),
    getTopicsMap(),
    getOrgsMap(),
  ]);
  const sources = getSourcesRegistry();

  const porTipo = new Map<string, number>();
  const temas = new Map<string, number>();
  const etiquetas = new Map<string, number>();
  const orgs = new Map<string, number>();
  const coPeople = new Map<string, number>();
  const anios = new Map<number, { total: number; tipos: Map<string, number> }>();
  const dias = new Set<string>();
  const medios = new Set<string>();
  let fuentesTotales = 0;
  let vozPropia = 0;

  for (const event of events) {
    const m = meta.get(event.id);
    const year = eventYearFromDate(event.data.fecha);
    const tipo = event.data.tipo;

    bump(porTipo, tipo);
    if (tipo === 'declaracion' || tipo === 'entrevista') vozPropia++;
    dias.add(ymd(event.data.fecha));
    for (const src of m?.fuentes ?? []) {
      fuentesTotales++;
      medios.add(sources[src]?.medio || src);
    }

    let bucket = anios.get(year);
    if (!bucket) {
      bucket = { total: 0, tipos: new Map() };
      anios.set(year, bucket);
    }
    bucket.total++;
    bump(bucket.tipos, tipo);

    for (const t of event.data.tema) bump(temas, t);
    for (const tag of event.data.etiquetas ?? []) bump(etiquetas, tag);
    for (const o of m?.organizaciones ?? []) bump(orgs, o);
    for (const other of m?.personas ?? []) {
      if (other !== personId) bump(coPeople, other);
    }
  }

  const citas = [...getQuotesForPerson(personId)].sort((a, b) => b.fecha.localeCompare(a.fecha));
  const citasPorAnio = new Map<number, number>();
  for (const q of citas) {
    const y = eventYearFromDate(new Date(q.fecha));
    if (!Number.isNaN(y)) bump(citasPorAnio, y, 1);
  }

  const years: YearBucket[] = [...anios.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, b]) => ({
      year,
      total: b.total,
      citas: citasPorAnio.get(year) ?? 0,
      tipos: [...b.tipos.entries()]
        .map(([tipo, n]) => ({ tipo, n }))
        .sort((a, b2) => b2.n - a.n || a.tipo.localeCompare(b2.tipo)),
    }));

  // Racha: anos consecutivos con actividad, contando hacia atras desde el ultimo.
  let racha = 0;
  for (let i = years.length - 1; i >= 0; i--) {
    if (i === years.length - 1 || years[i].year === years[i + 1].year + 1) racha++;
    else break;
  }

  return {
    personId,
    events,
    total: events.length,
    first: events[events.length - 1]?.data.fecha ?? null,
    last: events[0]?.data.fecha ?? null,
    yearFrom: years[0]?.year ?? null,
    yearTo: years[years.length - 1]?.year ?? null,
    years,
    porTipo: topN([...porTipo.entries()].map(([id, n]) => ({ id, n })), 20),
    temas: topN([...temas.entries()].map(([id, n]) => ({ id, nombre: topicsMap.get(id) ?? id, n })), 8),
    etiquetas: topN([...etiquetas.entries()].map(([id, n]) => ({ id, n })), 10),
    orgs: topN([...orgs.entries()].map(([id, n]) => ({ id, nombre: orgsMap.get(id) ?? id, n })), 10),
    coPeople: topN(
      [...coPeople.entries()].map(([id, n]) => ({ id, nombre: peopleMap.get(id) ?? id, n })),
      14
    ),
    citas,
    citasPorAnio,
    diasActivos: dias.size,
    mediaAnual: years.length ? Math.round((events.length / years.length) * 10) / 10 : 0,
    racha,
    vozPropia,
    fuentesTotales,
    mediosDistintos: medios.size,
  };
}

/** Conteo de eventos por persona para el indice `/people`. */
export async function getPersonEventCounts(): Promise<Map<string, number>> {
  await primePersonIndex();
  ensure();
  const out = new Map<string, number>();
  for (const [pid, list] of _byPerson!) out.set(pid, list.length);
  return out;
}

/** Eventos agrupados por ano (descendente) para el listado filtrable. */
export function groupEventsByYear(events: EventEntry[]): { year: number; events: EventEntry[] }[] {
  const map = new Map<number, EventEntry[]>();
  for (const e of events) {
    const y = eventYearFromDate(e.data.fecha);
    const arr = map.get(y);
    if (arr) arr.push(e);
    else map.set(y, [e]);
  }
  return [...map.entries()].sort((a, b) => b[0] - a[0]).map(([year, list]) => ({ year, events: list }));
}
