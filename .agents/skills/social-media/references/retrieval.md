# Recuperación y preservación de publicaciones sociales

> Última revisión de métodos y disponibilidad: 2026-09-25. Los mirrors de terceros son servicios de lectura, no evidencia de archivo ni sustitutos de la URL original.

## Reglas comunes

- Trabajar solo con publicaciones y comentarios públicos. No usar cuentas personales, cookies del navegador ni modos Private/Protected.
- Guardar siempre la URL original en `src/content/sources/*.md`; mirrors, APIs y proxies solo sirven para recuperar.
- Registrar la fecha/hora de captura cuando importan puntajes o comentarios. Los contadores cambian y los mirrors pueden servir cachés distintas.
- No citar texto que termine en `…`, `See more`, `Ver más` o que haya sido recortado. Expandirlo con un navegador y comprobarlo contra la página original.
- No afirmar que “no hay comentarios” cuando la extracción falló, devolvió HTML de login, quedó vacía o fue bloqueada.
- No recuperar material eliminado mediante undelete, PullPush/Pushshift u otros servicios equivalentes.
- No persistir en el vault cookies, tokens, `sec_uid`, identificadores internos, avatares, firmas de usuario ni otros campos que no aporten al hecho documentado.
- Tratar mirrors como pistas de lectura: verificar autor, fecha, texto, permalink y presencia de comentarios antes de usarlos.

## Orden de preferencia

1. **Endpoint oficial o público de la plataforma**, cuando entrega el dato y su uso lo permite.
2. **Extractor mantenido o formato limpio**: FxTwitter, `yt-dlp`, `embed.reddit.com`, Defuddle o `markdown.new`.
3. **Frontend alternativo** como Redlib o Nitter/teapawt, solo para búsqueda, timeline o cuando falta un campo.
4. **Captura interactiva** con navegador/Browsertrix, especialmente para Facebook e Instagram.
5. **Clipping entregado por el usuario** si la plataforma oculta o recorta el contenido.

## Matriz por red

| Red | Método principal | Fallback | Datos útiles | Preservación recomendada |
| --- | --- | --- | --- | --- |
| X | X oEmbed + FxTwitter v2 | `markdown.new`; Nitter/teapawt para búsqueda o timeline | texto, autor, fecha, métricas, replies, permalink | Browsertrix o captura WACZ |
| Reddit | `embed.reddit.com` + Defuddle | Redlib para búsqueda; Redlib/Jina para puntajes | texto, usuarios, fechas, permalinks, upvotes | Defuddle/WACZ; no undelete |
| Instagram | `markdown.new` | Defuddle; navegador para cargar más comentarios | caption, usuarios, likes, comment ID, permalink | Browsertrix |
| Facebook | navegador público con “Ver más” expandido | Defuddle para texto; Jina solo como pista | texto, autor, reacciones, ID/permalink cuando exista | Browsertrix o Auto Archiver |
| TikTok | `yt-dlp` + `tikwm.com` | TikTok oEmbed para metadatos; navegador para contraste | caption, métricas, comentarios, replies, comment ID | Browsertrix o Auto Archiver |
| YouTube | `yt-dlp` con comentarios | YouTube Data API | texto, autor, fecha, likes, replies, comment ID | `yt-dlp` + Browsertrix |

## X

### Método primario

1. Para texto, autor y fecha usa el oEmbed oficial sin autenticación:

   `https://publish.x.com/oembed?url=<URL_X_URL_ENCODADA>`

2. Para métricas, hilo y respuestas usa FxTwitter v2, enviando siempre un `User-Agent` no vacío:

   - Post: `https://api.fxtwitter.com/2/status/<ID>`
   - Hilo: `https://api.fxtwitter.com/2/thread/<ID>`
   - Conversación: `https://api.fxtwitter.com/2/conversation/<ID>?ranking_mode=likes`
   - Timeline: `https://api.fxtwitter.com/2/profile/<HANDLE>/statuses`

   La respuesta de `conversation` contiene `status`, `thread`, `replies`, `author` y `cursor.bottom`. Cada reply incluye URL original de X, texto, autor, fecha y contadores. Paginar solo cuando se necesite una muestra más amplia; no automatizar la descarga completa de una conversación grande.

3. Para una muestra pequeña de respuestas visibles:

   `https://markdown.new/https://x.com/<HANDLE>/status/<ID>`

4. Para el post que **difunde un artículo** (titular, URL de destino y miniatura van en la tarjeta, no en el texto), el endpoint de sindicación de X entrega el JSON completo sin autenticación ni login wall:

   `https://cdn.syndication.twimg.com/tweet-result?id=<ID>&lang=es`

   Devuelve `text`, `created_at` en ISO UTC, `favorite_count`, `conversation_count` y `card` con `expanded_url` (la URL original expandida, nunca la de `t.co`), `description` e imagen. Es la vía más barata para citar un post cuyo valor es la nota que enlaza, cuando `r.jina.ai` bloquea `x.com` (lo hace por rate-limit de abuso, no por el post) y FxTwitter no está disponible.

