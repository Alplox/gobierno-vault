---
name: frontend
description: Frontend Astro con View Transitions, TimelineNav/rail, grafo de relaciones, filtros y búsqueda en /events, TTS Piper y Tailwind/daisyUI. Usa esta skill SIEMPRE al tocar src/layouts/Base.astro, src/pages, src/components, src/styles/global.css, astro.config.mjs o clientes timelineClient/eventListClient/force-graph, incluso si solo dice 'arreglar timeline' o 'grafo no carga'.
---

# Frontend — View Transitions, lazy load, grafo, filtros, TTS, estilos

> Cuándo cargar: vas a tocar `src/layouts/Base.astro`, `src/pages/*`, `src/components/*`, `src/lib/*` de UI, `src/styles/global.css`, `astro.config.mjs`, o los clientes `timelineClient.js`/`eventListClient.js`/`force-graph.js`.
> **Handoff:** si cambias View Transitions, TimelineNav, grafo, filtros, TTS o tokens de estilo, actualiza este skill en la misma sesión.

## View Transitions

`ClientRouter` de `astro:transitions` en `src/layouts/Base.astro`.

- `transition:name` compartido entre tarjeta/índice y detalle (ej. `event-title-${basename}`) → morphing del título.
- `<nav transition:persist>` sin parpadeo; estado activo recalculado en `astro:page-load` (`updateNavActive`).
- El toggle global de sonido (`#btn-sound`) se inicializa tanto en la carga inicial como en `astro:page-load`; busca el botón por ID en cada actualización (no conserva una referencia al DOM inicial) y sincroniza `localStorage` de forma segura. El atributo `data-gv-sound` se reaplica en `astro:after-swap`; al activar desde silencio, reproduce `toggle` dentro del gesto para desbloquear Web Audio.
- `astro.config.mjs: prefetch: { prefetchAll: true, defaultStrategy: 'hover' }`.
- Scripts: listeners globales registrados una sola vez con guard `window.__gvXxxInit` + `cleanupFns`. No usar `DOMContentLoaded`; usar `astro:page-load`. Los `<script>` bundleados solo se ejecutan **una vez** — inits con `IntersectionObserver` (`initTimeline`/`initEventList`) deben ir en `astro:page-load` y desconectar observer previo, nunca cortocircuitar todo el init con `window.__gvXxxInit`. El guard por nodo `script.__gvLoaded` va primero (page-load también dispara en carga inicial → doble init). Ver comentarios en `Base.astro` y fix en `eventListClient.js`.

## Lazy load + TimelineNav (rail temporal)

`TimelineNav.astro` para home y `/events`:

- **Rail y FAB comparten condición JS única** (`updateRailVisibility`): `matchMedia('(min-width: 64rem)')` Y margen derecho `main` ≥ 64px; FAB es complemento (`lg:hidden`). Bottom-sheet sin `lg:hidden` (debe abrirse también en lg+ estrecho; inerte con `pointer-events-none` + `translate-y-full`).
- Expandir `<details>` colapsado no recalcula layout inmediato → `scrollIntoView` debe ir en `requestAnimationFrame` + reajuste `setTimeout(~400ms)` porque el IO sigue llenando meses y el documento crece.
- `getBoundingClientRect()` miente dentro de `<details>` cerrado (Chrome: descendientes devuelven rects stale no-cero). Usar `hiddenByDetails()` que camina ancestros `details` (ver `Timeline.astro`).
- Salto a mes en año/década colapsado: destino puede no estar en DOM (SSR no emite `<section>` si año cerrado). Ambos renderers exponen `window.__gvFillMonth(key)` (`timelineClient.js` / `eventListClient.js`); `expandAncestors` lo llama para forzar carga.

## Volver arriba

`#back-to-top` vive en `Base.astro`: aparece sobre 480 px de scroll, usa scroll suave salvo `prefers-reduced-motion` y evita el FAB temporal mediante un offset inferior calculado al hacer scroll/resize. Reengancha estado y listeners en `astro:page-load`, limpiando la instancia anterior.

## Ficha de persona (`/people/[id]`)

Todo el panorama se deriva en build de `src/lib/personStats.ts` (índice invertido persona → eventos). **`primePersonIndex()` debe llamarse en `getStaticPaths()`**: sin él, `getAllEvents()` no está cacheado y el índice se construye vacío. Con ~2.500 fichas × 1.543 eventos, filtrar la lista completa por persona en cada página es inviable; el índice lo baja a O(1) por ficha.

