import { getPeopleRegistry, getOrganizationsRegistry } from './registry';

/**
 * Nombramiento ministerial (ministro/a o biministro/a) de una persona.
 * `vigente` = sin fecha de término registrada.
 */
export type CabinetAppointment = {
  personId: string;
  nombre: string;
  cargo: string;
  ministerioId: string;
  ministerioNombre: string;
  desde?: string;
  hasta?: string;
  vigente: boolean;
  biministro: boolean;
  subrogante: boolean;
  fechasSinRegistrar: boolean; // cargo top-level sin fechas, sin org confiable
};

export type CabinetByMinistry = {
  ministerioId: string;
  ministerioNombre: string;
  actual?: CabinetAppointment;
  historico: CabinetAppointment[];
  todos: CabinetAppointment[];
};

// Alias de orgs duplicadas en entities.yaml → id canónico (para el fallback por org).
const ORG_ALIASES: Record<string, string> = {
  ministerio_obras_publicas: 'ministerio_de_obras_publicas',
  ministerio_del_interior: 'ministerio_interior',
  minsal: 'ministerio_salud',
};

// Org ids consideradas carteras ministeriales (tipo ministerio + segegob + desarrollo social).
const MINISTERIO_ORG_IDS = new Set([
  'ministerio_agricultura',
  'ministerio_bienes_nacionales',
  'ministerio_ciencia',
  'ministerio_culturas',
  'ministerio_defensa',
  'ministerio_desarrollo_social',
  'ministerio_del_deporte',
  'ministerio_economia',
  'ministerio_educacion',
  'ministerio_energia',
  'ministerio_hacienda',
  'ministerio_interior',
  'ministerio_justicia',
  'ministerio_medio_ambiente',
  'ministerio_mineria',
  'ministerio_mujer',
  'ministerio_de_obras_publicas',
  'ministerio_relaciones_exteriores',
  'ministerio_salud',
  'ministerio_seguridad',
  'ministerio_segpres',
  'ministerio_trabajo',
  'ministerio_transportes',
  'ministerio_vivienda',
  'segegob',
]);

// Helpers de fechas compartidos con las páginas (gabinete, org pages, people).
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function fechaEs(iso?: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m) return null;
  return d ? `${d} de ${MESES[m - 1]} de ${y}` : `${MESES[m - 1]} de ${y}`;
}

export function periodoDe(a: { desde?: string; hasta?: string; fechasSinRegistrar?: boolean }): string {
  if (a.fechasSinRegistrar) return 'periodo sin fechas registradas';
  const desde = fechaEs(a.desde) ?? '¿?';
  const hasta = a.hasta ? fechaEs(a.hasta) : 'en ejercicio';
  return desde === hasta ? desde : `${desde} → ${hasta}`;
}

// Inferencia de cartera por keywords del texto del cargo (orden: más específico primero).
const KEYWORD_MINISTERIO: [RegExp, string][] = [
  [/relaciones exteriores/i, 'ministerio_relaciones_exteriores'],
  [/bienes nacionales/i, 'ministerio_bienes_nacionales'],
  [/medio ambiente/i, 'ministerio_medio_ambiente'],
  [/desarrollo social/i, 'ministerio_desarrollo_social'],
  [/obras p[úu]blicas/i, 'ministerio_de_obras_publicas'],
  [/secretario general de la presidencia|segpres/i, 'ministerio_segpres'],
  [/secretar[íi]a general de gobierno|segegob/i, 'segegob'],
  [/interior/i, 'ministerio_interior'],
  [/seguridad p[úu]blica/i, 'ministerio_seguridad'],
  [/hacienda/i, 'ministerio_hacienda'],
  [/defensa/i, 'ministerio_defensa'],
  [/salud/i, 'ministerio_salud'],
  [/vivienda/i, 'ministerio_vivienda'],
  [/transportes?|transporte/i, 'ministerio_transportes'],
  [/trabajo/i, 'ministerio_trabajo'],
  [/mujer/i, 'ministerio_mujer'],
  [/agricultura/i, 'ministerio_agricultura'],
  [/culturas/i, 'ministerio_culturas'],
  [/deporte/i, 'ministerio_del_deporte'],
  [/justicia/i, 'ministerio_justicia'],
  [/ciencia/i, 'ministerio_ciencia'],
  [/energ[íi]a/i, 'ministerio_energia'],
  [/econom[íi]a/i, 'ministerio_economia'],
  [/miner[íi]a/i, 'ministerio_mineria'],
  [/educaci[óo]n/i, 'ministerio_educacion'],
];

const MINISTERIAL_RE = /^(ministr[oa]|biministr[oa]?)\b/i;
// Excluir jueces ("Ministro de la Corte...") y cargos extranjeros.
const EXCLUDE_RE = /corte|argentina|desregulaci[óo]n/i;
const SUBROGANTE_RE = /subrogante/i;

function inferMinisterio(cargo: string): string | null {
  for (const [re, id] of KEYWORD_MINISTERIO) {
    if (re.test(cargo)) return id;
  }
  return null;
}

function orgEsMinisterio(orgId: string | undefined): boolean {
  return !!orgId && MINISTERIO_ORG_IDS.has(orgId);
}

