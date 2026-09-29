---
name: sitemaps
description: Catálogo local de sitemaps de prensa con JSONL, MEDIA, sync/index/backup y búsqueda con rg. Usa esta skill SIEMPRE al sincronizar sitemaps, al dar de alta un medio nuevo, al buscar con rg -uu en sitemaps/, al usar news-search o antes de cualquier búsqueda web para evitar fetch redundante, incluso si solo dice 'buscar en sitemaps' o 'agrega este medio al catálogo'.
---

## Qué es

`sitemaps/` en la raíz: catálogo de artículos de prensa (URL + fecha + título si existe)
extraído de los sitemaps públicos de cada medio. Evita fetch/búsquedas web redundantes: el valor
está en la URL+fecha y, en los news-sitemaps, en el título real (últimos 2-3 días).
**NO guarda el cuerpo de los artículos.**

Formato JSONL, una línea por artículo:

```json
{ "u": "https://…", "d": "2026-09-26", "t": "título", "s": "news" }
```

`s:"news"` = título real del news-sitemap · `s:"slug"` = título aproximado derivado de la URL.

> **Handoff:** si cambias `MEDIA` en `scripts/sitemaps/media.mjs`, el formato JSONL o
> `scripts/sitemaps/{sync,index,backup,watchlist}.mjs`, actualiza este skill en la misma sesión.

### Regla clave: el catálogo NO se commitea

`sitemaps/*.jsonl`, `sitemaps/.cache/`, `sitemaps/sitemaps.gvault*` están en `.gitignore`
(BioBio solo pesa ~307MB). Lo que **sí** se commitea: los scripts de `scripts/sitemaps/`,
`package.json`, `sitemaps/_manifest.json` (estado de sync), `sitemaps/README.md` (resumen),
`sitemaps/MEDIOS.md` (tabla completa por medio) y la sección de stats de `README.md`.
Si clonás el repo, regenerá con `pnpm run sitemaps-sync -- <medio>`.

Excepción opcional: el snapshot público `.gvault` comprimido con Brotli (~94MB) se puede
publicar partido con `--chunk-size 45` (~28MB por parte, bajo el límite blando de 50MB de
GitHub) y restaurarse con `sitemaps-backup --restore`.

Ojo si trabajás en un clon o worktree: como los JSONL no están en git, los generadores
leen **lo que hay en disco** y producen resultados engañosos sin error —
`sitemaps-index` arma el `sitemaps/README.md` con el total de los medios presentes (casi
cero) y `sitemaps-watchlist` degrada filas que deberían quedar ✅ a 🟡. No es un bug, pero
no dejes ninguno de los dos commiteado desde un clon sin catálogo.

---

## Dar de alta un medio nuevo

Es la operación más frecuente. El orden importa: los pasos 1 y 6 son los que evitan el
trabajo que cuesta caro repetir.

1. **Elegir candidatos de las filas `⬜` de `TAREAS/tareas_sitemap.md`.** Un dominio que no
   aparece ahí ya está catalogado (✅) o ya se descartó (🔒). Es lo que evita dar de
   alta un medio dos veces.
2. **Sondear** con el script, que además cruza contra `MEDIA` y `SIN_SITEMAP`:
   ```bash
   pnpm run sitemaps-probe -- cahuquenesnet.cl tehuelchenoticias.cl
   ```
   Salida con código ≠ 0 si algún dominio ya está catalogado o ya fue descartado (y en ese
   caso imprime el slug o el motivo). Sale con `CANDIDATO` si algo responde, junto con la
   firma del CMS.
3. **Confirmar que hay artículos, no páginas**: abrir un sub-sitemap hijo y mirar que las
   URLs llevan fecha y slug (`/2026/09/26/titular/`), no `/categoria/…`. Un `urlset` de
   20-200 URLs sin fechas es páginas estáticas: se descarta. Además, **que el sitemap sea
   del dominio**: en hosting compartido el `/sitemap.xml` responde con el de otro medio (el
   conglomerado Estrella/Mercurio sirve `estrellaarica.cl` + `estrellaiquique.cl` desde
   `mercuriovalpo.cl`, `cronicachillan.cl`, `australvaldivia.cl`…), y un CMS con páginas
   autogeneradas devuelve miles de URLs tipo `/quality/version/<id>.shtml` sin un solo
   artículo. Si los `<loc>` no son del dominio sondeado, es un descarte, no un medio.
   Y al revés, **un sitemap enorme tampoco alcanza**: si las URLs son opacas
   (`/article/<uuid>`) y el urlset plano está topado (típico 5.000 locs) cubriendo
   uno o dos meses, es un agregador sin archivo — se descarta con la medición a la
   Dos sabores más que se confunden con un medio real: el **dominio estacionado**,
   que responde 200 con el sitemap de otro sitio (`radionueveveinte.com` → 2 locs de
   `foriamking.nl`), y el **fundo de contenido traducido**, un .cl con slugs en
   inglés y temas globales (`radiodelmar.cl` →
   `take-precautions-when-shopping-at-huge-malls-to-prevent-viruses`). En los dos
   casos el descarte se apoya en leer los locs, no en el código de respuesta.
   vista (Periodismo2: 5.000 locs = jun-sep 2026, el 66% en junio y casi todo
   deportes y mundo).
   Ojo también con los `alias`: dos dominios de la misma nota (p. ej. `eha.cl` y
   `elheraldoaustral.cl`) sirven el mismo sitemap → uno solo al catálogo.
