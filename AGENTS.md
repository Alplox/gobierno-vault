# Gobierno Vault — Guia para Agentes

> Este archivo se auto-actualiza. Si descubres un patron, convencion o cambio
> que no este documentado aqui, agregarlo. Un agente que no actualiza
> AGENTS.js deja de ser util para el proximo agente.

## Que es esto

Base de conocimiento estatica sobre eventos de gobierno en Chile.
Astro 7 + Tailwind, output `static` (SSG). Lenguaje: espanol.

Archivo `EVENTS_INDEX.md` permite contexto rápido para agentes y usuarios.

Archivo `TAREAS.md` es la bitácora de eventos detectados como faltantes (recency bias):
cuando se detecte un evento pendiente que no se implementará en el momento, registrarlo ahí
con fecha, tipo sugerido y estado (`⬜ pendiente`). Al crearlo, marcar `✅ hecho` con el ID.
**Toda entrada pendiente debe incluir su origen: `Origen: <url>`** — la URL que entregó el
usuario o la fuente que reveló la brecha (si el origen es una red social, además la URL de
prensa que la valida). Así retomar la tarea no exige re-buscar por el titular.

## Transiciones de página (View Transitions)

El sitio usa `ClientRouter` de `astro:transitions` (habilitado en `src/layouts/Base.astro`).

- **Navegación SPA con morphing:** los títulos de eventos, personas, organizaciones, temas y
  fuentes usan `transition:name` compartido entre la tarjeta/índice y la página de detalle
  (ej: `event-title-${basename}`), lo que produce el efecto de "expandir el título".
- **Nav persistente:** `<nav transition:persist>` mantiene la barra sin parpadeo; el estado
  activo se recalcula en cliente vía `astro:page-load` (`updateNavActive` en Base.astro).
- **Prefetch:** `astro.config.mjs` define `prefetch: { prefetchAll: true, defaultStrategy: 'hover' }`
  para precargar páginas al hover (elimina la sensación de carga lenta).
- **Reglas para scripts:** los scripts de página se re-ejecutan en cada navegación. Los listeners
  globales de `window`/`document` deben registrarse una sola vez (guard `window.__gvXxxInit`) y
  limpiarse antes de re-montar (patrón `cleanupFns` + `cleanup()`). No usar `DOMContentLoaded`;
  usar `astro:page-load` si el código depende del DOM intercambiado. **Ojo:** los `<script>`
  bundleados sólo se ejecutan UNA vez (no re-ejecutan en cada navegación View Transition). Todo
  init que monta un IntersectionObserver/puntos contra el DOM del mes actual (ej.
  `initTimeline`/`initEventList`) debe registrarse en `astro:page-load` y desconectar el observer
  previo (nunca cortocircuitar el init entero con `window.__gvXxxInit`), si no el observer queda
  apuntando a nodos viejos y los meses quedan atascados en "… cargando".

## Lazy load + navegacion por rail temporal (TimelineNav)

`TimelineNav.astro` (partes de load bajo demanda de home y `/events`) necesita conocer pistas:

- **Expandiendo un `<details>` colapsado NO recalcula el layout de inmediato.** Un `scrollIntoView`
  en el mismo tick tras abrir `details` aterriza en la posicion del detalle colapsado, dejando el
  destino fuera de viewport. Hacer el scroll en `requestAnimationFrame` Y re-ajustar tras
  `setTimeout(~400ms)`, porque el IntersectionObserver sigue llenando meses del nuevo viewport y
  el documento crece desplazando el objetivo.
- **El rail salta a un mes en un año/decada colapsado**: el destino puede no estar en el DOM
  (SSR no emite el `<section>` si el año esta cerrado). Ambos renderers exponen
  `window.__gvFillMonth(key)` (`timelineClient.js` para home, `eventListClient.js` para `/events`);
  `expandAncestors` lo llama para forzar la carga del mes objetivo al hacer clic, en lugar de
  depender solo del IntersectionObserver.

## Arquitectura

```
src/
  content/events/YYYY/MM/YYYYMMDD-N.md   ← coleccion unica de contenido
  data/                                    ← registros YAML (la fuente de verdad)
    entities.yaml    people, organizations, cifras
    sources.yaml     fuentes periodisticas
    topics.yaml      taxonomy de temas
    colectivos.yaml  grupos afectados
    sectores.yaml    sectores economicos/sociales
  lib/
    registry.ts        lee YAML, retorna typed registries
    queries.ts         wrap de Astro getCollection + registries
    extractEntities.ts regex walker, extrae wikilinks de .md (cached)
    editorData.ts      datos para autocomplete del /admin
    eventTypes.ts      TIPO_LABELS, TIPO_STYLES, TIPO_COLORS — constantes compartidas
    remarkWikiLinks.mjs  remark plugin activo — convierte [[...]] a HTML
  components/          EventCard, FilterBar, Timeline, SourceRef, RelationBadge
  layouts/Base.astro   layout unico (nav + slot + footer + CSS global + tooltip JS)
  pages/               rutas: /, /events, /events/[year]/[id], /people, /organizations, /sources, /topics, /stats, /admin
sitemaps/              catálogo local de prensa (JSONL por medio/año, NO commiteado)
  .cache/              XML crudo descargado (regenerable, gitignored)
  _manifest.json       estado de sync (commiteado)
  README.md            índice generado por sitemaps-index (commiteado)
  *.jsonl              datos del catálogo (gitignored — ver sección "Catálogo de sitemaps")
```

## Como funciona el contenido

### Archivos de evento

Ruta: `src/content/events/YYYY/MM/YYYYMMDD-N.md`

```yaml
---
titulo: "Descripcion breve"
fecha: 2026-07-20T11:00:00Z          # ISO 8601 UTC
tipo: decreto                          # ver enum abajo
tema: emergencia, defensa_seguridad    # IDs de topics.yaml
etiquetas: sistema_frontal, ...        # strings libres
impacto:
  colectivos: residentes, familias     # IDs de colectivos.yaml
  sectores: agua_potable, ...          # IDs de sectores.yaml
relaciones:
  sucesor: 20260720-1                  # tipo_relacion: id_evento
creado: 2026-07-20
actualizado: 2026-07-20
---
```

### Tipos de evento (enum `tipo`)

`declaracion` | `accion` | `anuncio` | `decreto` | `proyecto` | `ley` | `votacion` | `fallo_judicial` | `entrevista` | `publicacion` | `documento` | `investigacion` | `reaccion` | `resultado`

### Tipos de relacion (campo `relaciones`)

`contradice` | `confirma` | `cumple` | `incumple` | `amplia` | `corrige` | `rectifica` | `responde_a` | `deriva_en` | `provoca` | `cita` | `reemplaza` | `actualiza`

### Wikilinks (en el body markdown)

| Sintaxis | Render | Ejemplo |
|---|---|---|
| `[[person/id]]` | `<span class="entity-ref entity-person">Nombre</span>` | `[[person/jose_antonio_kast]]` |
| `[[org/id]]` | `<span class="entity-ref entity-org">Nombre</span>` | `[[org/senapred]]` |
| `[[source/id]]` | `[N]` con tooltip | `[[source/latercera-2026-07-20-balance]]` |
| `[[cifra/concepto/valor/unidad]]` | `<span class="cifra-badge">valor</span>` | `[[cifra/fallecidos/5/personas]]` |
| `[[event/20260720-1]]` | `<a class="event-ref">Titulo</a>` | `[[event/20260720-1]]` |

