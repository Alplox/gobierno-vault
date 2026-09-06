# Gobierno Vault

Base de conocimiento estática sobre eventos de gobierno en Chile. Astro 7 + Tailwind, salida `static` (SSG). Eventos en Markdown con frontmatter YAML, fuentes verificables y wikilinks para personas, organizaciones, cifras y referencias.

## Sitio

- <https://gobierno-vault.pages.dev/>

## Notas

- Sitio aún esta en desarrollo. Lo que implica constantes cambios, evolución y correcciones (o dejar abandonado).
- Sitio esta de momento con una carga fuerte en cuanto a lo que tacharia de *recency bias*. Idea es con el tiempo nivelar esto con `TAREAS/` y `EVENTS_INDEX.md` para que no sea asi.
- Se usa LLM para investigación/redacción, pero el formato Markdown/YAML es editable a mano.
- Para contribuir, ver `AGENTS.md` (guía para agentes/humanos) y `.agents/skills/content-model/SKILL.md#plantilla-copiable` (plantilla copiable). Reporta fallas o sesgo vía issue/PR.
- <https://xkcd.com/927/>
- Sitio web es eso, un sitio web. No una fuente de la verdad. Se RECOMIENDA siempre usar multiples fuentes respecto a eventos catalogados como noticias para asi obtener multiples puntos de vista/información.

## Características

- SSG Astro con `ClientRouter`, prefetch y transiciones.
- Contenido en `src/content/events/YYYY/MM/YYYYMMDD-N.md` con validación de frontmatter y wikilinks.
- Contenido en `src/content/people|organizations|topics|sources|cifras/*.md` (markdown puro, Obsidian, sin YAML monolito) + `src/data/` solo `colectivos.yaml`/`sectores.yaml`/`sueldos.yaml`.
- Wikilinks `[[people/id]]` `[[organizations/id]]` `[[sources/id]]` `[[cifras/...]]` `[[events/...]]` con plugin `remarkWikiLinks`.
- Timeline lazy, rail temporal, grafo de relaciones y TTS (Piper) en cliente.
- Catálogo local de prensa en `sitemaps/` (JSONL por medio/año, no commiteado) para búsquedas sin tocar la red.

## Estructura principal

- `src/content/events/` — eventos por año/mes.
- `src/content/people|organizations|topics|sources|cifras/*.md` — personas, orgs, temas, fuentes, cifras (markdown, 9046 archivos).
- `src/data/` — `colectivos.yaml`, `sectores.yaml`, `sueldos.yaml` (pequeños, no monolito).
- `src/lib/` — `registry.ts`, `queries.ts`, `extractEntities.ts`, `remarkWikiLinks.mjs`, `cabinet.ts`, etc.
- `src/components/` / `src/pages/` / `src/layouts/` — UI y rutas (`/`, `/events`, `/people`, `/gabinete`, `/sueldos`, `/llm.txt`).
- `.agents/skills/*/SKILL.md` — guías modulares por dominio (contenido, reglas, frontend, datos, build, gabinete, sitemaps, fuentes gubernamentales, redes, backup, tools).
- `sitemaps/` — `*.jsonl` (gitignored), `.cache/` (XML), `_manifest.json`, `README.md`, `MEDIOS.md`.
- `scripts/` — `validate/validate.mjs` + `generate/` + `sitemaps/sync.mjs` + `extract/add-source.mjs` + `backup/backup.mjs` + `lib/` (ver `scripts/README.md`).
- `TAREAS/` — pendientes `PENDIENTES/YYYY.md` + `SEGUIMIENTO/YYYY.md` y `SEGUIMIENTO_INDEX.md` (anti recency bias).

## Comandos útiles

Usa **pnpm** (no npm). `pnpm install` primero.

