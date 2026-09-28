# Notas por medio

Trampas concretas de medios ya catalogados. **Cargar este archivo al sincronizar,
investigar o citar un medio específico** — no hace falta leerlo para agregar un
medio nuevo (eso vive en `SKILL.md` › Receta por CMS y Trampas recurrentes).

Regla de escritura: **una línea por trampa**, sin fechas ni números de tanda. Si un
medio nuevo trae una rareza, se agrega una fila acá, nunca una viñeta en `SKILL.md`.
El detalle de configuración de cada medio (endpoints, `includeRe`, `robots` vs
`index`) vive junto al código, en el comentario de su entrada en
`scripts/sitemaps/media.mjs`; esta tabla solo guarda lo que **no** se deduce leyendo
la config.

## Bloqueos y protocolos

| Medio | Trampa |
| --- | --- |
| `theclinic` | Detrás de Cloudflare challenge: curl/webfetch reciben 403 "Just a moment", pero el `fetch` de Node (el del sync) resuelve 200 |
| `el_periodista` | Sirve los `<loc>` en `http://` mezclados con https, y su `robots.txt` declara el sitemap en `http://`. Su índice es lento: si un sync se corta, relanzar el mismo comando (el caché y el modo merge retoman sin pérdida) |
| `elpais` | Bloqueo masivo de bots: `robots.txt` casi todo bloqueado y `/sitemap.xml` 404. No catalogable: usar fetch directo bajo demanda |
| `elregionalista` | El bare domain responde 406 sin User-Agent de navegador: usar siempre `www.` |
| `canal9` | Responde 403 a `sitemap.xml` incluso con UA de navegador |

## Fechas que no son la fecha del artículo

| Medio | Trampa |
| --- | --- |
| `cnnchile`, `pagina7` | Los sub-sitemaps mensuales regeneran el `<lastmod>` a la fecha del crawl (uniforme y falsa). Resuelto con `dateFromSitemapPath` (path `YYYY/MM`) |
| `meganoticias` | Sus shards mensuales no traen `lastmod` fiable → igual que CNN. Queda a nivel de mes (día 01) y puede desfasarse un mes del slug real: los IDs son secuenciales y la URL no lleva fecha |
| `senado` | URLs desde ~2013 pero el `lastmod` es de la migración del sitio (masa en 2024). Para eventos previos buscar **por slug** (suele llevar la fecha), nunca por fecha |
| `espaciopublico` | 1.008 de sus 2.000 URLs comparten `lastmod` 2021-06-13 (masa de una migración). Mismo criterio que senado: filtrar por slug |
| `aricachile` | Sus shards de noticias marcan la fecha de **regeneración**, no la del artículo (el shard 5700 dice jun-2023 con notas de mar-2018) |
| `lasegunda` | Mezcla `/Noticias/` y `/noticias/` en el path: el pre-filtro de `lookupCatalogUrl` necesitó fallback insensible a mayúsculas. Sin `<lastmod>`, la fecha va por `locDateRe` de 2 grupos |
| `dialogosur` | Sin `<lastmod>`: fecha por `locDateRe` de 2 grupos (día 01 aproximado). Ojo al costo: **cada sub-sitemap tarda ~22 s**, es el sync más lento del catálogo |
| `tvn` | Su `<lastmod>` es un **timestamp Unix en segundos**; `isoDate()` lo convierte a ISO |
| `la_hora` | Publica en hora local `-04:00` pero su `lastmod` y `news:publication_date` son el instante en **UTC**: ~12% de las 45k entradas quedaban fechadas D+1 (lo publicado después de las 20:00). Resuelto con `preferLocDate` + `locDateRe` sobre la fecha del path, que es la que declara el sitio en `datePublished`. Ojo: su `/sitemap.xml` **no declara** el `news-sitemap.xml` (que vive en `sitemap/news-sitemap.xml`), así que ese entra por `extra`, no por el índice |

## Volumen y duplicados