- Fuentes se numeran secuencialmente por primera aparicion en el doc.
- Misma fuente reutiliza su numero en todas sus repeticiones.
- `[[source/...]]` genera anchor a `#ref-N` en la seccion de Referencias.

#### Medios de prensa en prosa (convencion de wikilinks)

Los medios de prensa se registran como **organizaciones** (`entities.yaml` > `organizations`, `tipo: medio_comunicacion`) y se referencian en prosa con `[[org/id]]` siempre que se los mencione como actor o punto de partida de un evento ("según T13", "reveló CIPER", "El Dínamo complementó"). Esto estandariza el nombre visible (renderiza el `nombre` del YAML) y evita ambiguedades como "El País (Chile)" (el medio, no el país).

- **Nombre canonico**: el campo `nombre` del YAML es lo que renderiza el wikilink. Usar el nombre comercial del medio (ej. `nombre: BioBioChile`, `nombre: El País (Chile)`), no variantes del campo `medio:` de `sources.yaml`.
- **`sources.yaml`**: el campo `medio:` debe usar el MISMO nombre canonico que la org (ej. `medio: El País (Chile)`, no "El País" ni "El País Chile"). Si el medio tiene edicion chilena y homonimo extranjero, incluir "(Chile)".
- **Redes sociales** (Reddit r/chile, X/Twitter, YouTube): `tipo: red_social` en organizations; solo complementarias, nunca fuente unica (ver TAREAS.md).
- **ID de org**: snake_case del nombre (ej. `el_pais`, `24_horas`, `radio_universidad_chile`, `adn_radio`). Revisar `entities.yaml` antes de crear uno nuevo (hay ~54 medios registrados).
- **Herramienta**: `pnpm run add-source -- <URL>` mapea dominio → medio; si el medio no esta registrado como org, agregarlo a `entities.yaml`.
- **IDs de evento desnudos en prosa** (ej. `ver evento 20260618-3`) se auto-enlazan
  a la página de detalle con su título como texto del enlace (`remarkWikiLinks.mjs`,
  patrón `\b20\d{6}-\d{1,3}\b`). Solo se enlazan si el ID existe en el índice.
  Usar `[[event/ID]]` cuando se quiera enlazar explícitamente.

#### Formato de citas (declaraciones)

Las citas usan blockquote con el formato `> texto - [[person/id]]`. El extractor regex (`extractEntities.ts`) parsea este formato para la pagina de personas.

```markdown
> Texto de la cita aqui - [[person/jose_antonio_kast]]
> Otra cita con fuente - [[person/jose_antonio_kast]] [[source/x-2026-07-20-kast-catastrofe]]
```

- El separador es ` - ` (espacio-guion-espacio) antes del `[[person/...]]`.
- Si hay `[[source/...]]` van despues del `[[person/...]]` en la misma linea.
- Puede haber menciones a personas DENTRO del texto de la cita (wikilinks normales), el extractor solo toma el ultimo ` - [[person/...]]` como hablante.
- NO usar comillas dobles `"` alrededor del texto.
- NO usar em dash `—` como separador.

#### Formato de citacion inline

Las fuentes se colocan **inline** en el párrafo donde se usa la información, NO en una sección `## Referencias` al final. Cada `[[source/...]]` va al final de la afirmación o dato que respalda, como una cita académica:

```markdown
La bencina subió [[cifra/alza_bencina_mepco/370/pesos_por_litro]] [[source/latercera-2026-03-19-mepco-impacto-ipc]].

El equipo presidencial decidió interponer denuncia ante la PDI [[source/theclinic-2026-03-26-hackeo-pdi]].
```

**NO** hacer esto (lista separada al final):

```markdown
## Referencias
- [[source/theclinic-2026-03-26-hackeo-pdi]]: The Clinic
- [[source/latercera-2026-03-19-mepco-impacto-ipc]]: La Tercera
```

#### Campo `svg_backup` (respaldo ASCII de imagen)

Cuando un evento se apoya en una **imagen** (foto de prensa, screenshot, imagen de X/Reddit) cuya evidencia conviene preservar, el frontmatter puede llevar `svg_backup` con el **SVG de arte ASCII** de esa imagen, generado por el usuario en una herramienta web externa (ej. `https://ezascii.com/image-to-ascii`) y verificado VISUALMENTE antes de guardarse. **Nunca guardar un SVG como respaldo automáticamente** (ningún script lo genera ni lo escribe solo).

```yaml
svg_backup:
  fuente: https://x.com/.../photo/1     # URL de la imagen original
  archivo: /img-to-ascii/20260809-8-zanja.svg   # OPCIÓN A (recomendada): .svg en public/
  # svg: |                                # OPCIÓN B (solo SVG artesanal pequeño): inline
  #   <svg ...>...</svg>
```

- **Opción A — archivo en `public/img-to-ascii/` (recomendada)**: los SVGs reales de herramientas como ezascii pesan MBs (resolución completa, 614+ líneas `<text>`; el de la zanja de Baradit: 1,45 MB / 5214×7368). Guardarlos como archivo en `public/img-to-ascii/<evento>-<slug>.svg` mantiene el .md del evento pequeño y el diff de git manejable; el frontmatter solo referencia la ruta (`/img-to-ascii/...`). Se renderiza con `<img src>` (sin `set:html` → sin superficie XSS). **Requisito para renderizar como `<img>`**: el SVG debe declarar dimensiones intrínsecas (`width`/`height` o `viewBox`) — ezascii las incluye; sin ellas el navegador lo muestra a 0×0 o 300×150. **Custodia**: los archivos de esta opción quedan FUERA del `.light.gvault` (el backup excluye `public/`); se cubren por custodia git + el botón "Descargar repositorio (.zip)" del footer (que sí incluye `public/`). La Opción B inline sí viaja dentro del `.gvault`.
- **Opción B — inline `svg`**: solo para SVG pequeño artesanal (≤100.000 caracteres). Se renderiza con `set:html`, por eso el schema rechaza vectores XSS (`<script`, atributos `on*`, `javascript:`) — los bodies markdown escapan HTML por remark, así que esta es la superficie de inyección.
- **Confirmación humana OBLIGATORIA** en ambas: el usuario genera el SVG, verifica visualmente que se vea correcto y recién entonces lo guarda (archivo o inline). Nunca automático.
- **Render**: `src/pages/events/[year]/[id].astro` muestra el respaldo dentro del body con la etiqueta "Respaldo ASCII de la imagen" y una leyenda que enlaza a `fuente` (la imagen original). Si falta `fuente`, la leyenda indica que la imagen se referencia en las fuentes del evento.
- **Schema/validación**: `content.config.ts` exige `archivo` (ruta que termina en `.svg`) o `svg` (prefijo `<svg`, ≤100K, sin XSS), nunca ambos vacíos. `scripts/validate.mjs` refuerza: si `archivo`, verifica que exista en `public/` y termine en `.svg`; si `svg`, las reglas anti-XSS; `fuente` debe ser URL http(s) → build falla si se viola. **Límite de confianza**: el contenido lo escribe el operador del vault, no terceros; no guardar SVGs de fuentes no confiables.
- CSS global `.ascii-svg`/`.ascii-svg-img` (Base.astro) escala el SVG responsivo con scroll horizontal.
- El campo es solo visual/evidencia: no participa en índices, búsqueda ni estadísticas.

