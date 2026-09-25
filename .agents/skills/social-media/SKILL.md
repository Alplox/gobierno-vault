---
name: social-media
description: Reacciones comunitarias y verificación de imágenes/audios virales en Reddit, X, Facebook, Instagram, TikTok y YouTube. Usa esta skill SIEMPRE al documentar reacciones ciudadanas, extraer comentarios o verificar imagen/audio viral, incluso si solo dice 'agregar reacciones'.
---

## Fuentes de redes sociales: metodologia para "reacciones comunitarias"

> **Handoff:** si descubres un nuevo método de búsqueda, cambias la extracción de comentarios, o calibras verificación de imágenes/audios virales, actualiza este skill en la misma sesión.

**Un solo tweet/post de un usuario NO es una "reaccion comunitaria".** Las redes sociales (X, Reddit, Facebook, Instagram, TikTok, YouTube) son **siempre complementarias o punto de partida**, nunca fuente unica de un dato (regla general del vault). Cuando un evento documenta reacciones ciudadanas, el segmento debe reflejar el debate real: **opiniones variadas, de usuarios distintos y de plataformas distintas, con puntos de vista de distinto signo** (criticos y defensores). Si solo existe la opinion de un usuario, NO titular el segmento "Reacciones comunitarias": se registra como opinion de ese usuario (ej. "El hilo de Usuario Jose"), con sus datos verificados contra fuentes oficiales/prensa y marcando como interpretacion no verificada lo que no se pueda confirmar.

### Reglas para documentar reacciones de redes sociales

1. **Reunir 2+ plataformas cuando existan** (X + Reddit r/chile + Facebook + Instagram): cada plataforma se registra como fuente propia en `src/content/sources/*.md` (`tipo: red_social`/`redes`, `medio: Reddit r/chile` / `Facebook` / etc.).
2. **Citar comentarios con su texto literal, usuario y puntaje/reacciones** cuando esten disponibles (ej. "'Gobierno de KidZania' (Motamatulg, 188 puntos)"), para que el lector vea la representatividad relativa de cada opinion. Extraer los comentarios mas votados y tambien voces de la vereda opuesta (los de bajo puntaje negativo tambien documentan el disenso). **Prohibido parafrasear sin mostrar la cita**: resumir lo que dicen sin transcribir cómo lo dijeron incorpora el sesgo del editor. Cada postura reseñada lleva su entrecomillado literal, **siempre textual exacto y completo: prohibido `[...]`** (corrección del usuario sep-2026: recortar con `[...]` filtra el mensaje y deja una versión manipulada). Si un comentario es muy largo, se cita íntegro o se elige otro comentario completo — nunca una versión cortada. Las marcas propias del medio citado (ej. el `(…)` con que la prensa indica un segmento omitido del discurso) sí se reproducen tal cual, porque son parte del texto fuente, no edición del agente. La misma regla rige para citas de prensa y autoridades en cualquier evento.
3. **Verificar los datos que plantean los usuarios** contra fuentes oficiales o prensa (BCN, SUSESO, tribunales, medios) y marcar explicitamente lo que no fue verificado (ej. "acusacion de IA no verificada por prensa, se registra como complementaria").
4. **No mezclar la opinion del autor del hilo con la reaccion comunitaria**: el post original del usuario es el punto de partida; los comentarios de OTRAS personas son la reaccion. Citar ambos por separado.
5. Si una afirmacion viral requiere validacion y no se resuelve, registrarla en `TAREAS/` (⬜ pendiente) en lugar del body.
6. **Toda fuente de redes sociales debe declarar su ROL en el evento**: nunca se agrega "porque si". Al citar un post/hilo/comentario complementario, la nota de `src/content/sources/*.md` debe explicar que aporta y el body lo muestra con el contenido mismo (voces, puntaje, framing). Roles validos como criterio de evaluación —no como etiqueta literal en prosa (no escribir `(rol c)` ni `como complemento (rol X)` en el evento): (a) **permite verificar/validar un dato** que el post plantea (verificado contra BCN/SUSESO/tribunales/prensa — ej. los datos historicos del hilo de niñez); (b) **plantea un punto que la prensa no cubre** (ej. la cita del articulo 1° de la Constitucion en el debate del plan de seguridad, que los noticieros no mencionaron); (c) **documenta la reaccion ciudadana / opinion publica** con voces variadas de plataformas distintas; (d) **muestra la viralizacion de un tema** y su framing; (e) **aporta un desglose/analisis que la cobertura de prensa no detallaba** (ej. el desglose de cuenta propia de CLAPES UC difundido por Merken). Si un post no cumple ninguno de estos roles —o repite exactamente lo que ya cubre la prensa sin anadir nada—, NO agregarlo como fuente, **pero nunca justificar la exclusión con un párrafo meta-editorial en el body** (`No se agregan como fuentes...`, `complementarios por definición`, `Matiz sobre sesgo`). La justificación va al resumen entregado al usuario (él redacta el commit — el agente nunca commitea), no al evento (ver `content-model.md` → Prohibido contenido meta-editorial y `event-rules.md:13`).

