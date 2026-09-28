---
name: sitemaps
description: Catálogo local de sitemaps de prensa con JSONL, MEDIA, sync/index/backup y búsqueda con rg. Usa esta skill SIEMPRE al sincronizar sitemaps, buscar con rg -uu en sitemaps/, agregar medio, o antes de cualquier búsqueda web para evitar fetch redundante, incluso si solo dice 'buscar en sitemaps'.
---

## Catálogo de sitemaps (índice local de prensa)

Carpeta `sitemaps/` en la raíz: catálogo de artículos de prensa (URL + fecha + título si existe)
extraído de los sitemaps públicos de cada medio. Evita fetch/búsquedas web redundantes: el valor
está en la URL+fecha (post-sitemaps) y URL+fecha+título real (news-sitemaps, últimos 2-3 días).
NO guarda el cuerpo de los artículos.

> **Handoff:** si cambias `MEDIA` en `scripts/sitemaps/media.mjs`, `scripts/sitemaps/index.mjs`, `scripts/generate/generate-index.mjs` o el formato JSONL, actualiza este skill en la misma sesión.

### Regla clave: NO se commitea el catálogo

- `sitemaps/*.jsonl`, `sitemaps/.cache/`, `sitemaps/sitemaps.gvault` y sus partes
  `sitemaps.gvault.partN` están en `.gitignore`: BioBio pesa ~307MB y el
  catálogo es regenerable.
- Lo que SÍ se commitea: los scripts (`scripts/sitemaps/media.mjs` — registro `MEDIA` —, `scripts/sitemaps/sync.mjs`, `scripts/sitemaps/index.mjs`,
  `scripts/sitemaps/backup.mjs`, `scripts/generate/generate-index.mjs`), `package.json`, `sitemaps/_manifest.json` (estado de sync), `sitemaps/README.md` (resumen por medio), `sitemaps/MEDIOS.md` (tabla completa para editores, generada por `sitemaps-index`) y `README.md` › Estadísticas del vault (sección auto-generada por `generate-index`, antes `sitemaps/ESTADISTICAS.md`).
- Si se clona el repo, hay que correr `pnpm run sitemaps-sync -- <medio>` para regenerar local.
- **Excepción opcional (snapshot público)**: el catálogo completo comprimido pesa ~56MB
  (357MB crudos → compacto lossless + Brotli binario). Con `--chunk-size <MB>` se parte en
  trozos de ~28MB (`sitemaps.gvault.part1/2`), cada uno bajo el límite blando de 50MB de
  GitHub. Quien descargue todas las partes puede regenerar el catálogo con `sitemaps-backup --restore`
  (une las partes automáticamente) o `--join` (arma el .gvault único).

### Formato JSONL

`{ "u": url, "d": fecha ISO, "t": título (si existe), "s": "news"|"slug" }`
- `s:"news"` = título real del news-sitemap. `s:"slug"` = título aproximado derivado de la URL.

### Scripts

| Comando | Función |
| --- | --- |
| `pnpm run sitemaps-sync -- <medio>...` | robots.txt → sitemap_index → sub-sitemaps → dedupe → JSONL por medio/año. Flags: `--all`, `--list`, `--fresh`, `--no-cache`, `--limit N`, `--stale N`, `--no-delay`, `--delay N`, `--incremental`, `--replace`, `--since-last-sync`, `--since YYYY-MM-DD` / `--days N`. Filtrado por medio: `articleOnly` (Yoast: solo post/news-sitemap) o `includeRe` (whitelist custom, ej. FastCheck) o denylist genérica. `--since-last-sync` usa para cada medio la fecha UTC inclusiva de su `ultima_sync`; si falta, sincroniza completo. `--since`/`--days` fija una ventana común relativa a fecha/hoy. Todas filtran sub-sitemaps históricos por la URL y, si no llevan fecha, por el rango del XML cacheado; no tocan entradas antiguas y son incompatibles con `--replace` |
| `pnpm run sitemaps-resync` | **Resync manual diario**: sync MERGE incremental desde la `ultima_sync` de cada medio + regenera README + backup. Nunca borra datos existentes. Si algún endpoint falla, ese medio conserva su watermark anterior y el siguiente resync reintenta la misma ventana. Solo sincroniza los medios ya presentes en `_manifest.json` (los nuevos se agregan con `sitemaps-sync -- <medio>`). `--since YYYY-MM-DD` / `--days N` reemplaza el cutoff automático por una ventana común explícita. **Filtra huérfanos**: importa `MEDIA` desde `scripts/sitemaps/media.mjs` y omite con aviso (`⚠️`) los slugs del manifest que ya no están en el registro (entradas con `articulos: 0` de intentos watchlist descartados) — antes un solo slug desconocido abortaba el resync completo porque sync-sitemaps valida todos los targets upfront y hace `exit(1)` al primero desconocido |
| `pnpm run sitemaps-index` | genera `sitemaps/README.md` (resumen) + `sitemaps/MEDIOS.md` (tabla completa Slug/Nombre/Sitemap/Filtro/Artículos/Años para editores). Antes generaba además la sección “Medios registrados” de `AGENTS.md` (marcadores `AUTO-GENERATED-SITEMAPS-MEDIOS`); `AGENTS.md` solo apunta a `sitemaps/MEDIOS.md` + `README.md` + `_manifest.json` para evitar diffs ruidosos |

**Al agregar un medio nuevo** (a `MEDIA` en `scripts/sitemaps/media.mjs`): basta con `sitemaps-index`
(que regenera `sitemaps/MEDIOS.md` + `sitemaps/README.md`). Los mapas `CATALOG_MEDIO_BY_DOMAIN` /
`CATALOG_MEDIO_NAMES` de `scripts/extract/add-source.mjs` derivan solos de `MEDIA` (vía `mediaHosts()`),
así que el lookup del generador de fuentes reconoce el dominio sin alta manual. Excepciones: si el
dominio queda compartido con otro slug, fijar preferencia en `CATALOG_HOST_OVERRIDES` (avisa con `⚠️`
al cargar); si el slug reemplaza a uno con datos y el viejo debe seguir resolviendo, va a `*_LEGACY`.

**Anti-duplicados al dar de alta un medio** (el alta es por *slug*, no por dominio, así que nada
impide crear `lahora` junto a `la_hora`): sacar los candidatos **de las filas `⬜` de
`TAREAS/tareas_sitemap.md`** (un dominio que no aparece ahí ya está catalogado o ya se descartó) y
confirmar el dominio contra `MEDIA` / `sitemaps/MEDIOS.md` antes de escribir la entrada. Si el
dominio ya existe, **mejorar el `includeRe` del slug existente y resincronizar** en vez de agregar
otro: los JSONL se pueden copiar al directorio canónico y el manifest se actualiza a mano, porque
el run nuevo es un superconjunto del viejo cuando el `includeRe` solo agregaba shards.

