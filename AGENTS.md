# Gobierno Vault — Guia para Agentes

> Este archivo se auto-actualiza. Si descubres un patron, convencion o cambio que no este documentado aqui, agregarlo. Un agente que no actualiza AGENTS.md deja de ser util para el proximo agente.
> **La misma regla aplica a `.agents/skills/*/SKILL.md`:** cada skill es un handoff de su dominio. Si cambias o actualizas algo que cubre un skill (frontmatter, validación, frontend, datos YAML, build, gabinete, sitemaps, etc.), **actualiza el skill correspondiente en la misma sesión** — un skill desactualizado rompe el scope del siguiente agente tanto como un AGENTS.md desactualizado.

## Que es esto

Base de conocimiento estatica sobre eventos de gobierno en Chile. Astro 7 + Tailwind, output `static` (SSG). Lenguaje: espanol.

- `EVENTS_INDEX.md` — inventario auto-generado de todos los eventos (contexto rapido para agentes y humanos).
- `TAREAS/` — bitacora de pendientes anti recency bias (desde 15-ago-2026). No hay `TAREAS.md` raiz ni archivo de completadas; lo hecho queda en `EVENTS_INDEX.md` + `git log`.
  - `TAREAS/PENDIENTES/YYYY.md` — `⬜ pendiente`/`🟡 parcial` por año (2016, 2019-2026)
  - `TAREAS/PENDIENTES/TRANSVERSALES.md` — sin año unico
  - `TAREAS/SEGUIMIENTO/YYYY.md` — seguimiento activo por año con IDs estables `S/A/V-YYYY-NNN` (ver `.agents/skills/seguimiento/SKILL.md`), `TAREAS/SEGUIMIENTO_INDEX.md` catálogo auto-generado

**Ciclo TAREAS:** detectar pendiente → registrar en `TAREAS/PENDIENTES/YYYY.md` (o `SEGUIMIENTO/YYYY.md` con ID `S-YYYY-NNN` y **`Origen: <url>`**) → retomar: `rg "S-2026-042" TAREAS/SEGUIMIENTO_INDEX.md` o `read TAREAS/SEGUIMIENTO/2026.md` sin parsear títulos → crear evento con `.agents/skills/content-model/SKILL.md#plantilla-copiable` + 5 fuentes de medios distintos (nunca red social sola) + `src/content/people|organizations` si era 2019-2021 → `pnpm run generate-index` + `pnpm run generate-seguimiento-index` → **eliminar la fila** de `TAREAS/` (no queda `✅`). Usuario valida con `pnpm run build`.

## Arquitectura

```
src/
  content/events/YYYY/MM/YYYYMMDD-N.md
  content/people/*.md, organizations/*.md, topics/*.md, sources/*.md, cifras/*.md ← colecciones Obsidian (markdown puro, sin YAML monolito)
  data/  colectivos.yaml, sectores.yaml, sueldos.yaml ← única excepción YAML (arrays planos / sueldos, no migrado a md)
  lib/   registry.ts, queries.ts, extractEntities.ts, editorData.ts, eventTypes.ts, remarkWikiLinks.mjs
  components/  EventCard, FilterBar, Timeline, SourceRef, RelationBadge
  layouts/Base.astro   layout unico (nav + slot + footer + CSS global)
  pages/  /, /events, /events/[year]/[id], /people, /organizations, /sources, /topics, /stats, /admin, /llm.txt, /events/[year]/[id].md, /data/*.yaml
sitemaps/  catalogo local de prensa (JSONL por medio/año, no commiteado)
  .cache/  XML crudo (gitignored)  _manifest.json (estado, commiteado)  README.md (indice, commiteado)
```

| Entidad | Fuente | Acceso |
| --- | --- | --- |
| Personas / Orgs / Cifras | `src/content/people \| organizations \| cifras/*.md` | `getPeopleRegistry()` / `getOrgsRegistry()` / `getCifrasRegistry()` |
| Fuentes | `src/content/sources/*.md` | `getSourcesRegistry()` |
| Temas | `src/content/topics/*.md` | `getTopicsRegistry()` |
| Colectivos / Sectores | `src/data/colectivos.yaml` / `src/data/sectores.yaml` | array plano (excepción YAML) |

`people`/`organizations`/`topics`/`sources`/`cifras` son colecciones Astro (`src/content.config.ts` + `glob`); `registry.ts` lee `.md` frontmatter con fallback YAML legacy (defensivo, monolito 2026-08 eliminado). `colectivos.yaml`/`sectores.yaml`/`sueldos.yaml` se leen YAML directo (excepción). `extractEntities.ts` extrae wikilinks del `.md` crudo con regex cacheada.