### Qué hacer cuando el usuario entrega clippings de Reddit/X/Facebook para verificar

Si la tarea trae clippings de redes (ej. hilos de r/chile/r/RepublicadeChile con comentarios y puntajes) para "verificar y agregar a eventos", no basta con decir "ya cubierto por prensa, no se agrega":

- **Evalúa el rol (c) en primer lugar**: ¿los comentarios aportan voces variadas con puntajes que documentan la reacción ciudadana / polarización / framing que la prensa no cubre con ese detalle? Si sí —aunque el dato factual ya esté en prensa—, **sí cumple rol (c)** y debe documentarse con sección `## Reacciones comunitarias` (variadas, distinto signo, con usuario y puntaje) y fuentes `tipo: redes` en `src/content/sources/*.md`. Es el caso típico de hilos con 100+ comentarios que viralizan una nota: la reacción misma es el dato complementario.
- Solo si el hilo no aporta voces distintas, ni framing, ni dato adicional —repite literal el titular sin comentarios sustantivos— se puede omitir, **sin dejar rastro en el body**. Registra la decisión en el resumen entregado al usuario para su commit (`"Reddit X omitido: repite titular sin reacción sustantiva"`).
- Nunca usar el body para explicar por qué se omitió una red social.

### Backend opcional de búsqueda ampliada: `last30days`

Cuando los clippings entregados, los mirrors y la búsqueda directa no basten para reconstruir una reacción, `last30days` puede ampliar la búsqueda a **Reddit, X y YouTube**. Es un backend de captura, no una autoridad editorial: no reemplaza las reglas de este archivo, la verificación oficial ni la selección de voces.

```bash
# Instala una copia fijada y aislada de last30days v3.25.0 bajo .tools/ (gitignored).
pnpm run social-search -- --setup

# Preflight: confirma Python, fuentes disponibles y cookies desactivadas.
pnpm run social-search -- --check

# Búsqueda normal; stdout es JSON y no escribe eventos/fuentes en el vault.
pnpm run social-search -- "reacciones a la declaración" --days 30

# Reddit/X dirigidos:
pnpm run social-search -- "tema" --subreddits <lista> --x-handle <usuario>
```

El wrapper `scripts/social/last30days-search.mjs` aplica por defecto solo `reddit,x,youtube`, `--no-browser-cookies`, `--web-backend=none`, salida `--emit=json --json-profile=raw`, sin `--store`, sin `--publish` y con `LAST30DAYS_CONFIG_DIR` vacío. X solo aparece si el proceso ya dispone de una credencial/API configurada; no se extraen cookies del navegador. No ejecutes el setup nativo de `last30days`: puede instalar CLIs adicionales, escribir configuración global e introducir credenciales fuera de este wrapper.

**Cuándo usarlo:** después de agotar el material entregado y los métodos directos de este skill, cuando falten comentarios, una segunda plataforma, posts propios de una autoridad o contraste comunitario. **Cuándo omitirlo:** si ya hay clipping verificable, no repetir búsquedas para “aumentar” números ni usar engagement para decidir qué versión del hecho es verdadera.

**Flujo obligatorio:**

1. Define el tema y la ventana; usa primero las palabras exactas del evento y luego sinónimos institucionales.
2. Ejecuta `social-search` y conserva el JSON crudo como **evidencia de búsqueda**, no como fuente del vault.
3. Antes de citar un comentario, revisa `items_by_source[*].metadata.top_comments`/`comment_insights` y recupera autor, texto completo, fecha y permalink. Si el JSON solo ofrece `excerpt`, `summary` o la URL del hilo, no hay base suficiente para una cita literal: recupera el comentario desde su URL o déjalo como lead.
4. Revisa `source_status`/`errors_by_source`: `partial`, `auth-failed`, `rate-limited` o `unreachable` no significan “no hubo reacciones”. Una fuente que no aparece en `source_status` puede haberse omitido por configuración o cobertura cero.
5. Descarta homónimos, subtítulos, bots y comentarios que no tengan relación con el evento.
6. Elige 2+ plataformas y posiciones distintas cuando existan; conserva usuario, texto literal, fecha y URL propia del post/comentario.
7. Verifica cualquier dato factual contra fuente oficial o prensa. Si no se verifica, va a `TAREAS/`, no al body.
8. Solo después crea/actualiza `src/content/sources/*.md` y el evento siguiendo `data-yaml` + `event-rules`; el JSON de `last30days` nunca se copia ciegamente al body.

