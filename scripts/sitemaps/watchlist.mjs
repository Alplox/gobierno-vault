// Genera `TAREAS/tareas_sitemap.md`: bitácora de sitios de prensa chilenos pendientes de
// sincronizar su sitemap al catálogo local (sitemaps/<medio>/), para ampliar la
// variedad de puntos de vista al verificar eventos de gobiernos pasados.
//
// Fuentes de datos:
//   - awesome-chilean-rss (https://github.com/Alplox/awesome-chilean-rss):
//     `feeds-database.json` (sites[] con feeds verificados) + `watchlist.json`
//     (sitios candidatos, muchos sin feed RSS). Por defecto se descargan online
//     desde raw.githubusercontent.com; `--source <dir>` fuerza copia local
//     (o `--offline` usa el clone hermano `../awesome-chilean-rss` sin red).
//   - `sitemaps/_manifest.json` (medios ya sincronizados en el catálogo).
//   - `src/content/sources/*.md` (campo `medio:` de las fuentes ya usadas).
//   - `src/content/organizations/*.md` (orgs tipo medio_comunicacion/red_social/etc.).
//
// Solo se listan categorías de prensa y afines (noticias, regional, gobierno,
// radio, partidos, negocios, comunidad, medio ambiente, educación, salud,
// cultura e internacional) y solo la URL del sitio (no los feeds).

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import YAML from 'yaml';
import { MEDIA, mediaHosts } from './media.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../..');

// Categorías de prensa y afines (se excluyen sports, gaming, jobs, entertainment, technology).
const CATEGORIAS_PRENSA = new Set([
  'news', 'news-international', 'regional', 'government', 'radio',
  'political-parties', 'business', 'community', 'environment',
  'education', 'health', 'culture',
]);

