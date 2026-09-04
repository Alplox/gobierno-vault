---
name: sitemaps
description: Catálogo local de sitemaps de prensa con JSONL, MEDIA, sync/index/backup y búsqueda con rg. Usa esta skill SIEMPRE al sincronizar sitemaps, buscar con rg -uu en sitemaps/, agregar medio, o antes de cualquier búsqueda web para evitar fetch redundante, incluso si solo dice 'buscar en sitemaps'.
---

## Catálogo de sitemaps (índice local de prensa)

Carpeta `sitemaps/` en la raíz: catálogo de artículos de prensa (URL + fecha + título si existe)
extraído de los sitemaps públicos de cada medio. Evita fetch/búsquedas web redundantes: el valor
está en la URL+fecha (post-sitemaps) y URL+fecha+título real (news-sitemaps, últimos 2-3 días).
NO guarda el cuerpo de los artículos.

> **Handoff:** si cambias `MEDIA` en `scripts/sitemaps/sync.mjs`, `scripts/sitemaps/index.mjs`, `scripts/generate/generate-index.mjs` o el formato JSONL, actualiza este skill en la misma sesión.

### Regla clave: NO se commitea el catálogo

- `sitemaps/*.jsonl`, `sitemaps/.cache/`, `sitemaps/sitemaps.gvault` y sus partes
  `sitemaps.gvault.partN` están en `.gitignore` (decisión 2026-08-07): BioBio pesa ~307MB y el
  catálogo es regenerable.
- Lo que SÍ se commitea: los scripts (`scripts/sitemaps/sync.mjs`, `scripts/sitemaps/index.mjs`,
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
| `pnpm run sitemaps-sync -- <medio>...` | robots.txt → sitemap_index → sub-sitemaps → dedupe → JSONL por medio/año. Flags: `--all`, `--list`, `--fresh`, `--no-cache`, `--limit N`, `--stale N`, `--no-delay`, `--delay N`, `--incremental`, `--replace`, `--since YYYY-MM-DD` / `--days N`. Filtrado por medio: `articleOnly` (Yoast: solo post/news-sitemap) o `includeRe` (whitelist custom, ej. FastCheck) o denylist genérica. `--since`/`--days` sincroniza SOLO lo reciente (filtra sub-sitemaps históricos por la fecha de su URL —BioBio/CNN/Meganoticias/Mestizos/Publimetro/FastCheck—, omite por el rango del XML cacheado los que no llevan fecha —Yoast/Arc XP— y no toca entradas antiguas); incompatible con `--replace` |
| `pnpm run sitemaps-resync` | **Resync manual diario**: sync MERGE incremental de los medios del catálogo + regenera README + backup. Nunca borra datos existentes. Solo sincroniza los medios ya presentes en `_manifest.json` (los nuevos se agregan con `sitemaps-sync -- <medio>`). Acepta `--since YYYY-MM-DD` / `--days N` para resync solo de contenido reciente (pasa el flag a `sitemaps-sync`). **Filtra huérfanos**: importa `MEDIA` desde `scripts/sitemaps/sync.mjs` y omite con aviso (`⚠️`) los slugs del manifest que ya no están en el registro (entradas con `articulos: 0` de intentos watchlist descartados) — antes un solo slug desconocido abortaba el resync completo porque sync-sitemaps valida todos los targets upfront y hace `exit(1)` al primero desconocido |
| `pnpm run sitemaps-index` | genera `sitemaps/README.md` (resumen) + `sitemaps/MEDIOS.md` (tabla completa Slug/Nombre/Sitemap/Filtro/Artículos/Años para editores). Antes generaba además la sección “Medios registrados” de `AGENTS.md` (marcadores `AUTO-GENERATED-SITEMAPS-MEDIOS`); `AGENTS.md` solo apunta a `sitemaps/MEDIOS.md` + `README.md` + `_manifest.json` para evitar diffs ruidosos |

**Al agregar un medio nuevo** (a `MEDIA` en `scripts/sitemaps/sync.mjs`): además de `sitemaps-index`
(que regenera `sitemaps/MEDIOS.md` + `sitemaps/README.md`), hay que agregar el dominio y el nombre a
`CATALOG_MEDIO_BY_DOMAIN`/`CATALOG_MEDIO_NAMES` de `scripts/extract/add-source.mjs` para que el lookup
del generador de fuentes lo reconozca.

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
  sub-sitemap; ~1,1M artículos). El `robots.txt` declara además `sitemapIndexFotos.xml` y
  `sitemapIndexVideos.xml` (tv.emol.com) — el `includeRe` `sitemap\d+_\d{4}\.xml$` los descarta.
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
- **Diario Financiero (df) / Diario Estrategia** (Prontus): robots declara sitemaps por separado
  (`extra`); el DF trae ~87 URLs recientes (pags + news + port) y Diario Estrategia ~100
  (`/sitemap/news` + `/sitemap/lastarticles`, IDs `/texto-diario/mostrar/`). Cobertura reciente,
  sin historia profunda.
