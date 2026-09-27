import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { getPeopleRegistry, getSourcesRegistry } from './registry';

export type FuenteResuelta = {
  id: string;
  medio: string;
  titulo: string;
  url: string;
  fecha: Date;
};

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
  desde?: string;
  hasta?: string;
  tipo?: string;
};
export type PresidenteSueldo = {
  presidente_id: string;
  presidente: string;
  gobierno: string;
  periodo: string;
  sueldo: number;
  fecha_ref: string;
  fecha_label: string;
  ipc: number;
  ratio_minimo_fecha: string;
  monto_legal?: number;
  refs: string[];
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
  ipc_inicio: number | null;
  ipc_fin: number | null;
  ipc_inicio_fecha: string | null;
  ipc_fin_fecha: string | null;
  nota: string;
  ipc_periodo: number | null;
};
export type SeriePunto = {
  periodo: string;
  gobierno: string;
  monto: number;
  tipo?: 'observado' | 'bono' | 'proporcional';
  nota?: string;
};

export type ComparacionBrecha = {
  clave: string;
  etiqueta: string;
  monto: number;
  unidad: string;
  veces: number;
  diferencia: number;
  fuente: FuenteResuelta;
  nota: string;
};
export type TarjetaBrecha = {
  clave: string;
  etiqueta: string;
  monto: number;
  unidad: string;
  fuente: FuenteResuelta;
};

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
  presidentes: Array<Omit<PresidenteSueldo, 'presidente'> & { presidente_id: string }>;
  sueldo_minimo: SueldoMinimoFila[];
  indicadores: Array<Omit<IndicadorGobierno, 'ipc_periodo'>>;
  serie_registro_publico: {
    fuente: string;
    puntos: SeriePunto[];
  };
  ipc: {
    base: string;
    mes_referencia: string;
    ago_2026: number;
    registro_presidente_julio_2026: {
      monto: number;
      indice: number;
      fuente: string;
    };
  };
  ingresos_esi: {
    ano: number;
    periodo: string;
    unidad: string;
    fuente: string;
    mediana: number;
    promedio: number;
    asalariados_publicos_promedio: number;
    porcentaje_1m_o_mas: number;
    porcentaje_3m_o_mas: number;
    nota: string;
  };
  costo_vida: {
    periodo: string;
    unidad: string;
    fuente: string;
    cba_persona: number;
    linea_pobreza_no_arrendatario: number;
    linea_pobreza_extrema_no_arrendatario: number;
    linea_pobreza_arrendatario: number;
    linea_pobreza_extrema_arrendatario: number;
    nota: string;
  };
  imm_2026: {
    desde: string;
    unidad: string;
    fuente: string;
    categorias: Array<{ id: string; etiqueta: string; monto: number }>;
    nota: string;
  };
  casen_2024: {
    ano: number;
    periodo: string;
    unidad: string;
    fuente: string;
    promedio_ingreso_trabajo_hogar: number;
    promedio_ingreso_autonomo_hogar: number;
    promedio_ingreso_monetario_hogar: number;
    promedio_ingreso_autonomo_per_capita_decil_x: number;
    nota: string;
  };
};

export type RatioGobierno = {
  gobierno: string;
  veces: number;
  divisor: string;
  fecha_divisor: string;
};

export type SueldoAjustado = {
  gobierno: string;
  periodo: string;
  sueldo: number;
  fecha: string;
  ajustado: number;
};

export type BrechaData = {
  presidente: TarjetaBrecha & { periodo: string; veces_imm: number; legal: number; diferencia_legal: number };
  tarjetas: TarjetaBrecha[];
  comparaciones: ComparacionBrecha[];
};

const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export function formatCLP(n: number): string {
  return '$' + n.toLocaleString('es-CL');
}

export function pctDiff(a: number, b: number): string {
  return ((a - b) / b * 100).toFixed(1).replace('.', ',');
}

export function enMillones(n: number): string {
  return (n / 1_000_000).toFixed(1).replace('.', ',');
}