### Búsqueda y timelines

`nitter.cf` y `xitter.cf` son frontends teapawt y actualmente exponen búsqueda, perfiles, timelines, replies y RSS:

- `https://nitter.cf/<HANDLE>`
- `https://nitter.cf/search?f=tweets&q=<CONSULTA>`
- `https://nitter.cf/<HANDLE>/rss`
- `https://nitter.cf/<HANDLE>/status/<ID>`

Son **fallbacks volátiles**, no infraestructura estable. El proyecto Nitter recibió una intimación legal de X en agosto de 2026 y varias instancias fueron suspendidas o bloqueadas.

Usar poco volumen, rotar si aparece 403/429/captcha y volver al endpoint oficial o FxTwitter. No promover `sotwe.com`, que ya no sirve el timeline de X; tampoco mantener como verificados `x.n0g.xyz`, `xcancel.com`, `nitter.net` o las instancias de la wiki sin una comprobación actual.

## Reddit

### Lectura de un post

1. `https://embed.reddit.com/r/<SUBREDDIT>/comments/<ID>/<SLUG>/` entrega el post público y permite comprobar su puntaje.
2. Para limpiar post y comentarios:

   `https://defuddle.md/https://embed.reddit.com/r/<SUBREDDIT>/comments/<ID>/<SLUG>/`

   Defuddle entrega texto, autor, fecha y permalink de cada comentario, pero no todos los puntajes.
3. El oEmbed oficial sirve como comprobación mínima de autor/título:

   `https://www.reddit.com/oembed?url=<URL_REDDIT_URL_ENCODADA>`

### Búsqueda y puntajes

El catálogo vigente está en:

`https://raw.githubusercontent.com/redlib-org/redlib-instances/main/instances.json`

Para una búsqueda pública usar una instancia Redlib del catálogo y envolverla con Jina:

`https://r.jina.ai/https://<HOST_REDLIB>/r/<SUBREDDIT>/search?q=<CONSULTA>&restrict_sr=on&sort=new&t=month`

Para recuperar puntajes de comentarios:

`https://r.jina.ai/https://<HOST_REDLIB>/r/<SUBREDDIT>/comments/<ID>/<SLUG>/`

Los puntajes pueden variar entre instancias por caché. Si el post y el comentario no coinciden con la captura original, conservar el texto/autor/fecha y omitir el puntaje en vez de inventar una cifra.

No usar mirrors undelete para completar comentarios eliminados o removidos.

## Instagram

### Método primario

`https://markdown.new/https://www.instagram.com/p/<SHORTCODE>/`

La salida puede incluir caption, fecha, likes, cantidad de comentarios, usuarios, texto y permalinks como:

`https://www.instagram.com/p/<SHORTCODE>/c/<COMMENT_ID>/`

Usar `https://instagram.com/reel/<SHORTCODE>/` cuando el post sea un reel. Para cargar más comentarios, usar un navegador público o Browsertrix; no asumir que la primera tanda es representativa.

### Fallback

`https://defuddle.md/https://www.instagram.com/p/<SHORTCODE>/`

Defuddle suele recuperar caption, autor, fecha y contadores, pero no todos los comentarios. `r.jina.ai` puede ser una pista adicional, pero queda sujeto a bloqueos por abuso del dominio.

### Límites

El endpoint oficial `https://graph.facebook.com/v26.0/instagram_oembed?url=<URL>` se usa solo para verificar/embeber una publicación pública. Meta limita su uso a embeddings; no usarlo como API de extracción de captions o comentarios. `instaloader` es útil para archivo, pero los comentarios requieren una sesión y pueden exponer la cuenta: solo con perfil dedicado y autorización explícita.

## Facebook

### Método primario para comentarios

Abrir la URL pública en un navegador headless o desktop **sin cookies de sesión** y expandir `Ver más`/`View more` en cada comentario que se vaya a citar. La página pública puede entregar el texto completo aunque Jina lo trunque. Antes de documentar, comprobar que desaparecieron `See more`, `…` y el botón de expansión.

Flujo recomendado:

1. `r.jina.ai` o Defuddle para localizar el post y una primera lista de comentarios.
2. Navegador público para recuperar el texto completo y las reacciones.
3. Si existe `comment_id`, conservar el enlace de Facebook que lo incluye; si no, usar el permalink del post y anotar el ID/fecha de captura en la fuente.

Defuddle suele recuperar el cuerpo del post y enlaces de imagen. Jina puede devolver login, CAPTCHA o un resumen `Most relevant`; es solo una pista y no prueba que la lista sea completa.

### Límites