4. **Agregar la entrada a `MEDIA`** en `scripts/sitemaps/media.mjs`, eligiendo la config
   según la receta de abajo, y comentando **por qué** esa config y no otra.
5. **Sincronizar**: `pnpm run sitemaps-sync -- <slug>`.
6. **Anotar en `SIN_SITEMAP` (`scripts/sitemaps/watchlist.mjs`) todo lo que se descartó**,
   con el motivo de lo que se verificó. Sin esta entrada la fila vuelve a `⬜` en la
   siguiente regeneración y el próximo agente re-sondea lo mismo. Escribí *qué
   comprobaste*, no "no sirve": `'/sitemap.xml responde 0 locs'`, `'wp-sitemap.xml solo
   declara posts-page, sin posts'`, `'DNS ENOTFOUND'`.
   Nunca anotes ahí un dominio que ya esté en `MEDIA`: sobra y da una nota contradictoria.
   **La clave es el dominio tal como aparece en la fila, no el que sondeaste**: sondear
   `pensiones.cl` y anotar `'pensiones.cl'` no marca la fila, que se llama `spensiones.cl`
   (mismo sitio, otro nombre de dominio). Pasa con alias y con erratas
   (`elmatutino.cl` vs `elmartutino.cl`, `ariamia.cl` vs `aricamia.cl`). Desde que existe
   el aviso, `sitemaps-watchlist` lista al final las claves de `SIN_SITEMAP` que no
   corresponden a ninguna fila: si aparece una, el descarte no se está aplicando
   —corrige la clave (con el motivo recién verificado, no el heredado) o bórrala si la fila
   ya no existe en el repo fuente.
7. **Regenerar índices**: `sitemaps-index` (README + MEDIOS), `sitemaps-watchlist`
   (filas ⬜→✅) y `generate-index` (EVENTS_INDEX + stats del README).
   Después, `node .agents/skills/sitemaps/scripts/check-markdown.mjs`: la bitácora se
   abre en el VS Code con markdownlint, y el markdown que genera `watchlist.mjs` tiene
   que salir limpio. Dos reglas del generador que hay que respetar al tocarlo: **toda
   tabla y todo encabezado necesitan línea en blanco arriba y abajo** (las fronteras de
   categoría se pegaban entre sí), y **el texto libre de las notas va envuelto en
   backticks si trae `<lastmod>` o una URL** — o se vuelve HTML inline y URL desnuda.
8. **Actualizar este skill** si el medio trajo una trampa que no está en la receta.

### Cruce con awesome-chilean-rss y reporte de faltantes

`sitemaps-watchlist` ya descarga el repo fuente por defecto, así que la bitácora se
mantiene sola. Para saber **qué hay de nuevo** y **qué le falta al repo**:

```bash
node .agents/skills/sitemaps/scripts/report-awesome.mjs --verificar --out TAREAS/reporte_awesome_chilean_rss.md
```

Dos trampas al leer ese reporte, ambas ya resueltas en el script:

- **"Sitios nuevos" solo cuenta los de prensa.** El repo también publica deportes,
  gaming, empleos, entretenimiento, tecnología y blogs personales, que el vault
  excluye por diseño: contarlos como "nuevos" infla el número y sugiere trabajo que
  no existe. El script separa `nuevos de prensa` de `fuera de alcance` en el
  resumen de stderr. Un 0 en el primero es la respuesta sana.
- **"Nuestros medios ausentes" necesita filtro de verdad.** El vault cita como
  `medio:` a X, Reddit, YouTube, Presidencia, Senado, INE, BCN, Diario Oficial y
  prensa internacional: ~420 dominios que no son objeto de un repo de RSS chileno.
  Sin filtrar, el reporte es inservible. El script aplica filtro de dominio
  (descarta redes sociales, organismos del Estado y TLDs del exterior: `.ec`,
  `.bo`, `.ar`…) y además clasifica cada candidato en `prensa` / `institución` /
  `internacional-otros`, porque un `.cl` no basta: un archivo nacional con feed
  tampoco es prensa.

