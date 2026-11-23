import type { APIRoute } from 'astro';
import { getAllEvents, getAllOrganizations, eventHasOrg } from '../../lib/queries';
import { getCabinetByMinistry, periodoDe } from '../../lib/cabinet';

export const GET: APIRoute = async () => {
  const [orgs, events] = await Promise.all([getAllOrganizations(), getAllEvents()]);
  const cabinet = new Map(getCabinetByMinistry().map((c) => [c.ministerioId, c]));

  const eventsById: Record<string, { titulo: string; href: string }> = {};
  for (const e of events) {
    const id = e.id.split('/').pop() ?? e.id;
    const d = new Date(e.data.fecha);
    const year = Number.isNaN(d.getTime()) ? 0 : d.getFullYear();
    eventsById[id] = { titulo: e.data.titulo, href: `/events/${year}/${id}` };
  }

  const data = orgs.map((org) => {
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
      eventIds: events.filter((e) => eventHasOrg(e.id, org.id)).map((e) => e.id),
    };
  });

  return new Response(JSON.stringify({ data, eventsById }), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
