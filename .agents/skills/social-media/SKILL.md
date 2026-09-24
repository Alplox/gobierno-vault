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

### Metodos de busqueda probados

**Reddit r/chile** (los mas confiables — con bloqueo de red vigente):
- **Descarga del hilo vía espejo `defuddle.md`**: `pnpm run fetch-content -- <https://old.reddit.com/r/<sub>/comments/<id>/<slug>/` resolvió con `defuddle.md` el hilo completo (post + comentarios con usuario, fecha y links permanentes; sin puntajes visibles). Revierte el bloqueo documentado abajo para lectura de hilos concretos — la búsqueda HTML/API sigue pendiente de re-verificación.
- **Busqueda por HTML**: `<https://old.reddit.com/r/chile/search?q=<termino>s>&restrict_sr=on&sort=new&t=month` retorna 403 por política de red ("whoa there, pardner! Your request has been blocked due to a network policy" código 01a04a53) incluso con `Mozilla/5.0` UA (probado con `Invoke-WebRequest` y `webfetch`). La API JSON `search.json` ya devolvía 403; r.jina.ai sobre reddit también 403. Queda pendiente probar mirror (Pushshift bloqueado también 403) o acceso autenticado con credenciales developer.
- **Descarga del hilo**: `curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "<https://old.reddit.com/r/chile/comments/<i>d>/<slug>/" -o <archivo>.html` actualmente retorna 403 en Cloud IP. Si se libera, luego parsear con Python:
  ```python
  import re, html
  blocks = re.split(r'<div class="entry', data)
  user = re.search(r'/user/([^"/]+)', b)
  score = re.search(r'score unvoted" title="([^"]+)"', b)
  body = re.search(r'<div class="md">(.*?)</div>', b, re.S)
  ```
  Guardar el HTML en un archivo DENTRO del repo (ej. `tmp_<slug>.html`) y borrarlo al terminar: en Git Bash de Windows `/tmp` no es visible para Python (FileNotFoundError). Prefijar la impresion con `PYTHONIOENCODING=utf-8` para evitar errores de encoding cp1252 en consola Windows.
- Ordenar comentarios por puntaje (desc) y tomar los top ~20 + los negativos para capturar el disenso.

**Facebook** (posts de paginas de medios):
- `r.jina.ai/<https://www.facebook.com/<pagin>a>/posts/<slug>/` devuelve el texto del post + los comentarios "Most relevant" con su conteo de reacciones (probado con El Dínamo y Kapital FM, 2026-08). `read_url` directa tambien funciona para algunos posts.

**X/Twitter**: el clipping del usuario trae el hilo y sus comentarios; para ampliar voces buscar cobertura de prensa del tema y usar el catalogo de sitemaps (`grep -ih '<termino>' sitemaps/<medio>/*.jsonl`). Los status IDs entregados por el usuario se validan con la URL de prensa que los confirma.

**X/Twitter — mirrors verificados 2026-09-14** (probar en este orden; rotar si uno falla con 403/429/captcha — las instancias caen y se rate-limitean a menudo):
- ✅ `https://x.n0g.xyz/<usuario>` — Nitter clásico, timeline completo verificado (probado `/elonmusk` con tweets, RTs, contadores y fechas).
- ✅ `https://nitter.cf/<usuario>` y `https://xitter.cf/<usuario>` — frontend teapawt, mismo backend, timeline completo verificado.
- ✅ `https://sotwe.com/<usuario>` — perfil + tendencias por país (incluye Trends Chile del día) + descarga de imágenes; sirve para timelines Y tendencias, no solo timelines.
- Patrón URL: `<mirror>/<usuario>` para perfil, `<mirror>/<usuario>/status/<id>` para tweet individual. Leer con fetch directo (HTML liviano, sin JS).
- 🟡 Parciales (homepage OK, timeline bloqueado el 2026-09-14 — reintentar otro día): `nitter.kareem.one` (403 en perfil), `tw.eir-nya.gay` (429 rate-limit), `shitter.thepixora.com` y `nitter.miningtcup.me` (captcha DogWAF anti-bot; miningtcup además prohíbe scraping en sus reglas — no usar).
- ❌ Caídos el 2026-09-14: `nt.vern.cc` (sin respuesta), `goyimx.com` (418 en raíz y en perfil).

**Instagram**: `read_url` sobre reels/posts devuelve descripcion y a veces comentarios; para reacciones amplias preferir prensa o Reddit.

### Estado de validacion por red social

| Red social | Busqueda | Extraccion de comentarios | Notas |
| --- | --- | --- | --- |
| Reddit r/chile | 🟡 búsqueda directa bloqueada; `social-search` puede descubrir candidatos por RSS/arctic | 🟡 depende de lo que devuelva el backend y del floor de relevancia | La búsqueda HTML/API directa sigue 403; un `source_status: reddit: ok` con `results: []` no prueba que no haya reacción |
| Facebook | ✅ r.jina.ai sobre posts de paginas | ✅ comentarios + reacciones | Solo paginas publicas; requiere el slug del post |
| X/Twitter | ✅ mirrors 2026-09-14 (x.n0g.xyz, nitter.cf, xitter.cf, sotwe.com) | ✅ timeline + contadores via mirror | Sin búsqueda pública en x.com; usar mirrors con `<mirror>/<usuario>` y rotar ante 403/429/captcha |
| Instagram | 🟡 read_url directa | 🟡 parcial (descripcion, pocos comentarios) | Reels/posts publicos |
| TikTok | ⬜ no legible | ⬜ no legible | `read_url` devuelve "No readable text found" (JS pesado); `video-transcript` descarga audio pero puede colgarse sin backend Whisper — no reintentar a ciegas. Clipping con comentarios entregado por el usuario se documenta igual que X (rol c, entrecomillado literal + usuario + conteos del clipping) |
| YouTube | 🟡 búsqueda/transcripción mediante `social-search` + `yt-dlp` disponible | 🟡 backend intenta comentarios cuando hay match | No usar `0 videos` como prueba de ausencia; registrar solo videos/comentarios con URL original y texto literal |

Para TikTok la extracción de comentarios sigue sin resolver. En YouTube, `social-search` puede intentar búsqueda, transcripción y comentarios mediante `yt-dlp`, pero solo usarlos si devuelve una URL original y texto literal verificable; si no hay match, usar prensa/Reddit o el clipping entregado. El video por sí solo sigue siendo una fuente complementaria de la declaración, no prueba una reacción comunitaria.

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