/** Normaliza el texto del cargo para comparar top-level vs cargos[] (sin "Ex", paréntesis ni acentos). */
function cargoKey(cargo: string): string {
  return cargo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^ex\s*/, '')
    .replace(/\(.*?\)/g, '')
    .replace(/subrogante.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Recolecta todos los nombramientos ministeriales de entities.yaml:
 * - `cargos[]` con fechas (autoritativo cuando existe)
 * - `cargo` top-level sin fechas solo si no está duplicado en cargos[]
 */
export function getMinisterialAppointments(): CabinetAppointment[] {
  const people = getPeopleRegistry();
  const orgs = new Map(getOrganizationsRegistry().map((o) => [o.id, o.data.nombre]));
  const out: CabinetAppointment[] = [];

  for (const person of people) {
    const data = person.data;
    const historicos = (data.cargos ?? []).filter((c) => MINISTERIAL_RE.test(c.cargo ?? ''));
    const topEsMinisterial = MINISTERIAL_RE.test(data.cargo ?? '');
    const topDuplicado = topEsMinisterial && historicos.some((c) => cargoKey(c.cargo ?? '') === cargoKey(data.cargo ?? ''));

    const candidatos: { cargo: string; org?: string; desde?: string; hasta?: string; top: boolean }[] = [];
    for (const c of historicos) {
      candidatos.push({ cargo: c.cargo ?? '', org: c.organizacion, desde: c.desde, hasta: c.hasta, top: false });
    }
    if (topEsMinisterial && !topDuplicado) {
      candidatos.push({ cargo: data.cargo ?? '', org: data.organizacion, top: true });
    }

    for (const c of candidatos) {
      if (EXCLUDE_RE.test(c.cargo)) continue;
      const subrogante = SUBROGANTE_RE.test(c.cargo);
      const biministro = /^biministr/i.test(c.cargo);
      const esTop = c.top;

      // Separar biministros en sus carteras ("Biministro de X y Y").
      const partes: string[] = [];
      if (biministro) {
        const resto = c.cargo.replace(/^biministr[oa]?\s+(de|del|de la|de las)?\s*/i, '');
        partes.push(...resto.split(/\s+y\s+/i).map((p) => p.trim()).filter(Boolean));
      } else {
        partes.push(c.cargo);
      }

      for (const parte of partes) {
        let ministerioId: string | null = null;
        // 1) Inferir por keyword de la parte (cada parte del biministro tiene su propia cartera).
        ministerioId = inferMinisterio(parte);
        // 2) Fallback: org explícita (con alias de duplicados) si es cartera ministerial.
        if (!ministerioId && orgEsMinisterio(ORG_ALIASES[c.org ?? ''] ?? c.org)) {
          ministerioId = ORG_ALIASES[c.org ?? ''] ?? c.org;
        }
        if (!ministerioId) {
          ministerioId = inferMinisterio(c.cargo);
        }
        if (!ministerioId) continue;

        out.push({
          personId: person.id,
          nombre: data.nombre,
          cargo: c.cargo,
          ministerioId,
          ministerioNombre: orgs.get(ministerioId) ?? ministerioId,
          desde: c.desde,
          hasta: c.hasta,
          vigente: !c.hasta,
          biministro,
          subrogante,
          fechasSinRegistrar: esTop && !c.desde,
        });
      }
    }
  }

  return out;
}

/**
 * Agrupa los nombramientos por cartera y resuelve el titular "actual":
 * el vigente con `desde` más reciente; si no existe, el primer vigente sin fechas.
 * Los demás vigentes sin fechas se listan en histórico con `fechasSinRegistrar`.
 */
export function getCabinetByMinistry(): CabinetByMinistry[] {
  const appointments = getMinisterialAppointments();
  const byMinistry = new Map<string, CabinetAppointment[]>();

  for (const a of appointments) {
    const list = byMinistry.get(a.ministerioId) ?? [];
    list.push(a);
    byMinistry.set(a.ministerioId, list);
  }

  const result: CabinetByMinistry[] = [];
  for (const [ministerioId, list] of byMinistry) {
    const sorted = [...list].sort((a, b) => {
      const da = a.desde ?? '9999';
      const db = b.desde ?? '9999';
      return db.localeCompare(da);
    });

    const conFechas = sorted.filter((a) => a.desde);
    const sinFechas = sorted.filter((a) => !a.desde);

    // Actual: vigente (sin hasta) con desde más reciente; si no, vigente sin fechas.
    const actual =
      conFechas.find((a) => a.vigente) ??
      sinFechas.find((a) => a.vigente && !a.biministro) ??
      sinFechas.find((a) => a.vigente);

    const historico = sorted.filter((a) => a !== actual && !a.vigente);
    // Vigentes sin fechas que no son "actual" → histórico con aviso de fechas faltantes
    // (solo si realmente carecen de fechas; un vigente con fechas es un dato anómalo).
    for (const a of sorted) {
      if (a !== actual && a.vigente && !historico.includes(a)) {
        historico.push({ ...a, fechasSinRegistrar: !a.desde });
      }
    }
    historico.sort((a, b) => (b.desde ?? '0').localeCompare(a.desde ?? '0'));

    const nombre = list[0]?.ministerioNombre ?? ministerioId;
    result.push({ ministerioId, ministerioNombre: nombre, actual, historico, todos: sorted });
  }

  return result.sort((a, b) => a.ministerioNombre.localeCompare(b.ministerioNombre, 'es'));
}