### Decidir si el hallazgo se integra ahora o queda como lead

- **Mismo hecho de un evento existente:** si la fuente es original, recuperable y aporta una cita, cifra, versión o antecedente pertinente, se procesa **de inmediato** en el evento actual. No se aplaza por tener ya cinco fuentes.
- **Hecho nuevo derivado del evento:** una medida, proyecto, renuncia, fiscalización, peritaje, identificación o desenlace posterior no se amontona en el evento original. Si ya cumple fecha, fuentes y reglas, se crea un evento nuevo y se relaciona con `deriva_en`, `provoca` o `responde_a`; si todavía no, queda en `TAREAS/PENDIENTES/YYYY.md` como candidato nuevo.
- **Desenlace de una investigación abierta:** si la fuente entrega un resultado judicial, pericial o administrativo identificable, se crea el evento de resultado o se registra en `TAREAS/SEGUIMIENTO/YYYY.md` hasta poder documentarlo.
- **Acusación o cifra no verificada:** siempre queda como lead en `TAREAS/`; una reacción social no autoriza escribirla en el body.
- **Simple repetición:** si el post o comentario solo reproduce un titular, una frase oficial o una noticia ya representada por fuentes más completas, no se agrega. La decisión se informa en el resumen, nunca en el body.

La regla depende del **estado editorial del hecho**, no de que el lead haya aparecido en una red social. El canal de descubrimiento no decide el destino.

**Límites editoriales:** el ranking por likes/upvotes/views solo sirve para localizar conversación relevante. No demuestra veracidad, representatividad ni alcance nacional. Varias cuentas reproduciendo el mismo comunicado tampoco cuentan como corroboración independiente. Para el vault, las reacciones se documentan según las reglas de las líneas 12-19, aunque el backend entregue una síntesis con su propio tono.

### Recuperación de posts y comentarios

> **Referencia operativa:** cargar `references/retrieval.md` antes de usar mirrors, APIs de terceros o archivers.

- Usar solo contenido público y nunca cookies o credenciales del navegador del agente. Las cuentas de investigación requieren perfil aislado y autorización explícita.
- Guardar siempre la URL original como fuente; mirrors, proxies y extractores son solo capas de lectura.
- Citar únicamente texto completo. Si aparece `…`, `See more` o `Ver más`, expandirlo en navegador o descartar el comentario.
- Registrar la captura de puntajes/reacciones porque pueden cambiar o llegar desde cachés distintas.
- Una extracción vacía, bloqueada o fallida no prueba que no existan comentarios.
- No usar undelete/PullPush/Pushshift para reconstruir contenido eliminado.

#### Cadena recomendada

- **X:** oEmbed oficial para texto/autor + FxTwitter v2 para métricas, hilo y respuestas; `markdown.new` como muestra secundaria. `nitter.cf`/`xitter.cf` solo para buscar, timeline o RSS.
- **Reddit:** `embed.reddit.com` + Defuddle para post/comentarios; Redlib para búsqueda y, solo si hace falta, puntajes vía Jina.
- **Instagram:** `markdown.new` para caption y comentarios visibles; Defuddle para caption/metadatos; navegador o Browsertrix para cargar más comentarios.
- **Facebook:** navegador público sin cookies, expandiendo `Ver más` en cada comentario citado; Jina/Defuddle solo como pistas y para el cuerpo del post.
- **TikTok:** `yt-dlp` para metadatos + wrapper público de TikWM para comentarios/respuestas; oEmbed oficial para una comprobación mínima.
- **YouTube:** `yt-dlp` con comentarios; usar la API oficial solo si ya hay credenciales y cuota.

#### Mirrors y servicios volátiles

- **X:** no promover `sotwe.com`, `x.n0g.xyz`, `xcancel.com` o `nitter.net` sin una comprobación actual. `nitter.cf` y `xitter.cf` funcionan, pero Nitter/teapawt está sujeto a caídas, límites y acciones legales; preferir FxTwitter.
- **Reddit:** obtener las instancias vigentes de `redlib-org/redlib-instances`; no mantener una lista local de hosts porque cambia frecuentemente.
- **Archivado:** Browsertrix genera WACZ y expande comentarios en varias redes; Bellingcat Auto Archiver es preferible para lotes. Un WACZ puede contener cookies: nunca compartir una captura creada con sesión autenticada.

