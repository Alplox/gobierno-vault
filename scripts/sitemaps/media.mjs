/**
 * media.mjs — Registro de medios del catálogo de sitemaps (`sitemaps/<medio>/`).
 *
 * Cada entrada define cómo descubrir los sitemaps de un medio:
 *   robots  → leer el robots.txt y parsear líneas "Sitemap:"
 *   index   → URL directa del sitemap index (o del sitemap único)
 *   extra   → sitemaps adicionales que no están en robots.txt (opcional)
 * Filtros: articleOnly (whitelist Yoast post/news-sitemap) | includeRe (whitelist
 * por medio) | urlRe (whitelist de URLs de artículo) | dateFromSitemapPath /
 * locDateRe / forceHttps (ver sync.mjs).
 *
 * Al agregar un medio: sincronizar (`pnpm run sitemaps-sync -- <slug>`) y regenerar
 * índices (`pnpm run sitemaps-index`). Los mapas de dominios/nombres de
 * scripts/extract/add-source.mjs derivan solos de este registro (más
 * CATALOG_HOST_OVERRIDES/CATALOG_HOST_LEGACY para colisiones y slugs históricos).
 */
// ---------------------------------------------------------------------------
// Registro de medios. Cada entrada define cómo descubrir sus sitemaps:
//   robots  → leer el robots.txt y parsear líneas "Sitemap:"
//   index   → URL directa del sitemap index (o del sitemap único)
//   extra   → sitemaps adicionales que no están en robots.txt (opcional)
// ---------------------------------------------------------------------------
export const MEDIA = {
  elclarin: {
    nombre: 'El Clarín',
    index: 'https://www.elclarin.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: solo post-sitemap* / news-sitemap*
  },
  biobiochile: {
    nombre: 'Radio Bío Bío',
    robots: 'https://www.biobiochile.cl/robots.txt',
  },
  cooperativa: {
    nombre: 'Cooperativa',
    robots: 'https://www.cooperativa.cl/robots.txt',
  },
  adnradio: {
    nombre: 'ADN Radio',
    index: 'https://www.adnradio.cl/arc/outboundfeeds/sitemap/?outputType=xml',
  },
  factchecking: {
    nombre: 'Factchecking.cl',
    index: 'https://factchecking.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap + descarta page/category/author/gp_*
  },
  ciper: {
    nombre: 'CIPER Chile',
    index: 'https://www.ciperchile.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: solo post-sitemap* (descarta newsletters, radar, etc.)
  },
  theclinic: {
    nombre: 'The Clinic',
    index: 'https://www.theclinic.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elmostrador: {
    nombre: 'El Mostrador',
    robots: 'https://www.elmostrador.cl/robots.txt',
  },
  fastcheck: {
    nombre: 'Fast Check CL',
    index: 'https://www.fastcheck.cl/sitemap.xml',
    // Sitemap custom (no Yoast): index → posts-YYYY.xml (artículos) +
    // news.xml (títulos reales). Se descartan pages/categories/authors.xml.
    includeRe: /(?:posts-\d{4}|news)\.xml$/i,
  },
  latercera: {
    nombre: 'La Tercera',
    robots: 'https://www.latercera.com/robots.txt',
    // Arc XP: robots declara sitemap-index (paginado por from=N, 100 URLs
    // por sub-sitemap, ~10.000 artículos) + news-sitemap-index (títulos
    // reales, últimos ~400 artículos) + sitemap único. Los `<loc>` del index
    // llegan con `&amp;` que extractSitemapIndexLocs decodifica a `&`.
  },
  cnnchile: {
    nombre: 'CNN Chile',
    robots: 'https://www.cnnchile.com/robots.txt',
    // CMS propio: sitemap_index.xml (sub-sitemaps por mes desde 2011) +
    // sitemap_lasts.xml (últimos artículos) + sitemap_news.xml (títulos).
    // OJO: los sub-sitemaps mensuales regeneran el <lastmod> a la fecha del
    // crawl (uniforme y falso: todos los artículos de 2011-2026 salen con la
    // misma fecha). La fecha real del artículo está en el path YYYY/MM del
    // sub-sitemap, así que se usa como fallback (dateFromSitemapPath).
    dateFromSitemapPath: /_files\/sitemaps\/(\d{4})\/(\d{2})\.xml$/,
  },
  eldinamo: {
    nombre: 'El Dínamo',
    robots: 'https://www.eldinamo.cl/robots.txt',
    // Mismo CMS que CNN Chile: index por mes desde 2010 + lasts + news.
  },
  radioagricultura: {
    nombre: 'Radio Agricultura',
    robots: 'https://www.radioagricultura.cl/robots.txt',
    // Mismo CMS que CNN Chile: index por mes desde 2015 + lasts + news.
    // Los sub-sitemaps mensuales regeneran el <lastmod> a la fecha del crawl
    // (uniforme y falso); la fecha real está en el path YYYY/MM del sub-sitemap.
    dateFromSitemapPath: /_files\/sitemaps\/(\d{4})\/(\d{2})\.xml$/,
  },
  emol: {
    nombre: 'Emol',
    robots: 'https://www.emol.com/robots.txt',
    // Sitemaps por año desde 1992 (sitemap{N}_{year}.xml), ~8.000 URLs por
    // sub-sitemap. El robots declara además sitemapIndexFotos.xml y
    // sitemapIndexVideos.xml (tv.emol.com) — se descartan con includeRe.
    includeRe: /sitemap\d+_\d{4}\.xml$/i,
    // El index y los <loc> de los artículos vienen en http:// pero el sitio
    // solo responde por https:// (curl/node fetch fallan con http).
    forceHttps: true,
    // Sin <lastmod> ni news:date: la fecha real está en el path del artículo
    // (/noticias/<seccion>/YYYY/MM/DD/<id>/<slug>.html).
    locDateRe: /\/(\d{4})\/(\d{2})\/(\d{2})\//,
  },
  radio_uchile: {
    nombre: 'Radio Universidad de Chile',
    index: 'https://radio.uchile.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml + news-sitemap*.xml
  },
  el_siglo: {
    nombre: 'El Siglo',
    index: 'https://elsiglo.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (canónico sin www)
  },
  la_nacion: {
    nombre: 'La Nación',
    index: 'https://www.lanacion.cl/sitemap_index.xml',
    articleOnly: true, // Yoast
  },
  ex_ante: {
    nombre: 'Ex-Ante',
    index: 'https://www.ex-ante.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (post-sitemap1.xml; el robots.txt no declara sitemaps)
  },
  el_periodista: {
    nombre: 'El Periodista',
    index: 'https://www.elperiodista.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (mezcla http/https en los <loc>)
  },
  elfiltrador: {
    nombre: 'El Filtrador',
    index: 'https://elfiltrador.com/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml (índice con post-sitemap.xml..post-sitemapN.xml)
  },
  meganoticias: {
    nombre: 'Meganoticias',
    robots: 'https://www.meganoticias.cl/robots.txt',
    // CMS propio: sitemap-noticias-index-content.xml (index mensual por
    // content-noticias/sitemap-YYYY-MM.xml desde 2011) + sitemap-news.xml
    // (títulos reales). Se descartan videos, secciones, autores, columnistas,
    // seccion-temas y hemeroteca (páginas de listado, no artículos).
    // OJO: los sub-sitemaps mensuales no traen lastmod fiable; la fecha real
    // está en el path YYYY-MM del archivo (dateFromSitemapPath).
    includeRe: /(?:content-noticias\/sitemap-\d{4}-\d{2}\.xml|sitemap-news\.xml)$/i,
    dateFromSitemapPath: /content-noticias\/sitemap-(\d{4})-(\d{2})\.xml$/,
  },
  eldesconcierto: {
    nombre: 'El Desconcierto',
    robots: 'https://eldesconcierto.cl/robots.txt',
    // Sitemaps SIN historia: sitemap.xml (~8 recientes) + sitemap-news.xml
    // (~20 con títulos reales de los últimos días). No hay índices por año
    // (todas las variantes históricas devuelven 404).
  },
  publimetro: {
    nombre: 'Publimetro',
    index: 'https://www.publimetro.cl/arc/outboundfeeds/sitemap-index/?outputType=xml',
    // Arc XP: el índice solo lista `latest` + el día actual (sin paginación
    // histórica). Existen sitemaps por fecha (`/sitemap/YYYY-MM-DD/`) con
    // decenas de URLs, pero no hay índice que los enumere: el sync captura
    // lo reciente (latest).
  },
  elciudadano: {
    nombre: 'El Ciudadano',
    index: 'https://www.elciudadano.com/sitemap_index.xml',
    articleOnly: true, // Yoast
  },
  df: {
    nombre: 'Diario Financiero',
    // Prontus: robots declara 3 sitemaps (pags histórico + news + port).
    // La URL canónica de artículos es /texto-diario/mostrar/<id>/<slug>.
    extra: [
      'https://www.df.cl/noticias/site/sitemap_pags.xml',
      'https://www.df.cl/noticias/site/sitemap_news.xml',
      'https://www.df.cl/noticias/site/list/port/sitemap_df.xml',
    ],
  },
  malaespina: {
    nombre: 'Mala Espina',
    index: 'https://malaespinacheck.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (fact-checking)
  },
  elquintopoder: {
    nombre: 'El Quinto Poder',
    index: 'https://www.elquintopoder.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (periodismo ciudadano/opinión)
  },
  radioudec: {
    nombre: 'Radio UdeC',
    index: 'https://www.radioudec.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (radio universitaria)
  },
  chocale: {
    nombre: 'Chocale',
    index: 'https://chocale.cl/sitemap_index.xml',
    articleOnly: true, // Yoast
  },
  redimin: {
    nombre: 'REDIMIN',
    index: 'https://www.redimin.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (revista minería)
  },
  chilepaisminero: {
    nombre: 'Chile País Minero',
    index: 'https://chilepaisminero.com/sitemap.xml',
    // Sitemap index plano (sitemap.xml + sitemap.rss en robots).
  },
  mestizos: {
    nombre: 'Mestizos Magazine',
    index: 'https://www.mestizos.cl/sitemap.xml',
    // Index por fechas: /sitemap/sitemap-<DD-MM-YYYY>.xml (uno por día).
  },
  diarioestrategia: {
    nombre: 'Diario Estrategia',
    // Prontus: robots declara sitemap/news + sitemap/lastarticles (~100 URLs
    // recientes cada uno, IDs /texto-diario/mostrar/).
    extra: [
      'https://www.diarioestrategia.cl/sitemap/news',
      'https://www.diarioestrategia.cl/sitemap/lastarticles',
    ],
  },
  quepasaaraucania: {
    nombre: 'Qué Pasa Araucanía',
    index: 'https://quepasaaraucania.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (regional La Araucanía)
  },
  lafontana: {
    nombre: 'La Fontana',
    index: 'https://lafontana.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (regional Ñuble)
  },
  quirihue_noticias: {
    nombre: 'Quirihue Noticias',
    index: 'https://quirihuenoticias.cl/sitemap_index.xml',
    articleOnly: true, // Yoast (local Quirihue)
  },
  gob: {
    nombre: 'Gobierno de Chile',
    index: 'https://www.gob.cl/sitemap-articles.xml',
    // Sitemap news del gobierno central (prensa presidencial, anuncios
    // de ministerios). Solo artículos recientes (~últimos 2-3 meses);
    // no hay archivo histórico. Titles reales del news-sitemap.
  },
  abif: {
    nombre: 'ABIF',
    robots: 'https://www.abif.cl/robots.txt',
    // Wix: robots declara sitemap.xml (índice) → blog-posts-sitemap.xml
    // (notas de prensa) + dynamic-abif-informa...-sitemap.xml (newsletters
    // "ABIF Informa" con cifras). Se descartan categories, pages, estatutos
    // y documentos-legales (páginas estáticas/documentos, no artículos).
    includeRe: /blog-posts-sitemap\.xml$|dynamic-abif-informa.*-sitemap\.xml$/i,
  },
  amchamchile: {
    nombre: 'AmCham Chile',
    index: 'https://amchamchile.cl/sitemap_index.xml',
    // WordPress: index con sitemaps por CPT. Solo noticias (news-sitemap*.xml,
    // sin news:title, título derivado del slug) + opiniones y estudios.
    // Se descartan page/benefits/campaigns/committees/events/members/offers/
    // partners/sponsors/publications y los *_tax-sitemap (taxonomías).
    includeRe: /(?:news-sitemap\d*|opinions-sitemap|studies-sitemap)\.xml$/i,
  },
  senado: {
    nombre: 'Senado de Chile',
    index: 'https://www.senado.cl/sitemap.xml',
    // Sitemap institucional (no WordPress): un índice con 2 "páginas"
    // (?page=1/2, ~26 mil URLs en total) que mezclan noticias, galerías,
    // secciones y la home. urlRe deja solo las noticias de comunicaciones;
    // cubre desde ~2013 (sesiones y notas legislativas históricas).
    // OJO: el <lastmod> es de la migración del sitio — casi todo queda en
    // 2024 aunque el slug lleve la fecha real (ej. "sesion-...-06-de-
    // noviembre-de-2013"). Para eventos previos a 2024 buscar por slug, no
    // por fecha.
    urlRe: /\/comunicaciones\/noticias\/.+$/i,
  },
  chilevision: {
    nombre: 'Chilevisión',
    robots: 'https://www.chilevision.cl/robots.txt',
    // CMS propio (mismo que CNN Chile): sitemap_index.xml (sub-sitemaps por
    // mes) + sitemap_lasts.xml + sitemap_news.xml (títulos reales).
    dateFromSitemapPath: /_files\/sitemaps\/(\d{4})\/(\d{2})\.xml$/,
  },
  lacuarta: {
    nombre: 'La Cuarta',
    index: 'https://www.lacuarta.com/arc/outboundfeeds/sitemap-index/?outputType=xml',
    // Arc XP: sitemap-index paginado + news-sitemap con títulos reales.
  },
  nuevopoder: {
    nombre: 'Nuevo Poder',
    index: 'https://www.nuevopoder.cl/sitemap_index.xml',
    articleOnly: true, // Yoast
  },

  la_hora: {
    nombre: 'La Hora',
    index: 'https://lahora.cl/sitemap.xml',
    // El <lastmod> y el <news:publication_date> son el INSTANTE en UTC, pero el
    // sitio publica en hora local -04:00: lo publicado después de las 20:00
    // caía al día siguiente al convertir a UTC y ~12% de las 45k entradas
    // quedaban fechadas D+1 (verificado contra el datePublished del sitio, que
    // siempre coincide con la fecha del path). preferLocDate invierte newsDate y
    // locDate para que gane la fecha del path.
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
    // Custom: index diario sitemap-DD-MM-YYYY.xml + latest.xml. No es Yoast.
    // articleOnly descarta page/category; los archivos diarios (sitemap-DD-MM-YYYY.xml)
    // matchean el includeRe. El ancla `\/` + el path con `sitemap/` es lo que
    // descarta sitemap/latest.xml y sitemap/category-sitemap*.xml.
    includeRe: /\/sitemap\/(?:sitemap-\d{2}-\d{2}-\d{4}|news-sitemap)\.xml$/i,
    // OJO: /sitemap.xml NO declara sitemap/news-sitemap.xml (solo latest.xml y
    // los diarios), así que el includeRe de arriba no alcanzaba: el news-sitemap
    // tiene que entrar por `extra` o nunca se descubre y las 250 URLs con título
    // real no se catalogan. (Por eso no se usa `robots`: su línea Sitemap apuntaría
    // a /sitemap.xml, que el includeRe descartaría por no ser un shard diário.)
    extra: [
      'https://lahora.cl/sitemap/news-sitemap.xml',
    ],
  },

  elperiodico: {
    nombre: 'El Periódico',
    index: 'https://elperiodico.cl/sitemap_index.xml',
    articleOnly: true, // Yoast
  },
  diarioconcepcion: {
    nombre: 'Diario Concepción',
    index: 'https://www.diarioconcepcion.cl/sitemap.xml',
    // Sitemap + sitemap_news (títulos reales).
    extra: [
      'https://www.diarioconcepcion.cl/sitemap_news.xml',
    ],
  },
  canal9: {
    nombre: 'Canal 9',
    // Custom CMS: sitemap index mensual desde 2014 + sitemap-news (títulos reales).
    index: 'https://www.canal9.cl/sitemap',
    // Los sub-sitemaps son /sitemap/articles/YYYY/MM, articles vs news se
    // distinguen por el path, no por nombre. articleOnly no aplica aquí.
    dateFromSitemapPath: /\/articles\/(\d{4})\/(\d{2})$/, // fallback: path del sub-sitemap
    // El sitemap-news tiene <news:publication_date> confiable.
    extra: [
      'https://www.canal9.cl/sitemap-news',
    ],
  },
  '24horas': {
    nombre: '24 Horas',
    // Arc XP: sitemap index mensual gzipped desde 2022.
    robots: 'https://www.24horas.cl/robots.txt',
  },
  contrapoderchile: {
    nombre: 'Contrapoder Chile',
    // Yoast: un solo post-sitemap.xml con todos los posts (no paginado).
    index: 'https://contrapoderchile.cl/sitemap_index.xml',
    articleOnly: true,
  },
  epicentrochile: {
    nombre: 'Epicentro Chile',
    // Yoast: post-sitemap*.xml (múltiples, desde ~2013).
    index: 'https://www.epicentrochile.com/sitemap_index.xml',
    articleOnly: true,
  },
  infogate: {
    nombre: 'Infogate',
    // Custom: sitemap-posts-YYYY.xml (uno por año) + pages + categories.
    index: 'https://www.infogate.cl/sitemap.xml',
    includeRe: /sitemap-posts-\d{4}\.xml$/i,
  },
  elinformadorchile: {
    nombre: 'El Informador Chile',
    // Yoast: post-sitemap*.xml (múltiples).
    index: 'https://www.elinformadorchile.cl/sitemap_index.xml',
    articleOnly: true,
  },
  diariousach: {
    nombre: 'Diario USACH',
    // Arc XP: sitemap index mensual gzipped (mismo formato que CNN Chile).
    robots: 'https://www.diariousach.cl/robots.txt',
  },
  elarrebato: {
    nombre: 'El Arrebato',
    // Yoast: post-sitemap*.xml (múltiples).
    index: 'https://elarrebato.cl/sitemap_index.xml',
    articleOnly: true,
  },
  radiopaulina: {
    nombre: 'Radio Paulina',
    // Jetpack: sitemap-index-1.xml → sitemap-N.xml (posts).
    index: 'https://radiopaulina.cl/sitemap.xml',
    includeRe: /sitemap-index-\d+\.xml$/i,
  },
  vlnradio: {
    nombre: 'VLN Radio',
    // WordPress XML Sitemap Feed: sitemap-posttype-post.YYYY.xml.
    index: 'https://www.vlnradio.cl/sitemap.xml',
    includeRe: /sitemap-posttype-post\.\d{4}\.xml$/i,
  },
  sabes: {
    nombre: 'Sabes.cl',
    // Custom: monthly sitemaps /sitemap/sitemap-YYYY-MM.xml + news sitemap.
    index: 'https://sabes.cl/sitemap.xml',
    includeRe: /(?:sitemap-\d{4}-\d{2}\.xml|sitemap-news\.xml)$/i,
    dateFromSitemapPath: /sitemap-(\d{4})-(\d{2})\.xml$/,
  },
  infodefensa: {
    nombre: 'Infodefensa',
    // Prontus: /sitemap/lastarticles (~100 URLs recientes, con <lastmod>).
    extra: [
      'https://www.infodefensa.com/sitemap/lastarticles',
    ],
  },
  nubleonline: {
    nombre: 'Ñuble Online',
    // Yoast: post-sitemap*.xml.
    index: 'https://nubleonline.cl/sitemap_index.xml',
    articleOnly: true,
  },
  vilasradio: {
    nombre: 'Vilas Radio',
    // WordPress5.x native: wp-sitemap-posts-post-N.xml.
    index: 'https://vilasradio.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  publimicro: {
    nombre: 'Publimicro',
    // Yoast: post-sitemap*.xml.
    index: 'https://publimicro.cl/sitemap_index.xml',
    articleOnly: true,
  },
  senapred: {
    nombre: 'SENAPRED',
    // All in One SEO: post-sitemap.xml (relativo en el index).
    extra: [
      'https://www.senapred.cl/post-sitemap.xml',
    ],
  },
  diariodeosorno: {
    nombre: 'Diario de Osorno',
    // Custom: /sitemap/YYYY/MM/sitemap-pt-post.xml (mensual).
    index: 'https://www.diariodeosorno.cl/sitemap.xml',
    includeRe: /sitemap-pt-post\.xml$/i,
    dateFromSitemapPath: /\/sitemap\/(\d{4})\/(\d{2})\//,
  },
  diariodevaldivia: {
    nombre: 'Diario de Valdivia',
    // Custom: /sitemap/YYYY/MM/sitemap-pt-post.xml (mismo que Osorno).
    index: 'https://www.diariodevaldivia.cl/sitemap.xml',
    includeRe: /sitemap-pt-post\.xml$/i,
    dateFromSitemapPath: /\/sitemap\/(\d{4})\/(\d{2})\//,
  },
  diarioelcentro: {
    nombre: 'Diario El Centro',
    // Yoast: post-sitemap*.xml.
    index: 'https://www.diarioelcentro.cl/sitemap_index.xml',
    articleOnly: true,
  },
  alertanoticiastemuco: {
    nombre: 'Alerta Noticias Temuco',
    // Yoast: post-sitemap*.xml.
    index: 'http://alertanoticiastemuco.cl/sitemap_index.xml',
    articleOnly: true,
  },
  centralnoticia: {
    nombre: 'Central Noticia',
    // Yoast: post-sitemap*.xml.
    index: 'https://www.centralnoticia.cl/sitemap_index.xml',
    articleOnly: true,
  },
  atacamanoticias: {
    nombre: 'Atacama Noticias',
    // WordPress5.x native: wp-sitemap-posts-post-N.xml.
    index: 'https://www.atacamanoticias.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  chicureohoy: {
    nombre: 'Chicureo Hoy',
    // Google Sitemap Generator: post-sitemap.xml.
    index: 'https://www.chicureohoy.cl/sitemap.xml',
    articleOnly: true,
  },
  // --- Nuevos medios (23-ago-2026, desde tareas_sitemap.md) ---
  diarioeldia: {
    nombre: 'Diario El Día',
    index: 'https://www.diarioeldia.cl/sitemap.xml',
  },
  diarioelranco: {
    nombre: 'Diario El Ranco',
    index: 'https://www.diarioelranco.cl/sitemap.xml',
    articleOnly: true,
  },
  elmaipo: {
    nombre: 'El Maipo',
    index: 'https://elmaipo.cl/sitemap_index.xml',
    articleOnly: true,
  },
  laopiniondechiloe: {
    nombre: 'La Opinión de Chiloé',
    index: 'https://www.laopiniondechiloe.cl/sitemap_index.xml',
    articleOnly: true,
  },
  laprensaaustral: {
    nombre: 'La Prensa Austral',
    index: 'https://laprensaaustral.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  novenadigital: {
    nombre: 'Novena Digital',
    index: 'https://novenadigital.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  nubleactual: {
    nombre: 'Ñuble Actual',
    index: 'https://www.nubleactual.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  tierramarillano: {
    nombre: 'Tierramarillano',
    index: 'https://tierramarillano.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  zonazero: {
    nombre: 'Zona Zero',
    index: 'https://www.zonazero.cl/sitemap.xml',
  },
  desenfoque: {
    nombre: 'Desenfoque',
    index: 'https://desenfoque.cl/sitemap_index.xml',
    articleOnly: true,
  },
  factos: {
    nombre: 'Factos',
    index: 'https://factos.cl/sitemap_index.xml',
    articleOnly: true,
  },
  pagina19: {
    nombre: 'Página 19',
    index: 'https://pagina19.cl/sitemap_index.xml',
    articleOnly: true,
  },
  pulsopublico: {
    nombre: 'Pulso Público',
    index: 'https://www.pulsopublico.cl/sitemap_index.xml',
    articleOnly: true,
  },
  reportea: {
    nombre: 'Reportea',
    index: 'https://reportea.cl/sitemap_index.xml',
    articleOnly: true,
  },
  radiointeramericana: {
    nombre: 'Radio Interamericana',
    index: 'https://radiointeramericana.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  radiolasenal: {
    nombre: 'Radio La Señal',
    index: 'https://radiolasenal.cl/sitemap_index.xml',
    articleOnly: true,
  },
  radiomodelo: {
    nombre: 'Radio Modelo',
    index: 'https://radiomodelo.cl/sitemap_index.xml',
    articleOnly: true,
  },
  radionuevomundo: {
    nombre: 'Radio Nuevo Mundo',
    index: 'https://radionuevomundo.cl/sitemap_index.xml',
    articleOnly: true,
  },
  mma: {
    nombre: 'Ministerio del Medio Ambiente',
    index: 'https://mma.gob.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  defensorianinez: {
    nombre: 'Defensoría de la Niñez',
    index: 'https://www.defensorianinez.cl/sitemap_index.xml',
    articleOnly: true,
  },
  ellibero: {
    nombre: 'El Líbero',
    index: 'https://www.ellibero.cl/sitemap_index.xml',
    articleOnly: true,
  },
  ellibertario: {
    nombre: 'El Libertario',
    index: 'https://www.ellibertario.cl/sitemap.xml',
  },
  elperiscopio: {
    nombre: 'El Periscopio',
    index: 'https://www.elperiscopio.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elradar: {
    nombre: 'El Radar',
    index: 'https://elradar.cl/sitemap_index.xml',
    articleOnly: true,
  },
  lavozdelosquesobran: {
    nombre: 'La Voz de los que Sobran',
    index: 'https://www.lavozdelosquesobran.cl/sitemap_index.xml',
    articleOnly: true,
  },
  miradiols: {
    nombre: 'Mi Radio LS',
    index: 'https://www.miradiols.cl/sitemap_index.xml',
    articleOnly: true,
  },
  uteusachnoticias: {
    nombre: 'UTE USACH Noticias',
    index: 'https://corporacionuteusach-noticias.cl/sitemap_index.xml',
    articleOnly: true,
  },
  laizquierdadiario: {
    nombre: 'La Izquierda Diario',
    index: 'https://www.laizquierdadiario.cl/sitemap.xml',
  },
  // --- Nuevos medios batch 2 (23-ago-2026, watchlist) ---
  aconcaguadigital: {
    nombre: 'Aconcagua Digital',
    // WordPress 5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://aconcaguadigital.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  alertanoticias: {
    nombre: 'Alerta Noticias',
    index: 'https://alertanoticias.cl/sitemap_index.xml',
    articleOnly: true,
  },
  antofacity: {
    nombre: 'Antofacity',
    index: 'https://antofacity.com/sitemap_index.xml',
    articleOnly: true,
  },
  antofagastaaldia: {
    nombre: 'Antofagasta al Día',
    index: 'https://antofagastaaldia.cl/sitemap_index.xml',
    articleOnly: true,
  },
  antofagastanoticias: {
    nombre: 'Antofagasta Noticias',
    index: 'https://antofagastanoticias.cl/sitemap_index.xml',
    articleOnly: true,
  },
  aricaesnoticia: {
    nombre: 'Arica es Noticia',
    index: 'https://aricaesnoticia.cl/sitemap_index.xml',
    articleOnly: true,
  },
  atacamaenlinea: {
    nombre: 'Atacama en Línea',
    index: 'https://atacamaenlinea.cl/sitemap_index.xml',
    articleOnly: true,
  },
  clave9: {
    nombre: 'Clave 9',
    index: 'https://clave9.cl/sitemap_index.xml',
    articleOnly: true,
  },
  coquimbonoticias: {
    nombre: 'Coquimbo Noticias',
    // Google Sitemap Generator: post-sitemap*.xml
    index: 'https://www.coquimbonoticias.cl/sitemap.xml',
    includeRe: /post-sitemap\d*\.xml$/i,
  },
  diarioangamos: {
    nombre: 'Diario Angamos',
    // Jetpack: sitemap-index-N.xml
    index: 'https://diarioangamos.com/sitemap.xml',
    includeRe: /sitemap-index-\d+\.xml$/i,
  },
  diariocauquenes: {
    nombre: 'Diario Cauquenes',
    index: 'https://diariocauquenes.cl/sitemap_index.xml',
    articleOnly: true,
  },
  diariocurico: {
    nombre: 'Diario Curicó',
    // WordPress 5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://diariocurico.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  diarioelcautin: {
    nombre: 'Diario El Cautín',
    // WordPress 5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://diarioelcautin.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  diarioelpulso: {
    nombre: 'Diario El Pulso',
    // WordPress 5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://www.diarioelpulso.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  diariolongino: {
    nombre: 'Diario El Longino',
    index: 'https://diariolongino.cl/sitemap_index.xml',
    articleOnly: true,
  },
  diarioloslagos: {
    nombre: 'Diario Los Lagos',
    index: 'https://diarioloslagos.cl/sitemap_index.xml',
    articleOnly: true,
  },
  diariopuertovaras: {
    nombre: 'Diario Puerto Varas',
    index: 'https://diariopuertovaras.cl/sitemap_index.xml',
    articleOnly: true,
  },
  diariotalca: {
    nombre: 'Diario Talca',
    index: 'https://diariotalca.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elandacollino: {
    nombre: 'El Andacollino',
    // WordPress 5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://www.elandacollino.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  elcomunicador: {
    nombre: 'El Comunicador',
    // WordPress 5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://elcomunicador.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  elcontraste: {
    nombre: 'El Contraste',
    index: 'https://elcontraste.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elcoquimbano: {
    nombre: 'El Coquimbano',
    // WordPress 5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://www.elcoquimbano.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  eldiariodelaaraucania: {
    nombre: 'El Diario de La Araucanía',
    index: 'https://eldiariodelaaraucania.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elgong: {
    nombre: 'El Gong Araucanía',
    // Flat urlset (no sitemap index)
    extra: [
      'https://elgong.cl/sitemap.xml',
    ],
  },
  // ---- Sitemaps pendientes de tareas_sitemap.md (batch extra 2026-09-07) ----
  // Nacional / internacional: pendientes ⬜ de la watchlist (noticias).
  elmegacl: {
    nombre: 'El Mercurio (Edición Impresa / La Segunda digital)',
    robots: 'https://impresa.elmercurio.com/robots.txt',
  },
  elinsular: {
    nombre: 'El Insular',
    index: 'https://elinsular.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elmagallanico: {
    nombre: 'El Magallánico',
    // WordPress: sitemap.xml + news-sitemap.xml from robots.txt
    robots: 'https://elmagallanico.com/robots.txt',
  },
  elmauleinforma: {
    nombre: 'El Maule Informa',
    index: 'https://elmauleinforma.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elmorrodearica: {
    nombre: 'El Morro de Arica',
    index: 'https://elmorrodearica.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elnoticierodelhuasco: {
    nombre: 'El Noticiero del Huasco',
    // WordPress 5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://elnoticierodelhuasco.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  observador: {
    nombre: 'El Observador',
    index: 'https://observador.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elrancaguino: {
    nombre: 'El Rancagüino',
    index: 'https://elrancaguino.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elreporterodeiquique: {
    nombre: 'El Reportero de Iquique',
    index: 'https://elreporterodeiquique.com/sitemap_index.xml',
    articleOnly: true,
  },
  elserenense: {
    nombre: 'El Serenense',
    index: 'https://elserenense.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elvicuense: {
    nombre: 'El Vicuñense',
    index: 'https://xn--elvicuense-y9a.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elquiglobal: {
    nombre: 'Elqui Global',
    index: 'https://elquiglobal.cl/sitemap_index.xml',
    articleOnly: true,
  },
  enlalinea: {
    nombre: 'En La Línea',
    index: 'https://enlalinea.cl/sitemap_index.xml',
    articleOnly: true,
  },
  enlineamaule: {
    nombre: 'En Línea Maule',
    index: 'https://enlineamaule.cl/sitemap_index.xml',
    articleOnly: true,
  },
  enfoquedigital: {
    nombre: 'Enfoque Digital',
    index: 'https://enfoquedigital.cl/sitemap_index.xml',
    articleOnly: true,
  },
  enfoquedigitalohiggins: {
    nombre: 'Enfoque Digital O\'Higgins',
    index: 'https://vi.cl/sitemap_index.xml',
    articleOnly: true,
  },
  hdn: {
    nombre: 'HDN',
    index: 'https://hdn.cl/sitemap.xml',
    articleOnly: true,
  },
  horadenoticias: {
    nombre: 'Hora de Noticias',
    index: 'https://horadenoticias.cl/sitemap_index.xml',
    articleOnly: true,
  },
  informaalminuto: {
    nombre: 'Informa Al Minuto',
    index: 'https://informaalminuto.cl/sitemap_index.xml',
    articleOnly: true,
  },
  iquiquetv: {
    nombre: 'Iquique TV',
    index: 'https://iquiquetv.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  estrellaiquique: {
    nombre: 'La Estrella de Iquique',
    index: 'https://estrellaiquique.cl/sitemap.xml',
    articleOnly: true,
  },
  lakalle: {
    nombre: 'La Kalle',
    index: 'https://lakalle.cl/sitemap.xml',
    articleOnly: true,
  },
  lamegafm: {
    nombre: 'La Mega FM',
    index: 'https://lamegafm.cl/sitemap.xml',
    urlRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  laperladellimari: {
    nombre: 'La Perla del Limarí',
    index: 'https://laperladellimari.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  laserenaonline: {
    nombre: 'La Serena Online',
    index: 'https://laserenaonline.cl/sitemap.xml',
    includeRe: /\/sitemap-posttype-post\.\d{4}\.xml$/i,
  },
  diariolaunion: {
    nombre: 'La Unión',
    index: 'https://diariolaunion.cl/sitemap.xml',
    // Fecha real en el path /sitemap/YYYY/MM/ (mismo CMS que Diario de Osorno).
    includeRe: /\/sitemap-pt-post\.xml$/i,
    dateFromSitemapPath: /\/sitemap\/(\d{4})\/(\d{2})\//,
  },
  lasnoticiasdemalleco: {
    nombre: 'Las Noticias de Malleco',
    index: 'https://lasnoticiasdemalleco.cl/sitemap_index.xml',
    articleOnly: true,
  },
  losriosnoticias: {
    nombre: 'Los Ríos Noticias',
    index: 'https://losriosnoticias.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  malleco7: {
    nombre: 'Malleco 7',
    index: 'https://malleco7.cl/sitemap_index.xml',
    articleOnly: true,
  },
  margamargatv: {
    nombre: 'Margamarga TV',
    index: 'https://margamargatv.cl/sitemap_index.xml',
    articleOnly: true,
  },
  masnoticia: {
    nombre: 'Más Noticia',
    index: 'https://masnoticia.cl/sitemap_index.xml',
    articleOnly: true,
  },
  maulehoy: {
    nombre: 'Maule Hoy',
    index: 'https://maulehoy.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  nacimentano: {
    nombre: 'Nacimentano',
    index: 'https://nacimentano.cl/sitemap_index.xml',
    articleOnly: true,
  },
  norteonline: {
    nombre: 'Norte Online',
    index: 'https://norteonline.cl/sitemap.xml',
    includeRe: /\/sitemap-index-\d+\.xml$/i,
  },
  noticiasbiobio: {
    nombre: 'Noticias Biobío',
    index: 'https://noticiasbiobio.cl/sitemap.xml',
    includeRe: /\/sitemap-index-\d+\.xml$/i,
  },
  noticiaschiloe: {
    nombre: 'Noticias Chiloé',
    index: 'https://noticiaschiloe.cl/sitemap.xml',
    includeRe: /\/sitemap-index-\d+\.xml$/i,
  },
  noticiasdellago: {
    nombre: 'Noticias del Lago',
    index: 'https://noticiasdellago.cl/sitemap.xml',
    articleOnly: true,
  },
  noticiasdelsur: {
    nombre: 'Noticias del Sur',
    index: 'https://noticiasdelsur.cl/sitemap_index.xml',
    articleOnly: true,
  },
  nubledigital: {
    nombre: 'Ñuble Digital',
    index: 'https://nubledigital.cl/sitemap_index.xml',
    articleOnly: true,
  },
  ovallehoy: {
    nombre: 'Ovalle Hoy',
    index: 'https://ovallehoy.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  paislobo: {
    nombre: 'País Lobo',
    index: 'https://paislobo.cl/sitemap.xml',
    includeRe: /sitemap\.xml\?page=\d+$/i,
  },
  pichilemunews: {
    nombre: 'Pichilemu News',
    index: 'https://pichilemunews.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  portalinformativo: {
    nombre: 'Portal Informativo',
    index: 'https://portalinformativo.cl/sitemap_index.xml',
    articleOnly: true,
  },
  prensaciudadana: {
    nombre: 'Prensa Ciudadana',
    index: 'https://prensaciudadana.cl/sitemap.xml',
    includeRe: /\/sitemap-index-\d+\.xml$/i,
  },
  queilen: {
    nombre: 'Queilen',
    index: 'https://queilen.cl/sitemap.xml',
    includeRe: /\/blog-posts-sitemap\.xml$/i,
  },
  radiomagallanes: {
    nombre: 'Radio Magallanes',
    index: 'https://radiomagallanes.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  radiopuertanorte: {
    nombre: 'Radio Puerta Norte',
    index: 'https://radiopuertanorte.cl/sitemap_index.xml',
    articleOnly: true,
  },
  radioventisqueros: {
    nombre: 'Radio Ventisqueros',
    index: 'https://radioventisqueros.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  regionalista: {
    nombre: 'Regionalista',
    index: 'https://regionalista.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  rioenlinea: {
    nombre: 'Río en Línea',
    index: 'https://rioenlinea.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  sancarlosonline: {
    nombre: 'San Carlos On Line',
    index: 'https://sancarlosonline.cl/sitemap.xml',
    includeRe: /sitemap\.xml\?page=\d+$/i,
  },
  seranoticia: {
    nombre: 'Sera Noticia',
    index: 'https://seranoticia.cl/sitemap_index.xml',
    articleOnly: true,
  },
  serenaycoquimbo: {
    nombre: 'Serena y Coquimbo',
    index: 'https://serenaycoquimbo.cl/sitemap_index.xml',
    articleOnly: true,
  },
  sitiodelsuceso: {
    nombre: 'Sitio del Suceso',
    index: 'https://sitiodelsuceso.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  temucodiario: {
    nombre: 'Temuco Diario',
    index: 'https://temucodiario.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  tiempo21: {
    nombre: 'Tiempo 21',
    index: 'https://tiempo21.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  tomealdia: {
    nombre: 'Tomé al Día',
    index: 'https://tomealdia.com/sitemap.xml',
    includeRe: /sitemap\.xml\?page=\d+$/i,
  },
  traiguencity: {
    nombre: 'Traiguén City',
    index: 'https://traiguencity.cl/sitemap_index.xml',
    articleOnly: true,
  },
  vallenardigital: {
    nombre: 'Vallenar Digital',
    index: 'https://vallenardigital.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  villarricaldia: {
    nombre: 'Villarrica al Día',
    index: 'https://villarricaldia.cl/sitemap.xml',
    urlRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  radiochilena: {
    nombre: 'Radio Chilena',
    index: 'https://radiochilena.cl/sitemap_index.xml',
    articleOnly: true,
  },
  fmcentro: {
    nombre: 'Radio FM Centro',
    index: 'https://fmcentro.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  radiomaria: {
    nombre: 'Radio María Chile',
    index: 'https://radiomaria.cl/sitemap_index.xml',
    articleOnly: true,
  },
  radioriquelme: {
    nombre: 'Radio Riquelme',
    index: 'https://radioriquelme.cl/sitemap.xml',
    includeRe: /\/sitemap-index-\d+\.xml$/i,
  },
  agenciadenoticias: {
    nombre: 'Agencia de Noticias',
    index: 'https://agenciadenoticias.org/sitemap_index.xml',
    articleOnly: true,
  },
  basenacional: {
    nombre: 'Base Nacional',
    index: 'https://basenacional.cl/sitemap_index.xml',
    articleOnly: true,
  },
  eldefinido: {
    nombre: 'El Definido',
    index: 'https://eldefinido.cl/sitemap_index.xml',
    articleOnly: true,
    // Verificado 09-sep-2026: sin sitemap (todas las variantes devuelven el
    // HTML del home; robots.txt sin línea Sitemap; homepage sin menciones).
    // Se mantiene la entrada como registro del intento (0 artículos).
  },
  elminuto: {
    nombre: 'El Minuto',
    index: 'https://elminuto.cl/sitemap_index.xml',
    articleOnly: true,
  },
  estapasando: {
    nombre: 'Está Pasando',
    index: 'https://estapasando.cl/sitemap_index.xml',
    articleOnly: true,
  },
  piensachile: {
    nombre: 'Piensa Chile',
    index: 'https://piensachile.com/sitemap_index.xml',
    articleOnly: true,
  },
  portalmetropolitano: {
    nombre: 'Portal Metropolitano',
    index: 'https://portalmetropolitano.cl/sitemap_index.xml',
    articleOnly: true,
  },
  santiagotimes: {
    nombre: 'Santiago Times',
    index: 'https://santiagotimes.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  vivimoslanoticia: {
    nombre: 'Vivimos la Noticia',
    index: 'https://vivimoslanoticia.cl/sitemap_index.xml',
    articleOnly: true,
  },
  vozdeamerica: {
    nombre: 'Voz de América',
    index: 'https://vozdeamerica.com/sitemap.xml',
    includeRe: /sitemap_\d+_\d+\.xml\.gz$/i,
  },
  elporteno: {
    nombre: 'El Porteño',
    index: 'https://elporteno.cl/sitemap_index.xml',
    articleOnly: true,
  },
  laprensadiariolaprensa: {
    nombre: 'La Prensa',
    index: 'https://new.diariolaprensa.cl/sitemap_index.xml',
    articleOnly: true,
  },
  elpinguino: {
    nombre: 'El Pingüino',
    robots: 'https://elpinguino.com/robots.txt',
    // Mismo CMS que CNN Chile / El Dínamo: robots declara
    // _files/sitemaps/sitemap_index.xml + sitemap_lasts.xml + sitemap_news.xml.
    // OJO como CNN: los sub-sitemaps mensuales regeneran el <lastmod> a la
    // fecha del crawl (falso: todo sale 2026); la fecha real está en el path
    // YYYY/MM del sub-sitemap (dateFromSitemapPath).
    dateFromSitemapPath: /_files\/sitemaps\/(\d{4})\/(\d{2})\.xml$/,
  },
  elproa: {
    nombre: 'El Proa',
    index: 'https://elproa.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  infotarapaca: {
    nombre: 'Info Tarapacá',
    index: 'https://infotarapaca.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  miradasurtv: {
    nombre: 'Mirada Sur TV',
    index: 'https://miradasurtv.cl/sitemap_index.xml',
    articleOnly: true,
  },
  ovejeronoticias: {
    nombre: 'Ovejero Noticias',
    index: 'https://ovejeronoticias.cl/sitemap_index.xml',
    articleOnly: true,
  },
  tarapacaonline: {
    nombre: 'Tarapacá Online',
    index: 'https://tarapacaonline.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  chanarcillo: {
    nombre: 'Diario Chañarcillo',
    index: 'https://chanarcillo.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  diarioavisale: {
    nombre: 'Diario Avísale',
    index: 'https://diarioavisale.cl/sitemap_index.xml',
    articleOnly: true,
  },
  edicioncero: {
    nombre: 'Edición Cero',
    index: 'https://edicioncero.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  // ---- Nuevos sitios (agregados 22-ago-2026) ----
  // ---- Sitemaps pendientes (batch internacional, 2026-09-07) ----
  elpais: {
    nombre: 'El País',
    index: 'https://www.elpais.com/sitemap.xml',
  },
  // ---- Sitemaps pendientes de tareas_sitemap.md (batch extra 2026-09-07) ----
  // Nacional / internacional: pendientes ⬜ de la watchlist (noticias).
  bbc: {
    nombre: 'BBC Mundo',
    robots: 'https://www.bbc.com/robots.txt',
    // Solo la edición Mundo (los sitemaps por idioma viven en /<idioma>/sitemap.xml).
    includeRe: /\/mundo\/sitemap\.xml$/i,
  },
  lemondediplomatique: {
    nombre: 'Le Monde Diplomatique - Edición Chilena',
    // SPIP: robots.txt sin línea Sitemap; el index real es /sitemap.xml.
    index: 'https://lemondediplomatique.cl/sitemap.xml',
  },
  mercopress: {
    nombre: 'MercoPress',
    index: 'https://es.mercopress.com/sitemap.xml',
    // Solo los archivos anuales (main.xml mezcla páginas/portada).
    includeRe: /\/archive\/\d{4}\.xml$/i,
  },
  ipsnoticias: {
    nombre: 'IPS Agencia de Noticias',
    // Yoast: el wp-sitemap.xml indexa post-sitemap*.xml (articleOnly).
    index: 'https://ipsnoticias.net/wp-sitemap.xml',
    articleOnly: true,
  },
  ansalatina: {
    nombre: 'ANSA Latina',
    robots: 'https://www.ansalatina.com/robots.txt',
    // El robots.txt declara el index; apunta a un único urlset con news:news
    // (títulos reales, ~72KB, reciente con lastmod por artículo).
    index: 'https://www.ansalatina.com/americalatina/sitemaps/sito_sitemap_index.xml',
  },
  saladeprensa: {
    nombre: 'Sala de Prensa',
    // Yoast: post-sitemap*.xml
    index: 'https://www.saladeprensa.cl/sitemap_index.xml',
    articleOnly: true,
  },
  valparaisonoticias: {
    nombre: 'Valparaíso Noticias',
    // Custom: sitemap.xml (flat urlset or index)
    index: 'https://www.valparaisonoticias.cl/sitemap.xml',
  },
  reporteagricola: {
    nombre: 'Reporte Agrícola',
    // Custom: sitemap.xml (flat urlset)
    extra: [
      'https://www.reporteagricola.cl/sitemap.xml',
    ],
  },
  ecoceanos: {
    nombre: 'ECOceanos',
    // Yoast: post-sitemap*.xml
    index: 'https://www.ecoceanos.cl/sitemap_index.xml',
    articleOnly: true,
  },
  redsalud: {
    nombre: 'RedSalud',
    // Custom: sitemap.xml (flat urlset)
    extra: [
      'https://www.redsalud.cl/sitemap.xml',
    ],
  },
  arauco: {
    nombre: 'Arauco',
    // Yoast: post-sitemap*.xml
    index: 'https://arauco.com/sitemap_index.xml',
    articleOnly: true,
  },
  // ---- Gobernables e institucionales (22-ago-2026) ----
  mtt: {
    nombre: 'Ministerio de Transportes y Telecomunicaciones',
    // Yoast: post-sitemap*.xml
    index: 'https://mtt.gob.cl/sitemap_index.xml',
    articleOnly: true,
  },
  consejotransparencia: {
    nombre: 'Consejo para la Transparencia',
    // Yoast: post-sitemap*.xml
    index: 'https://www.consejotransparencia.cl/sitemap_index.xml',
    articleOnly: true,
  },
  economia: {
    nombre: 'Ministerio de Economía',
    // Yoast: post-sitemap*.xml (www.* en sitemap)
    index: 'https://www.economia.gob.cl/sitemap_index.xml',
    articleOnly: true,
  },
  radiosantamaria: {
    nombre: 'Radio Santa María',
    // Yoast: post-sitemap*.xml
    index: 'https://www.radiosantamaria.cl/sitemap_index.xml',
    articleOnly: true,
  },
  maray: {
    nombre: 'Radio Maray',
    // Yoast: post-sitemap*.xml
    index: 'https://www.maray.cl/sitemap_index.xml',
    articleOnly: true,
  },
  resonanciadiario: {
    nombre: 'Resonancia Diario',
    // Yoast: post-sitemap*.xml
    index: 'https://www.resonanciadiario.cl/sitemap_index.xml',
    articleOnly: true,
  },
  anip: {
    nombre: 'ANIP',
    // Custom: sitemap.xml (flat urlset)
    extra: [
      'https://anip.cl/sitemap.xml',
    ],
  },
  funcionariopublico: {
    nombre: 'Funcionario Público',
    // WordPress5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://funcionariopublico.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  minrel: {
    nombre: 'Ministerio de Relaciones Exteriores',
    // Custom: minrel/site/sitemap_pags.xml (single sitemap)
    extra: [
      'https://minrel.gob.cl/minrel/site/sitemap_pags.xml',
    ],
  },
  // ---- Más medios (22-ago-2026, tanda 2) ----
  quintero: {
    nombre: 'Quintero',
    index: 'https://quintero.cl/sitemap_index.xml',
    articleOnly: true,
  },
  tuki: {
    nombre: 'Tuki',
    extra: [
      'https://tuki.cl/sitemap.xml',
    ],
  },
  uruguay: {
    nombre: 'Uruguay',
    index: 'https://uruguay.cl/sitemap_index.xml',
    articleOnly: true,
  },
  portalminero: {
    nombre: 'Portal Minero',
    extra: [
      'https://www.portalminero.com/sitemap.xml',
    ],
  },
  portalfruticola: {
    nombre: 'Portal Frutícola',
    index: 'https://www.portalfruticola.com/sitemap_index.xml',
    articleOnly: true,
  },
  portalportuario: {
    nombre: 'PortalPortuario',
    index: 'https://portalportuario.cl/sitemap_index.xml',
    articleOnly: true,
  },
  sofofa: {
    nombre: 'SOFOFA',
    index: 'https://www.sofofa.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  somoschile: {
    nombre: 'Somos Chile',
    extra: [
      'https://www.somoschile.cl/sitemap.xml',
    ],
  },
  aitnews: {
    nombre: 'AIT News',
    index: 'https://aitnews.com/sitemap_index.xml',
    articleOnly: true,
  },
  angolnoticias: {
    nombre: 'Angol Noticias',
    index: 'https://www.angolnoticiasnew.cl/sitemap_index.xml',
    articleOnly: true,
  },
  // ---- Universidades (22-ago-2026) ----
  uai: {
    nombre: 'Universidad Adolfo Ibáñez',
    extra: [
      'https://www.uai.cl/sitemap.xml',
    ],
  },
  ulagos: {
    nombre: 'Universidad de los Lagos',
    // WordPress5.x native: wp-sitemap-posts-post-N.xml
    index: 'https://www.ulagos.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/i,
  },
  umayor: {
    nombre: 'Universidad Mayor',
    extra: [
      'https://www.umayor.cl/sitemap.xml',
    ],
  },
  pucv: {
    nombre: 'Pontificia Universidad Católica de Valparaíso',
    // Custom: pucv/site/sitemap_pags.xml (single sitemap)
    extra: [
      'https://www.pucv.cl/pucv/site/sitemap_pags.xml',
    ],
  },

  contapapaya: {
    nombre: 'Contapapaya',
    index: 'https://contapapaya.cl/sitemap_index.xml',
    articleOnly: true,
  },
  electromineria: {
    nombre: 'Electrominería',
    index: 'https://electromineria.cl/sitemap_index.xml',
    articleOnly: true,
  },
  iconstruccion: {
    nombre: 'Instituto de la Construcción',
    index: 'https://iconstruccion.cl/sitemap_index.xml',
    articleOnly: true,
  },
  losabogadoslaborales: {
    nombre: 'Los Abogados Laborales',
    index: 'https://losabogadoslaborales.cl/sitemap_index.xml',
    articleOnly: true,
  },
  anda: {
    nombre: 'Anda',
    index: 'https://anda.cl/sitemap_index.xml',
    articleOnly: true,
  },
  anef: {
    nombre: 'ANEF',
    index: 'https://anef.cl/sitemap_index.xml',
    articleOnly: true,
  },
  comunidadmujer: {
    nombre: 'ComunidadMujer',
    index: 'https://comunidadmujer.cl/sitemap_index.xml',
    articleOnly: true,
  },
  lamorada: {
    nombre: 'Corporación La Morada',
    index: 'https://lamorada.cl/sitemap_index.xml',
    articleOnly: true,
  },
  guiaturismo: {
    nombre: 'Guía Turismo Chile',
    index: 'https://guiaturismo.cl/sitemap_index.xml',
    articleOnly: true,
  },
  xox: {
    nombre: 'XOX.cl',
    index: 'https://xox.cl/sitemap.xml',    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  cclm: {
    nombre: 'Centro Cultural La Moneda',
    index: 'https://cclm.cl/sitemap_index.xml',
    articleOnly: true,
  },
  chileestuyo: {
    nombre: 'Chile es Tuyo',
    index: 'https://chileestuyo.cl/sitemap_index.xml',
    articleOnly: true,
  },
  latendencia: {
    nombre: 'La Tendencia',
    index: 'https://latendencia.cl/sitemap_index.xml',
    articleOnly: true,
  },
  museovioletaparra: {
    nombre: 'Museo Violeta Parra',
    index: 'https://museovioletaparra.cl/sitemap_index.xml',
    articleOnly: true,
  },
  dsstgo: {
    nombre: 'Colegio Alemán de Santiago',
    index: 'https://dsstgo.cl/sitemap_index.xml',
    articleOnly: true,
  },
  sanignacio: {
    nombre: 'Colegio San Ignacio',
    index: 'https://sanignacio.cl/sitemap_index.xml',
    articleOnly: true,
  },
  tabancura: {
    nombre: 'Colegio Tabancura',
    index: 'https://tabancura.cl/sitemap_index.xml',
    articleOnly: true,
  },
  junji: {
    nombre: 'JUNJI',
    index: 'https://junji.cl/sitemap_index.xml',
    articleOnly: true,
  },
  liceodeaplicacion: {
    nombre: 'Liceo de Aplicación',
    index: 'https://liceodeaplicacion.cl/sitemap_index.xml',
    articleOnly: true,
  },
  saintgeorge: {
    nombre: "Saint George's College",
    index: 'https://saintgeorge.cl/sitemap_index.xml',
    articleOnly: true,
  },
  sip: {
    nombre: 'SIP Red de Colegios',
    index: 'https://sip.cl/sitemap_index.xml',
    articleOnly: true,
  },
  grange: {
    nombre: "The Grange School",
    index: 'https://grange.cl/sitemap_index.xml',
    articleOnly: true,
  },
  vergara240: {
    nombre: 'Vergara 240',
    index: 'https://vergara240.udp.cl/sitemap_index.xml',
    articleOnly: true,
  },
  acera: {
    nombre: 'ACERA',
    index: 'https://acera.cl/sitemap_index.xml',
    articleOnly: true,
  },
  legadochile: {
    nombre: 'Fundación Legado Chile',
    index: 'https://legadochile.cl/sitemap_index.xml',
    articleOnly: true,
  },
  rewildingchile: {
    nombre: 'Fundación Rewilding Chile',
    index: 'https://rewildingchile.org/sitemap_index.xml',
    articleOnly: true,
  },
  oceana: {
    nombre: 'Oceana Chile',
    index: 'https://oceana.org/sitemap_index.xml',
    articleOnly: true,
  },
  munialtobiobio: {
    nombre: 'Municipalidad de Alto Biobío',
    index: 'https://munialtobiobio.cl/sitemap_index.xml',
    articleOnly: true,
  },
  mtraiguen: {
    nombre: 'Municipalidad de Traiguén',
    index: 'https://mtraiguen.cl/sitemap_index.xml',
    articleOnly: true,
  },
  gobiernoudd: {
    nombre: 'Gobierno UDD',
    index: 'https://gobierno.udd.cl/sitemap_index.xml',
    articleOnly: true,
  },
  cruzroja: {
    nombre: 'Cruz Roja Chile',
    index: 'https://cruzroja.cl/sitemap_index.xml',
    articleOnly: true,
  },
  observatoriomedicina: {
    nombre: 'Observatorio Medicina UC',
    index: 'https://observatorio.medicina.uc.cl/sitemap_index.xml',
    articleOnly: true,
  },
  portalredsalud: {
    nombre: 'Portal RedSalud',
    index: 'https://portalredsalud.cl/sitemap_index.xml',
    articleOnly: true,
  },
  soched: {
    nombre: 'SOCHED',
    index: 'https://soched.cl/sitemap_index.xml',
    articleOnly: true,
  },
  auroranoticias: {
    nombre: 'Aurora Noticias',
    index: 'https://auroranoticias.cl/sitemap_index.xml',
    articleOnly: true,
  },
  centralweb: {
    nombre: 'Central Web',
    index: 'https://centralweb.cl/sitemap_index.xml',
    articleOnly: true,
  },
  diarioelgong: {
    nombre: 'Diario El Gong',
    index: 'https://diarioelgong.cl/sitemap_index.xml',
    articleOnly: true,
  },
  enteratehoy: {
    nombre: 'Entérate Hoy',
    index: 'https://enteratehoy.cl/sitemap_index.xml',
    articleOnly: true,
  },
  lamaquinamedio: {
    nombre: 'La Máquina Medio',
    index: 'https://lamaquinamedio.com/sitemap_index.xml',
    articleOnly: true,
  },
  magiadigital: {
    nombre: 'Magia Digital',
    index: 'https://magiadigital.cl/sitemap_index.xml',
    articleOnly: true,
  },
  musicaynoticias: {
    nombre: 'Música y Noticias',
    index: 'https://musicaynoticias.cl/sitemap_index.xml',
    articleOnly: true,
  },
  panoramanoticioso: {
    nombre: 'Panorama Noticioso',
    index: 'https://panoramanoticioso.cl/sitemap_index.xml',
    articleOnly: true,
  },
  // ---- Nuevos sitios batch 3 (28-ago-2026, tareas_sitemap watchlist) ----
  sernatur: {
    nombre: 'SERNATUR',
    index: 'https://sernatur.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  herejia: {
    nombre: 'Herejía',
    index: 'https://herejia.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  radioimagina: {
    nombre: 'Radio Imagina',
    index: 'https://radioimagina.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  ecosistemas: {
    nombre: 'Ecosistemas',
    index: 'https://ecosistemas.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  colegiomedico: {
    nombre: 'Colegio Médico de Chile',
    // All in One SEO: un solo wp-sitemap.xml flat (urlset con 3135 URLs)
    extra: [
      'https://colegiomedico.cl/wp-sitemap.xml',
    ],
  },
  nostalgica: {
    nombre: 'Nostálgica',
    index: 'https://nostalgica.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  primedigital: {
    nombre: 'Prime Digital',
    index: 'https://primedigital.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  // ---- Nuevos sitios batch 4 (28-ago-2026, regional/gobierno/político/radio) ----
  elinformador: {
    nombre: 'El Informador Los Andes',
    index: 'https://elinformador.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  elovallino: {
    nombre: 'El Ovallino',
    index: 'https://elovallino.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  diariolinares: {
    nombre: 'Diario Linares',
    index: 'https://diariolinares.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  diarioantofagasta: {
    nombre: 'Diario Antofagasta',
    index: 'https://diarioantofagasta.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml (185 sub-sitemaps)
  },
  diarioregionalaysen: {
    nombre: 'Diario Regional Aysén',
    index: 'https://diarioregionalaysen.cl/sitemap.xml',
  },
  latribunadecolchagua: {
    nombre: 'La Tribuna de Colchagua',
    index: 'https://latribunadecolchagua.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  diariolagoranco: {
    nombre: 'Diario Lago Ranco',
    index: 'https://diariolagoranco.cl/sitemap.xml',
  },
  fronteranorte: {
    nombre: 'Frontera Norte',
    index: 'https://fronteranorte.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  redinformativa: {
    nombre: 'Red Informativa',
    index: 'https://redinformativa.cl/sitemap.xml',
  },
  labatalla: {
    nombre: 'La Batalla de Maipú',
    index: 'https://labatalla.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  diariodepuertomontt: {
    nombre: 'Diario de Puerto Montt',
    index: 'https://diariodepuertomontt.cl/sitemap.xml',
  },
  elcalbucano: {
    nombre: 'El Calbucano',
    index: 'https://elcalbucano.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  goretarapaca: {
    nombre: 'Gobierno Regional de Tarapacá',
    index: 'https://goretarapaca.gov.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml (267 sub-sitemaps)
  },
  frenteampliochile: {
    nombre: 'Frente Amplio',
    index: 'https://frenteampliochile.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  frevs: {
    nombre: 'Federación Regionalista Verde Social',
    index: 'https://frevs.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  gobiernosantiago: {
    nombre: 'Gobierno Regional Metropolitano',
    index: 'https://gobiernosantiago.cl/sitemap.xml',
  },
  rln: {
    nombre: 'Radio Las Nieves',
    index: 'https://rln.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  insularfm: {
    nombre: 'Insular FM',
    index: 'https://insularfm.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  diariosurnoticias: {
    nombre: 'Diario Sur Noticias',
    index: 'https://diariosurnoticias.com/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  clgmedios: {
    nombre: 'CLG Medios',
    index: 'https://clgmedios.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  itvpatagonia: {
    nombre: 'ITV Patagonia',
    index: 'https://itvpatagonia.com/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  // ---- Batch 5: internacionales + educación (28-ago-2026) ----
  reuters: {
    nombre: 'Reuters',
    robots: 'https://www.reuters.com/robots.txt',
    // Arc XP: sitemap-index + news-sitemap-index. Robots declara 12 sitemaps.
    // Solo feeds de artículos EN recientes (outboundfeeds sitemap/news/plj +
    // plus); fuera: pictures, video-sitemap, graphics, topic, pressrelease,
    // edición árabe (sitemap-ar) y el archivo histórico (service/archive,
    // ~6.400 sub-sitemaps — backfill pendiente, ver SKILL).
    includeRe: /\/(?:arc\/outboundfeeds\/(?:news-)?sitemap(?:-plj)?\/(?:\?|$)|plus\/sitemap\.xml)/i,
  },
  rfi: {
    nombre: 'RFI Español',
    index: 'https://www.rfi.fr/sitemaps/es/index.xml',
    // Custom: contents_YYYYMM.xml (artículos por mes). articleOnly descarta
    // tags/shows/pagebuilders; includeRe whitelist puro contenido.
    includeRe: /contents_\d{6}\.xml$/,
  },
  france24: {
    nombre: 'France 24',
    index: 'https://www.france24.com/sitemaps/es/index.xml',
    includeRe: /contents_\d{6}\.xml$/,
  },
  holanews: {
    nombre: 'HolaNews',
    index: 'https://holanews.com/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  theguardian: {
    nombre: 'The Guardian',
    extra: [
      'https://www.theguardian.com/sitemaps/news.xml',
    ],
    // Custom: news sitemap con títulos reales.
  },
  cepchile: {
    nombre: 'CEP Chile',
    index: 'https://cepchile.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  udec: {
    nombre: 'Universidad de Concepción',
    index: 'https://noticias.udec.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  unab: {
    nombre: 'Universidad Andrés Bello',
    index: 'https://unab.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  uautonoma: {
    nombre: 'Universidad Autónoma de Chile',
    index: 'https://uautonoma.cl/sitemap_index.xml',
    // Custom CPT: noticias-sitemap*.xml
    includeRe: /noticias-sitemap\d*\.xml$/i,
  },
  ucn: {
    nombre: 'Universidad Católica del Norte',
    index: 'https://ucn.cl/sitemap_index.xml',
    // Custom CPT: noticias-sitemap*.xml (no usa post-sitemap)
    includeRe: /noticias-sitemap\d*\.xml$/i,
  },
  explora: {
    nombre: 'Explora',
    index: 'https://explora.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  fima: {
    nombre: 'FIMA',
    // Flat urlset (sitemap_index.xml returns urlset, not sitemapindex)
    extra: [
      'https://fima.cl/sitemap_index.xml',
    ],
  },
  // ---- Batch 6: nacionales, regionales, salud, educación, medio ambiente (28-ago-2026) ----
  // WordPress 5.5+: wp-sitemap.xml (includeRe en vez de articleOnly porque WP5.5
  // usa wp-sitemap-posts-post-*.xml, no post-sitemap*.xml)
  condor: {
    nombre: 'Cóndor',
    index: 'https://condor.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  diariochile: {
    nombre: 'Diario Chile',
    index: 'https://diariochile.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  cenabast: {
    nombre: 'CENABAST',
    index: 'https://cenabast.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  cr2: {
    nombre: 'CR2',
    index: 'https://cr2.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  mediabanco: {
    nombre: 'Mediabanco',
    index: 'https://mediabanco.com/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  contingenciachile: {
    nombre: 'Contingencia Chile',
    index: 'https://contingenciachile.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  // Otros sitemaps funcionales
  chiletravel: {
    nombre: 'Chile Travel',
    index: 'https://chile.travel/sitemap_index.xml',
  },
  udla: {
    nombre: 'UDLA',
    index: 'https://udla.cl/sitemap_index.xml',
  },
  uteusach: {
    nombre: 'UTE USACH Noticias',
    index: 'https://corporacionuteusach-noticias.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  // ---- Batch 7: partidos, comunidades, medio ambiente, educación (28-ago-2026) ----
  // ---- Batch 7: partidos, comunidades, medio ambiente, educación (28-ago-2026) ----
  rn: {
    nombre: 'RN',
    index: 'https://www.rn.cl/sitemap.xml',
    // No es Yoast estándar: blog-posts, event-pages, dynamic-*
    includeRe: /(?:blog-posts|event-pages|dynamic-[^/]+)\.xml$/,
    // blog-posts tiene 1 URL; se incluye por completitud.
  },
  iguales: {
    nombre: 'Fundación Iguales',
    index: 'https://iguales.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  hogardecristo: {
    nombre: 'Hogar de Cristo',
    index: 'https://hogardecristo.cl/sitemap.xml',
  },
  wwf: {
    nombre: 'WWF Chile',
    index: 'https://www.wwf.cl/sitemap.xml',
  },
  generadoras: {
    nombre: 'Generadoras de Chile',
    index: 'https://generadoras.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  ucsc: {
    nombre: 'UCSC',
    index: 'https://ucsc.cl/sitemap_index.xml',
  },
  // ---- Batch 8: gobierno, salud, regionales (28-ago-2026) ----
  // WordPress 5.5+: wp-sitemap.xml
  subtel: {
    nombre: 'SUBTEL',
    index: 'https://www.subtel.gob.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  fisa: {
    nombre: 'FISA',
    index: 'https://www.fisa.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  colegiodeenfermeras: {
    nombre: 'Colegio de Enfermeras',
    index: 'https://colegiodeenfermeras.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  mop: {
    nombre: 'MOP',
    index: 'https://www.mop.gob.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  // Otros sitemaps funcionales
  senda: {
    nombre: 'SENDA',
    index: 'https://www.senda.gob.cl/sitemap_index.xml',
  },
  sochob: {
    nombre: 'Sochob',
    index: 'https://www.sochob.cl/sitemap.xml',
  },
  lanacion: {
    nombre: 'La Nación',
    index: 'https://lanacion.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  elsiglo: {
    nombre: 'El Siglo',
    index: 'https://elsiglo.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap*.xml
  },
  mintrab: {
    nombre: 'Ministerio del Trabajo',
    index: 'https://www.mintrab.gob.cl/sitemap_index.xml',
  },
  minvu: {
    nombre: 'Ministerio de Vivienda',
    index: 'https://www.minvu.gob.cl/sitemap_index.xml',
  },
  // ---- Batch 9: regionales, negocios, medio ambiente (28-ago-2026) ----
  // OJO: La Hora tenía DOS slugs para el mismo dominio — `la_hora` (línea ~300, el
  // canónico) y `lahora` (este bloque, 44.538 artículos redundantes). Se
  // consolidó todo en `la_hora` (45.656 artículos): los JSONL de `lahora` eran un
  // subconjunto, así que su directorio se copió al canónico y su entrada se
  // eliminó de aquí y de `_manifest.json`. No volver a dar de alta el dominio.
  elcachapoal: {
    nombre: 'El Cachapoal',
    index: 'https://elcachapoal.cl/wp-sitemap.xml',
    includeRe: /wp-sitemap-posts-post-\d+\.xml$/,
  },
  cchc: {
    nombre: 'CCHC',
    index: 'https://cchc.cl/sitemap.xml',
    // Custom: sitemap_general.xml, sitemap_noticias.xml, sitemap_eventos.xml
    includeRe: /sitemap_(general|noticias|eventos)\.xml$/,
  },
  terram: {
    nombre: 'Fundación Terram',
    index: 'https://www.terram.cl/sitemap.xml',
    // Custom: sitemap-pt-post-YYYY-MM.xml (no Yoast estándar)
    includeRe: /sitemap-pt-post-[^/]+\.xml$/,
  },
  // PDC: robots.txt sin sitemap, sitemap_index.xml retorna 404 — descartado.
  // Conglomerado Estrella/Mercurio (estrellaantofagasta.cl retorna 450; sitemap_index es
  // conglomerado de ~19 diarios, no de un solo sitio — no sincronizable individualmente)
  // Ladera Sur (post-sitemap.xml vacío), G5 Noticias (sitemap descartado por script),
  // Diario Sur (1 URL útil), CLAPES UC (urlset sin artículos) — descartados.

  // ---- Batch 10: gobierno, regional, nacional (28-ago-2026, desde tareas_sitemap) ----
  // Gubernamentales / institucionales
  conaf: {
    nombre: 'CONAF',
    index: 'https://www.conaf.cl/sitemap_index.xml',
    articleOnly: true,
  },
  bienesnacionales: {
    nombre: 'Ministerio de Bienes Nacionales',
    index: 'https://www.bienesnacionales.cl/sitemap_index.xml',
    articleOnly: true,
  },
  // Regionales
  elcondor: {
    nombre: 'El Cóndor',
    index: 'https://diariocondor.cl/sitemap_index.xml',
    articleOnly: true,
  },
  // Nacionales
  redaccion: {
    nombre: 'Redacción',
    index: 'https://redaccion.cl/sitemap_index.xml',
    articleOnly: true,
  },
  // ---- Batch 11: regionales (28-ago-2026, desde tareas_sitemap) ----
  elsoldeiquique: {
    nombre: 'El Sol de Iquique',
    index: 'https://elsoldeiquique.cl/sitemap_index.xml',
    articleOnly: true,
  },
  eltirapiedras: {
    nombre: 'El Tirapiedras',
    index: 'https://eltirapiedras.cl/sitemap_index.xml',
    articleOnly: true,
  },
  radiopirque: {
    nombre: 'Radio Pirque',
    index: 'https://radiopirque.cl/sitemap_index.xml',
    articleOnly: true,
  },
  regionvisual: {
    nombre: 'Región Visual',
    index: 'https://regionvisual.com/sitemap_index.xml',
    articleOnly: true,
  },
  timeline_cl: {
    nombre: 'Timeline',
    index: 'https://timeline.cl/sitemap_index.xml',
    articleOnly: true,
  },
  tusnoticias: {
    nombre: 'Tus Noticias',
    index: 'https://tusnoticias.cl/sitemap_index.xml',
    articleOnly: true,
  },
  linaresenlinea: {
    nombre: 'Linares en Línea',
    index: 'https://linaresenlinea.cl/sitemap_index.xml',
    articleOnly: true,
  },
  quilpueonline: {
    nombre: 'Quilpué Online',
    index: 'https://quilpueonline.cl/sitemap_index.xml',
    articleOnly: true,
  },
  // ---- Batch 12: gobierno, nacional, medio ambiente, partidos (28-ago-2026) ----
  subtrab: {
    nombre: 'Subsecretaría del Trabajo',
    index: 'https://www.subtrab.gob.cl/sitemap_index.xml',
    articleOnly: true,
  },
  fonasa: {
    nombre: 'Fonasa',
    index: 'https://www.fonasa.cl/sitemap_index.xml',
    articleOnly: true,
  },
  liberaleschile: {
    nombre: 'Partido Liberal de Chile',
    index: 'https://liberaleschile.cl/sitemap_index.xml',
    articleOnly: true,
  },
  adiariocr: {
    nombre: 'aDiarioCR',
    index: 'https://adiariocr.com/sitemap_index.xml',
    articleOnly: true,
  },
  sochicar: {
    nombre: 'Sociedad Chilena de Cardiología',
    index: 'https://sochicar.cl/sitemap_index.xml',
    articleOnly: true,
  },
  // ── Agregados 07-sep-2026 ──────────────────────────────────────────
  defensacivil: {
    nombre: 'Defensa Civil de Chile',
    index: 'https://defensacivil.cl/wp-sitemap.xml',
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  elperiodicodelaenergia: {
    nombre: 'El Periódico de la Energía',
    index: 'https://elperiodicodelaenergia.com/sitemaps/sitemap.xml',
  },
  nexos: {
    nombre: 'Nexos Chile',
    index: 'https://www.nexos.cl/sitemap.xml',
    includeRe: /\/post-sitemap\.xml$/i,
  },
  // ── Agregados 08-sep-2026 ──────────────────────────────────────────
  pvmagazine: {
    nombre: 'pv magazine Latin America',
    index: 'https://pv-magazine-latam.com/sitemap_index.xml',
    includeRe: /\/post-sitemap\.xml$/i,
  },
  capa9: {
    nombre: 'Capa9',
    index: 'https://capa9.net/sitemap.xml',
  },
  coaniquem: {
    nombre: 'Coaniquem',
    index: 'https://coaniquem.cl/wp-sitemap.xml',
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  // ── Agregados 28-09-2026 (batch 14: lasegunda + pagina7 tenían sitemap) ──
  lasegunda: {
    nombre: 'La Segunda',
    robots: 'https://www.lasegunda.com/robots.txt',
    // CMS propio: índice de 199 sub-sitemaps paginados sitemap{N}_{YYYY}.xml
    // (2000→hoy, ~5.400 URLs c/u). Sin <lastmod>: fecha real en el path
    // /Noticias/<seccion>/YYYY/MM/<id>/<slug> (día 01 aproximado).
    includeRe: /sitemap\d+_\d{4}\.xml$/i,
    locDateRe: /\/(20\d{2})\/(\d{2})\//,
  },
  pagina7: {
    nombre: 'Página 7',
    robots: 'https://www.pagina7.cl/robots.txt',
    // Mismo CMS que CNN Chile: _files/sitemaps/YYYY/MM.xml (2014/07→hoy) +
    // sitemap_lasts.xml + sitemap_news.xml (títulos reales).
    // OJO como CNN: los sub-sitemaps mensuales regeneran el <lastmod> a la
    // fecha del crawl (falso); la fecha real está en el path YYYY/MM.
    dateFromSitemapPath: /_files\/sitemaps\/(\d{4})\/(\d{2})\.xml$/,
  },
  // ── Agregados 27-sep-2026 (batch 13: 5 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  tvn: {
    nombre: 'TVN',
    // Prontus: índice mensual .xml.gz (el robots.txt se sirve como text/plain
    // y el crawler lo rechaza, así que se apunta directo al índice).
    // OJO: <lastmod> con timestamp Unix en segundos (lo parsea isoDate).
    extra: [
      'https://www.tvn.cl/tvn/site/sitemap_pags.xml',
    ],
    // Solo los índices mensuales de artículos (descarta ports/tax: secciones).
    includeRe: /sitemap_pags_\d{6}\.xml\.gz$/i,
  },
  duna: {
    nombre: 'Radio Duna',
    index: 'https://duna.cl/sitemap.xml',
    // Custom: articles.xml + articles_2.xml (descarta categories/shows/lives/episodes).
    includeRe: /\/articles(_\d+)?\.xml$/i,
  },
  terra: {
    nombre: 'Terra Chile',
    robots: 'https://www.terra.cl/robots.txt',
    // Custom: articles/YYYY-MM mensuales desde 2020 + news.xml (títulos reales).
    includeRe: /(?:articles\/\d{4}-\d{2}\.xml|news\.xml)$/i,
  },
  elregionalista: {
    nombre: 'El Regionalista',
    index: 'https://www.elregionalista.cl/sitemap.xml',
    articleOnly: true, // All in One SEO: post-sitemap.xml
  },
  concierto: {
    nombre: 'Radio Concierto',
    robots: 'https://www.concierto.cl/robots.txt',
    // Custom Iberoamericana: out/sitemap.xml (artículos, fecha en path /YYYY/MM/)
    // + news-sitemap.xml (títulos reales). Ojo: out/sitemap.xml es urlset plano.
  },
  // ── Agregados 27-09-2026 (batch 15: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  espaciopublico: {
    nombre: 'Espacio Público',
    index: 'https://espaciopublico.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: wp-sitemap-posts-post-1.xml (descarta page/equipo/documentos/
    // areas/nuestro_trabajo/tribe_*/taxonomías). Tope de 2.000 posts por archivo y el
    // índice declara un post-2.xml que NO existe (devuelve el HTML de la home, 0 locs):
    // el catálogo queda topado en los ~2.000 posts más antiguos (2016→2024).
    // OJO: ~1.008 URLs comparten <lastmod> 2021-06-13 (masa de una migración del sitio),
    // igual que el caso `senado` — al buscar, filtrar por slug y no por fecha.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  lavozdepucon: {
    nombre: 'La Voz de Pucón',
    index: 'https://www.lavozdepucon.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: wp-sitemap-posts-post-1..3.xml (~4.741 artículos, 2018-05→hoy).
    // Descarta page/event/taxonomías. Los <lastmod> son reales (los shards se solapan
    // en rango porque WordPress pagina por chunks de 2.000, no por fecha).
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  regiondecoquimbo: {
    nombre: 'Región de Coquimbo',
    index: 'https://regiondecoquimbo.cl/sitemap_index.xml',
    // Yoast: post-sitemap.xml .. post-sitemap5.xml (1.000 URLs c/u menos el último,
    // ~4.343 artículos, 2022-10→hoy). articleOnly descarta page/category/post_tag/author.
    articleOnly: true,
  },
  // ── Agregados 27-09-2026 (batch 16: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  dialogosur: {
    nombre: 'Diálogo Sur',
    robots: 'https://dialogosur.cl/robots.txt',
    // Yoast: índice de 41 post-sitemap*.xml (~1.000 URLs c/u) desde 2010, sin
    // <lastmod> → fecha real en el path /YYYY/MM/<slug> (día 01 aproximado, como
    // lasegunda). includeRe en vez de articleOnly para no meter la home que
    // devuelve sitemap-news.xml (1 loc = raíz del sitio).
    // OJO: cada sub-sitemap tarda ~22 s en responder: el sync completo es lento.
    includeRe: /\/post-sitemap\d*\.xml$/i,
    locDateRe: /\/(20\d{2})\/(\d{2})\//,
  },
  primerafuente: {
    nombre: 'Primera Fuente',
    robots: 'https://primerafuente.cl/robots.txt',
    // Yoast: post-sitemap.xml .. post-sitemap5.xml (~4.300 artículos, 2021→hoy)
    // con <lastmod> reales. articleOnly descarta page/category/post_tag/author.
    // Ojo: los shards más antiguos (post-sitemap.xml, 2021) mezclan notas
    // regions reales con posts de SEO en inglés: filtrar por slug al buscar.
    articleOnly: true,
  },
  diarioaconcagua: {
    nombre: 'Diario Aconcagua',
    index: 'https://www.diarioaconcagua.cl/sitemap.xml',
    // Wix: índice de 3 sub-sitemaps; los artículos viven en el CPT `blog-posts`
    // (3.640 URLs, 2016→2026, <lastmod> reales) — por eso includeRe y no
    // articleOnly, que solo reconoce post-sitemap*.xml. Descarta pages/categories.
    includeRe: /\/blog-posts-sitemap\.xml$/i,
  },
  // Descartados batch 16: lun.com/elmatutino/noticiasimportantes (sin sitemap o
  // 1 loc = home), eldiariodecuracavi (1 post-sitemap residual), eldiarioelcondor
  // (wp-sitemap solo declara pages, sin posts), elmatutino/sancarlosaldia
  // (404), m360 (DNS fail en /noticias/sitemap_pags.xml).
  // ── Agregados 27-09-2026 (batch 17: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  cauquenesnet: {
    nombre: 'CauquenesNet',
    robots: 'https://cauquenesnet.cl/robots.txt',
    // Tema WP con sitemaps paginados: robots → /sitemap.xml (índice) →
    // sitemap-index-1.xml → sitemap-N.xml (~21 shards × 1.000 URLs, 2016→hoy,
    // <lastmod> reales, path /YYYY/MM/DD/<slug>). includeRe para descartar
    // image-sitemap-index-1.xml y video-sitemap-1.xml; el news-sitemap.xml
    // (5 URLs con título real) sí entra. Ojo: cada shard mezcla 3-4 páginas
    // estáticas (home, corporativo, contacto) entre los artículos.
    includeRe: /\/(?:sitemap-(?:index-)?\d+|news-sitemap)\.xml$/i,
  },
  elhuemul: {
    nombre: 'El Huemul',
    index: 'https://elhuemul.cl/sitemap_index.xml',
    // Yoast: post-sitemap1.xml .. post-sitemap4.xml (Chaitén, Los Lagos; ~3.700
    // artículos, 2020→hoy, <lastmod> reales y path /YYYY/MM/DD/<slug>).
    includeRe: /\/post-sitemap\d*\.xml$/i,
  },
  hvaradio: {
    nombre: 'Radio HVA',
    index: 'https://www.hvaradio.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: wp-sitemap-posts-post-1..4.xml (~8.000 artículos, 2023→hoy,
    // <lastmod> reales; chicharregional de Atacama).
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  // ── Agregados 27-09-2026 (batch 18: 2 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  diariofutrono: {
    nombre: 'Diario Futrono',
    index: 'https://www.diariofutrono.cl/sitemap.xml',
    // Tema WP con sitemap MENSUAL propio: /sitemap/YYYY/MM/sitemap-pt-post.xml.
    // El índice lista 179 meses (2011/11→hoy) pero los primeros están vacíos
    // (0 locs): el contenido real arranca ~2013. Descarta category-sitemap.xml
    // y el resto de CPTs. El path YYYY/MM lo lee sitemapUrlDate (3er patrón).
    includeRe: /\/sitemap\/\d{4}\/\d{2}\/sitemap-pt-post\.xml$/i,
  },
  panoramicaysen: {
    nombre: 'PanoramicAysén',
    index: 'https://www.panoramicaysen.cl/sitemap.xml',
    // Wix (como diarioaconcagua): los artículos están en el CPT `blog-posts`
    // → includeRe, porque articleOnly solo reconoce post-sitemap*.xml.
    // 3.695 artículos 2024-03→hoy con <lastmod> reales (Puerto Aysén).
    includeRe: /\/blog-posts-sitemap\.xml$/i,
  },
  // ── Agregados 28-09-2026 (batch 19: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  aysentv: {
    nombre: 'Aysén TV',
    index: 'https://www.aysentv.cl/sitemap.xml',
    // Urlset PLANO de 1.011 URLs: 1.000 artículos con path /YYYY/MM/DD/<slug>
    // (2024-02→hoy) + 11 páginas estáticas (radio, programas, tu salud en casa).
    // urlRe deja solo los artículos; locDateRe porque el <lastmod> del primer
    // <url> (2026-08-27) no corresponde al artículo más reciente del listado.
    urlRe: /\/20\d{2}\/\d{2}\/\d{2}\//,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  aricachile: {
    nombre: 'Arica Chile',
    robots: 'https://www.aricachile.cl/robots.txt',
    // Custom: robots declara 5 families (news, google-news, static, categories,
    // tags). news y google-news son índices paginados de 100 en 100
    // (news/{0,100,…} → ~5.800 artículos 2018-03→hoy); el includeRe tiene que
    // aceptar el índice padre Y sus hijos, por eso el grupo (?:news|google-news)
    // con sufijo opcional — sin el sufijo, el sync descarta el índice y no baja
    // nada (mismo caso que cauquenesnet). OJO: el <lastmod> de estos shards es
    // la fecha de regeneración (el shard 5700 marca 2023-06 con artículos de
    // 2018-03), así que la fecha sale del path con locDateRe, no del lastmod.
    includeRe: /\/sitemap\/(?:news|google-news)(?:\/\d+)?\/sitemap\.xml$/i,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  mapuchediario: {
    nombre: 'Diario Mapuche',
    index: 'https://www.mapuchediario.cl/sitemap_index.xml',
    // Yoast: post-sitemap1.xml .. post-sitemap5.xml (~1.000 artículos,
    // 2023-07→hoy, <lastmod> reales). articleOnly descarta page/category/post_tag.
    articleOnly: true,
  },
  // ── Agregados 28-09-2026 (batch 20: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  udi: {
    nombre: 'UDI (Unión Demócrata Independiente)',
    index: 'https://udi.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: wp-sitemap-posts-post-1.xml (142 comunicados 2022-2025,
    // 8 de 2026). articleOnly no sirve: solo reconoce post-sitemap*.xml de Yoast,
    // así que el includeRe es el que descarta page/category/users. La fecha sale
    // del path /YYYY/MM/DD/<slug> con locDateRe, no del <lastmod>: los primeros
    // posts son de prueba (hello-world, lorem-ipsum) y su lastmod es 2023-04,
    // muy posterior al path (check-fechas: 142/142 coinciden con la URL).
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  diario_uach: {
    nombre: 'Diario UACh',
    index: 'https://diario.uach.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 30 shards wp-sitemap-posts-post-1..30.xml (2.000 locs
    // cada uno, el último 496) ≈ 59.500 artículos 2018-01→2026-09. El índice
    // declara además CPT `ajde_events` y 15 taxonomías, que includeRe descarta.
    // Los shards van en orden cronológico y su <lastmod> es real (verificado:
    // shard 22 = 2020-01→2020-11, shard 30 = 2026-07→2026-09), así que la fecha
    // sale del lastmod: el path no lleva fecha.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  espacioregional: {
    nombre: 'Espacio Regional',
    index: 'https://www.espacioregional.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: wp-sitemap-posts-post-1.xml con 1.118 artículos
    // 2018-04→2026-09 (medio independiente de Valparaiso). Los <lastmod> son
    // reales y actuales; el path no lleva fecha (slug pelado, más un `/34/`
    // suelto), así que la fecha sale del lastmod. OJO: el host canónico es
    // www — el robots.txt y /wp-sitemap.xml sin www devuelven el mismo índice.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  // ── Agregados 28-09-2026 (batch 21: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  partidohumanista: {
    nombre: 'Partido Humanista',
    index: 'https://partidohumanista.cl/sitemap_index.xml',
    // Yoast: post-sitemap.xml con 761 locs (2016-01→2026-08, <lastmod> reales).
    // articleOnly descarta page/portfolio/category/post_tag/element_category/author.
    // La primera loc es /actualidad/noticias/ (una sección, no un artículo), pero
    // viene en el shard de posts: se deja, son 1 de 761.
    articleOnly: true,
  },
  partidoigualdad: {
    nombre: 'Partido Igualdad',
    index: 'https://partidoigualdad.cl/sitemap_index.xml',
    // Yoast: post-sitemap.xml con 295 locs (2016-09→2026-09). El robots.txt y el
    // índice declaran los sub-sitemaps con http://, así que forceHttps los reescribe
    // (sin él el sync baja los shards por http ymixed-content / redirect).
    // locDateRe: el path es /YYYY/MM/DD/<slug>, que es la fecha de publicación
    // (el <lastmod> de los primeros posts es de la época de la migración).
    articleOnly: true,
    forceHttps: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  isl: {
    nombre: 'Instituto de Seguridad Laboral',
    index: 'https://www.isl.gob.cl/sitemap_index.xml',
    // Yoast: post-sitemap.xml con 871 locs (2024-04→2026-09). articleOnly descarta
    // page/category. El path no lleva fecha (slug pelado), la fecha sale del lastmod.
    articleOnly: true,
  },
  // ── Agregados 28-09-2026 (batch 22: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  ogmdh: {
    nombre: 'Observatorio de Gobernanza Migratoria y DDHH',
    index: 'https://ogmdh-chile.org/wp-sitemap.xml',
    // WP 5.5+ nativo: wp-sitemap-posts-post-1.xml con 160 artículos
    // (2025-11→2026-09, informes semanales de gobernanza migratoria). El índice
    // declara 12 sub-sitemaps más (teams/portfolios/testimonials/rstb_template y
    // taxonomías); el includeRe los descarta — ojo que el CPT `events` (10 locs)
    // es SEO spam en inglés de un theme de resume (concursos de dibujo, cursos de
    // inglés), no eventos del observatorio: nunca abrir ese shard.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  ruta2050: {
    nombre: 'Ruta 2050',
    index: 'https://ruta2050.cl/sitemap_index.xml',
    // Yoast: post-sitemap.xml con 484 artículos (2024-07→2026-09, minería y
    // energía). articleOnly descarta page/category. locDateRe porque el path es
    // /YYYY/MM/DD/<slug> y es la fecha de publicación.
    articleOnly: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  puertoapuerto: {
    nombre: 'Puerto a Puerto',
    index: 'https://puertoapuerto.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: wp-sitemap-posts-post-1.xml con 250 artículos
    // (2019-03→2026-08, revista regional de Osorno/Los Lagos: salmonicultura,
    // CORFO, youtuber). articleOnly no aplica (WP nativo) → includeRe descarta
    // page/category/post_tag/users. Los 3 primeros locs son relleno de turismo
    // en español de 2020; el resto es contenido regional real.
    // locDateRe: el path es /YYYY/MM/DD/<slug>.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  // ── Agregados 28-09-2026 (batch 23: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  ccs: {
    nombre: 'Cámara de Comercio de Santiago',
    index: 'https://www.ccs.cl/sitemap_index.xml',
    // Yoast: post-sitemap1..7.xml (~1.400 artículos, 2020-11→2026-09). articleOnly
    // los deja entrar a todos (el \d* cubre el 1..7). El índice declara además 5 CPTs
    // propios del portal (comite, evento, semillero_startccs, estudios_y_publicaci,
    // innovacion) y opinion-ccs-sitemap.xml, que articleOnly descarta por no ser
    // post-/news-sitemap. locDateRe: el path es /YYYY/MM/DD/<slug>.
    articleOnly: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  trnoticias: {
    nombre: 'Tu Región Noticias',
    index: 'https://trnoticias.cl/sitemap_index.xml',
    // Yoast: post-sitemap.xml (1.001 locs) + post-sitemap2.xml (295), 2025-04→2026-09
    // (región del Maule). articleOnly entra por su \d* opcional: el segundo shard
    // se llama post-sitemap2.xml, SIN guion, y un patrón post-sitemap\d+\.xml$
    // estricto lo habría dejado fuera. La primera loc del shard 1 es la home `/`
    // (se cuela porque el shard es de posts; 1 de 1.296). locDateRe: path
    // /YYYY/MM/DD/<slug>.
    articleOnly: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  iquiquehoy: {
    nombre: 'Iquique Hoy',
    index: 'https://www.iquiquehoy.cl/sitemap.xml',
    // Tema WP con sitemap PROPIO anual: sitemap-posttype-post.YYYY.xml (2020→2026,
    // 967 locs solo en 2026). El includeRe tiene que dejar entrar el índice padre
    // `/sitemap.xml` además de sus hijos, por eso el sufijo opcional (trampa 1):
    // sin él el sync descarta el índice y baja 0 sin error visible. El índice
    // declara además sitemap-home.xml y sitemap-posttype-page.xml, que el patrón
    // no matchea. locDateRe: el path es /YYYY/MM/DD/<slug>.
    includeRe: /\/sitemap(?:-posttype-post\.\d{4})?\.xml$/i,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  // ── Agregados 28-09-2026 (batch 24: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  santacruzfm: {
    nombre: 'Radio Santa Cruz',
    index: 'https://santacruzfm.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: posts-post-1.xml (2.000) + -2.xml (180) ≈ 2.180 notas,
    // 2021-10→2026-09 (Radio Santa Cruz, O'Higgins/Rancagua). El path NO lleva
    // fecha (slug pelado) y el <lastmod> es real: los shards van en orden
    // cronológico y sin picos de regeneración (verificado mes a mes).
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
  },
  elamerica: {
    nombre: 'El América',
    index: 'https://elamerica.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 8 shards posts-post-1..8.xml (2.000 locs cada uno, el
    // último 484) ≈ 14.500 artículos 2023-01→2026-09 (Calama/Antofagasta:
    // minería y Chuquicamata). locDateRe: path /YYYY/MM/DD/<slug>.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  capodeprovincia: {
    nombre: 'El Capo de Provincia',
    index: 'https://capodeprovincia.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: posts-post-1.xml con 1.854 artículos 2010-03→2026-09
    // (San Antonio, Valparaíso), con huecos (2021-07→2021-11, 2022-03→2022-12,
    // 2024-05→2025-11). OJO: acá el <lastmod> es la fecha de EDICIÓN, no de
    // publicación — en una muestra de 400 URLs, 249 tienen un mes distinto al del
    // path, y 1.746 de las 1.854 tienen lastmod 2026-03, que es la oleada de
    // retoques. Sin locDateRe el catálogo parecía un medio de 10 meses; con él
    // salen los 17 años de archivo. El locDateRe va con 2 grupos porque el path
    // es /YYYY/MM/<slug> (sin día): el catálogo queda a nivel de mes (día 01),
    // que es la precisión real del medio.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    locDateRe: /\/(20\d{2})\/(\d{2})\//,
  },
  // ── Agregados 28-09-2026 (batch 25: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  diariochiloe: {
    nombre: 'Diario Chiloé',
    index: 'https://www.diariochiloe.cl/sitemap.xml',
    // Mismo tema WP con sitemap MENSUAL propio que diariofutrono/diariodeosorno/
    // diariodevaldivia: /sitemap/YYYY/MM/sitemap-pt-post.xml, 111 meses
    // (2017/07→2026/09) y <lastmod> reales. El includeRe descarta
    // category-sitemap.xml y el resto de CPTs; la fecha sale del nombre del
    // shard (YYYY/MM, lo lee sitemapUrlDate), que es la precisión real del medio:
    // el path del artículo solo trae YYYY/MM, no el día.
    includeRe: /\/sitemap\/\d{4}\/\d{2}\/sitemap-pt-post\.xml$/i,
  },
  diariopaillaco: {
    nombre: 'Diario Paillaco',
    index: 'https://www.diariopaillaco.cl/sitemap.xml',
    // Misma familia que Diario Chiloé: 179 meses (2011/11→2026/09), ~366 locs el
    // mes más lleno (Los Ríos / Paillaco).
    includeRe: /\/sitemap\/\d{4}\/\d{2}\/sitemap-pt-post\.xml$/i,
  },
  curacavidigital: {
    nombre: 'Curicaví Digital',
    index: 'https://www.curacavidigital.cl/sitemap_index.xml',
    // Yoast: post-sitemap.xml..3.xml ≈ 2.267 artículos 2011-01→2026-09;
    // articleOnly descarta page/tdb_templates/category/post_tag/author. El path es
    // /YYYY/MM/DD/<slug> y el <lastmod> es el instante UTC de publicación, así
    // que preferLocDate + locDateRe hacen ganar la fecha del path (evita el
    // corrimiento D+1 de lo publicado después de las 20:00 hora local).
    articleOnly: true,
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  // portalnacional.cl NO se agregó: es Yoast con 8.157 artículos y el <lastmod>
  // es el dateModified, no el de publicación. Una oleada de retoques (2026-06-20,
  // 2026-09-28) dejó ~7.900 entradas fechadas en 2026 cuyo datePublished real es de
  // 2025 o feb-2026 (verificado en 5 URLs). Sin fecha en el path no hay forma de
  // recuperarlas, así que el catálogo quedaría con fechas equivocadas.
  // ── Agregados 28-09-2026 (batch 33: los 22 pendientes ⬜ de Gobierno / instituciones) ──
  vialidad: {
    nombre: 'Dirección de Vialidad (MOP)',
    index: 'https://vialidad.mop.gob.cl/wp-sitemap.xml',
    // WP 5.5+ nativo. El includeRe deja solo los posts: los CPT `document` (122
    // locs) e `iframe` (1) son PDFs y embeds sin fecha, no noticias.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
    // Las 1.171 URLs de posts traen /YYYY/MM/DD/ y el <lastmod> coincide con esa
    // fecha en 1.078 de 1.171 (las otras 93 son retoques; 976 tienen lastmod a
    // medianoche, o sea fecha pura). Gana el path: archivo 2009→2026, 18 años.
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  anepe: {
    nombre: 'ANEPE (empleados públicos)',
    index: 'https://anepe.cl/wp-sitemap.xml',
    // WP 5.5+ con 7 CPTs: el includeRe se queda con los 753 posts y descarta
    // personnel/portfolio/elementskit/blogshowcase (311 locs de perfiles y
    // plantillas). Sin fecha en el path, pero el <lastmod> sí es de publicación:
    // ningún timestamp se repite (el más repetido aparece 1 vez) y llega a 2026.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  anci: {
    nombre: 'ANI (Agencia Nacional de Ciberseguridad)',
    index: 'https://anci.gob.cl/sitemap.xml',
    // urlset plano del portal Gobierno (no es WP): 885 locs = 403 /noticias/,
    // 336 /ciberconsejos/, 65 /eventos/ y ~81 páginas institucionales. El urlRe
    // exige un slug tras la sección, así que también cae el listado /noticias/.
    // Los 885 <loc> vienen en http:// y el sitio responde por https (verificado),
    // por eso forceHttps (trampa 13). El <lastmod> sí es de publicación.
    urlRe: /\/(noticias|ciberconsejos|eventos)\/[^/]+\/?$/,
    forceHttps: true,
  },
  dicrep: {
    nombre: 'DICREP (Crédito Prendario)',
    index: 'https://www.dicrep.cl/wp-sitemap.xml',
    // Su robots declara www.dicrep.cl pero el sitemap sirve los CPTs en
    // www.dicrep.gob.cl: son el mismo sitio con dos dominios. WP 5.5+ nativo,
    // 197 posts 2020→2026, sin fecha en el path y con <lastmod> de publicación
    // (ningún timestamp se repite).
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  // ── Agregados 28-09-2026 (batch 32: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  disorder: {
    nombre: 'Disorder (magazine)',
    index: 'https://www.disorder.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 3 shards ≈ 5.642 artículos, 2006→2024. Las 5.642 URLs traen
    // /YYYY/MM/DD/ (permalink de WP) y el <lastmod> es una MIGRACIÓN: los artículos
    // de mayo 2006 tienen lastmod 2010-04-03T16:00, o sea todos el mismo día. Sin
    // preferLocDate el catálogo quedaría con medio archivo corrido a 2010.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  cbs: {
    nombre: 'Cuerpo de Bomberos de Santiago',
    index: 'https://www.cbs.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 2 shards ≈ 2.084 artículos, 2021→2026. Sin fecha en el path,
    // pero el <lastmod> es de publicación, no de edición: dentro de un mismo shard
    // corre en minutos consecutivos (2021-11-12T00:12, 00:13, 00:15) y es siempre
    // -03:00 (hora local). Fuente institucional de emergencias, útil para el vault.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  dep: {
    nombre: 'Dirección de Educación Pública',
    index: 'https://dep.gob.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 1 shard ≈ 1.162 noticias, 2016→2026. Sin fecha en el path;
    // el <lastmod> es de publicación y va en -03:00, también en minutos consecutivos
    // dentro del shard (2018-01-08T17:09, 17:19, 17:21, 17:25).
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  // ── Agregados 28-09-2026 (batch 31: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  prensaeventos: {
    nombre: 'Prensa Eventos',
    index: 'https://prensaeventos.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap.xml..12.xml ≈ 11.612 artículos 2016-01→2026-09
    // El path es un slug plano, pero el <lastmod> coincide con el datePublished en
    // las 3 URLs revisadas (2016-01-31, 2016-02-22, 2016-03-14): no hace falta locDateRe.
  },
  revistanos: {
    nombre: 'Revista NOS',
    index: 'https://revistanos.cl/sitemap_index.xml',
    // Yoast: post-sitemap.xml..8.xml ≈ 7.118 artículos, 2000→2026. OJO: su
    // sitemap_index declara los sub-sitemaps con `http://` (trampa 13), así que se
    // apunta directo al https y se deja forceHttps por si algún <loc> viene en http.
    // El <lastmod> coincide con el datePublished (verificado en 2 de 3; el tercero
    // era la página de listado /blog/).
    articleOnly: true,
    forceHttps: true,
  },
  colegiodeprofesores: {
    nombre: 'Colegio de Profesores',
    index: 'https://www.colegiodeprofesores.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 4 shards ≈ 6.123 artículos. Las 6.123 URLs traen /YYYY/MM/DD/
    // y el <lastmod> es de EDICIÓN (artículos de 2015 con lastmod 2017-04-27,
    // 2019-03-21), así que gana la fecha del path.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  // ── Agregados 28-09-2026 (batch 30: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  noticiasubiobio: {
    nombre: 'Noticias U. del Bío-Bío',
    index: 'https://noticias.ubiobio.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap.xml..10.xml ≈ 9.128 artículos 2012→2026
    // El path es /YYYY/MM/DD/<slug>. El <lastmod> coincide con el datePublished en la
    // mayoría, pero en los artículos retocados se va 1-10 días (2016-10-24 con
    // lastmod 2016-11-02), así que gana la fecha del path.
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  actualidadudla: {
    nombre: 'Actualidad UDLA',
    index: 'https://actualidad.udla.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap.xml..8.xml ≈ 7.479 artículos 2020→2026
    // El path es /YYYY/MM/<slug> (sin día) y el <lastmod> es la fecha real CON día
    // (±1-3 días en los retocados): se deja el lastmod, porque forzar día 01 desde
    // el path perdería precisión real. (Al revés que noticiasubiobio, cuyo path sí
    // trae el día y su lastmod se corre más.)
  },
  lyd: {
    nombre: 'Libertad y Desarrollo',
    index: 'https://lyd.org/sitemap.xml',
    articleOnly: true, // Yoast: post-sitemap.xml..16.xml ≈ 15.422 posts, 2003→2026
    // El path es /<seccion>/YYYY/MM/<slug> y el <lastmod> es de EDICIÓN: una columna
    // de 2009 republicada en 2011 tiene lastmod 2011-03-14, así que gana la fecha del
    // path (a nivel de mes, que es la precisión real del medio). OJO: el CMS
    // enmascara el año en algunas entradas (0004/00, 0207/01); el rango (19|20) las
    // deja fuera y esas caen al lastmod. El urlRe además descarta las páginas de
    // listado tipo /otros-contenidos/2011/04/, que no tienen slug después del mes.
    // OJO: el año va en el grupo 1 COMPLETO —`((?:19|20)\d{2})`, no `(19|20)\d{2}`:
    // con la alternancia dentro del grupo, g1 captura "19" y la fecha sale "19-04-01".
    urlRe: /\/(?:19|20)\d{2}\/\d{2}\/[^/]+\/?$/,
    preferLocDate: true,
    locDateRe: /((?:19|20)\d{2})\/(\d{2})\//,
  },
  // ── Agregados 28-09-2026 (batch 29: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  elaconcagua: {
    nombre: 'El Aconcagua',
    index: 'https://www.elaconcagua.cl/sitemap.xml',
    // Arc XP con índice DOBLE: /sitemap.xml declara sitemap-index-1.xml, que a su vez
    // declara sitemap-1..8.xml (el sync expande los dos niveles). El includeRe tiene
    // que dejar entrar los TRES niveles —raíz, índice intermedio y shards— o baja 0
    // (trampa 1); el ancla `\/` hace que image-sitemap-index-1.xml y
    // video-sitemap-1.xml queden fuera (trampa 3).
    // ~7.000 artículos desde 2017-05 (San Felipe, Aconcagua), /YYYY/MM/DD/<slug>.
    // OJO: es la TERCERA propiedad de la provincia (junto a diarioaconcagua y
    // aconcaguadigital) y comparte 19 slugs con esta última: son sitios del mismo
    // grupo, no el mismo medio, así que va por separado.
    includeRe: /\/sitemap(?:-index-1)?\.xml$/i,
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  radiovalparaiso: {
    nombre: 'Radio Valparaíso',
    index: 'https://radiovalparaiso.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: un solo post-sitemap.xml con 843 artículos 2024-07→2026-05
    // El <lastmod> coincide con el datePublished en 6 de 6 URLs revisadas (el
    // sitio no declara dateModified), así que no necesita locDateRe: el path es
    // un slug plano.
  },
  cabreroenlinea: {
    nombre: 'Cabrero en Línea',
    index: 'https://wp.cabreroenlinea.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 6 shards ≈ 11.859 artículos, TODOS de 2026 (el subdominio
    // `wp.` es el portal del diario de Cabrero, Bío Bío). El path es
    // /YYYY/MM/DD/<slug>, así que la fecha sale de ahí aunque el <lastmod> venga
    // en -03:00.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  // ── Agregados 28-09-2026 (batch 28: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  calamaenlinea: {
    nombre: 'Calama en Línea',
    index: 'https://noticias.calamaenlinea.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 9 shards posts-post-1..9.xml ≈ 17.452 artículos 2020-06→2026-09
    // (Calama, Antofagasta). El path es /<seccion>/<slug> sin fecha, pero el
    // <lastmod> está bien repartido (máx. 17 el mismo día) y con offset -03:00, que
    // es la hora local: no hay D+1 ni lastmod de migración que corregir.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  demaracordilleratv: {
    nombre: 'De Mar a Cordillera TV',
    index: 'https://demaracordilleratv.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 3 shards ≈ 4.670 artículos 2021-12→2026-09 (O'Higgins).
    // El path es /YYYY/MM/DD/<slug>; el <lastmod> NO sirve: 1.378 de 4.000 locs
    // comparten lastmod 2026-04-03/2026-03-30 (oleada de retoques, como
    // capodeprovincia). Sin locDateRe el catálogo parecería un medio de 2 meses.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  elpuelche: {
    nombre: 'Radio El Puelche',
    index: 'https://www.elpuelche.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: un único shard con 1.157 artículos de 2009-10 a 2026-06
    // (Maule). El <lastmod> es de EDICIÓN, no de publicación —la migración del
    // sitio dejó 86 artículos el 2024-07-19, 63 el 07-24, 40 el 07-25—, pero las
    // 1.157 URLs traen /YYYY/MM/DD/, así que locDateRe recupera los 17 años.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  // ── Agregados 28-09-2026 (batch 27: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  radiofestival: {
    nombre: 'Radio Festival',
    index: 'https://www.radiofestival.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 17 shards wp-sitemap-posts-post-1..17.xml (2.000 locs c/u)
    // ≈ 32.819 artículos 2015-09→2026-09 (Valparaíso/Quilpué). El path es un
    // slug plano, sin fecha, pero el <lastmod> viene con offset -03:00 —que es la
    // hora local de publicación—, así que no hay corrimiento D+1 al convertir.
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  losriosaldia: {
    nombre: 'Los Ríos al Día',
    index: 'https://www.losriosaldia.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 11 shards ≈ 20.350 artículos 2013-11→2026-09. El path es
    // /YYYY/MM/DD/<slug> y el <lastmod> es el instante UTC: preferLocDate +
    // locDateRe hacen ganar la fecha del path (el mismo criterio que curacavidigital).
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  araucaniacuenta: {
    nombre: 'Araucanía Cuenta',
    index: 'https://www.araucaniacuenta.cl/wp-sitemap.xml',
    // WP 5.5+ nativo: 10 shards ≈ 18.463 artículos 2014-11→2026-09. OJO: slug
    // plano sin fecha en el path y <lastmod> en UTC (+00:00), así que lo publicado
    // después de las 21:00 hora local puede quedar D+1 — no hay fecha en el path
    // con la cual corregirlo (a diferencia de los dos de arriba).
    includeRe: /\/wp-sitemap-posts-post-\d+\.xml$/i,
    articleOnly: true,
  },
  // ── Agregados 28-09-2026 (batch 26: 3 pendientes ⬜ de TAREAS/tareas_sitemap.md) ──
  diariosanjose: {
    nombre: 'Diario San José',
    index: 'https://www.diariosanjose.cl/sitemap.xml',
    // Mismo tema WP con sitemap MENSUAL propio que futrono/chiloe/paillaco:
    // 100 shards /sitemap/YYYY/MM/sitemap-pt-post.xml (2018/06→2026/09) con
    // <lastmod> reales (San José de la Mariquina, Los Ríos).
    includeRe: /\/sitemap\/\d{4}\/\d{2}\/sitemap-pt-post\.xml$/i,
  },
  patagonianews: {
    nombre: 'Patagonia News',
    index: 'https://www.patagonianews.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap.xml (1.000 locs) + post-sitemap2.xml (25)
    // OJO: el <lastmod> es FALSO. Los 1.026 locs traen lastmod de ago-sep 2026
    // (el sitio regenera los shards), pero las URLs van de 2015 a 2026: sin
    // locDateRe el catálogo parecería un medio de 2 meses. La fecha real está en
    // el path /YYYY/MM/DD/<slug>, así que preferLocDate + locDateRe la hacen
    // ganar. 1.025 artículos, 2019→2026 (el grueso 2019-2020).
    // OJO 2: los grupos 1 y 2 del locDateRe TIENEN que ser el año y el mes —
    // extractPairs arma la fecha como `g1-g2-(g3 ?? 01)`, así que un patrón con
    // el año solo (`(20\d{2})\/\d{2}\/\d{2}`) no da error: guarda "2019-undefined-01".
    preferLocDate: true,
    locDateRe: /\/(20\d{2})\/(\d{2})\/(\d{2})\//,
  },
  aysenahora: {
    nombre: 'Aysén Ahora',
    index: 'https://www.aysenahora.cl/sitemap_index.xml',
    articleOnly: true, // Yoast: post-sitemap.xml (1.000) + post-sitemap2.xml (70)
    // 1.070 artículos 2024-05→2026-09 (Coyhaique). El path es un slug plano
    // (sin fecha), pero el <lastmod> sí es la fecha real de publicación, así que
    // no hace falta locDateRe.
  },
  // Descartados batch 25: eldivisadero/soytemuco/soypuertomontt/soyarica/
  // soyosorno/cronicanoticias — sin robots (fetch failed) o endpoints con 0 locs.
  // eha.cl (y su alias elheraldoaustral.cl, mismo sitemap): urlset plano de 41
  // locs, todas con el mismo <lastmod> de regeneración y sin fecha en el path.
  // redmaule.com: Prontus declara solo sitemap_pags.xml (1.001 locs) SIN ningún
  // <lastmod> y sin fecha en el path: el catálogo quedaría sin fechas.
  // diariosextaregion.cl (el robots de diarioviregion.cl lo declara): 2.078 locs
  // de páginas SEO autogeneradas (/quality/version/f3mbjnabz8e0ncv.shtml), sin
  // un solo artículo.
  // Descartados batch 24: norteyenergia.cl (robots declara sitemap.xml y
  // sitemap.rss, ambos 0 locs), lidersanantonio.cl (su /sitemap.xml no es suyo:
  // devuelve los sitemaps de estrellaarica.cl y estrellaiquique.cl, otro
  // conglomerado editorial; además /sitemap_index.xml responde 450).
  // Descartados batch 20: codepu.cl (los 4 endpoints estándar dan 404) y
  // mch.cl (fetch failed en los 3, sin línea Sitemap en robots).
  // Descartados batch 19: tehuelchenoticias.cl (Wix: `store/sitemap-dru-index.xml`
  // responde 0 locs), region2.cl (urlset plano de 500, sin historia),
  // temucoya.cl (sitemap-pt-post-YYYY-MM mensual pero 76 meses ≈ 1.000 artículos),
  // chillanonline.cl/centralnoticias.cl/eldiariopanguipulli.cl/periodicolosrios.cl/
  // lavozdevaldivia.cl/arica365.cl/mapuexpress.org/rengonotas.cl (nada).
  // Descartes de las tandas 16-19 van como entradas de SIN_SITEMAP en
  // watchlist.mjs (fila 🔒 de TAREAS/tareas_sitemap.md, cada una con su motivo);
  // los comentarios siguientes son solo el resumen del sondeo.
  // Descartados batch 18: werken.cl (índice plano de ~90 artículos, sin
  // paginación), chilenews.cl (urlset plano de 100),
  // laopiniononline.cl/montealegre.cl/laliguanoticias.cl/angelino.cl (WP, pero
  // 1-3 shards residuales), elpaila/terceradosis/informechile (índices de 2-3
  // entradas), prensacurico/maulealdia/quintainterior/radioaraucania/
  // eldiariopanguipulli (los 4 endpoints WP devuelven 0 locs).
  // diarioconcepcion.cl NO es un descarte: ya estaba en el catálogo (línea ~318).
  // Descartados batch 17: davidnoticias.cl (índice de 1.292 shards íntegramente
  // SEO spam: ?id=link-slot*/daftar-slot*, sin un solo artículo), radiocristalina
  // (wp-sitemap con 1 solo shard post), radioaustralvaldivia/radioguayacan/
  // radiobuenanueva/diariolaguino/diarioriobueno/diariolanco/diariomafil
  // (sitemaps planos sin índice ni news), ceinoticias/hvaradio-dns/estrellavalpo
  // — DNS ENOTFOUND o 404.
  // Descartados batch 12: munistgo/radiocamara/subturismo/mineduc/minsal/elcorto/
  // chilenafm/chilenoticias/cctt/codeff/inach/meteored/utalca/ufro/udp/pcchile/pdc/
  // ppd/democratas — flat urlset. aqua — DNS ENOTFOUND.
  // Descartados (28-ago-2026 batch 11): elsancarlino/elurbanorural/frutillarhoy/guardiandelsur/
  // lanoticia/larazon/pautalosrios/primeranota/pucontv/ladiscusion/latribuna — flat urlset.
  // linaresnoticia/noticiascobquecura — DNS ENOTFOUND. cobquecura — 0 artículos.
  // australtemuco/australosorno/australvaldivia — conglomerado Estrella/Mercurio (450).
  // Descartados (28-ago-2026 batch 10): sernac/sii/sag/ispch/cultura/minmujeryeg/sence —
  // sitemap_index.xml retorna flat urlset (no sitemapindex), articleOnly los descarta.
  // diarioelheraldo/araucanianoticias/datossur/eltrabajo/elregional/elprovincial/aricaldia/
  // antofagasta_tv/diariosol — sitemap_index.xml retorna flat urlset sin sub-sitemaps.
  // elamaule — HTTP 403 (Cloudflare). inoticias — 0 artículos.
};

// ---------------------------------------------------------------------------
// Utilidad compartida: hosts (sin www, minúsculas) de los endpoints de un
// medio (robots/index/extra). La usan add-source.mjs (mapas del catálogo) y
// watchlist.mjs (cruce de dominios) para derivar dominios sin transcribir.
// ---------------------------------------------------------------------------
export function mediaHosts(cfg) {
  const urls = [cfg?.robots, cfg?.index, ...(cfg?.extra || [])].filter(Boolean);
  const out = new Set();
  for (const u of urls) {
    try {
      out.add(new URL(u).hostname.toLowerCase().replace(/^www\./, ''));
    } catch { /* URL inválida: se omite */ }
  }
  return [...out];
}