- `pnpm run dev` — servidor de desarrollo.
- `pnpm run build` — `validate` + build estático (~1m40s).
- `pnpm run preview` — `wrangler pages dev dist`.
- `pnpm run deploy` — build local + `wrangler pages deploy dist --project-name gobierno-vault`.
- `pnpm run validate` — valida wikilinks, `medio`, mojibake/BOM y prose (falla antes del build).
- `pnpm run generate-index` — regenera `EVENTS_INDEX.md` + `README.md` › Estadísticas del vault.
- `pnpm run add-source -- <URL>` — genera `src/content/sources/<id>.md` (flags: `--append` crea `.md` sin colisión, `--catalog-only`, `--search <texto>` con `--medio`/`--fecha`).
- `pnpm run sitemaps-sync -- <medio>` — sincroniza catálogo desde sitemaps públicos.
- `pnpm run sitemaps-resync` — merge incremental diario + regenera índice y backup.
- `pnpm run sitemaps-index` — regenera `sitemaps/README.md` + `sitemaps/MEDIOS.md` (tablas para editores).
- `pnpm run sitemaps-backup` — empaqueta `sitemaps/sitemaps.gvault` (compacto lossless + Brotli, ~357MB → ~56MB; `--chunk-size 45` parte en `part1/2`).
- `pnpm run backup` — respaldo `.light.gvault` en `public/backup/` (commiteado).
- `pnpm run verify -- <archivo.gvault>` / `pnpm run restore -- <archivo.gvault> --dest <ruta>` — verifica/restaura.
- `node scripts/validate/validate-fuentes.mjs` — valida URLs de `.agents/skills/fuentes-gubernamentales/SKILL.md`.
- `pnpm run fetch-content -- <URL>` — cadena de mirrors (`r.jina` → `defuddle` → `paywallskip` → `archive` → `fetch-impersonate`).

## Ayudar con los respaldos (sin ser técnico)

El repo registra política/corrupción y podría desaparecer. El respaldo público `.gvault` en `public/backup/` (servido en `/backup/`) permite que sobreviva. **Ayuda guardando una copia.**

### ¿Qué son los `.gvault`?

Fotografías comprimidas (Brotli + SHA-256) del proyecto: `gob-vault-backup-...light.gvault` (contenido actual). Sin contraseña, públicos.

### Cómo ayudar (3 pasos)

1. **Descarga** desde `public/backup/` o footer del sitio (botón “Descargar respaldo”).
2. **Guarda** fuera de GitHub: USB, Drive, correo a ti mismo u otra persona.
3. (Opcional) **Verifica** con Node.js:

```javascript
node -e "const{readFileSync}=require('fs'),{createHash}=require('crypto'),{brotliDecompressSync}=require('zlib');const t=readFileSync(process.argv[1],'utf8'),a=t.lastIndexOf('===METADATA==='),n1=t.indexOf('\n',a),n2=t.indexOf('\n',n1+1),m=JSON.parse(t.slice(n1+1,n2)),c=Buffer.from(t.slice(n2+1),'base64');if(createHash('sha256').update(c).digest('hex')!==m.sha256){console.error('CORRUPTO');process.exit(1)}console.log('OK, integro:',m.kind,m.fileCount,'archivos')" nombre.gvault
```

`OK, integro` = bien; `CORRUPTO` = descarta y re-descarga. El `.gvault` trae estas instrucciones dentro.

## Convenciones de contenido

- Frontmatter con `titulo`, `fecha` (ISO 8601 UTC), `tipo` (14 valores), `tema` (IDs de `src/content/topics/*.md`), `creado`/`actualizado` (YYYY-MM-DD); opcionales `etiquetas`, `impacto`, `relaciones`, `svg_backup`.
- `tema` usa IDs de `src/content/topics/*.md`; `impacto` usa IDs de `src/data/colectivos.yaml`/`sectores.yaml` (excepción YAML).
- Fuentes inline `[[sources/id]]` al final de la afirmación, nunca en `## Referencias`.
- Personas/orgs/cifras/eventos con wikilinks; IDs desnudos `20260618-3` auto-enlazan.
- Prioriza fuente gubernamental directa (ver `.agents/skills/fuentes-gubernamentales/SKILL.md`) antes que prensa.

Ver `.agents/skills/content-model/SKILL.md#plantilla-copiable` (plantilla copiable) + `event-rules/SKILL.md` para detalle.

## Datos y entidades

- `src/content/people/*.md` — personas (`nombre`, `cargo`, `cargos[]`).
- `src/content/organizations/*.md` — organizaciones (`nombre`, `tipo`).
- `src/content/cifras/*.md` — cifras (`nombre`, `unidad_default`).
- `src/content/sources/*.md` — fuentes (`medio-YYYY-MM-DD-slug`, URL completa, `medio` exacto).
- `src/content/topics/*.md` — taxonomía de temas.
- `colectivos.yaml` / `sectores.yaml` — arrays planos.
- `sueldos.yaml` — montos y series de `/sueldos` sin hardcodear (resueltas vía `getPeopleRegistry`/`getSourcesRegistry`).

## Skills para agentes

