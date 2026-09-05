---
name: data-yaml
description: Colecciones markdown people/organizations/sources/topics/cifras + excepción YAML colectivos/sectores/sueldos, encoding y WHITELIST_MEDIOS. Usa esta skill SIEMPRE al tocar src/content/people|organizations|sources|topics|cifras/*.md o src/data/*.yaml, o cuando validate falle por medio/mojibake/BOM/CRLF, incluso si solo dice 'agregar persona'.
---

# Datos — colecciones markdown + excepción YAML

> Cuándo cargar: vas a tocar `src/content/people|organizations|sources|topics|cifras/*.md`, `src/data/colectivos.yaml|sectores.yaml|sueldos.yaml`, o te falla `pnpm run validate` por `medio`/mojibake/encoding/BOM/CRLF.
> **Handoff:** si cambias el schema de una colección, `WHITELIST_MEDIOS`, encoding o la lógica de `sueldos.yaml`, actualiza este skill en la misma sesión.

## Fuente de verdad (markdown, Obsidian)

`people`/`organizations`/`topics`/`sources`/`cifras` son colecciones Astro (`src/content.config.ts` + `glob`); cada entidad es un `.md` con frontmatter puro, sin fallback YAML. `registry.ts`/`queries.ts` leen el frontmatter `.md` directo — el monolito (`entities.yaml`/`sources.yaml`/`topics.yaml`) se eliminó en ago-2026 y **no existe en `src/data/`** (solo quedan `colectivos.yaml`, `sectores.yaml`, `sueldos.yaml`).

- `people/<id>.md` / `organizations/<id>.md`: `{ nombre, cargo?, organizacion?, cargos[]?, tipo?, pais?, notas?, bio?, aliases[]? }`. ID = filename snake_case. Ej: `src/content/people/aisen_etcheverry.md`, `src/content/organizations/ministerio_ciencia.md`.
- `sources/<medio-YYYY-MM-DD-slug>.md`: `{ tipo (=prensa por defecto), medio, titulo, autor, fecha, url, notas? }`. URLs siempre completas (ver `event-rules` regla 10). Ej: `src/content/sources/24horas-2026-07-20-estado-catastrofe.md`. IDs siempre slug ASCII sin acentos/ñ (`clarin-…`, nunca `clarín-…`): `validate` es error en `[[sources/…]]` no-ASCII (en people/orgs/cifras/events solo avisa; deuda saldada sep-2026: `mario_acuña→acuna`, `sergio_yañez→yanez`, `liceo_barros_borgoño→borgono`, `municipalidad_de_cañete→canete`, cifras `escaños/salmón`→ASCII, `[[organizations/ñuble]]`→prosa, `ministerio_publico|Fiscalía`→sin alias) y el plugin de render tampoco los enlaza (misma clase ASCII). `validate` NO chequea que la URL exista: al crear tandas, correr `pnpm run validate-sources -- --since YYYY-MM-DD` (chequeo con red; 403 = WAF aceptado, 404/410 = error) y crear con `pnpm run add-source -- --verify` (exige confirmación si el origen da 404/410).
- `topics/<id>.md`: `{ nombre, descripcion?, relacionados[]?, bio? }`. Ej: `src/content/topics/aborto.md`.
- `cifras/<concepto>.md`: `{ nombre, unidad_default, aliases[]?, fuente_oficial?, notas? }` (serie nacional; ver `content-model` para `[[cifras/concepto/valor/unidad]]`). Ej: `src/content/cifras/tasa_desocupacion.md`.
- Acceso: `getPeopleRegistry()` / `getOrganizationsRegistry()` (`registry.ts`), `getSourcesRegistry()` (`registry.ts`), `getTopicsRegistry()` (`registry.ts`), `getCifrasRegistry()` (`queries.ts`).

## Excepción YAML (`src/data/`)

Únicos YAML vivos: `colectivos.yaml` / `sectores.yaml` (arrays planos de strings, validan `impacto:`) y `sueldos.yaml` (ver abajo). `src/pages/data/[name].yaml.ts` tiene `ALLOWED` con nombres legacy (`entities`, `sources`, `topics`, …) pero si el `.yaml` falta lo **reconstruye desde las colecciones markdown** (fallback migración Obsidian).

### Campo `medio` en `sources/*.md`

Debe ser EXACTAMENTE `nombre` de una org `tipo: medio_comunicacion|red_social|canal_television|programa_tv|programa_streaming` registrada en `src/content/organizations/<id>.md`. Si el emisor no es prensa (Estado, encuestadora, plataforma), usar nombre descriptivo y agregarlo a `WHITELIST_MEDIOS` en `scripts/validate/validate.mjs`. `pnpm run validate` falla con el ID si no cumple. Ver también encoding abajo.

### Sueldos (`/sueldos`)

Sin cifras ni entidades hardcodeadas:

- Personas por ID (`presidente_id`, `persona_id`, `firmante_id`) resueltas vía `getPeopleRegistry()` contra `src/content/people/*.md` — build falla si ID no existe.
- Referencias por ID de `src/content/sources/*.md` (`orden_refs` fija numeración `[N]`; `<SRef n={N}/>` resuelve contra `getSourcesRegistry()`). Insertar/eliminar fuente = tocar solo `orden_refs`.
- Cada monto lleva `vigencias[]` (monto + fuente + descripción) anti-stale; derivados (ratios, IPC, promedios) se calculan en `src/lib/sueldos.ts`.
- `serie_registro_publico.puntos[]` serie mensual bruta Presidente desde 2025-01 (fuente registro 23-ago-2026) para SVG estático.
- YAML se sirve en `/data/sueldos.yaml`.

Ver `src/data/sueldos.yaml`, `src/lib/sueldos.ts`.

## Encoding y edición concurrente

- **NUNCA** PowerShell `Set-Content`/`Out-File`/`Add-Content` ni `>` sobre archivos del repo: reescriben con ANSI/CRLF y corrompen UTF-8 (un rename generó diff 31k líneas). Usar Node `readFileSync`/`writeFileSync` con `utf8` o tools Edit/Write del agente.
- YAML/frontmatter que empieza con `@ * & %` debe ir entre comillas: `autor: "@hernan_sr"`.
- En escalares multilínea (ej. `notas:` a varias líneas) evita `: ` dentro del texto y `:` al final de la primera línea — YAML lo lee como nested mapping (`Nested mappings are not allowed in compact mappings`, caso sep-2026 en 4 fuentes nuevas). Reescribe con `;` o `, con` en vez de `:`.
- `validate` lee las colecciones markdown (+ los 3 YAML vivos) al inicio con fallback md si el YAML falta; su detector de mojibake cubre doble-encoding C2/C3, controles C1 (`â€”`), U+FFFD, cirílico, Latin Ext-A/B. Reporta 3 ejemplos. También escanea `TAREAS/**/*.md` y rechaza BOM UTF-8 inicial. Si falso positivo por nombre legítimo, ajustar `MOJIBAKE_RE`.
- Edición concurrente: verificar `git status` antes de operaciones masivas. Protocolo recuperación: (1) copiar dañado a temp fuera del repo; (2) `git checkout -- <archivo>`; (3) re-aplicar entradas extrayendo del backup con script Node (split por IDs) y concatenando utf8; (4) `node scripts/validate/validate.mjs`.

## Colecciones Astro (sin fallback YAML)

`content.config.ts` define las 6 colecciones vía `glob` (`events`, `people`, `organizations`, `topics`, `sources`, `cifras`). `registry.ts` (`people/orgs/topics/sources`), `queries.ts` (`cifras`) y `editorData.ts` (admin) leen `.md` directo, sin fallback: el monolito (`entities/sources/topics.yaml`) se eliminó en ago-2026 y ninguna ruta de código lo lee. Excepción: `src/pages/data/[name].yaml.ts` reconstruye `entities`/`sources`/`topics` desde md para mantener vivas las URLs públicas `/data/*.yaml` (ver `llmIndex.ts`). `extractEntities.ts` extrae wikilinks del `.md` crudo con regex cacheada.
