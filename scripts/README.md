# Scripts

> Todos se invocan vía `pnpm run <comando>` (ver `package.json:scripts`). Las rutas abajo son las físicas; los comandos no cambiaron.

## Estructura por dominio

| Dominio | Carpeta | Scripts |
|---|---|---|
| **Validación / índice** | `validate/` | `validate.mjs` (principal, `pnpm run validate`/`build`), `validate-fuentes.mjs`, `fix-md034.mjs`, `fix-prose-wikilinks.mjs`, `verify-gabinete.mjs` |
|  | `generate/` | `generate-index.mjs`, `generate-seguimiento-index.mjs`, `generate-eval-viewer.mjs` |
| **Catálogo sitemaps** | `sitemaps/` | `sync.mjs` (antes `sync-sitemaps.mjs`), `index.mjs`, `backup.mjs`, `resync.mjs`, `watchlist.mjs` |
| **Extracción / fetching** | `extract/` | `fetch-content.mjs`, `fetch-impersonate.mjs`, `pdf-extract.mjs`, `doc-extract.mjs`, `ocr-extract.mjs`, `video-transcript.mjs`, `add-source.mjs` |
| **Respaldo** | `backup/` | `backup.mjs`, `restore.mjs`, `verify.mjs` |
| **Lib compartida** | `lib/` | `proseNames.mjs` (usado por `validate` + fixer), `gvault-util.mjs` (usado por `backup`/`sitemaps/backup`) |

## Mapeo vieja → nueva ruta (histórico)

| Vieja | Nueva |
|---|---|
| `scripts/validate.mjs` | `scripts/validate/validate.mjs` |
| `scripts/proseNames.mjs` | `scripts/lib/proseNames.mjs` |
| `scripts/gvault-util.mjs` | `scripts/lib/gvault-util.mjs` |
| `scripts/fix-md034.mjs` | `scripts/validate/fix-md034.mjs` |
| `scripts/fix-prose-wikilinks.mjs` | `scripts/validate/fix-prose-wikilinks.mjs` |
| `scripts/validate-fuentes.mjs` | `scripts/validate/validate-fuentes.mjs` |
| `scripts/verify-gabinete.mjs` | `scripts/validate/verify-gabinete.mjs` |
| `scripts/generate-index.mjs` | `scripts/generate/generate-index.mjs` |
| `scripts/generate-seguimiento-index.mjs` | `scripts/generate/generate-seguimiento-index.mjs` |
| `scripts/generate-eval-viewer.mjs` | `scripts/generate/generate-eval-viewer.mjs` |
| `scripts/sync-sitemaps.mjs` | `scripts/sitemaps/sync.mjs` |
| `scripts/sitemaps-index.mjs` | `scripts/sitemaps/index.mjs` |
| `scripts/sitemaps-backup.mjs` | `scripts/sitemaps/backup.mjs` |
| `scripts/sitemaps-resync.mjs` | `scripts/sitemaps/resync.mjs` |
| `scripts/sitemaps-watchlist.mjs` | `scripts/sitemaps/watchlist.mjs` |
| `scripts/fetch-content.mjs` | `scripts/extract/fetch-content.mjs` |
| `scripts/fetch-impersonate.mjs` | `scripts/extract/fetch-impersonate.mjs` |
| `scripts/pdf-extract.mjs` | `scripts/extract/pdf-extract.mjs` |
| `scripts/doc-extract.mjs` | `scripts/extract/doc-extract.mjs` |
| `scripts/ocr-extract.mjs` | `scripts/extract/ocr-extract.mjs` |
| `scripts/video-transcript.mjs` | `scripts/extract/video-transcript.mjs` |
| `scripts/add-source.mjs` | `scripts/extract/add-source.mjs` |
| `scripts/backup.mjs` | `scripts/backup/backup.mjs` |
| `scripts/restore.mjs` | `scripts/backup/restore.mjs` |
| `scripts/verify.mjs` | `scripts/backup/verify.mjs` |

## Comandos (`package.json`)

```
pnpm run validate                       # scripts/validate/validate.mjs
pnpm run generate-index                 # scripts/generate/generate-index.mjs
pnpm run generate-seguimiento-index     # scripts/generate/generate-seguimiento-index.mjs
pnpm run sitemaps-sync -- <slug>        # scripts/sitemaps/sync.mjs
pnpm run sitemaps-index                 # scripts/sitemaps/index.mjs
pnpm run sitemaps-backup                # scripts/sitemaps/backup.mjs
pnpm run sitemaps-resync                # scripts/sitemaps/resync.mjs
pnpm run sitemaps-watchlist             # scripts/sitemaps/watchlist.mjs
pnpm run add-source -- <URL>            # scripts/extract/add-source.mjs
pnpm run pdf-extract -- <URL>           # scripts/extract/pdf-extract.mjs
pnpm run doc-extract -- <URL>           # scripts/extract/doc-extract.mjs
pnpm run fetch-impersonate -- <URL>     # scripts/extract/fetch-impersonate.mjs
pnpm run fetch-content -- <URL>         # scripts/extract/fetch-content.mjs
pnpm run ocr-extract -- <img>           # scripts/extract/ocr-extract.mjs
pnpm run video-transcript -- <URL>      # scripts/extract/video-transcript.mjs
pnpm run backup                         # scripts/backup/backup.mjs
pnpm run verify -- <file.gvault>        # scripts/backup/verify.mjs
pnpm run restore -- <file.gvault>       # scripts/backup/restore.mjs
pnpm run verify-gabinete                # scripts/validate/verify-gabinete.mjs
pnpm run build                          # validate + astro build
```

## Notas

- `ROOT` en los scripts usa `join(__dirname, '../..')` (dos niveles) tras el move; `process.cwd()` no necesita cambio.
- `pnpm run build` sigue siendo `node scripts/validate/validate.mjs && astro build`.
- Docs que citan rutas (`AGENTS.md`, `README.md`, skills `sitemaps`/`tools`/`backup`/`build-deploy`/etc.) ya apuntan a las nuevas rutas.