### Donde viven las entidades

| Entidad | Fuente | Se accede via |
|---|---|---|
| Personas | `entities.yaml` > `people` | `getPeopleRegistry()` |
| Organizaciones | `entities.yaml` > `organizations` | `getOrgsRegistry()` |
| Medios de prensa | `entities.yaml` > `organizations` (`tipo: medio_comunicacion`) | `getOrgsRegistry()` |
| Cifras | `entities.yaml` > `cifras` | `getCifrasRegistry()` |
| Fuentes | `sources.yaml` | `getSourcesRegistry()` |
| Temas | `topics.yaml` | `getTopicsRegistry()` |
| Colectivos | `colectivos.yaml` | Array plano |
| Sectores | `sectores.yaml` | Array plano |

**IMPORTANTE:** Las personas y orgs NO estan en Astro collections. El schema en `content.config.ts` define `people`, `organizations`, `topics` collections pero los directorios no existen en disco. Los datos fluyen via YAML + `registry.ts`.

### Extraccion de entidades

`extractEntities.ts` camina los `.md` crudos con regex, extrae `[[person/...]]`, `[[org/...]]`, `[[source/...]]`, `[[cifra/...]]` del body. Cacheado en module-level Map. No depende de frontmatter.

## Reglas al crear/modificar eventos

