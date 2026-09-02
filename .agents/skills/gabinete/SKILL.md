---
name: gabinete
description: Gabinete, cargos históricos y Cuentas Públicas con cabinet.ts, cargos[] y convención YYYY0601-1. Usa esta skill SIEMPRE al tocar src/pages/gabinete.astro, src/lib/cabinet.ts, campo cargos en entities.yaml o Cuentas Públicas, incluso si solo dice 'actualizar ministro'.
---

# Gabinete, cargos y Cuentas Públicas

> Cuándo cargar: tocas `src/pages/gabinete.astro`, `src/lib/cabinet.ts`, el campo `cargos` en `entities.yaml`, o la convención de Cuentas Públicas.
> **Handoff:** si cambias `cabinet.ts`, `cargos[]`, `KEYWORD_MINISTERIO` o la convención `YYYY0601-1`, actualiza este skill en la misma sesión.

## Página `/gabinete` (titulares ministeriales)

Generada en build por `src/lib/cabinet.ts` desde `entities.yaml` — no se mantiene a mano. Muestra cartera → titular en ejercicio + histórico con periodos.

- **Qué recolecta:** personas cuyo `cargo` top-level o `cargos[]` empieza con `Ministro/a de…` / `Biministro/a de…`. Excluye `Ministro de la Corte…` y extranjeros.
- **Resolución cartera:** keyword del texto (diccionario en `cabinet.ts`), fallback a org si tipo `ministerio`/`segegob`. Biministro se separa en carteras (`"Biministro de X y Y"` → X + Y).
- **Dedupe:** si `cargo` top-level duplica `cargos[]` (mismo texto normalizado sin acentos), gana `cargos[]` (tiene fechas).
- **Vigencia:** sin `hasta` = en ejercicio. Top-level sin fechas → `fechasSinRegistrar`.
- **Carteras válidas:** `MINISTERIO_ORG_IDS` = orgs tipo `ministerio` + `segegob` + `ministerio_desarrollo_social`. Al agregar cartera como org, revisar lista.
- **Orden keywords:** `interior` antes que `seguridad publica` (nombre histórico incluye “y Seguridad Publica”). No reordenar sin re-verificar.
- **Org pages:** `organizations/[id].astro` muestra “Titulares del ministerio” para carteras (mismo helper).
- **“Hoy”:** fecha del build en SSR + `gvRefreshHoy()` re-ancla corte/barras/duraciones a fecha real del cliente si deploy stale (ver `gabinete.astro`).
- **Verificación fechas (1938-2026):** matriz por gobierno en `TAREAS/GABINETES-VERIFICACION.md` (estado ✅/🟡) con fuentes (Minsal, BCN, gob.cl, Diario Oficial, archivo Lagos UDP). Convención `desde` = juramento, `hasta` = cesación. Auditoría: `pnpm run verify-gabinete` vs anexos Wikipedia (cache `sitemaps/.cache/gabinete-wiki/`). Carteras históricas mapeadas `KEYWORD_MINISTERIO` (Guerra/Marina/Aviación→Defensa, etc.). Subsecretarios no se trackean en `cargos[]` para `/gabinete` (solo ministros); jefes de gabinete y cargos de confianza sí con `desde`/`hasta` verificados vía Diario Oficial + InfoLobby.

Para ajustar un ministro, editar `cargo`/`cargos[]` en `entities.yaml`.

## Campo `cargos` (historial de personas)

```yaml
cargos:
  - cargo: Seremi de Salud de Arica y Parinacota
    organizacion: seremi_salud_arica
    desde: 2026-03-26  # https://www.leylobby.gob.cl/instituciones/AI009/cargos-pasivos?todos=1
    hasta: 2026-07-30  # https://www.diariooficial.interior.gob.cl/publicaciones/2026/07/30/...
  - cargo: Jefe de gabinete de la Subsecretaría de la Niñez
    organizacion: ministerio_desarrollo_social
    desde: 2026-07-09  # https://www.leylobby.gob.cl/instituciones/AI009/cargos-pasivos?todos=1 + https://www.diariooficial.interior.gob.cl/publicaciones/2026/07/23/44506/01/2840050.pdf
```

`cargo`/`organizacion` top-level quedan como rol actual (retrocompat). `src/pages/people/[id].astro` renderiza lista + diagrama Mermaid `timeline` si hay `desde`. Solo fechas verificables. Dep `mermaid` solo en páginas con timeline. **Trazabilidad:** cada `desde`/`hasta` lleva comentario inline `# <URL>` con la URL exacta de la fuente (InfoLobby/Diario Oficial/BCN) para replicar la búsqueda.

## Cuentas Públicas presidenciales

Cada Cuenta Pública ante Congreso Pleno tiene **un evento master**:

- **ID:** `YYYY0601-1`, `tipo: declaracion`, `etiqueta: cuenta_publica`.
- **Body:** secciones por eje (seguridad, economía, cuidados, DDHH, educación, infra/energía, reacciones), cada anuncio con `[[cifras/...]]` y fuentes inline.
- **Fuentes:** sitio oficial `gob.cl/cuentapublicaYYYY` (`medio: Gobierno de Chile`) + 2-3 medios del día (grep sitemaps `'cuenta publica' ... | grep '<año>-06'`).
- **Anuncios granulares:** al implementarse, crear eventos propios con `relaciones: amplia`/`deriva_en`/`responde_a` hacia el master (ej. CP 2026 Kast `20260601-5` + `20260601-2/3`, `20260602-4`).
- **Verificación:** cifras como `[[cifras/...]]`; seguimiento en `TAREAS/SEGUIMIENTO/` “Cuentas Públicas — seguimiento” (`TAREAS/SEGUIMIENTO_INDEX.md`).
- **Estado serie:** 2022 ⬜ · 2023 ✅ `20230601-1` · 2024 ✅ `20240601-1` · 2025 ✅ `20250601-1` (master ampliada, Punta Peuco como sección) · 2026 ✅ `20260601-5`.
- Sectoriales/ministeriales (ej. Minsal `20260729-17`) generan eventos pero no son masters presidenciales.
