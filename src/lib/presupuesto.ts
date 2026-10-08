import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { getOrganizationsRegistry, getSourcesRegistry } from './registry';

export type PresupuestoFuente = {
  id: string;
  medio: string;
  titulo: string;
  url: string;
  fecha: Date;
};

export type TotalFoto = { monto: number | null; nota?: string; fuente?: string };
export type Hito = { etiqueta: string; valor: string; fuente: string };
export type Variacion = {
  alcance: string;
  variacion_texto: string;
  ministerio_id: string | null;
  ministerioNombre: string | null;
  nivel_impacto: 'directo' | 'indirecto' | 'institucional';
  fuente: string;
  evento_id: string | null;
  nota?: string;
};
export type Movimiento = {
  tipo: string;
  descripcion: string;
  fecha: string | null;
  monto: number | null;
  monto_nota?: string;
  objetivo_declarado: string | null;
  evento_id: string | null;
  fuente: string;
  nivel_impacto: 'directo' | 'indirecto' | 'institucional';
  organizacion_id: string | null;
  organizacionNombre: string | null;
  nota?: string;
};
export type Ejercicio = {
  ano: number;
  gobierno: string;
  estado: string;
  estado_label: string;
  ley: { nombre: string; fuente: string; nota?: string };
  totales: { inicial: TotalFoto; vigente: TotalFoto; ejecutado: TotalFoto; saldo: TotalFoto };
  hitos: Hito[];
  variaciones: Variacion[];
  movimientos: Movimiento[];
  refs: string[];
};

type EjercicioYaml = {
  ano: number;
  gobierno: string;
  estado: string;
  estado_label: string;
  ley: { nombre: string; fuente: string; nota?: string };
  totales: Record<'inicial' | 'vigente' | 'ejecutado' | 'saldo', TotalFoto>;
  hitos: Hito[];
  variaciones: Array<Omit<Variacion, 'ministerioNombre'>>;
  movimientos: Movimiento[];
  orden_refs: string[];
};

export function formatCLP(n: number): string {
  return '$' + n.toLocaleString('es-CL');
}

const NIVELES = new Set(['directo', 'indirecto', 'institucional']);

function collectEventBasenames(): Set<string> {
  const root = join(process.cwd(), 'src', 'content', 'events');
  const out = new Set<string>();
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.add(e.name.replace(/\.md$/, ''));
    }
  };
  walk(root);
  return out;
}

let cache: { ejercicios: Ejercicio[]; fuentes: Record<string, PresupuestoFuente>; formatCLP: typeof formatCLP } | null = null;