1. **Archivos**: `src/content/events/YYYY/MM/YYYYMMDD-N.md` — N es secuencial dentro del dia.
2. **Frontmatter**: todos los campos requeridos excepto `etiquetas`, `impacto`, `relaciones`.
3. **`tema`**: usar IDs de `topics.yaml`. Si falta uno, agregarlo al YAML.
4. **`etiquetas`**: strings libres, sin vinculo a taxonomy.
5. **`impacto.colectivos`**: usar IDs de `colectivos.yaml`. Si falta uno, agregarlo.
6. **`impacto.sectores`**: usar IDs de `sectores.yaml`. Si falta uno, agregarlo.
7. **`relaciones`**: apuntar al ID del archivo (sin extension), ej: `20260720-1`.
8. **Wikilinks en body**: siempre que se mencione una persona, org, fuente o cifra, usar wikilink.
9. **Fuentes**: agregar a `sources.yaml` si es nueva. Formato ID: `medio-YYYY-MM-DD-slug`. **Siempre inline** en el párrafo que usa la info, nunca en `## Referencias` separada.
10. **URLs de fuentes**: NUNCA usar URLs raíz/domino (`https://lasegunda.com/`). Siempre usar la URL completa del artículo específico. Si el original está paywall y no se puede obtener la URL exacta, usar una fuente secundaria que cite la original (ej: El Ciudadano citando a La Segunda) y agregar campo `notas` al YAML indicando la fuente primaria. Los datos deben ser verificables y rastreables a una fuente concreta.
    - Para leer contenido detrás de paywall o bloqueado, usar los mirrors de la sección [Extraccion de contenido web](#extraccion-de-contenido-web): `paywallskip.com`, `r.jina.ai`, `defuddle.md`, `markdown.new`, `archive.ph`. La URL guardada en `sources.yaml` es SIEMPRE la del artículo original, nunca la del mirror.
    - Segun corresponda intentar obtener mayor contexto para reducir sesgos usando fuentes listadas en `FUENTES_GUBERNAMENTALES.md`.
11. **Personas/orgs nuevas**: agregar a `entities.yaml`.
12. **Cifras nuevas**: agregar tipo a `entities.yaml` > `cifras`.
13. **NO usar notas de editor ni metainstrucciones en el body de eventos**: está prohibido dejar marcadores de gestión como `Nota de verificación`, `pendiente evento propio`, `ver TAREAS.md`, `para seguimiento`, `registrado en TAREAS` o `queda pendiente de verificación`. El body solo contiene hechos verificables y análisis; los cross-references entre eventos tipo `(ver evento X)` SÍ son válidos (los IDs se auto-enlazan). Si algo requiere validación, profundización o más fuentes, registrarlo en `TAREAS.md` (estado `⬜ pendiente`/`🟡 parcial`) y no en el body del evento. **Enforcement mecánico**: `scripts/validate.mjs` (que corre antes del build) detecta estos patrones en el body y hace fallar el build. Se exceptúan los eventos-tracker diseñados como tales (ej. `20250822-1`, que da seguimiento a propuestas de campaña).
14. **Consultar el catálogo de sitemaps ANTES de buscar en la web**: para los medios guardados localmente (`biobiochile`, `elmostrador`, `theclinic`, `cooperativa`, `elclarin`, `adnradio`, `ciper`, `factchecking`, `fastcheck`, `latercera`, `cnnchile`, `eldinamo`), buscar primero con `grep -ih '<términos>' sitemaps/<slug>/*.jsonl` — entrega URL + fecha (+ título real si es news-sitemap) sin tocar la red, y evita búsquedas online redundantes (ver sección "Catálogo de sitemaps → Uso del catálogo por agentes"). El catálogo NO trae el cuerpo del artículo: tras el match, leer la URL con `read_url` o los mirrors.

## Pagina /events: filtros y busqueda en cliente

El sitio es SSG, por lo que `Astro.url.searchParams` NO existe en runtime: la página
`/events` se genera sin query string. Los filtros (`?tema`, `?persona`, `?org`, `?q`)
y la busqueda se aplican en el cliente sobre un dataset JSON completo que viaja en
`<script id="event-index-data">` (ver `eventListClient.js`).

- **Dataset**: la primera tanda de tarjetas se renderiza en SSR (`SSR_LIMIT = 12` en
  `events/index.astro`); el resto viaja como JSON y se pinta bajo demanda al scroll
  (IntersectionObserver por mes). El JSON **excluye** los IDs ya emitidos en SSR
  (`ssrIds`): si viajaran tambien, `fillMonth` los re-insertaría (duplicados).
- **Filtros**: `applyFilters()` lee la URL, fuerza el llenado de todos los meses
  (`forceFillAll`), oculta las tarjetas que no matchean `data-tipo`/`data-tema`/
  `data-personas`/`data-orgs`/`data-search` y oculta meses/años vacíos.
- **Busqueda**: `data-search` es texto normalizado (minúsculas + sin acentos, NFD)
  de titulo, etiquetas, personas, orgs, temas, tipo, ID y fecha. La normalizacion
  debe ser IDENTICA entre `EventCard.astro` (SSR) y `eventListClient.js` (cliente).
- **Persistencia**: abrir los `<details>` programáticamente al filtrar NO debe
  guardarse en localStorage — el listener de `toggle` en `events/index.astro`
  respeta `window.__gvSkipPersist` (lo setea `applyFilters`).

## TTS del detalle de evento (voz del navegador + Piper neural)

`src/pages/events/[year]/[id].astro` tiene lector TTS (`#btn-tts` + `<select id="tts-voice">`).
En tiempo de build NO se agenda nada; todo corre en cliente sobre el texto de `.prose`.

- **Voces**: primero las de `speechSynthesis` (es-CL/es-ES primero), y como `optgroup`
  independiente las voces neurales Piper (`@realtimex/piper-tts-web`). Piper es un
  peer de `onnxruntime-web` (postinstall de `protobufjs` autorizado en `allowBuilds`).
- **Piper = CDN lazy**: `tts.voices()` (fetch a HF), `tts.predict()` baja el modelo
  (~60-75MB, una sola vez → OPFS) y sintetiza en el navegador. `voiceId` usada viene
  del value del `<option>` con prefijo `piper:`. El WASM/onnx salen de jsdelivr en runtime.
- **`onnxruntime-web` está pineado a `1.22.0`** (dependencia directa en `package.json`,
  no el peer resuelto por pnpm): es la versión para la que el fork fue construido y a la
  que apunta su `ONNX_BASE` de CDN. NO subir la versión sin actualizar también el CDN.
- **El `.wasm` local de onnxruntime NO se bundlea**: el fork lo carga del CDN en runtime
  (`fallbackStrategy 'cdn'`, `wasmPaths = ONNX_BASE`), pero Vite lo emitía igual a
  `dist/_astro/` (~25,6 MiB) por el patrón `new URL("ort-wasm-*.wasm", import.meta.url)`,
  rompiendo el deploy de Cloudflare Pages (límite 25 MiB por archivo). El plugin
  `drop-ort-wasm-assets` en `astro.config.mjs` (`vite.plugins`) elimina esos assets del
  output (solo `.wasm`). Contrato implícito: el TTS depende de que el fork use SIEMPRE
  la estrategia CDN; si alguien lo cambiara a `'auto'`/`'local'` (modo offline), el wasm
  local ya no existiría en `dist` y el TTS rompería con un 404 silencioso. Si algún día
  se quisiera usar el wasm local, hay que revertir ese plugin y re-verificar el deploy.
- **Flags**: `window.__gvEventActionsInit` (una sola vez) para listeners globales;
  `astro:page-load` para llenar voces y cancelar reproducción (`gvStopAll`) al navegar.

## Pagina /gabinete (titulares ministeriales generados de `cargos`)

`src/pages/gabinete.astro` muestra el gabinete por cartera (titular en ejercicio +
historico con periodos), generado en build por `src/lib/cabinet.ts` a partir de
`entities.yaml` — NO se mantiene a mano.

- **Que recolecta**: personas cuyo `cargo` top-level o entrada de `cargos[]` empieza
  con `Ministro/a de...`, `Biministro/a de...`. Excluye jueces (`Ministro de la
  Corte...`) y cargos extranjeros.
- **Resolucion de cartera**: primero la keyword del texto (diccionario en
  `cabinet.ts`), fallback a la org de la entrada si es tipo `ministerio`/`segegob`.
  Un biministro se separa en sus carteras (`"Biministro de X y Y"` → X + Y).
- **Dedupe**: si el `cargo` top-level duplica un `cargos[]` (mismo texto normalizado
  sin acentos), gana el de `cargos[]` (tiene fechas).
- **Vigencia**: sin `hasta` = en ejercicio. Los cargos top-level sin fechas se
  marcan `fechasSinRegistrar` para no atribuir periodos inexistentes.
- **Carteras validas** (constante `MINISTERIO_ORG_IDS`): orgs tipo `ministerio` +
  `segegob` + `ministerio_desarrollo_social`. Si una cartera nueva se agrega como
  org, revisar que este en esa lista.
- **Cuidado con el orden de keywords**: `interior` debe matchear antes que
  `seguridad publica` (el nombre historico del Ministerio del Interior incluye
  "y Seguridad Publica"). No reordenar sin re-verificar los historicos.
- **Org pages**: `organizations/[id].astro` muestra la seccion "Titulares del
  ministerio" para orgs que son cartera (mismo helper).
- Para ajustar datos de un ministro, editar `cargo`/`cargos[]` en `entities.yaml`;
  la pagina se regenera en el proximo build.

## Campo `cargos` (historial de cargos de personas)

Personas en `entities.yaml` pueden llevar `cargos: []` (lista) con `cargo`, `organizacion`, `desde`, `hasta` por rol — formato ISO `YYYY-MM-DD`. `cargo`/`organizacion` top-level se mantienen como rol actual/portada (retrocompatibles). `src/pages/people/[id].astro` renderiza la lista y un diagrama Mermaid `timeline` si hay `desde`.

```yaml
cargos:
  - cargo: Seremi de Salud de Arica y Parinacota
    organizacion: seremi_salud_arica
    desde: 2026-03-26
    hasta: 2026-07-30
```

Solo agregar fechas verificables (de eventos/notas). Dependencia `mermaid` en `package.json` (se bundlea solo en páginas de persona con timeline).

## Cuentas Públicas presidenciales (convención)

Cada Cuenta Pública presidencial ante el Congreso Pleno tiene **un evento master** para detallar y verificar los anuncios:

- **ID**: `YYYY0601-1` (fecha del discurso; ej. `20240601-1`). Tipo `declaracion`. Etiqueta `cuenta_publica`.
- **Estructura del body**: secciones por eje temático (seguridad, economía, sociedad de cuidados, DDHH, educación, infraestructura/energía, reacciones), cada anuncio con su `[[cifra/...]]` y fuentes inline.
- **Fuentes**: mínimo el sitio oficial (gob.cl/cuentapublicaYYYY, `medio: Gobierno de Chile`) + 2-3 medios de prensa del día del discurso (catálogo de sitemaps: grep `'cuenta publica' sitemaps/<medio>/*.jsonl | grep '<año>-06'`).
- **Anuncios granulares**: cuando un anuncio se desarrolla (proyecto ingresa al Congreso, ley se aprueba, medida se implementa o se incumple), se crean/actualizan eventos propios con `relaciones` hacia el master (`amplia`/`deriva_en`/`responde_a`), como ocurre con la CP 2026 de Kast (`20260601-5` + `20260601-2`, `20260601-3`, `20260602-4`, etc.).
- **Verificación**: cada cifra verificable del discurso se registra como `[[cifra/...]]`; el seguimiento de implementación de los anuncios pendientes vive en TAREAS.md bajo "Cuentas Públicas — seguimiento de anuncios".
- **Estado de la serie**: 2022 (1ª Boric) ⬜ pendiente · 2023 (2ª Boric) ✅ `20230601-1` · 2024 (3ª Boric) ✅ `20240601-1` · 2025 (4ª Boric) ✅ `20250601-1` (master: CP 2025 ampliada, anuncio de Punta Peuco conservado como sección; los `responde_a` de 20260514-1 y 20251114-1 siguen apuntando al mismo evento) · 2026 (1ª Kast) ✅ `20260601-5`.
- Las **cuentas públicas sectoriales/ministeriales** (participativas) también generan eventos cuando anuncian (ej. Minsal `20260729-17`, Minería `20260729-19`), pero la serie master es la presidencial.

## Reglas al modificar datos YAML

- `entities.yaml`: agregar persona/org/cifra nueva en su seccion correspondiente.
- `sources.yaml`: formato `id-slug: { tipo, medio, titulo, autor, fecha, url }`.
- **Campo `medio:` de `sources.yaml`**: debe ser EXACTAMENTE el `nombre` de una org de prensa de `entities.yaml` (tipo `medio_comunicacion` | `red_social` | `canal_television` | `programa_tv` | `programa_streaming`). Si el emisor NO es prensa (institucion del Estado, encuestadora, plataforma social/documento, publicacion academica), usar el nombre descriptivo y agregarlo a `WHITELIST_MEDIOS` en `scripts/validate.mjs`. `pnpm run validate` (corre antes del build) falla con el ID de la fuente si el `medio:` no cumple la regla, y detecta mojibake de doble-encoding UTF-8 en los 5 YAML de datos.
- `topics.yaml`: formato `id: { nombre, descripcion, relacionados: [] }`.
- `colectivos.yaml` / `sectores.yaml`: agregar string al array plano.

## Build y verificacion

```bash
pnpm run build    # debe completar sin errores
pnpm run dev      # preview local
```

El build usa `set NODE_OPTIONS=--experimental-global-customevent` (Windows).
Si falla, revisar frontmatter (YAML parse error) o wikilinks rotos.

**Gestor de paquetes: pnpm** (migrado desde npm). Lockfile: `pnpm-lock.yaml`.
Instalacion: `pnpm install`. No usar npm ni regenerar `package-lock.json`.

**CI (Netlify/Vercel):** el archivo `.npmrc` configura `auto-install-peers=true` y
`strict-peer-dependencies=false`; así pnpm resuelve la combinación de
`@astrojs/tailwind@6` (peer `astro@^3||^4||^5`) con Astro 7 sin fallar. Ya no se
necesita `legacy-peer-deps=true`. El archivo `pnpm-workspace.yaml` declara
`allowBuilds: { esbuild: true }` para que pnpm 10+ ejecute el postinstall de
build de esbuild (necesario para el binario nativo; sin esto el build de Astro
falla con `ERR_PNPM_IGNORED_BUILDS`). Debe incluir `packages: []` (si falta, pnpm 10
del CI falla con `packages field missing or empty` al correr `pnpm install --frozen-lockfile`).
No eliminar ninguno de los dos archivos.
`protobufjs` (transitiva de `onnxruntime-web`, peer de `@realtimex/piper-tts-web`) tambien
esta en `allowBuilds` de `pnpm-workspace.yaml` porque tiene postinstall (sin autorizacion el
`pnpm install` del CI falla con `ERR_PNPM_IGNORED_BUILDS` y el build aborta).

**Despliegue (Cloudflare Pages):** el sitio se despliega con `pnpm run deploy`, que ejecuta `wrangler pages deploy dist --project-name gobierno-vault --branch main` y genera la URL `https://gobierno-vault.pages.dev` (subdominio `.pages.dev`, no `.workers.dev`). `wrangler.jsonc` usa `pages_build_output_dir: ./dist`. El proyecto se crea una sola vez con `npx wrangler pages project create gobierno-vault --production-branch main` (requiere `wrangler login` o token `CLOUDFLARE_API_TOKEN`). Preview local: `pnpm run preview` (`wrangler pages dev dist`).

## Extraccion de contenido web

Cuando `webfetch` no logre leer una URL (bloqueo, JS rendering, paywall), intentar con estos servicios que devuelven markdown limpio:

1. `https://r.jina.ai/` + URL completa
2. `https://defuddle.md/` + URL completa
3. `https://markdown.new/` + URL completa
4. `https://www.paywallskip.com/article?url=` + URL completa (bypass de paywall)
5. `https://archive.ph/` + URL completa (snapshot/caché, puede dar rate-limit 429)

Formato: `https://r.jina.ai/https://ejemplo.com/articulo`
Formato paywallskip: `https://www.paywallskip.com/article?url=https://ejemplo.com/articulo`

## Procesamiento de PDFs (lectura de documentos)

`pnpm run pdf-extract -- <URL-del-PDF>` descarga el PDF y lo convierte a **Markdown estructurado**
con la libreria `@firecrawl/pdf-inspector` (devDependency, nucleo Rust nativo via NAPI, sin OCR,
sin modelos ML, offline; conserva titulos H1-H4, listas, tablas, negritas, subrayados y el orden
de lectura multicolumna) para leer documentos primarios durante investigaciones/correcciones
(planes filtrados, informes oficiales, fallos).

- **Uso:** `pnpm run pdf-extract -- https://sitio.cl/doc.pdf` imprime el markdown a stdout
  (o `--out <ruta>` para guardarlo). `--json` imprime clasificacion + markdown. Acepta tambien
  un `.md` ya extraido como argumento posicional para re-imprimir sin red. Avisa si el PDF es
  escaneado (pdfType distinto de TextBased/Mixed: requiere OCR) y tiene timeout de descarga +
  chequeo del magic `%PDF`.

## Generador de fuentes (script)

`pnpm run add-source -- <URL>` (o `pnpm run add-source` sin URL para modo interactivo) extrae
automaticamente `titulo`, `autor` y `fecha` de la URL y genera el bloque YAML listo para pegar
en `sources.yaml`, junto con el ID `medio-YYYY-MM-DD-slug` y el wikilink `[[source/id]]`.

- Fetch del HTML directo; si falla o no hay titulo, relega a `r.jina.ai`.
- El mapeo dominio → medio se precarga desde `sources.yaml` + un diccionario base en el script.
- Consulta el catálogo de sitemaps antes del fetch (ver "Catálogo de sitemaps → Integración
  con add-source.mjs").
- Flags: `--append` (agrega el bloque directo al final de `sources.yaml`), `--mirror` (fuerza
  espejo), `--catalog-only` (sin fetch, solo datos del catálogo), `--search <texto>` (busca en
  el catálogo y deja elegir; con `--medio <slug>` y `--fecha YYYY-MM-DD` filtra).
- Siempre imprime la URL del articulo original (nunca el mirror), y avisa si el ID ya existe.

## Catálogo de sitemaps (índice local de prensa)

Carpeta `sitemaps/` en la raíz: catálogo de artículos de prensa (URL + fecha + título si existe)
extraído de los sitemaps públicos de cada medio. Evita fetch/búsquedas web redundantes: el valor
está en la URL+fecha (post-sitemaps) y URL+fecha+título real (news-sitemaps, últimos 2-3 días).
NO guarda el cuerpo de los artículos.

### Regla clave: NO se commitea el catálogo

- `sitemaps/*.jsonl`, `sitemaps/.cache/`, `sitemaps/sitemaps.gvault` y sus partes
  `sitemaps.gvault.partN` están en `.gitignore` (decisión 2026-08-07): BioBio pesa ~307MB y el
  catálogo es regenerable.
- Lo que SÍ se commitea: los scripts (`scripts/sync-sitemaps.mjs`, `sitemaps-index.mjs`,
  `sitemaps-backup.mjs`), `package.json`, `sitemaps/_manifest.json` (estado de sync) y
  `sitemaps/README.md` (índice regenerable).
- Si se clona el repo, hay que correr `pnpm run sitemaps-sync -- <medio>` para regenerar local.
- **Excepción opcional (snapshot público)**: el catálogo completo comprimido pesa ~56MB
  (357MB crudos → compacto lossless + Brotli binario). Con `--chunk-size <MB>` se parte en
  trozos de ~28MB (`sitemaps.gvault.part1/2`), cada uno bajo el límite blando de 50MB de
  GitHub. Quien descargue todas las partes puede regenerar el catálogo con `sitemaps-backup --restore`
  (une las partes automáticamente) o `--join` (arma el .gvault único).

### Formato JSONL

`{ "u": url, "d": fecha ISO, "t": título (si existe), "s": "news"|"slug" }`
- `s:"news"` = título real del news-sitemap. `s:"slug"` = título aproximado derivado de la URL.

### Scripts

| Comando | Función |
|---|---|
| `pnpm run sitemaps-sync -- <medio>...` | robots.txt → sitemap_index → sub-sitemaps → dedupe → JSONL por medio/año. Flags: `--all`, `--list`, `--fresh`, `--no-cache`, `--limit N`, `--stale N`, `--no-delay`, `--delay N`, `--incremental`, `--replace`. Filtrado por medio: `articleOnly` (Yoast: solo post/news-sitemap) o `includeRe` (whitelist custom, ej. FastCheck) o denylist genérica |
| `pnpm run sitemaps-resync` | **Resync manual diario**: sync MERGE incremental de los medios del catálogo + regenera README + backup. Nunca borra datos existentes. Solo sincroniza los medios ya presentes en `_manifest.json` (los nuevos se agregan con `sitemaps-sync -- <medio>`) |
| `pnpm run sitemaps-index` | genera `sitemaps/README.md` (década → año → mes, conteos + muestras) Y la sección "Medios registrados" de AGENTS.md (marcador `

<!-- AUTO-GENERATED-SITEMAPS-MEDIOS -->

### Medios registrados (generado automáticamente)

> Esta sección se genera con `pnpm run sitemaps-index` a partir del registro `MEDIA`
> de `scripts/sync-sitemaps.mjs` y de `sitemaps/_manifest.json`. NO editar a mano.

| Slug | Nombre | Sitemap(s) | Filtro | Artículos | Años |
|---|---|---|---|---|---|
| `adnradio` | ADN Radio | `www.adnradio.cl/arc/outboundfeeds/sitemap/?outputType=xml` | — | 100 | 1 |
| `biobiochile` | Radio Bío Bío | `www.biobiochile.cl/robots.txt` | — | 1.170.827 | 18 |
| `ciper` | CIPER Chile | `www.ciperchile.cl/sitemap_index.xml` | articleOnly (Yoast) | 8.415 | 18 |
| `cnnchile` | CNN Chile | `www.cnnchile.com/robots.txt` | — | 226.812 | 16 |
| `cooperativa` | Cooperativa | `www.cooperativa.cl/robots.txt` | — | 1.005 | 1 |
| `el_periodista` | El Periodista | `www.elperiodista.cl/sitemap_index.xml` | articleOnly (Yoast) | 84.776 | 18 |
| `el_siglo` | El Siglo | `elsiglo.cl/sitemap_index.xml` | articleOnly (Yoast) | 5.415 | 4 |
| `elclarin` | El Clarín | `www.elclarin.cl/sitemap_index.xml` | articleOnly (Yoast) | 20.683 | 10 |
| `eldesconcierto` | El Desconcierto | `eldesconcierto.cl/robots.txt` | — | 20 | 1 |
| `eldinamo` | El Dínamo | `www.eldinamo.cl/robots.txt` | — | 250.948 | 17 |
| `elmostrador` | El Mostrador | `www.elmostrador.cl/robots.txt` | — | 101 | 1 |
| `ex_ante` | Ex-Ante | `www.ex-ante.cl/sitemap_index.xml` | articleOnly (Yoast) | 17.520 | 7 |
| `factchecking` | Factchecking.cl | `factchecking.cl/sitemap_index.xml` | articleOnly (Yoast) | 14 | 5 |
| `fastcheck` | Fast Check CL | `www.fastcheck.cl/sitemap.xml` | includeRe | 5.815 | 7 |
| `la_nacion` | La Nación | `www.lanacion.cl/sitemap_index.xml` | articleOnly (Yoast) | 19.737 | 7 |
| `latercera` | La Tercera | `www.latercera.com/robots.txt` | — | 8.421 | 1 |
| `meganoticias` | Meganoticias | `www.meganoticias.cl/robots.txt` | includeRe | 433.970 | 16 |
| `publimetro` | Publimetro | `www.publimetro.cl/arc/outboundfeeds/sitemap-index/?outputType=xml` | — | 5 | 1 |
| `radio_uchile` | Radio Universidad de Chile | `radio.uchile.cl/sitemap_index.xml` | articleOnly (Yoast) | 107.892 | 18 |
| `theclinic` | The Clinic | `www.theclinic.cl/sitemap_index.xml` | articleOnly (Yoast) | 191.756 | 19 |

Nota: los JSONL no se commitean (regenerables); el estado vive en `_manifest.json`.

<!-- /AUTO-GENERATED-SITEMAPS-MEDIOS -->

**Al agregar un medio nuevo** (a `MEDIA` en `sync-sitemaps.mjs`): además de `sitemaps-index`
(que regenera la tabla y el README), hay que agregar el dominio y el nombre a
`CATALOG_MEDIO_BY_DOMAIN`/`CATALOG_MEDIO_NAMES` de `scripts/add-source.mjs` para que el lookup
del generador de fuentes lo reconozca.

Notas de plataforma (complemento manual, no se reescribe):
- WordPress-Yoast (`articleOnly`: solo `post-sitemap*.xml` y `news-sitemap*.xml`): **El Clarín**,
  **Factchecking**, **CIPER**, **The Clinic**. Ojo: The Clinic está detrás de Cloudflare
  challenge — curl/webfetch recibe 403 "Just a moment", pero Node fetch (el del script) sí lo
  resuelve (200).
- **El Mostrador**: `sitemap.xml` (~101 URLs) + `sitemap_news.xml` (títulos reales con prefijo
  `n:` — el parser acepta `news:` o `n:`).
- **Fast Check CL**: sitemap custom con `includeRe` `/(?:posts-\d{4}|news)\.xml$/i` →
  `posts-YYYY.xml` + `news.xml` (títulos reales); descarta `pages/categories/authors.xml`.
- **ADN Radio**: Arc XP (~100 URLs recientes, sin títulos). **La Tercera**: Arc XP paginado
  (`sitemap-index` → ~100 sub-sitemaps `?from=N`, ~10.000 artículos recientes; `news-sitemap-index`
  trae títulos reales; los `<loc>` del index llegan con `&amp;` que el parser decodifica).
  **BioBio**: sitemap mensual + news-sitemap. **Cooperativa**: sitemap de páginas + news.
- **CNN Chile / El Dínamo** (mismo CMS): `_files/sitemaps/sitemap_index.xml` (sub-sitemaps por
  mes desde 2011/2010) + `sitemap_lasts.xml` + `sitemap_news.xml` (títulos reales). Ojo CNN:
  el `<lastmod>` de los sub-sitemaps mensuales es la fecha de regeneración (uniforme y falsa);
  el script usa `dateFromSitemapPath` (path `YYYY/MM`) para fechar los artículos.
- **Radio Universidad de Chile / El Siglo / La Nación / Ex-Ante / El Periodista**: WordPress-Yoast
  (`articleOnly`). Ojo: El Periodista sirve los `<loc>` en `http://` (mezcla http/https en el
  index) y su `robots.txt` declara el sitemap en `http://`; su index es lento/throttle-friendly —
  si un sync se corta, relanzar: el caché y el modo merge retoman sin pérdida. Ex-Ante NO declara
  sitemaps en `robots.txt` (se usa `index` directo). El Siglo usa canónico sin `www` (`elsiglo.cl`).
- **Meganoticias** (CMS propio): `sitemap-noticias-index-content.xml` = índice mensual
  `content-noticias/sitemap-YYYY-MM.xml` desde 2011 + `sitemap-news.xml` (títulos reales). El
  `includeRe` descarta videos, secciones, autores, columnistas y hemeroteca (páginas de listado).
  Ojo: los sub-sitemaps mensuales NO traen `lastmod` fiable → `dateFromSitemapPath` (path `YYYY-MM`)
  como CNN. Las fechas quedan como aproximación a nivel de mes (día 01) y pueden desfasarse un
  mes del slug/URL real (IDs secuenciales, la URL no lleva fecha). ~434k artículos en 16 años.
- **Publimetro** (Arc XP): el `sitemap-index` solo lista `latest` + el día actual (sin índice
  histórico). Existen sitemaps por fecha (`/sitemap/YYYY-MM-DD/`) con decenas de URLs, pero no
  hay índice que los enumere: el sync captura solo lo reciente (~5-100 URLs).
- **El Desconcierto**: sitemaps SIN historia (`sitemap.xml` ~8 recientes + `sitemap-news.xml` ~20
  con títulos reales); todas las variantes históricas (año, post, archivos) devuelven 404.

| `pnpm run sitemaps-backup` | empaqueta `sitemaps/` en `sitemaps/sitemaps.gvault`. **Compacto lossless por defecto** (`--compact`): los JSONL se transforman a un formato tab-separado que omite dominio (1× por archivo) y títulos derivables del slug; el restore reconstruye el JSONL byte-idéntico (verificado por SHA-256). **Contenedor binario por defecto** (`--bin`): payload Brotli como bytes crudos (~25% menos que base64; `--text` para el formato v1 legible). **`--chunk-size <MB>`**: parte el snapshot en `<out>.part1, .part2…` (~28MB c/u con `45`; bajo el límite de 50MB de GitHub); `meta.chunks` indica el total. `--restore [src]` auto-detecta y une las partes; `--join [src]` arma el .gvault único. Resultado: ~56MB (vs ~357MB raw / 127MB v1). `--no-compact` guarda JSONL crudo |

Detalle de merge: el dedupe del run (`seen`) NO bloquea el upgrade de títulos entre sub-sitemaps
— si una URL aparece primero sin título y luego con título real (caso El Mostrador), la segunda
pasada mejora la entrada (`news` > `slug`).

**Syncs paralelos**: `main()` escribe `_manifest.json` por medio (read-modify-write tras cada
sync), así que correr medios en procesos paralelos ya no pisa el estado de los demás. Aun así,
para varios medios conviene pasarlos como argumentos en un solo comando
(`pnpm run sitemaps-sync -- el_siglo la_nacion ...`): evita el throttle de los sitios y deja un
solo `manifest.actualizado`.

**Corrección de fechas (CNN, `dateFromSitemapPath`):** en modo merge la fecha solo se actualiza
si el cambio es dentro del mismo año (la URL se busca en el mapa del año de la nueva fecha). Si un
medio quedó con fechas falsas por un `<lastmod>` uniforme (caso CNN con el crawl de 2026-04-08),
reconstruir con `pnpm run sitemaps-sync -- cnnchile --replace` (el sitemap lista todo el historial,
así que es seguro); después los resync incrementales no vuelven a degradar fechas.

**Privacidad e integridad del .gvault:**
- La cabecera INFORMACION usa **rutas portables** (relativas al repo o solo el
  nombre del archivo), nunca rutas absolutas locales: un .gvault anterior
  incrustaba `C:\Users\<usuario>\...\sitemaps.gvault`, filtrando el nombre de
  usuario y la ruta de disco de quien generó el backup. `displayPath()` en
  `sitemaps-backup.mjs` centraliza esta regla (también en los mensajes de
  consola).
- `.gitattributes` marca `*.gvault` y `*.gvault.part*` como **binarios** (`binary`):
  con `* text=auto` + `core.autocrlf=true` (Windows) git convertía LF→CRLF en el
  payload Brotli, rompiendo el SHA-256 y haciendo el snapshot no restaurable.
  Si los `.partN` se publican (excepción snapshot), deben regenerarse tras
  cualquier cambio y verificarse con `--restore` a un directorio temporal.

### Integración con add-source.mjs (IMPLEMENTADA)

`add-source.mjs` consulta el catálogo ANTES de hacer fetch web:

- **Lookup por URL**: si la URL pasada está indexada en el catálogo, pre-carga fecha y (si hay)
  título sin tocar la red. Con `s:"news"` (título real) salta el fetch por completo; con
  `s:"slug"` (título aproximado) intenta el fetch para obtener el título real y usa el catálogo
  como fallback. Normaliza la URL (quita `www.`, params de tracking `utm_*`/`fbclid`, hash).
- **`--catalog-only`**: nunca hace fetch; usa solo datos del catálogo (útil cuando el medio
  bloquea o para construir la fuente sin red).
- **`--search <texto>`**: busca en el catálogo (título/URL/fecha, normalizado sin acentos),
  lista resultados más recientes primero y deja elegir. Filtros: `--medio <slug>` y
  `--fecha YYYY-MM-DD`.
- Medios del catálogo: `elclarin`, `biobiochile`, `cooperativa`, `adnradio`, `factchecking`,
  `ciper`, `theclinic`, `elmostrador`, `fastcheck`, `latercera`, `cnnchile`, `eldinamo`,
  `radio_uchile`, `el_siglo`, `la_nacion`, `ex_ante`, `el_periodista`, `meganoticias`,
  `eldesconcierto`, `publimetro`.
  Si el dominio no está en el catálogo, el flujo es el clásico (fetch + mirrors).
- El módulo exporta funciones puras (`lookupCatalogUrl`, `catalogSearchAndPick`, `buildBlock`,
  `normalizeUrlForMatch`) para testing; el flujo interactivo solo corre si se invoca directo.

### Uso del catálogo por agentes (antes de búsquedas online)

Regla general (también en "Reglas al crear/modificar eventos", punto 14): al investigar un tema,
los agentes deben consultar el catálogo local ANTES de hacer búsquedas web, al menos para los
medios guardados:

```bash
# buscar artículos por término en un medio (URL + fecha + título si es news)
grep -ih 'secreto bancario' sitemaps/theclinic/*.jsonl
# buscar en todos los medios guardados a la vez
for m in sitemaps/*/; do grep -ih 'término' "$m"*.jsonl 2>/dev/null; done
```

- El catálogo entrega solo URL + fecha (+ título real en los news-sitemaps de los últimos días);
  NO contiene el cuerpo del artículo. Después del match hay que leer la URL (`read_url` o los
  mirrors de la sección "Extraccion de contenido web").
- Si el término no aparece o el medio no está en el catálogo, recién ahí usar búsquedas online.
- Medios cubiertos: `biobiochile`, `elmostrador`, `theclinic`, `cooperativa`, `elclarin`,
  `adnradio`, `ciper`, `factchecking`, `fastcheck`, `latercera`, `cnnchile`, `eldinamo`,
  `radio_uchile`, `el_siglo`, `la_nacion`, `ex_ante`, `el_periodista`, `meganoticias`,
  `eldesconcierto`, `publimetro`. (Los JSONL no se commitean; regenerar con
  `pnpm run sitemaps-sync -- <medio>` si el repo se clona.)

## Respaldo / Restauracion (backup offline publico)

El repo puede morir por el contenido sensible (politica/corrupcion), por eso se genera un
respaldo offline publico (SIN contraseña) que cualquiera pueda custodiar. Son archivos
`.gvault`: Brotli (integrado en Node, mejor ratio que gzip para texto) + checksums
SHA-256 (integridad verificable sin secretos) + manifest por archivo. No requiere
dependencias nuevas.

Scripts (ver `scripts/gvault-util.mjs` para el formato compartido):
- `pnpm run backup` — genera UN archivo `.light.gvault` (solo contenido actual: `src/**` +
  docs raiz + config, sin `dist/`, `node_modules/`, `.astro/`, `.git/`, `public/`) DIRECTO en
  `public/backup/` (ubicacion canonica, SE COMMITEA) junto con `manifest.json` (`archivo`,
  `url`, `tamano`, `sha256` del archivo completo).
- `pnpm run verify -- <archivo.gvault>` — comprueba integridad (uso publico).
- `pnpm run restore -- <archivo.gvault> [--dest <ruta>]` — extrae los archivos.
- Flags de backup: `--shallow` (solo `src/content`+`src/data`), `--out <prefijo>`.

Convenciones:
- `public/backup/` se COMMITEA al repo (no esta en `.gitignore`): el respaldo queda descargable
  por cualquiera desde GitHub con un solo clic Y el footer del sitio lo sirve en `/backup/` sin
  CPU extra en build. Al generar respaldo nuevo, commitea `public/backup/`. NO hay `.gvault` en
  la raiz: la unica copia vive en `public/backup/` (evita duplicacion; `public` está en
  `EXCLUDE_DIRS` de `backup.mjs` para que el respaldo no se incluya a sí mismo).
- Ademas, se recomienda que quien descargue una copia la guarde FUERA del repo (USB, Drive, otras
  personas), para que sobreviva aunque el repo/plataforma desaparezca.
- No incluyen password/cifrado a proposito (custodia publica); la integridad la dan los hashes
  SHA-256, no el secreto. Al ser contenido sin cifrar, es tan sensible como el propio repo:
  protegelo igual (mismo contenido que el vault).
- **Respaldo en el footer del sitio:** el footer de todas las páginas lee `manifest.json` por
  fetch y ofrece: botón **"Descargar respaldo (.gvault)"** (descarga con el nombre versionado
  real), botón **"Descargar repositorio (.zip)"** (ZIP estilo GitHub de `Alplox/gobierno-vault`,
  `archive/refs/heads/main.zip`) y un panel desplegable (`<details id="gvault-copy">`) con
  `<textarea>` que carga el contenido del archivo (lazy, al abrir) para **copiarlo directamente**; muestra el nombre,
  tamaño y SHA-256 esperados del respaldo actual y la guía de verificación correcta (one-liner
  de Node incluido en el propio archivo, o `sha256sum`/`Get-FileHash` contra el SHA mostrado).
  Ojo: el `toggle` de `<details>` NO burbujea — el listener se registra en **fase de captura**
  (`addEventListener('toggle', fn, true)`), si no el textarea nunca se llenaba. Si no existe
  backup, el footer muestra un aviso y deshabilita la descarga.
- **Corrección de integridad (BOM):** `scripts/backup.mjs` usa `TextDecoder` con `ignoreBOM: true`
  en `encodeFile`; sin esto los archivos con BOM UTF-8 (ej. `src/scripts/eventListClient.js`)
  perdían 3 bytes en el round-trip y `verify` reportaba hash incorrecto.
- **Instrucciones para no técnicos embebidas en cada `.gvault`**: la cabecera INFORMACION explica
  paso a paso cómo comprobar la integridad (instalar Node → abrir terminal → pegar el one-liner
  `VERIFY_ONELINER`) y cómo recuperar los archivos sin el proyecto con un solo comando
  (`RESTORE_ONELINER`, extrae todo a una carpeta). Ambos viven como consts en `scripts/backup.mjs`
  y se interpolan en `buildInfo`. Usan
  `lastIndexOf('===METADATA===')` a propósito: la cabecera contiene ese texto DENTRO del propio
  one-liner de verificación, así que `indexOf` (primera aparición) apuntaría al lugar equivocado.
  Cada regeneración debería validarse con una restauración de prueba (extraer a una carpeta
  temporal y comparar con los originales; los one-liners se prueban también contra un archivo
  corrupto: debe salir `CORRUPTO` con exit 1).

## Auto-evolucion

Cuando descubras algo no documentado aqui:
1. Agregalo a la seccion correspondiente.
2. Manten la seccion concisa — nada de prosa innecesaria.
3. Si borras o renombras un campo, actualiza TODO lo que lo referencie.
4. Si agregas una coleccion nueva, documenta su schema y donde vive.
5. Despues de cambios significativos (muchos eventos nuevos, cambios en estructura), ejecuta `pnpm run generate-index` para actualizar el indice de eventos y las estadisticas del vault.

## Archivos clave para revisar antes de cambiar algo

| Cambio | Revisar |
|---|---|
| Nuevo campo frontmatter | `content.config.ts`, `TEMPLATE.md`, `admin.astro` |
| Nuevo tipo de evento | `content.config.ts` (enum `tipo`), `editorData.ts`, `lib/eventTypes.ts` |
| Nuevo tipo de relacion | `editorData.ts` (`relationTipos`) |
| Nueva entidad | `entities.yaml`, este archivo |
| Nueva fuente | `sources.yaml`, este archivo |
| Nuevo tema | `topics.yaml`, este archivo |
| Procesamiento de PDFs | `scripts/pdf-extract.mjs`, sección "Procesamiento de PDFs" de este archivo |
| Wikilink roto | `remarkWikiLinks.mjs` (resolve fallback) |
| Scripts de sitemaps | `scripts/sync-sitemaps.mjs`, `scripts/sitemaps-index.mjs`, `scripts/sitemaps-backup.mjs`, sección "Catálogo de sitemaps" de este archivo |


<!-- AUTO-GENERATED-STATS -->

## Estadísticas del vault

> Esta sección se genera automáticamente con `pnpm run generate-index`

**Total de eventos:** 675

**Cobertura de fuentes:** 385 de 675 eventos con 3+ fuentes (290 requieren más fuentes para reducir sesgo)

**Eventos por año:**
- 2026: 536
- 2025: 40
- 2024: 18
- 2023: 13
- 2022: 14
- 2021: 8
- 2020: 15
- 2019: 13
- 2018: 3
- 2016: 1
- 2015: 5
- 2014: 1
- 2012: 1
- 2010: 3
- 2009: 3
- 1973: 1

**Temas más frecuentes (Top 10):**
- Politica (263)
- Economia (131)
- Justicia (130)
- Defensa y seguridad (93)
- Administración pública (81)
- Derechos humanos (66)
- Finanzas publicas (63)
- Proceso legislativo (58)
- Cambios en el gabinete (56)
- Emergencia y catástrofes (54)

**Tipos de eventos más frecuentes (Top 10):**
- accion (155)
- declaracion (93)
- reaccion (88)
- publicacion (71)
- investigacion (67)
- resultado (67)
- anuncio (49)
- fallo_judicial (26)
- votacion (14)
- proyecto (14)

**Entidades registradas:**
- Personas: 796
- Organizaciones: 620
- Cifras: 552
- Fuentes: 2233
- Temas: 74
