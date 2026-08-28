---
name: social-media
description: Reacciones comunitarias y verificación de imágenes/audios virales en Reddit, X, Facebook, Instagram, TikTok y YouTube. Usa esta skill SIEMPRE al documentar reacciones ciudadanas, extraer comentarios o verificar imagen/audio viral, incluso si solo dice 'agregar reacciones'.
---

## Fuentes de redes sociales: metodologia para "reacciones comunitarias"

> **Handoff:** si descubres un nuevo método de búsqueda, cambias la extracción de comentarios, o calibras verificación de imágenes/audios virales, actualiza este skill en la misma sesión.

**Un solo tweet/post de un usuario NO es una "reaccion comunitaria".** Las redes sociales (X, Reddit, Facebook, Instagram, TikTok, YouTube) son **siempre complementarias o punto de partida**, nunca fuente unica de un dato (regla general del vault). Cuando un evento documenta reacciones ciudadanas, el segmento debe reflejar el debate real: **opiniones variadas, de usuarios distintos y de plataformas distintas, con puntos de vista de distinto signo** (criticos y defensores). Si solo existe la opinion de un usuario, NO titular el segmento "Reacciones comunitarias": se registra como opinion de ese usuario (ej. "El hilo de Usuario Jose"), con sus datos verificados contra fuentes oficiales/prensa y marcando como interpretacion no verificada lo que no se pueda confirmar.

### Reglas para documentar reacciones de redes sociales

1. **Reunir 2+ plataformas cuando existan** (X + Reddit r/chile + Facebook + Instagram): cada plataforma se registra como fuente propia en `sources.yaml` (`tipo: red_social`/`redes`, `medio: Reddit r/chile` / `Facebook` / etc.).
2. **Citar comentarios con su usuario y puntaje/reacciones** cuando esten disponibles (ej. "'Gobierno de KidZania' (Motamatulg, 188 puntos)"), para que el lector vea la representatividad relativa de cada opinion. Extraer los comentarios mas votados y tambien voces de la vereda opuesta (los de bajo puntaje negativo tambien documentan el disenso).
3. **Verificar los datos que plantean los usuarios** contra fuentes oficiales o prensa (BCN, SUSESO, tribunales, medios) y marcar explicitamente lo que no fue verificado (ej. "acusacion de IA no verificada por prensa, se registra como complementaria").
4. **No mezclar la opinion del autor del hilo con la reaccion comunitaria**: el post original del usuario es el punto de partida; los comentarios de OTRAS personas son la reaccion. Citar ambos por separado.
5. Si una afirmacion viral requiere validacion y no se resuelve, registrarla en `TAREAS/` (⬜ pendiente) en lugar del body.
6. **Toda fuente de redes sociales debe declarar su ROL en el evento**: nunca se agrega "porque si". Al citar un post/hilo/comentario complementario, el body y la nota de `sources.yaml` deben explicar que aporta. Roles validos: (a) **permite verificar/validar un dato** que el post plantea (verificado contra BCN/SUSESO/tribunales/prensa — ej. los datos historicos del hilo de niñez); (b) **plantea un punto que la prensa no cubre** (ej. la cita del articulo 1° de la Constitucion en el debate del plan de seguridad, que los noticieros no mencionaron); (c) **documenta la reaccion ciudadana / opinion publica** con voces variadas de plataformas distintas; (d) **muestra la viralizacion de un tema** y su framing; (e) **aporta un desglose/analisis que la cobertura de prensa no detallaba** (ej. el desglose de cuenta propia de CLAPES UC difundido por Merken). Si un post no cumple ninguno de estos roles —o repite exactamente lo que ya cubre la prensa sin anadir nada—, NO agregarlo. Formato sugerido en el body: "Se registra como complementaria porque <rol>: <que aporta, verificado contra X>" o "El rol del hilo en este evento es <rol>, verificado contra <fuente>."

### Metodos de busqueda probados (2026-08)

**Reddit r/chile** (los mas confiables — **bloqueo 2026-08-28**):
- **Busqueda por HTML**: `<https://old.reddit.com/r/chile/search?q=<termino>s>&restrict_sr=on&sort=new&t=month` funcionaba con `read_url` hasta 2026-08-28; desde esa fecha retorna 403 por política de red ("whoa there, pardner! Your request has been blocked due to a network policy" código 01a04a53) incluso con `Mozilla/5.0` UA (probado con `Invoke-WebRequest` y `webfetch`). La API JSON `search.json` ya devolvía 403; r.jina.ai sobre reddit también 403. Queda pendiente probar mirror (Pushshift bloqueado también 403) o acceso autenticado con credenciales developer.
- **Descarga del hilo**: `curl -s -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "<https://old.reddit.com/r/chile/comments/<i>d>/<slug>/" -o <archivo>.html` respondía 200 hasta 2026-08-28; ahora retorna 403 en Cloud IP. Si se libera, luego parsear con Python:
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

**Instagram**: `read_url` sobre reels/posts devuelve descripcion y a veces comentarios; para reacciones amplias preferir prensa o Reddit.

### Estado de validacion por red social

| Red social | Busqueda | Extraccion de comentarios | Notas |
| --- | --- | --- | --- |
| Reddit r/chile | ⬜ bloqueado 2026-08-28 (403 network policy 01a04a53) | ⬜ bloqueado (403) | HTML search, API JSON y r.jina.ai bloqueados (403); ver métodos arriba para cuando se libere |
| Facebook | ✅ r.jina.ai sobre posts de paginas | ✅ comentarios + reacciones | Solo paginas publicas; requiere el slug del post |
| X/Twitter | 🟡 solo via clipping del usuario o prensa | 🟡 comentarios del hilo en el clipping | Sin busqueda publica automatizada probada |
| Instagram | 🟡 read_url directa | 🟡 parcial (descripcion, pocos comentarios) | Reels/posts publicos |
| TikTok | ⬜ no legible | ⬜ no legible | `read_url` devuelve "No readable text found" (JS pesado) |
| YouTube | 🟡 titulo/descripcion si | ⬜ comentarios no | Comentarios requieren sesion: read_url y r.jina.ai piden "Sign in to confirm you're not a bot" (probado 2026-08) |

Para TikTok/YouTube la extraccion de comentarios NO esta resuelta: usar prensa o Reddit para reacciones y registrar el video solo como fuente complementaria de la declaracion (titulo + descripcion). Si algun dia se resuelve la extraccion de comentarios, actualizar esta tabla y la seccion "Medios de prensa en prosa" (orgs `tipo: red_social`).

### Verificacion de imagenes y audios virales (calibracion 2026)

Cuando un evento documenta una imagen, screenshot o audio viral que circula en redes, verificar
la autenticidad del material ANTES de registrarlo como hecho (la verificacion del dato va contra
fuentes oficiales/prensa; esto es sobre el material mismo):

- **Busqueda inversa de imagen**, en este orden: Yandex Images (el mejor para rostros) → TinEye →
  Google Lens. Objetivo: aparicion MAS ANTIGUA y contexto de primera publicacion.
- **Credenciales de contenido (C2PA) — chequeo NICHO, ecosistema mayormente estadounidense/europeo**: util solo si se consigue el ARCHIVO ORIGINAL sin recomprimir.
  `contentcredentials.org/verify` lee el manifiesto localmente en el navegador (dispositivo, historial de edicion, herramienta de IA;
  verificado 2026-08: corre lector C2PA real en cliente y reporta "sin manifiesto" correctamente).
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