- **Gráficos = SVG estático, cero JS**, con tokens del tema (`var(--color-*)`) para que se lean en los 35 temas daisyUI. Todos en `overflow-x-auto` + `min-w-[…]` para no romper en móvil. Tooltips por CSS (`.pv-tip` con `:hover`/`:focus-within`), nunca por JS.
- `PersonActivityChart.astro`: columnas apiladas por año, top-5 tipos + "Otros". **Escala logarítmica automática** cuando `maxTotal/minNoCero >= 8` (Kast: 588 eventos en 2026 vs 1 en 1999), y se rotula en el pie en vez de falsear la proporción. Cada columna es `href="#anio-YYYY"`: sin JS degrada a enlace.
- `PersonNetwork.astro`: co-apariciones en radial, radio de nodo ∝ √(compartidos). Con < 4 vecinos cae a lista (una circunferencia de 2 nodos se ve vacía y las etiquetas se pisan).
- `PersonCargoTimeline.astro`: gantt de cargos, **sustituye al diagrama Mermaid** (pesaba ~1 MB, ignoraba el tema del sitio y no admitía enlaces). Etiquetas en carril izquierdo fijo (`LABEL_W`) y barra en el derecho: si no, un cargo vigente llega hasta "hoy" y tapa su propio texto. Normalizar `desde`/`hasta` con `isoDay()` — YAML puede materializar un `Date`, no un string.
- **A11y de gráficos**: todo SVG con `role="img"` + `aria-labelledby`. La tabla alternativa va dentro de un `<div class="sr-only">`, **no** con `sr-only` en el `<table>`: recorta la caja pero no su `<caption>` (`display: table-caption`), que se dibuja fuera del recorte.
- **Peso de página**: la ficha de Kast pasó de 886 KB a ~1 MB→~990 KB. Lo que manda es el dataset lazy (`#person-events-data`). Reglas: los ids de persona/tema viajan, no los nombres; los mapas de `people`/`topics` incluyen **solo los ids referenciados** (el registro completo son 2.502 entradas = 97 KB por ficha); `search` lo arma el cliente con la MISMA normalización que `EventCard.astro`. Declaraciones y eventos hacen lazy igual (SSR 12 + JSON + batches de 12).
- **Filtros de eventos** (`PersonEventFilters.astro` + `personPageClient.js`): búsqueda de texto, tipo (multi-toggle), tema y año. **Los cuatro se combinan** (un evento se ve si cumple todos). El estado vive en `#person-events-root[data-year-filter|type-filter|topic-filter]`, única fuente de verdad compartida con el renderer: cada tanda de scroll nace ya filtrada, así lo pintado nunca queda desfasado. Aplicar un filtro llama `window.__gvPersonFillAll()` para volcar el dataset completo; si no, el conteo dependería de cuánta parte se haya alcanzado a pintar.
- **`data-temas` debe llevar IDS, no nombres.** `hydrate()` sobrescribe `e.temas` con los nombres visibles (los necesita la tarjeta), así que conserva los ids aparte en `temaIds`. Mezclar ambos hace que el filtro por tema devuelva 0 en silencio.
- **`data-search` tiene una sola fuente de verdad:** se copia del `<a>` que emite `eventCardHTML` (que a su vez lo saca de `e.search`), en vez de mantener una tercera copia. Si el SSR y el cliente usan campos distintos, unas tarjetas se encuentran en la búsqueda y otras no. El `data-search` del SSR debe llevar los MISMOS campos que `EventCard.astro` (título, etiquetas, personas, temas, tipo, id, fecha, año).
- **Infinite scroll** (`personEventClient.js`): sentinel `#person-events-sentinel` como hermano **después** del grid (dentro de un `grid` se vuelve celda y ocupa una fila), `IntersectionObserver` con `rootMargin: 800px`, batches de 12, y se retira solo al agotar los datos. Sin IntersectionObserver vuelca todo de una, como `/events`.
- **Orden de guard y cleanup (bug real ya cometido dos veces):** en `initPersonEventList()` el guard `script.__gvLoaded` va **antes** de `cleanup()`. En la carga inicial corren la llamada directa y el listener de `astro:page-load`; si el segundo init limpiara primero, se llevaría el sentinel que acaba de crear el primero y la lista dejaría de crecer al hacer scroll. Igual con el estado de citas: `quoteScript` cachea el **nodo**, no solo el módulo, para que un doble init no repinte desde 0 y duplique.
- El init va en `astro:page-load` + llamada directa, como `events/index.astro`: sin el listener, la navegación con View Transitions deja la lista sin poder crecer.
- `quoteHTML()` en `personPageClient.js` espeja el markup de `PersonQuoteItem.astro`: si cambia uno, cambia el otro. Las declaraciones conservan botón "cargar más" a propósito: son pocas, la carga es barata y el control explícito evita un observer más.
- **Citas multilínea:** un blockquote puede ocupar varias `>` y poner la atribución (`- [[people/id]]`) en la última. `extractQuotes.ts` acumula la racha de líneas `>` y usa la última con atribución como cierre; los párrafos se unen con `\n\n`. Antes solo sobrevivía la línea con la atribución (de una cita de 3 párrafos se mostraba "Un abrazo"). Reglas: una línea vacía **sin** `>` cierra el grupo (dos citas separadas siguen siendo dos), una línea `>` suelta es separador de párrafo, y una atribución cierra la cita en curso.
- Al renderizar esos párrafos: las comillas tipográficas van **dentro** del primer y último `<p>` (`quoteBody()` en QuoteCard / `quoteParrafos()` en el cliente), nunca fuera — un `<p>` es bloque y la comilla de apertura caería sola en su línea. El texto se escapa antes de sustituir wikilinks porque va con `set:html`. Al copiar, APA aplana los saltos a espacios y MD prefija **cada** línea con `>` (si no, el resto del texto se sale del blockquote).


