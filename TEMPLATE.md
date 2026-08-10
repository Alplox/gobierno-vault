# Plantilla de Evento

Ruta: `src/content/events/YYYY/MM/YYYYMMDD-N.md`

## Frontmatter

```yaml
---
# (requerido) Titulo del evento
titulo: Descripcion breve y objetiva del evento

# (requerido) Fecha y hora de ocurrencia (ISO 8601)
fecha: YYYY-MM-DDTHH:MM:SSZ

# (requerido) Tipo de evento
tipo: decreto
# opciones: declaracion | accion | anuncio | decreto | proyecto | ley |
#           votacion | fallo_judicial | entrevista | publicacion |
#           documento | investigacion | reaccion | resultado

# (requerido) Temas asociados (separados por coma)
tema: emergencia, defensa_seguridad

# (opcional) Etiquetas libres (separadas por coma)
etiquetas: sistema_frontal, estado_de_catastrofe

# (opcional) Impacto del evento
impacto:
  # Grupos de personas afectados
  colectivos: residentes, familias, pacientes
  # Actividades economicas/sectores afectados
  sectores: agua_potable, energia_electrica, transporte_publico

# (opcional) Relaciones con otros eventos
# formato: tipo_relacion: id_evento
relaciones:
  sucesor: 20260101-1
  causa: 20251215-3

# (opcional) Respaldo ASCII de una imagen del evento (evidencia visual)
# fuente: URL de la imagen original (el enlace de donde salió)
# Opción A (recomendada, SVGs reales pesan MBs): archivo .svg en public/img-to-ascii/
archivo: /img-to-ascii/20260809-8-zanja.svg
# Opción B (solo SVG pequeño artesanal <=100K chars): contenido inline
# svg: |
#   <svg ...>...</svg>
# El SVG se genera en una herramienta web externa (ej. https://ezascii.com/image-to-ascii)
# y se guarda tras CONFIRMAR VISUALMENTE que se ve correcto. Nunca guardar un SVG
# sin esa confirmación. El sitio lo renderiza en el body con una leyenda + enlace.

# (requerido) Fecha de creacion del registro
creado: YYYY-MM-DD

# (requerido) Fecha de ultima actualizacion
actualizado: YYYY-MM-DD
---
```

## Cuerpo del documento

Usar markdown estandar con wikilinks para entidades:

```markdown
## Que paso

El [[person/jose_antonio_kast]] anuncio desde [[org/presidencia_chile]]...

## Cifras del balance

- [[cifra/fallecidos/5/personas]] fallecidos [[source/latercera-2026-07-20-balance]]
- [[cifra/damnificados/2205/personas]] damnificados [[source/biobio-2026-07-20-balance]]

## Que dijo

> Cita textual - [[person/jose_antonio_kast]] en X [[source/x-2026-07-20-post]]

## Acciones registradas

- Accion realizada. [[source/cnn-2026-07-20-accion]]
```

## Sintaxis de wikilinks

| Sintaxis | Uso | Render en body |
|---|---|---|
| `[[person/id]]` | Referenciar persona | `<span class="entity-ref">Nombre</span>` (sin link) |
| `[[org/id]]` | Referenciar organizacion | `<span class="entity-ref">Nombre</span>` (sin link) |
| `[[source/id]]` | Referenciar fuente | `[N]` con tooltip y ancla a Referencias |
| `[[cifra/concepto/valor/unidad]]` | Dato numerico | `<span class="cifra-badge">valor</span>` |

- Las fuentes se numeran secuencialmente por primera aparicion.
- La misma fuente reutiliza su numero en todas sus repeticiones.
- Las personas, organizaciones y cifras generan tags automaticos en la seccion final.

## Notas

- `tema` debe usar IDs existentes en `src/data/topics.yaml` o `src/content/topics/`.
- `etiquetas` son strings libres (sin vinculo a taxonomy).
- Las relaciones apuntan al ID del archivo (sin extension), ej: `20260720-1`.
- Las fechas de `creado` y `actualizado` usan formato `YYYY-MM-DD`.