Vault stats para editores (`README.md` › Estadísticas del vault, antes `sitemaps/ESTADISTICAS.md`) se generan con `pnpm run generate-index` (ver `AGENTS.md` → Build y verificación).

Notas de plataforma (complemento manual, no se reescribe):
- WordPress-Yoast (`articleOnly`: solo `post-sitemap*.xml` y `news-sitemap*.xml`): **El Clarín**,
  **Factchecking**, **CIPER**, **The Clinic**. Ojo: The Clinic está detrás de Cloudflare
  challenge — curl/webfetch recibe 403 "Just a moment", pero Node fetch (el del script) sí lo
  resuelve (200).
- **El Mostrador**: `sitemap.xml` (~101 URLs) + `sitemap_news.xml` (títulos reales con prefijo
  `n:` — el parser acepta `news:` o `n:`).
- **Fast Check CL**: sitemap custom con `includeRe` `/(?:posts-\d{4}|news)\.xml$/i` →
  `posts-YYYY.xml` + `news.xml` (títulos reales); descarta `pages/categories/authors.xml`.
  Ojo duplicados de fecha: un mismo slug puede aparecer con prefijo `/YYYY/MM/DD/` distinto
  (caso sep-2026: serie Cuenta Pública con slug idéntico en `/2026/06/03/` y `/2026/06/04/`);
  el canónico es el primero (`/06/03/`, HTTP 200; el `/06/04/` da 404) — citar siempre el canónico.
- **ADN Radio**: Arc XP (~100 URLs recientes, sin títulos). **La Tercera**: Arc XP paginado
  (`sitemap-index` → ~100 sub-sitemaps `?from=N`, ~10.000 artículos recientes; `news-sitemap-index`
  trae títulos reales; los `<loc>` del index llegan con `&amp;` que el parser decodifica).
  **BioBio**: sitemap mensual + news-sitemap. **Cooperativa**: sitemap de páginas + news.
- **CNN Chile / El Dínamo** (mismo CMS): `_files/sitemaps/sitemap_index.xml` (sub-sitemaps por
  mes desde 2011/2010) + `sitemap_lasts.xml` + `sitemap_news.xml` (títulos reales). Ojo CNN:
  el `<lastmod>` de los sub-sitemaps mensuales es la fecha de regeneración (uniforme y falsa);
  el script usa `dateFromSitemapPath` (path `YYYY/MM`) para fechar los artículos.
- **Radio Universidad de Chile / El Siglo / La Nación / Ex-Ante / El Periodista**: WordPress-Yoast
  (`articleOnly`). Ojo: El Periodista sirve los `<loc>` en `http://` (mezcla http/https en el
  index) y su `robots.txt` declara el sitemap en `http://`; su index es lento/throttle-friendly —
  si un sync se corta, relanzar: el caché y el modo merge retoman sin pérdida. Ex-Ante NO declara
  sitemaps en `robots.txt` (se usa `index` directo). El Siglo usa canónico sin `www` (`elsiglo.cl`).
- **Meganoticias** (CMS propio): `sitemap-noticias-index-content.xml` = índice mensual
  `content-noticias/sitemap-YYYY-MM.xml` desde 2011 + `sitemap-news.xml` (títulos reales). El
  `includeRe` descarta videos, secciones, autores, columnistas y hemeroteca (páginas de listado).
  Ojo: los sub-sitemaps mensuales NO traen `lastmod` fiable → `dateFromSitemapPath` (path `YYYY-MM`)
  como CNN. Las fechas quedan como aproximación a nivel de mes (día 01) y pueden desfasarse un
  mes del slug/URL real (IDs secuenciales, la URL no lleva fecha). ~434k artículos en 16 años.
- **Publimetro** (Arc XP): el `sitemap-index` solo lista `latest` + el día actual (sin índice
  histórico). Existen sitemaps por fecha (`/sitemap/YYYY-MM-DD/`) con decenas de URLs, pero no
  hay índice que los enumere: el sync captura solo lo reciente (~5-100 URLs).
- **Emol** (CMS propio): index por año desde 1992 (`sitemap{N}_{year}.xml`, ~8.000 URLs por
  sub-sitemap; ~1,1M artículos). El filtro temporal reconoce años 19xx y 20xx: desde
  una ventana como 2026-09-22 descarta los shards 1992–2025 y descarga solo los del
  año en curso; al ser shards anuales, luego filtra por fecha los artículos
  fuera de la ventana. El `robots.txt`
  declara además `sitemapIndexFotos.xml` y `sitemapIndexVideos.xml` (tv.emol.com) — el
  `includeRe` `sitemap\d+_\d{4}\.xml$` los descarta.
  **Ojo protocolo**: el index y los `<loc>` de los artículos vienen en `http://` pero el sitio
  solo responde por `https://` (curl/node fetch fallan con http) — el flag `forceHttps: true`
  normaliza ambos (sub-sitemaps y URLs guardadas). **Sin `<lastmod>` ni `news:date`**: la fecha
  real está en el path del artículo (`/noticias/<seccion>/YYYY/MM/DD/<id>/<slug>.html`), extraída
  con `locDateRe` (grupos YYYY/MM/DD) — día real, no aproximación de mes.
- **El Desconcierto**: sitemaps SIN historia (`sitemap.xml` ~8 recientes + `sitemap-news.xml` ~20
  con títulos reales); todas las variantes históricas (año, post, archivos) devuelven 404.
- **El Ciudadano / Mala Espina / El Quinto Poder / Radio UdeC / Chocale / REDIMIN**: WordPress-Yoast
  (`articleOnly`). El Ciudadano tiene ~309 post-sitemaps (~277k artículos, 18 años): el index y los
  subs son lentos y el sitio rate-limitea (fetch directo puede devolver 0 `<loc>`); si un sync se
  corta, los subs cacheados en `.cache/` retoman sin pérdida (relanzar el mismo comando).
- **El Filtrador** (`elfiltrador.com`, WordPress-Yoast `articleOnly`): index con `post-sitemap.xml`
  .. `post-sitemap23.xml` (~22,5k artículos, 9 años) más CPTs propios (`tdb_templates`, `persona`,
  `programa`, `tema`) que `articleOnly` descarta. Solo declara el sitemap en `robots.txt` (no en el
  index), se sincroniza por `index` directo.
