# Prompt de Cargos y Períodos para Personas — Gobierno Vault

> **Uso:** Copia el prompt completo en ChatGPT, Claude, Gemini u otro LLM con acceso a internet.
> Reemplaza `{{PERSONA}}` por el stub de la persona (el frontmatter parcial que tengas).
> Sirve tanto para **crear** una ficha nueva como para **actualizar** una existente.
> El LLM retornará la ficha lista para pegar en `src/content/people/<id>.md`, con cada
> fecha trazada a su URL completa para verificación anti-alucinación.

---

## El Prompt

````text
Eres un investigador de datos públicos en Chile. Tu tarea es completar la ficha de una persona
para una wiki de eventos de gobierno: nombre completo, todos sus cargos con organización y
períodos (desde/hasta), cada dato con su fuente trazable.

## Persona a investigar (stub del vault)

{{PERSONA}}

Ejemplo de stub:
---
nombre: Raúl Clavero
cargo: Presidente de ChileTransporte
organizacion: chile_transporte
notas: Dirigente gremial del transporte de carga. En marzo de 2026 cifró en $15 por kilo cada 1.000 km el traspaso del alza del diésel.
---

## Instrucciones de investigación

1. **Paso 0 — Verificar entidades existentes en el vault ANTES de investigar.** El repositorio es público en GitHub: `https://github.com/Alplox/gobierno-vault`. Antes de proponer IDs, **debes verificar si la persona y sus organizaciones ya existen**:

   **Estrategia A — API de búsqueda de GitHub (recomendada):**
   ```
   GET <https://api.github.com/search/code?q={apellido_o_nombre}+repo:Alplox/gobierno-vault+path:src/content/people>
   ```
   Si la búsqueda en `people/` no da resultados, repite con `path:src/content/organizations` para cada organización de sus cargos.
   Si `total_count > 0`, la entidad **ya existe** — extrae el ID del filename (sin `.md`).

   **Estrategia B — Acceso directo al archivo (si conoces el ID probable):**
   ```
   GET <https://api.github.com/repos/Alplox/gobierno-vault/contents/src/content/people/{id_probable}.md>
   HTTP 200 = existe | HTTP 404 = no existe
   ```
   Ejemplo: para "Raúl Clavero" → consultar `people/raul_clavero.md`.
   Para organizaciones: `organizations/{id_probable}.md` (ej: `organizations/chile_transporte.md`).

   **Resultado:** para la persona y para CADA organización de sus cargos indica:
   - `EXISTE: src/content/people/{id}.md` u `EXISTE: src/content/organizations/{id}.md` → usa ese ID exacto
   - `NO EXISTE` → propone el ID snake_case y el bloque mínimo para crearla (ver BLOQUE 4)

   **Reglas de verificación:**
   - Busca por apellido Y por nombre completo (algunos IDs no son predecibles).
   - Si la persona tiene alias conocido, busca también por alias.
   - El campo `organizacion` en cada cargo debe ser un ID existente o propuesto — nunca texto libre con mayúsculas/espacios.

2. **Busca activamente en la web.** No inventes URLs ni fechas — solo incluye datos respaldados por fuentes encontradas.
3. **Prioriza fuentes primarias, en este orden:**
   a) BCN reseñas parlamentarias/biográficas (`bcn.cl/historiapolitica/...`) para autoridades electas y ministros
   b) Diario Oficial (`diariooficial.interior.gob.cl`) para nombramientos/ceses — `desde` = juramento/asunción, `hasta` = cesación
   c) InfoLobby (`leylobby.gob.cl/.../cargos-pasivos`) para cargos de confianza y jefaturas de gabinete
   d) Sitio oficial del organismo/gremio/empresa (página de directiva, memoria anual, comunicado de elección)
   e) `gob.cl`, ministerios, `senado.cl`, `camara.cl` para cargos públicos
   f) Prensa chilena reconocida (La Tercera, BioBioChile, Emol, El Mercurio, CIPER, Diario UChile, etc.) — obligatoria para dirigentes gremiales sin ficha oficial
