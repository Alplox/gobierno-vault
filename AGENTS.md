# Gobierno Vault — Guia para Agentes

> Este archivo se auto-actualiza. Si descubres un patron, convencion o cambio
> que no este documentado aqui, agregarlo. Un agente que no actualiza
> AGENTS.md deja de ser util para el proximo agente.

## Que es esto

Base de conocimiento estatica sobre eventos de gobierno en Chile.
Astro 7 + Tailwind, output `static` (SSG). Lenguaje: espanol.

Archivo `EVENTS_INDEX.md` permite contexto rápido para agentes y usuarios.

La bitácora de eventos detectados como faltantes (anti recency bias) vive en la carpeta `TAREAS/`
(desde 15-ago-2026; antes era el monolito `TAREAS.md` de 995 líneas/433KB). No hay `TAREAS.md`
raíz ni archivo de completadas: lo hecho queda en EVENTS_INDEX.md (inventario auto-generado) y en
git log. Estructura:
- `TAREAS/PENDIENTES/YYYY.md` — tareas `⬜ pendiente`/`🟡 parcial` accionables por año (2016, 2019-2026)
- `TAREAS/PENDIENTES/TRANSVERSALES.md` — pendientes sin año único (estallido, corrupción, histórico)
- `TAREAS/SEGUIMIENTO.md` — seguimiento activo (Cuentas Públicas, desenlaces judiciales, verificaciones, tandas de fuentes)

Cuando se detecte un evento pendiente que no se implementará en el momento, registrarlo en
`TAREAS/PENDIENTES/YYYY.md` (o `SEGUIMIENTO.md` si es seguimiento de algo ya cubierto) con fecha,
tipo sugerido y estado (`⬜ pendiente`). **Al completarse, la fila se ELIMINA del archivo de
pendientes** — no queda en la lista con un `✅` —, porque lo hecho queda documentado en
EVENTS_INDEX.md (inventario auto-generado) y en git log. Lo mismo aplica a `TAREAS/SEGUIMIENTO.md`:
cuando un seguimiento concluye (se verifica, se crea el evento, se cierra el desenlace), la
entrada se elimina del archivo — nunca queda con un `✅` de completado ocupando espacio. Si una
entrada de seguimiento contiene pendientes aún activos, reescribirla conservando solo esos
pendientes (`⬜`/`🟡`) y descartando el registro de lo ya hecho.
**Toda entrada pendiente debe incluir su origen: `Origen: <url>`** — la URL que entregó el
usuario o la fuente que reveló la brecha (si el origen es una red social, además la URL de
prensa que la valida). Así retomar la tarea no exige re-buscar por el titular.

Reglas para retomar una tarea: (1) crear el evento siguiendo `TEMPLATE.md`; (2) mínimo 5 fuentes
por evento de medios distintos, nunca redes sociales como fuente única; (3) eventos 2019-2021
(era Piñera) necesitan entidades nuevas en `entities.yaml`; (4) tras cada tanda: `pnpm run generate-index` 
+ verificar 0 fuentes huérfanas; (5) eliminar la fila de `TAREAS/PENDIENTES/` o de
`TAREAS/SEGUIMIENTO.md` (la tarea queda documentada por el ID del evento creado y el índice).
Usuario encarga de validar con `pnpm run build`.

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
  apuntando a nodos viejos y los meses quedan atascados en "… cargando". **Y al revés:** el guard
  de idempotencia por nodo (`script.__gvLoaded`) va PRIMERO, antes de desconectar/limpiar estado:
  `astro:page-load` también se dispara en la carga inicial, así que la llamada directa del módulo +
  el listener producen DOS inits; si el segundo limpia estado antes del check, deja los meses lazy
  sin llenar jamás — solo quedan las tarjetas SSR (bug real corregido 24-ago-2026 en
  `eventListClient.js`: /events mostraba headers de mes sin tarjetas al scrollear). Los meses dentro
  de `<details>` cerrado no disparan el observer hasta abrir el año; al abrirse el IO notifica y
  llena (verificado).

## Lazy load + navegacion por rail temporal (TimelineNav)

- **Rail y FAB comparten una sola condición JS** (`updateRailVisibility` en `TimelineNav.astro`):
  el rail es visible solo si `matchMedia('(min-width: 64rem)')` Y margen derecho de `main` ≥ 64px;
  el FAB cubre exactamente el complemento (toggle de `lg:hidden`). Antes cada uno miraba una
  condición distinta (CSS `lg:` vs margen JS) y quedaban anchos lg+ estrechos sin ninguno de los
  dos. El bottom-sheet NO lleva `lg:hidden`: debe poder abrirse desde el FAB también en ese rango
  desktop (queda inerte por `pointer-events-none` + `translate-y-full`).

`TimelineNav.astro` (partes de load bajo demanda de home y `/events`) necesita conocer pistas:

- **Expandiendo un `<details>` colapsado NO recalcula el layout de inmediato.** Un `scrollIntoView`
  en el mismo tick tras abrir `details` aterriza en la posicion del detalle colapsado, dejando el
  destino fuera de viewport. Hacer el scroll en `requestAnimationFrame` Y re-ajustar tras
  `setTimeout(~400ms)`, porque el IntersectionObserver sigue llenando meses del nuevo viewport y
  el documento crece desplazando el objetivo.
- **`getBoundingClientRect()` MIENTE dentro de `<details>` cerrado (Chrome moderno).** El contenido
  oculto ya no usa `display:none`: los descendientes devuelven rects stale no-cero, asi que el
  filtro por tamano 0x0 no detecta lo colapsado (bug real del crumb sticky de home: mostraba fechas
  fantasma al pasar por años cerrados; corregido 23-ago-2026 con `hiddenByDetails()` en
  `Timeline.astro`, que camina los ancestros `details`). Lo mismo aplica a cualquier logica de
  visibilidad que dependa de rects de secciones dentro de acordeones.
- **El rail salta a un mes en un año/decada colapsado**: el destino puede no estar en el DOM
  (SSR no emite el `<section>` si el año esta cerrado). Ambos renderers exponen
  `window.__gvFillMonth(key)` (`timelineClient.js` para home, `eventListClient.js` para `/events`);
  `expandAncestors` lo llama para forzar la carga del mes objetivo al hacer clic, en lugar de
  depender solo del IntersectionObserver.

## Grafo de relaciones (/graph, mini en /events, ego-grafo en detalle)

- **Arquitectura**: `EventGraph.astro` renderiza un SVG estatico de fallback + JSON en
  `<script id="graph-data">`; `force-graph.js` lo reemplaza por un SVG interactivo
  (d3-force) con pan/pinch/drag. `init()` es idempotente: `cleanup()` remueve el SVG
  interactivo previo y los window listeners (`cleanupFns`).
- **Full mode solo conectados por default**: el JSON lleva `connected` por nodo; el
  checkbox `#graph-include-isolated` re-ejecuta `init()` (guard `__gvWired`) para
  incluir los aislados. El fallback estatico de SSR tambien filtra.
- **Tap en nodo abre `<dialog id="graph-modal">`** (no navega): vecinos y relaciones se
  calculan en cliente desde `links` del JSON. En movil es bottom-sheet (clases
  `max-sm:` sobre el dialog). Cierre: X, Escape o click en backdrop. Si no hay modal
  (mini), el tap navega directo como antes. El umbral `dragMoved` distingue tap de drag.
- **Ego-grafo**: `EgoGraph.astro` (SVG estatico en build, cero JS) vive en el slot
  `graph` de `EventConnections.astro`; solo se emite con conexiones explicitas. Los
  anchors de vecinos NO llevan view-transition-name (los de RelationLink ya reservan
  esos IDs; duplicarlos rompe las transiciones).
