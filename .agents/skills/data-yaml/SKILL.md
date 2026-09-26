---
name: data-yaml
description: Colecciones markdown people/organizations/sources/topics/cifras + excepción YAML colectivos/sectores/sueldos, encoding y WHITELIST_MEDIOS. Usa esta skill SIEMPRE al tocar src/content/people|organizations|sources|topics|cifras/*.md o src/data/*.yaml, o cuando validate falle por medio/mojibake/BOM/CRLF, incluso si solo dice 'agregar persona'.
---

# Datos — colecciones markdown + excepción YAML

> Cuándo cargar: vas a tocar `src/content/people|organizations|sources|topics|cifras/*.md`, `src/data/colectivos.yaml|sectores.yaml|sueldos.yaml`, o te falla `pnpm run validate` por `medio`/mojibake/encoding/BOM/CRLF.
> **Handoff:** si cambias el schema de una colección, `WHITELIST_MEDIOS`, encoding o la lógica de `sueldos.yaml`, actualiza este skill en la misma sesión.

## Fuente de verdad (markdown, Obsidian)

`people`/`organizations`/`topics`/`sources`/`cifras` son colecciones Astro (`src/content.config.ts` + `glob`); cada entidad es un `.md` con frontmatter puro, sin fallback YAML. `registry.ts`/`queries.ts` leen el frontmatter `.md` directo — el monolito (`entities.yaml`/`sources.yaml`/`topics.yaml`) se eliminó en ago-2026 y **no existe en `src/data/`** (solo quedan `colectivos.yaml`, `sectores.yaml`, `sueldos.yaml`).

- `people/<id>.md` / `organizations/<id>.md`: `{ nombre, cargo?, organizacion?, cargos[]?, tipo?, pais?, notas?, bio?, aliases[]? }`. ID = filename snake_case. Ej: `src/content/people/aisen_etcheverry.md`, `src/content/organizations/ministerio_ciencia.md`. **Ojo nombres dentro de instituciones**: no crear `people/` para un nombre que vive mayormente como parte de una institución (caso sep-2026: `diego_portales`/`manuel_rodriguez` rompieron 9 eventos que dicen "Universidad Diego Portales" — se dejaron en prosa sin ficha ni wikilink).
- `sources/<medio-YYYY-MM-DD-slug>.md`: `{ tipo (=prensa por defecto), medio, titulo, autor, fecha, url, notas? }`. URLs siempre completas (ver `event-rules` regla 10). Ej: `src/content/sources/24horas-2026-07-20-estado-catastrofe.md`. IDs siempre slug ASCII sin acentos/ñ (`clarin-…`, nunca `clarín-…`): `validate` es error en `[[sources/…]]` no-ASCII (en people/orgs/cifras/events solo avisa; deuda saldada sep-2026: `mario_acuña→acuna`, `sergio_yañez→yanez`, `liceo_barros_borgoño→borgono`, `municipalidad_de_cañete→canete`, cifras `escaños/salmón`→ASCII, `[[organizations/ñuble]]`→prosa, `ministerio_publico|Fiscalía`→sin alias) y el plugin de render tampoco los enlaza (misma clase ASCII). `validate` NO chequea que la URL exista: al crear tandas, correr `pnpm run validate-sources -- --since YYYY-MM-DD` (chequeo con red; 403 = WAF aceptado, 404/410 = error) y crear con `pnpm run add-source -- --verify` (exige confirmación si el origen da 404/410).
- `topics/<id>.md`: `{ nombre, descripcion?, relacionados[]?, bio? }`. Ej: `src/content/topics/aborto.md`.
- `cifras/<concepto>.md`: `{ nombre, unidad_default, aliases[]?, fuente_oficial?, notas? }` — **solo cifras de carácter nacional/pais** (series INE/BCN/gobierno, presupuesto nacional, votaciones del Congreso). Una cifra regional/municipal/local (montos de causa judicial, presupuesto comunal) NO va aquí: se escribe como valor en prosa con su fuente inline, nunca `[[cifras/...]]`. Ver `content-model` para `[[cifras/concepto/valor/unidad]]`. Ej: `src/content/cifras/tasa_desocupacion.md`.
- Acceso: `getPeopleRegistry()` / `getOrganizationsRegistry()` (`registry.ts`), `getSourcesRegistry()` (`registry.ts`), `getTopicsRegistry()` (`registry.ts`), `getCifrasRegistry()` (`queries.ts`).

## Excepción YAML (`src/data/`)

Únicos YAML vivos: `colectivos.yaml` / `sectores.yaml` (arrays planos de strings, validan `impacto:`) y `sueldos.yaml` (ver abajo). `src/pages/data/[name].yaml.ts` tiene `ALLOWED` con nombres legacy (`entities`, `sources`, `topics`, …) pero si el `.yaml` falta lo **reconstruye desde las colecciones markdown** (fallback migración Obsidian).

### Campo `medio` en `sources/*.md`

Debe ser EXACTAMENTE `nombre` de una org `tipo: medio_comunicacion|red_social|canal_television|programa_tv|programa_streaming` registrada en `src/content/organizations/<id>.md`. Si el emisor no es prensa (Estado, encuestadora, plataforma, archivo documental o institución energética), usar el nombre descriptivo exacto y agregarlo a `WHITELIST_MEDIOS` en `scripts/validate/validate.mjs` cuando no sea una organización de tipo `medio_comunicacion` o `red_social` (por ejemplo, `U.S. Energy Information Administration`, `Atlantic Council`, `Gobierno de Argentina` o `Gobierno de Reino Unido`). Para las fuentes internacionales de innovación, los nombres canónicos son `Organización Mundial de la Propiedad Intelectual` y `Organización para la Cooperación y el Desarrollo Económicos`; ambos están en la lista blanca junto con el nombre completo del Ministerio de Ciencia. `CompaniesMarketCap` se usa como plataforma de datos y `Bolsa de Comercio de Santiago` como institución para sus publicaciones estadísticas; ambas están también en la lista blanca. La Unidad de Análisis Financiero (UAF) también está en la lista blanca porque sus comunicados son fuentes institucionales, no medios de comunicación. `pnpm run validate` falla con el ID si no cumple. Ver también encoding abajo.

### Sueldos (`/sueldos`)

Sin cifras ni entidades hardcodeadas:

- Personas por ID (`presidente_id`, `persona_id`, `firmante_id`) resueltas vía `getPeopleRegistry()` contra `src/content/people/*.md` — build falla si ID no existe.
- Referencias por ID de `src/content/sources/*.md` (`orden_refs` fija la numeración visible; `<SRef id="..."/>` resuelve el ID contra `getSourcesRegistry()` y evita desalineación al reordenar). `presidentes[].refs` y `vigencias[].fuente` también son IDs; toda fuente usada debe estar en `orden_refs`.
- `presidentes[].fecha_label` contiene únicamente el mes/año de referencia; nunca nombres de medios ni notas de fuente. La atribución vive en `refs[]` y `vigencias[].fuente`, y se renderiza como `SRef`/enlace a la fuente original. Si hace falta una precisión metodológica, va en `detalle`.
- Cada monto presidencial lleva `vigencias[]` (monto + fuente + descripción; opcionalmente `desde`, `hasta` y `tipo`) anti-stale; derivados (ratios, IPC, promedios y brechas) se calculan en `src/lib/sueldos.ts`.
- `serie_registro_publico.puntos[]` es la serie mensual bruta del Presidente desde 2025-01; `tipo` distingue observado, bono y proporcional. `ipc.ago_2026` es el destino de los ajustes y `registro_presidente_julio_2026` conserva la última lectura CFR.
- `indicadores[]` usa `ipc_inicio`/`ipc_fin` y sus fechas; la variación se deriva entre endpoints, sin producto de tasas anuales. Para mandatos anteriores a la serie BDE publicada, los endpoints pueden ser `null`.
- `ingresos_esi`, `costo_vida`, `imm_2026` y `casen_2024` conservan explícitamente año/periodo, unidad, definiciones y fuente. La página mantiene separados ingreso individual neto, ingreso de hogar, umbral por persona equivalente y remuneración bruta.
- YAML se sirve en `/data/sueldos.yaml`.

Ver `src/data/sueldos.yaml`, `src/lib/sueldos.ts`.

## Encoding y edición concurrente

- **NUNCA** PowerShell `Set-Content`/`Out-File`/`Add-Content` ni `>` sobre archivos del repo: reescriben con ANSI/CRLF y corrompen UTF-8 (un rename generó diff 31k líneas). Usar Node `readFileSync`/`writeFileSync` con `utf8` o tools Edit/Write del agente.
- YAML/frontmatter que empieza con `@ * & %` debe ir entre comillas: `autor: "@hernan_sr"`.
- Al crear archivos en tanda con la tool de escritura del agente, verificar que el frontmatter quede **con su delimitador de cierre `---`**: en sep-2026, 6 `sources/*.md` de una misma tanda quedaron sin la línea `---` final y `validate` falló con "wikilink roto … fuente no registrada" por cada cita (la regex de carga `^---\r?\n([\s\S]*?)\r?\n---` no matchea). Diagnóstico rápido con Node replicando la regex del validador + `YAML.parse`; reparación determinista: leer, añadir `---\n` final si falta, `writeFileSync utf8`.
- En escalares multilínea (ej. `notas:` a varias líneas) evita `: ` dentro del texto y `:` al final de la primera línea — YAML lo lee como nested mapping (`Nested mappings are not allowed in compact mappings`, caso sep-2026 en 4 fuentes nuevas). Reescribe con `;` o `, con` en vez de `:`. **Alternativa para `titulo:`** que deba conservar los dos puntos: comillar el valor completo del campo (`titulo: "X: Y"` — caso `emol-2026-09-05-formalizan-quiroz-prohibicion`); si el título además lleva comillas internas, escaparlas (`titulo: "X: \"...\""` — caso `theclinic-2026-09-05-formalizado-quiroz-broma`).
- `validate` lee las colecciones markdown (+ los 3 YAML vivos) al inicio con fallback md si el YAML falta; su detector de mojibake cubre doble-encoding C2/C3, controles C1 (`â€”`), U+FFFD, cirílico, Latin Ext-A/B **y CJK/kana/fullwidth**, y escanea `sources`/`people`/`organizations`/`cifras`/`topics`/**`events`** + `TAREAS/**/*.md` (rechaza BOM UTF-8 inicial). Caso sep-2026 que motivó los rangos CJK y el barrido de `events`: un `documenta` completo en cirílico dentro de un evento, una etiqueta `系统_frontal` en otro, y texto CJK en dos notas de fuente — el rango anterior no los cubría y `events` no se escaneaba. Si algún día una cita legítima va en otro idioma, transcribirla o ajustar `MOJIBAKE_RE` en `scripts/validate/validate.mjs` con un comentario que lo justifique. Si falso positivo por nombre legítimo, ajustar `MOJIBAKE_RE`.
- Edición concurrente: verificar `git status` antes de operaciones masivas. Protocolo recuperación: (1) copiar dañado a temp fuera del repo; (2) `git checkout -- <archivo>`; (3) re-aplicar entradas extrayendo del backup con script Node (split por IDs) y concatenando utf8; (4) `node scripts/validate/validate.mjs`.

## Lectura de archivos: CRLF y wikilinks (extracción)

El corpus es mixto: la mayoría de los eventos están en **CRLF** (1.362 de 1.543 al último conteo). Dos clases de bug ya baratas de reintroducir:

- **Toda regex de frontmatter debe llevar `\r?`**: `^---\r?\n([\s\S]*?)\r?\n---`. Con el patrón estricto (`\n` solo), los archivos CRLF no matchean y el lector se los salta **en silencio** — sin error, sin evento, sin cita. Pasó con `extractEntities.ts` (era el único lector sin `\r?`; dejó las declaraciones en 0 de 1.711) y con `editorData.ts` (dejó etiquetas e impactos vacíos en el admin). Al añadir un lector de `.md`, copiar la regex de `registry.ts`, que ya es la correcta.
- **El corpus escribe wikilinks en plural**: `[[people/id]]` y `[[sources/id]]`, nunca `[[person/]]` ni `[[source/]]`. Un regex con el singular en silencio no encuentra nada. Aceptar ambos con `[[(people|person)/…]]`.
- La atribución de una cita es el **último** wikilink de la línea: el grupo del texto debe ser `(.+)` greedy, no `(.+?)` lazy, o `> X - [[people/a]] y luego - [[people/b]]` se atribuye a `a`.
- **Una cita puede ocupar varias líneas de blockquote** y poner la atribución solo en la última:
  ```
  > Párrafo uno.
  >
  > Párrafo dos.
  > - [[people/id]] [[sources/id]]
  ```
  Hay que **acumular la racha de líneas `>`** y usar la última con atribución como cierre, uniendo los párrafos con `\n\n`. Si se evalúa línea por línea sobrevive solo la de la atribución: de esa cita de Boric se mostraba únicamente "Unabraso" (2 casos en el corpus, ambos en `2026/09/20260922-3.md`). Una línea vacía **sin** `>` cierra el grupo; una línea `>` suelta solo separa párrafos.
- Admite alias: `[[people/id|Nombre legible]]` y `[[people/alejandro_layseca|Alejandro Layseca]]`. El patrón de id es `[A-Za-z0-9_.-]+` y el alias opcional `(?:\|[^\]]*)?` antes de `]]`; sin eso los 58 wikilinks con alias del corpus no contaban como entidad.

## Colecciones Astro (sin fallback YAML)

`content.config.ts` define las 6 colecciones vía `glob` (`events`, `people`, `organizations`, `topics`, `sources`, `cifras`). `registry.ts` (`people/orgs/topics/sources`), `queries.ts` (`cifras`) y `editorData.ts` (admin) leen `.md` directo, sin fallback: el monolito (`entities/sources/topics.yaml`) se eliminó en ago-2026 y ninguna ruta de código lo lee. Excepción: `src/pages/data/[name].yaml.ts` reconstruye `entities`/`sources`/`topics` desde md para mantener vivas las URLs públicas `/data/*.yaml` (ver `llmIndex.ts`). `extractEntities.ts` extrae wikilinks del `.md` crudo con regex cacheada.
