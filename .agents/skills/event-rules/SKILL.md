---
name: event-rules
description: Reglas de creación y validación de eventos, checklist de 16 reglas, enforcement de wikilinks en prosa y ciclo TAREAS. Usa esta skill SIEMPRE al crear o editar eventos, tocar src/content/people|organizations|sources|cifras|topics, registrar TAREAS/PENDIENTES o cuando validate.mjs falle por wikilink/URL, incluso si no mencionan 'reglas'.
---

# Reglas para crear/modificar eventos

> Cuándo cargar: vas a crear o editar eventos, tocar `src/content/people|organizations|sources|cifras|topics/*.md` o `src/data/colectivos.yaml|sectores.yaml`, o registrar/retomar tareas en `TAREAS/`. Para frontmatter y wikilinks ver `content-model.md` (plantilla copiable en `.agents/skills/content-model/SKILL.md#plantilla-copiable`).
> **Handoff:** si cambias las reglas de creación/validación, TAREAS o el enforcement de `validate.mjs`, actualiza este skill en la misma sesión.

## Checklist de 16 reglas

1. **Archivos:** `src/content/events/YYYY/MM/YYYYMMDD-N.md` — `N` secuencial del día.
2. **Frontmatter:** todos requeridos excepto `etiquetas`, `impacto`, `relaciones`.
3. **`tema`:** IDs de `src/content/topics/*.md`; si falta, agregarlo.
4. **`etiquetas`:** strings libres.
5. **`impacto.colectivos`:** IDs de `src/data/colectivos.yaml` (excepción YAML).
6. **`impacto.sectores`:** IDs de `src/data/sectores.yaml` (excepción YAML).
7. **`relaciones`:** `tipo: id` sin extensión (ej. `20260720-1`). No duplicar bidireccional.
8. **Wikilinks en body:** siempre que menciones persona/org/fuente/cifra, usa wikilink `[[people/]]`/`[[organizations/]]`/`[[sources/]]`/`[[cifras/]]`/`[[events/]]`. Ver detalle abajo.
9. **Fuentes:** agregar a `src/content/sources/<id>.md` si es nueva. ID `medio-YYYY-MM-DD-slug`. **Siempre inline**, nunca `## Referencias`.
10. **URLs de fuentes:** nunca raíz/dominio; siempre URL completa del artículo. Si paywall sin URL exacta, usa secundaria que cite original + `notas` en YAML. Para paywall usar mirrors de `tools.md`. **Prioriza fuente gubernamental directa antes que prensa** — ver `.agents/skills/fuentes-gubernamentales/SKILL.md` (skill) para reducir sesgo.
11. **Personas/orgs nuevas:** agregar a `src/content/people/*.md` o `src/content/organizations/*.md`.
12. **Cifras nuevas:** agregar a `src/content/cifras/*.md`.
13. **Prohibido notas de editor en body:** no dejar `Nota de verificación`, `ver TAREAS*`, `para seguimiento`, `pendiente de validación`, `pendiente el desenlace`, **ni contenido meta-editorial sobre decisiones de edición** (`Matiz sobre sesgo`, `No se agregan como fuentes`, `complementarios por definición`, `reduce el riesgo de reinterpretación`, `medio con línea editorial... para contrastar sesgo`, `ilustran polarización pero no aportan dato`, `Validación cruzada` como sección que justifica selección de fuentes) como justificación en body). El body solo contiene hechos; cross-refs `[[events/ID]]` sí válidos (wikilink explícito, no `(ver evento X)`). Lo pendiente o la justificación de por qué se incluyó/excluyó una fuente va a `TAREAS/` con `⬜`/`🟡` o al mensaje de commit/PR, nunca al evento. `scripts/validate/validate.mjs` hace fallar el build si detecta el patrón (ver `content-model.md` → Prohibido contenido meta-editorial). Excepción: eventos-tracker diseñados (ej. `20250822-1`).
14. **Consultar catálogo sitemaps ANTES de buscar en web** para medios con sitemap local (ver `sitemaps.md`). Buscar con `rg -i --no-heading -uu '<términos>' sitemaps/<slug>/` o `rg -i -uu -g '*.jsonl' '<términos>' sitemaps`. Entrega URL+fecha (+título si news-sitemap). Luego leer URL con `read_url`/mirrors. El catálogo no trae el cuerpo.
15. **Cifras en disputa:** párrafo + tabla comparativa (ver `content-model.md`).
16. **Votaciones:** conteos con fuente oficial Senado/Cámara + `[[cifras/...]]` (ver `content-model.md`).

