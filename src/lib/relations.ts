import type { CollectionEntry } from 'astro:content';

type EventEntry = CollectionEntry<'events'>;

export const RELATION_LABELS: Record<string, string> = {
  contradice: 'Contradice',
  confirma: 'Confirma',
  cumple: 'Cumple',
  incumple: 'Incumple',
  amplia: 'Amplia',
  corrige: 'Corrige',
  rectifica: 'Rectifica',
  responde_a: 'Responde a',
  deriva_en: 'Deriva en',
  provoca: 'Provoca',
  cita: 'Cita',
  reemplaza: 'Reemplaza',
  actualiza: 'Actualiza',
  mismo_contexto: 'Mismo contexto',
};

export const RELATION_CHIP_CLASS: Record<string, string> = {
  contradice: 'bg-red-50 text-red-800 ring-red-200/80',
  confirma: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  cumple: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  incumple: 'bg-red-50 text-red-800 ring-red-200/80',
  amplia: 'bg-sky-50 text-sky-800 ring-sky-200/80',
  corrige: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  rectifica: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  responde_a: 'bg-violet-50 text-violet-800 ring-violet-200/80',
  deriva_en: 'bg-indigo-50 text-indigo-800 ring-indigo-200/80',
  provoca: 'bg-orange-50 text-orange-800 ring-orange-200/80',
  cita: 'bg-gray-100 text-gray-700 ring-gray-200/80',
  reemplaza: 'bg-cyan-50 text-cyan-800 ring-cyan-200/80',
  actualiza: 'bg-blue-50 text-blue-800 ring-blue-200/80',
  mismo_contexto: 'bg-gray-100 text-gray-600 ring-gray-200/80',
};

export const DEFAULT_RELATION_CHIP = 'bg-gray-100 text-gray-700 ring-gray-200/80';

export type RelationEdge = {
  tipo: string;
  eventId: string;
  titulo: string;
  fecha: Date;
  year: number;
  direction: 'outgoing' | 'incoming';
};

export type InferredEdge = {
  eventId: string;
  titulo: string;
  fecha: Date;
  year: number;
  sharedTemas: string[];
  sharedEtiquetas: string[];
};

export type EventConnections = {
  outgoing: RelationEdge[];
  incoming: RelationEdge[];
  inferred: InferredEdge[];
};

export function eventBasename(entryId: string): string {
  return entryId.split('/').pop() ?? entryId;
}

export function eventYearFromDate(fecha: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Santiago',
      year: 'numeric',
    }).format(fecha)
  );
}

export function buildEventsByBasename(events: EventEntry[]): Map<string, EventEntry> {
  const map = new Map<string, EventEntry>();
  for (const event of events) {
    map.set(eventBasename(event.id), event);
  }
  return map;
}

function toEdge(
  tipo: string,
  target: EventEntry,
  direction: RelationEdge['direction']
): RelationEdge {
  return {
    tipo,
    eventId: eventBasename(target.id),
    titulo: target.data.titulo,
    fecha: target.data.fecha,
    year: eventYearFromDate(target.data.fecha),
    direction,
  };
}

export function getOutgoingEdges(
  event: EventEntry,
  eventsByBasename: Map<string, EventEntry>
): RelationEdge[] {
  const relaciones = event.data.relaciones ?? {};
  const edges: RelationEdge[] = [];

  for (const [tipo, targets] of Object.entries(relaciones)) {
    const ids = Array.isArray(targets) ? targets : [targets];
    for (const targetId of ids) {
      const target = eventsByBasename.get(targetId);
      if (!target) continue;
      edges.push(toEdge(tipo, target, 'outgoing'));
    }
  }

  return edges;
}

export function buildIncomingIndex(events: EventEntry[]): Map<string, Array<{ fromId: string; tipo: string }>> {
  const index = new Map<string, Array<{ fromId: string; tipo: string }>>();
  for (const event of events) {
    const fromId = eventBasename(event.id);
    for (const [tipo, targets] of Object.entries(event.data.relaciones ?? {})) {
      const ids = Array.isArray(targets) ? targets : [targets];
      for (const targetId of ids) {
        if (!index.has(targetId)) index.set(targetId, []);
        index.get(targetId)!.push({ fromId, tipo });
      }
    }
  }
  return index;
}