- **Chile País Minero**: index con `<loc>` envueltos en CDATA (a veces sin protocolo) — el parser
  los limpia (ver `extractSitemapIndexLocs`). **Mestizos Magazine**: index por fechas
  (`/sitemap/sitemap-<DD-MM-YYYY>.xml`, ~2.400 sub-sitemaps diarios desde 2018, ~8,6k artículos).

| `pnpm run sitemaps-watchlist [-- --source <ruta>] [--offline] [--out <archivo>]` | genera `TAREAS/tareas_sitemap.md` (default): bitácora de sitios de prensa chilenos (awesome-chilean-rss `feeds-database.json` + `watchlist.json` descargados online desde `raw.githubusercontent.com` por defecto; `--source <ruta>` o `--offline` fuerza copia local) pendientes de sincronizar su sitemap al catálogo, cruzados por estado (✅ catálogo / 🟡 usado en src/content/sources|organizations / ⬜ pendiente). Solo categorías de prensa y afines (noticias, regional, gobierno, radio, partidos, negocios, comunidad, medio ambiente, educación, salud, cultura) y solo la URL del sitio |
| `pnpm run sitemaps-backup` | empaqueta `sitemaps/` en `sitemaps/sitemaps.gvault`. **Compacto lossless por defecto** (`--compact`): los JSONL se transforman a un formato tab-separado que omite dominio (1× por archivo) y títulos derivables del slug; el restore reconstruye el JSONL byte-idéntico (verificado por SHA-256). **Payload binario v3 (2026-08-11)**: el contenido viaja como header JSON pequeño (índice de offsets por archivo + manifest SHA-256) seguido de un blob de bytes crudos concatenados; el restore localiza cada archivo por `off/len`. Antes el payload era un único `JSON.stringify` con los archivos en base64: cuando el catálogo superó ~500MB de JSONL ese string excedía el límite de V8 (`RangeError: Invalid string length`). El restore sigue leyendo los .gvault v2 (base64) existentes. **Contenedor binario por defecto** (`--bin`): payload Brotli como bytes crudos (~25% menos que base64; `--text` para el formato v1 legible). **`--chunk-size <MB>`**: parte el snapshot en `<out>.part1, .part2…` (~28MB c/u con `45`; bajo el límite de 50MB de GitHub); `meta.chunks` indica el total. `--restore [src]` auto-detecta y une las partes; `--join [src]` arma el .gvault único. Resultado: ~94MB (vs ~690MB raw). `--no-compact` guarda JSONL crudo |

Detalle de merge: el dedupe del run (`seen`) NO bloquea el upgrade de títulos entre sub-sitemaps
— si una URL aparece primero sin título y luego con título real (caso El Mostrador), la segunda
pasada mejora la entrada (`news` > `slug`).