El aporte al repo es la **sección 3 del reporte** (solo tipo `prensa` con feed
verificado), que es texto listo para issue. Los nombres salen de `MEDIA` y del
campo `medio:` de las fuentes, así que hay que revisar que coincidan con el nombre
editorial del repo antes de enviar. El reporte se commitea; el script no toca nada.

### Anti-duplicados

El alta es por **slug**, no por dominio: nada impide crear `lahora` junto a `la_hora`, y el

Cuando el dominio de la fila ⬜ es un **alias** del sitio real, el alta se hace con el
dominio verdadero y la fila del alias se cierra en `SIN_SITEMAP` con ese motivo.
Pasó con `radiosantiago.cl`, cuyo `robots.txt` declara el `wp-sitemap.xml` de
`eldiariodesantiago.cl`: al catálogo entró el segundo. Y con las estaciones de una
red, que sirven el sitemap de la casa madre (`fmstylo.cl` y `radiosregionales.cl` →
`patagoniaradio.cl`, cuyo índice mensual da ~7 locs por shard).

catálogo queda con el doble de archivos y dos fuentes de verdad. Si el dominio ya existe,
**mejorá el `includeRe` del slug existente y resincronizá** en vez de crear otro. Cuando el
run nuevo es un superconjunto del viejo (lo normal cuando el `includeRe` solo agregaba
shards), los JSONL nuevos se copian al directorio canónico y se actualiza `_manifest.json`.

**Al borrar un slug duplicado, revisá también `CATALOG_HOST_OVERRIDES` en
`scripts/extract/add-source.mjs`.** Ese mapa fija qué slug gana cuando dos slugs comparten
dominio; si la entrada sobrevive apuntando al slug borrado, `lookupCatalogUrl()` devuelve
`null` para **todas** las URLs de ese medio, en silencio: no hay error ni aviso, solo que el
catálogo parece vacío para ese medio. Si tras la consolidación el dominio queda con un solo
slug, la entrada sobra y hay que borrarla.

---

## Receta por CMS

| Firma | Endpoint | Config que funciona |
| --- | --- | --- |
| Yoast | `sitemap_index.xml` → `post-sitemap*.xml` | `articleOnly: true` |
| WP 5.5+ nativo | `/wp-sitemap.xml` | `includeRe: /wp-sitemap-posts-post-\d+\.xml$/i` + `articleOnly` |
| Wix | `/sitemap.xml` | `includeRe: /blog-posts-sitemap\.xml$/i` — **`articleOnly` NO sirve**: los artículos están en un CPT propio |
| Tema WP con sitemap paginado propio | `robots` → `/sitemap.xml` → `sitemap-index-1.xml` → `sitemap-N.xml` | `includeRe: /\/(?:sitemap-(?:index-)?\d+\|news-sitemap)\.xml$/i` (ver trampa 1) |
| Tema WP mensual | `/sitemap/YYYY/MM/sitemap-pt-post.xml` | `includeRe: /\/sitemap\/\d{4}\/\d{2}\/sitemap-pt-post\.xml$/i` |
| Arc XP | `sitemap-index` → `?from=N` | solo reciente; el `latest` no tiene historia |
| Prontus | `extra: …/sitemap_pags.xml` | `includeRe: /sitemap_pags_\d{6}\.xml\.gz$/i`; el `<lastmod>` es timestamp Unix |
| CMS propio por año | `sitemap{N}_{YYYY}.xml` | `includeRe: /sitemap\d+_\d{4}\.xml$/i`; `forceHttps: true` si el index trae `http://` |
| CMS propio mensual | `…/YYYY/MM.xml` | `dateFromSitemapPath: /…\/(\d{4})\/(\d{2})\.xml$/` (ver trampa 3) |
| Índice paginado de 100 | `news/{0,100,…}/sitemap.xml` | `includeRe` con sufijo del padre **opcional** (trampa 1) |
| El sitemap que declara el `robots.txt` es un stub | `/sitemap.xml` con 5-20 locs (la home y sus anclas) | apuntar al `/wp-sitemap.xml` aunque el robots no lo mencione: el probe prueba los 3 endpoints, y el stub no quiere decir que no haya artículos (Esperanza FM: 5 locs declaradas, 1.387 artículos en el wp-sitemap) |
| Urlset plano con páginas estáticas mezcladas | `/sitemap.xml` | `urlRe: /\/20\d{2}\/\d{2}\/\d{2}\//` + `locDateRe` (trampa 4) |
| WP 5.5+ **sin guiones bajos** | `/wp-sitemap.xml` | `includeRe: /wp_sitemap_posts_post_\d+\.xml$/i` — `articleOnly` no lo reconoce, y su índice cuelga 7 shards de `post_tag` de 1.000 locs cada uno |
| Índice propio de radio (`/sitemap/news/N/`) | el shard de noticias | sin `includeRe` si el `index` ya es el de noticias; ojo al `<lastmod>undefined</lastmod>` (trampa 15) |
| Sin fecha en el sitemap, fecha en el path del artículo | — | `locDateRe` con grupos YYYY/MM/DD (el día es opcional: si el path solo trae YYYY/MM queda día 01). Rango `(19\|20)\d{2}` si hay historia pre-2000 |
| Publica en hora local y el `lastmod` es el instante UTC | — | `preferLocDate: true` + `locDateRe`, y reconstruir con `--replace` (trampa 5) |

