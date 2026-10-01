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

Debe ser EXACTAMENTE `nombre` (o un `alias`) de una org registrada en `src/content/organizations/<id>.md`, de cualquier `tipo` (prensa, Estado, encuestadora, plataforma, archivo documental…). Solo si el emisor es efímero y deliberadamente no tendrá ficha (documento filtrado, compilación ciudadana, plataforma puntual), usar el nombre descriptivo exacto y agregarlo a `WHITELIST_MEDIOS_LIST` en `scripts/validate/validate.mjs` (por ejemplo, `Gobierno de Argentina` o `Gobierno de Reino Unido`). `U.S. Energy Information Administration` y `Atlantic Council` se validan por su ficha org. Si el término difiere del canónico (sigla entre paréntesis, sin tilde, nombre histórico), corregir el `medio:` en la fuente, no agregar un alias para acomodarlo: el alias oculta renames reales (caso `Ministerio del Interior`, renombrado en 2025, que parecía variante). Para las fuentes internacionales de innovación, los nombres canónicos son `Organización Mundial de la Propiedad Intelectual` y `Organización para la Cooperación y el Desarrollo Económicos`; ambos se validan por su ficha org (`wipo.md`, `ocde.md`), igual que el Ministerio de Ciencia. `CompaniesMarketCap` se usa como plataforma de datos y `Bolsa de Comercio de Santiago` como institución para sus publicaciones estadísticas; `CompaniesMarketCap` sigue en la lista blanca como plataforma sin ficha; `Bolsa de Comercio de Santiago` se valida por su ficha org. La Unidad de Análisis Financiero (UAF) se valida por su ficha org; sus comunicados son fuente institucional, no medio de comunicación. La `Fundación Nodo XXI` se valida por su ficha org y actúa como autora de documentos primarios (presentaciones de su encuesta Chile Actual). Para **historia económica y archivos documentales** los medios canónicos son `Biblioteca del Congreso Nacional de Chile` (ficha org; los PDF de Asesoría Técnica Parlamentaria en `bcn.cl/obtienearchivo`, que dan 503 intermitente por WAF pero se descargan completos con `pdf-extract`) y `Biblioteca del Congreso Nacional (LeyChile)` para el texto de normas; `Memoria Chilena` (fichas de la Biblioteca Nacional, con org propia), `Economía y Sociedad` (ficha org; dossier Revolución Liberal, que reproduce documentos primarios), `Fundación de Estudios Económicos BHC` (ficha org; publicaciones de los ciclos de conferencias de 1975), `Revista Santiago` y las revistas académicas `Cuadernos de Historia (SciELO)` y `Perfiles Económicos`. El patrón de revista es `Título de la revista (SciELO)`, igual que `Andes Pediátrica (SciELO)`. `pnpm run validate` falla con el ID si no cumple. Ver también encoding abajo.

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

## Anti-duplicados — verificar antes de crear entidad

Antes de crear un archivo en `src/content/organizations/*.md`, `src/content/people/*.md` o `src/content/sources/*.md`:

1. **Buscar por nombre normalizado:** `rg -i '^nombre:.*<término>' src/content/organizations/`
2. **Buscar por sigla/ID aproximado:** `rg -i '<sigla>' src/content/organizations/`
3. **Si ya existe** → reutilizar el ID existente o agregar `aliases[]` al archivo previo
4. **ID y `nombre` con nombre completo, nunca abreviado:** la forma corta (`eduardo_frei`, `victor_perez`) colisiona con homónimos y obliga a una segunda ficha desambiguadora. Nuevas personas: `nombre_apellido_paterno_apellido_materno.md` con `nombre` completo (`eduardo_frei_ruiz_tagle.md` / `Eduardo Frei Ruiz-Tagle` — caso sep-2026: distinguió del padre `eduardo_frei_montalva`). Nuevas orgs: nombre institucional completo, no sigla (`union_democrata_independiente`, no `udi`; la sigla va en `aliases[]`). Si un homónimo real aparece después, la ficha abreviada preexistente se renombra a completa y la variante queda en `aliases[]`.

