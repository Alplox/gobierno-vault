---
name: content-model
description: Modelo de contenido para eventos, frontmatter, tipos, wikilinks, svg_backup, cifras en disputa y votaciones. Usa esta skill SIEMPRE al crear o editar src/content/events/YYYY/MM/YYYYMMDD-N.md, validar tipo/relaciones, escribir [[people/org/source/cifras/event]] o citar cifras, incluso si el usuario solo dice 'crear evento' o 'agregar cifra'.
---

# Modelo de contenido — eventos, frontmatter y wikilinks

> Cuándo cargar: vas a crear/editar `src/content/events/YYYY/MM/YYYYMMDD-N.md`, tocar frontmatter, wikilinks, cifras o el respaldo `svg_backup`. Para reglas de proceso (fuentes, validación, TAREAS) ver `event-rules.md`.
> **Handoff:** si cambias el modelo de contenido (frontmatter, tipos, wikilinks, `svg_backup`, cifras nacionales), actualiza este skill en la misma sesión — un skill desactualizado rompe el handoff igual que `AGENTS.md`.

## Archivos de evento

Ruta: `src/content/events/YYYY/MM/YYYYMMDD-N.md` — `N` secuencial dentro del día.

```yaml
---
titulo: "Descripción breve"
fecha: 2026-07-20T11:00:00Z          # ISO 8601 UTC
tipo: decreto                          # ver enum abajo
tema: emergencia, defensa_seguridad    # IDs de src/content/topics/*.md
etiquetas: sistema_frontal, ...        # strings libres
impacto:
  colectivos: residentes, familias     # IDs de src/data/colectivos.yaml (excepción YAML)
  sectores: agua_potable, ...          # IDs de src/data/sectores.yaml (excepción YAML)
relaciones:
  sucesor: 20260720-1                  # tipo_relacion: id_evento (sin extensión)
creado: 2026-07-20
actualizado: 2026-07-20
svg_backup:                            # opcional, ver sección svg_backup
  fuente: https://x.com/.../photo/1
  archivo: /img-to-ascii/20260809-8-zanja.svg
---
```

### Plantilla copiable {#plantilla-copiable}

Copiar a `src/content/events/YYYY/MM/YYYYMMDD-N.md` (`N` secuencial del día). Reemplaza `YYYY-MM-DD`/`YYYYMMDD-N` y completa.

```yaml
---
# (requerido) Título breve y objetivo
titulo: Descripción breve y objetiva del evento

# (requerido) Fecha y hora de ocurrencia — ISO 8601 UTC
fecha: YYYY-MM-DDTHH:MM:SSZ

# (requerido) Tipo — 14 valores:
# declaracion | accion | anuncio | decreto | proyecto | ley |
# votacion | fallo_judicial | entrevista | publicacion |
# documento | investigacion | reaccion | resultado
tipo: decreto

# (requerido) Temas — IDs de src/content/topics/*.md, separados por coma
tema: emergencia, defensa_seguridad

# (opcional) Etiquetas libres — strings, sin taxonomy
etiquetas: sistema_frontal, estado_de_catastrofe

# (opcional) Impacto
impacto:
  colectivos: residentes, familias, pacientes   # IDs de src/data/colectivos.yaml (excepción YAML)
  sectores: agua_potable, energia_electrica     # IDs de src/data/sectores.yaml (excepción YAML)

# (opcional) Relaciones — tipo_relacion: id_sin_extension (no duplicar bidireccional)
relaciones:
  sucesor: 20260101-1
  causa: 20251215-3
  # ver tipos: contradice | confirma | cumple | incumple | amplia | corrige | rectifica
  #           | responde_a | deriva_en | provoca | cita | reemplaza | actualiza

# (opcional) Respaldo ASCII de imagen — evidencia visual preservada
# El SVG se genera en herramienta externa (ej. https://ezascii.com/image-to-ascii)
# y se guarda SOLO tras confirmar visualmente que se ve correcto. Nunca automático.
svg_backup:
  fuente: https://x.com/usuario/status/123/photo/1   # URL imagen original
  archivo: /img-to-ascii/YYYYMMDD-N-slug.svg          # Opción A recomendada: .svg en public/img-to-ascii/ (SVGs reales pesan MBs)
  # svg: |                                             # Opción B solo artesanal <=100K chars, inline
  #   <svg ...>...</svg>

# (requerido) Fechas de registro — YYYY-MM-DD
creado: YYYY-MM-DD
actualizado: YYYY-MM-DD
---
```