- **Perf**: la simulacion usa `alphaMin(0.01)` (~200 ticks) y re-encuadra (`fitView`)
  en el evento `end`; no queda tickando indefinidamente.

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
    sueldos.yaml     datos de la pagina /sueldos (montos, series, referencias)
  lib/
    registry.ts        lee YAML, retorna typed registries
    queries.ts         wrap de Astro getCollection + registries
    extractEntities.ts regex walker, extrae wikilinks de .md (cached)
    editorData.ts      datos para autocomplete del /admin
    eventTypes.ts      TIPO_LABELS, TIPO_STYLES, TIPO_COLORS — constantes compartidas
    remarkWikiLinks.mjs  remark plugin activo — convierte [[...]] a HTML
  components/          EventCard, FilterBar, Timeline, SourceRef, RelationBadge
  layouts/Base.astro   layout unico (nav + slot + footer + CSS global + tooltip JS)
  pages/               rutas: /, /events, /events/[year]/[id], /people, /organizations, /sources, /topics, /stats, /admin, /llm.txt (y alias /llms.txt), /events/[year]/[id].md, /data/*.yaml
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
- **Redes sociales** (Reddit r/chile, X/Twitter, YouTube): `tipo: red_social` en organizations; solo complementarias, nunca fuente unica (ver TAREAS/). Para documentar reacciones ciudadanas con variedad de voces y los metodos de busqueda probados por plataforma, ver la sección [Fuentes de redes sociales: metodologia para "reacciones comunitarias"](#fuentes-de-redes-sociales-metodologia-para-reacciones-comunitarias).
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
7. **`relaciones`**: apuntar al ID del archivo (sin extension), ej: `20260720-1`. **No declarar la misma conexion en ambas direcciones** (ej. A `deriva_en` B Y B `responde_a` A): el timeline y la seccion Conexiones muestran la relacion una sola vez, y el codigo deduplica en runtime conservando el outgoing (`src/lib/relations.ts` `getEventConnections`) — si se declara dos veces, la etiqueta temporal (Siguiente/Anterior) se calcula por fecha real del evento relacionado, no por la direccion de la relacion.
8. **Wikilinks en body**: siempre que se mencione una persona, org, fuente o cifra, usar wikilink. **Enforcement mecánico (desde 16-ago-2026):** `scripts/validate.mjs` falla si (a) el **nombre completo** de una persona registrada en `entities.yaml` aparece en prosa sin ningún `[[person/id]]`, o (b) una persona **ya enlazada** en el evento se menciona después por su apellido distintivo en prosa (ej. "Kast" tras el primer enlace). La detección (compartida con el fixer, `scripts/proseNames.mjs`) omite apellidos ambiguos (dos personas con el mismo apellido enlazadas, ej. padre/hijo Cisternas), apellidos precedidos por un nombre de pila ("Fernando Matthei" ≠ Evelyn), prefijos de organización ("Fundación Kast") y apellidos de 3 letras que son palabras comunes ("del", "san", "mas"). El wikilink renderiza el nombre canónico completo del YAML. Limpieza del backlog existente: `node scripts/fix-prose-wikilinks.mjs` (itera hasta punto fijo — enlazar el nombre completo habilita la detección del apellido en la pasada siguiente; `--dry-run` para revisar antes).
9. **Fuentes**: agregar a `sources.yaml` si es nueva. Formato ID: `medio-YYYY-MM-DD-slug`. **Siempre inline** en el párrafo que usa la info, nunca en `## Referencias` separada.
10. **URLs de fuentes**: NUNCA usar URLs raíz/domino (`https://lasegunda.com/`). Siempre usar la URL completa del artículo específico. Si el original está paywall y no se puede obtener la URL exacta, usar una fuente secundaria que cite la original (ej: El Ciudadano citando a La Segunda) y agregar campo `notas` al YAML indicando la fuente primaria. Los datos deben ser verificables y rastreables a una fuente concreta.
    - Para leer contenido detrás de paywall o bloqueado, usar los mirrors de la sección [Extraccion de contenido web](#extraccion-de-contenido-web): `paywallskip.com`, `r.jina.ai`, `defuddle.md`, `markdown.new`, `archive.ph`. La URL guardada en `sources.yaml` es SIEMPRE la del artículo original, nunca la del mirror.
    - Segun corresponda intentar obtener mayor contexto para reducir sesgos usando fuentes listadas en `FUENTES_GUBERNAMENTALES.md`.
11. **Personas/orgs nuevas**: agregar a `entities.yaml`.
12. **Cifras nuevas**: agregar tipo a `entities.yaml` > `cifras`.
13. **NO usar notas de editor ni metainstrucciones en el body de eventos**: está prohibido dejar marcadores de gestión como `Nota de verificación`, `pendiente evento propio`, `ver TAREAS` (en cualquier variante: `TAREAS.md`, `TAREAS/SEGUIMIENTO.md`, `TAREAS/PENDIENTES/...`, `en TAREAS`, `registrado en TAREAS`), `para seguimiento`, `pendiente de validación cruzada`, `pendiente de reacciones`, `pendiente el desenlace` o `queda pendiente de verificación`. El body solo contiene hechos verificables y análisis; los cross-references entre eventos tipo `(ver evento X)` SÍ son válidos (los IDs se auto-enlazan). Si algo requiere validación, profundización o más fuentes, registrarlo en `TAREAS/` (estado `⬜ pendiente`/`🟡 parcial`) y no en el body del evento. **Enforcement mecánico**: `scripts/validate.mjs` (que corre antes del build) detecta estos patrones en el body y hace fallar el build. Se exceptúan los eventos-tracker diseñados como tales (ej. `20250822-1`, que da seguimiento a propuestas de campaña).
14. **Consultar el catálogo de sitemaps ANTES de buscar en la web**: para los medios guardados localmente (ver lista completa en "Catálogo de sitemaps → Uso del catálogo por agentes"; ej. `biobiochile`, `elmostrador`, `theclinic`, `latercera`, `cnnchile`, `elciudadano`, `malaespina`, `elquintopoder`, `df`), buscar primero con `rg -i --no-heading -uu '<términos>' sitemaps/<slug>/` (o sobre todo el catálogo con `rg -i -uu -g '*.jsonl' '<términos>' sitemaps`; `-uu` es obligatorio porque los JSONL están gitignoreados) — entrega URL + fecha (+ título real si es news-sitemap) sin tocar la red, y evita búsquedas online redundantes (ver sección "Catálogo de sitemaps → Uso del catálogo por agentes"). El catálogo NO trae el cuerpo del artículo: tras el match, leer la URL con `read_url` o los mirrors.
15. **Cifras en disputa: párrafo + tabla comparativa**: cuando las fuentes no coinciden en una cifra (conteos, plazas, montos — ej. los trasladados de la Operación Cancerbero en `20260813-1`), además del párrafo que describe la desincronización, agregar una **tabla markdown comparativa** en la misma sección que liste por fila: la cifra (con `[[cifra/...]]` si está registrada), la fuente/emisor (con `[[source/...]]` inline) y una columna de contexto/explicación (qué mide cada cifra, por qué difiere). Esto permite comparar de un vistazo y evitar que el dato quede solo en prosa. Si tras investigar se concilia (una cifra es la oficial y las demás son errores, proyecciones intermedias o malinterpretaciones), decirlo explícitamente en el párrafo y marcarlo en la tabla (ej. columna "Concilia" o una nota al pie). Registrar en `TAREAS/` solo lo que quede genuinamente pendiente.
16. **Votaciones (`tipo: votacion`): conteos con fuente oficial**: además de la cobertura de prensa, verificar el resultado y el conteo (a favor / en contra / abstenciones) en la página oficial de votaciones del Senado (`senado.cl/actividad-legislativa/sala/votaciones`) o de la Cámara (`camara.cl/legislacion/sala_sesiones/votaciones.aspx`, y por proyecto con `ProyectosDeLey/votaciones.aspx?prmBOLETIN=NNNNN-NN`). Citar la URL de la votación concreta en `sources.yaml` (`medio: Senado de Chile` / `medio: Cámara de Diputados`) y registrar cada conteo como `[[cifra/...]]` (ej. los vetos de la megarreforma en `20260810-10`). Si la votación fue nominal y el detalle por parlamentario es relevante para el evento, mencionarlo con la URL oficial. Ver FUENTES_GUBERNAMENTALES.md → Poder Legislativo.


> **Metodología de redes sociales:** ver [.agents/skills/social-media.md](.agents/skills/social-media.md)

## Pagina /events: filtros y busqueda en cliente

El sitio es SSG, por lo que `Astro.url.searchParams` NO existe en runtime: la página
`/events` se genera sin query string. Los filtros (`?tema`, `?persona`, `?org`, `?q`,
`?tipo` (repetible, chips multi-toggle), `?etiqueta` (token exacto, input con datalist
de sugerencias top-300 calculado en build))
y la busqueda se aplican en el cliente sobre un dataset JSON completo que viaja en
`<script id="event-index-data">` (ver `eventListClient.js`).

- **Dataset**: la primera tanda de tarjetas se renderiza en SSR (`SSR_LIMIT = 12` en
  `events/index.astro`); el resto viaja como JSON y se pinta bajo demanda al scroll
  (IntersectionObserver por mes). El JSON **excluye** los IDs ya emitidos en SSR
  (`ssrIds`): si viajaran tambien, `fillMonth` los re-insertaría (duplicados).
- **Filtros**: `applyFilters()` lee la URL, fuerza el llenado de todos los meses
  (`forceFillAll`), oculta las tarjetas que no matchean `data-tipo`/`data-tema`/
  `data-personas`/`data-orgs`/`data-etiquetas`/`data-search` y oculta meses/años vacíos.
  **Importante**: `fillMonth` re-aplica los filtros activos a las tarjetas recién
  insertadas — sin eso, el observer puede llenar meses DESPUÉS de un `applyFilters`
  y dejar visibles tarjetas que no matchean (bug de carrera corregido 20-ago-2026).
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
  peer de `onnxruntime-web` (postinstall de `protobufjs` autorizado en `onlyBuiltDependencies`).
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
  `astro:page-load` para llenar voces y PAUSAR la reproducción (`gvStopAll`) al navegar.
- **Síntesis cancelable (21-ago-2026)**: mientras sintetiza, el botón muestra
  "Cancelar" (`gvSynthCancel`, cooperativa — se revisa entre trozos de ~900 chars,
  latencia máx = 1 trozo). El mensaje muestra "N/M (clic para cancelar)".
- **Un solo motor a la vez (21-ago-2026)**: cambiar la voz en el select o apretar
  Escuchar con voz de navegador corta el audio Piper previo (`gvStopAll` pausa el
  `<audio>` + `speechSynthesis.cancel()`); nunca deben solaparse los dos motores.
- **Resaltado sincronizado (21-ago-2026)**: la síntesis trocea por BLOQUES del DOM
  (`gvBlockParts`: p/li/h*/blockquote/pre externos, sin `.not-prose` ni tooltips);
  bloques >900 chars se subdividen por oración (`gvSplitLong`) conservando el `el`
  de origen. `ontimeupdate → gvSyncHighlight()` mueve `.gv-tts-active` (CSS en
  Base.astro) al bloque activo + scrollIntoView si sale del viewport. "Siguiente"
  salta exactamente a un límite de trozo. Al reanudar/volver a la página se
  re-zipean los els por índice (`gvMarkResumable`/rama resume del toggle) — el
  mapeo es determinista respecto al DOM. No hay highlight por palabra: la librería
  no expone alineación fonémica.