## Checklist obligatorio antes de tocar `src/content/**` (`events`/`people`/`sources`/…)

Antes de revisar enlaces, crear o editar evento, **DEBES** cargar: `content-model` + `event-rules` + `data-yaml` + `sitemaps` + `tools`. Si el tema toca Estado/cifra/voto/normativa → añade `fuentes-gubernamentales`; si toca Reddit/X/FB/reacciones → añade `social-media`; si toca gabinete/`cargos[]`/Cuentas Públicas → añade `gabinete`. Sin esto no edites — `scripts/validate/validate.mjs` fallará por wikilinks, URLs o `medio`.

## Como crear/editar un evento — quick reference

Ruta `src/content/events/YYYY/MM/YYYYMMDD-N.md` (`N` secuencial del dia). Ver `.agents/skills/content-model/SKILL.md#plantilla-copiable` para plantilla copiable y detalle.

```yaml
---
titulo: "Descripcion breve"
fecha: 2026-07-20T11:00:00Z  # ISO 8601 UTC
tipo: decreto               # ver enum abajo
tema: emergencia, defensa_seguridad
etiquetas: sistema_frontal
impacto: { colectivos: [residentes], sectores: [agua_potable] }  # opcional
relaciones: { sucesor: 20260720-1 }  # opcional, sin extension
creado: 2026-07-20
actualizado: 2026-07-20
---
Cuerpo con wikilinks inline...
```

**`tipo`:** `declaracion` | `accion` | `anuncio` | `decreto` | `proyecto` | `ley` | `votacion` | `fallo_judicial` | `entrevista` | `publicacion` | `documento` | `investigacion` | `reaccion` | `resultado`

**Wikilinks en body** (siempre que menciones persona/org/fuente/cifra/evento):

| Sintaxis | Ejemplo |
| --- | --- |
| `[[people/id]]` | `[[people/jose_antonio_kast]]` |
| `[[organizations/id]]` | `[[organizations/senapred]]` |
| `[[sources/id]]` | `[[sources/latercera-2026-07-20-balance]]` |
| `[[cifra/concepto/valor/unidad]]` | `[[cifra/fallecidos/5/personas]]` |
| `[[events/20260720-1]]` | `[[events/20260720-1]]` |

Fuentes **inline** al final de la afirmacion, nunca en `## Referencias` separada. Detalle completo (medios en prosa, formato citas, `svg_backup`, cifras en disputa, votaciones con fuente oficial) en `.agents/skills/content-model/SKILL.md`.

## Reglas rapidas (detalle en `.agents/skills/event-rules/SKILL.md`)

1. **5 fuentes** de medios distintos por evento; nunca red social como fuente unica. **Prioriza fuente gubernamental directa antes que prensa** — ver `.agents/skills/fuentes-gubernamentales/SKILL.md` (tablas Presidencia/ministerios/BCN/Cámara/Senado) para reducir reinterpretación.
2. **URLs completas** del articulo (nunca raiz). Si paywall sin URL exacta, usa secundaria que cite original + `notas` en YAML. Guarda siempre URL original, nunca la del mirror.
3. **Wikilinks obligatorios** en prosa — `scripts/validate/validate.mjs` falla si el nombre completo o el apellido de una persona enlazada aparece sin `[[people/...]]` (`scripts/lib/proseNames.mjs`; fix `scripts/validate/fix-prose-wikilinks.mjs`).
4. **Prohibido notas de editor en body** (`ver TAREAS`, `pendiente verificacion`, etc.) — van a `TAREAS/` con `⬜`/`🟡`; `validate` hace fallar el build. Cross-refs `[[events/ID]]` sí válidos (wikilink explícito, no `(ver evento X)`).
5. **Consultar catalogo sitemaps ANTES de buscar en web** para medios con sitemap: `rg -i --no-heading -uu '<terminos>' sitemaps/<slug>/` o `rg -i -uu -g '*.jsonl' '<term>' sitemaps` (ver `.agents/skills/sitemaps/SKILL.md`). Luego leer URL con mirrors de `.agents/skills/tools/SKILL.md`.
6. **No duplicar relaciones** bidireccionales; `relaciones` apunta a `ID` sin extension.