```markdown
## Qué pasó

El [[people/jose_antonio_kast]] anunció desde [[organizations/presidencia_chile]] la medida X [[sources/latercera-2026-07-20-medida]].

## Cifras del balance

- [[cifras/fallecidos/5/personas]] fallecidos [[sources/latercera-2026-07-20-balance]]
- [[cifras/damnificados/2205/personas]] damnificados [[sources/biobio-2026-07-20-balance]]

Si cifras en disputa: párrafo que explica la desincronización + tabla comparativa (cifra | fuente | contexto). Ver § Cifras en disputa.

## Qué dijo

> Texto de la cita aquí - [[people/jose_antonio_kast]] [[sources/x-2026-07-20-post]]

Separador ` - ` (espacio-guion-espacio) antes de `[[people/...]]`; `[[sources/...]]` después. Sin `"` ni `—`.

## Votación (si tipo: votacion)

Verificar conteos en Senado/Cámara oficial y citar URL como fuente (`medio: Senado de Chile` / `Cámara de Diputados`), cada conteo como `[[cifras/...]]`. Ver § Votaciones.

Relaciones en prosa: `[[events/20260618-3]]` (wikilink explícito; no usar ID desnudo `20260618-3` — no es markdown puro y no auto-enlaza).

No dejar notas de editor en el body (`ver TAREAS`, `pendiente verificación` etc. → van a `TAREAS/` con `Origen:`). `scripts/validate/validate.mjs` hace fallar el build. Cross-refs `[[events/ID]]` sí válidos.
```

Fuentes **siempre inline** al final de la afirmación, nunca en `## Referencias` separada. `tema`/`impacto` usan IDs de `src/content/topics/*.md`/`src/data/colectivos.yaml`/`sectores.yaml`. Nueva persona/org/cifra → `src/content/people|organizations|cifras/*.md`; nueva fuente → `src/content/sources/<id>.md` (ID `medio-YYYY-MM-DD-slug`, URL completa nunca raíz). Consultar catálogo sitemaps ANTES de buscar en web: `rg -i -uu -g '*.jsonl' '<términos>' sitemaps`. `validate.mjs` falla si nombre/apellido de persona enlazada aparece sin `[[people/...]]` (fix: `node scripts/validate/fix-prose-wikilinks.mjs --dry-run`). Al crear por TAREAS: mínimo **5 fuentes** de medios distintos. `pnpm run generate-index` + `pnpm run validate` debe pasar. Ver `.agents/skills/event-rules/SKILL.md`.

### Tipos de evento (`tipo`)

`declaracion` | `accion` | `anuncio` | `decreto` | `proyecto` | `ley` | `votacion` | `fallo_judicial` | `entrevista` | `publicacion` | `documento` | `investigacion` | `reaccion` | `resultado`

Ver `content.config.ts` (enum), `editorData.ts`, `lib/eventTypes.ts`.

### Tipos de relación (`relaciones`)

`contradice` | `confirma` | `cumple` | `incumple` | `amplia` | `corrige` | `rectifica` | `responde_a` | `deriva_en` | `provoca` | `cita` | `reemplaza` | `actualiza`

No declarar la misma conexión en ambas direcciones (ej. A `deriva_en` B y B `responde_a` A). `src/lib/relations.ts:getEventConnections` deduplica quedándose con el outgoing; la etiqueta temporal (Siguiente/Anterior) se calcula por fecha real.

## Wikilinks (body markdown)