Las **trampas por medio ya catalogado** (bloqueos, fechas falsas, duplicados, volumen) están
en `references/medios.md` — cargalo al trabajar con un medio concreto.

---

## Trampas recurrentes

1. **El `includeRe` tiene que dejar entrar el índice padre, no solo sus hijos.** El filtro se
   aplica también a los sub-sitemaps que declara el índice raíz; si el patrón no matchea el
   padre, el sync lo descarta y baja 0 (o solo el news-sitemap) sin error visible. De ahí el
   grupo `(?:\/index)?` o `(?:\/\d+)?` opcional.
2. **Un patrón que permite un sub-sitemap no lo descubre: hace falta que algo lo declare.**
   El sync solo baja lo que aparece en `robots.txt` o en el índice raíz. Si el news-sitemap
   cuelga de otra ruta que el índice no lista, el `includeRe` lo permite pero nadie lo pide:
   hay que declararlo en `extra`. Y al revés, cambiar `index` por `robots` no siempre
   sirve: si la línea `Sitemap:` del robots apunta al índice raíz, el `includeRe` lo
   descarta por no ser un shard (trampa 1) y el medio baja 0.
3. **Ancla el patrón con `\/`.** Sin ella, `video-sitemap-1.xml` matchea `sitemap-1\.xml` y
   mete URLs de video en el catálogo.
4. **`<lastmod>` no siempre es la fecha del artículo.** Cuando el sitio regenera sus shards,
   el `lastmod` es uniforme y falso: se resuelve con `dateFromSitemapPath` (fecha del nombre
   del sub-sitemap) o `locDateRe` (fecha en el path del artículo). Precedencia de la fecha
   final: `newsDate` > `locDate` > `pathDate` > `lastmod`.
   **Cómo se comprueba en vez de suponerlo:** abrir 4-6 artículos del shard más grande y
   comparar su `datePublished` con el `<lastmod>` del sitemap. Si coinciden, el `lastmod`
   sirve; si el `datePublished` es anterior, el `lastmod` es `dateModified` y una oleada de
   retoques está falseando el archivo. Si además el path no trae fecha, **no hay arreglo
   posible**: mejor descartar el medio que catalogarlo con fechas corridas (pasó con
   `portalnacional.cl`, ~7.900 entradas de 2025 fechadas en 2026).
5. **`<lastmod>` en UTC vs. fecha local: el D+1.** Si el medio publica en hora local y su
   `lastmod`/`news:publication_date` es el instante en UTC, todo lo publicado después de las
   20:00 cae al día siguiente: ~12% de las entradas quedan fechadas D+1 y **el síntoma es
   invisible** (no hay error, solo fechas corridas). La fecha buena es la del path, que es la
   que declara el sitio en su `datePublished`. Para esos medios, `preferLocDate: true`
   invierte `newsDate` y `locDate`; después hay que reconstruir con `--replace`, porque un
   merge normal no corrige las fechas ya guardadas. El offset del `<lastmod>` dice si el
   medio cae en el caso: `2015-09-29T23:16:44-03:00` es la hora local declarada y no se
   corre; `2014-11-27T23:16:10+00:00` es el instante UTC y sí. Cuando el path no trae
    Verificado en Radio Comunicativa (Ovalle): un artículo con `datePublished`
    2014-01-01T22:08 quedó fechado 2014-01-02, y no hay arreglo porque su path solo
    trae `/YYYY/MM/`. Anota el caso en la config para que no se lea como bug.
   fecha no hay con qué corregirlo, y eso hay que dejarlo anotado en la config.