## Grafo de relaciones (`/graph`, mini en `/events`, ego-grafo)

- `EventGraph.astro` renderiza SVG estático fallback + JSON `<script id="graph-data">`; `force-graph.js` lo reemplaza por SVG interactivo `d3-force` (pan/pinch/drag). `init()` idempotente con `cleanup()`.
- Full mode solo conectados por default (`connected` por nodo); checkbox `#graph-include-isolated` re-ejecuta `init()`.
- Filtros `/graph` (`#graph-filters` en `EventGraph.astro`, solo full): búsqueda (debounce 250ms) + selects tipo/año/tema/persona/org + `mín. vínc.` + aislados; `force-graph.js` filtra nodos/links y re-ejecuta `init()`, con estado en URL (`?q=&tipo=&year=&tema=&persona=&org=&minconn=&aislados=1`, `replaceState`) y contador `#graph-count` + `#graph-empty`. Nodos llevan `temas/personas/orgs/etiquetas/search` en el JSON. Cableado único en `wireGraphFilters()` (guard en el form, re-cablea tras swap VT; sync URL una vez por query). Mini (`/events`) sin filtros.
- Tap en nodo abre `<dialog id="graph-modal">` (bottom-sheet en móvil), no navega; vecinos desde `links`. Umbral `dragMoved` distingue tap/drag. Sin modal (mini) navega directo.
- `EgoGraph.astro` (SVG estático, cero JS) en slot `graph` de `EventConnections.astro`; anchors sin `transition:name` duplicado.
- El skeleton usa solo el spinner local + `role="status"`; no usar `animate-pulse` sobre toda el área ni efectos React/canvas para esta carga local.
- Perf: `alphaMin(0.01)` (~200 ticks) + `fitView` en `end`.

## Página `/events`: filtros y búsqueda en cliente

SSG sin `Astro.url.searchParams` en runtime — filtros se aplican en cliente sobre dataset JSON en `<script id="event-index-data">` (`eventListClient.js`).

- **Dataset:** SSR emite `SSR_LIMIT = 12` tarjetas; resto viaja como JSON y se pinta bajo demanda por mes (IO). JSON excluye `ssrIds` para no duplicar.
- **Filtros:** `applyFilters()` lee URL (`?tema`, `?persona`, `?org`, `?q`, `?tipo` repetible, `?etiqueta` token exacto), fuerza `forceFillAll`, oculta por `data-*`, oculta meses/años vacíos. `fillMonth` reaplica filtros a tarjetas recién insertadas.
- **Búsqueda:** `data-search` normalizado (minúsculas + NFD sin acentos) de título/etiquetas/personas/orgs/temas/tipo/ID/fecha. Debe ser idéntica entre `EventCard.astro` y `eventListClient.js`.
- **Persistencia:** abrir `<details>` programáticamente al filtrar no se guarda en localStorage — listener `toggle` respeta `window.__gvSkipPersist`.

## Consultas IA del detalle de evento

