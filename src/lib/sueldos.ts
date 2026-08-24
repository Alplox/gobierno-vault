import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { getPeopleRegistry, getSourcesRegistry } from './registry';

/**
 * Datos y derivados de la página /sueldos.
 *
 * La fuente de verdad es src/data/sueldos.yaml (servido también en /data/sueldos.yaml).
 * Este módulo carga el YAML una vez por proceso y expone TODOS los valores derivados
 * (ratios contra el sueldo mínimo, ajustes por IPC, promedios) para que la página no
 * tenga cifras escritas a mano que puedan desafinarse de los datos.
 *
 * Integración con los registros del vault:
 * - Personas (`presidente_id`, `persona_id`, `firmante_id`) se resuelven contra
 *   entities.yaml vía getPeopleRegistry(); el build falla si un ID no existe.
 * - Referencias (`orden_refs`, `vigencias[].fuente`) son IDs de sources.yaml;
 *   getFuente(id) entrega medio/título/url para los <SRef /> y el build falla
 *   si algún ID falta o está duplicado.
 */

export type SueldoPersona = { nombre: string; sueldo: number };
export type CargoComparado = {
  cargo: string;
  kast: SueldoPersona;
  boric: SueldoPersona;
};
export type TopeDipres = {
  rango: string;
  tope_kast: number;
  tope_boric: number | null;
};
export type VigenciaSueldo = {
  monto: number;
  fuente: string;
  descripcion: string;
};
export type PresidenteSueldo = {
  presidente_id: string;
  /** Nombre resuelto desde entities.yaml. */
  presidente: string;
  gobierno: string;
  periodo: string;
  sueldo: number;
  /** Mes al que corresponde el sueldo (para el ajuste IPC). ISO 'YYYY-MM-01'. */
  fecha_ref: string;
  fecha_label: string;
  /** Índice IPC serie empalmada (base dic-2023 = 100) de fecha_ref. */
  ipc: number;
  /** Mes cuyo sueldo mínimo se usa como divisor del ratio presidencial. */
  ratio_minimo_fecha: string;
  refs: number[];
  /** Montos conocidos del mandato, con ventana temporal y fuente. */
  vigencias: VigenciaSueldo[];
  detalle: string;
};
export type SueldoMinimoFila = {
  desde: string;
  monto: number;
  gobierno: string;
  ley: string;
};
export type IndicadorGobierno = {
  gobierno: string;
  periodo: string;
  utm: number;
  uf: number;
  ipc_anual: number;
  ipc_acumulado: number | null;
  nota: string;
};

/** Punto mensual de la bruta presidencial según el Registro Público 38 bis. */
export type SeriePunto = {
  periodo: string; // 'YYYY-MM'
  gobierno: string;
  monto: number;
  nota?: string;
};

type FuenteResuelta = { medio: string; titulo: string; url?: string };

type SueldosYaml = {
  orden_refs: string[];
  segundo_piso: {
    periodo_label: string;
    nota: string;
    fuente: string;
    cargos: Array<{
      cargo: string;
      kast: { persona_id: string; sueldo: number };
      boric: { persona_id: string; sueldo: number };
    }>;
  };
  topes_dipres: {
    firmante_id: string;
    fuente: string;
    vigencia_desde: string;
    filas: TopeDipres[];
  };
  presidentes: Array<
    Omit<PresidenteSueldo, 'presidente'> & { presidente_id: string }
  >;
  sueldo_minimo: SueldoMinimoFila[];
  indicadores: IndicadorGobierno[];
  serie_registro_publico: {
    fuente: string;
    puntos: SeriePunto[];
  };
  ipc: {
    jul_2026: number;
    registro_presidente_mayo_2026: {
      monto: number;
      indice: number;
      fuente: string;
    };
  };
};

/** Ratio sueldo presidencial ÷ sueldo mínimo, con el divisor resuelto del YAML. */
export type RatioGobierno = {
  gobierno: string;
  veces: number;
  divisor: string;
};

export type SueldoAjustado = {
  gobierno: string;
  periodo: string;
  sueldo: number;
  fecha: string;
  ajustado: number;
};

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatCLP(n: number): string {
  return '$' + n.toLocaleString('es-CL');
}