6. **`locDateRe` con `20\d{2}` pierde la prensa pre-2000.** Si el medio tiene historia
   anterior a 2000, el rango tiene que ser `(19|20)\d{2}`: con el patrón acotado al siglo
   XXI se descartan en silencio las décadas previas.
   Además, **los grupos 1 y 2 son el año y el mes, obligatorios**: `extractPairs` arma la
   fecha como `` `${g1}-${g2}-${g3 ?? '01'}` ``, así que un patrón que solo capture el año
   (`(20\d{2})\/\d{2}\/\d{2}`) no da error y guarda `"2019-undefined-01"` en todas las
   entradas, y uno con la alternancia dentro del grupo (`(19|20)\d{2}`) guarda `"19-04-01"`.
   El año completo va en el grupo 1: `((?:19|20)\d{2})`. Con el grupo 3 ausente el día cae a
   `01` a propósito (meses, no días). Chequeo rápido tras el sync: `rg -c 'undefined|^\{"u"[^\n]*"d":"[0-9]{2}-' sitemaps/<slug>/` debe dar 0.
   **Y `--replace` no limpia las fechas corruptas**: reescribe los años presentes en el run
   y vacía los `YYYY.jsonl` sin entradas, pero solo vacía archivos que matchean `^\d{4}\.jsonl$`
   — y una fecha malformada genera justamente un `19-0.jsonl`, que sobrevive al rebuild (pasó
   con `lyd`: el `--replace` dejó las 15.415 entradas corruptas junto a las 15.415 buenas).
   Para reconstruir de verdad hay que **borrar `sitemaps/<slug>/` primero** y resincar.
7. **Un urlset plano suele mezclar páginas y artículos.** `urlRe` filtra por patrón de URL;
   `articleOnly` y `includeRe` filtran por *nombre de sub-sitemap*, así que no ayudan en un
   urlset plano.
8. **`sitemapUrlDate` reconoce 3 patrones** en el nombre del sub-sitemap: `YYYY-MM-DD`,
   `DD-MM-YYYY` y `YYYY/MM`. Si tu medio los usa, el resync `--since` descarta los shards
   antiguos **por URL, sin descargarlos** — es lo que hace barato el resync incremental.
9. **El dedupe del run no bloquea el upgrade de títulos**: si una URL aparece primero sin
   título y después con título real, la segunda pasada mejora la entrada (`news` > `slug`).
   Por eso `+N nuevos` puede quedar muy por debajo del total.
10. **Un shard declarado que no existe** (por el tope de 2.000 posts de WordPress) responde
    con el HTML de la home → 0 locs. Es inofensivo, pero topa el catálogo.
11. **Un sync cortado se relanza con el mismo comando**: el caché en `.cache/` y el modo merge
    retoman sin pérdida.
12. **Un shard con fecha de regeneración** no rompe el sync, pero deja todas las entradas de
    ese shard con la misma fecha: para eventos históricos, buscar por slug.
13. **`robots.txt` o el índice pueden declarar el sitemap con `http://`** aunque el sitio
    sirva perfecto por https. Ocurre en WP/Yoast con plugin de seguridad mal configurado
    (visto en `partidoigualdad.cl`, cuyo `Sitemap:` y cuyo `sitemap_index.xml` apuntan a
    `http://` y los `<loc>` del shard salen ya en https). Síntoma: el sync baja 0 locs o
    errores de mixed content/redirect **sin** mensaje de descarte. Se arregla con
    `forceHttps: true`, no con cambiar el `index` a mano. Verificá antes con un
    `Invoke-WebRequest` al shard por https.
14. **El repo es mixto LF/CRLF, y eso rompe las ediciones por script**: un script que quite
    o agregue líneas con literales `\n` contra un archivo en CRLF no matchea nada y
    **no falla** — parece que trabajó y el cambio no existe (pasó al remediar 9 claves
    huérfanas de `SIN_SITEMAP` en `watchlist.mjs`). Antes de armar los literales,
    detectá el salto de línea: aquí `watchlist.mjs` está en CRLF y `SKILL.md` en LF.
    Lo mismo pasa con las tools de edición: su `oldString` tiene que traer el `\r\n`.
    Es el mismo motivo por el que el corpus de contenido es mixto y toda regex de
    frontmatter lleva `\r?`.
15. **`<lastmod>undefined</lastmod>` no rompe el sync: lo pierde en silencio.**
    `isoDate()` no matchea `"undefined"`, devuelve `null` y la entrada se salta
    (`if (!fecha) continue`). El medio entra al catálogo "con éxito" pero sin esas
    entradas, y no sale ningún aviso. Radio Polar anunciaba ~10.000 locs y dejó
    8.118: el 15% venía con el `lastmod` literal `undefined` y sin fecha en el path.
    **Compará siempre los locs que anuncia el sitemap con las entradas que
    quedaron escritas** (el resumen del sync y el conteo por año lo delatan): un
    No es un caso único: Futura FM (Talca) perdió 1.199 de ~9.400 locs por lo mismo.
    medio puede quedar con un tercio menos de lo prometido.
16. **Un `urlRe` también sirve para tirar las fechas falsas, no solo para elegir
    artículos.** El Marino (Pichilemu) tiene 422 locs con fecha anterior a 2000
    (`/1913/02/02/nuestros-propositos/`): son páginas institucionales con la fecha de
    fundación del diario, no artículos. Con un `urlRe` que exige `/20\d{2}/` quedan
    las 17.976 reales y el archivo arranca en 2000 en vez de 1907.