**Syncs paralelos**: `main()` escribe `_manifest.json` por medio (read-modify-write tras cada
sync), así que correr medios en procesos paralelos ya no pisa el estado de los demás. Aun así,
para varios medios conviene pasarlos como argumentos en un solo comando
(`pnpm run sitemaps-sync -- el_siglo la_nacion ...`): evita el throttle de los sitios y deja un
solo `manifest.actualizado`.

**Corrección de fechas (CNN, `dateFromSitemapPath`):** en modo merge la fecha solo se actualiza
si el cambio es dentro del mismo año (la URL se busca en el mapa del año de la nueva fecha). Si un
medio quedó con fechas falsas por un `<lastmod>` uniforme (caso CNN con el crawl de 2026-04-08),
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
  `el_periodista`, `meganoticias`, `eldesconcierto`, `publimetro`, `elciudadano`, `df`,
  `malaespina`, `elquintopoder`, `radioudec`, `chocale`, `redimin`, `chilepaisminero`,
  `mestizos`, `diarioestrategia`.
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

Benchmarks reales (24-ago-2026, catálogo completo, término 'cerimedo'): `rg` ≈ **114 ms**
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
  `meganoticias`, `eldesconcierto`, `publimetro`, `elciudadano`, `df`, `malaespina`,
  `elquintopoder`, `radioudec`, `chocale`, `redimin`, `chilepaisminero`, `mestizos`,
  `diarioestrategia`, `emol`, `senado`.
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
- Límites conocidos (verificados sep-2026): los links `rss/articles/CBMi...` van
  cifrados (doble base64 → ruido, no decodificables en local) y GDELT no responde
  desde esta red — por eso la resolución es por título, no por link. El RSS no
  trae cuerpos: después sigue la cadena `fetch-content` habitual.

### Sitios institucionales SIN sitemap utilizable (verificado 21-ago-2026)

No se pueden agregar al catálogo (no exponen XML sitemap); usar fetch directo/defuddle bajo demanda:

- **bomberos.cl** — Joomla sin sitemap XML (robots.txt sin línea Sitemap; `/sitemap.xml`,
  `/sitemap_index.xml` y variantes OSMap/JMap/XMap → 404). Su `/mapa-del-sitio` es HTML y solo
  lista estructura institucional (~440 links), no el archivo de artículos (que vive en
  `/contenidos/<slug>`). Las notas oficiales de Bomberos se buscan y leen directamente.
- **memoriachilena.gob.cl / bibliotecanacionaldigital.gob.cl** — sin sitemap; prensa chilena
  digitalizada desde 1811 (El Mercurio, El Sur, La Nación, etc.). Clave para pre-2000.
- **diariooficial.interior.gob.cl** — sin sitemap; PDFs desde 1875, buscador propio.
- **camara.cl** — `sitemap.xml` responde 403 (WAF) incluso con User-Agent de navegador.
- **puntofinal.cl / lediplomatique.cl / indh.cl / interferencia.cl** — inaccesibles o bloqueados
  desde esta red al momento de la verificación.

### Cobertura histórica del catálogo (para ir a años previos)

- **emol** es el medio más profundo: ~1999/2000 en adelante (27 años).
- **elciudadano** llega a ~2004; biobiochile/radio_uchile/el_periodista a ~2008.
- **senado**: URLs desde ~2013, pero el `<lastmod>` es de la migración del sitio (masa en 2024);
  para eventos previos buscar por slug (suele llevar la fecha), no por fecha.
- Para **pre-2009/pre-2000** no hay prensa con sitemap: usar Memoria Chilena/BND (hemeroteca
  digitalizada), Diario Oficial (desde 1875), BCN Historia Política Legislativa (biografías de
  parlamentarios y ministros desde 1810, bcn.cl/historiapolitica) y LeyChile (normas desde 1739),
  todos fetch-on-demand, citando como fuente institucional con su whitelist correspondiente.