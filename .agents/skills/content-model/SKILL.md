---
name: content-model
description: Modelo de contenido para eventos, frontmatter, tipos, wikilinks, svg_backup, cifras en disputa y votaciones. Usa esta skill SIEMPRE al crear o editar src/content/events/YYYY/MM/YYYYMMDD-N.md, validar tipo/relaciones, escribir [[person/org/source/cifra/event]] o citar cifras, incluso si el usuario solo dice 'crear evento' o 'agregar cifra'.
---

# Modelo de contenido — eventos, frontmatter y wikilinks

> Cuándo cargar: vas a crear/editar `src/content/events/YYYY/MM/YYYYMMDD-N.md`, tocar frontmatter, wikilinks, cifras o el respaldo `svg_backup`. Para reglas de proceso (fuentes, validación, TAREAS) ver `event-rules.md`.
> **Handoff:** si cambias el modelo de contenido (frontmatter, tipos, wikilinks, `svg_backup`, cifras), actualiza este skill en la misma sesión — un skill desactualizado rompe el handoff igual que `AGENTS.md`.

## Archivos de evento

Ruta: `src/content/events/YYYY/MM/YYYYMMDD-N.md` — `N` secuencial dentro del día.

```yaml
---
titulo: "Descripción breve"
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
svg_backup:                            # opcional, ver sección svg_backup
  fuente: https://x.com/.../photo/1
  archivo: /img-to-ascii/20260809-8-zanja.svg
---
```

### Tipos de evento (`tipo`)

`declaracion` | `accion` | `anuncio` | `decreto` | `proyecto` | `ley` | `votacion` | `fallo_judicial` | `entrevista` | `publicacion` | `documento` | `investigacion` | `reaccion` | `resultado`

Ver `content.config.ts` (enum), `editorData.ts`, `lib/eventTypes.ts`.

### Tipos de relación (`relaciones`)

`contradice` | `confirma` | `cumple` | `incumple` | `amplia` | `corrige` | `rectifica` | `responde_a` | `deriva_en` | `provoca` | `cita` | `reemplaza` | `actualiza`

No declarar la misma conexión en ambas direcciones (ej. A `deriva_en` B y B `responde_a` A). `src/lib/relations.ts:getEventConnections` deduplica quedándose con el outgoing; la etiqueta temporal (Siguiente/Anterior) se calcula por fecha real.

## Wikilinks (body markdown)

| Sintaxis | Render | Ejemplo |
| --- | --- | --- |
| `[[person/id]]` | `<span class="entity-ref entity-person">Nombre</span>` | `[[person/jose_antonio_kast]]` |
| `[[org/id]]` | `<span class="entity-ref entity-org">Nombre</span>` | `[[org/senapred]]` |
| `[[source/id]]` | `[N]` con tooltip | `[[source/latercera-2026-07-20-balance]]` |
| `[[cifra/concepto/valor/unidad]]` | `<span class="cifra-badge">valor</span>` | `[[cifra/fallecidos/5/personas]]` |
| `[[event/20260720-1]]` | `<a class="event-ref">Título</a>` | `[[event/20260720-1]]` |

- Fuentes se numeran por primera aparición; repeticiones reutilizan el número. Genera anchor `#ref-N`.
- IDs desnudos `\b20\d{6}-\d{1,3}\b` (ej. `ver evento 20260618-3`) se auto-enlazan si existen — ver `remarkWikiLinks.mjs`. Usa `[[event/ID]]` para enlace explícito.
- `[[cifra/...]]` no se valida en `scripts/validate.mjs` (paridad con el plugin); `source`/`person`/`org`/`event` sí.

### Medios de prensa en prosa

Medios = organizaciones `tipo: medio_comunicacion` en `entities.yaml`. Mencionarlos siempre como `[[org/id]]` (“según T13”, “reveló CIPER”). Estandariza el nombre visible y evita ambigüedades (“El País (Chile)” medio vs país).

- `nombre` canónico = lo que renderiza el wikilink (ej. `BioBioChile`, `El País (Chile)`). `sources.yaml:medio` debe usar el mismo nombre.
- `tipo: red_social` para Reddit/X/YouTube — solo complementarias, nunca fuente única. Metodología en `social-media.md`.
- ID `snake_case` del nombre (`el_pais`, `radio_universidad_chile`). Revisar `entities.yaml` antes de crear (~54 medios).
- Helper: `pnpm run add-source -- <URL>` mapea dominio → medio.

### Formato de citas (declaraciones)

```markdown
> Texto de la cita aquí - [[person/jose_antonio_kast]]
> Otra cita con fuente - [[person/jose_antonio_kast]] [[source/x-2026-07-20-kast-catastrofe]]
```

- Separador ` - ` (espacio-guion-espacio) antes de `[[person/...]]`.
- `[[source/...]]` va después de `[[person/...]]` en la misma línea.
- NO usar `"` ni `—` como separador. `extractEntities.ts` toma el último ` - [[person/...]]` como hablante.

### Citación inline

Fuentes **inline** al final de la afirmación, nunca en `## Referencias`:

```markdown
La bencina subió [[cifra/alza_bencina_mepco/370/pesos_por_litro]] [[source/latercera-2026-03-19-mepco-impacto-ipc]].
```

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
- Schema `content.config.ts` + `scripts/validate.mjs` validan.

## Dónde viven las entidades

| Entidad | Fuente | Acceso |
| --- | --- | --- |
| Personas | `entities.yaml > people` | `getPeopleRegistry()` |
| Organizaciones | `entities.yaml > organizations` | `getOrgsRegistry()` |
| Medios | `entities.yaml > organizations (tipo: medio_comunicacion)` | `getOrgsRegistry()` |
| Cifras | `entities.yaml > cifras` | `getCifrasRegistry()` |
| Fuentes | `sources.yaml` | `getSourcesRegistry()` |
| Temas | `topics.yaml` | `getTopicsRegistry()` |
| Colectivos | `colectivos.yaml` | array plano |
| Sectores | `sectores.yaml` | array plano |

`people`/`organizations`/`topics` están definidos en `content.config.ts` pero no existen como colecciones en disco — fluyen vía YAML + `registry.ts`. `extractEntities.ts` extrae wikilinks del `.md` crudo con regex cacheada.

## Patrones especiales

### Cifras en disputa: párrafo + tabla

Cuando fuentes no coinciden (conteos, plazas, montos — ej. `20260813-1` Cancerbero), además del párrafo que explica la desincronización, agregar tabla comparativa en la misma sección: cifra (`[[cifra/...]]`), fuente/emisor (`[[source/...]]`), contexto (qué mide, por qué difiere). Si se concilia, decirlo explícito y marcarlo en tabla. Registrar en `TAREAS/` solo lo pendiente real.

### Votaciones (`tipo: votacion`): conteos con fuente oficial

Verificar a favor/en contra/abstenciones en `senado.cl/actividad-legislativa/sala/votaciones` o `camara.cl/legislacion/sala_sesiones/votaciones.aspx` (`ProyectosDeLey/votaciones.aspx?prmBOLETIN=NNNNN-NN`). Citar URL concreta en `sources.yaml` (`medio: Senado de Chile`/`Cámara de Diputados`) y cada conteo como `[[cifra/...]]` (ej. `20260810-10`). Ver `.agents/skills/fuentes-gubernamentales/SKILL.md` → Poder Legislativo.