17. **Si `check-fechas` dice "el locDateRe no matchea ninguna URL", el arreglo no
    es relajar el patrón: es decidir qué fecha manda.** Con el path `/YYYY/MM/`
    (sin día) un patrón de 3 grupos nunca matchea, y cambiarlo a 2 grupos no
    arregla nada: baja **todas** las fechas a día 01. Si el `<lastmod>` es de
    publicación y trae el día real (Alto La Dehesa), lo correcto es quitar
    `preferLocDate` y `locDateRe` y quedarse con el `lastmod`.
18. **Mide shards del principio y del final, no solo los primeros.** Los shards de
    1.000 locs de un mismo tipo no vienen en orden de fecha, y medir solo los
    primeros 25 dio una lectura falsa de dos medios del lote Radio:
    radiocomunicativa parecía arrancar en 2025 con ~15.600 artículos y en realidad
    tiene 11.739 con archivo **2013→2026**; y radioactiva parecía un archivo de
    2009-2021 con un único artículo de 2026, cuando son 47 shards que cubren
    2009→2026. La profundidad real solo aparece mirando el último shard.

---

## Comandos

| Comando | Qué hace |
| --- | --- |
| `pnpm run sitemaps-sync -- <medio>...` | robots → sitemap_index → sub-sitemaps → dedupe → JSONL por medio/año. Acepta varios medios en una llamada (evita el throttle y deja un solo `manifest.actualizado`) |
| `pnpm run sitemaps-resync` | Resync diario: merge incremental desde la `ultima_sync` de cada medio, más README y backup. Solo los medios ya presentes en `_manifest.json`; omite con aviso los slugs que ya no están en `MEDIA` |
| `pnpm run sitemaps-index` | Regenera `sitemaps/README.md` y `sitemaps/MEDIOS.md` |
| `pnpm run sitemaps-watchlist` | Regenera `TAREAS/tareas_sitemap.md` con el estado de cada sitio (✅ catálogo / 🟡 en uso / 🔒 sin sitemap / ⬜ pendiente) |
| `pnpm run sitemaps-probe -- <dominio>...` | Sondea candidatos y avisa si el dominio ya está catalogado o ya fue descartado (ver alta de medio) |
| `pnpm run sitemaps-backup` | Empaqueta el catálogo en `.gvault` (Brotli, compacto lossless) |
| `pnpm run news-search -- "<query>"` | RSS de Google News con resolución por título contra el catálogo |

Flags de `sitemaps-sync`: `--all`, `--list`, `--fresh`, `--no-cache`, `--limit N`,
`--stale N`, `--no-delay`, `--delay N`, `--incremental`, `--replace`, `--since-last-sync`,
`--since YYYY-MM-DD` / `--days N`.

`--since`/`--since-last-sync` filtran los sub-sitemaps históricos por la URL y, si no llevan
fecha, por el rango del XML cacheado: no tocan entradas antiguas. Son incompatibles con
`--replace`, que sí reconstruye desde cero (úsalo solo para corregir fechas degradadas).

`sitemaps-backup`: `--compact` (default, lossless verificado por SHA-256), `--bin`/`--text`,
`--chunk-size <MB>`, `--no-compact`, y para restaurar `--restore [src]` (auto-une las partes)
o `--join [src]`. La cabecera usa rutas portables, nunca absolutas (filtrarían el nombre de
usuario); `.gitattributes` marca los `.gvault` como binarios porque con `core.autocrlf` git
convertía LF→CRLF el payload y rompía el hash.

**Syncs en paralelo**: `main()` actualiza `_manifest.json` con lock entre procesos y
read-modify-write (escritura a temporal + rename atómico), así que dos syncos simultáneos no
pisan el manifest.

**Al agregar un medio a `MEDIA` no hay que tocar nada más**: los mapas `CATALOG_MEDIO_BY_DOMAIN`
/ `CATALOG_MEDIO_NAMES` de `scripts/extract/add-source.mjs` derivan solos de `MEDIA` vía
`mediaHosts()`. Si un dominio queda compartido con otro slug, fijar preferencia en
`CATALOG_HOST_OVERRIDES`; si el slug reemplaza a uno con datos, el viejo va a `*_LEGACY`.

---

## Buscar en el catálogo (antes de buscar en la web)

```bash
rg -i --no-heading -uu 'secreto bancario' sitemaps/theclinic/   # un medio
rg -i --no-heading -uu -g '*.jsonl' 'cerimedo' sitemaps        # todos
```