- **Diario Financiero (df) / Diario Estrategia** (Prontus): robots declara sitemaps por separado
  (`extra`); el DF trae ~87 URLs recientes (pags + news + port) y Diario Estrategia ~100
  (`/sitemap/news` + `/sitemap/lastarticles`, IDs `/texto-diario/mostrar/`). Cobertura reciente,
  sin historia profunda.
- **Chile País Minero**: index con `<loc>` envueltos en CDATA (a veces sin protocolo) — el parser
  los limpia (ver `extractSitemapIndexLocs`). **Mestizos Magazine**: index por fechas
  (`/sitemap/sitemap-<DD-MM-YYYY>.xml`, ~2.400 sub-sitemaps diarios desde 2018, ~8,6k artículos).
- **pv magazine Latin America** (WordPress-Yoast, `articleOnly`): `includeRe` `/post-sitemap\.xml$/i`
  descarta los `post-sitemap2..15.xml`, `page/author/category/tag` y otros CPTs; ~1.000 artículos/2 años
  en la edición Latam. **Capa9** (XenForo): `sitemap.xml` es un índice mínimo de 2 sub-sitemaps
  `sitemap-1.xml`/`sitemap-2.xml` (~98k URLs, ~37k artículos, 18 años). **Coaniquem**
  (WordPress 5.5+ nativo): `sitemap.xml` → `wp-sitemap.xml` → `wp-sitemap-posts-post-1.xml` con
  `includeRe` `/wp-sitemap-posts-post-\d+\.xml$/i` (descarta page/taxonomies/users); ~81 artículos.
- **Canal 9 (`canal9.cl`)**: es el canal de televisión de **Radio Bío Bío**, no una redacción propia. Reproduce notas de Radio Bío Bío con la misma persona autora y **los mismos audios alojados en `media.biobiochile.cl`** (caso sep-2026: la nota "ONU busca vincular impuestos y derechos humanos", de Vanesa Gajardo, aparece el mismo día en `biobiochile.cl` y en `canal9.cl` con los MP3 de Deloitte y de la U. de Chile idénticos). **No cuenta como medio independiente**: duplica la fuente Radio Bío Bío. Además su sync fecha a nivel de mes (`d` = día 01) aunque la URL lleve el día real (`/episodios/AAAA/MM/DD/...`, p. ej. `d=2026-07-01` para un artículo del 29-jul) — tomar siempre la fecha de la URL, no la del catálogo
- **Tanda internacional (07-09-2026)**: **ANSA Latina** declara en robots el index
  `sitemaps/sito_sitemap_index.xml` → único urlset con `news:news` (títulos reales, reciente con
  `lastmod` por artículo; ~109 URLs. Fuera de robots, `/sitemap.xml` es 404 — usar el index de robots).
  **BBC Mundo**: robots declara ~38 sitemaps; `includeRe` `/\/mundo\/sitemap\.xml$/i` deja solo la
  edición Mundo (~100 URLs, `lastmod` reciente). **El País (elpais.com)**: bloqueo masivo de bots en
  robots.txt y `/sitemap.xml` devuelve 404 → **no catalogable**, usar fetch directo bajo demanda.
  **El Mercurio Edición Impresa (impresa.elmercurio.com)**: inaccesible/DNS fail → no catalogable.
- **IPS Agencia de Noticias** (WordPress-Yoast, `articleOnly` sobre `wp-sitemap.xml`): 109.962
  artículos en 33 años (~1993+). **MercoPress es** (SPIP): `includeRe` `/\/archive\/\d{4}\.xml$/i`
  filtra los archivos anuales (46.637 artículos, 14 años); el `main.xml` mezcla páginas/portada.
  **Le Monde Diplomatique ed. chilena** (SPIP): robots sin línea Sitemap; `includeRe` no aplica,
  `index: /sitemap.xml` directo (~7 artículos — portal chico). **Defensa Civil de Chile**
  (WP 5.5+ nativo `wp-sitemap-posts-post-N.xml`, 229 artículos). **El Periódico de la Energía**:
  `index: /sitemaps/sitemap.xml` (91.452 artículos, 13 años). **Nexos Chile** (Yoast
  `post-sitemap.xml`, 19 artículos — consultora, bajo volumen).
- **Tanda batch 13 (27-09-2026, 5 pendientes ⬜ de `tareas_sitemap.md`)**: **TVN**
  (Prontus: `extra: tvn/site/sitemap_pags.xml`, índice mensual `.xml.gz` 2022-09→hoy,
  ~68k artículos/5 años; `includeRe` `/sitemap_pags_\d{6}\.xml\.gz$/i` descarta
  `ports`/`tax`. OJO doble: el `robots.txt` se sirve como `text/plain` y el crawler
  lo rechaza — por eso `extra` directo en vez de `robots`; y el `<lastmod>` es
  timestamp Unix en segundos, que `isoDate()` convierte a ISO). **Radio Duna**
  (custom: `index: duna.cl/sitemap.xml`, `includeRe` `/\/articles(_\d+)?\.xml$/i`
  deja `articles.xml` + `articles_2.xml`, ~47,5k artículos/2 años; descarta
  categories/shows/lives/episodes). **Terra Chile** (`robots`, `includeRe`
  `/(?:articles\/\d{4}-\d{2}\.xml|news\.xml)$/i`: mensuales `articles/YYYY-MM`
  desde 2020-06 + `news.xml` con títulos reales, ~42k artículos/6 años; descarta
  sections/topics/authors/static). **El Regionalista** (All in One SEO:
  `index: www.elregionalista.cl/sitemap.xml`, `articleOnly` cubre
  `post-sitemap[2,3].xml`, ~2k artículos/6 años; el bare domain da 406 sin UA
  de navegador — usar `www`). **Radio Concierto** (CMS Iberoamericana:
  `robots` declara `out/sitemap.xml` plano + `news-sitemap.xml` con títulos
  reales; cobertura solo reciente, ~36 artículos — mismo CMS que
  Infinita/Rock&Pop/Los40, candidatas para el próximo batch).
- **Tanda batch 14 (28-09-2026)**: **La Segunda** (CMS propio: índice de 199
  sub-sitemaps paginados `sitemap{N}_{YYYY}.xml`, 2000→hoy con hueco 2017-2021,
  ~903k artículos/21 años; `includeRe` `/sitemap\d+_\d{4}\.xml$/i`. Sin `<lastmod>`:
  fecha real en el path `/Noticias/<seccion>/YYYY/MM/` vía `locDateRe` de 2 grupos
  (día 01 aproximado — `extractPairs` acepta día ausente). OJO: mezcla
  `/Noticias/` y `/noticias/` en el path — el pre-filtro de `lookupCatalogUrl`
  necesitó fallback insensible a mayúsculas). **Página 7** (mismo CMS que CNN:
  `_files/sitemaps/YYYY/MM.xml` 2014/07→hoy + `sitemap_lasts.xml` +
  `sitemap_news.xml` con títulos reales, ~222k artículos/13 años;
  `dateFromSitemapPath` como CNN por `<lastmod>` regenerado).