- `chatPrompt` incluye URL canónica, metadatos, extracto normalizado de ~650 caracteres y fuentes. `chatPrefill` es un prompt compacto con presupuesto de contexto (incluye cantidad/títulos de fuentes sin URLs parciales); `data-ai-prefill` lo guarda una sola vez y el click lo inyecta en `q`. `data-prompt` conserva la versión completa, pero solo el botón “Copiar prompt” la copia. Los `href` SSR contienen solo un fallback con la URL del evento, nunca cuatro prompts completos.
- Markdown usa un split group (“Ver en Markdown” + copiar); ambos copiadores mantienen etiqueta y caja de icono estables, cambian `copy → check/alert` dentro del mismo slot y anuncian el resultado con un `role="status"` visualmente oculto para evitar reflow.
- `aiTargets` mantiene Claude como servicio con cuenta, y ChatGPT, Perplexity y Duck.ai como consultas sin cuenta; no sumar servicios que redirijan al login o tengan restricciones regionales sin verificarlos.

## TTS del detalle de evento

`src/pages/events/[year]/[id].astro` — `#btn-tts` + `<select id="tts-voice">`, todo en cliente sobre `.prose`.

- **Voces:** `speechSynthesis` (es-CL/es-ES primero) + `optgroup` Piper (`@realtimex/piper-tts-web`, peer `onnxruntime-web`). Piper = CDN lazy (`tts.voices()` a HF, `tts.predict()` baja modelo ~60-75 MB a OPFS).
- **Carga Piper:** `gvTtsBusyTasks` deriva de las tareas reales; `#btn-tts` recibe `aria-busy` y un aro de tema estático. No agregar border beam/React/canvas: el texto de progreso es la fuente de verdad y el estado no anima continuamente.
- **`onnxruntime-web` pineado a `1.22.0`** (CDN `ONNX_BASE`); no subir sin actualizar CDN. `.wasm` local no se bundlea — plugin `drop-ort-wasm-assets` en `astro.config.mjs` elimina `.wasm` de `dist/_astro` (límite 25 MiB Cloudflare). Si se cambia a `auto`/`local`, revertir plugin.
- Flags `window.__gvEventActionsInit` + `astro:page-load` (pausa con `gvStopAll` al navegar). La inicialización de voces/Piper se llama también directamente al cargar el módulo, y la caché de voces neurales se indexa por `<select>` porque ClientRouter lo reemplaza en cada evento.
- Cancelable (`gvSynthCancel` entre trozos ~900 chars), un solo motor a la vez (`gvStopAll` corta Piper + speech), resaltado por bloques `gvBlockParts`/`gvSplitLong` con `.gv-tts-active` + `scrollIntoView`, cache WAV LRU 1 entrada (`voiceId|texto`).
- Multithreading: `public/_headers` `COOP: same-origin` + `COEP: credentialless` → `SharedArrayBuffer` → onnx multi-hilo (~2-4×). Site-wide por ClientRouter.

## Referencias inline compactas

`SRef` conserva siempre el tooltip. En las fichas densas de `/sueldos`, envolver la referencia en `.sueldos-inline-ref` para neutralizar el `vertical-align: super` del `<sup>` y evitar que el número se monte sobre la línea anterior; el enlace y el scroll a `#ref-N` no cambian.

## Estilos — Tailwind v4 + daisyUI 5

CSS en `src/styles/global.css` (`@import "tailwindcss"` + `@plugin "@tailwindcss/typography"` + `@plugin "daisyui"`, temas `light --default, dark --prefersdark`). Plugin Vite `@tailwindcss/vite`. No existe `tailwind.config.mjs`.

- Tema: `data-theme` en `<html>` vía script inline anti-FOUC + `astro:after-swap`, persistido `localStorage 'gv-theme'`; dropdown 35 temas con swatches `data-theme`. Body `bg-base-100`/`text-base-content`.
- Chrome mapeado a tokens semánticos (`bg-white`→`bg-base-100`, `gray-*`→`base-*`, azul→`primary`, ámbar→`warning`). Usar siempre tokens, nunca `gray-*`/`blue-*`.
- Chips categóricos `.rel-chip` + `[--chip-hue:#hex]` con `color-mix` en `global.css` (legible en 35 temas). `TIPO_COLORS`/`EDGE_COLORS` son color plano de datos.
- Pitfalls v4: border default `currentColor`, `shadow-sm`→`shadow-xs`, `rounded-sm`→`rounded-xs`, `oklch(var(--color-x)/a)` no existe, `bg-primary/10/30` inválido (un modificador), escapar `/` en `<style>` (`.bg-primary\/70`).

Ver `src/lib/eventTypes.ts` (`TIPO_LABELS/STYLES/COLORS`), `src/lib/relations.ts` (`RELATION_CHIP_CLASS`), `src/styles/global.css`.