// Dominios verificados SIN sitemap utilizable (revisado a mano): no se
// reintentan en cada regeneración. Incluye sitemaps existentes pero no
// catalogables como prensa. Key: dominio, value: nota.
// Exportado para que scripts/probe-sitemap.mjs pueda avisar "ya descartado por X"
// sin volver a sondear el dominio.
export const SIN_SITEMAP = {
  'efe.cl': 'verificado sin sitemap (solo RSS /feed/)',
  'fiscaliadechile.cl': 'verificado sin sitemap (Drupal 10 sin xmlsitemap)',
  'pjud.cl': 'verificado sin sitemap (robots.txt 404)',
  'bcn.cl': 'sitemap de portal con ~70k sub-sitemaps (normas LeyChile, no prensa) — no catalogable',
  // Intentos previos documentados en scripts/sitemaps/media.mjs (flat urlset /
  // DNS / 450 / 403 / 0 artículos): no reintentar. Solo dominios hoy ⬜ —
  // jamás 🟡 (la referencia en el vault tiene precedencia).
  'radiocamara.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'subturismo.gob.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'minmujeryeg.gob.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'sence.gob.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'sernac.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'ispch.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'chilenafm.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'chilenoticias.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'codeff.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'inach.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'meteored.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'utalca.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'ufro.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'udp.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'pcchile.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'pdc.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'ppd.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'democratas.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'elsancarlino.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'elurbanorural.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'frutillarhoy.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'guardiandelsur.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'lanoticia.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'pautalosrios.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'primeranota.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'pucontv.com': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'ladiscusion.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'datossur.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'eltrabajo.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'elregional.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'elprovincial.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'aricaldia.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'antofagasta.tv': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'diariosol.cl': 'sitemap_index plano sin sub-sitemaps (flat urlset)',
  'linaresnoticia.cl': 'DNS ENOTFOUND (verificado)',
  'aqua.cl': 'DNS ENOTFOUND (verificado)',
  'cobquecura.cl': 'verificado sin artículos en el catálogo',
  'inoticias.cl': 'verificado sin artículos en el catálogo',
  'ellanquihue.cl': 'verificado sin artículos en el catálogo',
  'estrellaantofagasta.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'laestrellachiloe.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'estrellaloa.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'mercurioantofagasta.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'mercuriocalama.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'australosorno.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'australtemuco.cl': 'conglomerado Estrella/Mercurio: 450 (verificado)',
  'elamaule.cl': 'HTTP 403 Cloudflare (verificado)',
  // ── Descartes de las tandas 16-19 (28 y 27-09-2026) ────────────────────────
  // Regla: TODO medio que se descarte después de sondearlo se anota acá con su
  // motivo, para que la fila pase a 🔒 y no se reintente en cada regeneración.
  // La nota debe decir qué se verificó, no solo "no sirve".
  // Batch 16:
  'lun.com': 'robots.txt (en www) 200 sin línea Sitemap y con `Googlebot: Disallow: /`; el apex falla el handshake TLS (verificado 28-09-2026)',
  'noticiasimportantes.cl': '/sitemap.xml responde 0 locs (declarado en robots)',
  'sancarlosaldia.cl': 'robots declara /sitemap.xml pero responde HTTP 404',
  'diarioelcondor.cl': 'wp-sitemap.xml solo declara posts-page + taxonomías, sin posts',
  'eldiariodecuracavi.cl': 'wp-sitemap con un único post-sitemap residual',
  'm360.cl': 'DNS fail al pedir /noticias/sitemap_pags.xml (declarado en robots)',
  // Batch 17:
  'davidnoticias.cl': 'índice de 1.292 shards íntegramente SEO spam (?id=link-slot*), sin un solo artículo',
  'radiocristalina.cl': 'wp-sitemap con un solo shard wp-sitemap-posts-post-1.xml',
  'radioaustralvaldivia.cl': 'wp-sitemap con shards de posts residuales; radio sin volumen',
  'radioguayacan.cl': 'robots.txt vacío (0 bytes), sin sitemap',
  'radiobuenanueva.cl': 'robots.txt 404, sin sitemap',
  'diariolaguino.cl': '/sitemap.xml es un urlset plano de 180 páginas, sin artículos',
  'diarioriobueno.cl': '/sitemap.xml es un urlset plano de 180 páginas, sin artículos',
  'diariolanco.cl': '/sitemap.xml es un urlset plano de 180 páginas, sin artículos',
  'diariomafil.cl': '/sitemap.xml es un urlset plano de 180 páginas, sin artículos',
  'ceinoticias.cl': 'DNS ENOTFOUND (verificado 27-09-2026)',
  'estrellavalpo.cl': 'DNS ENOTFOUND (verificado 27-09-2026)',
  // Batch 18:
  'werken.cl': 'índice plano de ~90 artículos (temática mapuche), sin paginación',
  'chilenews.cl': '/sitemap.xml es un urlset plano de 100 URLs',
  'laopiniononline.cl': 'wp-sitemap con shards de posts residuales (volumen bajo)',
  'montealegre.cl': 'wp-sitemap con shards de posts residuales (volumen bajo)',
  'laliguanoticias.cl': 'wp-sitemap con shards de posts residuales (volumen bajo)',
  'angelino.cl': 'wp-sitemap con shards de posts residuales (volumen bajo)',
  'prensacurico.cl': 'los 4 endpoints WP (wp-sitemap/sitemap_index/sitemap) devuelven 0 locs',
  'maulealdia.cl': 'los 4 endpoints WP devuelven 0 locs',
  'quintainterior.cl': 'los 4 endpoints WP devuelven 0 locs',
  'radioaraucania.cl': 'los 4 endpoints WP devuelven 0 locs',
  'eldiariopanguipulli.cl': 'los 4 endpoints WP devuelven 0 locs',
  'terceradosis.cl': '/sitemap.xml es un índice de 3 entradas (pags/image/video), sin artículos',
  'informechile.cl': '/sitemap.xml es un índice de 2 entradas, sin artículos',
  // Batch 36 (categoría Radio, los 48 pendientes ⬜):
  'fmjoven.com': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs',
  'fmstylo.cl': 'es una estación de la red Patagonia Radio: su robots declara el sitemap de patagoniaradio.cl y sus 3 endpoints propios devuelven 404. Ese sitemap son 33 shards mensuales con ~7 locs cada uno (la página del portal incluida), sin archivo por estación',
  'laradioneta.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs',
  'los40.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'miradorfm.cl': 'el sitio real es mirador.fm y su wp-sitemap no declara ningún shard de posts: los 16 CPTs son de páginas, videos (qtvideo) y taxonomías',
  'ojosubterraneo.caster.fm': 'el sitemap que declara es el de la plataforma (www.caster.fm) y sus 34 locs son noticias de la propia plataforma (/news/migration-complete/), no del medio',
  'radio1demayo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radio80.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radionueveveinte.com': 'dominio estacionado: su /sitemap.xml devuelve 2 locs de otro sitio (www.foriamking.nl) y los otros endpoints dan 404',
  'radioalborada.cl': 'robots.txt 403 y los 3 endpoints estándar devuelven 403',
  'radioalternativa.cl': 'los 3 endpoints estándar dan timeout (fetch aborted)',
  'radioangelina.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'radioarmonia.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'radioazucar.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radiocarillon.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radiocolocolo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap: el sitio no responde desde esta red',
  'radiodelmar.cl': '1.001 locs con slugs en inglés traducidos y temas genéricos globales (`take-precautions-when-shopping-at-huge-malls-to-prevent-viruses`, `a-highly-classified-experiment-involving-human-blood-cells`): es un fundo de contenido SEO generado, no redacción de una radio chilena',
  'radiodisney.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'elconquistador.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'horizonte.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radiokonciencia.org': '48 locs, todas de 2023, sobre cultura japonesa (sección kyouteijou) y sin cobertura de gobierno: volumen y tema insuficientes',
  'laclave.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radiomaxima.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radioplaceres.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'radioplay.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radioportales.cl': 'robots.txt 500 y los 3 endpoints estándar devuelven 500',
  'radiosantiago.cl': 'su robots declara el wp-sitemap de eldiariodesantiago.cl: es el mismo sitio bajo otro nombre de dominio y ya entró al catálogo con ese slug',
  'radiosinfonia.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'radiotiempo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radiouniverso.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radiouno.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radio.usach.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'rvl.uv.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 500',
  'radiovillafrancia.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs',
  'radiozero.cl': 'su wp-sitemap declara un único shard (wp-sitemap-posts-page-1.xml): solo páginas, ningún artículo',
  'radiosregionales.cl': 'mismo caso que fmstylo.cl: su robots declara el sitemap de patagoniaradio.cl y sus 3 endpoints propios devuelven 404',
  'rockandpop.cl': 'el único sitemap con artículos es su /out/sitemap.xml, con 37 locs de 2026 y el path /YYYY/MM/ sin día: volumen insuficiente',
  'soberaniaradio.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'beethovenfm.cl': 'post-sitemap plano de 2 locs, ambas de 2021: medio inactivo',
  // Batch 35 (categoría Noticias nacionales, los 26 pendientes ⬜):
  'amarillosxchile.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'canaldenoticias.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs',
  'creas.uahurtado.cl': 'subdominio sin sitemap: fetch failed en los 3 endpoints y su robots.txt no responde',
  'diarioelobservador.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'diarioelprogreso.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'diariolaportada.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'enlaciudad.cl': 'blog en Blogger sin sitemap: fetch failed en los 3 endpoints y robots.txt no responde',
  'g80.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'news.google.com': 'robots.txt 200 sin línea Sitemap y los 3 endpoints devuelven 200 con 0 locs; además es un agregador de enlaces de terceros, no un medio con artículos propios',
  'impresa.lasegunda.com': 'subdominio de la edición impresa: fetch failed en los 3 endpoints. El sitemap del medio ya está en el slug `lasegunda` (que entra por www.lasegunda.com/robots.txt)',
  'mapuche-nation.org': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs',
  'mqn.cl': 'post-sitemap plano de 85 locs, todas de 2026 (el <lastmod> máximo se repite 2 veces): volumen insuficiente',
  'partidodelagente.cl': 'post-sitemap plano de 9 locs de 2023 y medio inactivo (su feed moría en 2023-07)',
  'periodismosanador.blogspot.com': 'blog en Blogger sin sitemap: fetch failed en los 3 endpoints y robots.txt no responde',
  'periodismo2.cl': 'agregador: urlset plano topado en 5.000 locs que solo cubre 2026-06-17→2026-09-26 (66% en junio, mayormente deportes y mundo), con URLs opacas /article/<uuid> que no dan título y solo el news-sitemap de 56 entradas lo trae',
  'puertomonttonline.cl': 'post-sitemap plano de 120 locs con el <lastmod> de una migración (2023-12-12) mientras el datePublished real es de 2015, y el path no trae fecha: no hay con qué corregirlo',
  'quepasa.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'radiopilmaiquen.cl': 'su /sitemap.xml es un índice de 4 CPTs, pero el shard wp-sitemap-posts-post-1.xml devuelve 0 locs (declarado y vacío, trampa 10)',
  'radiopresidenteibanez.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'radiosanbartolome.cl': 'robots.txt 500 y los 3 endpoints estándar devuelven 500',
  'thetime.cl': 'el sitio responde desde otro dominio (thetimeslatino.com) y su sitemap plano de 269 locs son páginas fijas (/terminos-y-condiciones/, /publicidad/) y horóscopo, con solo 3 locs de 2016',
  'pudahuel.cl': 'el único sitemap con artículos es el /out/sitemap.xml que declara su robots: 61 locs con /YYYY/MM/ sin día y un datePublished hasta 7 h corrida del <lastmod>; el /sitemap_index.xml que anuncia devuelve 404 y su /out/sitesmap-news.xml (con el typo) trae 50',
  // Batch 34 (categoría Regional, los 36 pendientes ⬜):
  'periodicochinchorro.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'elandino.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'elconcecuente.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'elllanquihue.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'elpatagondomingo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'lanoticiaonline.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'laopinon.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'maulee.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'soyquillota.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'grafelbergnoticias.blogspot.com': 'fetch failed en sitemap/sitemap_index/wp-sitemap; el blog no responde (robots.txt tampoco)',
  'losandesonline.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'rionegro.ligup2.com': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'diarioaysenopina.cl': 'robots.txt 403 y los 3 endpoints estándar devuelven 200 con 0 locs',
  'opinionsur.cl': 'su robots declara /sitemap.xml, que devuelve 200 con 0 locs; los otros endpoints dan 404',
  'radiopulsocomunal.cl': 'su robots declara /sitemap.xml, que devuelve 200 con 0 locs en los 3 endpoints',
  'elsur.cl': 'su /sitemap.xml no es suyo: devuelve el índice compartido de Prontus con los sitemaps de estrellaarica.cl y estrellaiquique.cl (19 locs de esos sitios); los otros endpoints dan HTTP 450',
  'redaraucania.com': 'su robots declara el sitemap de redaraucania.com, pero las 1.001 locs son de otro dominio (diariosenred.com), y sin fecha',
  'lavozdepaillaco.cl': 'urlset plano de 3 locs (la home + 2 páginas de categoría), sin artículos',
  'eldiariodemaule.com': 'su sitemap_index declara solo 2 CPTs (page-sitemap y blocks-sitemap), ningún shard de posts',
  'parralactual.com': 'urlset plano de 686 locs sin ningún <lastmod> y solo 47 con fecha en el path; casi todos son páginas de categoría /cat-NN/',

  // Batch 33 (categoría Gobierno / instituciones, los 22 pendientes ⬜):
  'elmartutino.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven HTTP 403',
  'lapaila.cl': 'urlset plano de 3 locs (la home + 2 páginas de categoría), sin artículos',
  'diarioatacama.cl': 'su /sitemap.xml no es suyo: devuelve el índice compartido de Prontus con los sitemaps de estrellaarica.cl y estrellaiquique.cl (19 locs de esos sitios); los otros endpoints dan HTTP 450',
  'estrellaconcepcion.cl': 'su /sitemap.xml no es suyo: devuelve el índice compartido de Prontus con los sitemaps de estrellaarica.cl y estrellaiquique.cl (19 locs de esos sitios); los otros endpoints dan HTTP 450',
  'aricamia.cl': 'Yoast con 51 locs, pero las 51 tienen <lastmod> 2026-03-03 (el día que se publicó el sitio) y son landings de sección (/gastronomia-arica/, /universidades-arica/), no artículos',
  'chile.gob.cl': 'su robots declara `http://www.chile.gob.cl/chile/sitemap_pags.xml`, que devuelve 404; los otros endpoints dan 0 locs',
  'dprlaaraucania.dpr.gob.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'providencia.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'snamchile.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'cultura.gob.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'gobiernoenterreno.interior.gob.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'muniarica.cl': 'su robots declara /sitemap.xml, que responde HTTP 500; sitemap_index.xml y wp-sitemap.xml dan 0 locs',
  'chilecompra.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'mercadopublico.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'minagri.gob.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'munistgo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'munivina.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'prochile.gob.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'transparenciaactiva.presidencia.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'marcachile.cl': 'post-sitemap.xml con 1.667 artículos, pero el <lastmod> es una migración de feb-2025 (1.041 con 2025-02-12) mientras el datePublished real llega a 2008, y no hay fecha en el path: no hay forma de fecharlos',
  'metro.cl': 'urlset plano de 66 locs, todas páginas de servicio (planificador, estado-red, estaciones, tarifas, carga Bip), sin noticias',
  'ammot.cl': 'wp-sitemap con un único shard de 9 posts, varios con slug opaco (937-2, 954-2): reevaluar si crece',
  'spensiones.cl': 'alias: el sitio real es pensiones.cl (su sitemap declara post-sitemap1.xml), con solo 4 locs, 3 artículos y ninguno con fecha en el path: reevaluar si crece',
  // Batch 32 (gobierno / medio ambiente / negocios):
  'camara.cl': 'bloquea el rastreo: robots.txt responde HTTP 403 y los 3 endpoints estándar también 403',
  'dt.gob.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'sag.gob.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'shoa.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'diariooficial.interior.gob.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'ine.gob.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'minmineria.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'tierraadentro.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'induambiente.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'revistachilenadepediatria.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven HTTP 403',
  'musicapopular.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'capital.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'vcmagazine.cl': 'su sitemap_index declara 9 entradas, pero el único post-sitemap.xml devuelve 0 locs',
  'nss.cl': 'urlset plano de 754 locs, casi todas páginas corporativas replicadas en 4 idiomas (en/zh/pt/es), sin artículos',
  // Batch 31 (categorías cultura/comunidad):
  'museodelamemoria.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'villagrimaldi.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'aldeasinfantiles.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'losangeles.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'mnba.gob.cl': '/sitemap.xml es un urlset de 1 loc (google-news-xml); los otros endpoints dan 404',
  'gam.cl': 'su robots declara /sitemap.xml, que responde HTTP 500; los otros endpoints dan 404',
  'bibliotecanacional.gob.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'iglesia.cl': 'urlset plano de 6 locs (home + noticias.php), sin artículos',
  'atencionchilena.cl': 'su sitemap_index.xml declara una sola entrada: page-sitemap.xml',
  'quimantu.cl': 'índice de 4 CPTs sin archivo periodístico: 61 "noticias" (incluida la página de listado) y 155 fichas de libro',
  'teatroamil.cl': 'urlset plano de 287 locs, casi todas páginas institucionales (/quienes-somos/…) sin fecha en el path',
  // Batch 30 (categorías gobierno/salud/educación):
  'contraloria.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'dpp.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'senadis.gob.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'supersalud.gob.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'sea.gob.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'sii.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'minjusticia.gob.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'energia.gob.cl': '/sitemap.xml devuelve 404 y sitemap_index.xml + wp-sitemap.xml devuelven 0 locs',
  'corfo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt sin línea Sitemap)',
  'aduana.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'medwave.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'sociedadcirugia.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'conicyt.cl': 'su robots declara http://www.conicyt.cl/sitemap.xml, que devuelve 404; los otros endpoints dan 0 locs',
  'revistamedicadechile.cl': 'OJS con 36.051 artículos, pero SIN ningún <lastmod> y casi sin fecha en el path (679 de 36.051); además duplica cada artículo con su PDF (/article/view/N y /article/view/N/M)',
  'anid.cl': 'urlset plano de 388 locs, casi todas páginas institucionales (conoce-anid, etc.), sin artículos',
  'torax.cl': 'wp-sitemap con un único shard de 9 artículos: reevaluar si crece',
  // Batch 29:
  'portalnacional.cl': 'Yoast con 8.157 artículos, pero el <lastmod> es el dateModified: una oleada de retoques (2026-06-20, 2026-09-28) fechó en 2026 ~7.900 entradas cuyo datePublished es de 2025 o feb-2026 (verificado en 5 URLs). Sin fecha en el path no hay forma de corregirlas',
  'correodellago.cl': 'su wp-sitemap-posts-post-1.xml responde HTTP 500 pero entrega 133 URLs de contenido SEO/listados (jardinería, insomnio, nostalgia), no prensa',
  'elchelenko.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'elconcordia.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'lectoronline.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'natalesonline.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'orbitanoticias.cl': 'los 3 endpoints estándar devuelven HTTP 500',
  'puertoaldia.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'suractual.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  // Batch 28:
  'soyantofagasta.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'soycalama.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'soyconcepcion.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'soycopiapo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'soyiquique.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'soyvalparaiso.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'soychiloe.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'temucotelevision.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'radarinformativo.cl': 'agregador que republica notas de otros medios (/medio/biobio, etc.): sus 1.200 URLs /n/<id>-<slug> cubren solo 5 días (lastmod 2026-09-23 a 09-28) y duplican lo ya catalogado',
  // Batch 27:
  'angolinos.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'elparadiario14.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'elrepuertero.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'elvacanudo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'iquiqueonline.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'sextanoticias.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'pscchile.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'ufromedios.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde)',
  'chilemosaico.cl': 'su robots declara /eventos/wp-sitemap.xml, que responde 0 locs; los otros 3 endpoints dan 404',
  'chasquis.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'dtvaldivia.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'elnortero.cl': 'HTTP 403 en los 3 endpoints estándar (robots.txt sin línea Sitemap)',
  'libertaddigital.cl': 'su /sitemap.xml no le pertenece: devuelve los sitemaps de fifa55cs.com (otro sitio del mismo hosting); robots.txt 200 pero sin línea Sitemap',
  'hoyxhoy.cl': 'su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquique.cl (otro conglomerado editorial); /sitemap_index.xml y /wp-sitemap.xml responden 450',
  'en.mercopress.com': 'misma agencia que mercopress.cl (ya catalogado, 46.710 artículos): la edición en inglés duplicaría el contenido',
  // Batch 26:
  'elmonitorparral.com': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde)',
  'canalsurpatagonia.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde)',
  'noticias.123.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde)',
  'diarioinformativo.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde)',
  'tiempo21araucania.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'somos9.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'diariolatribuna.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'diariolaquinta.cl': 'robots.txt declara sitemap.xml y sitemap.rss, ambos con 0 locs',
  'hoy.cl': 'los 3 endpoints estándar devuelven 404 (robots.txt no declara sitemap)',
  'orocoipo.cl': 'variantes ?sitemapindex.xml y ?sitemapNNN.xml con 0 locs; /sitemap.xml es un urlset de 1 loc (la home)',
  'estrellatocopilla.cl': 'su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquique.cl (otro conglomerado editorial); /sitemap_index.xml y /wp-sitemap.xml responden 450',
  'revistaenfoque.cl': 'wp-sitemap con 786 artículos, pero todos de moda y turismo de Argentina (slugs en inglés): no es prensa de gobierno chilena',
  'chile21.cl': 'urlset plano de 777 locs que mezcla 664 URLs de un solo segmento (secciones y artículos, sin fecha en el path) con 9 de profundidad de article: no se puede separar por patrón',
  'eldesarrollo.cl': 'urlset plano de 237 locs (142 con <lastmod>, todos de sept-2026) y sin fecha en el path: no hay archivo histórico que catalogar',
  // Batch 25:
  'eldivisadero.cl': 'robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs',
  'soytemuco.cl': 'robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs',
  'soypuertomontt.cl': 'robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs',
  'soyosorno.cl': 'robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs',
  'soyarica.cl': 'robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs',
  'ellanquihue.cl': 'robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs',
  'vientopatagon.cl': 'robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs',
  'diariolabrador.cl': 'robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs',
  'cronicanoticias.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'tribunadelbiobio.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'lacoyuntura.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'aricaonline.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs',
  'ptowilliams.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'septimapaginanoticias.cl': 'robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404',
  'elnaveghable.cl': 'HTTP 403 en los 3 endpoints estándar (robots.txt no declara sitemap)',
  'elmagallanews.cl': 'HTTP 403 en los 3 endpoints estándar (robots.txt no declara sitemap)',
  'elrancahuaso.cl': 'HTTP 403 en los 3 endpoints estándar (robots.txt no declara sitemap)',
  'granvalparaiso.cl': 'robots.txt 404 y los 3 endpoints estándar devuelven 404',
  'eha.cl': '/sitemap.xml es un urlset de 41 locs (home + 40 noticias) sin fecha en el path y con <lastmod> uniforme de regeneración; elheraldoaustral.cl sirve exactamente el mismo sitemap (es el mismo sitio)',
  'elheraldoaustral.cl': 'alias de eha.cl: devuelve el mismo /sitemap.xml de 41 locs',
  'redmaule.com': 'Prontus declara solo sitemap_pags.xml: 1.001 locs SIN ningún <lastmod> y sin fecha en el path, así que el catálogo quedaría sin fechas',
  'diarioviregion.cl': 'su robots declara el sitemap de diariosextaregion.cl: 2.078 locs de páginas SEO autogeneradas (/quality/version/f3mbjnabz8e0ncv.shtml), sin un solo artículo',
  'mercuriovalpo.cl': 'su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquique.cl (otro conglomerado editorial); /sitemap_index.xml y /wp-sitemap.xml responden 450 y robots.txt da 404',
  'cronicachillan.cl': 'su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquique.cl (otro conglomerado editorial); /sitemap_index.xml y /wp-sitemap.xml responden 450 y robots.txt da 404',
  'australvaldivia.cl': 'su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquique.cl (otro conglomerado editorial); /sitemap_index.xml y /wp-sitemap.xml responden 450 y robots.txt da 404',
  'megatiempo.cl': 'mismo CMS y shards content-noticias/sitemap-YYYY-MM.xml que meganoticias (ya catalogado): mismo grupo editorial, no agregar por separado',
  // Batch 24:
  'norteyenergia.cl': 'robots.txt declara sitemap.xml y sitemap.rss, ambos con 0 locs',
  'lidersanantonio.cl': 'su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquique.cl (otro conglomerado editorial). Además /sitemap_index.xml y /wp-sitemap.xml responden 450 y robots.txt da 404',
  // Batch 23:
  'cut.cl': 'sin sitemap: robots.txt sin línea Sitemap y los 3 endpoints estándar dan 404',
  'fundacionpobreza.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde)',
  'energiaestrategica.com': 'sin sitemap: robots.txt sin línea Sitemap y los 3 endpoints dan 404 o 0 locs',
  'cpc.cl': 'robots.txt declara sitemap.xml y sitemap.rss, pero ambos responden 0 locs',
  'lavozdelnorte.cl': 'robots.txt declara sitemap.xml y sitemap.rss, ambos con 0 locs',
  'thepuertovaras.cl': 'robots.txt declara sitemap.xml y sitemap.rss, ambos con 0 locs',
  'contraplano.cl': 'robots.txt declara sitemap_index.xml, pero ese y sitemap.xml dan 404',
  'prensadigital.cl': 'índice con 133 shards sitemap-posttype-post.YYYYMM.xml, pero TODOS son resultados de loterías (kino, loto, sorteos): sin contenido editorial',
  'analisis.com': 'urlset plano de 1.400 URLs de las que solo 586 son /articulo/YYYY-MM-DD-…, todas de 2026 (sin historia) y con <lastmod> uniforme de 2026-09-25',
  // Batch 20:
  'codepu.cl': 'sin sitemap: robots.txt 404 y los 3 endpoints estándar (sitemap, sitemap_index, wp-sitemap) devuelven 0 locs',
  'mch.cl': 'fetch failed en sitemap/sitemap_index/wp-sitemap y robots.txt sin línea Sitemap',
  // Batch 19:
  'tehuelchenoticias.cl': 'Wix: store/sitemap-dru-index.xml responde 0 locs',
  'region2.cl': '/sitemap.xml es un urlset plano de 500 URLs, sin historia',
  'temucoya.cl': 'sitemap mensual WP válido (sitemap-pt-post-YYYY-MM, 76 meses) pero solo ~1.000 artículos: reevaluar si crece',
  'chillanonline.cl': 'sin sitemap (robots, wp-sitemap, sitemap_index, sitemap y news-sitemap sin locs útiles)',
  'centralnoticias.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'periodicolosrios.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'lavozdevaldivia.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'arica365.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'mapuexpress.org': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'rengonotas.cl': 'sin sitemap (los 4 endpoints no devuelven locs)',
  'redvalparaiso.com': 'Prontus: sitemap_pags.xml plano de 1.001 locs SIN <lastmod> ni fecha en el path, y sin shards paginados (los sitemap_pags_YYYYMM.xml.gz dan 404). El sitemap_news.xml publica los <loc> de diariosenred.com, otro dominio',
  // Batch 26 (29-sep-2026): sondeados de las filas ⬜. Tres sitemaps entra al
  // catálogo (marketing4ecommerce, revistaecociencias, infosalmon) y estos
  // cuatro quedan descartados con el motivo verificado.
  "elnacional.com": "prensa venezolana (El Nacional, Caracas), fuera del alcance chileno; además sus <loc> apuntan a bitlysdowssl-aws.com, no al dominio propio",
  "riotimesonline.com": "The Rio Times: medio en inglés de Río de Janeiro (Brasil), no es prensa chilena",
  "forbeschile.com": "inaccesible desde esta red: robots.txt, sitemap.xml, sitemap_index.xml y wp-sitemap.xml dan fetch failed",
  "patagonia.cl": "es la tienda de ecommerce patagonia.com: su /sitemap.xml es un índice de sitemap_agentic_discovery y sitemap_products_*, sin artículos",
};