| Sintaxis | Render | Ejemplo |
| --- | --- | --- |
| `[[people/id]]` | `<span class="entity-ref entity-person">Nombre</span>` | `[[people/jose_antonio_kast]]` |
| `[[organizations/id]]` | `<span class="entity-ref entity-org">Nombre</span>` | `[[organizations/senapred]]` |
| `[[sources/id]]` | `[N]` con tooltip | `[[sources/latercera-2026-07-20-balance]]` |
| `[[cifras/concepto/valor/unidad]]` | `<span class="cifra-badge">valor</span>` | `[[cifras/fallecidos/5/personas]]` |
| `[[events/20260720-1]]` | `<a class="event-ref">Título</a>` | `[[events/20260720-1]]` |

- Fuentes se numeran por primera aparición; repeticiones reutilizan el número. Genera anchor `#ref-N`.
- `[[cifras/...]]` es la única forma válida (`src/content/cifras/*.md`); la variante singular `[[cifra/...]]` está eliminada — no usar. Cifras canónicas viven en `src/content/cifras/*.md` con `aliases: []` y `unidad_default` canónica; `validate` avisa si usas alias de concepto (`desempleo`→`tasa_desocupacion`) y `queries.ts:resolveCifraConcept` agrupa serie por canónico (`/stats/tasa_desocupacion`). La fecha la da `event.data.fecha`, no el ID.
- Solo wikilinks explícitos `[[events/ID]]` enlazan eventos (no hay auto-enlace de IDs desnudos `20260618-3` — no es markdown puro).

### Medios de prensa en prosa

Medios = organizaciones `tipo: medio_comunicacion` en `src/content/organizations/*.md`. Mencionarlos siempre como `[[organizations/id]]` (“según T13”, “reveló CIPER”). Estandariza el nombre visible y evita ambigüedades (“El País (Chile)” medio vs país).

- `nombre` canónico = lo que renderiza el wikilink (ej. `BioBioChile`, `El País (Chile)`). `src/content/sources/*.md:medio` debe usar el mismo nombre.
- `tipo: red_social` para Reddit/X/YouTube — solo complementarias, nunca fuente única. Metodología en `social-media.md`.
- ID `snake_case` del nombre (`el_pais`, `radio_universidad_chile`). Revisar `src/content/organizations/*.md` antes de crear (~1052 orgs, ~54 medios).
- Helper: `pnpm run add-source -- <URL>` mapea dominio → medio y genera `src/content/sources/<id>.md`.

### Formato de citas (declaraciones)

```markdown
> Texto de la cita aquí - [[people/jose_antonio_kast]]
> Otra cita con fuente - [[people/jose_antonio_kast]] [[sources/x-2026-07-20-kast-catastrofe]]
```

- Separador ` - ` (espacio-guion-espacio) antes de `[[people/...]]`.
- `[[sources/...]]` va después de `[[people/...]]` en la misma línea.
- NO usar `"` ni `—` como separador. `extractEntities.ts` toma el último ` - [[people/...]]` como hablante.

### Citación inline

Fuentes **inline** al final de la afirmación, nunca en `## Referencias`:

```markdown
La bencina subió 370 pesos por litro [[sources/latercera-2026-03-19-mepco-impacto-ipc]].
```

### Prohibido contenido meta-editorial en body

El body es narrativa factual, no bitácora de decisiones del editor. **Nunca** incluir en el evento:

- Secciones o párrafos que expliquen por qué se agregaron o no se agregaron fuentes ("No se agregan como fuentes...", "complementarios por definición", "Matiz sobre sesgo y cobertura", "reduce el riesgo de reinterpretación", "medio con línea editorial... para contrastar sesgo", "Validación cruzada" como sección que justifica selección de fuentes).
- Justificaciones sobre la selección de fuentes, cobertura o sesgo percibido.
- Auto-referencia al proceso de edición ("este evento documenta X para reducir sesgo").

La decisión de incluir o no una fuente y su justificación va al **mensaje de commit**, a `TAREAS/` (si queda pendiente) o a la discusión de PR, nunca al body del evento. Si un medio replica el matiz oficial, se reporta el hecho ("[[organizations/eldesconcierto]] replicó el matiz de SERMIG [[sources/...]]"), sin calificar su línea editorial ni teorizar sobre sesgo. Violaciones caen bajo `event-rules.md:13` y `scripts/validate/validate.mjs` (patrón `nota editorial`).

