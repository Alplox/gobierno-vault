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

### Donde viven las entidades

| Entidad | Fuente | Se accede via |
|---|---|---|
| Personas | `entities.yaml` > `people` | `getPeopleRegistry()` |
| Organizaciones | `entities.yaml` > `organizations` | `getOrgsRegistry()` |
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

## Reglas al modificar datos YAML

- `entities.yaml`: agregar persona/org/cifra nueva en su seccion correspondiente.
- `sources.yaml`: formato `id-slug: { tipo, medio, titulo, autor, fecha, url }`.
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
| `elclarin` | El Clarín | `www.elclarin.cl/sitemap_index.xml` | articleOnly (Yoast) | 20.683 | 10 |
| `eldinamo` | El Dínamo | `www.eldinamo.cl/robots.txt` | — | 250.948 | 17 |
| `elmostrador` | El Mostrador | `www.elmostrador.cl/robots.txt` | — | 101 | 1 |
| `factchecking` | Factchecking.cl | `factchecking.cl/sitemap_index.xml` | articleOnly (Yoast) | 14 | 5 |
| `fastcheck` | Fast Check CL | `www.fastcheck.cl/sitemap.xml` | includeRe | 5.815 | 7 |
| `latercera` | La Tercera | `www.latercera.com/robots.txt` | — | 8.421 | 1 |
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

| `pnpm run sitemaps-backup` | empaqueta `sitemaps/` en `sitemaps/sitemaps.gvault`. **Compacto lossless por defecto** (`--compact`): los JSONL se transforman a un formato tab-separado que omite dominio (1× por archivo) y títulos derivables del slug; el restore reconstruye el JSONL byte-idéntico (verificado por SHA-256). **Contenedor binario por defecto** (`--bin`): payload Brotli como bytes crudos (~25% menos que base64; `--text` para el formato v1 legible). **`--chunk-size <MB>`**: parte el snapshot en `<out>.part1, .part2…` (~28MB c/u con `45`; bajo el límite de 50MB de GitHub); `meta.chunks` indica el total. `--restore [src]` auto-detecta y une las partes; `--join [src]` arma el .gvault único. Resultado: ~56MB (vs ~357MB raw / 127MB v1). `--no-compact` guarda JSONL crudo |

Detalle de merge: el dedupe del run (`seen`) NO bloquea el upgrade de títulos entre sub-sitemaps
— si una URL aparece primero sin título y luego con título real (caso El Mostrador), la segunda
pasada mejora la entrada (`news` > `slug`).

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
  `ciper`, `theclinic`, `elmostrador`, `fastcheck`, `latercera`, `cnnchile`, `eldinamo`.
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
  `adnradio`, `ciper`, `factchecking`, `fastcheck`. (Los JSONL no se commitean; regenerar con
  `pnpm run sitemaps-sync -- <medio>` si el repo se clona.)

## Respaldo / Restauracion (backup offline publico)

El repo puede morir por el contenido sensible (politica/corrupcion), por eso se genera un
respaldo offline publico (SIN contraseña) que cualquiera pueda custodiar. Son archivos
`.gvault`: Brotli (integrado en Node, mejor ratio que gzip para texto) + checksums
SHA-256 (integridad verificable sin secretos) + manifest por archivo. No requiere
dependencias nuevas.

Scripts (ver `scripts/gvault-util.mjs` para el formato compartido):
- `pnpm run backup` — genera DOS archivos en la raiz: `.light.gvault` (solo contenido
  actual: `src/**` + docs raiz + config, sin `dist/`, `node_modules/`, `.astro/`, `.git/`)
  y `.full.gvault` (lo anterior + `git bundle --all` con historial completo).
- `pnpm run verify -- <archivo.gvault>` — comprueba integridad (uso publico).
- `pnpm run restore -- <archivo.gvault> [--dest <ruta>]` — extrae los archivos; si es
  `.full` tambien extrae `git-history.bundle` para `git clone`.
- Flags de backup: `--shallow` (solo `src/content`+`src/data`), `--no-full`, `--no-light`,
  `--out <prefijo>`.

Convenciones:
- Los `.gvault` se COMMITEAN al repo (no estan en `.gitignore`): quedan descargables por cualquiera
  desde GitHub con un solo clic. Al generar respaldo nuevo, agrega ambos archivos y commitea.
- Ademas, se recomienda que quien descargue una copia la guarde FUERA del repo (USB, Drive, otras
  personas), para que sobreviva aunque el repo/plataforma desaparezca.
- No incluyen password/cifrado a proposito (custodia publica); la integridad la dan los hashes
  SHA-256, no el secreto. Al ser contenido sin cifrar, es tan sensible como el propio repo:
  protegelo igual (mismo contenido que el vault).
- El `.full.gvault` crece con cada commit (incluye el historial); si el repo se hace muy grande,
  se puede commitecar solo el `.light` generando el `.full` bajo demanda.

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
| Wikilink roto | `remarkWikiLinks.mjs` (resolve fallback) |
| Scripts de sitemaps | `scripts/sync-sitemaps.mjs`, `scripts/sitemaps-index.mjs`, `scripts/sitemaps-backup.mjs`, sección "Catálogo de sitemaps" de este archivo |


<!-- AUTO-GENERATED-STATS -->

## Estadísticas del vault

> Esta sección se genera automáticamente con `pnpm run generate-index`

**Total de eventos:** 638

**Cobertura de fuentes:** 355 de 638 eventos con 3+ fuentes (283 requieren más fuentes para reducir sesgo)

**Eventos por año:**
- 2026: 509
- 2025: 36
- 2024: 14
- 2023: 12
- 2022: 14
- 2021: 8
- 2020: 15
- 2019: 13
- 2018: 3
- 2015: 5
- 2014: 1
- 2012: 1
- 2010: 3
- 2009: 3
- 1973: 1

**Temas más frecuentes (Top 10):**
- Politica (243)
- Justicia (125)
- Economia (116)
- Defensa y seguridad (83)
- Administración pública (75)
- Derechos humanos (61)
- Proceso legislativo (57)
- Cambios en el gabinete (56)
- Emergencia y catástrofes (54)
- Finanzas publicas (54)

**Tipos de eventos más frecuentes (Top 10):**
- accion (149)
- declaracion (88)
- reaccion (84)
- publicacion (65)
- resultado (65)
- investigacion (57)
- anuncio (47)
- fallo_judicial (26)
- votacion (14)
- proyecto (14)

**Entidades registradas:**
- Personas: 731
- Organizaciones: 393
- Cifras: 445
- Fuentes: 2047
- Temas: 74