El campo `aliases[]` en frontmatter (ya soportado por el schema) permite registrar siglas y variantes de nombre sin crear archivos duplicados:

```yaml
nombre: Unión Demócrata Independiente (UDI)
aliases: [UDI, "UDI Chile"]
```

Script de validación: `node scripts/validate/check-duplicates.mjs` (solo `organizations`), `--all` añade `people`, `--strict` omite la heurística de sigla, `--json` para consumo programático. Escanea `organizations` y `people`; **`sources` se excluye a propósito** (su identidad es el ID `medio-fecha-slug`, y comparar por `medio` haría colisionar todos los artículos de un mismo medio). Compara el `nombre` normalizado (sin acentos, sin paréntesis de país) y exige `pais` compatible, para no confundir homónimos de países distintos. Salida: aviso (exit 1) sin tocar el build; `validate.mjs` imprime un resumen de nombres duplicados en cada corrida.

## Encoding y edición concurrente

- **NUNCA** PowerShell `Set-Content`/`Out-File`/`Add-Content` ni `>` sobre archivos del repo: reescriben con ANSI/CRLF y corrompen UTF-8 (un rename generó diff 31k líneas). Usar Node `readFileSync`/`writeFileSync` con `utf8` o tools Edit/Write del agente.
- YAML/frontmatter que empieza con `@ * & %` debe ir entre comillas: `autor: "@hernan_sr"`.
- Al crear archivos en tanda con la tool de escritura del agente, verificar que el frontmatter quede **con su delimitador de cierre `---`**: en sep-2026, 6 `sources/*.md` de una misma tanda quedaron sin la línea `---` final y `validate` falló con "wikilink roto … fuente no registrada" por cada cita (la regex de carga `^---\r?\n([\s\S]*?)\r?\n---` no matchea). Diagnóstico rápido con Node replicando la regex del validador + `YAML.parse`; reparación determinista: leer, añadir `---\n` final si falta, `writeFileSync utf8`. Sep-2026 (segunda vez, sin `notas:`): el recorte afecta de forma sistemática a los archivos cuyo frontmatter **termina en un bloque `notas: |`** multilínea, mientras los que cierran en `url:` o `autor:` salen intactos (9 de 9 en una tanda). Antes de dar por buena una tanda nueva, correr `node .agents/skills/data-yaml/scripts/check-frontmatter.mjs [archivos…]` (barrido de las colecciones, o de los archivos que acabas de escribir): aplica la misma regex del validador más `YAML.parse`, reporta los que no cierran y devuelve código 1. No modifica nada.
- **Doble zona horaria en `fecha`:** `fecha: 2026-09-24T23:14:10-03:00:00` (offset repetido, típico de concatenar `+HH:MM:00` sobre un ISO que ya lo traía) lo interpreta YAML como mapa anidado, no como fecha: `astro build` aborta con `InvalidContentEntryDataError … fecha: Expected type "date", received "object"` **después** de que `validate` pase (el validador lee el frontmatter con regex y no comprueba el tipo). En eventos va `...T22:01:00Z`; en fuentes basta `YYYY-MM-DD`. Barrido: `rg -l "^fecha: \d{4}-\d{2}-\d{2}T[\d:]+[-+]\d{2}:\d{2}:00\s*$" src/content/`.
- En escalares multilínea (ej. `notas:` a varias líneas) evita `: ` dentro del texto y `:` al final de la primera línea — YAML lo lee como nested mapping (`Nested mappings are not allowed in compact mappings`, caso sep-2026 en 4 fuentes nuevas). Reescribe con `;` o `, con` en vez de `:`. **Alternativa para `titulo:`** que deba conservar los dos puntos: comillar el valor completo del campo (`titulo: "X: Y"` — caso `emol-2026-09-05-formalizan-quiroz-prohibicion`); si el título además lleva comillas internas, escaparlas (`titulo: "X: \"...\""` — caso `theclinic-2026-09-05-formalizado-quiroz-broma`).
- `validate` carga los datos con `readCollection(nombre)` (`scripts/validate/validate.mjs`), que se llama por **nombre lógico** (`'entities'`, `'sources'`, `'topics'`, `'colectivos'`, `'sectores'`) y no por filename: las colecciones markdown se leen de `src/content/<coll>/*.md` y solo la excepción YAML resuelve `src/data/<nombre>.yaml`. Mismo criterio en `scripts/generate/generate-index.mjs`. Si algún día hay que tocar ese lector, copiar la regex `^---\r?\n([\s\S]*?)\r?\n---` de `registry.ts`. Su detector de mojibake cubre doble-encoding C2/C3, controles C1 (`â€”`), U+FFFD, cirílico, Latin Ext-A/B **y CJK/kana/fullwidth**, y escanea `sources`/`people`/`organizations`/`cifras`/`topics`/**`events`** + `TAREAS/**/*.md` (rechaza BOM UTF-8 inicial). Caso sep-2026 que motivó los rangos CJK y el barrido de `events`: un `documenta` completo en cirílico dentro de un evento, una etiqueta `系统_frontal` en otro, y texto CJK en dos notas de fuente — el rango anterior no los cubría y `events` no se escaneaba. Si algún día una cita legítima va en otro idioma, transcribirla o ajustar `MOJIBAKE_RE` en `scripts/validate/validate.mjs` con un comentario que lo justifique. Si falso positivo por nombre legítimo, ajustar `MOJIBAKE_RE`. Para un barrido puntual de lo que escribiste en la sesión, el `rg` con el rango CJK/cirílico sirve, pero las líneas que **documentan** el propio detector contienen caracteres C1 a propósito (los ejemplos `â€”` del patrón): aparecen en este skill y en `validate.mjs`, así que hay que revisar el contexto de cada match y no reparar a ciegas.
- **Prosa larga puede salir con tokens basura al escribirla de una vez**: al redactar párrafos de más de un bloque con la tool de escritura, la salida puede pegarse con CJK, cirílico o palabras en inglés metidas en la frase española. `validate` NO lo detecta (solo mira frontmatter, wikilinks y entidades). Barrido antes de dar por buena la tanda: `rg -n "[\x{3000}-\x{9FFF}\x{0400}-\x{04FF}]" src/content/events/ src/content/sources/` y `read` de los párrafos largos. Para corregir, usar `edit` con `oldString` copiado del `read` (trae el `\r\n` del corpus) y texto de reemplazo corto; **no** regex largas dentro de `node -e` (el quoting de PowerShell las rompe). Escribir la prosa frase por frase con `edit` es más seguro que un `write` de 40 líneas.
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
- Prohibido alias inline `[[people/id|Texto]]`: el render muestra el `nombre` canónico del registry. Los lectores lo toleran solo como red de seguridad (`(?:\|[^\]]*)?` antes de `]]` en `extractEntities.ts`, `remarkWikiLinks.mjs` y `validate.mjs`); `validate.mjs` lo marca como error.

## Colecciones Astro (sin fallback YAML)

`content.config.ts` define las 6 colecciones vía `glob` (`events`, `people`, `organizations`, `topics`, `sources`, `cifras`). `registry.ts` (`people/orgs/topics/sources`), `queries.ts` (`cifras`) y `editorData.ts` (admin) leen `.md` directo, sin fallback: el monolito (`entities/sources/topics.yaml`) se eliminó en ago-2026 y ninguna ruta de código lo lee. Los scripts (`validate.mjs`, `generate-index.mjs`) también leen `.md` directo vía `readCollection(nombre)`. Excepción: `src/pages/data/[name].yaml.ts` reconstruye `entities`/`sources`/`topics` desde md para mantener vivas las URLs públicas `/data/*.yaml` (ver `llmIndex.ts`). `extractEntities.ts` extrae wikilinks del `.md` crudo con regex cacheada.