Dos flags no negociables: **`-uu`** porque los JSONL están gitignoreados y rg los respeta
(sin `-uu` devuelve 0 resultados *en silencio*), y **`-g '*.jsonl'`** al buscar en todo
`sitemaps/`, que excluye `.cache/` (XML crudo, varios GB).

Medio real: `rg` ≈ 114 ms contra 37 s de `Get-ChildItem | Select-String` (~320×). Sin rg:
`grep -ih 'término' sitemaps/<medio>/*.jsonl`.

El catálogo da URL + fecha (+ título real en los news-sitemaps recientes), **no el cuerpo**:
después del match hay que leer la URL. Si el término no aparece o el medio no está, recién
ahí pasar a búsqueda online.

`sitemaps/MEDIOS.md` es la lista de medios con su volumen y años; no la reproduzcas acá, se
desincroniza sola.

---

## `news-search` y la escalera para resolver una URL

Cuando el catálogo no cubre lo buscado (tema muy reciente, medio sin sitemap, JSONL
atrasado), el paso siguiente no es el websearch genérico sino
`pnpm run news-search -- "<query>"`: consulta el RSS de Google News (`hl=es-419&gl=CL`, sin
API key) y resuelve la URL original **por coincidencia de título** contra el catálogo.
Flags: `--since YYYY-MM-DD`, `--medio <subcadena>`, `--limit N` (8 es el máximo práctico),
`--all`, `--json`. Los ítems resueltos traen la URL lista para `fetch-content`; los
`[SIN RESOLVER]` traen el comando sugerido. Lo ya presente en el vault se oculta.

Escalera cuando eso no basta, en orden:

1. **`[RESUELTO]` puede apuntar al artículo equivocado**: la resolución es por título, no
   por ID, así que un titular reutilizado devuelve la URL de otro mes. Contrastar siempre
   la fecha del ítem con la del slug y con el `Published Time` del fetch. No calza → tratar
   como no resuelto.
2. **News-sitemap en vivo del medio** (cuando el JSONL local va atrasado): leer el endpoint
   que declara `robots.txt` y buscar el `<loc>` cuyo `<news:title>` coincida. Funciona
   aunque el slug no sea adivinable. Los sub-sitemaps suelen ordenar por fecha, así que las
   2-3 primeras páginas cubren lo reciente. Ojo: un slug adivinado que da 301 a la home no
   es evidencia de nada.
3. **`websearch` con el titular entre comillas** (y `site:` si hace falta). Es el sustituto
   cuando DDG bloquea: `html.duckduckgo.com` respondió 403 en sep-2026, pero `websearch`
   recuperó las URL exactas de T13, El País, Mala Espina y Chilevisión. Sin DDG, la forma
   HTML (`https://html.duckduckgo.com/html/?q=`) trae los resultados en `uddg=<URL
   codificada>`; `lite.duckduckgo.com` no resuelve DNS desde esta red.
4. **Sharding de sitemap en vivo**, cuando el news-sitemap ya rotó pero el mes sigue
   disponible: shards mensuales o de archivo (`Perfil` `sitemap/archive/YYYY/MM`,
   `Infodefensa` `sitemap/month/YYYYMM`, Meganoticias `…/content-noticias/sitemap-YYYY-MM.xml`).
   El video-sitemap de Meganoticitas sirve para encontrar la nota *de video* de una
   entrevista, que suele tener versión artículo con IDs contiguos.

Límites conocidos: los links `rss/articles/CBMi…` van cifrados (doble base64, no
decodificables localmente) y GDELT no responde desde esta red.

---

## Sitios sin sitemap: fetch directo bajo demanda

No se pueden agregar al catálogo; se leen con fetch/defuddle cuando hacen falta.

| Sitio | Estado |
| --- | --- |
| `bomberos.cl` | Joomla sin sitemap XML (todas las variantes OSMap/JMap/XMap dan 404). Su `/mapa-del-sitio` es HTML y solo lista estructura institucional, no los artículos (que viven en `/contenidos/<slug>`) |
| `camara.cl` | `sitemap.xml` responde 403 (WAF) incluso con User-Agent de navegador |
| `t13.cl` | Drupal `simple_sitemap` con una sola URL: la home |
| `chvnoticias.cl` | Todos los endpoints devuelven el HTML de la home |
| `pjud.cl`, `ssff.cl` | `robots.txt` 404, sin variantes |
| `bcn.cl` | Tiene sitemap, pero de portal: ~70k sub-sitemaps de normas LeyChile, no prensa |
| `puntofinal.cl`, `lediplomatique.cl`, `indh.cl`, `interferencia.cl` | Inaccesibles o bloqueados desde esta red al momento de verificar |

Los descartes de sitios de la watchlist están en `SIN_SITEMAP`
(`scripts/sitemaps/watchlist.mjs`) con su motivo, que es lo que produce la fila 🔒.

## Cobertura histórica

