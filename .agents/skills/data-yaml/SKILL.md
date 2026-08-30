---
name: data-yaml
description: Datos YAML del vault con entities.yaml, sources.yaml, topics.yaml, colectivos/sectores y sueldos.yaml, encoding y WHITELIST_MEDIOS. Usa esta skill SIEMPRE al tocar src/data/*.yaml, agregar persona/org/cifra/fuente, o cuando validate falle por medio/mojibake/BOM/CRLF, incluso si solo dice 'agregar persona'.
---

# Datos YAML — entities, sources, topics, colectivos, sectores, sueldos

> Cuándo cargar: vas a tocar `src/data/*.yaml`, `entities.yaml`, `sources.yaml`, `topics.yaml`, `colectivos.yaml`, `sectores.yaml`, `sueldos.yaml`, o te falla `pnpm run validate` por `medio`/mojibake/encoding.
> **Handoff:** si cambias el schema YAML, `WHITELIST_MEDIOS`, encoding o la lógica de `sueldos.yaml`, actualiza este skill en la misma sesión.

## Formatos

- `entities.yaml`: secciones `people`, `organizations`, `cifras` (cada una por ID snake_case). Personas/orgs nuevas van aquí.
- `sources.yaml`: `id-slug: { tipo, medio, titulo, autor, fecha, url }` — ID `medio-YYYY-MM-DD-slug`. URLs siempre completas (ver `event-rules.md` regla 10).
- `topics.yaml`: `id: { nombre, descripcion, relacionados: [] }`.
- `colectivos.yaml` / `sectores.yaml`: arrays planos de strings.
- `sueldos.yaml`: ver sección sueldos abajo. Se sirve en `/data/sueldos.yaml` (`ALLOWED` en `src/pages/data/[name].yaml.ts`).

### Campo `medio` en `sources.yaml`

Debe ser EXACTAMENTE `nombre` de una org `tipo: medio_comunicacion|red_social|canal_television|programa_tv|programa_streaming` en `entities.yaml`. Si emisor no es prensa (Estado, encuestadora, plataforma), usar nombre descriptivo y agregarlo a `WHITELIST_MEDIOS` en `scripts/validate.mjs`. `pnpm run validate` falla con el ID si no cumple. Ver también encoding abajo.

### Sueldos (`/sueldos`)

Sin cifras ni entidades hardcodeadas:

- Personas por ID (`presidente_id`, `persona_id`, `firmante_id`) resueltas vía `getPeopleRegistry()` — build falla si ID no existe.
- Referencias por ID de `sources.yaml` (`orden_refs` fija numeración `[N]`; `<SRef n={N}/>` resuelve contra `getSourcesRegistry()`). Insertar/eliminar fuente = tocar solo `orden_refs`.
- Cada monto presidencial lleva `vigencias[]` (monto + fuente + descripción) anti-stale; derivados (ratios, IPC, promedios) se calculan en `src/lib/sueldos.ts`.
- `serie_registro_publico.puntos[]` serie mensual bruta Presidente desde 2025-01 (fuente registro 23-ago-2026) para SVG estático.
- YAML se sirve en `/data/sueldos.yaml`.

Ver `src/data/sueldos.yaml`, `src/lib/sueldos.ts`.

## Encoding y edición concurrente

- **NUNCA** PowerShell `Set-Content`/`Out-File`/`Add-Content` ni `>` sobre archivos del repo: reescriben con ANSI/CRLF y corrompen UTF-8 (un rename generó diff 31k líneas). Usar Node `readFileSync`/`writeFileSync` con `utf8` o tools Edit/Write del agente.
- YAML que empieza con `@ * & %` debe ir entre comillas: `autor: "@hernan_sr"`.
- `validate` parsea los 5 YAML al inicio y su detector de mojibake cubre doble-encoding C2/C3, controles C1 (`â€”`), U+FFFD, cirílico, Latin Ext-A/B. Reporta 3 ejemplos. También escanea `TAREAS/**/*.md` y rechaza BOM UTF-8 inicial. Si falso positivo por nombre legítimo, ajustar `MOJIBAKE_RE`.
- Edición concurrente: verificar `git status` antes de operaciones masivas. Protocolo recuperación: (1) copiar dañado a temp fuera del repo; (2) `git checkout -- <archivo>`; (3) re-aplicar entradas extrayendo del backup con script Node (split por IDs) y concatenando utf8; (4) `node scripts/validate.mjs`.

## Colecciones Astro vs YAML

`content.config.ts` define `people`/`organizations`/`topics` pero no existen directorios — datos fluyen vía YAML + `registry.ts` (`getPeopleRegistry()` etc.). `extractEntities.ts` extrae wikilinks del `.md` crudo con regex cacheada.