- **Cache de audio sintetizado (21-ago-2026)**: el WAV generado vive a nivel de módulo
  (`gvPiperAudio`/`gvCacheKey`, LRU de 1 entrada, clave `voiceId|texto`). Detener = `pause()`
  (label "Reanudar"); volver a la página del evento retoma desde el mismo segundo sin
  resintetizar (el módulo persiste entre navegaciones View Transitions; se pierde con
  recarga completa). Al sintetizar otro texto/voz se revoca el blob anterior. El label
  "Reanudar" al volver lo setea `gvMarkResumable()` en `astro:page-load`.
- **Multithreading de síntesis (21-ago-2026)**: `public/_headers` manda site-wide
  `COOP: same-origin` + `COEP: credentialless` → habilita `SharedArrayBuffer` →
  onnxruntime-web usa múltiples hilos (~2-4× más rápido que single-thread). Site-wide y
  no scoped a `/events/*` porque con ClientRouter la isolation la fija el DOCUMENTO
  inicial (entrar por `/` y navegar SPA llegaría sin isolation). `credentialless` no
  rompe recursos externos sin CORP (audit: no hay iframes/scripts/fuentes/imágenes
  externas); Safari lo ignora y queda single-thread sin romperse. Si algún día se
  agrega un embed externo, probarlo con estas cabeceras activas.

## Formato LLM (llm.txt + markdown/YAML crudo)

El sitio es amigable para agentes/LLMs — convencion llmstxt.org adaptada:

- **`/llm.txt`** (y alias `/llms.txt`): indice en texto plano generado en build por `src/lib/llmIndex.ts` (endpoint `src/pages/llm.txt.ts`). Incluye guia de navegacion, el formato de los wikilinks y el **indice completo de eventos** (fecha | titulo | link .md | link pagina), uno por linea.
- **`/events/AAAA/ID.md`** (`src/pages/events/[year]/[id].md.ts`): sirve el **markdown fuente** del evento (frontmatter + body con wikilinks sin resolver) con `Content-Type: text/markdown`. Cada pagina de detalle tiene el boton "Ver en Markdown" que enlaza a esta ruta.
- **`/data/{entities,sources,topics,colectivos,sectores}.yaml`** (`src/pages/data/[name].yaml.ts`): sirve los registros YAML crudos de `src/data/` como `text/yaml` — lista blanca de 5 archivos, 404 para otros.
- El footer de `Base.astro` enlaza a `/llm.txt`.

Los endpoints usan `getStaticPaths`/`GET` estaticos (SSG): no hay runtime. Al agregar un archivo YAML nuevo en `src/data/`, sumarlo a `ALLOWED` en `src/pages/data/[name].yaml.ts` y a la guia de `llmIndex.ts`.

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
- **Verificacion de fechas/cargos de los gabinetes (1938-2026)**: matriz por gobierno,
  fechas clave, fuentes oficiales usadas (Minsal, BCN, gob.cl, Diario Oficial, archivo
  Lagos UDP) y pendientes vive en `TAREAS/GABINETES-VERIFICACION.md` — al crear/modificar
  un `cargos[]` ministerial, actualizar esa matriz (estado ✅/🟡) y registrar la fuente
  que respalda la fecha. Convencion: `desde` = juramento/asuncion, `hasta` = cesacion.
  Auditoria automatica: `pnpm run verify-gabinete` compara los `cargos[]` contra los
  anexos de gabinetes de Wikipedia (cache en `sitemaps/.cache/gabinete-wiki/`).
  Los paneles `aguirre_cerda`..`allende` y `pinochet` usan carteras historicas mapeadas
  en `cabinet.ts` (`KEYWORD_MINISTERIO`: Guerra/Marina/Aviacion→Defensa, Salud
  Publica/Salubridad→Salud, Fomento→Economia). Subsecretarios NO se trackean en
  `cargos[]` (solo eventos).

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
- **Verificación**: cada cifra verificable del discurso se registra como `[[cifra/...]]`; el seguimiento de implementación de los anuncios pendientes vive en TAREAS/SEGUIMIENTO.md bajo "Cuentas Públicas — seguimiento de anuncios".
- **Estado de la serie**: 2022 (1ª Boric) ⬜ pendiente · 2023 (2ª Boric) ✅ `20230601-1` · 2024 (3ª Boric) ✅ `20240601-1` · 2025 (4ª Boric) ✅ `20250601-1` (master: CP 2025 ampliada, anuncio de Punta Peuco conservado como sección; los `responde_a` de 20260514-1 y 20251114-1 siguen apuntando al mismo evento) · 2026 (1ª Kast) ✅ `20260601-5`.
- Las **cuentas públicas sectoriales/ministeriales** (participativas) también generan eventos cuando anuncian (ej. Minsal `20260729-17`, Minería `20260729-19`), pero la serie master es la presidencial.

## Reglas al modificar datos YAML

- `entities.yaml`: agregar persona/org/cifra nueva en su seccion correspondiente.
- `sources.yaml`: formato `id-slug: { tipo, medio, titulo, autor, fecha, url }`.
- **Campo `medio:` de `sources.yaml`**: debe ser EXACTAMENTE el `nombre` de una org de prensa de `entities.yaml` (tipo `medio_comunicacion` | `red_social` | `canal_television` | `programa_tv` | `programa_streaming`). Si el emisor NO es prensa (institucion del Estado, encuestadora, plataforma social/documento, publicacion academica), usar el nombre descriptivo y agregarlo a `WHITELIST_MEDIOS` en `scripts/validate.mjs`. `pnpm run validate` (corre antes del build) falla con el ID de la fuente si el `medio:` no cumple la regla. Ver seccion "Encoding y edicion concurrente" para el detector de mojibake.
- `topics.yaml`: formato `id: { nombre, descripcion, relacionados: [] }`.
- `colectivos.yaml` / `sectores.yaml`: agregar string al array plano.
- `sueldos.yaml`: datos de la página `/sueldos`. SIN cifras ni entidades hardcodeadas:
  - Personas por ID de entities.yaml (`presidente_id`, `persona_id`, `firmante_id`) — el nombre
    lo resuelve `src/lib/sueldos.ts` vía `getPeopleRegistry()` y el build FALLA si el ID no existe.
  - Referencias por ID de sources.yaml (`orden_refs` fija la numeración [N] visible; los
    `<SRef n={N} />` resuelven medio/título/url contra `getSourcesRegistry()`). Las fuentes de
    esta página SON entradas normales de sources.yaml (con su `medio:` validado) — no hay un
    array local. Insertar/eliminar una fuente = tocar solo `orden_refs`.
  - Cada monto presidencial lleva `vigencias[]` (monto + fuente + descripción de cuándo rigió)
    para seguimiento anti-stale; los derivados (ratios, ajustes IPC, promedios) se calculan en
    `src/lib/sueldos.ts` y la prosa interpola esos valores.
  - `serie_registro_publico.puntos[]` es la serie mensual bruta del Presidente (desde 2025-01,
    leída del registro el 23-ago-2026) que alimenta la línea de tiempo SVG estática de /sueldos;
    al llegar un periodo nuevo se agrega un punto con la misma fuente.
  - El YAML se sirve en `/data/sueldos.yaml` (ALLOWED de `src/pages/data/[name].yaml.ts`).

### Encoding y edicion concurrente (incidente 20-ago-2026)

- **NUNCA usar PowerShell `Set-Content`/`Out-File`/`Add-Content` ni redireccion `>` sobre archivos del repo**: reescriben el archivo completo con encoding ANSI/CRLF de Windows y corrompen UTF-8 (un solo rename con `Set-Content` genero un diff de 31 mil lineas). Para transformaciones masivas usar scripts Node con `readFileSync`/`writeFileSync` explicitos en `utf8`, o las herramientas Edit/Write del agente.
- **Valores YAML que empiezan con caracteres reservados** (`@`, `*`, `&`, `%`) deben ir entre comillas: `autor: "@hernan_sr"`. Sin comillas rompe el parseo (`@` es reservado).
- **validate parsea los 5 YAML de datos al inicio** con mensaje limpio (archivo + linea) y su detector de mojibake cubre: doble-encoding clasico (C2/C3), controles C1 (UTF-8 leido como CP1252, ej. em-dash `â€”`), U+FFFD, cirilico y Latin Ext-A/B. Reporta hasta 3 lineas de ejemplo. Si agregas un nombre extrano legitimo que dispare falso positivo, ajustar `MOJIBAKE_RE`. **Desde el 24-ago-2026 tambien escanea todos los `.md` de `TAREAS/`** (bitacora no-YAML, invisible al build) y rechaza BOM UTF-8 inicial — firma del incidente del 23-ago-2026 (PowerShell 5.1: `Get-Content` asume ANSI en archivos sin BOM + `Set-Content -Encoding UTF8` re-escribe con doble codificacion y BOM).
- **Edicion concurrente**: antes de operaciones masivas verificar `git status`; si otro agente/sesion esta activo, coordinar (esta sesion convivio con otra editando los mismos YAML). Protocolo de recuperacion probado: (1) copiar el archivo dañado a temp FUERA del repo; (2) `git checkout -- <archivo>` para volver a HEAD; (3) re-aplicar las entradas propias extrayendolas del backup con un script Node (split por IDs top-level) y concatenando en utf8; (4) `node scripts/validate.mjs` tras cada paso. Nunca "arreglar a mano" alrededor de un parse roto sin validar.

