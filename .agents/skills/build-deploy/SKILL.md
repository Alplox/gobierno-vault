---
name: build-deploy
description: Build, validación y despliegue con validate, build.concurrency, pnpm, wrangler y Cloudflare Pages. Usa esta skill SIEMPRE cuando falle pnpm run build/validate, toques astro.config.mjs, content.config.ts, wrangler.jsonc o necesites desplegar, incluso si solo dice 'build falla'.
---

# Build, validación y despliegue

> Cuándo cargar: falla `pnpm run build`/`validate`, tocas `astro.config.mjs`, `src/content.config.ts`, `src/styles/global.css`, `wrangler.jsonc`, o necesitas desplegar.
> **Handoff:** si cambias `validate.mjs`, `build.concurrency`, `pnpm-workspace.yaml`, `wrangler.jsonc` o el pipeline de deploy, actualiza este skill en la misma sesión.

## Comandos

```bash
pnpm run build     # node scripts/validate/validate.mjs && astro build  (~1m40s, 7800+ páginas)
pnpm run dev       # preview local
pnpm run preview   # wrangler pages dev dist
pnpm run deploy    # build local + wrangler pages deploy dist --project-name gobierno-vault --branch main (~20s upload)
pnpm run validate  # validación temprana (wikilinks, medio, mojibake, prose)
pnpm run generate-index  # regenera EVENTS_INDEX.md (ya no toca AGENTS.md)
pnpm run sitemaps-index  # regenera sitemaps/README.md (ya no toca AGENTS.md)
```

`--experimental-global-customevent` se setea en `astro.config.mjs` (cross-platform).

## Validación temprana (`scripts/validate/validate.mjs`)

Replica `remarkWikiLinks.mjs` y falla ANTES del build si hay wikilinks rotos: `[[sources/...]]` vs `src/content/sources/*.md`, `[[people/...]]`/`[[organizations/...]]` vs `src/content/people|organizations/*.md`, `[[events/...]]` vs IDs existentes. También valida menciones en prosa (ver `event-rules.md` regla 8, `scripts/lib/proseNames.mjs`; fixer `fix-prose-wikilinks.mjs`). Excluye ` ``` ` y `` ` ``. `[[cifras/...]]` no se valida; IDs desnudos solo se enlazan si existen.

- **Fuentes de `/sueldos`:** cuentan como citadas `orden_refs`, `segundo_piso.fuente`, `topes_dipres.fuente`, `ipc.registro_presidente_julio_2026.fuente` y `presidentes[].vigencias[].fuente`; mantener el nombre de la última clave sincronizado con `src/data/sueldos.yaml`.

- **CRLF:** regex tolerante `\r?\n` (con `core.autocrlf=true` Windows entrega `\r\n`).
- **Astro glob-loader:** NO aborta build ante wikilink roto — loguea `Error rendering` y deja `rendered: undefined` (página sin contenido). Por eso `validate` es la red real.
- **Medio + mojibake + BOM:** valida `medio` en `src/content/sources/*.md` contra orgs / `WHITELIST_MEDIOS`, escanea mojibake (C2/C3, C1, U+FFFD, cirílico) y BOM en `TAREAS/` (ver `data-yaml.md`). Al incorporar una institución oficial —chilena o extranjera— o una plataforma de datos como fuente, agregar su nombre exacto a `WHITELIST_MEDIOS` solo si no es un medio registrado (por ejemplo, `Bolsa de Comercio de Santiago`, `CompaniesMarketCap` o un ministerio oficial extranjero).

## Build en paralelo

`astro.config.mjs: build.concurrency = availableParallelism()` — default Astro 7 es 1; vault >8600 páginas. Build corre local (`pnpm run deploy`); si presión RAM, cap a `Math.min(availableParallelism(), N)`.

## Gestor y CI

- **pnpm** (`pnpm-lock.yaml`). No usar npm. `auto-install-peers=true`, `strict-peer-dependencies=false` en `.npmrc` (históricamente por `@astrojs/tailwind`; hoy por robustez).
- `pnpm-workspace.yaml` con `onlyBuiltDependencies: [esbuild, protobufjs]` — pnpm 10+ sin esto falla `ERR_PNPM_IGNORED_BUILDS` (protobufjs es transitiva de `onnxruntime-web` peer de Piper). Debe incluir `packages: []`.

## Despliegue (Cloudflare Pages, build local)

`wrangler.jsonc: pages_build_output_dir: ./dist`. URL `<https://gobierno-vault.pages.dev>` (`.pages.dev`, no `.workers.dev`).

- **Sitemap:** integración `@astrojs/sitemap` en `astro.config.mjs` genera `dist/sitemap-index.xml` (referenciado en `public/robots.txt`); `filter` excluye `/admin` (también `Disallow` en robots). Requiere `site:` definido.
- **RSS:** `src/pages/rss.xml.ts` (`@astrojs/rss`) genera `dist/rss.xml` con los últimos 100 eventos: cuerpo HTML (mismo pipeline markdown + `remarkWikiLinks`, enlaces absolutizados) + pie con URL canónica y `Referencias` numeradas con URLs reales (las citas `[[sources/…]]` se resuelven a `[N](url)` porque `#ref-N` muere fuera del sitio). Descubrimiento: `rel="alternate"` en `Base.astro` + link en footer.

- **Build automático DESACTIVADO** (`production_deployments_enabled: false`, preview `none`): pushes no gatillan deploy (límite 20 min). Publicar requiere `pnpm run deploy` local tras push.
- Creación inicial: `pnpm dlx wrangler pages project create gobierno-vault --production-branch main` (requiere `wrangler login` o `CLOUDFLARE_API_TOKEN`). Re-habilitar: PATCH `.../pages/projects/gobierno-vault` con `source.config.production_deployments_enabled: true`.

## Tailwind v4 + daisyUI 5

Resumido aquí por impacto en build; detalle de uso en `frontend.md`. CSS `src/styles/global.css`, plugin `@tailwindcss/vite` con `@source` y `@plugin "daisyui"` (Tailwind v4/daisyUI 5); si falla, revisar `build.concurrency` y `wrangler.jsonc` antes de tocar estilos.

## Formato LLM

`/llm.txt` (alias `/llms.txt`) generado por `src/lib/llmIndex.ts` (`src/pages/llm.txt.ts`) con índice completo; `/events/AAAA/ID.md` sirve markdown fuente; `/data/{entities,sources,topics,colectivos,sectores}.yaml` sirve YAML crudo (`ALLOWED` en `src/pages/data/[name].yaml.ts`). Footer enlaza a `/llm.txt`.

Si falla el build, revisar frontmatter YAML y wikilinks rotos (ver validación arriba).