function parseISO(iso: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`sueldos.yaml: fecha inválida '${iso}', se espera YYYY-MM-DD`);
  }
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw new Error(`sueldos.yaml: fecha imposible '${iso}'`);
  }
  return date;
}

function labelMes(iso: string): string {
  const d = parseISO(iso);
  return `${MESES_ES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function validarPositivo(valor: number, contexto: string): void {
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error(`sueldos.yaml: ${contexto} debe ser un número positivo`);
  }
}

function minimoVigente(filas: SueldoMinimoFila[], fechaISO: string): SueldoMinimoFila {
  const fecha = parseISO(fechaISO);
  const ordenadas = [...filas].sort((a, b) => parseISO(b.desde).getTime() - parseISO(a.desde).getTime());
  const fila = ordenadas.find((f) => parseISO(f.desde) <= fecha);
  if (!fila) throw new Error(`sueldos.yaml: no hay sueldo mínimo vigente para ${fechaISO}`);
  return fila;
}

let cache: ReturnType<typeof build> | null = null;

function build() {
  const raw = readFileSync(join(process.cwd(), 'src', 'data', 'sueldos.yaml'), 'utf8');
  const yaml = YAML.parse(raw) as SueldosYaml;

  // --- Resolución de fuentes (src/content/sources/*.md) ---
  const sourcesRegistry = getSourcesRegistry();
  const ordenRefs = yaml.orden_refs;
  if (!Array.isArray(ordenRefs) || ordenRefs.some((id) => typeof id !== 'string')) {
    throw new Error('sueldos.yaml: orden_refs debe ser un arreglo de IDs');
  }
  const faltantes = [...new Set(ordenRefs)].filter((id) => !sourcesRegistry[id]);
  if (faltantes.length) {
    throw new Error(
      `sueldos.yaml: fuentes de orden_refs sin entrada en src/content/sources/*.md: ${faltantes.join(', ')}`
    );
  }
  const dups = ordenRefs.filter((id, i) => ordenRefs.indexOf(id) !== i);
  if (dups.length) {
    throw new Error(`sueldos.yaml: IDs repetidos en orden_refs: ${dups.join(', ')}`);
  }
  const fuentesPorId = (id: string): FuenteResuelta => {
    const s = sourcesRegistry[id];
    if (!s) throw new Error(`sueldos.yaml: fuente '${id}' no existe en src/content/sources/*.md`);
    if (!s.url) throw new Error(`sueldos.yaml: la fuente '${id}' no tiene URL`);
    return { id, medio: s.medio, titulo: s.titulo, url: s.url, fecha: s.fecha };
  };
  const assertFuente = (id: string, contexto: string): void => {
    if (!ordenRefs.includes(id)) {
      throw new Error(`sueldos.yaml: ${contexto} usa '${id}', que no está en orden_refs`);
    }
    fuentesPorId(id);
  };

  // Todas las fuentes citadas por datos deben aparecer en la bibliografía visible.
  for (const p of yaml.presidentes) {
    p.refs.forEach((id) => assertFuente(id, `presidentes.${p.gobierno}.refs`));
    p.vigencias.forEach((v) => assertFuente(v.fuente, `presidentes.${p.gobierno}.vigencias`));
  }
  assertFuente(yaml.segundo_piso.fuente, 'segundo_piso.fuente');
  assertFuente(yaml.topes_dipres.fuente, 'topes_dipres.fuente');
  assertFuente(yaml.serie_registro_publico.fuente, 'serie_registro_publico.fuente');
  assertFuente(yaml.ipc.registro_presidente_julio_2026.fuente, 'ipc.registro_presidente_julio_2026.fuente');
  assertFuente(yaml.ingresos_esi.fuente, 'ingresos_esi.fuente');
  assertFuente(yaml.costo_vida.fuente, 'costo_vida.fuente');
  assertFuente(yaml.imm_2026.fuente, 'imm_2026.fuente');
  assertFuente(yaml.casen_2024.fuente, 'casen_2024.fuente');

  // --- Resolución de personas (src/content/people/*.md) ---
  const peopleById = new Map(getPeopleRegistry().map((p) => [p.id, p.data]));
  const nombrePersona = (id: string): string => {
    const p = peopleById.get(id);
    if (!p?.nombre) throw new Error(`sueldos.yaml: persona '${id}' no existe en src/content/people/*.md`);
    return p.nombre;
  };

  // --- Invariantes de series y montos ---
  const fechasMinimo = new Set<string>();
  for (const fila of yaml.sueldo_minimo) {
    parseISO(fila.desde);
    validarPositivo(fila.monto, `sueldo_minimo ${fila.desde}`);
    if (fechasMinimo.has(fila.desde)) throw new Error(`sueldos.yaml: sueldo mínimo duplicado en ${fila.desde}`);
    fechasMinimo.add(fila.desde);
  }
  const periodosSerie = new Set<string>();
  for (const punto of yaml.serie_registro_publico.puntos) {
    if (!/^\d{4}-\d{2}$/.test(punto.periodo)) throw new Error(`sueldos.yaml: periodo inválido ${punto.periodo}`);
    validarPositivo(punto.monto, `serie ${punto.periodo}`);
    if (periodosSerie.has(punto.periodo)) throw new Error(`sueldos.yaml: periodo duplicado en serie ${punto.periodo}`);
    periodosSerie.add(punto.periodo);
  }
  validarPositivo(yaml.ipc.ago_2026, 'ipc.ago_2026');

  const actual = yaml.presidentes.find((p) => p.gobierno === 'Kast');
  const boric = yaml.presidentes.find((p) => p.gobierno === 'Boric');
  if (!actual || !boric) throw new Error('sueldos.yaml: se requiere un registro Kast y uno Boric');

  // --- Ratios provisionales derivados (sueldo ÷ mínimo vigente del mes elegido) ---
  const ratios: RatioGobierno[] = yaml.presidentes.map((p) => {
    const min = minimoVigente(yaml.sueldo_minimo, p.ratio_minimo_fecha);
    return {
      gobierno: p.gobierno,
      veces: p.sueldo / min.monto,
      divisor: `${formatCLP(min.monto)} (mínimo desde ${labelMes(min.desde)})`,
      fecha_divisor: min.desde,
    };
  });

  // --- Sueldos ajustados a agosto de 2026 ---
  const ipcAgo = yaml.ipc.ago_2026;
  const sueldosAjustados: SueldoAjustado[] = yaml.presidentes.map((p) => ({
    gobierno: p.gobierno,
    periodo: p.periodo,
    sueldo: p.sueldo,
    fecha: p.fecha_label,
    ajustado: Math.round((p.sueldo * ipcAgo) / p.ipc),
  }));

  const porGobierno = (nombre: string): SueldoAjustado => {
    const valor = sueldosAjustados.find((s) => s.gobierno === nombre);
    if (!valor) throw new Error(`sueldos.yaml: no existe sueldo ajustado para ${nombre}`);
    return valor;
  };
  const previosABoric = ['Piñera II', 'Bachelet II', 'Piñera I', 'Bachelet I'].map(porGobierno);
  const promedioPrevios = Math.round(
    previosABoric.reduce((acc, n) => acc + n.ajustado, 0) / previosABoric.length
  );
  const maxAjustado = Math.max(...sueldosAjustados.map((x) => x.ajustado));
  const pctInferiorKast = Math.round((1 - porGobierno('Kast').ajustado / promedioPrevios) * 100);

  const ratioKast = ratios.find((r) => r.gobierno === 'Kast');
  const ratioBoric = ratios.find((r) => r.gobierno === 'Boric');
  const ratio2010s = ratios.filter((r) => ['Piñera II', 'Bachelet II', 'Piñera I'].includes(r.gobierno));
  const ratioBacheletI = ratios.find((r) => r.gobierno === 'Bachelet I');
  if (!ratioKast || !ratioBoric || !ratioBacheletI) throw new Error('sueldos.yaml: faltan ratios históricos requeridos');

  const legalDiet = actual.monto_legal ?? actual.vigencias.find((v) => v.tipo === 'ajuste')?.monto;
  if (!legalDiet) throw new Error('sueldos.yaml: falta monto legal del Presidente vigente');
  const minimoMarzoKast = minimoVigente(yaml.sueldo_minimo, '2026-03-01');
  const ratioLegalKast = legalDiet / minimoMarzoKast.monto;

  // --- Indicadores: variación entre endpoints, no producto deIPC anual ---
  const indicadores: IndicadorGobierno[] = yaml.indicadores.map((i) => ({
    ...i,
    ipc_periodo: i.ipc_inicio !== null && i.ipc_fin !== null
      ? Number((((i.ipc_fin / i.ipc_inicio) - 1) * 100).toFixed(1))
      : null,
  }));

  // --- Ingresos y brechas ---
  const ingresos_esi = { ...yaml.ingresos_esi, fuente: fuentesPorId(yaml.ingresos_esi.fuente) };
  const costo_vida = { ...yaml.costo_vida, fuente: fuentesPorId(yaml.costo_vida.fuente) };
  const imm_2026 = { ...yaml.imm_2026, fuente: fuentesPorId(yaml.imm_2026.fuente) };
  const casen_2024 = { ...yaml.casen_2024, fuente: fuentesPorId(yaml.casen_2024.fuente) };

  const actualTarjeta: TarjetaBrecha = {
    clave: 'presidente',
    etiqueta: `Presidente · ${actual.fecha_label}`,
    monto: actual.sueldo,
    unidad: 'bruto mensual',
    fuente: fuentesPorId(yaml.serie_registro_publico.fuente),
  };
  const tarjeta = (
    clave: string,
    etiqueta: string,
    monto: number,
    unidad: string,
    fuente: FuenteResuelta,
  ): TarjetaBrecha => ({ clave, etiqueta, monto, unidad, fuente });
  const comparacion = (
    clave: string,
    etiqueta: string,
    monto: number,
    unidad: string,
    fuente: FuenteResuelta,
    nota: string,
  ): ComparacionBrecha => ({
    clave,
    etiqueta,
    monto,
    unidad,
    veces: actual.sueldo / monto,
    diferencia: actual.sueldo - monto,
    fuente,
    nota,
  });
  const fuenteESI = ingresos_esi.fuente;
  const fuenteCBA = costo_vida.fuente;
  const fuenteIMM = imm_2026.fuente;
  const tarjetas: TarjetaBrecha[] = [
    actualTarjeta,
    tarjeta('esi-mediana', `Mediana ESI · ${ingresos_esi.ano}`, ingresos_esi.mediana, 'neto mensual por persona ocupada', fuenteESI),
    tarjeta('asalariados-publicos', `Asalariados públicos · ${ingresos_esi.ano}`, ingresos_esi.asalariados_publicos_promedio, 'neto mensual promedio', fuenteESI),
    tarjeta('linea-pobreza', `Línea de pobreza · ${costo_vida.periodo}`, costo_vida.linea_pobreza_no_arrendatario, 'persona equivalente, no arrendatario', fuenteCBA),
  ];
  const comparaciones: ComparacionBrecha[] = [
    comparacion('esi-mediana', `Mediana ESI ${ingresos_esi.ano}`, ingresos_esi.mediana, 'neto / persona ocupada / mes', fuenteESI, 'Magnitud orientativa; bruto 2026 contra neto 2025.'),
    comparacion('esi-promedio', `Promedio ESI ${ingresos_esi.ano}`, ingresos_esi.promedio, 'neto / persona ocupada / mes', fuenteESI, 'El promedio puede ser influido por ingresos altos.'),
    comparacion('asalariados-publicos', `Asalariados públicos ESI ${ingresos_esi.ano}`, ingresos_esi.asalariados_publicos_promedio, 'neto / asalariado público / mes', fuenteESI, 'Categoría de la ESI; no incluye la dieta presidencial.'),
    comparacion('imm', 'Ingreso mínimo 18–65 años', imm_2026.categorias[0].monto, 'bruto / mes', fuenteIMM, 'Monto bruto del tramo 18–65 años.'),
    comparacion('linea-pobreza', `Línea de pobreza no arrendatario · ${costo_vida.periodo}`, costo_vida.linea_pobreza_no_arrendatario, 'persona equivalente / mes', fuenteCBA, 'Umbral de pobreza, no ingreso disponible.'),
    comparacion('linea-pobreza-extrema', `Línea de pobreza extrema no arrendatario · ${costo_vida.periodo}`, costo_vida.linea_pobreza_extrema_no_arrendatario, 'persona equivalente / mes', fuenteCBA, 'Umbral de pobreza extrema, no ingreso disponible.'),
  ];
  const brecha: BrechaData = {
    presidente: {
      ...actualTarjeta,
      periodo: actual.fecha_label,
      veces_imm: actual.sueldo / imm_2026.categorias[0].monto,
      legal: legalDiet,
      diferencia_legal: actual.sueldo - legalDiet,
    },
    tarjetas,
    comparaciones,
  };

  const registro = yaml.ipc.registro_presidente_julio_2026;
  const registroAjustado = Math.round((registro.monto * ipcAgo) / registro.indice);
  const millonesPrevios = previosABoric.map(enMillones);

  const presidentes: PresidenteSueldo[] = yaml.presidentes.map((p) => ({
    ...p,
    vigencias: [...p.vigencias].sort((a, b) => {
      const fechaA = a.desde ?? '9999-12-31';
      const fechaB = b.desde ?? '9999-12-31';
      return fechaA.localeCompare(fechaB);
    }),
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
    base: yaml.ipc.base,
    mes_referencia: yaml.ipc.mes_referencia,
    ago_2026: ipcAgo,
    registro_presidente_julio_2026: {
      ...registro,
      fuente: fuentesPorId(registro.fuente),
    },
  };

  const serie_registro_publico = {
    fuente: fuentesPorId(yaml.serie_registro_publico.fuente),
    puntos: [...yaml.serie_registro_publico.puntos].sort((a, b) => a.periodo.localeCompare(b.periodo)),
  };

  const fuentes = ordenRefs.map((id, index) => ({ ...fuentesPorId(id), index: index + 1 }));

  return {
    ordenRefs,
    fuentes,
    presidentes,
    actualPresidente: presidentes.find((p) => p.gobierno === 'Kast') ?? presidentes[0],
    segundo_piso,
    topes_dipres,
    sueldo_minimo: yaml.sueldo_minimo,
    indicadores,
    serie_registro_publico,
    ipc,
    ingresos_esi,
    costo_vida,
    imm_2026,
    casen_2024,
    brecha,
    formatCLP,
    pctDiff,
    enMillones,
    derivados: {
      ratios,
      sueldosAjustados,
      maxAjustado,
      promedioPrevios,
      pctInferiorKast,
      registroAjustado,
      ratioLegalKast,
      legalDiet,
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
        min: enMillones(Math.min(...previosABoric.map((s) => s.ajustado))),
        max: enMillones(Math.max(...previosABoric.map((s) => s.ajustado))),
      },
      kastAjustadoMillones: enMillones(porGobierno('Kast').ajustado),
      boricAjustadoMillones: enMillones(porGobierno('Boric').ajustado),
      freiAjustadoMillones: enMillones(porGobierno('Frei').ajustado),
      lagosAjustadoMillones: enMillones(porGobierno('Lagos').ajustado),
      millonesPrevios,
    },
  };
}

export type SueldosData = ReturnType<typeof build>;

/** Carga (y cachea por proceso) los datos + derivados de /sueldos. */
export function getSueldos(): SueldosData {
  if (!cache) cache = build();
  return cache;
}