- El oEmbed oficial de Facebook/Instagram/Threads es para embed, no para extraer comentarios.
- Graph API requiere tokens y permisos de Página; no es una ruta general para posts ajenos.
- Meta Content Library requiere acceso de investigador y no es el método predeterminado del vault.
- No iniciar sesión con la cuenta personal del agente para saltarse una restricción.

## TikTok

### Metadatos del video

- oEmbed oficial: `https://www.tiktok.com/oembed?url=<URL_TIKTOK>`
- `yt-dlp --skip-download --no-warnings --print "%(id)s | %(timestamp)s | %(uploader)s | %(view_count)s | %(like_count)s | %(comment_count)s | %(share_count)s | %(webpage_url)s" <URL>`

### Comentarios

El wrapper público de TikWM acepta URLs de TikTok y no requiere clave para esta prueba de lectura:

- Video: `https://www.tikwm.com/api/?url=<URL_TIKTOK_URL_ENCODADA>&hd=1`
- Comentarios: `https://www.tikwm.com/api/comment/list?url=<URL_TIKTOK_URL_ENCODADA>&count=20&cursor=0`
- Replies: `https://www.tikwm.com/api/comment/reply?comment_id=<COMMENT_ID>&video_id=<VIDEO_ID>&count=20&cursor=0`

Los comentarios incluyen `id`, `text`, `create_time`, `digg_count`, `reply_total` y `user.unique_id`. Usar el ID para el permalink:

`<URL_VIDEO_ORIGINAL>?comment_id=<COMMENT_ID>`

Si la respuesta está vacía o falla, no convertirlo en “no hay comentarios”. TikWM es un intermediario no oficial, sin SLA; hacer pocas consultas, mantener el original como fuente y no guardar `sec_uid`, firmas, avatares ni URLs firmadas. La API oficial Research Tools queda reservada a investigadores elegibles y no es el fallback del vault.

## YouTube

### Comentarios con `yt-dlp`

Para una muestra pequeña, usar la API Python sin descargar archivos:

```python
from yt_dlp import YoutubeDL

url = "https://www.youtube.com/watch?v=VIDEO_ID"
options = {
    "skip_download": True,
    "quiet": True,
    "getcomments": True,
    "extractor_args": {"youtube": {"max_comments": ["50"]}},
}
with YoutubeDL(options) as ydl:
    info = ydl.extract_info(url, download=False)
for comment in info.get("comments") or []:
    print(comment.get("id"), comment.get("author"), comment.get("text"),
          comment.get("like_count"), comment.get("timestamp"))
```

El permalink canónico es:

`https://www.youtube.com/watch?v=<VIDEO_ID>&lc=<COMMENT_ID>`

La API oficial `commentThreads.list` y `comments.list` es una alternativa con credenciales y cuota. El texto plano oficial puede normalizar enlaces; contrastar con la página o con el clipping cuando la cita sea sensible.

## Referencias APIs y extractores

- [X oEmbed API](https://docs.x.com/x-for-websites/oembed-api) y [FxEmbed/FxTwitter](https://github.com/FxEmbed/FxEmbed)
- [Redlib](https://github.com/redlib-org/redlib) y su [catálogo de instancias](https://github.com/redlib-org/redlib-instances)
- [Meta oEmbed Post](https://developers.facebook.com/docs/graph-api/reference/oembed-post)
- [TikTok Embed Player](https://developers.tiktok.com/docs/en/embed-player)
- [YouTube Data API: comments.list](https://developers.google.com/youtube/v3/docs/comments/list)

## Preservación: Browsertrix y Auto Archiver

### Browsertrix

[Browsertrix](https://browsertrix.com/) usa un navegador real y produce WACZ. Sus comportamientos específicos cubren Bluesky, Facebook, Instagram, Telegram, TikTok, X y YouTube; en Facebook, Instagram, TikTok y YouTube intentan expandir comentarios y medios. Es la opción recomendada para una sola publicación pública cuando se necesita una captura reproducible o un archivo WACZ.

Usar `Single Page` + `smart scoping` cuando corresponda. El WACZ conserva HTML, recursos, capturas y estado de sesión: **no compartir un WACZ creado con cookies**. Si se necesita login, usar una cuenta desechable y un perfil aislado, nunca el perfil personal del agente.

### Bellingcat Auto Archiver

[Auto Archiver](https://github.com/bellingcat/auto-archiver) es de código abierto y mantiene extractores para redes, medios, hashes y metadatos. Preferirlo para lotes, eventos de crisis o posts que van a desaparecer; no usarlo como reemplazo de una cita estructurada. Puede producir WACZ, capturas, hashes y un informe de estado.

### Orden de preservación

1. Captura interactiva WACZ si el contenido es frágil o tiene comentarios largos.
2. Auto Archiver para un lote reproducible.
3. Wayback/Archive.today como fallback de página, no como prueba de que se capturó todo el contenido dinámico.

Una captura WACZ sirve como respaldo; el texto citado debe verificarse en la página o en una extracción limpia y conservar siempre la URL original.
