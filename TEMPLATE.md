# Plantilla de Evento

Ruta: `src/content/events/YYYY/MM/YYYYMMDD-N.md` (`N` secuencial del día). Ver `.agents/skills/content-model/SKILL.md` (modelo completo) y `.agents/skills/event-rules/SKILL.md` (16 reglas) para detalle.

## Frontmatter

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

# (requerido) Temas — IDs de topics.yaml, separados por coma
tema: emergencia, defensa_seguridad

# (opcional) Etiquetas libres — strings, sin taxonomy
etiquetas: sistema_frontal, estado_de_catastrofe

# (opcional) Impacto
impacto:
  colectivos: residentes, familias, pacientes   # IDs de colectivos.yaml
  sectores: agua_potable, energia_electrica     # IDs de sectores.yaml

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

## Cuerpo — markdown con wikilinks inline

Fuentes **siempre inline** al final de la afirmación, nunca en `## Referencias` separada. Ver `.agents/skills/content-model/SKILL.md`.

```markdown
## Qué pasó

El [[person/jose_antonio_kast]] anunció desde [[org/presidencia_chile]] la medida X [[source/latercera-2026-07-20-medida]].

## Cifras del balance

- [[cifra/fallecidos/5/personas]] fallecidos [[source/latercera-2026-07-20-balance]]
- [[cifra/damnificados/2205/personas]] damnificados [[source/biobio-2026-07-20-balance]]

Si cifras en disputa: párrafo que explica la desincronización + tabla comparativa (cifra | fuente | contexto). Ver `content-model.md`.

## Qué dijo

> Texto de la cita aquí - [[person/jose_antonio_kast]] [[source/x-2026-07-20-post]]

Separador ` - ` (espacio-guion-espacio) antes de `[[person/...]]`; `[[source/...]]` después. Sin `"` ni `—`.

## Votación (si tipo: votacion)

Verificar conteos en Senado/Cámara oficial y citar URL como fuente (`medio: Senado de Chile` / `Cámara de Diputados`), cada conteo como `[[cifra/...]]`. Ver `content-model.md`.

Relaciones en prosa: `ver evento 20260618-3` auto-enlaza si existe; o `[[event/20260720-1]]` explícito.

No dejar notas de editor en el body (`ver TAREAS`, `pendiente verificación` etc. → van a `TAREAS/` con `Origen:`). `validate.mjs` hace fallar el build. Cross-refs de eventos sí válidos.
```

## Sintaxis de wikilinks

| Sintaxis | Uso | Render |
| --- | --- | --- |
| `[[person/id]]` | Persona | `<span class="entity-ref">Nombre</span>` |
| `[[org/id]]` | Organización / medio | `<span class="entity-ref">Nombre</span>` |
| `[[source/id]]` | Fuente | `[N]` con tooltip → `#ref-N` |
| `[[cifra/concepto/valor/unidad]]` | Dato numérico | `<span class="cifra-badge">valor</span>` |
| `[[event/20260720-1]]` | Evento | `<a class="event-ref">Título</a>` |

- Fuentes se numeran por primera aparición; repeticiones reutilizan número.
- IDs desnudos `\b20\d{6}-\d{1,3}\b` (ej. `20260618-3`) auto-enlazan si el evento existe (`remarkWikiLinks.mjs`).
- Medios en prosa siempre como `[[org/id]]` (`tipo: medio_comunicacion` en `entities.yaml`). Ver `content-model.md`.

## Notas y checklist (ver `.agents/skills/event-rules/SKILL.md`)

- `tema` / `impacto.colectivos` / `impacto.sectores` usan IDs de `topics.yaml` / `colectivos.yaml` / `sectores.yaml`; si falta, agregarlo.
- Nueva persona/org/cifra → `entities.yaml`; nueva fuente → `sources.yaml` (ID `medio-YYYY-MM-DD-slug`, URL completa nunca raíz, guarda URL original nunca mirror). Consultar catálogo sitemaps ANTES de buscar en web: `rg -i -uu -g '*.jsonl' '<términos>' sitemaps`.
- `validate.mjs` falla si el nombre completo o el apellido de una persona enlazada aparece sin `[[person/...]]` (fix: `node scripts/fix-prose-wikilinks.mjs --dry-run`).
- Al crear por TAREAS: mínimo **5 fuentes** de medios distintos, nunca red social sola; tras la tanda `pnpm run generate-index` + eliminar fila de `TAREAS/`; `pnpm run validate` / `pnpm run build` debe pasar. Fechas `creado`/`actualizado` en `YYYY-MM-DD`.
