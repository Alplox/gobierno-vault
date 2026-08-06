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
  usar `astro:page-load` si el código depende del DOM intercambiado.

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

- Fuentes se numeran secuencialmente por primera aparicion en el doc.
- Misma fuente reutiliza su numero en todas sus repeticiones.
- `[[source/...]]` genera anchor a `#ref-N` en la seccion de Referencias.

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
- Flags: `--append` (agrega el bloque directo al final de `sources.yaml`), `--mirror` (fuerza espejo).
- Siempre imprime la URL del articulo original (nunca el mirror), y avisa si el ID ya existe.

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


<!-- AUTO-GENERATED-STATS -->

## Estadísticas del vault

> Esta sección se genera automáticamente con `pnpm run generate-index`

**Total de eventos:** 492

**Eventos por año:**
- 2026: 406
- 2025: 30
- 2024: 11
- 2023: 9
- 2022: 13
- 2021: 7
- 2020: 7
- 2019: 4
- 2018: 2
- 2015: 2
- 1973: 1

**Temas más frecuentes (Top 10):**
- Politica (189)
- Economia (92)
- Justicia (61)
- Administración pública (54)
- Cambios en el gabinete (53)
- Emergencia y catástrofes (50)
- Proceso legislativo (47)
- Finanzas publicas (47)
- Defensa y seguridad (45)
- Relaciones internacionales (44)

**Tipos de eventos más frecuentes (Top 10):**
- accion (122)
- declaracion (76)
- reaccion (58)
- resultado (51)
- publicacion (41)
- anuncio (40)
- investigacion (37)
- votacion (14)
- fallo_judicial (14)
- proyecto (12)

**Entidades registradas:**
- Personas: 564
- Organizaciones: 308
- Cifras: 342
- Fuentes: 1572
- Temas: 74
