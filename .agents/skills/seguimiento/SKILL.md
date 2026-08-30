---
name: seguimiento
description: Seguimiento de desenlaces, ampliaciones y verificaciones con IDs estables S/A/V-YYYY-NNN en TAREAS/SEGUIMIENTO/. Usa esta skill SIEMPRE al registrar, retomar o cerrar un seguimiento, verificar una cifra en disputa o ampliar cobertura, incluso si solo dice 'hacer seguimiento' o 'verificar desenlace'.
---

# Seguimiento — IDs, tipos y catálogo

> Cuándo cargar: vas a tocar `TAREAS/SEGUIMIENTO/` o `TAREAS/SEGUIMIENTO_INDEX.md`, necesitas retomar una tarea con ID (`S-2026-042`), registrar un nuevo seguimiento, o el usuario dice “haz tarea de seguimiento A2”.
> **Handoff:** si cambias el formato de fila, la taxonomía `S/A/V` o el generador de índice, actualiza este skill en la misma sesión.

## Estructura

```
TAREAS/
  SEGUIMIENTO/           # un archivo por año (replica PENDIENTES/)
    2026.md
    2025.md
    2024.md
    TRANSVERSAL.md       # multi-año (Cuentas Públicas transversales, estallido)
    AMPLIACIONES.md      # deuda de cobertura (ver abajo)
  SEGUIMIENTO_INDEX.md   # catálogo auto-generado — NO editar a mano
  SEGUIMIENTO.md         # README redirigido (3 líneas)
```

- **Por qué por año:** permite `read TAREAS/SEGUIMIENTO/2026.md` en vez del monolito de 158KB.
- **`SEGUIMIENTO_INDEX.md`** se genera con `pnpm run generate-seguimiento-index` (lee `SEGUIMIENTO/*.md`, valida IDs únicos y `Origen:`).
- **Formato `YYYY.md`:** tabla corta por ID (parseable con `rg`) + sección `## Detalle` con el texto operativo completo de cada tarea (qué registrar, desenlaces esperados) agrupado por bucket. La columna Título de la tabla es un resumen corto y puede terminar en `...` — el detalle completo siempre está en `## Detalle` del mismo archivo.
- **Origen:** `scripts/restore-seguimiento-detail.mjs` restauró el `## Detalle` desde el monolito original (`git show HEAD:TAREAS/SEGUIMIENTO.md`) tras una migración que truncó los títulos (reporte en `SEGUIMIENTO/_restore-report.md`).
- `TAREAS/SEGUIMIENTO.md` monolito original queda como README que apunta al índice.

## Taxonomía (tipo en ID)

| Prefijo | Significado | Ejemplo |
| --- | --- | --- |
| `S` | **Seguimiento** — evento ya existe, se espera desenlace (fallo judicial, votación, respuesta a oficio, informe, publicación) | `S-2026-042` Manouchehri oficio a La Moneda — respuesta Presidencia |
| `A` | **Ampliación** — evento existe pero falta 2ª fuente, cifra, ángulo o cobertura | `A-2026-015` Causa Gatica — segunda fuente chilena para `20260113-1` |
| `V` | **Verificación** — cifra/tabla en disputa que requiere fuente oficial | `V-2026-011` Sanción APA pollos — conciliar 20.000 vs 2.000 UTA |

Filtra por tipo: `rg "^\\| S-" TAREAS/SEGUIMIENTO_INDEX.md` (solo seguimientos).

## Formato de ID y fila canónica

**ID:** `S-YYYY-NNN` (o `A-YYYY-NNN`, `V-YYYY-NNN`) — 3 dígitos, secuencial por año, estable. No se reutiliza tras eliminar (como `YYYYMMDD-N` de eventos).

**Fila (una línea, parseable con `rg`):**

```markdown
| S-2026-042 | ⬜ | 2026-08-25 | Cuentas Públicas — seguimiento | Manouchehri oficio a La Moneda — respuesta Presidencia + citación Irarrázaval | `20260821-8` | Origen: <https://www.biobiochile.cl/...> |
```

Campos: `ID | estado ⬜/🟡 | fecha detección YYYY-MM-DD | bucket (primer header ##) | título corto | evento(s) base `YYYYMMDD-N` | Origen: <url>`

- `Orígen:` obligatorio con URL (si es red social, además URL de prensa que valida) — `generate-seguimiento-index` falla sin él.
- Estado: `⬜ pendiente`, `🟡 parcial` (avance sin cierre), nunca `✅` en el archivo (al cerrar, la fila se **elimina** como en `PENDIENTES/`, el hecho queda en `EVENTS_INDEX.md` + `git log`).

## Flujo para agentes

1. **Registrar nuevo seguimiento:** añade fila con nuevo ID en `TAREAS/SEGUIMIENTO/YYYY.md` (o `AMPLIACIONES.md` si es deuda de cobertura) con `Origen:`.
2. **Retomar tarea por ID:** `rg "S-2026-042" TAREAS/SEGUIMIENTO_INDEX.md` → te da fila + archivo fuente (`2026.md:42`). Luego `read TAREAS/SEGUIMIENTO/2026.md` solo ese año.
3. **Cerrar tarea:** al crear el evento o verificar el desenlace, **elimina la fila** del `YYYY.md` y corre `pnpm run generate-seguimiento-index` (regenera índice) + `pnpm run generate-index` si creaste evento. No dejes `✅`.

## Comandos

```bash
# ver catálogo (sin leer 158KB) — portable (sin | head, falla en PowerShell)
rg "S-2026-042" TAREAS/SEGUIMIENTO_INDEX.md
rg "^\| S-" TAREAS/SEGUIMIENTO_INDEX.md
# alternativa con límite: rg --max-count 20 "^\| S-" TAREAS/SEGUIMIENTO_INDEX.md
# PowerShell si necesitas paginar: rg "^\| S-" TAREAS/SEGUIMIENTO_INDEX.md | Select-Object -First 20

# leer solo el año relevante
read TAREAS/SEGUIMIENTO/2026.md

# regenerar índice tras editar SEGUIMIENTO/
pnpm run generate-seguimiento-index
node scripts/generate-seguimiento-index.mjs --dry-run  # solo valida IDs sin escribir
```

## Qué va dónde

- **SEGUIMIENTO/YYYY.md:** tabla por ID + `## Detalle` por bucket (heredado del monolito: `## Cuentas Públicas — seguimiento`, `## Caso Junaeb — desenlace`, `## Metro Santa Isabel`, `## Codelco`, etc.), cada bullet `- **ID** estado — texto completo con `Registro: (1)...` / `Verificar: ...` y desenlace esperado. Al registrar una tarea nueva: fila en la tabla + bullet en `## Detalle`.
- **AMPLIACIONES.md:** índice rápido de las filas `A-` (deuda de cobertura: "verificar segunda fuente", "falta cobertura chilena", "cifra sin confirmar"). Las filas viven en los YYYY.md; no registrar aquí.
- **Retomar una tarea:** `rg "S-2026-042" TAREAS/SEGUIMIENTO_INDEX.md` para la fila, y `rg -A 1 "S-2026-042" TAREAS/SEGUIMIENTO/2026.md` (o `read` del archivo) para el detalle en `## Detalle`.

## Validación

`scripts/generate-seguimiento-index.mjs` valida IDs únicos, estados permitidos (`⬜`/`🟡`), y que cada `⬜` tenga `Origen: <https://`>. Falla si hay duplicado o fila sin Origen (como `validate.mjs` para wikilinks).