- **Tanda batch 15 (27-09-2026, 3 pendientes ⬜ de `tareas_sitemap.md`, +11.084
  artículos)**: **Espacio Público** (WP 5.5+ nativo, `includeRe`
  `/wp-sitemap-posts-post-\d+\.xml$/i`, 2.000 artículos 2016→2024). OJO dos límites:
  el tope de 2.000 posts por archivo hace que el índice declare un `post-2.xml`
  **que no existe** (responde con el HTML de la home → 0 locs, inofensivo) y el
  catálogo queda topado en los posts más antiguos; además **1.334 de las 2.000 URLs
  comparten `<lastmod>` 2021-06-13** (masa de una migración del sitio, mismo caso que
  `senado`) — buscar por slug, nunca por fecha. **La Voz de Pucón** (WP nativo,
  `post-1..3.xml`, 4.741 artículos 2018-05→hoy, `<lastmod>` reales; los shards se
  solapan en rango porque WordPress pagina por chunks de 2.000, no por fecha).
  **Región de Coquimbo** (Yoast, `articleOnly`, `post-sitemap.xml`..
  `post-sitemap5.xml`, 4.343 artículos 2022-10→hoy). Descartados del mismo sondeo:
  `laderasur.com` (sin línea Sitemap; `/sitemap.xml` es urlset plano de 27 URLs,
  `/sitemap_index.xml` 404), `eldesarrollo.cl` (urlset plano de 236 URLs sin historia
  + `news-sitemap.xml` de 19), `infosalmon.cl` (13), `espacioregional.cl` (6),
  `revistanos.cl` (403 en `sitemap_index.xml`), `contraplano.cl` (404),
  `eldiariodemaule.com` (el índice solo lista `page-sitemap` + `blocks-sitemap`, sin
  posts), `rockandpop.cl`/`infinita.cl` (mismo CMS Iberoamericana que `concierto`:
  `out/sitemap.xml` urlset plano, ~38 y ~50 artículos, sin historia). Patrón WP 5.5+
  nativo dominante en la watchlist: `includeRe`
  `/wp-sitemap-posts-post-\d+\.xml$/i` + `articleOnly` (como `coaniquem`,
  `defensacivil`); el `wp-sitemap.xml` de estos sitios lista además taxonomías y
  CPTs (page/event/equipo/documentos/areas/tribe_*/users) que `articleOnly` descarta.
- **Verificados SIN sitemap utilizable (28-09-2026)**: **T13** (Drupal
  `simple_sitemap` con 1 sola URL = la home). **CHV Noticias** (`/sitemap.xml`,
  `/sitemap_index.xml`, `/news-sitemap.xml` y `/wp-sitemap.xml` devuelven el HTML
  de la home). **Poder Judicial** (`robots.txt` 404) y **SSFF** (`robots.txt` 404)
  → `SIN_SITEMAP` en `watchlist.mjs`. **BCN** (`bcn.cl/sitemap.xml`): índice real
  pero de portal (~70k sub-sitemaps de normas LeyChile, no prensa) → no catalogable
  como prensa, también en `SIN_SITEMAP` con nota. **`ine.cl` no es el INE**
  (el real es `ine.gob.cl`, tampoco con sitemap): `DEFAULT_DOMAIN_MEDIO` remapeado
  a `ine.gob.cl`.
- **Tanda batch 16 (27-09-2026, 3 pendientes ⬜ de `tareas_sitemap.md`)**: **Diálogo Sur**
  (Punta Arenas/Magallanes; Yoast, `includeRe` `/\/post-sitemap\d*\.xml$/i` sobre 41
  shards ~1.000 URLs desde 2010; **sin `<lastmod>`** → `locDateRe` de 2 grupos
  `/(20\d{2})\/(\d{2})\//`, día 01 aproximado como `lasegunda`; se usa `includeRe` y no
  `articleOnly` porque su `sitemap-news.xml` devuelve 1 loc = la home. OJO **cada
  sub-sitemap tarda ~22 s**: el sync completo es el más lento del catálogo).
  **Primera Fuente** (Curicó/Maule; Yoast `sitemap_index`, `post-sitemap.xml`..
  `post-sitemap5.xml`, 4.314 artículos 2021→hoy con `<lastmod>` reales; los shards
  antiguos mezclan notas regionales con posts de SEO en inglés → filtrar por slug).
  **Diario Aconcagua** (San Felipe/Valparaíso; **Wix**, no WP: los artículos están en el
  CPT `blog-posts` → `includeRe` `/blog-posts-sitemap\.xml$/i` porque `articleOnly`
  solo reconoce `post-sitemap*.xml`; 3.640 artículos 2015→2026, `<lastmod>` reales).
  Descartados del mismo sondeo: `lun.com` (robots 200 sin línea Sitemap),
  `elmatutino.cl` (`/sitemap.xml` = 1 loc, la home), `noticiasimportantes.com`
  (0 locs), `sancarlosaldia.cl` (404), `diarioelcondor.cl` (`wp-sitemap.xml` solo
  declara `posts-page` + taxonomías, sin posts), `eldiariodecuracavi.cl` (un solo
  `post-sitemap.xml` residual), `m360.cl` (DNS fail en
  `/noticias/sitemap_pags.xml` pese a la línea Sitemap del robots),
  `radiovalparaiso.cl` (843 artículos 2024-07→2026-05, topado y stagnant: sin shard
  nuevo desde mayo).