function build() {
  const dir = join(process.cwd(), 'src', 'data', 'presupuesto');
  const files = readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort();
  if (files.length === 0) throw new Error('presupuesto: sin ejercicios en src/data/presupuesto/');

  const sourcesRegistry = getSourcesRegistry();
  const orgNames = new Map(getOrganizationsRegistry().map((o) => [o.id, o.data.nombre]));
  const eventos = collectEventBasenames();

  const fuenteResuelta = (id: string): PresupuestoFuente => {
    const s = sourcesRegistry[id];
    if (!s) throw new Error(`presupuesto: fuente '${id}' no existe en src/content/sources/*.md`);
    if (!s.url) throw new Error(`presupuesto: la fuente '${id}' no tiene URL`);
    return { id, medio: s.medio, titulo: s.titulo, url: s.url, fecha: s.fecha };
  };

  const fuentes: Record<string, PresupuestoFuente> = {};
  const ejercicios: Ejercicio[] = [];

  for (const f of files) {
    const y = YAML.parse(readFileSync(join(dir, f), 'utf8')) as EjercicioYaml;
    const ctx = `presupuesto/${f}`;
    if (!Number.isInteger(y.ano) || y.ano < 1990 || y.ano > 2100) throw new Error(`${ctx}: ano inválido`);
    if (!y.gobierno) throw new Error(`${ctx}: falta gobierno`);
    const orden = y.orden_refs ?? [];
    if (!Array.isArray(orden) || orden.some((id) => typeof id !== 'string')) {
      throw new Error(`${ctx}: orden_refs debe ser un arreglo de IDs`);
    }
    if (new Set(orden).size !== orden.length) throw new Error(`${ctx}: IDs repetidos en orden_refs`);
    for (const id of orden) {
      fuenteResuelta(id);
      fuentes[id] = fuenteResuelta(id);
    }
    const assertFuente = (id: string | undefined, campo: string): string => {
      if (!id) throw new Error(`${ctx}: ${campo} sin fuente`);
      if (!orden.includes(id)) throw new Error(`${ctx}: ${campo} usa '${id}', que no está en orden_refs`);
      return id;
    };
    const assertOrg = (id: string | null, campo: string): string | null => {
      if (id === null || id === undefined) return null;
      if (!orgNames.has(id)) throw new Error(`${ctx}: ${campo} usa organizacion '${id}' inexistente`);
      return id;
    };
    const assertEvento = (id: string | null, campo: string): string | null => {
      if (id === null || id === undefined) return null;
      if (!eventos.has(id)) throw new Error(`${ctx}: ${campo} apunta al evento inexistente '${id}'`);
      return id;
    };
    const assertMonto = (m: number | null, campo: string): number | null => {
      if (m === null || m === undefined) return null;
      if (!Number.isFinite(m) || m <= 0) throw new Error(`${ctx}: ${campo} debe ser un monto positivo`);
      return m;
    };

    assertFuente(y.ley?.fuente, 'ley.fuente');
    for (const k of ['inicial', 'vigente', 'ejecutado', 'saldo'] as const) {
      const t = y.totales?.[k];
      if (!t) throw new Error(`${ctx}: falta totales.${k}`);
      assertMonto(t.monto ?? null, `totales.${k}.monto`);
      if (t.fuente) assertFuente(t.fuente, `totales.${k}.fuente`);
    }
    for (const h of y.hitos ?? []) assertFuente(h.fuente, `hitos.${h.etiqueta}`);
    const variaciones: Variacion[] = (y.variaciones ?? []).map((v) => {
      assertFuente(v.fuente, `variaciones.${v.alcance}`);
      if (!NIVELES.has(v.nivel_impacto)) throw new Error(`${ctx}: nivel_impacto inválido en '${v.alcance}'`);
      const mid = assertOrg(v.ministerio_id ?? null, `variaciones.${v.alcance}`);
      return { ...v, ministerio_id: mid, ministerioNombre: mid ? orgNames.get(mid) ?? mid : null, evento_id: assertEvento(v.evento_id ?? null, `variaciones.${v.alcance}`) };
    });
    const movimientos: Movimiento[] = (y.movimientos ?? []).map((m) => {
      assertFuente(m.fuente, `movimientos.${m.descripcion}`);
      if (!NIVELES.has(m.nivel_impacto)) throw new Error(`${ctx}: nivel_impacto inválido en '${m.descripcion}'`);
      if (m.fecha && !/^\d{4}-\d{2}-\d{2}$/.test(m.fecha)) throw new Error(`${ctx}: fecha inválida en '${m.descripcion}'`);
      const oid = assertOrg(m.organizacion_id ?? null, `movimientos.${m.descripcion}`);
      return { ...m, monto: assertMonto(m.monto ?? null, `movimientos.${m.descripcion}`), evento_id: assertEvento(m.evento_id ?? null, `movimientos.${m.descripcion}`), organizacion_id: oid, organizacionNombre: oid ? orgNames.get(oid) ?? oid : null };
    });

    ejercicios.push({
      ano: y.ano,
      gobierno: y.gobierno,
      estado: y.estado,
      estado_label: y.estado_label,
      ley: y.ley,
      totales: y.totales,
      hitos: y.hitos ?? [],
      variaciones,
      movimientos,
      refs: orden,
    });
  }

  ejercicios.sort((a, b) => b.ano - a.ano);
  return { ejercicios, fuentes, formatCLP };
}

export type PresupuestoData = ReturnType<typeof build>;

/** Carga (y cachea por proceso) los ejercicios de /presupuesto. */
export function getPresupuesto(): PresupuestoData {
  if (!cache) cache = build();
  return cache;
}
