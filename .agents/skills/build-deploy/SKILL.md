---
name: build-deploy
description: Build, validación y despliegue con validate, build.concurrency, pnpm, wrangler y Cloudflare Pages. Usa esta skill SIEMPRE cuando falle pnpm run build/validate, toques astro.config.mjs, content.config.ts, wrangler.jsonc o necesites desplegar, incluso si solo dice 'build falla'.
---

# Build, validación y despliegue

> Cuándo cargar: falla `pnpm run build`/`validate`, tocas `astro.config.mjs`, `src/content.config.ts`, `src/styles/global.css`, `wrangler.jsonc`, o necesitas desplegar.
> **Handoff:** si cambias `validate.mjs`, `build.concurrency`, `pnpm-workspace.yaml`, `wrangler.jsonc` o el pipeline de deploy, actualiza este skill en la misma sesión.

## Comandos

```bash
pnpm run build     # node scripts/validate.mjs && astro build  (~1m40s, 7800+ páginas)
pnpm run dev       # preview local
pnpm run preview   # wrangler pages dev dist
pnpm run deploy    # build local + wrangler pages deploy dist --project-name gobierno-vault --branch main (~20s upload)
pnpm run validate  # validación temprana (wikilinks, medio, mojibake, prose)
pnpm run generate-index  # regenera EVENTS_INDEX.md (ya no toca AGENTS.md)
pnpm run sitemaps-index  # regenera sitemaps/README.md (ya no toca AGENTS.md)
```

`--experimental-global-customevent` se setea en `astro.config.mjs` (cross-platform).

## Validación temprana (`scripts/validate.mjs`)

Replica `remarkWikiLinks.mjs` y falla ANTES del build si hay wikilinks rotos: `[[source/...]]` vs `sources.yaml`, `[[person/...]]`/`[[org/...]]` vs `entities.yaml`, `[[event/...]]` vs IDs existentes. También valida menciones en prosa (ver `event-rules.md` regla 8, `scripts/proseNames.mjs`; fixer `fix-prose-wikilinks.mjs`). Excluye ` ``` ` y `` ` ``. `[[cifra/...]]` no se valida; IDs desnudos solo se enlazan si existen.

- **CRLF:** regex tolerante `\r?\n` (con `core.autocrlf=true` Windows entrega `\r\n`).
- **Astro glob-loader:** NO aborta build ante wikilink roto — loguea `Error rendering` y deja `rendered: undefined` (página sin contenido). Por eso `validate` es la red real.
- **Medio + mojibake + BOM:** valida `sources.yaml:medio` contra orgs / `WHITELIST_MEDIOS`, escanea mojibake (C2/C3, C1, U+FFFD, cirílico) y BOM en `TAREAS/` (ver `data-yaml.md`).

## Build en paralelo

`astro.config.mjs: build.concurrency = availableParallelism()` — default Astro 7 es 1; vault >8600 páginas. Build corre local (`pnpm run deploy`); si presión RAM, cap a `Math.min(availableParallelism(), N)`.

## Gestor y CI

- **pnpm** (`pnpm-lock.yaml`). No usar npm. `auto-install-peers=true`, `strict-peer-dependencies=false` en `.npmrc` (históricamente por `@astrojs/tailwind`; hoy por robustez).
- `pnpm-workspace.yaml` con `onlyBuiltDependencies: [esbuild, protobufjs]` — pnpm 10+ sin esto falla `ERR_PNPM_IGNORED_BUILDS` (protobufjs es transitiva de `onnxruntime-web` peer de Piper). Debe incluir `packages: []`.

## Despliegue (Cloudflare Pages, build local)

`wrangler.jsonc: pages_build_output_dir: ./dist`. URL `<https://gobierno-vault.pages.dev>` (`.pages.dev`, no `.workers.dev`).

- **Build automático DESACTIVADO** (`production_deployments_enabled: false`, preview `none`): pushes no gatillan deploy (límite 20 min). Publicar requiere `pnpm run deploy` local tras push.
- Creación inicial: `npx wrangler pages project create gobierno-vault --production-branch main` (requiere `wrangler login` o `CLOUDFLARE_API_TOKEN`). Re-habilitar: PATCH `.../pages/projects/gobierno-vault` con `source.config.production_deployments_enabled: true`.

## Tailwind v4 + daisyUI 5

Resumido aquí por impacto en build; detalle de uso en `frontend.md`. CSS `src/styles/global.css`, plugin `@tailwindcss/vite` + `drop-ort-wasm-assets` que elimina `.wasm` de `dist/_astro` (evita límite 25 MiB Cloudflare; si se cambia onnx a `auto`/`local`, revertir plugin).

## Formato LLM

`/llm.txt` (alias `/llms.txt`) generado por `src/lib/llmIndex.ts` (`src/pages/llm.txt.ts`) con índice completo; `/events/AAAA/ID.md` sirve markdown fuente; `/data/{entities,sources,topics,colectivos,sectores}.yaml` sirve YAML crudo (`ALLOWED` en `src/pages/data/[name].yaml.ts`). Footer enlaza a `/llm.txt`.

Si falla el build, revisar frontmatter YAML y wikilinks rotos (ver validación arriba).
