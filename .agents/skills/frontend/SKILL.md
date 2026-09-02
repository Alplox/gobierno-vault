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
- `astro.config.mjs: prefetch: { prefetchAll: true, defaultStrategy: 'hover' }`.
- Scripts: listeners globales registrados una sola vez con guard `window.__gvXxxInit` + `cleanupFns`. No usar `DOMContentLoaded`; usar `astro:page-load`. Los `<script>` bundleados solo se ejecutan **una vez** — inits con `IntersectionObserver` (`initTimeline`/`initEventList`) deben ir en `astro:page-load` y desconectar observer previo, nunca cortocircuitar todo el init con `window.__gvXxxInit`. El guard por nodo `script.__gvLoaded` va primero (page-load también dispara en carga inicial → doble init). Ver comentarios en `Base.astro` y fix en `eventListClient.js`.

## Lazy load + TimelineNav (rail temporal)

`TimelineNav.astro` para home y `/events`:

- **Rail y FAB comparten condición JS única** (`updateRailVisibility`): `matchMedia('(min-width: 64rem)')` Y margen derecho `main` ≥ 64px; FAB es complemento (`lg:hidden`). Bottom-sheet sin `lg:hidden` (debe abrirse también en lg+ estrecho; inerte con `pointer-events-none` + `translate-y-full`).
- Expandir `<details>` colapsado no recalcula layout inmediato → `scrollIntoView` debe ir en `requestAnimationFrame` + reajuste `setTimeout(~400ms)` porque el IO sigue llenando meses y el documento crece.
- `getBoundingClientRect()` miente dentro de `<details>` cerrado (Chrome: descendientes devuelven rects stale no-cero). Usar `hiddenByDetails()` que camina ancestros `details` (ver `Timeline.astro`).
- Salto a mes en año/década colapsado: destino puede no estar en DOM (SSR no emite `<section>` si año cerrado). Ambos renderers exponen `window.__gvFillMonth(key)` (`timelineClient.js` / `eventListClient.js`); `expandAncestors` lo llama para forzar carga.

## Grafo de relaciones (`/graph`, mini en `/events`, ego-grafo)

- `EventGraph.astro` renderiza SVG estático fallback + JSON `<script id="graph-data">`; `force-graph.js` lo reemplaza por SVG interactivo `d3-force` (pan/pinch/drag). `init()` idempotente con `cleanup()`.
- Full mode solo conectados por default (`connected` por nodo); checkbox `#graph-include-isolated` re-ejecuta `init()` (guard `__gvWired`).
- Tap en nodo abre `<dialog id="graph-modal">` (bottom-sheet en móvil), no navega; vecinos desde `links`. Umbral `dragMoved` distingue tap/drag. Sin modal (mini) navega directo.
- `EgoGraph.astro` (SVG estático, cero JS) en slot `graph` de `EventConnections.astro`; anchors sin `transition:name` duplicado.
- Perf: `alphaMin(0.01)` (~200 ticks) + `fitView` en `end`.

## Página `/events`: filtros y búsqueda en cliente

SSG sin `Astro.url.searchParams` en runtime — filtros se aplican en cliente sobre dataset JSON en `<script id="event-index-data">` (`eventListClient.js`).

- **Dataset:** SSR emite `SSR_LIMIT = 12` tarjetas; resto viaja como JSON y se pinta bajo demanda por mes (IO). JSON excluye `ssrIds` para no duplicar.
- **Filtros:** `applyFilters()` lee URL (`?tema`, `?persona`, `?org`, `?q`, `?tipo` repetible, `?etiqueta` token exacto), fuerza `forceFillAll`, oculta por `data-*`, oculta meses/años vacíos. `fillMonth` reaplica filtros a tarjetas recién insertadas.
- **Búsqueda:** `data-search` normalizado (minúsculas + NFD sin acentos) de título/etiquetas/personas/orgs/temas/tipo/ID/fecha. Debe ser idéntica entre `EventCard.astro` y `eventListClient.js`.
- **Persistencia:** abrir `<details>` programáticamente al filtrar no se guarda en localStorage — listener `toggle` respeta `window.__gvSkipPersist`.

## TTS del detalle de evento

`src/pages/events/[year]/[id].astro` — `#btn-tts` + `<select id="tts-voice">`, todo en cliente sobre `.prose`.

- **Voces:** `speechSynthesis` (es-CL/es-ES primero) + `optgroup` Piper (`@realtimex/piper-tts-web`, peer `onnxruntime-web`). Piper = CDN lazy (`tts.voices()` a HF, `tts.predict()` baja modelo ~60-75 MB a OPFS).
- **`onnxruntime-web` pineado a `1.22.0`** (CDN `ONNX_BASE`); no subir sin actualizar CDN. `.wasm` local no se bundlea — plugin `drop-ort-wasm-assets` en `astro.config.mjs` elimina `.wasm` de `dist/_astro` (límite 25 MiB Cloudflare). Si se cambia a `auto`/`local`, revertir plugin.
- Flags `window.__gvEventActionsInit` + `astro:page-load` (pausa con `gvStopAll` al navegar).
- Cancelable (`gvSynthCancel` entre trozos ~900 chars), un solo motor a la vez (`gvStopAll` corta Piper + speech), resaltado por bloques `gvBlockParts`/`gvSplitLong` con `.gv-tts-active` + `scrollIntoView`, cache WAV LRU 1 entrada (`voiceId|texto`).
- Multithreading: `public/_headers` `COOP: same-origin` + `COEP: credentialless` → `SharedArrayBuffer` → onnx multi-hilo (~2-4×). Site-wide por ClientRouter.

## Estilos — Tailwind v4 + daisyUI 5

CSS en `src/styles/global.css` (`@import "tailwindcss"` + `@plugin "@tailwindcss/typography"` + `@plugin "daisyui"`, temas `light --default, dark --prefersdark`). Plugin Vite `@tailwindcss/vite`. No existe `tailwind.config.mjs`.

- Tema: `data-theme` en `<html>` vía script inline anti-FOUC + `astro:after-swap`, persistido `localStorage 'gv-theme'`; dropdown 35 temas con swatches `data-theme`. Body `bg-base-100`/`text-base-content`.
- Chrome mapeado a tokens semánticos (`bg-white`→`bg-base-100`, `gray-*`→`base-*`, azul→`primary`, ámbar→`warning`). Usar siempre tokens, nunca `gray-*`/`blue-*`.
- Chips categóricos `.rel-chip` + `[--chip-hue:#hex]` con `color-mix` en `global.css` (legible en 35 temas). `TIPO_COLORS`/`EDGE_COLORS` son color plano de datos.
- Pitfalls v4: border default `currentColor`, `shadow-sm`→`shadow-xs`, `rounded-sm`→`rounded-xs`, `oklch(var(--color-x)/a)` no existe, `bg-primary/10/30` inválido (un modificador), escapar `/` en `<style>` (`.bg-primary\/70`).

Ver `src/lib/eventTypes.ts` (`TIPO_LABELS/STYLES/COLORS`), `src/lib/relations.ts` (`RELATION_CHIP_CLASS`), `src/styles/global.css`.