export function pctDiff(a: number, b: number): string {
  return ((a - b) / b * 100).toFixed(1);
}

/** 1234567 -> '1,2 millones' (un decimal, coma decimal chilena). */
export function enMillones(n: number): string {
  return (n / 1_000_000).toFixed(1).replace('.', ',');
}

function parseISO(iso: string): Date {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

function labelMes(iso: string): string {
  const d = parseISO(iso);
  return `${MESES_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Último sueldo mínimo vigente a la fecha indicada (la lista va más reciente primero). */
function minimoVigente(filas: SueldoMinimoFila[], fechaISO: string): SueldoMinimoFila {
  const fecha = parseISO(fechaISO);
  const fila = filas.find((f) => parseISO(f.desde) <= fecha);
  if (!fila) throw new Error(`sueldos.yaml: no hay sueldo mínimo vigente para ${fechaISO}`);
  return fila;
}

let cache: ReturnType<typeof build> | null = null;

function build() {
  const raw = readFileSync(join(process.cwd(), 'src', 'data', 'sueldos.yaml'), 'utf8');
  const yaml = YAML.parse(raw) as SueldosYaml;

  // --- Resolución de fuentes (sources.yaml) ---
  const sourcesRegistry = getSourcesRegistry();
  const ordenRefs = yaml.orden_refs;
  const faltantes = [...new Set(ordenRefs)].filter((id) => !sourcesRegistry[id]);
  if (faltantes.length) {
    throw new Error(
      `sueldos.yaml: fuentes de orden_refs sin entrada en sources.yaml: ${faltantes.join(', ')}`
    );
  }
  const dups = ordenRefs.filter((id, i) => ordenRefs.indexOf(id) !== i);
  if (dups.length) {
    throw new Error(`sueldos.yaml: IDs repetidos en orden_refs: ${dups.join(', ')}`);
  }
  const fuentesPorId = (id: string): FuenteResuelta => {
    const s = sourcesRegistry[id];
    if (!s) throw new Error(`sueldos.yaml: fuente '${id}' no existe en sources.yaml`);
    return { medio: s.medio, titulo: s.titulo, url: s.url };
  };

  // --- Resolución de personas (entities.yaml) ---
  const peopleById = new Map(getPeopleRegistry().map((p) => [p.id, p.data]));
  const nombrePersona = (id: string): string => {
    const p = peopleById.get(id);
    if (!p?.nombre) throw new Error(`sueldos.yaml: persona '${id}' no existe en entities.yaml`);
    return p.nombre;
  };

  // --- Ratios presidenciales derivados (sueldo ÷ mínimo vigente del mes elegido) ---
  const ratios: RatioGobierno[] = yaml.presidentes.map((p) => {
    const min = minimoVigente(yaml.sueldo_minimo, p.ratio_minimo_fecha);
    return {
      gobierno: p.gobierno,
      veces: p.sueldo / min.monto,
      divisor: `${formatCLP(min.monto)} (mínimo desde ${labelMes(min.desde)})`,
    };
  });

  // --- Sueldo ajustado a pesos de julio 2026 ---
  const ipcJul = yaml.ipc.jul_2026;
  const sueldosAjustados: SueldoAjustado[] = yaml.presidentes.map((p) => ({
    gobierno: p.gobierno,
    periodo: p.periodo,
    sueldo: p.sueldo,
    fecha: p.fecha_label,
    ajustado: Math.round((p.sueldo * ipcJul) / p.ipc),
  }));

  const maxAjustado = Math.max(...sueldosAjustados.map((x) => x.ajustado));

  // Promedio real de los cuatro gobiernos previos a Boric (Piñera II..Bachelet I).
  const previosABoric = sueldosAjustados.slice(2, 6).map((s) => s.ajustado);
  const promedioPrevios = Math.round(
    previosABoric.reduce((acc, n) => acc + n, 0) / previosABoric.length
  );
  const pctInferiorKast = Math.round((1 - sueldosAjustados[0].ajustado / promedioPrevios) * 100);

  // Monto del Registro Público (mayo 2026) ajustado a pesos de julio 2026.
  const regMayo = yaml.ipc.registro_presidente_mayo_2026;
  const registroMayoAjustado = Math.round((regMayo.monto * ipcJul) / regMayo.indice);

  // Rango real (en millones) de los cuatro gobiernos 2006–2022, para la nota de la sección IPC.
  const millonesPrevios = previosABoric.map(enMillones);

  const ratioKast = ratios[0];
  const ratioBoric = ratios[1];
  const ratio2010s = [ratios[2], ratios[3], ratios[4]]; // Piñera II, Bachelet II, Piñera I
  const ratioBacheletI = ratios[5];

  const presidentes: PresidenteSueldo[] = yaml.presidentes.map((p) => ({
    ...p,
    presidente: nombrePersona(p.presidente_id),
  }));

  const segundo_piso = {
    periodo_label: yaml.segundo_piso.periodo_label,
    nota: yaml.segundo_piso.nota,
    fuente: fuentesPorId(yaml.segundo_piso.fuente),
    cargos: yaml.segundo_piso.cargos.map((c) => ({
      cargo: c.cargo,
      kast: { nombre: nombrePersona(c.kast.persona_id), sueldo: c.kast.sueldo },
      boric: { nombre: nombrePersona(c.boric.persona_id), sueldo: c.boric.sueldo },
    })),
  };

  const topes_dipres = {
    firmante: nombrePersona(yaml.topes_dipres.firmante_id),
    fuente: fuentesPorId(yaml.topes_dipres.fuente),
    vigencia_desde: yaml.topes_dipres.vigencia_desde,
    filas: yaml.topes_dipres.filas,
  };

  const ipc = {
    jul_2026: yaml.ipc.jul_2026,
    registro_presidente_mayo_2026: {
      ...regMayo,
      fuente: fuentesPorId(yaml.ipc.registro_presidente_mayo_2026.fuente),
    },
  };

  const serie_registro_publico = {
    fuente: fuentesPorId(yaml.serie_registro_publico.fuente),
    puntos: [...yaml.serie_registro_publico.puntos].sort((a, b) =>
      a.periodo.localeCompare(b.periodo)
    ),
  };

  return {
    ordenRefs,
    fuentes: ordenRefs.map((id) => ({ id, ...fuentesPorId(id) })),
    presidentes,
    segundo_piso,
    topes_dipres,
    sueldo_minimo: yaml.sueldo_minimo,
    indicadores: yaml.indicadores,
    serie_registro_publico,
    ipc,
    formatCLP,
    pctDiff,
    enMillones,
    derivados: {
      ratios,
      sueldosAjustados,
      maxAjustado,
      promedioPrevios,
      pctInferiorKast,
      registroMayoAjustado,
      ratioKastVecesRedondeado: Math.round(ratioKast.veces),
      ratioBoricVecesRedondeado: Math.round(ratioBoric.veces),
      ratio2010sTexto: {
        min: Math.floor(Math.min(...ratio2010s.map((r) => r.veces))),
        max: Math.round(Math.max(...ratio2010s.map((r) => r.veces))),
        detalle: [ratio2010s[0], ratio2010s[2], ratio2010s[1]]
          .map((r) => `${r.gobierno} ${r.veces.toFixed(1).replace('.', ',')}`)
          .join('; '),
      },
      ratioBacheletITexto: ratioBacheletI.veces.toFixed(1).replace('.', ','),
      millonesRangoPrevios: {
        min: enMillones(Math.min(...previosABoric)),
        max: enMillones(Math.max(...previosABoric)),
      },
      kastAjustadoMillones: enMillones(sueldosAjustados[0].ajustado),
      boricAjustadoMillones: enMillones(sueldosAjustados[1].ajustado),
      freiAjustadoMillones: enMillones(
        sueldosAjustados[sueldosAjustados.length - 1].ajustado
      ),
      lagosAjustadoMillones: enMillones(
        sueldosAjustados[sueldosAjustados.length - 2].ajustado
      ),
    },
  };
}

export type SueldosData = ReturnType<typeof build>;

/** Carga (y cachea por proceso) los datos + derivados de /sueldos. */
export function getSueldos(): SueldosData {
  if (!cache) cache = build();
  return cache;
}
