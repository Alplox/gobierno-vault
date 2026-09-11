# Prompt de Investigación para Gobierno Vault

> **Uso:** Copia este prompt completo en ChatGPT, Claude, Gemini u otro LLM con acceso a internet.
> Reemplaza `{{TOPIC}}` por el tema o evento que quieras investigar.
> El LLM retornará datos listos para copiar al vault.

---

## El Prompt

```
Eres un investigador de datos públicos en Chile. Tu tarea es investigar el siguiente tema y retornar la información en un formato estructurado específico que será importado a una wiki de eventos de gobierno.

## Tema a investigar

{{TOPIC}}

## Instrucciones de investigación

1. **Paso 0 — Verificar entidades existentes en el vault ANTES de investigar.** El repositorio es público en GitHub: `https://github.com/Alplox/gobierno-vault`. Antes de proponer crear cualquier persona u organización, **debes verificar si ya existen** usando estas estrategias (en orden de preferencia):

   **Estrategia A — API de búsqueda de GitHub (recomendada):**
   Consulta la API de búsqueda de código para ver si el nombre aparece en el vault:
   ```
   GET https://api.github.com/search/code?q={apellido_o_nombre}+repo:Alplox/gobierno-vault+path:src/content/people
   ```
   Si la busqueda en `people/` no da resultados, repite con `path:src/content/organizations`.
   La respuesta incluye `total_count` y los archivos encontrados en `items[].path`.
   Si `total_count > 0`, la entidad **ya existe** — extrae el ID del filename (sin `.md`).

   **Estrategia B — Acceso directo al archivo (si conoces el ID probable):**
   Si ya sabes cómo se llamaría el archivo (snake_case del nombre), consulta directamente:
   ```
   GET https://api.github.com/repos/Alplox/gobierno-vault/contents/src/content/people/{id_probable}.md
   HTTP 200 = existe | HTTP 404 = no existe
   ```
   Ejemplo: para "José Antonio Kast" → consultar `people/jose_antonio_kast.md`

   **Estrategia C — Listar directorio (para medios de comunicación):**
   Para verificar si un medio ya está registrado como organización:
   ```
   GET https://api.github.com/search/code?q={nombre_del_medio}+repo:Alplox/gobierno-vault+path:src/content/organizations
   ```

   **Resultado de la verificación:** Para cada persona/organización identificada en la investigación, indica en tu respuesta:
   - `EXISTE: src/content/people/{id}.md` → usa ese ID en los wikilinks `[[people/{id}]]`
   - `NO EXISTE` → genera el bloque completo para crear el archivo nuevo

   **Reglas de verificación:**
   - Las ~1050 organizaciones y ~1500 personas del vault son públicas. Siempre verifica.
   - Busca por apellido Y por nombre completo (algunos IDs no son predecibles).
   - Si el medio de prensa es chileno, probablemente ya exista como `tipo: medio_comunicacion` — verifica antes de proponer crearlo.
   - Si una persona tiene un alias conocido (ej: "JAK" para Kast), busca también por alias.

2. **Busca activamente en la web** usando las herramientas de búsqueda disponibles. No inventes URLs ni citas — solo incluye información respaldada por fuentes encontradas.
3. **Prioriza fuentes primarias:** sitios oficiales del gobierno (presidencia.cl, ministerios, BCN/leychile.cl, senado.cl, camara.cl), medios de prensa chilenos reconocidos (La Tercera, BioBioChile, Emol, El Mercurio, CIPER, Diario UChile, The Clinic, etc.), y agencias internacionales si es relevante.
4. **Busca al menos 5 fuentes distintas** de medios diferentes. Nunca uses una sola fuente.
5. **Extrae citas textuales** cuando las haya, con mención explícita de quién dijo qué.
6. **Identifica todas las personas y organizaciones** involucradas.
7. **Si hay cifras numéricas** (presupuesto, votaciones, conteos), regístralas con su fuente.
8. **No inventes datos.** Si algo no está confirmado por al menos 2 fuentes, márcalo como [VERIFICAR].

## Formato de salida

Retorna tu respuesta EXACTAMENTE en este orden, con los siguientes bloques separados por `---`:

### BLOQUE 0: VERIFICACIÓN DE ENTIDADES EXISTENTES (RESULTADO)

Antes de los demás bloques, muestra una tabla resumen de la verificación:

```
| Entidad | Tipo | Estado | Archivo |
|---------|------|--------|---------|
| José Antonio Kast | persona | EXISTE | src/content/people/jose_antonio_kast.md |
| María González | persona | NUEVA | src/content/people/maria_gonzalez.md |
| La Tercera | organización | EXISTE | src/content/organizations/la_tercera.md |
| Observatorio Fiscal | organización | NUEVA | src/content/organizations/observatorio_fiscal.md |
```

Esto permite al usuario saber de entrada qué hay que crear vs. qué ya existe y solo se reutiliza.

### BLOQUE 1: EVENTO (formato YAML + Markdown)

```yaml
---
titulo: "Descripción breve y objetiva del evento (máx 150 caracteres)"
fecha: YYYY-MM-DDTHH:MM:SSZ        # ISO 8601 UTC — usa la fecha real del evento
tipo: declaracion                    # opciones: declaracion | accion | anuncio | decreto | proyecto | ley | votacion | fallo_judicial | entrevista | publicacion | documento | investigacion | reaccion | resultado
tema: tema1, tema2                   # IDs de temas existentes o propuestos (snake_case, ej: administracion_publica, politica)
etiquetas: etiqueta1, etiqueta2      # palabras clave libres
impacto:
  colectivos: colectivo1, colectivo2 # si aplica
  sectores: sector1, sector2         # si aplica
creado: YYYY-MM-DD                   # fecha de hoy
actualizado: YYYY-MM-DD              # fecha de hoy
---

## Qué pasó

Narrativa factual del evento. Menciona personas como [[people/id_persona]] y organizaciones como [[organizations/id_org]]. Cita fuentes inline al final de cada afirmación como [[sources/id_fuente]].

## Qué dijo

> "Cita textual exacta" - [[people/id_persona]] [[sources/id_fuente]]

> "Otra cita" - [[people/id_persona]] [[sources/id_fuente]]

## Cifras del evento

- [[cifras/concepto/valor/unidad]] [si aplica y es cifra nacional]

## Contexto

Relación con eventos previos, antecedentes relevantes. Usa [[events/ID]] si conoces IDs previos.
```

**IMPORTANTE sobre los wikilinks en el BLOQUE 1:**
- Para personas/orgs que **EXISTEN** en el vault (según BLOQUE 0): usa el ID exacto del archivo existente.
- Para personas/orgs **NUEVAS** (según BLOQUE 0): usa el ID propuesto en el BLOQUE 0 — el usuario creará el archivo antes del build.

### BLOQUE 2: FUENTES (lista de URLs completas)

Para CADA fuente usada, proporciona:

```
FUENTE_1:
  titulo: "Título exacto del artículo"
  medio: "Nombre del medio de comunicación"
  autor: "Nombre del autor" (si está disponible, si no: "Redacción")
  fecha: YYYY-MM-DD
  url: https://URL_COMPLETA_DEL_ARTICULO

FUENTE_2:
  titulo: "..."
  medio: "..."
  autor: "..."
  fecha: YYYY-MM-DD
  url: https://...

[Continuar para cada fuente — mínimo 5]
```

### BLOQUE 3: PERSONAS NUEVAS (archivos .md para crear)

Solo incluye personas que el BLOQUE 0 marcó como `NO EXISTE`. **No dupliques personas que ya están en el vault.**

Para CADA persona nueva, genera el archivo:

```
ARCHIVO: src/content/people/{id_snake_case}.md
---
nombre: "Nombre Completo"
cargo: "Cargo más relevante en el contexto del evento" (si aplica)
cargos:
  - cargo: "Cargo"
    organizacion: "id_organizacion"
    desde: YYYY-MM-DD (si aplica)
aliases:
  - "Apellido"
  - "Alias conocido"
---
```

**Reglas para IDs de personas:**
- snake_case del nombre completo (ej: `jose_antonio_kast`)
- Sin tildes en el ID pero SÍ en el campo `nombre` (ej: ID `maria_eugenia_pintor`, nombre `María Eugenia Pintor`)
- Si el apellido tiene ñ, reemplazar por n en el ID (ej: `yanez` no `yáñez`)

### BLOQUE 4: ORGANIZACIONES NUEVAS (archivos .md para crear)

Solo incluye organizaciones que el BLOQUE 0 marcó como `NO EXISTE`. **No dupliques organizaciones que ya están en el vault.**

Para CADA organización nueva, genera:

```
ARCHIVO: src/content/organizations/{id_snake_case}.md
---
nombre: "Nombre Oficial de la Organización"
tipo: "tipo_de_organizacion"  # opciones: poder_ejecutivo | poder_legislativo | poder_judicial | municipalidad | servicio_publico | empresa_estatal | medio_comunicacion | red_social | organizacion_internacional | ong | universidad | think_tank | sindicato | gremio | otro
pais: Chile
---
```

**Tipos comunes para medios:**
- `medio_comunicacion` — periódicos, portales web de noticias
- `canal_television` — canales de TV
- `programa_tv` — programas específicos
- `red_social` — Reddit, X, YouTube (solo complementarias)

### BLOQUE 5: TEMAS (archivos .md para crear, solo si son nuevos)

Si el evento requiere un tema que probablemente no exista:

```
ARCHIVO: src/content/topics/{id_snake_case}.md
---
nombre: "Nombre legible del tema"
descripcion: "Descripción breve del tema (1 línea)"
relacionados:
  - tema_relacionado_1
  - tema_relacionado_2
---
```

### BLOQUE 6: CIFRAS (archivos .md para crear, solo si aplica)

Solo para cifras de carácter **nacional/país** (series INE, presupuesto nacional, votaciones del Congreso). NO incluir cifras locales/municipales.

```
ARCHIVO: src/content/cifras/{concepto}.md
---
nombre: "Nombre de la cifra"
unidad_default: "personas | pesos | porcentaje | escaños | etc"
aliases:
  - "alias_alternativo"
fuente_oficial: "Organismo que publica la cifra"
---
```

## Reglas críticas

1. **URLs SIEMPRE completas** — nunca la raíz del medio (ej: correcto `https://www.latercera.com/politica/2026/...`, incorrecto `https://latercera.com`)
2. **No inventar URLs** — si no encontraste la URL exacta, indica [URL_NO_ENCONTRADA] y describe dónde buscar
3. **Cifras en disputa** — si dos medios reportan cifras diferentes, documentar ambas con su fuente
4. **Citas textuales** — marcar con comillas y origen exacto
5. **Idioma** — todo en español
6. **Neutralidad** — narrativa factual, sin opiniones del investigador
7. **Mínimo 5 fuentes** de medios diferentes
8. **Fuentes primarias primero** — antes de un medio que cita un comunicado, buscar el comunicado original
```

---

## Ejemplo de uso

Reemplaza `{{TOPIC}}` con algo como:

- `Decreto que modifica la Ley de Vagancia y Embriaguez, publicado en septiembre 2026`
- `Nombramiento de nuevo ministro de Hacienda en 2026`
- `Votación del proyecto de ley de 40 horas en el Senado, agosto 2026`
- `Terremoto que afectó la región de Valparaíso en 2026, balance de daños y respuesta del gobierno`
- `Polémica por contratación de jóvenes con altos sueldos en el gobierno, septiembre 2026`

---

## Flujo de trabajo recomendado

```
1. Copiar este prompt en tu LLM favorito (ChatGPT, Claude, Gemini)
2. Reemplazar {{TOPIC}} con el tema de investigación
3. El LLM verificará entidades existentes vía API de GitHub (paso 0)
4. El LLM investigará en web y retornará los 7 bloques
5. Revisar la salida — verificar URLs y cifras
6. Revisar BLOQUE 0 — confirmar que las entidades marcadas como EXISTE son correctas
7. Copiar BLOQUE 2 (fuentes) → crear archivos src/content/sources/{medio-YYYY-MM-DD-slug}.md
8. Copiar BLOQUE 3 (personas nuevas) → crear archivos src/content/people/{id}.md
9. Copiar BLOQUE 4 (organizaciones nuevas) → crear archivos src/content/organizations/{id}.md
10. Copiar BLOQUE 1 (evento) → crear archivo src/content/events/YYYY/MM/YYYYMMDD-N.md
11. Ejecutar: pnpm run generate-index
12. Ejecutar: pnpm run validate
```

---

## Nota sobre validación

Este prompt genera un **borrador**. Después de importar al vault, ejecuta `pnpm run validate` para detectar:
- Wikilinks rotos (personas/orgs/fuentes que no existen)
- URLs de fuentes que devuelven 404
- Frontmatter incompleto o con campos inválidos
- Problemas de encoding (tildes, ñ)

Los archivos generados por el LLM necesitan **revisión humana** antes del commit.