Crear muchas entidades/fuentes: verificar `git status` antes (edicion concurrente) y nunca usar PowerShell `Set-Content`/`>` sobre YAML (corrompe UTF-8). Ver `.agents/skills/data-yaml/SKILL.md`.

## Build y verificacion

```bash
pnpm run build    # validate + astro build (~1m40s)
pnpm run dev      # preview
pnpm run deploy   # build local + wrangler pages deploy dist --project-name gobierno-vault --branch main
```

Si falla: frontmatter YAML o wikilink roto. `pnpm run validate` es la red real (Astro no aborta ante wikilink roto, deja pagina sin contenido). Detalle (CRLF, concurrency, pnpm, Cloudflare, Tailwind/daisyUI) en `.agents/skills/build-deploy/SKILL.md`.

**Entorno shell — portable:** no uses comandos específicos de un shell (`wc`/`grep`/`awk`/`sed`/`head`/`tail` en bash fallan en PowerShell como `no se reconoce como cmdlet`; `Get-Content`/`Set-Content`/`Select-String`/`Select-Object` fallan en bash y corrompen encoding). Usa herramientas cross-platform que ya están en el repo:
- Líneas / contar `##` / tamaño: `rg -c "^##" AGENTS.md`, `rg --count`, o `node -e "console.log(readFileSync('AGENTS.md','utf8').split('\n').length)"` / `statSync` — funcionan en Windows, Linux y macOS
- Búsqueda: `rg` (ver `.agents/skills/tools/SKILL.md` → ripgrep) — respeta `.gitignore`; evita `grep`/`Select-String`/`Get-ChildItem` (320× más lentos)
- Paginación / `| head -n N`: no uses `| head` (no existe en PowerShell); usa `rg --max-count N`, `rg ... | Select-Object -First N` en PowerShell, o `node` con `.slice(0,N)` — ver `.agents/skills/tools/SKILL.md` → ripgrep
- Nunca uses `>`/`Set-Content`/`Out-File` sobre YAML (ver `data-yaml/SKILL.md`) — usa `node` con `writeFileSync` `utf8` o las tools `Edit`/`Write` del agente
- Si necesitas un comando shell nativo, verifica primero que exista sino elige el equivalente portable (`rg --version`, `node -e "console.log(process.platform)"`)

Estadisticas del vault: ver `README.md` › Estadísticas del vault (sección auto-generada por `pnpm run generate-index`; también resumido en `EVENTS_INDEX.md`). Medios del catalogo: ver `sitemaps/MEDIOS.md` (tabla completa Slug/Nombre/Sitemap/Filtro/Artículos/Años, generada por `pnpm run sitemaps-index`), `sitemaps/README.md` y `sitemaps/_manifest.json` (~250 slugs, detalle en `.agents/skills/sitemaps/SKILL.md`). Ninguno se duplica aqui para evitar diffs ruidosos, pero siguen disponibles para editores.

## Skills bajo demanda

**Obligatorios para revisar enlaces/crear/editar evento o tocar `src/data/*.yaml`** (ver checklist arriba): `content-model` + `event-rules` + `data-yaml` + `sitemaps` + `tools`. El core sin ellos no cubre `validate.mjs`.

| Necesitas… | Carga… |
| --- | --- |
| Frontmatter completo, tipos, wikilinks, `svg_backup`, cifras en disputa, votaciones **(obligatorio)** | `.agents/skills/content-model/SKILL.md` |
| 16 reglas expandidas, enforcement prose, TAREAS lifecycle **(obligatorio)** | `.agents/skills/event-rules/SKILL.md` |
| Tocar `src/content/people\|organizations\|cifras/*.md`, `src/content/sources/*.md`, `src/content/topics/*.md`, `src/data/colectivos.yaml\|sectores.yaml\|sueldos.yaml`, encoding/CRLF **(obligatorio)** | `.agents/skills/data-yaml/SKILL.md` (nombre legacy; cubre md + excepción YAML) |
| Catalogo sitemaps (sync, search, cobertura historica) **(obligatorio)** | `.agents/skills/sitemaps/SKILL.md` |
| Fetch/paywall, PDF/Office/OCR, video transcript, ripgrep, mirrors **(obligatorio)** | `.agents/skills/tools/SKILL.md` |
| Fuente gubernamental directa (Presidencia, ministerios, BCN, Cámara/Senado, servicios) — anti-sesgo (si toca Estado/cifra/voto) | `.agents/skills/fuentes-gubernamentales/SKILL.md` |
| Redes sociales / reacciones comunitarias / verificacion imagen-viral (si toca Reddit/X/FB) | `.agents/skills/social-media/SKILL.md` |
| Gabinete, `cargos[]`, Cuentas Publicas (si toca gabinete) | `.agents/skills/gabinete/SKILL.md` |
| Tocar timeline/rail, grafo, filtros `/events`, View Transitions, TTS, estilos | `.agents/skills/frontend/SKILL.md` |
| Build falla, validate, deploy, pnpm, Cloudflare, Tailwind | `.agents/skills/build-deploy/SKILL.md` |
| Seguimiento con IDs `S/A/V-YYYY-NNN` por año + catálogo | `.agents/skills/seguimiento/SKILL.md` |
| Web research con Firecrawl (search/scrape/crawl/agent, 1000 créditos) — alternativa a fetch-impersonate | `firecrawl` CLI (`firecrawl search/scrape --help`, `firecrawl --status`) + MCP `https://mcp.firecrawl.dev/v2/mcp-oauth` — ver `.agents/skills/tools/SKILL.md` para fallback |
| Respaldo offline `.gvault` | `.agents/skills/backup/SKILL.md` |