4. **Nombre completo:** busca los DOS apellidos. Si solo encuentras un apellido en todas las fuentes, usa ese y marca `[VERIFICAR_SEGUNDO_APELLIDO]`.
5. **Todos los cargos, no solo el actual:** historial completo (ministro, subsecretario, parlamentario, alcalde, dirigente gremial, gerente, académico, etc.). Orden cronológico antiguo → reciente.
6. **Fechas solo verificables (`YYYY-MM-DD`):**
   - Cada `desde`/`hasta` debe tener al menos 1 URL completa que lo respalde, comentada inline (ver formato abajo).
   - Si una fecha tiene una sola fuente débil (ej: solo una nota de prensa), consérvala pero marca la línea con `[VERIFICAR]`.
   - **Rango a medias NO se registra:** un cargo con un solo extremo verificable (solo consta un año, o un sumario informa el cese pero no la asunción) NO va a `cargos[]` — se documenta en `notas` con su fuente.
   - **Nombramiento revocado antes de asumir NO lleva `cargos[]`:** si nunca ejerció, no hay período. Se explica en `notas` y el `cargo` top-level lo dice explícito ("Ex Seremi de X (nunca asumió)").
7. **No inventes datos.** Lo no confirmado por al menos 1 fuente con URL completa se marca `[VERIFICAR]` o `[URL_NO_ENCONTRADA]` — nunca se rellena con una fecha/URL plausible.

## Formato de salida

Retorna tu respuesta EXACTAMENTE en este orden, con los bloques separados por `---`:

### BLOQUE 0: VERIFICACIÓN DE ENTIDADES EXISTENTES (RESULTADO)

```
| Entidad | Tipo | Estado | Archivo |
|---------|------|--------|---------|
| Raúl Clavero | persona | EXISTE | src/content/people/raul_clavero.md |
| ChileTransporte | organización | EXISTE | src/content/organizations/chile_transporte.md |
```

### BLOQUE 1: FICHA COMPLETA (lista para pegar en `src/content/people/<id>.md`)

```yaml
---
nombre: "Nombre Completo Con Los Dos Apellidos"
cargo: "Cargo actual más relevante"          # rol vigente; si está cesado: "Ex <cargo>"
organizacion: id_organizacion_actual         # ID snake_case EXISTE o propuesto en BLOQUE 0
cargos:
  - cargo: "Cargo más antiguo"
    organizacion: id_org                     # ID snake_case, nunca texto libre
    desde: 2018-03-11 # <https://URL_COMPLETA_QUE_RESPALDA_EL_DESDE>
    hasta: 2022-03-11 # <https://URL_COMPLETA_QUE_RESPALDA_EL_HASTA>
  - cargo: "Cargo vigente"
    organizacion: id_org
    desde: 2023-06-01 # <https://URL_COMPLETA> + <https://SEGUNDA_URL_SI_HAY>
    # sin `hasta` = en ejercicio
aliases:
  - "Apellido"
  - "Alias conocido"
notas: "1-3 líneas: quién es, militancia/gremio si consta, hitos con fuente. Lo sin fecha verificable va aquí con su fuente, no en cargos[]."
---
```

**Reglas del BLOQUE 1:**
- `cargo`/`organizacion` top-level = rol ACTUAL (retrocompat con `/gabinete` y fichas). Si la persona falleció o está cesada en todo, `cargo` lleva `Ex ...` y `cargos[]` conserva el historial con `hasta`.
- **Trazabilidad obligatoria:** cada `desde`/`hasta` lleva comentario inline `# <URL completa>` (una o varias separadas por ` + `). Sin URL no hay fecha.
- ID del archivo: snake_case del nombre completo, sin tildes (`maria_eugenia_pintor`), `ñ` → `n` (`yanez`), con ambos apellidos para evitar colisiones de homónimos (`eduardo_frei_ruiz_tagle`, no `eduardo_frei`).
- `nombre` SÍ lleva tildes y `ñ`.
- Si la persona es autoridad de gobierno (ministro/biministro), el texto de `cargo` debe empezar con `Ministro/a de…` / `Biministro/a de…` para que la recoja `/gabinete`.

### BLOQUE 2: TABLA DE CARGOS CON EVIDENCIA (trazabilidad fina)

Una fila por cargo, para verificación humana rápida:

```
| # | Cargo | Organización (ID) | Desde | Hasta | Evidencia (URLs completas) |
|---|-------|-------------------|-------|-------|----------------------------|
| 1 | Presidente de ChileTransporte | chile_transporte | 2024-05-10 | vigente | <https://URL_1> (elección directiva) + <https://URL_2> (nota 2026 que lo nombra vigente) |
| 2 | ... | ... | ... | ... | ... |
```

- La columna Evidencia explica QUÉ prueba cada URL entre paréntesis (nombramiento, cese, vigencia, segundo apellido, etc.).
- Si un dato queda `[VERIFICAR]`, la evidencia lo dice explícito.

### BLOQUE 3: FUENTES (lista de URLs completas)