## Build y verificacion

```bash
pnpm run build    # debe completar sin errores
pnpm run dev      # preview local
```

El flag `--experimental-global-customevent` se setea en `astro.config.mjs` (cross-platform, no depende de shell).
Si falla, revisar frontmatter (YAML parse error) o wikilinks rotos.

**Validacion de wikilinks en `validate` (desde 16-ago-2026):** `scripts/validate.mjs`
replica la resolucion de `remarkWikiLinks.mjs` y falla ANTES del build si hay
wikilinks rotos en el body de eventos: `[[source/...]]` contra `sources.yaml`,
`[[person/...]]` / `[[org/...]]` contra `entities.yaml` y `[[event/...]]` contra
los IDs de eventos existentes. Tambien valida las **menciones en prosa** de
personas (regla 8: nombre completo sin enlazar o apellido de persona enlazada —
ver `scripts/proseNames.mjs`, el mismo modulo que usa el fixer). **CRLF:** con
`core.autocrlf=true` el checkout de Windows entrega `\r\n`; las regex de
frontmatter de validate/fixer son tolerantes (`\r?\n`), si no se saltarían en
silencio ~2/3 de los eventos (bug real corregido 16-ago-2026: 639 de 949
archivos nunca se validaban). Lo mismo aplica a `scripts/generate-index.mjs`
(corregido 21-ago-2026): su regex de frontmatter es tolerante a CRLF; con el
bug, el índice y las estadísticas solo contaban los archivos con LF (reportaba
441 eventos cuando el vault real supera los 1.000). Paridad con el plugin: `[[cifra/...]]` NO se
valida (el plugin tampoco) y los IDs de evento desnudos (`\b20\d{6}-\d{1,3}\b`)
solo se enlazan si existen, sin ser error. Se excluyen bloques de codigo fenced
(```) e `inlineCode` (\`) del chequeo, igual que el plugin (que solo recorre
nodos `text` del arbol markdown). **Importante:** el glob-loader de Astro 7 NO
aborta el build ante un wikilink roto — loguea `Error rendering` y guarda la
entrada con `rendered: undefined`, dejando la pagina del evento SIN contenido en
`dist` (falla silenciosa que no rompe el build pero si el sitio). Por eso el
chequeo temprano de `validate` es la red de seguridad real.

**Build en paralelo (`build.concurrency`):** `astro.config.mjs` define
`build: { concurrency: availableParallelism() }` porque el default
de Astro 7 es 1 (generacion secuencial de paginas) y el vault ya supera las
8.600 paginas (eventos + personas + orgs + temas + fuentes). El build corre
LOCAL (`pnpm run deploy`; Cloudflare Pages solo recibe `dist/` via wrangler),
asi que se usan todos los cores de la maquina; si aparece presion de RAM,
volver a un cap tipo `Math.min(availableParallelism(), N)`.

**Tailwind v4 + daisyUI 5 (migrado desde @astrojs/tailwind@6 / Tailwind v3, 21-ago-2026):**
el CSS vive en `src/styles/global.css` (`@import "tailwindcss"` + `@plugin
"@tailwindcss/typography"` + `@plugin "daisyui"`, temas `light --default,
dark --prefersdark`). El plugin Vite es `@tailwindcss/vite` (en
`astro.config.mjs > vite.plugins`, junto al drop-ort-wasm-assets). NO existe
`tailwind.config.mjs` (deprecado en v4; la detección de contenido es
automática). La adopción de clases daisyUI (btn, card, collapse...) es
incremental: el diseño actual no usa clases daisyUI y los temas solo inyectan
variables CSS. **Selector de temas:** el navbar tiene un dropdown con los 35
temas built-in (habilitados todos en `global.css`); la elección persiste en
`localStorage 'gv-theme'` y se aplica como `data-theme` en `<html>` por un
script inline anti-FOUC que se re-aplica en `astro:after-swap` (View
Transitions reemplaza `<html>` completo). El body usa `bg-base-100`/
`text-base-content` desde tokens del tema; el resto del chrome sigue con
utilidades grises hasta migrarse. Los swatches del dropdown usan
`data-theme={id}` en el span para previsualizar el primary de cada tema.
**Migración semántica (21-ago-2026):** todo el chrome (Base.astro, componentes,
páginas y scripts cliente) fue mapeado de grises/azules hardcodeados a tokens
semánticos (`bg-white`→`bg-base-100`, `text-gray-*`→`text-base-content/N`,
`border-gray-*`→`border-base-300`, `hover:bg-gray-100`→`hover:bg-base-200`,
azul de marca→`primary`, ámbar admin→`warning`). Al crear/editar componentes
usar SIEMPRE tokens semánticos, nunca `gray-*`/`blue-*`. **Paletas categóricas
adaptativas (21-ago-2026):** los chips de tipo de evento (`TIPO_STYLES` en
`lib/eventTypes.ts` + duplicados en `eventListClient.js`/`timelineClient.js`) y
de tipo de relación (`RELATION_CHIP_CLASS` en `lib/relations.ts`) usan la clase
`.rel-chip` + `[--chip-hue:#hex]`: un hue por categoría, mezclado con tokens del
tema activo via `color-mix` en `global.css` (regla unlayered `.rel-chip`) —
legible en los 35 temas daisyUI sin variantes por tema. Los hex de
`TIPO_COLORS`/`EDGE_COLORS` (SVG del grafo) siguen siendo color plano: son
codificación de datos, no chrome. El dropdown de temas replica el patrón
del sitio oficial daisyUI: grilla de 4 puntos (base-content/primary/secondary/
accent) por tema vía `data-theme` scoping, una columna, `max-h-[calc(100vh-8.6rem)]`
con scroll. Notas de migración v3→v4 que pueden morder: border default pasa
a currentColor, `shadow-sm`→`shadow-xs`/`rounded-sm`→`rounded-xs` renombrados,
`ring` default 1px. Si un estilo se ve distinto tras tocar utilidades, revisar
esos cambios primero.

**Gestor de paquetes: pnpm** (migrado desde npm). Lockfile: `pnpm-lock.yaml`.
Instalacion: `pnpm install`. No usar npm ni regenerar `package-lock.json`.

**CI:** el archivo `.npmrc` configura `auto-install-peers=true` y
`strict-peer-dependencies=false`. Históricamente existía para resolver
`@astrojs/tailwind@6` con Astro 7; tras la migración a Tailwind v4 ya no hay
conflicto de peers, pero el archivo se conserva por si se re-habilitan builds
remotos. El archivo `pnpm-workspace.yaml` declara
`pnpm.onlyBuiltDependencies` (con `esbuild` y `protobufjs`) para que pnpm 10+
ejecute los postinstall de build de esbuild (binario nativo; sin esto el build
falla con `ERR_PNPM_IGNORED_BUILDS`) y protobufjs (transitiva de `onnxruntime-web`,
peer de `@realtimex/piper-tts-web`). Debe incluir `packages: []` (si falta, pnpm 10
del CI falla con `packages field missing or empty` al correr `pnpm install --frozen-lockfile`).
No eliminar ninguno de los dos archivos.

**Despliegue (Cloudflare Pages, build local):** el sitio se despliega con `pnpm run deploy`, que corre el build local (`node scripts/validate.mjs && astro build` — ~1m40s en dev, 7.800+ páginas) y luego sube `dist/` con `wrangler pages deploy dist --project-name gobierno-vault --branch main` (solo upload, ~20s). Genera la URL `https://gobierno-vault.pages.dev` (subdominio `.pages.dev`, no `.workers.dev`). `wrangler.jsonc` usa `pages_build_output_dir: ./dist`.
- **El build automático de Pages está DESACTIVADO** (`production_deployments_enabled: false`, preview `none` en la API del proyecto): los pushes a GitHub NO gatillan deploy. El build de Cloudflare excedía el límite de 20 min (el vault no cabe en su runner). Publicar cambios requiere correr `pnpm run deploy` localmente después del push.
- El proyecto se creó una sola vez con `npx wrangler pages project create gobierno-vault --production-branch main` (requiere `wrangler login` o token `CLOUDFLARE_API_TOKEN`). Para re-habilitar deploys automáticos: PATCH a `/accounts/<acc>/pages/projects/gobierno-vault` con `source.config.production_deployments_enabled: true`.
- Preview local: `pnpm run preview` (`wrangler pages dev dist`).


> **Herramientas de extracción y procesamiento:** ver [.agents/skills/tools.md](.agents/skills/tools.md)

> **Catálogo de sitemaps:** ver [.agents/skills/sitemaps.md](.agents/skills/sitemaps.md)

> **Respaldo / Restauración:** ver [.agents/skills/backup.md](.agents/skills/backup.md)


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
| Documentos de Office | `scripts/doc-extract.mjs`, sección "Procesamiento de documentos de Office" de este archivo |
| Fetch anti-bot / impersonación | `scripts/fetch-impersonate.mjs`, sección "Extraccion de contenido web" de este archivo |
| Catálogo de sitemaps (fallback Crawlee) | `scripts/sync-sitemaps.mjs` (`fetchWithCrawlee`), sección "Catálogo de sitemaps" de este archivo |
| Wikilink roto | `remarkWikiLinks.mjs` (resolve fallback) |
| Cambio en `/sueldos` (montos, series o fuentes) | `src/data/sueldos.yaml`, `src/lib/sueldos.ts`, este archivo |
| Scripts de sitemaps | `scripts/sync-sitemaps.mjs`, `scripts/sitemaps-index.mjs`, `scripts/sitemaps-backup.mjs`, sección "Catálogo de sitemaps" de este archivo |

<!-- AUTO-GENERATED-SITEMAPS-MEDIOS -->

### Medios registrados (generado automáticamente)

> Esta sección se genera con `pnpm run sitemaps-index` a partir del registro `MEDIA`
> de `scripts/sync-sitemaps.mjs` y de `sitemaps/_manifest.json`. NO editar a mano.

| Slug | Nombre | Sitemap(s) | Filtro | Artículos | Años |
|---|---|---|---|---|---|
| `24horas` | 24 Horas | `www.24horas.cl/robots.txt` | — | 187.019 | 2 |
| `abif` | ABIF | `www.abif.cl/robots.txt` | includeRe | 312 | 3 |
| `acera` | ACERA | `acera.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.647 | 8 |
| `aconcaguadigital` | Aconcagua Digital | `aconcaguadigital.cl/wp-sitemap.xml` | includeRe | 732 | 4 |
| `adnradio` | ADN Radio | `www.adnradio.cl/arc/outboundfeeds/sitemap/?outputType=xml` | — | 400 | 1 |
| `agenciadenoticias` | Agencia de Noticias | `agenciadenoticias.org/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `aitnews` | AIT News | `aitnews.com/sitemap_index.xml` | articleOnly (Yoast) | 79.249 | 17 |
| `alertanoticias` | Alerta Noticias | `alertanoticias.cl/sitemap_index.xml` | articleOnly (Yoast) | 8.434 | 7 |
| `alertanoticiastemuco` | Alerta Noticias Temuco | `alertanoticiastemuco.cl/sitemap_index.xml` | articleOnly (Yoast) | 6.133 | 2 |
| `amchamchile` | AmCham Chile | `amchamchile.cl/sitemap_index.xml` | includeRe | 10.640 | 12 |
| `anda` | Anda | `anda.cl/sitemap_index.xml` | articleOnly (Yoast) | 7.022 | 10 |
| `anef` | ANEF | `anef.cl/sitemap_index.xml` | articleOnly (Yoast) | 2.522 | 5 |
| `angolnoticias` | Angol Noticias | `www.angolnoticiasnew.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.624 | 4 |
| `anip` | ANIP | `anip.cl/sitemap.xml` | — | 70 | 5 |
| `antofacity` | Antofacity | `antofacity.com/sitemap_index.xml` | articleOnly (Yoast) | 3.337 | 16 |
| `antofagastaaldia` | Antofagasta al Día | `antofagastaaldia.cl/sitemap_index.xml` | articleOnly (Yoast) | 3.112 | 7 |
| `antofagastanoticias` | Antofagasta Noticias | `antofagastanoticias.cl/sitemap_index.xml` | articleOnly (Yoast) | 9.658 | 9 |
| `arauco` | Arauco | `arauco.com/sitemap_index.xml` | articleOnly (Yoast) | 190 | 10 |
| `aricaesnoticia` | Arica es Noticia | `aricaesnoticia.cl/sitemap_index.xml` | articleOnly (Yoast) | 7.479 | 13 |
| `atacamaenlinea` | Atacama en Línea | `atacamaenlinea.cl/sitemap_index.xml` | articleOnly (Yoast) | 7.371 | 10 |
| `atacamanoticias` | Atacama Noticias | `www.atacamanoticias.cl/wp-sitemap.xml` | includeRe | 5.445 | 2 |
| `auroranoticias` | Aurora Noticias | `auroranoticias.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.999 | 2 |
| `basenacional` | Base Nacional | `basenacional.cl/sitemap_index.xml` | articleOnly (Yoast) | 7.223 | 4 |
| `biobiochile` | Radio Bío Bío | `www.biobiochile.cl/robots.txt` | — | 1.170.827 | 18 |
| `canal9` | Canal 9 | `www.canal9.cl/sitemap, www.canal9.cl/sitemap-news` | — | 23.834 | 2 |
| `cclm` | Centro Cultural La Moneda | `cclm.cl/sitemap_index.xml` | articleOnly (Yoast) | 140 | 7 |
| `centralnoticia` | Central Noticia | `www.centralnoticia.cl/sitemap_index.xml` | articleOnly (Yoast) | 18.310 | 2 |
| `centralweb` | Central Web | `centralweb.cl/sitemap_index.xml` | articleOnly (Yoast) | 10.000 | 5 |
| `chanarcillo` | Diario Chañarcillo | `chanarcillo.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `chicureohoy` | Chicureo Hoy | `www.chicureohoy.cl/sitemap.xml` | articleOnly (Yoast) | 7.449 | 2 |
| `chileestuyo` | Chile es Tuyo | `chileestuyo.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.244 | 12 |
| `chilepaisminero` | Chile País Minero | `chilepaisminero.com/sitemap.xml` | — | 3.943 | 4 |
| `chilevision` | Chilevisión | `www.chilevision.cl/robots.txt` | — | 281.444 | 15 |
| `chocale` | Chocale | `chocale.cl/sitemap_index.xml` | articleOnly (Yoast) | 14.253 | 10 |
| `ciper` | CIPER Chile | `www.ciperchile.cl/sitemap_index.xml` | articleOnly (Yoast) | 8.446 | 18 |
| `clave9` | Clave 9 | `clave9.cl/sitemap_index.xml` | articleOnly (Yoast) | 13.101 | 10 |
| `cnnchile` | CNN Chile | `www.cnnchile.com/robots.txt` | — | 227.284 | 16 |
| `colegiocordillera` | Colegio Cordillera | `colegiocordillera.cl/sitemap_index.xml` | articleOnly (Yoast) | 123 | 4 |
| `comunidadmujer` | ComunidadMujer | `comunidadmujer.cl/sitemap_index.xml` | articleOnly (Yoast) | 546 | 5 |
| `consejotransparencia` | Consejo para la Transparencia | `www.consejotransparencia.cl/sitemap_index.xml` | articleOnly (Yoast) | 2.009 | 19 |
| `contapapaya` | Contapapaya | `contapapaya.cl/sitemap_index.xml` | articleOnly (Yoast) | 203 | 1 |
| `contrapoderchile` | Contrapoder Chile | `contrapoderchile.cl/sitemap_index.xml` | articleOnly (Yoast) | 512 | 2 |
| `cooperativa` | Cooperativa | `www.cooperativa.cl/robots.txt` | — | 2.535 | 1 |
| `coquimbonoticias` | Coquimbo Noticias | `www.coquimbonoticias.cl/sitemap.xml` | includeRe | 6.613 | 9 |
| `cruzroja` | Cruz Roja Chile | `cruzroja.cl/sitemap_index.xml` | articleOnly (Yoast) | 994 | 6 |
| `defensorianinez` | Defensoría de la Niñez | `www.defensorianinez.cl/sitemap_index.xml` | articleOnly (Yoast) | 894 | 8 |
| `desenfoque` | Desenfoque | `desenfoque.cl/sitemap_index.xml` | articleOnly (Yoast) | 6.560 | 5 |
| `df` | Diario Financiero | `www.df.cl/noticias/site/sitemap_pags.xml, www.df.cl/noticias/site/sitemap_news.xml, www.df.cl/noticias/site/list/port/sitemap_df.xml` | — | 467 | 2 |
| `diarioangamos` | Diario Angamos | `diarioangamos.com/sitemap.xml` | includeRe | 18.004 | 6 |
| `diarioavisale` | Diario Avísale | `diarioavisale.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `diariocauquenes` | Diario Cauquenes | `diariocauquenes.cl/sitemap_index.xml` | articleOnly (Yoast) | 6.821 | 6 |
| `diarioconcepcion` | Diario Concepción | `www.diarioconcepcion.cl/sitemap.xml, www.diarioconcepcion.cl/sitemap_news.xml` | — | 501 | 1 |
| `diariocurico` | Diario Curicó | `diariocurico.cl/wp-sitemap.xml` | includeRe | 9.564 | 6 |
| `diariodeosorno` | Diario de Osorno | `www.diariodeosorno.cl/sitemap.xml` | includeRe | 6.547 | 2 |
| `diariodevaldivia` | Diario de Valdivia | `www.diariodevaldivia.cl/sitemap.xml` | includeRe | 9.499 | 2 |
| `diarioelcautin` | Diario El Cautín | `diarioelcautin.cl/wp-sitemap.xml` | includeRe | 605 | 1 |
| `diarioelcentro` | Diario El Centro | `www.diarioelcentro.cl/sitemap_index.xml` | articleOnly (Yoast) | 6.543 | 2 |
| `diarioeldia` | Diario El Día | `www.diarioeldia.cl/sitemap.xml` | — | 2.645 | 15 |
| `diarioelgong` | Diario El Gong | `diarioelgong.cl/sitemap_index.xml` | articleOnly (Yoast) | 246 | 6 |
| `diarioelpulso` | Diario El Pulso | `www.diarioelpulso.cl/wp-sitemap.xml` | includeRe | 18.089 | 8 |
| `diarioelranco` | Diario El Ranco | `www.diarioelranco.cl/sitemap.xml` | articleOnly (Yoast) | 42.218 | 18 |
| `diarioestrategia` | Diario Estrategia | `www.diarioestrategia.cl/sitemap/news, www.diarioestrategia.cl/sitemap/lastarticles` | — | 300 | 1 |
| `diariolaunion` | La Unión | `diariolaunion.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `diariolongino` | Diario El Longino | `diariolongino.cl/sitemap_index.xml` | articleOnly (Yoast) | 15.243 | 6 |
| `diarioloslagos` | Diario Los Lagos | `diarioloslagos.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.279 | 2 |
| `diariopuertovaras` | Diario Puerto Varas | `diariopuertovaras.cl/sitemap_index.xml` | articleOnly (Yoast) | 7.623 | 10 |
| `diariotalca` | Diario Talca | `diariotalca.cl/sitemap_index.xml` | articleOnly (Yoast) | 20.421 | 6 |
| `diariousach` | Diario USACH | `www.diariousach.cl/robots.txt` | — | 73 | 1 |
| `dsstgo` | Colegio Alemán de Santiago | `dsstgo.cl/sitemap_index.xml` | articleOnly (Yoast) | 348 | 2 |
| `ecoceanos` | ECOceanos | `www.ecoceanos.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.157 | 12 |
| `economia` | Ministerio de Economía | `www.economia.gob.cl/sitemap_index.xml` | articleOnly (Yoast) | 3.655 | 15 |
| `edicioncero` | Edición Cero | `edicioncero.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `el_periodista` | El Periodista | `www.elperiodista.cl/sitemap_index.xml` | articleOnly (Yoast) | 85.126 | 18 |
| `el_siglo` | El Siglo | `elsiglo.cl/sitemap_index.xml` | articleOnly (Yoast) | 5.429 | 4 |
| `elandacollino` | El Andacollino | `www.elandacollino.cl/wp-sitemap.xml` | includeRe | 1.873 | 7 |
| `elarrebato` | El Arrebato | `elarrebato.cl/sitemap_index.xml` | articleOnly (Yoast) | 268 | 2 |
| `elciudadano` | El Ciudadano | `www.elciudadano.com/sitemap_index.xml` | articleOnly (Yoast) | 304.898 | 22 |
| `elclarin` | El Clarín | `www.elclarin.cl/sitemap_index.xml` | articleOnly (Yoast) | 20.721 | 10 |
| `elcomunicador` | El Comunicador | `elcomunicador.cl/wp-sitemap.xml` | includeRe | 482 | 2 |
| `elcontraste` | El Contraste | `elcontraste.cl/sitemap_index.xml` | articleOnly (Yoast) | 28.976 | 8 |
| `elcoquimbano` | El Coquimbano | `www.elcoquimbano.cl/wp-sitemap.xml` | includeRe | 4.877 | 7 |
| `eldefinido` | El Definido | `eldefinido.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `eldesconcierto` | El Desconcierto | `eldesconcierto.cl/robots.txt` | — | 86 | 1 |
| `eldiariodelaaraucania` | El Diario de La Araucanía | `eldiariodelaaraucania.cl/sitemap_index.xml` | articleOnly (Yoast) | 7.790 | 3 |
| `eldinamo` | El Dínamo | `www.eldinamo.cl/robots.txt` | — | 251.439 | 17 |
| `electromineria` | Electrominería | `electromineria.cl/sitemap_index.xml` | articleOnly (Yoast) | 6.877 | 5 |
| `elgong` | El Gong Araucanía | `elgong.cl/sitemap.xml` | — | 1 | 1 |
| `elinformadorchile` | El Informador Chile | `www.elinformadorchile.cl/sitemap_index.xml` | articleOnly (Yoast) | 642 | 1 |
| `elinsular` | El Insular | `elinsular.cl/sitemap_index.xml` | articleOnly (Yoast) | 13.727 | 7 |
| `ellibero` | El Líbero | `www.ellibero.cl/sitemap_index.xml` | articleOnly (Yoast) | 72.942 | 12 |
| `ellibertario` | El Libertario | `www.ellibertario.cl/sitemap.xml` | — | 26 | 1 |
| `elmagallanico` | El Magallánico | `elmagallanico.com/robots.txt` | — | 18.666 | 11 |
| `elmaipo` | El Maipo | `elmaipo.cl/sitemap_index.xml` | articleOnly (Yoast) | 20.845 | 5 |
| `elmauleinforma` | El Maule Informa | `elmauleinforma.cl/sitemap_index.xml` | articleOnly (Yoast) | 23.293 | 7 |
| `elminuto` | El Minuto | `elminuto.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `elmorrodearica` | El Morro de Arica | `elmorrodearica.cl/sitemap_index.xml` | articleOnly (Yoast) | 4.545 | 7 |
| `elmostrador` | El Mostrador | `www.elmostrador.cl/robots.txt` | — | 297 | 1 |
| `elnoticierodelhuasco` | El Noticiero del Huasco | `elnoticierodelhuasco.cl/wp-sitemap.xml` | includeRe | 26.006 | 17 |
| `elperiodico` | El Periódico | `elperiodico.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.106 | 2 |
| `elperiscopio` | El Periscopio | `www.elperiscopio.cl/sitemap_index.xml` | articleOnly (Yoast) | 11.910 | 3 |
| `elpinguino` | El Pingüino | `elpinguino.com/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `elporteno` | El Porteño | `elporteno.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `elproa` | El Proa | `elproa.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `elquiglobal` | Elqui Global | `elquiglobal.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `elquintopoder` | El Quinto Poder | `www.elquintopoder.cl/sitemap_index.xml` | articleOnly (Yoast) | 17.724 | 15 |
| `elradar` | El Radar | `elradar.cl/sitemap_index.xml` | articleOnly (Yoast) | 445 | 2 |
| `elrancaguino` | El Rancagüino | `elrancaguino.cl/sitemap_index.xml` | articleOnly (Yoast) | 70.106 | 16 |
| `elreporterodeiquique` | El Reportero de Iquique | `elreporterodeiquique.com/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `elserenense` | El Serenense | `elserenense.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `elvicuense` | El Vicuñense | `xn--elvicuense-y9a.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `emol` | Emol | `www.emol.com/robots.txt` | includeRe | 1.111.723 | 27 |
| `enfoquedigital` | Enfoque Digital | `enfoquedigital.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `enfoquedigitalohiggins` | Enfoque Digital O'Higgins | `vi.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `enlalinea` | En La Línea | `enlalinea.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `enlineamaule` | En Línea Maule | `enlineamaule.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `enteratehoy` | Entérate Hoy | `enteratehoy.cl/sitemap_index.xml` | articleOnly (Yoast) | 5.239 | 3 |
| `epicentrochile` | Epicentro Chile | `www.epicentrochile.com/sitemap_index.xml` | articleOnly (Yoast) | 33.882 | 2 |
| `estapasando` | Está Pasando | `estapasando.cl/sitemap_index.xml` | articleOnly (Yoast) | 51.334 | 6 |
| `estrellaiquique` | La Estrella de Iquique | `estrellaiquique.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `ex_ante` | Ex-Ante | `www.ex-ante.cl/sitemap_index.xml` | articleOnly (Yoast) | 18.148 | 7 |
| `factchecking` | Factchecking.cl | `factchecking.cl/sitemap_index.xml` | articleOnly (Yoast) | 14 | 5 |
| `factos` | Factos | `factos.cl/sitemap_index.xml` | articleOnly (Yoast) | 2.437 | 2 |
| `fastcheck` | Fast Check CL | `www.fastcheck.cl/sitemap.xml` | includeRe | 6.142 | 7 |
| `fmcentro` | Radio FM Centro | `fmcentro.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `funcionariopublico` | Funcionario Público | `funcionariopublico.cl/wp-sitemap.xml` | includeRe | 1 | 1 |
| `gob` | Gobierno de Chile | `www.gob.cl/sitemap-articles.xml` | — | 9 | 1 |
| `gobiernoudd` | Gobierno UDD | `gobierno.udd.cl/sitemap_index.xml` | articleOnly (Yoast) | 4.854 | 6 |
| `grange` | The Grange School | `grange.cl/sitemap_index.xml` | articleOnly (Yoast) | 880 | 5 |
| `guiaturismo` | Guía Turismo Chile | `guiaturismo.cl/sitemap_index.xml` | articleOnly (Yoast) | 38 | 2 |
| `hdn` | HDN | `hdn.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `horadenoticias` | Hora de Noticias | `horadenoticias.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `iconstruccion` | Instituto de la Construcción | `iconstruccion.cl/sitemap_index.xml` | articleOnly (Yoast) | 354 | 6 |
| `infodefensa` | Infodefensa | `www.infodefensa.com/sitemap/lastarticles` | — | 100 | 1 |
| `infogate` | Infogate | `www.infogate.cl/sitemap.xml` | includeRe | 10.445 | 1 |
| `informaalminuto` | Informa Al Minuto | `informaalminuto.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `infotarapaca` | Info Tarapacá | `infotarapaca.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `iquiquetv` | Iquique TV | `iquiquetv.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `junji` | JUNJI | `junji.cl/sitemap_index.xml` | articleOnly (Yoast) | 4.723 | 11 |
| `la_hora` | La Hora | `lahora.cl/sitemap.xml` | includeRe | 44.283 | 3 |
| `la_nacion` | La Nación | `www.lanacion.cl/sitemap_index.xml` | articleOnly (Yoast) | 19.866 | 7 |
| `lacuarta` | La Cuarta | `www.lacuarta.com/arc/outboundfeeds/sitemap-index/?outputType=xml` | — | 9.787 | 1 |
| `lafontana` | La Fontana | `lafontana.cl/sitemap_index.xml` | articleOnly (Yoast) | 6.482 | 7 |
| `laizquierdadiario` | La Izquierda Diario | `www.laizquierdadiario.cl/sitemap.xml` | — | 578 | 2 |
| `lakalle` | La Kalle | `lakalle.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `lamaquinamedio` | La Máquina Medio | `lamaquinamedio.com/sitemap_index.xml` | articleOnly (Yoast) | 4.032 | 8 |
| `lamegafm` | La Mega FM | `lamegafm.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `lamorada` | Corporación La Morada | `lamorada.cl/sitemap_index.xml` | articleOnly (Yoast) | 999 | 5 |
| `laopiniondechiloe` | La Opinión de Chiloé | `www.laopiniondechiloe.cl/sitemap_index.xml` | articleOnly (Yoast) | 5.848 | 12 |
| `laperladellimari` | La Perla del Limarí | `laperladellimari.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `laprensaaustral` | La Prensa Austral | `laprensaaustral.cl/wp-sitemap.xml` | includeRe | 67.439 | 7 |
| `laprensadiariolaprensa` | La Prensa | `new.diariolaprensa.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `laserenaonline` | La Serena Online | `laserenaonline.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `lasnoticiasdemalleco` | Las Noticias de Malleco | `lasnoticiasdemalleco.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `latendencia` | La Tendencia | `latendencia.cl/sitemap_index.xml` | articleOnly (Yoast) | 818 | 3 |
| `latercera` | La Tercera | `www.latercera.com/robots.txt` | — | 12.287 | 1 |
| `lavozdelosquesobran` | La Voz de los que Sobran | `www.lavozdelosquesobran.cl/sitemap_index.xml` | articleOnly (Yoast) | 12.113 | 7 |
| `legadochile` | Fundación Legado Chile | `legadochile.cl/sitemap_index.xml` | articleOnly (Yoast) | 217 | 6 |
| `liceodeaplicacion` | Liceo de Aplicación | `liceodeaplicacion.cl/sitemap_index.xml` | articleOnly (Yoast) | 97 | 3 |
| `losabogadoslaborales` | Los Abogados Laborales | `losabogadoslaborales.cl/sitemap_index.xml` | articleOnly (Yoast) | 72 | 2 |
| `losriosnoticias` | Los Ríos Noticias | `losriosnoticias.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `magiadigital` | Magia Digital | `magiadigital.cl/sitemap_index.xml` | articleOnly (Yoast) | 946 | 5 |
| `malaespina` | Mala Espina | `malaespinacheck.cl/sitemap_index.xml` | articleOnly (Yoast) | 7.473 | 7 |
| `malleco7` | Malleco 7 | `malleco7.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `maray` | Radio Maray | `www.maray.cl/sitemap_index.xml` | articleOnly (Yoast) | 16.822 | 3 |
| `margamargatv` | Margamarga TV | `margamargatv.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `masnoticia` | Más Noticia | `masnoticia.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `maulehoy` | Maule Hoy | `maulehoy.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `meganoticias` | Meganoticias | `www.meganoticias.cl/robots.txt` | includeRe | 434.110 | 16 |
| `mestizos` | Mestizos Magazine | `www.mestizos.cl/sitemap.xml` | — | 8.638 | 9 |
| `minrel` | Ministerio de Relaciones Exteriores | `minrel.gob.cl/minrel/site/sitemap_pags.xml` | — | 4.977 | 2 |
| `miradasurtv` | Mirada Sur TV | `miradasurtv.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `miradiols` | Mi Radio LS | `www.miradiols.cl/sitemap_index.xml` | articleOnly (Yoast) | 40.063 | 9 |
| `mma` | Ministerio del Medio Ambiente | `mma.gob.cl/wp-sitemap.xml` | includeRe | 9.225 | 10 |
| `mtraiguen` | Municipalidad de Traiguén | `mtraiguen.cl/sitemap_index.xml` | articleOnly (Yoast) | 424 | 8 |
| `mtt` | Ministerio de Transportes y Telecomunicaciones | `mtt.gob.cl/sitemap_index.xml` | articleOnly (Yoast) | 2.549 | 2 |
| `munialtobiobio` | Municipalidad de Alto Biobío | `munialtobiobio.cl/sitemap_index.xml` | articleOnly (Yoast) | 483 | 3 |
| `museovioletaparra` | Museo Violeta Parra | `museovioletaparra.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.564 | 12 |
| `musicaynoticias` | Música y Noticias | `musicaynoticias.cl/sitemap_index.xml` | articleOnly (Yoast) | 11.933 | 3 |
| `nacimentano` | Nacimentano | `nacimentano.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `norteonline` | Norte Online | `norteonline.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `noticiasbiobio` | Noticias Biobío | `noticiasbiobio.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `noticiaschiloe` | Noticias Chiloé | `noticiaschiloe.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `noticiasdellago` | Noticias del Lago | `noticiasdellago.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `noticiasdelsur` | Noticias del Sur | `noticiasdelsur.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `novenadigital` | Novena Digital | `novenadigital.cl/wp-sitemap.xml` | includeRe | 10.673 | 6 |
| `nubleactual` | Ñuble Actual | `www.nubleactual.cl/wp-sitemap.xml` | includeRe | 13.257 | 4 |
| `nubledigital` | Ñuble Digital | `nubledigital.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `nubleonline` | Ñuble Online | `nubleonline.cl/sitemap_index.xml` | articleOnly (Yoast) | 2.730 | 2 |
| `nuevopoder` | Nuevo Poder | `www.nuevopoder.cl/sitemap_index.xml` | articleOnly (Yoast) | 56.258 | 5 |
| `observador` | El Observador | `observador.cl/sitemap_index.xml` | articleOnly (Yoast) | 38.528 | 10 |
| `observatoriomedicina` | Observatorio Medicina UC | `observatorio.medicina.uc.cl/sitemap_index.xml` | articleOnly (Yoast) | 530 | 9 |
| `oceana` | Oceana Chile | `oceana.org/sitemap_index.xml` | articleOnly (Yoast) | 908 | 17 |
| `ovallehoy` | Ovalle Hoy | `ovallehoy.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `ovejeronoticias` | Ovejero Noticias | `ovejeronoticias.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `pagina19` | Página 19 | `pagina19.cl/sitemap_index.xml` | articleOnly (Yoast) | 6.610 | 9 |
| `paislobo` | País Lobo | `paislobo.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `panoramanoticioso` | Panorama Noticioso | `panoramanoticioso.cl/sitemap_index.xml` | articleOnly (Yoast) | 2.386 | 1 |
| `pichilemunews` | Pichilemu News | `pichilemunews.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `piensachile` | Piensa Chile | `piensachile.com/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `portalfruticola` | Portal Frutícola | `www.portalfruticola.com/sitemap_index.xml` | articleOnly (Yoast) | 29.933 | 3 |
| `portalinformativo` | Portal Informativo | `portalinformativo.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `portalmetropolitano` | Portal Metropolitano | `portalmetropolitano.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `portalminero` | Portal Minero | `www.portalminero.com/sitemap.xml` | — | 32.878 | 15 |
| `portalportuario` | PortalPortuario | `portalportuario.cl/sitemap_index.xml` | articleOnly (Yoast) | 105.229 | 12 |
| `portalredsalud` | Portal RedSalud | `portalredsalud.cl/sitemap_index.xml` | articleOnly (Yoast) | 12.051 | 11 |
| `prensaciudadana` | Prensa Ciudadana | `prensaciudadana.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `publimetro` | Publimetro | `www.publimetro.cl/arc/outboundfeeds/sitemap-index/?outputType=xml` | — | 193 | 1 |
| `publimicro` | Publimicro | `publimicro.cl/sitemap_index.xml` | articleOnly (Yoast) | 10.293 | 2 |
| `pucv` | Pontificia Universidad Católica de Valparaíso | `www.pucv.cl/pucv/site/sitemap_pags.xml` | — | 14.607 | 5 |
| `pulsopublico` | Pulso Público | `www.pulsopublico.cl/sitemap_index.xml` | articleOnly (Yoast) | 745 | 2 |
| `queilen` | Queilen | `queilen.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `quepasaaraucania` | Qué Pasa Araucanía | `quepasaaraucania.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.270 | 3 |
| `quintero` | Quintero | `quintero.cl/sitemap_index.xml` | articleOnly (Yoast) | 30 | 1 |
| `quirihue_noticias` | Quirihue Noticias | `quirihuenoticias.cl/sitemap_index.xml` | articleOnly (Yoast) | 5.721 | 6 |
| `radio_uchile` | Radio Universidad de Chile | `radio.uchile.cl/sitemap_index.xml` | articleOnly (Yoast) | 108.135 | 18 |
| `radioagricultura` | Radio Agricultura | `www.radioagricultura.cl/robots.txt` | — | 299.064 | 12 |
| `radiochilena` | Radio Chilena | `radiochilena.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `radiointeramericana` | Radio Interamericana | `radiointeramericana.cl/wp-sitemap.xml` | includeRe | 847 | 1 |
| `radiolasenal` | Radio La Señal | `radiolasenal.cl/sitemap_index.xml` | articleOnly (Yoast) | 974 | 2 |
| `radiomagallanes` | Radio Magallanes | `radiomagallanes.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `radiomaria` | Radio María Chile | `radiomaria.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `radiomodelo` | Radio Modelo | `radiomodelo.cl/sitemap_index.xml` | articleOnly (Yoast) | 966 | 1 |
| `radionuevomundo` | Radio Nuevo Mundo | `radionuevomundo.cl/sitemap_index.xml` | articleOnly (Yoast) | 14.329 | 9 |
| `radiopaulina` | Radio Paulina | `radiopaulina.cl/sitemap.xml` | includeRe | 9.555 | 2 |
| `radiopuertanorte` | Radio Puerta Norte | `radiopuertanorte.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `radioriquelme` | Radio Riquelme | `radioriquelme.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `radiosantamaria` | Radio Santa María | `www.radiosantamaria.cl/sitemap_index.xml` | articleOnly (Yoast) | 6.884 | 9 |
| `radioudec` | Radio UdeC | `www.radioudec.cl/sitemap_index.xml` | articleOnly (Yoast) | 10.993 | 7 |
| `radioventisqueros` | Radio Ventisqueros | `radioventisqueros.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `redimin` | REDIMIN | `www.redimin.cl/sitemap_index.xml` | articleOnly (Yoast) | 48.249 | 8 |
| `redsalud` | RedSalud | `www.redsalud.cl/sitemap.xml` | — | 388 | 1 |
| `regionalista` | Regionalista | `regionalista.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `reportea` | Reportea | `reportea.cl/sitemap_index.xml` | articleOnly (Yoast) | 117 | 2 |
| `reporteagricola` | Reporte Agrícola | `www.reporteagricola.cl/sitemap.xml` | — | 5.277 | 3 |
| `resonanciadiario` | Resonancia Diario | `www.resonanciadiario.cl/sitemap_index.xml` | articleOnly (Yoast) | 1.144 | 3 |
| `rewildingchile` | Fundación Rewilding Chile | `rewildingchile.org/sitemap_index.xml` | articleOnly (Yoast) | 306 | 6 |
| `rioenlinea` | Río en Línea | `rioenlinea.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `sabes` | Sabes.cl | `sabes.cl/sitemap.xml` | includeRe | 17.969 | 2 |
| `saintgeorge` | Saint George's College | `saintgeorge.cl/sitemap_index.xml` | articleOnly (Yoast) | 1 | 1 |
| `saladeprensa` | Sala de Prensa | `www.saladeprensa.cl/sitemap_index.xml` | articleOnly (Yoast) | 3.488 | 4 |
| `sancarlosonline` | San Carlos On Line | `sancarlosonline.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `sanignacio` | Colegio San Ignacio | `sanignacio.cl/sitemap_index.xml` | articleOnly (Yoast) | 2.663 | 10 |
| `santiagotimes` | Santiago Times | `santiagotimes.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `senado` | Senado de Chile | `www.senado.cl/sitemap.xml` | — | 17.355 | 3 |
| `senapred` | SENAPRED | `www.senapred.cl/post-sitemap.xml` | — | 359 | 1 |
| `seranoticia` | Sera Noticia | `seranoticia.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `serenaycoquimbo` | Serena y Coquimbo | `serenaycoquimbo.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `sip` | SIP Red de Colegios | `sip.cl/sitemap_index.xml` | articleOnly (Yoast) | 750 | 5 |
| `sitiodelsuceso` | Sitio del Suceso | `sitiodelsuceso.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `soched` | SOCHED | `soched.cl/sitemap_index.xml` | articleOnly (Yoast) | 397 | 10 |
| `sofofa` | SOFOFA | `www.sofofa.cl/wp-sitemap.xml` | includeRe | 788 | 9 |
| `somoschile` | Somos Chile | `www.somoschile.cl/sitemap.xml` | — | 17.544 | 12 |
| `tabancura` | Colegio Tabancura | `tabancura.cl/sitemap_index.xml` | articleOnly (Yoast) | 160 | 4 |
| `tarapacaonline` | Tarapacá Online | `tarapacaonline.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `temucodiario` | Temuco Diario | `temucodiario.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `theclinic` | The Clinic | `www.theclinic.cl/sitemap_index.xml` | articleOnly (Yoast) | 192.206 | 19 |
| `tiempo21` | Tiempo 21 | `tiempo21.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `tierramarillano` | Tierramarillano | `tierramarillano.cl/wp-sitemap.xml` | includeRe | 52.215 | 10 |
| `tomealdia` | Tomé al Día | `tomealdia.com/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `traiguencity` | Traiguén City | `traiguencity.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `tuki` | Tuki | `tuki.cl/sitemap.xml` | — | 840 | 1 |
| `uai` | Universidad Adolfo Ibáñez | `www.uai.cl/sitemap.xml` | — | 15.656 | 9 |
| `ulagos` | Universidad de los Lagos | `www.ulagos.cl/wp-sitemap.xml` | includeRe | 6.669 | 10 |
| `umayor` | Universidad Mayor | `www.umayor.cl/sitemap.xml` | — | 1.350 | 3 |
| `uruguay` | Uruguay | `uruguay.cl/sitemap_index.xml` | articleOnly (Yoast) | 8 | 1 |
| `usm` | Universidad Técnica Federico Santa María | `usm.cl/sitemap_index.xml` | articleOnly (Yoast) | 5 | 2 |
| `uteusachnoticias` | UTE USACH Noticias | `corporacionuteusach-noticias.cl/sitemap_index.xml` | articleOnly (Yoast) | 5.849 | 7 |
| `vallenardigital` | Vallenar Digital | `vallenardigital.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `valparaisonoticias` | Valparaíso Noticias | `www.valparaisonoticias.cl/sitemap.xml` | — | 5.690 | 9 |
| `vergara240` | Vergara 240 | `vergara240.udp.cl/sitemap_index.xml` | articleOnly (Yoast) | 662 | 5 |
| `vilasradio` | Vilas Radio | `vilasradio.cl/wp-sitemap.xml` | includeRe | 15.178 | 2 |
| `villarricaldia` | Villarrica al Día | `villarricaldia.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `vivimoslanoticia` | Vivimos la Noticia | `vivimoslanoticia.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `vlnradio` | VLN Radio | `www.vlnradio.cl/sitemap.xml` | includeRe | 11.084 | 2 |
| `vozdeamerica` | Voz de América | `vozdeamerica.com/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `xox` | XOX.cl | `xox.cl/sitemap_index.xml` | articleOnly (Yoast) | — | — |
| `zonazero` | Zona Zero | `www.zonazero.cl/sitemap.xml` | — | 1.005 | 1 |

Nota: los JSONL no se commitean (regenerables); el estado vive en `_manifest.json`.

<!-- /AUTO-GENERATED-SITEMAPS-MEDIOS -->

<!-- AUTO-GENERATED-STATS -->

## Estadísticas del vault

> Esta sección se genera automáticamente con `pnpm run generate-index`

**Total de eventos:** 1144

**Cobertura de fuentes:** 683 de 1144 eventos con 3+ fuentes (461 requieren más fuentes para reducir sesgo)

**Eventos por año:**
- 2026: 871
- 2025: 61
- 2024: 34
- 2023: 26
- 2022: 23
- 2021: 19
- 2020: 36
- 2019: 35
- 2018: 3
- 2017: 2
- 2016: 2
- 2015: 6
- 2014: 5
- 2013: 2
- 2012: 2
- 2011: 2
- 2010: 7
- 2009: 6
- 2003: 1
- 1973: 1

**Temas más frecuentes (Top 10):**
- Politica (464)
- Justicia (326)
- Economia (230)
- Defensa y seguridad (215)
- Administración pública (175)
- Derechos humanos (141)
- Proceso legislativo (101)
- Corrupción (94)
- Finanzas publicas (92)
- Relaciones internacionales (78)

**Tipos de eventos más frecuentes (Top 10):**
- accion (235)
- investigacion (146)
- declaracion (135)
- reaccion (128)
- publicacion (126)
- resultado (116)
- fallo_judicial (83)
- anuncio (74)
- votacion (29)
- entrevista (22)

**Entidades registradas:**
- Personas: 2018
- Organizaciones: 1011
- Cifras: 1017
- Fuentes: 4135
- Temas: 75
