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
  segpres: 'ministerio_segpres',
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

// Periodos presidenciales de Chile (desde 1990) para la vista "por gobierno".
// `hasta` null = gobierno en ejercicio (Kast).
export type Gobierno = {
  id: string;
  presidente: string;
  partido: string;
  desde: string; // ISO YYYY-MM-DD
  hasta?: string;
  actual?: boolean;
};

export const GOBIERNOS: Gobierno[] = [
  { id: 'aguirre_cerda', presidente: 'Pedro Aguirre Cerda', partido: 'PR', desde: '1938-12-24', hasta: '1941-11-25' },
  { id: 'rios', presidente: 'Juan Antonio Ríos', partido: 'PR', desde: '1941-11-25', hasta: '1946-06-27' },
  { id: 'gonzalez_videla', presidente: 'Gabriel González Videla', partido: 'PR', desde: '1946-11-03', hasta: '1952-11-03' },
  { id: 'ibanez2', presidente: 'Carlos Ibáñez del Campo (2.º)', partido: 'Agrario Laborista', desde: '1952-11-03', hasta: '1958-11-03' },
  { id: 'alessandri_jorge', presidente: 'Jorge Alessandri', partido: 'Independiente', desde: '1958-11-03', hasta: '1964-11-03' },
  { id: 'frei_mtva', presidente: 'Eduardo Frei Montalva', partido: 'DC', desde: '1964-11-03', hasta: '1970-11-03' },
  { id: 'allende', presidente: 'Salvador Allende', partido: 'PS (UP)', desde: '1970-11-03', hasta: '1973-09-11' },
  { id: 'pinochet', presidente: 'Augusto Pinochet', partido: 'Junta Militar', desde: '1973-09-11', hasta: '1990-03-11' },
  { id: 'aylwin', presidente: 'Patricio Aylwin', partido: 'DC', desde: '1990-03-11', hasta: '1994-03-11' },
  { id: 'frei', presidente: 'Eduardo Frei Ruiz-Tagle', partido: 'DC', desde: '1994-03-11', hasta: '2000-03-11' },
  { id: 'lagos', presidente: 'Ricardo Lagos', partido: 'PPD', desde: '2000-03-11', hasta: '2006-03-11' },
  { id: 'bachelet1', presidente: 'Michelle Bachelet (1.º)', partido: 'PS', desde: '2006-03-11', hasta: '2010-03-11' },
  { id: 'pinera1', presidente: 'Sebastián Piñera (1.º)', partido: 'RN', desde: '2010-03-11', hasta: '2014-03-11' },
  { id: 'bachelet2', presidente: 'Michelle Bachelet (2.º)', partido: 'PS', desde: '2014-03-11', hasta: '2018-03-11' },
  { id: 'pinera2', presidente: 'Sebastián Piñera (2.º)', partido: 'RN', desde: '2018-03-11', hasta: '2022-03-11' },
  { id: 'boric', presidente: 'Gabriel Boric', partido: 'FA', desde: '2022-03-11', hasta: '2026-03-11' },
  { id: 'kast', presidente: 'José Antonio Kast', partido: 'Republicano', desde: '2026-03-11', actual: true },
];

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
  [/secretari[oa] general de la presidencia|segpres/i, 'ministerio_segpres'],
  [/secretari[oa] general de gobierno|segegob/i, 'segegob'],
  [/interior/i, 'ministerio_interior'],
  [/seguridad p[úu]blica/i, 'ministerio_seguridad'],
  [/hacienda/i, 'ministerio_hacienda'],
  // Carteras históricas (pre-1990): Guerra/Marina/Aviación precedieron a Defensa Nacional;
  // Salud Pública fue el nombre del ministerio de salud hasta 1979; Fomento precedió a
  // Economía (hasta 1953).
  [/guerra|marina|aviaci[óo]n/i, 'ministerio_defensa'],
  [/salud p[úu]blica|salubridad/i, 'ministerio_salud'],
  [/fomento/i, 'ministerio_economia'],
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
// Excluir jueces ("Ministro de la Corte..."), cargos extranjeros ("... de China/Argentina")
// y roles históricos fechados en el texto ("subrogante (2020)"): un cargo top-level sin
// fechas se atribuye al gobierno en ejercicio, así que estos quedarían mal asignados a Kast.
const EXCLUDE_RE = /corte|desregulaci[óo]n|\(\d{4}\)|de (china|estados unidos|argentina|brasil|per[uú]|bolivia|ecuador|colombia|venezuela|paraguay|uruguay|m[eé]xico|espa[ñn]a|francia|israel|rusia|russia|jap[oó]n|corea del norte|corea del sur|corea|india|reino unido)\b/i;
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