Para CADA URL citada en BLOQUE 1 y 2:

```
FUENTE_1:
  titulo: "Título exacto del artículo/documento"
  emisor: "Nombre del medio u organismo"
  fecha: YYYY-MM-DD
  url: <https://URL_COMPLETA>
  respalda: "qué dato(s) respalda (ej: desde del cargo #1, nombre completo)"

[Continuar para cada fuente — una por URL, sin agrupar]
```

### BLOQUE 4: ORGANIZACIONES NUEVAS (solo si el BLOQUE 0 marcó alguna como NO EXISTE)

Para CADA organización nueva:

```
ARCHIVO: src/content/organizations/{id_snake_case}.md
---
nombre: "Nombre Oficial de la Organización"
tipo: "tipo_de_organizacion"  # opciones: poder_ejecutivo | poder_legislativo | poder_judicial | municipalidad | servicio_publico | empresa_estatal | medio_comunicacion | red_social | organizacion_internacional | ong | universidad | think_tank | sindicato | gremio | otro
pais: Chile
---
```

- Un gremio de transporte/camioneros es `tipo: gremio`. Un ministerio es su tipo propio (verifica el ID existente antes de proponer).
- Nombre institucional completo, no sigla (`union_democrata_independiente`, no `udi`; la sigla va en `aliases[]`).

## Reglas críticas

1. **URLs SIEMPRE completas** — nunca la raíz del medio u organismo (correcto `https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/...`, incorrecto `https://www.bcn.cl`).
2. **No inventar URLs ni fechas** — si no encontraste la URL exacta, indica `[URL_NO_ENCONTRADA]` y describe dónde buscar.
3. **Cada fecha lleva su URL al lado.** Una fecha sin comentario `# https://...` es una alucinación hasta que se demuestre lo contrario.
4. **Rango parcial → `notas`, no `cargos[]`.** Cargo revocado antes de asumir → `notas`, no `cargos[]`.
5. **Idioma** — todo en español. **Neutralidad** — descriptivo, sin opiniones del investigador.
6. **Mínimo 2 fuentes independientes por cargo** cuando exista cobertura (para dirigentes con poca prensa, 1 fuente + `[VERIFICAR]` explícito).
7. **No duplicar entidades** — todo ID usado debe salir del BLOQUE 0.
````

---

## Ejemplo de uso

Pega el prompt y reemplaza `{{PERSONA}}` con algo como:

```yaml
---
nombre: Raúl Clavero
cargo: Presidente de ChileTransporte
organizacion: chile_transporte
notas: Dirigente gremial del transporte de carga. En marzo de 2026 cifró en $15 por kilo cada 1.000 km el traspaso del alza del diésel.
---
```

u otro stub parcial:

```yaml
---
nombre: Marta Herrera
cargo: Ministra de la Corte Suprema
notas: Solo consta 2009 como directora regional del Sence — verificar si es rango completo.
---
```

En el segundo caso el LLM debe devolver el cargo del Sence en `notas` con su fuente (rango a medias) y NO inventarle un `desde`/`hasta`.

---

## Flujo de trabajo recomendado

```
1. Copiar este prompt en tu LLM favorito (ChatGPT, Claude, Gemini)
2. Reemplazar {{PERSONA}} con el stub (nuevo o existente)
3. El LLM verificará entidades existentes vía API de GitHub (paso 0)
4. El LLM investigará en web y retornará los 5 bloques (0-4)
5. Revisar la salida — cada fecha debe tener su URL completa al lado
6. Revisar BLOQUE 0 — confirmar que los IDs EXISTE son correctos
7. Si hay orgs nuevas (BLOQUE 4) → crear src/content/organizations/{id}.md primero
8. Copiar BLOQUE 1 → crear o sobrescribir src/content/people/{id}.md
   (antes de sobrescribir: `git status` y `git diff` para no pisar edición concurrente)
9. Ejecutar: pnpm run validate
```

---

## Nota sobre validación

Este prompt genera un **borrador**. Después de importar al vault, ejecuta `pnpm run validate` para detectar:

- `organizacion` que no corresponde a un ID existente (revisar BLOQUE 0)
- Frontmatter incompleto o con campos inválidos
- Problemas de encoding (tildes en el ID, `ñ` en el filename)
- Fechas con doble zona horaria u otro formato no `YYYY-MM-DD`

Los archivos generados por el LLM necesitan **revisión humana** antes del commit.
El agente NUNCA commitea: deja los cambios en el working tree y el usuario decide.