- **emol** es el más profundo: ~1999 en adelante (27 años). Lo sigue **La Segunda**:
  2000→hoy con hueco 2017-2021 (~903k artículos, fecha a nivel de mes).
- **elciudadano** llega a ~2004; biobiochile, radio_uchile y el_periodista a ~2008.
- **senado** tiene URLs desde ~2013 pero `lastmod` de migración (masa en 2024): buscar por slug.
- **Los medios grandes no llegan a pre-2009, pero algunos regionales sí**, porque su sitemap
  incluye el archivo digitalizado. `diarioelmarino` (Pichilemu) llega a **1907** con
  artículos de 1907, 1917 y 1944. Ojo con esos años antiguos: el slug viene de una
  digitalización con typos (`/1907/09/18/a-llico/`), así que sirve para **buscar por año o
  tema, no para citar textualmente**. Chequeá `sitemaps/MEDIOS.md` (columna Años) antes de
  asumir que una fecha es huérfana.
- **Para lo que sigue faltando**, usar Memoria Chilena / BND (hemeroteca digitalizada desde
  1811), Diario Oficial (PDFs desde 1875), BCN Historia Política Legislativa y LeyChile
  (normas desde 1739), todos fetch-on-demand como fuente institucional.

---

## Archivos relacionados

| Archivo | Qué buscar ahí |
| --- | --- |
| `sitemaps/MEDIOS.md` | Lista completa de medios con slug, sitemap, artículos y años (generada) |
| `sitemaps/README.md` | Resumen del catálogo por medio (generada) |
| `sitemaps/_manifest.json` | `ultima_sync`, artículos y años por medio (generada) |
| `TAREAS/tareas_sitemap.md` | Estado de cada sitio de la watchlist: ✅ / 🟡 / 🔒 / ⬜ (generada) |
| `scripts/sitemaps/media.mjs` | Config de cada medio, con el porqué de cada `includeRe` |
| `scripts/sitemaps/watchlist.mjs` | `SIN_SITEMAP`: descartes con su motivo |
| `references/medios.md` | Trampas por medio (bloqueos, fechas falsas, duplicados) |

## Scripts propios del skill

| Comando | Qué hace |
| --- | --- |
| `pnpm run sitemaps-probe -- <dominio>...` | Sondea candidatos: parsea el `robots.txt`, prueba los endpoints estándar, cuenta `<loc>`, reconoce el CMS y **avisa si el dominio ya está en `MEDIA` o ya fue descartado**, con el slug o el motivo. Sale con código ≠ 0 si hay conflicto |
| `node .agents/skills/sitemaps/scripts/check-fechas.mjs [slug...]` | Audita que la fecha guardada de cada artículo sea la de su URL, en todos los medios con `locDateRe` (o los slugs indicados). Es la forma objetiva de detectar las dos fallas de fecha silenciosas: `lastmod` de migración y desfase D+1 por huso horario. 100% de coincidencia es lo esperado; si falla, el arreglo casi siempre es `locDateRe` o `preferLocDate` + `--replace` |
| `node .agents/skills/sitemaps/scripts/check-markdown.mjs [<archivo.md>...]` | Revisa los markdown **generados** contra las reglas de markdownlint que marca el VS Code: MD058/MD022 (tablas y encabezados sin línea en blanco alrededor), MD033 (el `<lastmod>` de un motivo de `SIN_SITEMAP` se interpreta como etiqueta HTML), MD034 (URL desnuda), MD012. Sin argumentos revisa `TAREAS/tareas_sitemap.md`, `sitemaps/MEDIOS.md` y `sitemaps/README.md` |
| `node .agents/skills/sitemaps/scripts/report-awesome.mjs --verificar` | Cruce en las **dos direcciones** con awesome-chilean-rss: qué sitios del repo la bitácora todavía no evaluó, y qué medios del catálogo o citados en `src/content/sources/*.md` el repo no lista. Con `--verificar` busca `/feed/`, `/rss/`, `/rss.xml`, `/feed/atom.xml`… en cada candidato y separa los que responden con un feed real de los que no. Genera el reporte para devolver al repo (`--out`). Usa el clon hermano `../awesome-chilean-rss` o `--fuente <dir>` |

Los tres son de solo lectura: no escriben nada en el repo.

Los evals de este skill viven en `.agents/skills/sitemaps-workspace/` (gitignoreado):
`setup.mjs` crea un worktree por config con la versión nueva y la anterior del `SKILL.md`,
`grade.mjs` corre las aserciones objetivas, `restructure.mjs` ordena los informes para el
viewer de `skill-creator`, `aggregate.mjs` arma el benchmark y `cleanup.mjs` borra los
worktrees. Reejecútalos cuando cambie el skill y quieras comprobar que no dejó de cubrir algo.