| Medio | Trampa |
| --- | --- |
| `biobiochile` | `static/sitemap-YYYY-MM.xml` es una **ventana móvil** de los últimos ~25 días, no el mes completo. Para fechas fuera de la ventana hay que ir a otro método. Su buscador web (`/buscador/`, `/buscar/`, `/search`) devuelve 404 |
| `canal9` | **No es medio independiente**: es el canal de TV de Radio Bío Bío y reproduce sus notas con la misma persona autora y **los mismos audios en `media.biobiochile.cl`**. No cuenta como segunda fuente. Además su sync fecha a nivel de mes aunque la URL lleve el día real (`/episodios/AAAA/MM/DD/...`): para citar, tomar la fecha de la URL, no la del catálogo |
| `elciudadano` | ~309 post-sitemaps, índice y subs lentos: el sitio rate-limitea y un fetch directo puede devolver 0 `<loc>`. Si el sync se corta, los subs cacheados en `.cache/` lo retoman (relanzar el mismo comando) |
| `espaciopublico` | El tope de 2.000 posts por archivo hace que el índice declare un `post-2.xml` **que no existe**: responde con el HTML de la home → 0 locs. Inofensivo, pero el catálogo queda topado en los posts más antiguos |
| `hvaradio` | El índice declara 4 shards visibles pero cada uno trae 2.000 URLs: el conteo del índice no es el del volumen real |
| `lasegunda`, `emol` | Fechas a nivel de mes (día 01) por `locDateRe` de 2 grupos |
| `publimetro` | Su `sitemap-index` solo lista `latest` + el día actual. Existen sitemaps por fecha (`/sitemap/YYYY-MM-DD/`) pero ningún índice los enumera: el sync captura solo lo reciente |
| `mestizos` | Índice por fechas (`/sitemap/sitemap-<DD-MM-YYYY>.xml`), ~2.400 sub-sitemaps diarios |
| `fastcheck` | Duplicados de fecha: un mismo slug puede aparecer con prefijo `/YYYY/MM/DD/` distinto (serie Cuenta Pública con slug idéntico en `/2026/06/03/` y `/2026/06/04/`). El canónico es el primero (HTTP 200); el otro da 404. Citar siempre el canónico |
| `chilepaisminero` | El índice trae los `<loc>` envueltos en CDATA y a veces sin protocolo; el parser los limpia (`extractSitemapIndexLocs`) |
| `diarioelmarino` | Su `robots.txt` no declara `Sitemap`: se sincroniza por `index` directo. Los primeros shards traen `<lastmod>` uniforme de la migración a WordPress (2023-04), así que sin `locDateRe` sus miles de URLs caen todas en 2023. Llega a **1907** por el archivo digitalizado, con typos en los slugs antiguos: útil para buscar por año/tema, no para citar |
| `elmostrador` | Su `sitemap_news.xml` usa el prefijo `n:` en vez de `news:`; el parser acepta ambos. Y el run de merge **mejora** títulos: si una URL aparece primero sin título y luego con título real, la segunda pasada la mejora (`news` > `slug`) |
| `ogmdh` | El `includeRe` de WP nativo descarta bien sus 5 CPTs de theme (`teams`, `portfolios`, `testimonials`, `rstb_template`) pero **ojo con `posts-events-1.xml`**: se lee como "eventos del observatorio" y son 10 locs de SEO spam en inglés de un theme de resume (concursos de dibujo, cursos de inglés). Un `includeRe` del tipo `wp-sitemap-posts-(post\|events)` metería ese relleno en el catálogo |
| `ruta2050`, `puertoapuerto` | Con `locDateRe` el año de la URL corrige el `<lastmod>` de forma medible: en `ruta2050` el `lastmod` daba 2024:160 / 2026:195 y el path da 2024:196 / 2026:159. `check-fechas` da 100% en ambos, o sea que el `lastmod` era de republicación, no de publicación |
| `ccs` | Yoast con 7 shards **sin cero a la izquierda y con guion** (`post-sitemap1.xml` … `post-sitemap7.xml`) más un `news-sitemap.xml`. El `ARTICLE_ONLY_RE` global (`post\|news-sitemap\d*\.xml$`) los cubre a todos; si escribís un `includeRe` propio, no uses `post-sitemap\d+\.xml$` con `\d+` estricto esperando cubrir shard 1 |
| `trnoticias` | El segundo shard se llama **`post-sitemap2.xml`, sin guion** (el primero es `post-sitemap.xml`). Cualquier regex con guion literal entre `post` y `sitemap` deja ese shard fuera y se pierden 295 artículos. Además la home `/` aparece como loc dentro del shard de posts |
| `iquiquehoy` | Sitemap propio **anual** (`sitemap-posttype-post.YYYY.xml`, 2020→2026). El `includeRe` necesita el sufijo opcional para dejar entrar el índice padre `/sitemap.xml` (trampa 1), y como el nombre del shard solo trae el año —no el `YYYY-MM-DD` que reconoce `sitemapUrlDate`— el filtro `--since` no lo acota: hay que bajar los 7 shards |
| `capodeprovincia` | El caso más limpio de `lastmod` = fecha de **edición** en el catálogo. 1.746 de sus 1.854 URLs tienen `lastmod` 2026-03 (la oleada de retoques), así que sin `locDateRe` el sync reporta "10 meses"; con `locDateRe` de 2 grupos (el path es `/YYYY/MM/<slug>`, sin día) aparecen **17 años, 2010-03→2026-09**. Diagnosticarlo cuesta un `Group-Object` sobre los meses del `lastmod` de una muestra: si un mes concentra la mitad del shard, es fecha de retoque, no de publicación |
| `santacruzfm` | Caso contrario y útil como control: el path **no** lleva fecha (slug pelado) y aun así el `lastmod` es la fecha real — los 2 shards van en orden cronológico (shard 1 = 2021-10→2026-05, shard 2 = 2026-05→2026-09) y la distribución mensual es plana, sin picos. Ojo con la conclusión inversa: que un medio use slug pelado no implica que su `lastmod` sea falso |

## Sin historia útil

| Medio | Trampa |
| --- | --- |
| `eldesconcierto` | Sitemaps sin historia: `sitemap.xml` ~8 recientes + `sitemap-news.xml` ~20. Todas las variantes históricas (año, post, archivos) devuelven 404 |
| `concierto` (y `infinita`, `rockandpop`, `los40`) | Comparten CMS (Iberoamericana): `out/sitemap.xml` es un urlset plano de ~36-50 artículos, sin historia. Cobertura solo reciente |
| `df`, `diarioestrategia` | Prontus con cobertura reciente (~87-100 URLs), sin historia profunda |
| `ex_ante` | NO declara sitemaps en `robots.txt`: se sincroniza por `index` directo |
| `el_siglo` | Usa canónico sin `www` (`elsiglo.cl`) |