- **Tanda batch 17 (27-09-2026, 3 pendientes ⬜ de `tareas_sitemap.md`, +37.470
  artículos)**: **CauquenesNet** (Cauquenes, Maule; tema WP con sitemaps paginados:
  `robots` → `/sitemap.xml` → `sitemap-index-1.xml` → `sitemap-N.xml`, 20.449
  artículos 2017→2026 con `<lastmod>` reales y path `/YYYY/MM/DD/<slug>`). El
  `includeRe` tiene que aceptar **el índice anidado**:
  `/\/(?:sitemap-(?:index-)?\d+|news-sitemap)\.xml$/i` — con el patrón sin
  `sitemap-index` el sync solo baja el news-sitemap y cataloga 12 URLs (tuve que
  `--replace`); el ancla `\/` inicial es lo que descarta
  `image-sitemap-index-1.xml` y `video-sitemap-1.xml`, porque sin ella
  `video-sitemap-1.xml` matchea el patrón `sitemap-1.xml` y mete 8 URLs de video.
  **El Huemul** (Chaitén, Los Lagos; Yoast `post-sitemap1..4.xml`, solo 812
  artículos 2024→2026). **Radio HVA** (Atacama; WP 5.5+ nativo
  `wp-sitemap-posts-post-1..9.xml`, **16.209 artículos 2019→2026**: el índice solo
  declara 4 shards visibles, pero cada uno trae 2.000 URLs, muy por encima del
  conteo que anuncia `wp-sitemap.xml`). Descartados del mismo sondeo:
  `davidnoticias.cl` (índice de **1.292 shards que son íntegramente SEO spam**
  `?id=link-slot*`/`daftar-slot*`, sin un solo artículo), `radiocristalina.cl`
  (wp-sitemap con 1 solo shard post), `radioaustralvaldivia`, `radioguayacan`,
  `radiobuenanueva`, `diariolaguino`, `diarioriobueno`, `diariolanco`,
  `diariomafil` (sitemaps planos sin índice ni news), `ceinoticias`/`estrellavalpo`
  (DNS o 404).
- **Tanda batch 18 (27-09-2026, 2 pendientes ⬜ de `TAREAS/tareas_sitemap.md`)**: **Diario
  Futrono** (Río Bueno, Los Lagos; tema WP con sitemap **mensual** propio
  `/sitemap/YYYY/MM/sitemap-pt-post.xml`, 179 meses listados desde 2011/11 pero con
  contenido real desde 2013 → **56.725 artículos 2013→2026**; `includeRe`
  `/\/sitemap\/\d{4}\/\d{2}\/sitemap-pt-post\.xml$/i` descarta el
  `category-sitemap.xml` de la raíz). **PanoramicAysén** (Puerto Aysén; **Wix**
  como `diarioaconcagua`: `includeRe` `/blog-posts-sitemap\.xml$/i`, 3.695
  artículos 2024-03→hoy). **La Hora** se consolidó en vez de agregarse: el repo
  tenía **dos slugs para el mismo dominio** (`la_hora` y `lahora`, el segundo
  desde ago-2026 con 44.538 artículos redundantes). Se copiaron los JSONL de
  `lahora` —que eran un subconjunto— al directorio `la_hora`, se borró la entrada
  duplicada de `MEDIA` y de `_manifest.json`, y el `includeRe` de `la_hora` pasó a
  `/\/sitemap\/(?:sitemap-\d{2}-\d{2}-\d{4}|news-sitemap)\.xml$/i`, lo que suma
  el `sitemap/news-sitemap.xml` (250 URLs con **título real**) y descarta
  `sitemap/latest.xml`; el catálogo quedó en 45.656 artículos 2024→2026 (18.934 /
  16.871 / 9.851 por año). El path `DD-MM-YYYY` de los shards lo reconoce
  `sitemapUrlDate` (2º patrón), así que el resync `--since` omite los días
  antiguos **por URL, sin descargar los shards**; ojo que la mitad de las ~95k URLs
  descargadas son duplicados dentro del propio run (el mismo artículo se lista en
  varios días y en el news-sitemap), por eso el log reporta `+N nuevos` muy por
  debajo del total. Descartes de la tanda: `werken.cl`
  (índice plano de ~90 artículos de temática mapuche, sin paginación), `chilenews.cl`
  (100 planos), `laopiniononline.cl`/`montealegre.cl`/`laliguanoticias.cl`/
  `angelino.cl` (WP pero 1-3 shards residuales), `prensacurico.cl`/`maulealdia.cl`/
  `quintainterior.cl`/`radioaraucania.cl`/`eldiariopanguipulli.cl` (los 4 endpoints
  WP devuelven 0 locs), `lapaila.cl`/`terceradosis.cl`/`informechile.cl`
  (índices de 2-3 entradas) — todos anotados en `SIN_SITEMAP` con su motivo.