const NOMBRES_CATEGORIA = {
  news: 'Noticias nacionales',
  'news-international': 'Noticias internacionales',
  regional: 'Regional',
  government: 'Gobierno / instituciones',
  radio: 'Radio',
  'political-parties': 'Partidos políticos',
  business: 'Negocios / economía',
  community: 'Comunidad / sociedad civil',
  environment: 'Medio ambiente',
  education: 'Educación',
  health: 'Salud',
  culture: 'Cultura',
};

const REMOTE_BASE = 'https://raw.githubusercontent.com/Alplox/awesome-chilean-rss/main';
const REMOTE_DB_URL = `${REMOTE_BASE}/feeds-database.json`;
const REMOTE_WL_URL = `${REMOTE_BASE}/watchlist.json`;

function parseArgs(argv) {
  const out = { source: null, offline: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--source' && argv[i + 1]) out.source = argv[i + 1];
    if (argv[i] === '--out' && argv[i + 1]) out.out = argv[i + 1];
    if (argv[i] === '--offline') out.offline = true;
  }
  return out;
}

function loadJson(p) {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

async function fetchJsonRemote(url, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'gobierno-vault/watchlist' } });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

function norm(s = '') {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function dominio(url = '') {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '').toLowerCase();
  }
}

async function main() {
  const { source, offline, out = join(ROOT, 'TAREAS', 'tareas_sitemap.md') } = parseArgs(process.argv.slice(2));

  let db = null;
  let wl = null;
  let origen = '';

  // 1) Fuente explícita --source => solo local
  if (source) {
    db = loadJson(join(source, 'feeds-database.json'));
    wl = loadJson(join(source, 'watchlist.json'));
    origen = source;
    if (!db || !db.sites || !Array.isArray(wl)) {
      console.error('No se pudo leer feeds-database.json/watchlist.json en', source);
      console.error('Verifica --source <dir> (debe contener ambos JSON) o usa sin --source para descarga online.');
      process.exit(1);
    }
  } else if (offline) {
    const local = join(ROOT, '..', 'awesome-chilean-rss');
    db = loadJson(join(local, 'feeds-database.json'));
    wl = loadJson(join(local, 'watchlist.json'));
    origen = local;
    if (!db || !db.sites || !Array.isArray(wl)) {
      console.error('Modo --offline: no se pudo leer', local);
      console.error('Clona el repo: git clone --depth 1 https://github.com/Alplox/awesome-chilean-rss.git ../awesome-chilean-rss');
      process.exit(1);
    }
  } else {
    // 2) Por defecto: remoto online con fallback a clone hermano si existe
    try {
      console.log(`Descargando awesome-chilean-rss online...`);
      [db, wl] = await Promise.all([fetchJsonRemote(REMOTE_DB_URL), fetchJsonRemote(REMOTE_WL_URL)]);
      origen = REMOTE_BASE;
      console.log(`✔ remoto: ${db.sites?.length ?? '?'} sites + ${Array.isArray(wl) ? wl.length : '?'} watchlist`);
    } catch (e) {
      console.warn(`⚠ fallo remoto (${e.message}), intentando clone local hermano...`);
      const local = join(ROOT, '..', 'awesome-chilean-rss');
      db = loadJson(join(local, 'feeds-database.json'));
      wl = loadJson(join(local, 'watchlist.json'));
      origen = local;
      if (!db || !db.sites || !Array.isArray(wl)) {
        console.error('No se pudo leer feeds-database.json/watchlist.json ni remoto ni en', local);
        console.error('Opciones: (a) reintenta con red, (b) git clone --depth 1 https://github.com/Alplox/awesome-chilean-rss.git ../awesome-chilean-rss, (c) pnpm run sitemaps-watchlist -- --source <dir>');
        process.exit(1);
      }
      console.log(`✔ fallback local: ${local}`);
    }
  }

  // Medios ya sincronizados en el catálogo local (por dominio real derivado
  // de las URLs de sus JSONL, o del mapa de add-source.mjs).
  const manifest = loadJson(join(ROOT, 'sitemaps', '_manifest.json'));
  const catalogoDom = new Set();
  const catalogoSlugPorNombre = new Map(); // nombre normalizado -> { slug, articulos } (gana el de más artículos)
  const catalogoSlugs = new Map(); // dominio -> slug
  if (manifest?.medios) {
    for (const [slug, info] of Object.entries(manifest.medios)) {
      const key = norm(info.nombre || slug);
      const prev = catalogoSlugPorNombre.get(key);
      if (!prev || (info.articulos | 0) > prev.articulos) {
        catalogoSlugPorNombre.set(key, { slug, articulos: info.articulos | 0 });
      }
      // Dominio derivado de la primera URL del JSONL del medio.
      const dir = join(ROOT, 'sitemaps', slug);
      if (existsSync(dir)) {
        const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
        for (const f of files) {
          const line = readFileSync(join(dir, f), 'utf8').split('\n').find(Boolean);
          if (line) {
            try {
              const d = dominio(JSON.parse(line).u);
              if (d) {
                catalogoDom.add(d);
                catalogoSlugs.set(d, slug);
              }
              break;
            } catch { /* línea inválida */ }
          }
        }
      }
    }
  }
  // Refuerzo con los dominios de MEDIA (scripts/sitemaps/media.mjs): cubre
  // medios registrados cuyo JSONL aún no existe o falló el parseo anterior.
  // (Antes se parseaba el literal CATALOG_MEDIO_BY_DOMAIN de add-source.mjs;
  // ahora ese mapa también deriva de MEDIA, así que se usa la fuente.)
  for (const [slug, cfg] of Object.entries(MEDIA)) {
    for (const d of mediaHosts(cfg)) {
      const bare = d.replace(/^www\./, '');
      catalogoDom.add(bare);
      if (!catalogoSlugs.has(bare)) catalogoSlugs.set(bare, slug);
    }
  }

  // Medios usados en fuentes (campo `medio:` de src/content/sources/*.md)
  let mediosSources = new Set();
  {
    const sourcesDir = join(ROOT, 'src', 'content', 'sources');
    for (const f of readdirSync(sourcesDir).filter(f=>f.endsWith('.md'))) {
      const raw = readFileSync(join(sourcesDir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (m) {
        const d = YAML.parse(m[1]);
        if (d?.medio) mediosSources.add(norm(String(d.medio).replace(/^["']|["']$/g, '')));
      }
    }
    if (mediosSources.size===0) throw new Error('src/content/sources/*.md sin medios');
  }

  // Orgs de prensa (src/content/organizations/*.md)
  let doc;
  {
    const orgDir = join(ROOT, 'src', 'content', 'organizations');
    const orgs = {};
    for (const f of readdirSync(orgDir).filter(f=>f.endsWith('.md'))) {
      const raw = readFileSync(join(orgDir, f), 'utf8');
      const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (m) orgs[f.replace(/\.md$/,'')] = YAML.parse(m[1]);
    }
    if (!Object.keys(orgs).length) throw new Error('src/content/organizations/*.md vacío');
    doc = { organizations: orgs };
  }
  const orgsPrensa = new Map(); // nombre normalizado -> { nombre, url? }
  for (const org of Object.values(doc.organizations || {})) {
    const t = org.tipo || '';
    if (['medio_comunicacion', 'canal_television', 'programa_tv', 'programa_streaming', 'red_social'].includes(t)) {
      const n = norm(org.nombre);
      if (!orgsPrensa.has(n)) orgsPrensa.set(n, org);
    }
  }

  // Unir database + watchlist (dedupe por dominio), con procedencia.
  const sitios = new Map();
  const agregar = (s, fuente) => {
    const d = dominio(s.url);
    if (!d) return;
    if (!CATEGORIAS_PRENSA.has(s.category)) return;
    // La database se procesa primero y tiene prioridad sobre la watchlist
    // (feed verificado); las entradas de la watchlist con dominio duplicado se omiten.
    if (sitios.has(d)) return;
    sitios.set(d, {
      nombre: s.name, url: s.url, d, categoria: s.category,
      region: s.region || '', fuente, razon: s.reason || '',
      desc: s.description || '',
    });
  };
  for (const s of db.sites) agregar(s, 'db');
  for (const s of wl) agregar(s, 'wl');

  const filas = [...sitios.values()].map((s) => {
    const n = norm(s.nombre);
    let estado = 'pendiente';
    let detalle = '';
    // 1) ¿Ya sincronizado en el catálogo local? Solo por dominio real
    // (catalogoSlugs o el propio slug). El match solo-por-nombre NO marca ✅:
    // la fila es por dominio — ej. lasegunda.cl (muerto) vs lasegunda.com
    // catalogado. En ese caso se anota el slug como referencia.
    const slugCat = catalogoSlugs.get(s.d) || (catalogoDom.has(s.d) ? s.d : null);
    // Nota si el MEDIO tiene datos en catálogo bajo otro dominio (solo si el
    // slug trae artículos reales: un slug huérfano con 0 artículos no respalda nada).
    const alias = !slugCat ? catalogoSlugPorNombre.get(n) : null;
    const notaAlias = alias && alias.articulos > 0 ? `[medio en catálogo como ${alias.slug}]` : '';
    if (slugCat) {
      estado = 'catalogo';
      detalle = `sitemap en catálogo (${slugCat})`;
    } else if (SIN_SITEMAP[s.d]) {
      estado = 'sin_sitemap';
      detalle = SIN_SITEMAP[s.d];
    } else if (mediosSources.has(n) || orgsPrensa.has(n)) {
      // 2) ¿Ya referenciado en src/content/sources/*.md o como org de prensa?
      estado = 'en_uso';
      const org = orgsPrensa.get(n);
      detalle = mediosSources.has(n) ? 'referenciado en src/content/sources/*.md' : 'org de prensa en src/content/organizations/*.md';
      if (org && org.notas) {
        const m = String(org.notas).match(/https?:\/\/[a-z0-9.\-]+\.[a-z]{2,}/i);
        if (m) detalle += ` (${dominio(m[0])})`;
      }
    }
    if (notaAlias && estado !== 'catalogo') detalle = (detalle ? detalle + ' ' : '') + notaAlias;
    return { ...s, estado, detalle };
  });

  filas.sort((a, b) => a.categoria.localeCompare(b.categoria) || a.nombre.localeCompare(b.nombre));

  // Clave de SIN_SITEMAP que no corresponde a ninguna fila del repo fuente: casi
  // siempre es un error de dominio (se anotó el que se sondeó, no el de la fila —
  // p. ej. 'pensiones.cl' en vez de 'spensiones.cl'). No rompe nada, pero la fila
  // real queda ⬜ para siempre y el descarte se pierde. Se avisa, no se falla.
  const dominiosFila = new Set(filas.map((f) => f.d));
  const sinFila = Object.keys(SIN_SITEMAP).filter((d) => !dominiosFila.has(d));
  if (sinFila.length) {
    console.warn(
      `⚠️  SIN_SITEMAP: ${sinFila.length} clave(s) sin fila en el repo fuente: ${sinFila.join(', ')}`,
    );
  }

  const conteo = { catalogo: 0, en_uso: 0, sin_sitemap: 0, pendiente: 0 };
  for (const f of filas) conteo[f.estado]++;

  const EMOJI = { catalogo: '✅', en_uso: '🟡', sin_sitemap: '🔒', pendiente: '⬜' };
  const ESTADO_TXT = {
    catalogo: 'Sitemap ya sincronizado',
    en_uso: 'Ya usado en el vault (sin sitemap)',
    sin_sitemap: 'Verificado sin sitemap',
    pendiente: 'Pendiente de sincronizar',
  };

  let md = `# Tareas — Ampliación del catálogo de sitemaps

> Bitácora de sitios de prensa chilenos para sincronizar su sitemap al catálogo
> local (\`sitemaps/<medio>/\`) y así poder revisar eventos de gobiernos pasados
> con mayor variedad de puntos de vista al verificar datos.
>
> **Fuente de sitios:** [awesome-chilean-rss](https://github.com/Alplox/awesome-chilean-rss)
> — \`feeds-database.json\` (sitios con feeds verificados) y \`watchlist.json\`
> (candidatos, muchos sin feed RSS o con solo proxies de Google/Bing News).
> Este archivo se genera con \`pnpm run sitemaps-watchlist\` (online por defecto) o \`pnpm run sitemaps-watchlist -- --source <ruta-al-repo>\` / \`--offline\`.
>
> **Cómo usar:** cada fila pendiente (\`⬜\`) se sincroniza con
> \`pnpm run sitemaps-sync -- <slug>\` (tras agregar el medio a \`MEDIA\` en
> \`scripts/sitemaps/media.mjs\`) o se descarta si el sitio no tiene sitemap.
> Los sitios de la watchlist suelen no tener sitemap (solo RSS) — se marcan para
> intentar el sync y registrar el resultado.

## Resumen

- **Total de sitios de prensa listados:** ${filas.length}
- ✅ En catálogo local: **${conteo.catalogo}**
- 🟡 Ya usados en el vault (\`src/content/sources/*.md\` / \`organizations/*.md\`) sin sitemap: **${conteo.en_uso}**
- 🔒 Verificados sin sitemap: **${conteo.sin_sitemap}**
- ⬜ Pendientes de sincronizar: **${conteo.pendiente}**

Categorías consideradas (prensa y afines): ${Object.values(NOMBRES_CATEGORIA).join(', ')}.
Se excluyen: deportes, gaming, empleos, entretenimiento y tecnología.

## Sitios por categoría

`;

  let catActual = '';
  for (const f of filas) {
    if (f.categoria !== catActual) {
      catActual = f.categoria;
      // Línea en blanco entre la tabla de la categoría anterior y este encabezado:
      // sin ella markdownlint marca MD058 (tabla sin blancos) y MD022 (encabezado
      // pegado arriba) en cada frontera de categoría.
      if (!md.endsWith('\n\n')) md += '\n';
      md += `### ${NOMBRES_CATEGORIA[catActual] || catActual} (${f.categoria})\n\n`;
      md += `| Estado | Sitio | Web | Región | Fuente | Notas |\n| --- | --- | --- | --- | --- | --- |\n`;
    }
    const region = f.region ? f.region.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';
    const fuente = f.fuente === 'db' ? 'database' : 'watchlist';
    // Las notas son texto libre (motivos de SIN_SITEMAP y descripciones del repo
    // fuente) y redactan con `<lastmod>` y URLs sueltas: markdownlint lo marca como
    // MD033 (HTML inline) y MD034 (URL desnuda), así que se envuelven en backticks.
    // El lookbehind evita re-marcar lo ya envuelto y no parte dentro de una palabra.
    const limpiar = (s) =>
      String(s)
        .replace(/\|/g, '/')
        .replace(/[\r\n]+/g, ' ')
        .replace(/(?<![\w(`])<(\/?[a-zA-Z][^>]*)>/g, (m) => `\`${m}\``)
        .replace(/(?<![\w(`])https?:\/\/[^\s`]+/g, (m) => {
          // La puntuación final ("…sitemap.xml,") va FUERA del código.
          const url = m.replace(/[.,;:!?)\]]+$/, '');
          return url ? `\`${url}\`` + m.slice(url.length) : m;
        })
        .trim();
    // El veredicto de catálogo (detalle) manda sobre el estado del feed (razon):
    // es lo que la bitácora cruza (✅/🔒 y notas de alias van en detalle).
    const notas = limpiar((f.detalle || f.razon || f.desc || '').slice(0, 90));
    md += `| ${EMOJI[f.estado]} | **${limpiar(f.nombre)}** | \`${f.d}\` | ${region} | ${fuente} | ${notas} |\n`;
  }

  md += `\n## Leyenda\n\n- ✅ **En catálogo:** el sitemap del medio ya está sincronizado en \`sitemaps/<slug>/\`.\n- 🟡 **En uso:** el medio ya aparece como fuente en \`src/content/sources/*.md\` o como org de prensa en \`src/content/organizations/*.md\`, pero su sitemap aún no se sincroniza — prioridad para ampliar el catálogo.\n- 🔒 **Sin sitemap:** el sitio fue verificado y no expone sitemap; no reintentar.\n- ⬜ **Pendiente:** sitio de prensa sin sitemap en el catálogo ni referencia en el vault.\n\n## Instrucciones para agregar un medio nuevo\n\n1. Verificar el sitemap del sitio (robots.txt o \`/sitemap.xml\`).\n2. Agregar la entrada a \`MEDIA\` en \`scripts/sitemaps/media.mjs\` (slug, nombre, sitemaps, filtro).\n3. Sincronizar: \`pnpm run sitemaps-sync -- <slug>\`.\n4. Regenerar README/AGENTS: \`pnpm run sitemaps-index\`.\n5. Registrar la org de prensa en \`src/content/organizations/*.md\` si no existe (regla de wikilinks).\n6. Actualizar este archivo: \`pnpm run sitemaps-watchlist\` (o \`--source <ruta>\` / \`--offline\`).\n`;

  writeFileSync(out, md, 'utf8');
  console.log(`✔ ${filas.length} sitios de prensa → ${out} (origen: ${origen})`);
  console.log(`  catálogo: ${conteo.catalogo} | en uso: ${conteo.en_uso} | pendientes: ${conteo.pendiente}`);
}

// Guard: solo regenera TAREAS/tareas_sitemap.md si se corre directo. Importar el
// módulo (p. ej. desde scripts/probe-sitemap.mjs para leer SIN_SITEMAP) no debe
// disparar la descarga online de awesome-chilean-rss. Mismo patrón que
// add-source.mjs.
const isMain =
  process.argv[1] &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/').toLowerCase() ===
    process.argv[1].replace(/\\/g, '/').toLowerCase();

if (isMain) {
  main().catch(e => { console.error(e); process.exit(1); });
}