### Campo `svg_backup` (respaldo ASCII de imagen)

Para eventos apoyados en imagen cuya evidencia conviene preservar. SVG generado por el usuario en herramienta externa (ej. `<https://ezascii.com/image-to-ascii>`) y verificado visualmente — nunca automático.

```yaml
svg_backup:
  fuente: https://x.com/.../photo/1
  archivo: /img-to-ascii/20260809-8-zanja.svg   # OPCIÓN A recomendada: .svg en public/
  # svg: |                                      # OPCIÓN B solo artesanal pequeño ≤100K
  #   <svg ...>...</svg>
```

- **A:** archivo en `public/img-to-ascii/<evento>-<slug>.svg` (SVGs reales pesan MBs; ej. zanja 1,45 MB). Render `<img src>` sin `set:html` → sin XSS. Requiere `width`/`height` o `viewBox`. Queda fuera de `.light.gvault` (custodia git + zip del footer). **B:** inline `svg:` ≤100K, render `set:html` con validación anti-XSS (`<script`, `on*`, `javascript:` rechazados).
- Confirmación humana obligatoria. Render en `src/pages/events/[year]/[id].astro` con etiqueta “Respaldo ASCII”. CSS `.ascii-svg`/`.ascii-svg-img` en `Base.astro`.
- Schema `content.config.ts` + `scripts/validate/validate.mjs` validan.

## Dónde viven las entidades

| Entidad | Fuente | Acceso |
| --- | --- | --- |
| Personas | `src/content/people/*.md` | `getPeopleRegistry()` |
| Organizaciones | `src/content/organizations/*.md` | `getOrgsRegistry()` |
| Medios | `src/content/organizations/*.md` (`tipo: medio_comunicacion`) | `getOrgsRegistry()` |
| Cifras | `src/content/cifras/*.md` | `getCifrasRegistry()` |
| Fuentes | `src/content/sources/*.md` | `getSourcesRegistry()` |
| Temas | `src/content/topics/*.md` | `getTopicsRegistry()` |
| Colectivos | `src/data/colectivos.yaml` | array plano (excepción YAML) |
| Sectores | `src/data/sectores.yaml` | array plano (excepción YAML) |

`people`/`organizations`/`topics`/`sources`/`cifras` son colecciones Astro (`src/content.config.ts` + `glob`); `registry.ts`/`queries.ts` leen `.md` frontmatter directo, sin fallback YAML. `extractEntities.ts` extrae wikilinks del `.md` crudo con regex cacheada. Migración 2026-08: `src/data/entities.yaml` (32093L), `sources.yaml` (40065L), `topics.yaml` (471L) eliminados → markdown puro, sin fallback (conversores `scripts/migrate-*.mjs` eliminados).

## Patrones especiales

### Cifras en disputa: párrafo + tabla

Cuando fuentes no coinciden (conteos, plazas, montos — ej. `20260813-1` Cancerbero), además del párrafo que explica la desincronización, agregar tabla comparativa en la misma sección: cifra (`[[cifras/...]]`), fuente/emisor (`[[sources/...]]`), contexto (qué mide, por qué difiere). Si se concilia, decirlo explícito y marcarlo en tabla. Registrar en `TAREAS/` solo lo pendiente real.

### Votaciones (`tipo: votacion`): conteos con fuente oficial

Verificar a favor/en contra/abstenciones en `senado.cl/actividad-legislativa/sala/votaciones` o `camara.cl/legislacion/sala_sesiones/votaciones.aspx` (`ProyectosDeLey/votaciones.aspx?prmBOLETIN=NNNNN-NN`). Citar URL concreta en `src/content/sources/<id>.md` (`medio: Senado de Chile`/`Cámara de Diputados`) y cada conteo como `[[cifras/...]]` (ej. `20260810-10`). Ver `.agents/skills/fuentes-gubernamentales/SKILL.md` → Poder Legislativo.