## Detalle regla 8 — enforcement de wikilinks en prosa

`scripts/validate/validate.mjs` falla si:
- (a) el **nombre completo** de una persona en `src/content/people/*.md` aparece en prosa sin `[[people/id]]`, o
- (b) una persona **ya enlazada** en el evento se menciona luego por apellido distintivo (“Kast” tras el primer enlace).

Detección compartida con el fixer `scripts/lib/proseNames.mjs` — omite: apellidos ambiguos (dos personas con mismo apellido enlazadas), apellidos precedidos por nombre de pila (“Fernando Matthei” ≠ Evelyn), prefijos de org (“Fundación Kast”), apellidos de 3 letras que son palabras comunes (“del”, “san”, “mas”).

Fixer: `node scripts/validate/fix-prose-wikilinks.mjs` (itera hasta punto fijo; `--dry-run` para revisar). Las regex de validate/fixer y `generate-index` son tolerantes a CRLF (`\r?\n`) por `core.autocrlf=true`.

## URLs y fuentes — ampliado (regla 10)

- NUNCA `<https://lasegunda.com/>` raíz. Siempre artículo específico.
- Mirrors para paywall (guardar SIEMPRE URL original en `src/content/sources/<id>.md`, nunca la del mirror): `paywallskip.com`, `r.jina.ai`, `defuddle.md`, `markdown.new`, `archive.ph` + cadena `pnpm run fetch-content` (ver `tools.md`).
- **Fuente directa primero:** antes de prensa privada, intenta la fuente gubernamental que genera el dato (Presidencia, ministerio, BCN, Cámara/Senado, servicio). Ver `.agents/skills/fuentes-gubernamentales/SKILL.md` — tablas por ministerio/servicio/legislativo con URLs y notas de uso.
- **URLs bare (MD034):** en prosa Markdown los URLs sueltos van envueltos `<https://...>` (los de `[](...)` y `<...>` quedan como están). En frontmatter YAML **sin** `<>` (`fuente: https://...` — rompe `validate`). Fix en lote idempotente: `node scripts/validate/fix-md034.mjs` (salta frontmatter y code blocks).

## TAREAS — bitácora de pendientes anti recency bias

Vive en `TAREAS/`. No hay `TAREAS.md` raíz ni archivo de completadas — lo hecho queda en `EVENTS_INDEX.md` + `git log`.

- `TAREAS/PENDIENTES/YYYY.md` — `⬜ pendiente`/`🟡 parcial` por año (2016, 2019-2026)
- `TAREAS/PENDIENTES/TRANSVERSALES.md` — sin año único
- `TAREAS/SEGUIMIENTO/YYYY.md` — seguimiento activo por año con IDs `S/A/V-YYYY-NNN` (Cuentas Públicas, desenlaces judiciales, tandas de fuentes) + catálogo `TAREAS/SEGUIMIENTO_INDEX.md`

**Al detectar un pendiente que no se implementará ahora:** registrar en `TAREAS/PENDIENTES/YYYY.md` o `TAREAS/SEGUIMIENTO/YYYY.md` con fecha, tipo sugerido, estado `⬜`, y **origen obligatorio `Origen: <url>`** (si es red social, además URL de prensa que lo valida).

**Al completarse:** la fila **se ELIMINA** del archivo de pendientes — no queda con `✅`. Si un seguimiento conserva pendientes activos, reescribir conservando solo `⬜`/`🟡` y descartando lo hecho.

**Para retomar una tarea:**
1. Crear evento siguiendo `.agents/skills/content-model/SKILL.md#plantilla-copiable` (plantilla copiable)
2. Mínimo 5 fuentes de medios distintos, nunca red social como fuente única
3. Eventos 2019-2021 (era Piñera) necesitan entidades nuevas en `src/content/people|organizations/*.md`
4. Tras cada tanda: `pnpm run generate-index` + verificar 0 fuentes huérfanas
5. Eliminar fila de `TAREAS/` (queda documentado por ID del evento creado)

Usuario valida con `pnpm run build`.