/**
 * Nombramientos de un gobierno, recortados al rango del periodo presidencial.
 * `desde`/`hasta` se limitan al periodo del gobierno; `salidaPrevia` indica si
 * el titular salió ANTES de terminar el periodo (renuncia/cambio de gabinete).
 */
export type GobiernoAppointment = CabinetAppointment & {
  desdeGob?: string;
  hastaGob?: string;
  salidaPrevia: boolean;
  esUltimoDeCartera: boolean; // último titular de la cartera en ese gobierno
};

export type GobiernoCartera = {
  ministerioId: string;
  ministerioNombre: string;
  titulares: GobiernoAppointment[];
};

export type GobiernoTimeline = {
  gobierno: Gobierno;
  carteras: GobiernoCartera[];
  totalNombramientos: number;
  salidasPrevias: number;
};

function isoComparable(iso?: string): string {
  return iso ?? '9999-12-31';
}

function clampIso(iso: string, min: string, max?: string): string {
  let v = iso < min ? min : iso;
  if (max && v > max) v = max;
  return v;
}

/**
 * Construye la línea de tiempo del gabinete por gobierno: para cada periodo
 * presidencial, los titulares de cada cartera con su ventana de tiempo recortada
 * al periodo, marcando salidas prematuras (renuncias/cambios dentro del gobierno).
 */
export function getCabinetByGobierno(): GobiernoTimeline[] {
  const appointments = getMinisterialAppointments();

  return GOBIERNOS.map((gobierno) => {
    const finGob = gobierno.hasta; // undefined para Kast (en ejercicio)
    const porCartera = new Map<string, CabinetAppointment[]>();

    for (const a of appointments) {
      // Cargo sin fechas → se muestra en el gobierno actual (Kast) como "sin fechas".
      if (!a.desde) {
        if (gobierno.actual) {
          const list = porCartera.get(a.ministerioId) ?? [];
          list.push(a);
          porCartera.set(a.ministerioId, list);
        }
        continue;
      }
      // Solape: desde <= fin del gobierno (o cualquiera si es el actual) y hasta >= inicio.
      // OJO: un nombramiento que empieza EXACTAMENTE en la fecha de término del gobierno
      // (p. ej. 2018-03-11, último día de Bachelet 2) pertenece al gobierno siguiente
      // (Piñera 2), no al que termina: con `>` se incluía en ambos y el clamp lo dejaba
      // en 0 días (desdeGob === hastaGob === finGob).
      if (a.desde < gobierno.desde) continue;
      if (finGob && a.desde >= finGob) continue;
      if (a.hasta && a.hasta < gobierno.desde) continue;
      const list = porCartera.get(a.ministerioId) ?? [];
      list.push(a);
      porCartera.set(a.ministerioId, list);
    }

    const carteras: GobiernoCartera[] = [];
    let totalNombramientos = 0;
    let salidasPrevias = 0;

    for (const [ministerioId, list] of porCartera) {
      const sorted = [...list].sort((a, b) => isoComparable(a.desde).localeCompare(isoComparable(b.desde)));
      const titulares: GobiernoAppointment[] = sorted.map((a, i) => {
        const desdeGob = a.desde ? clampIso(a.desde, gobierno.desde, finGob) : undefined;
        const hastaGob = a.hasta ? clampIso(a.hasta, gobierno.desde, finGob) : undefined;
        // Salida previa: tiene fecha de término anterior al fin del periodo (o
        // cualquier término si el gobierno terminó y hay fecha).
        const salidaPrevia =
          !!a.hasta && (!finGob ? true : a.hasta < finGob);
        const esUltimoDeCartera = i === sorted.length - 1;
        totalNombramientos++;
        if (salidaPrevia) salidasPrevias++;
        return { ...a, desdeGob, hastaGob, salidaPrevia, esUltimoDeCartera };
      });
      const nombre = list[0]?.ministerioNombre ?? ministerioId;
      carteras.push({ ministerioId, ministerioNombre: nombre, titulares });
    }

    carteras.sort((a, b) => a.ministerioNombre.localeCompare(b.ministerioNombre, 'es'));
    return { gobierno, carteras, totalNombramientos, salidasPrevias };
  });
}
