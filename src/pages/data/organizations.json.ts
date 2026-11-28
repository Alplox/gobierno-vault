import type { APIRoute } from 'astro';
import {
  getAllEvents,
  getAllOrganizations,
  eventHasOrg,
  getEventEntities,
  getPeopleMap,
  getTopicsMap,
} from '../../lib/queries';
import { getCabinetByMinistry, periodoDe } from '../../lib/cabinet';
import { eventBasename, eventYearFromDate } from '../../lib/relations';
import { TIPO_LABELS } from '../../lib/eventTypes';

type OrgEvent = {
  id: string; titulo: string; href: string; ts: number;
  year: number; month: number; fechaStr: string;
  tipo: string; temas: string[]; etiquetas: string[]; search: string;
};

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export const GET: APIRoute = async () => {
  const [orgs, events, peopleMap, topicsMap] = await Promise.all([
    getAllOrganizations(), getAllEvents(), getPeopleMap(), getTopicsMap(),
  ]);
  const cabinet = new Map(getCabinetByMinistry().map((c) => [c.ministerioId, c]));

  // Una sola pasada por organización: reutiliza el resultado para armar eventIds
  // y para saber qué eventos hay que serializar (evita repetir eventHasOrg).
  const orgEvents = orgs.map((org) => events.filter((e) => eventHasOrg(e.id, org.id)));
  const referenced = new Set<string>();
  for (const list of orgEvents) for (const e of list) referenced.add(e.id);

  const eventsById: Record<string, OrgEvent> = {};
  const topics: Record<string, string> = {};
  for (const e of events) {
    if (!referenced.has(e.id)) continue;
    const id = eventBasename(e.id);
    const d = new Date(e.data.fecha);
    const valid = !Number.isNaN(d.getTime());
    const year = valid ? eventYearFromDate(d) : 0;
    const month = valid
      ? Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', month: '2-digit' }).format(d))
      : 0;
    const fechaStr = valid
      ? d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';
    const temaIds = e.data.tema ?? [];
    for (const t of temaIds) topics[t] = topicsMap.get(t) ?? t;
    const entities = getEventEntities(e.id);
    const etiquetas = e.data.etiquetas ?? [];
    const personas = entities.personas.map((p) => peopleMap.get(p) ?? p);
    const temasNombres = temaIds.map((t) => topicsMap.get(t) ?? t);
    // Mismos campos que EventCard.astro para que la búsqueda coincida con /events.
    const search = normalize(
      [e.data.titulo, ...etiquetas, ...personas, ...temasNombres,
        TIPO_LABELS[e.data.tipo] ?? e.data.tipo, id, fechaStr, year].join(' ')
    );
    eventsById[id] = {
      id,
      titulo: e.data.titulo,
      href: `/events/${year}/${id}`,
      ts: valid ? d.getTime() : 0,
      year,
      month,
      fechaStr,
      tipo: e.data.tipo,
      temas: temaIds,
      etiquetas,
      search,
    };
  }

  const data = orgs.map((org, i) => {
    const c = cabinet.get(org.id);
    return {
      id: org.id,
      nombre: org.data.nombre,
      tipo: org.data.tipo ?? '',
      pais: org.data.pais ?? '',
      bio: org.data.bio ?? '',
      titulares: (c?.todos ?? []).map((a) => ({
        nombre: a.nombre,
        personId: a.personId,
        cargo: a.cargo,
        periodo: periodoDe(a),
        actual: a === c?.actual,
        biministro: a.biministro,
        subrogante: a.subrogante,
      })),
      eventIds: orgEvents[i].map((e) => e.id),
    };
  });

  return new Response(JSON.stringify({ data, eventsById, topics }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