## Cuando descubras algo no documentado

1. Agregalo a la seccion correspondiente (o al skill adecuado si es detalle >5 lineas). **Si tu cambio toca un dominio de un skill, actualiza ese skill en la misma PR** — ver tabla de Skills bajo demanda.
2. Manten conciso — nada de prosa innecesaria ni cronicas de bug de >3 lineas (deja 1 linea + referencia a archivo:linea o commit).
3. Si borras/renombras campo, actualiza TODO lo que lo referencie (AGENTS.md + skills que lo mencionen).
4. Si agregas colección nueva (markdown: `src/content/<name>/*.md` + `content.config.ts` + `registry.ts`; o YAML excepcional en `src/data/*.yaml` → `ALLOWED` en `src/pages/data/[name].yaml.ts` + `src/lib/llmIndex.ts`), documenta schema.
5. Tras cambios significativos, `pnpm run generate-index` (regenera `EVENTS_INDEX.md` + `README.md` › Estadísticas del vault), `pnpm run generate-seguimiento-index` tras tocar `SEGUIMIENTO/` (regenera `SEGUIMIENTO_INDEX.md`), y si tocaste `MEDIA`/`_manifest.json`, `pnpm run sitemaps-index` (regenera `sitemaps/README.md` + `sitemaps/MEDIOS.md`).

Regla de tamaño: **AGENTS.md ≤ 300 lineas**. Detalle >5 lineas va a un skill. Si crece, moverlo. **Skills también se auto-actualizan** — un skill desactualizado es tan dañino como un AGENTS.md desactualizado para el handoff.

## Archivos clave para revisar antes de cambiar algo

| Cambio | Revisar |
| --- | --- |
| Nuevo campo frontmatter | `content.config.ts`, `.agents/skills/content-model/SKILL.md#plantilla-copiable`, `admin.astro`, `.agents/skills/content-model/SKILL.md` |
| Nuevo tipo de evento/relacion | `content.config.ts`, `editorData.ts`, `lib/eventTypes.ts`, `lib/relations.ts` |
| Nueva entidad/fuente/tema | `src/content/people\|organizations\|sources\|topics\|cifras/*.md`, `.agents/skills/data-yaml/SKILL.md` |
| Tocar `/sueldos` | `src/data/sueldos.yaml`, `src/lib/sueldos.ts` |
| Fuente gubernamental directa | `.agents/skills/fuentes-gubernamentales/SKILL.md` |
| Seguimiento `S/A/V-YYYY-NNN` | `TAREAS/SEGUIMIENTO/YYYY.md`, `TAREAS/SEGUIMIENTO_INDEX.md`, `.agents/skills/seguimiento/SKILL.md` |
| Frontend (transitions, timeline, grafo, filtros, TTS) | `.agents/skills/frontend/SKILL.md` |
| Gabinete / `cargos` / Cuentas Publicas | `.agents/skills/gabinete/SKILL.md`, `src/lib/cabinet.ts` |
| Fetch / PDF / Office / OCR | `.agents/skills/tools/SKILL.md` |
| Sitemaps / catalogo | `.agents/skills/sitemaps/SKILL.md`, `scripts/sitemaps/sync.mjs` |
| Build / deploy / estilos | `.agents/skills/build-deploy/SKILL.md` |