export function getIncomingEdges(
  eventId: string,
  eventsByBasename: Map<string, EventEntry>,
  incomingIndex: Map<string, Array<{ fromId: string; tipo: string }>>
): RelationEdge[] {
  const refs = incomingIndex.get(eventId) ?? [];
  return refs
    .map(({ fromId, tipo }) => {
      const source = eventsByBasename.get(fromId);
      if (!source) return null;
      return toEdge(tipo, source, 'incoming');
    })
    .filter((edge): edge is RelationEdge => edge !== null)
    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
}

function scoreSharedContext(a: EventEntry, b: EventEntry): InferredEdge | null {
  const sharedTemas = a.data.tema.filter((t) => b.data.tema.includes(t));
  const sharedEtiquetas = a.data.etiquetas.filter((t) => b.data.etiquetas.includes(t));
  const score = sharedTemas.length * 2 + sharedEtiquetas.length;
  if (score < 2) return null;

  return {
    eventId: eventBasename(b.id),
    titulo: b.data.titulo,
    fecha: b.data.fecha,
    year: eventYearFromDate(b.data.fecha),
    sharedTemas,
    sharedEtiquetas,
  };
}

export function getInferredEdges(
  event: EventEntry,
  allEvents: EventEntry[],
  explicitIds: Set<string>,
  limit = 4
): InferredEdge[] {
  const selfId = eventBasename(event.id);
  const inferred: InferredEdge[] = [];

  for (const other of allEvents) {
    const otherId = eventBasename(other.id);
    if (otherId === selfId || explicitIds.has(otherId)) continue;
    const edge = scoreSharedContext(event, other);
    if (edge) inferred.push(edge);
  }

  return inferred
    .sort((a, b) => {
      const scoreA = a.sharedTemas.length * 2 + a.sharedEtiquetas.length;
      const scoreB = b.sharedTemas.length * 2 + b.sharedEtiquetas.length;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.fecha.getTime() - a.fecha.getTime();
    })
    .slice(0, limit);
}

export function getEventConnections(
  event: EventEntry,
  allEvents: EventEntry[],
  eventsByBasename: Map<string, EventEntry>,
  incomingIndex: Map<string, Array<{ fromId: string; tipo: string }>>
): EventConnections {
  const eventId = eventBasename(event.id);
  const outgoing = getOutgoingEdges(event, eventsByBasename);
  const incoming = getIncomingEdges(eventId, eventsByBasename, incomingIndex);
  const explicitIds = new Set([
    ...outgoing.map((e) => e.eventId),
    ...incoming.map((e) => e.eventId),
  ]);
  const inferred = getInferredEdges(event, allEvents, explicitIds);

  return { outgoing, incoming, inferred };
}

export function countExplicitConnections(connections: EventConnections): number {
  return connections.outgoing.length + connections.incoming.length;
}

export function buildConnectionIndex(allEvents: EventEntry[]): Map<string, EventConnections> {
  const signature = allEvents.map((e) => eventBasename(e.id)).join(',');
  if (connectionIndexCache?.signature === signature) return connectionIndexCache.index;
  const eventsByBasename = buildEventsByBasename(allEvents);
  const incomingIndex = buildIncomingIndex(allEvents);
  const index = new Map<string, EventConnections>();

  for (const event of allEvents) {
    index.set(
      eventBasename(event.id),
      getEventConnections(event, allEvents, eventsByBasename, incomingIndex)
    );
  }

  connectionIndexCache = { signature, index };
  return index;
}

let connectionIndexCache: { signature: string; index: Map<string, EventConnections> } | null = null;

export function formatRelationSummary(edge: RelationEdge): string {
  const label = RELATION_LABELS[edge.tipo] ?? edge.tipo;
  return `${label}: ${edge.titulo}`;
}

export function inferredToEdge(edge: InferredEdge): RelationEdge {
  return {
    tipo: 'mismo_contexto',
    eventId: edge.eventId,
    titulo: edge.titulo,
    fecha: edge.fecha,
    year: edge.year,
    direction: 'outgoing',
  };
}