- **Tanda batch 19 (28-09-2026, 3 pendientes ⬜ de `TAREAS/tareas_sitemap.md`)**: **Aysén
  TV** (Puerto Aysén; **urlset plano** de 1.011 URLs = 1.000 artículos con path
  `/YYYY/MM/DD/<slug>` 2024→hoy + 11 páginas estáticas → `urlRe`
  `/\/20\d{2}\/\d{2}\/\d{2}\//` para dejar solo los artículos, y `locDateRe` porque el
  `<lastmod>` del primer `<url>` (2026-08-27) no corresponde al artículo más
  reciente del listado). **Arica Chile** (Tarapacá; robots declara 5 familias
  `news`/`google-news`/`static`/`categories`/`tags`; `news` y `google-news` son
  **índices paginados de 100 en 100** `news/{0,100,…}` → 5.694 artículos
  2018-03→2026-09. El `includeRe` es
  `/\/sitemap\/(?:news|google-news)(?:\/\d+)?\/sitemap\.xml$/i`: el **sufijo
  opcional es obligatorio** para que entre el índice padre además de sus hijos (sin
  él el sync descarta el índice y baja 0). OJO su `<lastmod>` es la **fecha de
  regeneración**, no la del artículo (el shard 5700 marca 2023-06 con artículos de
  2018-03) → fecha por `locDateRe`. **Diario Mapuche** (1.291 artículos
  2022→2026, Yoast `post-sitemap1..7.xml`). Descartados: `tehuelchenoticias.cl`
  (Wix: `store/sitemap-dru-index.xml` responde 0 locs), `region2.cl` (500 planos),
  `temucoya.cl` (76 meses mensuales pero solo ~1.000 artículos),
  `chillanonline.cl`/`centralnoticias.cl`/`eldiariopanguipulli.cl`/
  `periodicolosrios.cl`/`lavozdevaldivia.cl`/`arica365.cl`/`mapuexpress.org`/
  `rengonotas.cl` (nada).

| `pnpm run sitemaps-watchlist [-- --source <ruta>] [--offline] [--out <archivo>]` | genera `TAREAS/tareas_sitemap.md` (default): bitácora de sitios de prensa chilenos (awesome-chilean-rss `feeds-database.json` + `watchlist.json` descargados online desde `raw.githubusercontent.com` por defecto; `--source <ruta>` o `--offline` fuerza copia local) pendientes de sincronizar su sitemap al catálogo, cruzados por estado (✅ catálogo / 🟡 usado en src/content/sources|organizations / ⬜ pendiente). Solo categorías de prensa y afines (noticias, regional, gobierno, radio, partidos, negocios, comunidad, medio ambiente, educación, salud, cultura) y solo la URL del sitio. Regla de match (28-09-2026): ✅ exige evidencia de **dominio** (primera URL de los JSONL o hosts de `MEDIA`); el match solo-por-nombre NO marca ✅ (caso `lasegunda.cl` muerto vs `lasegunda.com` catalogado) sino nota `[medio en catálogo como <slug>]` —solo si el slug trae artículos— y en Notas el veredicto de catálogo manda sobre el estado del feed. `SIN_SITEMAP` curado (~90 dominios con motivo: flat urlset / DNS / 450 conglomerado / 403 / 0 artículos / spam): esos ⬜ pasaron a 🔒 para no reintentar. **Todo medio que se descarte después de sondearlo debe anotarse ahí con su motivo** (el comentario `Descartados batch N` de `media.mjs` es solo el resumen del sondeo, no el registro): sin la entrada, la fila vuelve a ⬜ en la siguiente regeneración y el próximo agente re-sondea lo mismo. La nota debe decir **qué se verificó**, no "no sirve" (ej. `'/sitemap.xml responde 0 locs'`, `'wp-sitemap.xml solo declara posts-page, sin posts'`). Precedencia de estados: ✅ catálogo > 🟡 en uso > 🔒 sin sitemap > ⬜ pendiente, así que **nunca anotas en `SIN_SITEMAP` un dominio que ya esté en `MEDIA`** (sobra y da una nota contradictoria; el ✅ gana solo porque se evalúa antes) |
| `pnpm run sitemaps-backup` | empaqueta `sitemaps/` en `sitemaps/sitemaps.gvault`. **Compacto lossless por defecto** (`--compact`): los JSONL se transforman a un formato tab-separado que omite dominio (1× por archivo) y títulos derivables del slug; el restore reconstruye el JSONL byte-idéntico (verificado por SHA-256). **Payload binario v3**: el contenido viaja como header JSON pequeño (índice de offsets por archivo + manifest SHA-256) seguido de un blob de bytes crudos concatenados; el restore localiza cada archivo por `off/len`. Antes el payload era un único `JSON.stringify` con los archivos en base64: cuando el catálogo superó ~500MB de JSONL ese string excedía el límite de V8 (`RangeError: Invalid string length`). El restore sigue leyendo los .gvault v2 (base64) existentes. **Contenedor binario por defecto** (`--bin`): payload Brotli como bytes crudos (~25% menos que base64; `--text` para el formato v1 legible). **`--chunk-size <MB>`**: parte el snapshot en `<out>.part1, .part2…` (~28MB c/u con `45`; bajo el límite de 50MB de GitHub); `meta.chunks` indica el total. `--restore [src]` auto-detecta y une las partes; `--join [src]` arma el .gvault único. Resultado: ~94MB (vs ~690MB raw). `--no-compact` guarda JSONL crudo |

Detalle de merge: el dedupe del run (`seen`) NO bloquea el upgrade de títulos entre sub-sitemaps
— si una URL aparece primero sin título y luego con título real (caso El Mostrador), la segunda
pasada mejora la entrada (`news` > `slug`).

**Syncs paralelos**: `main()` actualiza `_manifest.json` por medio con un lock entre procesos y
read-modify-write; el JSON se escribe a un temporal y se renombra atómicamente, con retries para
locks transitorios de Windows/antivirus. Correr medios en paralelo ya no pisa el estado ni trunca
el manifest. Aun así, para varios medios conviene pasarlos como argumentos en un solo comando
(`pnpm run sitemaps-sync -- el_siglo la_nacion ...`): evita el throttle de los sitios y deja un
solo `manifest.actualizado`.

**Corrección de fechas (CNN, `dateFromSitemapPath`):** en modo merge la fecha solo se actualiza
si el cambio es dentro del mismo año (la URL se busca en el mapa del año de la nueva fecha). Si un
medio quedó con fechas falsas por un `<lastmod>` uniforme (caso CNN),
reconstruir con `pnpm run sitemaps-sync -- cnnchile --replace` (el sitemap lista todo el historial,
así que es seguro); después los resync incrementales no vuelven a degradar fechas.

**Privacidad e integridad del .gvault:**
- La cabecera INFORMACION usa **rutas portables** (relativas al repo o solo el
  nombre del archivo), nunca rutas absolutas locales: un .gvault anterior
  incrustaba `C:\Users\<usuario>\...\sitemaps.gvault`, filtrando el nombre de
  usuario y la ruta de disco de quien generó el backup. `displayPath()` en
  `scripts/sitemaps/backup.mjs` centraliza esta regla (también en los mensajes de
  consola).
- `.gitattributes` marca `*.gvault` y `*.gvault.part*` como **binarios** (`binary`):
  con `* text=auto` + `core.autocrlf=true` (Windows) git convertía LF→CRLF en el
  payload Brotli, rompiendo el SHA-256 y haciendo el snapshot no restaurable.
  Si los `.partN` se publican (excepción snapshot), deben regenerarse tras
  cualquier cambio y verificarse con `--restore` a un directorio temporal.

### Integración con add-source.mjs (IMPLEMENTADA)

`add-source.mjs` consulta el catálogo ANTES de hacer fetch web:

- **Lookup por URL**: si la URL pasada está indexada en el catálogo, pre-carga fecha y (si hay)
  título sin tocar la red. Con `s:"news"` (título real) salta el fetch por completo; con
  `s:"slug"` (título aproximado) intenta el fetch para obtener el título real y usa el catálogo
  como fallback. Normaliza la URL (quita `www.`, params de tracking `utm_*`/`fbclid`, hash).
- **`--catalog-only`**: nunca hace fetch; usa solo datos del catálogo (útil cuando el medio
  bloquea o para construir la fuente sin red).
- **`--search <texto>`**: busca en el catálogo (título/URL/fecha, normalizado sin acentos),
  lista resultados más recientes primero y deja elegir. Filtros: `--medio <slug>` y
  `--fecha YYYY-MM-DD`.
- Medios del catálogo: `elclarin`, `biobiochile`, `cooperativa`, `adnradio`, `factchecking`,
  `ciper`, `theclinic`, `elmostrador`, `emol`, `fastcheck`, `latercera`, `cnnchile`,
  `eldinamo`, `radioagricultura`, `radio_uchile`, `el_siglo`, `la_nacion`, `ex_ante`,
  `el_periodista`, `elfiltrador`, `meganoticias`, `eldesconcierto`, `publimetro`, `elciudadano`, `df`,
  `malaespina`, `elquintopoder`, `radioudec`, `chocale`, `redimin`, `chilepaisminero`,
  `mestizos`, `diarioestrategia`, `pvmagazine`, `capa9`, `coaniquem`, `ansalatina`, `bbc`,
  `ipsnoticias`, `mercopress`, `lemondediplomatique`, `defensacivil`,
  `elperiodicodelaenergia`, `nexos`, `elpais`, `elmegacl`, `tvn`, `duna`, `terra`,
  `elregionalista`, `concierto`, `lasegunda`, `pagina7`, `espaciopublico`,
  `dialogosur`, `primerafuente`, `diarioaconcagua`, `cauquenesnet`, `elhuemul`,
  `hvaradio`, `diariofutrono`, `panoramicaysen`,
  `lavozdepucon`, `regiondecoquimbo`, `aysentv`, `aricachile`, `mapuchediario`.
  (`la_hora` = La Hora; el slug `lahora` se
  consolidó en él, ver la nota anti-duplicados.)
  Si el dominio no está en el catálogo, el flujo es el clásico (fetch + mirrors).
- El módulo exporta funciones puras (`lookupCatalogUrl`, `catalogSearchAndPick`, `buildBlock`,
  `normalizeUrlForMatch`) para testing; el flujo interactivo solo corre si se invoca directo.

### Uso del catálogo por agentes (antes de búsquedas online)

Regla general (también en "Reglas al crear/modificar eventos", punto 14): al investigar un tema,
los agentes deben consultar el catálogo local ANTES de hacer búsquedas web, al menos para los
medios guardados:

```bash
# buscar artículos por término en un medio (URL + fecha + título si es news)
rg -i --no-heading -uu 'secreto bancario' sitemaps/theclinic/
# buscar en todos los medios guardados a la vez
rg -i --no-heading -uu -g '*.jsonl' 'cerimedo' sitemaps
```

**Dos flags críticos con ripgrep** (<https://github.com/BurntSushi/ripgrep;> verificar con
`rg --version`):

- **`-uu` obligatorio**: los JSONL están gitignoreados y rg respeta `.gitignore` por defecto —
  sin `-uu` devuelve **0 resultados en silencio**.
- **`-g '*.jsonl'` al buscar en todo `sitemaps/`**: excluye `sitemaps/.cache/` (XML crudo
  descargado, varios GB) — sin el glob la búsqueda puede tardar minutos.

Benchmarks reales (catálogo completo, término 'cerimedo'): `rg` ≈ **114 ms**
(36 matches) vs `Get-ChildItem | Select-String` ≈ **37 s** (~320× más lento). Fallback en
entornos Unix sin rg: `grep -ih 'término' sitemaps/<medio>/*.jsonl`. Instalación Windows:
`winget install BurntSushi.ripgrep.MSVC` (o scoop/choco/cargo install ripgrep).

- El catálogo entrega solo URL + fecha (+ título real en los news-sitemaps de los últimos días);
  NO contiene el cuerpo del artículo. Después del match hay que leer la URL (`read_url` o los
  mirrors de la sección "Extraccion de contenido web").
- Si el término no aparece o el medio no está en el catálogo, recién ahí usar búsquedas online.
- Medios cubiertos: `biobiochile`, `elmostrador`, `theclinic`, `cooperativa`, `elclarin`,
  `adnradio`, `ciper`, `factchecking`, `fastcheck`, `latercera`, `cnnchile`, `eldinamo`,
  `radioagricultura`, `radio_uchile`, `el_siglo`, `la_nacion`, `ex_ante`, `el_periodista`,
  `elfiltrador`, `meganoticias`, `eldesconcierto`, `publimetro`, `elciudadano`, `df`, `malaespina`,
  `elquintopoder`, `radioudec`, `chocale`, `redimin`, `chilepaisminero`, `mestizos`,
  `diarioestrategia`, `emol`, `senado`, `pvmagazine`, `capa9`, `coaniquem`, `ansalatina`,
  `bbc`, `ipsnoticias`, `mercopress`, `lemondediplomatique`, `defensacivil`,
  `elperiodicodelaenergia`, `nexos`, `tvn`, `duna`, `terra`, `elregionalista`, `concierto`,
  `lasegunda`, `pagina7`, `espaciopublico`, `lavozdepucon`, `regiondecoquimbo`,
  `dialogosur`, `primerafuente`, `diarioaconcagua`, `cauquenesnet`, `elhuemul`,
  `hvaradio`, `diariofutrono`, `panoramicaysen`, `la_hora`, `aysentv`, `aricachile`,
  `mapuchediario`.
  (Los JSONL no se commitean; regenerar con
  `pnpm run sitemaps-sync -- <medio>` si el repo se clona.)

### Descubrimiento online con Google News RSS (`news-search`)

Cuando el catálogo no cubre lo buscado (tema muy reciente, medio sin sitemap o
catálogo desactualizado), el paso siguiente NO es el websearch genérico sino
`pnpm run news-search -- "<query>"` (`scripts/sitemaps/news-search.mjs`): consulta
el RSS de Google News (`hl=es-419&gl=CL`, sin API key) y devuelve título + medio +
fecha por ítem, resolviendo la URL original contra el catálogo por coincidencia
de título. Lo ya presente en el vault se oculta (dedupe por URL y por título).

```bash
pnpm run news-search -- "Democracia Siempre" --since 2026-08-30
pnpm run news-search -- "marcha estudiantil" --medio biobio --limit 10
# flags: --since YYYY-MM-DD · --medio <subcadena> · --limit N · --all · --json
```

- Los ítems resueltos traen la URL del artículo lista para `fetch-content`/`add-source`.
- Los `[SIN RESOLVER]` (medio fuera del catálogo o JSONL desactualizado) traen el
  comando sugerido (`add-source -- --search "<título>" [--medio <slug>]).
- Límites conocidos: los links `rss/articles/CBMi...` van
  cifrados (doble base64 → ruido, no decodificables en local) y GDELT no responde
  desde esta red — por eso la resolución es por título, no por link. El RSS no
  trae cuerpos: después sigue la cadena `fetch-content` habitual. `--limit 8`
  máximo (valores mayores revientan con `Maximum call stack size exceeded`).
- **Resolver un `[SIN RESOLVER]` contra el news-sitemap en vivo del propio medio:**
  cuando el JSONL local va atrasado, leer el endpoint que declara `robots.txt` y buscar
  el `<loc>` cuyo `<news:title>` coincida con el titular del ítem. Funciona aunque el
  slug no sea adivinable (Arc XP: `https://www.adnradio.cl/arc/outboundfeeds/sitemap/?outputType=xml`;
  La Tercera: `https://www.latercera.com/arc/outboundfeeds/news-sitemap/?outputType=xml`,
  paginado con `&from=100`, `&from=200`… donde los `<news:title>` van en CDATA). Los
  sub-sitemaps del `sitemap-index` ordenan por fecha, así que las 2-3 primeras páginas
  cubren lo reciente. Ojo: un slug adivinado que devuelve 301 a la home NO es evidencia
  de nada; solo cuenta el `<loc>` del sitemap o el titular real del fetch.
- **Un ítem `[RESUELTO]` puede apuntar al artículo equivocado:** la resolución es por
  *coincidencia de título*, no por ID, así que un titular reutilizado months después
  (caso sep-2026: "El Estrecho de Magallanes pertenece a Chile", nota del 08-sep
  resuelta contra un slug de abril sobre el jefe de Hidrografía argentino) devuelve
  una URL de otro mes. **Siempre contrastar la fecha del ítem con la del slug** y con
  el `Published Time` del fetch antes de citar; si no calzan, tratar el ítem como no
  resuelto y seguir los pasos siguientes.
- **Sitemaps por mes/archivo en vivo, cuando el news-sitemap ya no cubre la fecha:**
  muchos medios exponen un índice con shards mensuales o de archivo que conservan
  todo el mes aunque el news-sitemap haya rotado. Basta con leer el shard del mes
  buscado y filtrar por slug o por término. Endpoints útiles verificados:
  Meganoticias `robots.txt` declara `/sitemaps/sitemap-news.xml` (solo ~2 días) más
  `/sitemaps/sitemap-noticias-index-content.xml` → `.../sitemaps/content-noticias/sitemap-YYYY-MM.xml`
  (todo el mes) y además `/sitemaps/sitemap-noticias-index-video.xml` →
  `.../sitemaps/video-noticias/sitemap-video-YYYY-MM.xml`, que el `includeRe` del
  sync descarta y que sirve para encontrar la nota *de video* de una entrevista
  (el mismo hecho suele tener versión artículo y versión video con IDs contiguos);
  Perfil `sitemap/archive/YYYY/MM`; Infodefensa `sitemap/month/YYYYMM`. Ojo
  BioBioChile: `static/sitemap-YYYY-MM.xml` es una **ventana móvil** de los últimos
  ~25 días, no el mes completo, y su buscador web (`/buscador/`, `/buscar/`,
  `/search`) devuelve 404 — para fechas fuera de la ventana hay que ir a otro método.
- **DDG HTML como último recurso para localizar la URL:** cuando el catálogo local
  va atrasado, el medio no expone sitemap de archivo y `news-search` no resuelve,
  `https://html.duckduckgo.com/html/?q=<CONSULTA>` responde 200 y los resultados
  reales vienen en `uddg=<URL codificada>` dentro del HTML (extraer y decodificar;
  `lite.duckduckgo.com` no resuelve DNS desde esta red). Un `site:dominio` más 3-4
  palabras del titular bastó para recuperar la URL exacta de BioBioChile,
  Infodefensa, Perfil y Diario Sur Noticias. Sirve para *ubicar* la nota; el cuerpo
  se sigue leyendo con `fetch-content`.
- **DDG puede devolver 403 y `websearch` es el sustituto:** en sep-2026
  `Invoke-WebRequest` contra `html.duckduckgo.com` respondió 403 (server error)
  en dos consultas consecutivas, así que el bloque anterior no siempre aplica desde
  esta red. Cuando el 403 aparece, la tool `websearch` sí recuperó las URL exactas
  de T13, El País Chile, Mala Espina Check y Chilevisión con el titular literal entre
  comillas. Orden: `news-search` → `websearch` con el titular entre comillas y
  `site:` si hace falta → DDG HTML → sharding de sitemap en vivo.

### Sitios institucionales SIN sitemap utilizable

No se pueden agregar al catálogo (no exponen XML sitemap); usar fetch directo/defuddle bajo demanda:

- **bomberos.cl** — Joomla sin sitemap XML (robots.txt sin línea Sitemap; `/sitemap.xml`,
  `/sitemap_index.xml` y variantes OSMap/JMap/XMap → 404). Su `/mapa-del-sitio` es HTML y solo
  lista estructura institucional (~440 links), no el archivo de artículos (que vive en
  `/contenidos/<slug>`). Las notas oficiales de Bomberos se buscan y leen directamente.
- **memoriachilena.gob.cl / bibliotecanacionaldigital.gob.cl** — sin sitemap; prensa chilena
  digitalizada desde 1811 (El Mercurio, El Sur, La Nación, etc.). Clave para pre-2000.
- **diariooficial.interior.gob.cl** — sin sitemap; PDFs desde 1875, buscador propio.
- **camara.cl** — `sitemap.xml` responde 403 (WAF) incluso con User-Agent de navegador.
- **pjud.cl / ssff.cl** — `robots.txt` 404, sin variantes (verificado 28-09-2026).
- **chvnoticias.cl** — todos los endpoints de sitemap devuelven la home (verificado 28-09-2026).
- **t13.cl** — Drupal `simple_sitemap` con solo la home (verificado 28-09-2026).
- **bcn.cl** — sí tiene sitemap, pero de portal (~70k sub-sitemaps de normas LeyChile, no prensa): no catalogable como prensa. BCN/Historia Política y LeyChile siguen on-demand (ver cobertura histórica).
- **puntofinal.cl / lediplomatique.cl / indh.cl / interferencia.cl** — inaccesibles o bloqueados
  desde esta red al momento de la verificación.

### Cobertura histórica del catálogo (para ir a años previos)

- **emol** es el medio más profundo: ~1999/2000 en adelante (27 años). Lo sigue
  **La Segunda**: 2000→hoy con hueco 2017-2021 (~903k artículos, fecha a nivel de mes).
- **elciudadano** llega a ~2004; biobiochile/radio_uchile/el_periodista a ~2008.
- **senado**: URLs desde ~2013, pero el `<lastmod>` es de la migración del sitio (masa en 2024);
  para eventos previos buscar por slug (suele llevar la fecha), no por fecha.
- Para **pre-2009/pre-2000** no hay prensa con sitemap: usar Memoria Chilena/BND (hemeroteca
  digitalizada), Diario Oficial (desde 1875), BCN Historia Política Legislativa (biografías de
  parlamentarios y ministros desde 1810, bcn.cl/historiapolitica) y LeyChile (normas desde 1739),
  todos fetch-on-demand, citando como fuente institucional con su whitelist correspondiente.