`AGENTS.md` es el router liviano (≤300 líneas). El detalle vive en `.agents/skills/*/SKILL.md` y se carga bajo demanda:

- `content-model` — frontmatter/wikilinks/`svg_backup`/cifras en disputa/votaciones
- `event-rules` — 16 reglas, enforcement prose, ciclo `TAREAS`
- `frontend` — View Transitions, TimelineNav, grafo, filtros, TTS, Tailwind
- `data-yaml` — YAML, encoding, `WHITELIST_MEDIOS`
- `build-deploy` — build, validate, pnpm, wrangler
- `gabinete` — `cargos[]`, `cabinet.ts`, Cuentas Públicas `YYYY0601-1`
- `sitemaps` — catálogo, `rg -uu`, `MEDIA`, `sync/index/backup`
- `fuentes-gubernamentales` — Presidencia/ministerios/BCN/Cámara/Senado (anti-sesgo)
- `social-media` — Reddit/X/FB/IG/TikTok/YT + verificación imagen viral
- `backup` — `.gvault` público
- `tools` — mirrors, `fetch-content`/`fetch-impersonate`, PDF/Office/OCR, video, `rg`

Cada skill se auto-actualiza: si tocas su dominio, actualízala en la misma PR (ver `AGENTS.md`).

## Contribuir

1. Revisa `AGENTS.md` y `.agents/skills/content-model/SKILL.md#plantilla-copiable`.
2. Crea `src/content/events/YYYY/MM/YYYYMMDD-N.md` (N secuencial) copiando plantilla de `content-model`.
3. Agrega entidades/fuentes/temas en `src/content/people|organizations|cifras|topics|sources/*.md` o `src/data/colectivos.yaml|sectores.yaml` si faltan.
4. Consulta `sitemaps/MEDIOS.md` y `rg -uu` antes de buscar en web; prioriza fuente oficial.
5. Ejecuta `pnpm run validate` y `pnpm run build` antes de PR.

## Recursos adicionales

- `.agents/skills/content-model/SKILL.md#plantilla-copiable` — plantilla copiable de evento.
- `AGENTS.md` — flujo interno y reglas.
- `EVENTS_INDEX.md` — índice auto-generado (y `README.md` › Estadísticas del vault).
- `.agents/skills/` — guías modulares.
- `sitemaps/README.md` / `MEDIOS.md` — catálogo para editores.

<!-- AUTO-GENERATED:ESTADISTICAS:START -->
## Estadísticas del vault

> Generado por `pnpm run generate-index` (no editar a mano). Para el índice por evento ver `EVENTS_INDEX.md`.

**Total de eventos:** 1296

**Cobertura de fuentes:** 833 de 1296 eventos con 3+ fuentes (463 requieren más fuentes para reducir sesgo)

**Eventos por año:**
- 2026: 999
- 2025: 68
- 2024: 36
- 2023: 27
- 2022: 26
- 2021: 19
- 2020: 37
- 2019: 36
- 2018: 3
- 2017: 2
- 2016: 3
- 2015: 10
- 2014: 6
- 2013: 2
- 2012: 4
- 2011: 3
- 2010: 7
- 2009: 6
- 2003: 1
- 1973: 1

**Temas más frecuentes (Top 10):**
- Politica (520)
- Justicia (371)
- Economia (265)
- Defensa y seguridad (256)
- Administración pública (189)
- Derechos humanos (153)
- Proceso legislativo (113)
- Corrupción (106)
- Finanzas publicas (100)
- Relaciones internacionales (92)

**Tipos de eventos más frecuentes (Top 10):**
- accion (267)
- investigacion (167)
- declaracion (162)
- publicacion (137)
- reaccion (135)
- resultado (126)
- fallo_judicial (100)
- anuncio (82)
- votacion (32)
- entrevista (28)

**Entidades registradas:**
- Personas: 2194
- Organizaciones: 1139
- Cifras: 29
- Fuentes: 5275
- Temas: 77
<!-- AUTO-GENERATED:ESTADISTICAS:END -->

## Requisitos

- Node.js compatible con Astro 7.
- **pnpm** (`npm i -g pnpm` o `corepack enable`).
- `pnpm-workspace.yaml` requiere `onlyBuiltDependencies: [esbuild, protobufjs]` para `onnxruntime-web`.

---

Proyecto para capturar y navegar eventos de gobierno en Chile con datos estructurados y trazabilidad de fuentes.