### Estado de validación por red social

| Red social | Lectura | Comentarios | Fallback y límite |
| --- | --- | --- | --- |
| Reddit | ✅ `embed.reddit.com` + Defuddle | ✅ texto/autor/fecha/permalink; puntajes vía Redlib/Jina | La búsqueda directa suele estar bloqueada; Redlib es volátil y sus cachés pueden diferir |
| Facebook | ✅ texto del post | ✅ texto completo en navegador público | Jina/Defuddle pueden devolver login, CAPTCHA o comentarios truncados |
| X/Twitter | ✅ oEmbed + FxTwitter | ✅ respuestas estructuradas | Búsqueda/timeline vía Nitter/teapawt; preferir el endpoint oficial |
| Instagram | ✅ `markdown.new` | ✅ comentarios visibles + permalinks | Defuddle para caption; navegador/Browsertrix para cargar más |
| TikTok | ✅ `yt-dlp` + oEmbed | ✅ comentarios/respuestas vía TikWM | TikWM no es oficial ni tiene SLA; una falla no significa cero comentarios |
| YouTube | ✅ `social-search` + `yt-dlp` | ✅ `yt-dlp` con IDs, autores y likes | API Data oficial opcional; no usar `0 videos` como prueba de ausencia |

En TikTok y YouTube, el video por sí solo es fuente complementaria del hecho, no prueba una reacción comunitaria. Para documentar reacciones deben existir varias voces, textos literales verificables y URLs propias.

### Verificacion de imagenes y audios virales (calibracion 2026)

Cuando un evento documenta una imagen, screenshot o audio viral que circula en redes, verificar
la autenticidad del material ANTES de registrarlo como hecho (la verificacion del dato va contra
fuentes oficiales/prensa; esto es sobre el material mismo):

- **Busqueda inversa de imagen**, en este orden: Yandex Images (el mejor para rostros) → TinEye →
  Google Lens. Objetivo: aparicion MAS ANTIGUA y contexto de primera publicacion.
- **Credenciales de contenido (C2PA) — chequeo NICHO, ecosistema mayormente estadounidense/europeo**: util solo si se consigue el ARCHIVO ORIGINAL sin recomprimir.
  `contentcredentials.org/verify` lee el manifiesto localmente en el navegador (dispositivo, historial de edicion, herramienta de IA; corre lector C2PA real en cliente y reporta "sin manifiesto" correctamente).
  En la practica chilena casi siempre dira "sin credenciales": ningun medio local firma contenido (El Mostrador y La Razón solo
  ADHIRIERON a la iniciativa CAI en 2023, sin implementacion tecnica; la lista de publicantes verificados del IPTC es BBC/AFP/
  France Televisions/etc., cero Latinoamerica), el Estado tampoco firma, y lo viral llega como screenshot o recompresion que ELIMINA
  el manifiesto (X descarta el bloque XMP en ~95% de transcodificaciones de video; Meta/Google Photos preservan ~40% sin exponerlo).
  Caso de uso real: demostrar origen sintetico de un fake generado con DALL-E/Sora/Gemini/Adobe (firman por defecto) si aparece el
  archivo original. Calibraciones: ausencia de credenciales NO significa fake; los screenshots ELIMINAN el manifiesto; un manifiesto
  valido prueba quien FIRMO, no quien presencio.
- **Detectores automaticos**: nunca uno solo — usar al menos 2 y tratar el desacuerdo como
  indicio para escalar. Con tier gratis (estado mayo 2026): Reality Defender (50 escaneos/mes),
  AI or Not (triage rapido), DeepFake-o-Meter (academico, gratis). TrueMedia.org cerro en
  enero 2025.
- **El ojo humano ya NO alcanza**: pelos extra/asimetrias ya no delatan modelos de difusion de
  punta; quedan detalles finos (bordes de cabello/dientes, fisica de sombras, reflejos en ojos,
  desync labio-fonema). Usarlo solo para triage, nunca como veredicto.
- **Clones de voz**: cruzaron el umbral de indistinguibilidad para oyente casual (Fortune, dic
  2025). ASUMIR que la verificacion solo-por-voz FALLA: un audio atribuido a una autoridad exige
  confirmacion por otro canal (video oficial, transcripcion en sitio oficial, cobertura de prensa
  multiple) antes de registrarse como declaracion.
