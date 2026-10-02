# Tareas — Ampliación del catálogo de sitemaps

> Bitácora de sitios de prensa chilenos para sincronizar su sitemap al catálogo
> local (`sitemaps/<medio>/`) y así poder revisar eventos de gobiernos pasados
> con mayor variedad de puntos de vista al verificar datos.
>
> **Fuente de sitios:** [awesome-chilean-rss](<https://github.com/Alplox/awesome-chilean-rss>)
> — `feeds-database.json` (sitios con feeds verificados) y `watchlist.json`
> (candidatos, muchos sin feed RSS o con solo proxies de Google/Bing News).
> Este archivo se genera con `pnpm run sitemaps-watchlist` (online por defecto) o `pnpm run sitemaps-watchlist -- --source <ruta-al-repo>` / `--offline`.
>
> **Cómo usar:** cada fila pendiente (`⬜`) se sincroniza con
> `pnpm run sitemaps-sync -- <slug>` (tras agregar el medio a `MEDIA` en
> `scripts/sitemaps/media.mjs`) o se descarta si el sitio no tiene sitemap.
> Los sitios de la watchlist suelen no tener sitemap (solo RSS) — se marcan para
> intentar el sync y registrar el resultado.

## Resumen

- **Total de sitios de prensa listados:** 1001
- ✅ En catálogo local: **460**
- 🟡 Ya usados en el vault (`src/content/sources/*.md` / `organizations/*.md`) sin sitemap: **105**
- 🔒 Verificados sin sitemap: **326**
- ⬜ Pendientes de sincronizar: **110**

Categorías consideradas (prensa y afines): Noticias nacionales, Noticias internacionales, Regional, Gobierno / instituciones, Radio, Partidos políticos, Negocios / economía, Comunidad / sociedad civil, Medio ambiente, Educación, Salud, Cultura.
Se excluyen: deportes, gaming, empleos, entretenimiento y tecnología.

## Sitios por categoría

### Negocios / economía (business)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **(Empresa) Apex Pymes** | `apexpymes.cl` | — | watchlist | feed stale (último item: 2026-04-23, 144 días) |
| ✅ | **(Empresa) Contapapaya** | `contapapaya.cl` | — | database | sitemap en catálogo (contapapaya) |
| ✅ | **(Empresa) Herejía** | `herejia.cl` | — | watchlist | sitemap en catálogo (herejia) |
| ⬜ | **(Empresa) LionPro** | `lionpro.cl` | — | watchlist | feed stale (último item: 2026-04-06, 162 días) |
| ⬜ | **(Empresa) Logros Servicios Financieros** | `empresaslogros.cl` | — | database | Servicios financieros y contables, con artículos sobre finanzas y asesoría tributaria |
| ✅ | **(Empresa) Nexos Chile** | `nexos.cl` | — | database | sitemap en catálogo (nexos) |
| ✅ | **ABIF** | `abif.cl` | — | database | sitemap en catálogo (abif) |
| 🟡 | **Acero y Roca** | `aceroyroca.com` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **AmCham Chile** | `amchamchile.cl` | — | watchlist | sitemap en catálogo (amchamchile) |
| ⬜ | **América Economía** | `americaeconomia.com` | — | watchlist | sitio no responde |
| 🔒 | **Análisis.com** | `analisis.com` | — | database | urlset plano de 1.400 URLs de las que solo 586 son /articulo/YYYY-MM-DD-…, todas de 2026 ( |
| 🔒 | **AQUA** | `aqua.cl` | — | database | DNS ENOTFOUND (verificado) |
| ⬜ | **BancoEstado** | `bancoestado.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Cámara Chilena de la Construcción** | `cchc.cl` | — | watchlist | sitemap en catálogo (cchc) |
| ✅ | **Cámara de Comercio de Santiago** | `ccs.cl` | — | watchlist | sitemap en catálogo (ccs) |
| ✅ | **Chile País Minero** | `chilepaisminero.com` | — | database | sitemap en catálogo (chilepaisminero) |
| ✅ | **Chocale** | `chocale.cl` | — | database | sitemap en catálogo (chocale) |
| 🔒 | **CPC** | `cpc.cl` | — | database | robots.txt declara sitemap.xml y sitemap.rss, pero ambos responden 0 locs |
| 🟡 | **Diario Agrícola** | `diarioagricola.com` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Diario Estrategia** | `diarioestrategia.cl` | — | database | sitemap en catálogo (diarioestrategia) |
| ✅ | **Diario Financiero** | `df.cl` | — | database | sitemap en catálogo (df) |
| ⬜ | **Diario Pyme** | `diariopyme.com` | — | watchlist | sitio no responde |
| ⬜ | **Economía y Negocios** | `economiaynegocios.cl` | — | watchlist | sitio no responde |
| ✅ | **El Periódico de la Energía** | `elperiodicodelaenergia.com` | — | database | sitemap en catálogo (elperiodicodelaenergia) |
| ✅ | **Electrominería** | `electromineria.cl` | — | database | sitemap en catálogo (electromineria) |
| 🔒 | **Energía Estratégica** | `energiaestrategica.com` | — | watchlist | sin sitemap: robots.txt sin línea Sitemap y los 3 endpoints dan 404 o 0 locs |
| ⬜ | **Estrategia** | `estrategia.cl` | — | watchlist | sitio no responde |
| ✅ | **FISA** | `fisa.cl` | — | watchlist | sitemap en catálogo (fisa) |
| 🔒 | **Forbes Chile** | `forbeschile.com` | — | watchlist | inaccesible desde esta red: robots.txt, sitemap.xml, sitemap_index.xml y wp-sitemap.xml da |
| ⬜ | **Gerencia** | `gerencia.cl` | — | database | Feed principal de Gerencia |
| ⬜ | **ICARE** | `icare.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Instituto de la Construcción** | `iconstruccion.cl` | — | watchlist | sitemap en catálogo (iconstruccion) |
| ✅ | **Los Abogados Laborales** | `losabogadoslaborales.cl` | — | watchlist | sitemap en catálogo (losabogadoslaborales) |
| ✅ | **Marketing4eCommerce Chile** | `marketing4ecommerce.cl` | — | database | sitemap en catálogo (marketing4ecommerce) |
| 🔒 | **MCH (Mineria Chilena)** | `mch.cl` | — | database | fetch failed en sitemap/sitemap_index/wp-sitemap y robots.txt sin línea Sitemap |
| 🟡 | **Mundo Minería** | `mundomineria.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **NSS** | `nss.cl` | — | watchlist | urlset plano de 754 locs, casi todas páginas corporativas replicadas en 4 idiomas (en/zh/p |
| 🟡 | **Portal Agro Chile** | `portalagrochile.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Portal del Agro** | `portaldelagro.cl` | — | watchlist | sitio no responde |
| ✅ | **Portal Frutícola** | `portalfruticola.com` | — | database | sitemap en catálogo (portalfruticola) |
| ✅ | **Portal Minero** | `portalminero.com` | — | database | sitemap en catálogo (portalminero) |
| ✅ | **PortalPortuario** | `portalportuario.cl` | — | database | sitemap en catálogo (portalportuario) |
| 🔒 | **Prensa Digital** | `prensadigital.cl` | — | database | índice con 133 shards sitemap-posttype-post.YYYYMM.xml, pero TODOS son resultados de loter |
| ✅ | **Puerto a Puerto** | `puertoapuerto.cl` | Los Lagos | database | sitemap en catálogo (puertoapuerto) |
| ✅ | **pv magazine Latin America** | `pv-magazine-latam.com` | — | database | sitemap en catálogo (pvmagazine) |
| ⬜ | **RBC Asesores** | `rbcasesores.cl` | — | database | Feed principal de RBC Asesores |
| ✅ | **REDIMIN** | `redimin.cl` | — | database | sitemap en catálogo (redimin) |
| ✅ | **Reporte Agrícola** | `reporteagricola.cl` | — | watchlist | sitemap en catálogo (reporteagricola) |
| 🟡 | **Reporte Minero** | `reporteminero.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Revista Capital** | `capital.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Ruta 2050** | `ruta2050.cl` | — | database | sitemap en catálogo (ruta2050) |
| ⬜ | **SalmonExpert** | `salmonexpert.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **SOFOFA** | `sofofa.cl` | — | database | sitemap en catálogo (sofofa) |
| ⬜ | **Terminal Puerto Arica** | `portal.tpa.cl` | Arica Y Parinacota | watchlist | sitio no responde |
| 🔒 | **The Rio Times** | `riotimesonline.com` | — | database | The Rio Times: medio en inglés de Río de Janeiro (Brasil), no es prensa chilena |
| ⬜ | **TodoLicitaciones Chile** | `todolicitaciones.cl` | — | watchlist | sin feed RSS detectado |
| 🔒 | **VC Magazine** | `vcmagazine.cl` | Los Lagos | database | su sitemap_index declara 9 entradas, pero el único post-sitemap.xml devuelve 0 locs |

### Comunidad / sociedad civil (community)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| 🔒 | **Aldeas Infantiles SOS Chile** | `aldeasinfantiles.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **Anda** | `anda.cl` | — | database | sitemap en catálogo (anda) |
| ✅ | **ANEF** | `anef.cl` | — | database | sitemap en catálogo (anef) |
| 🔒 | **Atención Chilena** | `atencionchilena.cl` | — | watchlist | su sitemap_index.xml declara una sola entrada: page-sitemap.xml |
| ⬜ | **Bomberos de Chile** | `bomberos.cl` | — | watchlist | sitio no responde |
| ✅ | **Capa9** | `capa9.net` | — | database | sitemap en catálogo (capa9) |
| ✅ | **Chile Travel** | `chile.travel` | — | database | sitemap en catálogo (chiletravel) |
| ⬜ | **ChileMujeres** | `chilemujeres.cl` | — | database | Feed principal de ChileMujeres |
| ✅ | **Coaniquem** | `coaniquem.cl` | — | database | sitemap en catálogo (coaniquem) |
| 🔒 | **CODEPU** | `codepu.cl` | — | database | sin sitemap: robots.txt 404 y los 3 endpoints estándar (sitemap, sitemap_index, wp-sitemap |
| ✅ | **ComunidadMujer** | `comunidadmujer.cl` | — | database | sitemap en catálogo (comunidadmujer) |
| 🟡 | **Conadecus** | `conadecus.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Corporación La Morada** | `lamorada.cl` | — | watchlist | sitemap en catálogo (lamorada) |
| ✅ | **Cuerpo de Bomberos de Santiago** | `cbs.cl` | Metropolitana | database | sitemap en catálogo (cbs) |
| ⬜ | **Cupones Chile** | `cuponeschile.cl` | — | watchlist | feed stale (último item: 2025-12-02, 286 días) |
| 🔒 | **CUT (Central Unitaria de Trabajadores de Chile)** | `cut.cl` | — | database | sin sitemap: robots.txt sin línea Sitemap y los 3 endpoints estándar dan 404 |
| ✅ | **Defensa Civil de Chile** | `defensacivil.cl` | — | database | sitemap en catálogo (defensacivil) |
| ⬜ | **Diario El Itihue** | `diarioelitihue.blogspot.com` | — | database | Blog chileno de noticias comunitarias y crónica social |
| ✅ | **Diario Mapuche** | `mapuchediario.cl` | Araucania | database | sitemap en catálogo (mapuchediario) |
| 🟡 | **FASIC** | `fasic.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Federación CCU** | `federacionccu.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Fonotel** | `fonotel.cl` | — | database | Guía telefónica y directorio de servicios de Chile |
| ⬜ | **Fundación Chile** | `fch.cl` | — | watchlist | feed stale (último item: 2026-03-13, 185 días) |
| ✅ | **Fundación Iguales** | `iguales.cl` | — | database | sitemap en catálogo (iguales) |
| ⬜ | **Fundación Las Rosas** | `lasrosas.cl` | — | watchlist | feed stale (último item: 2020-01-22, 2428 días) |
| ⬜ | **Fundación Paréntesis** | `fundacionparentesis.cl` | — | watchlist | sitio no responde |
| 🔒 | **Fundación Superación de la Pobreza** | `fundacionpobreza.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde) |
| ✅ | **Guía Turismo Chile** | `guiaturismo.cl` | — | database | sitemap en catálogo (guiaturismo) |
| ✅ | **Hogar de Cristo** | `hogardecristo.cl` | — | database | sitemap en catálogo (hogardecristo) |
| 🔒 | **Iglesia.cl** | `iglesia.cl` | — | watchlist | urlset plano de 6 locs (home + noticias.php), sin artículos |
| 🔒 | **Los Angeles** | `losangeles.cl` | Biobio | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ⬜ | **Mapuche Info** | `mapuche.info` | — | watchlist | feed stale (último item: 2024-08-10, 765 días) |
| ⬜ | **Mapuche NL** | `mapuche.nl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Mastodon Chile** | `mastodon.cl` | — | database | Instancia(s) chilena(s) de Mastodon (red social descentralizada) |
| ⬜ | **Mi Voz** | `comercial.mivoz.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **MUMS** | `mums.cl` | — | database | Movimiento por la Diversidad Sexual en Chile |
| ⬜ | **Observatorio Ciudadano** | `observatorio.cl` | — | database | Organización de derechos humanos y medio ambiente |
| ✅ | **Observatorio de Gobernanza Migratoria y DDHH** | `ogmdh-chile.org` | — | database | sitemap en catálogo (ogmdh) |
| ⬜ | **ODECU** | `odecu.cl` | — | database | Organización chilena de consumidores que trabaja en la defensa de los derechos de las pers |
| ✅ | **Prensa Eventos** | `prensaeventos.cl` | — | database | sitemap en catálogo (prensaeventos) |
| ⬜ | **Reddit** | `reddit.com` | — | database | Reddit feeds from various chilean subreddits |
| ⬜ | **Supervivencia y Desastres** | `supervivencia-y-desastres.cl` | — | database | Blog chileno de preparación ante emergencias y supervivencia |
| ⬜ | **TECHO Chile** | `cl.techo.org` | — | database | TECHO, organización que trabaja con comunidades en situación de pobreza en Chile |
| ⬜ | **Teletón Chile** | `teleton.cl` | — | watchlist | HTTP error (403) |
| ⬜ | **Triunfo** | `triunfo.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Turismo en Chile** | `turismoenchile.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Turismochile.cl (Beta)** | `beta.turismochile.cl` | — | watchlist | sitio no responde |
| ⬜ | **UNICEF Chile** | `unicef.org` | — | watchlist | HTTP error (403) |
| 🟡 | **Vicaría de la Solidaridad** | `vicariadelasolidaridad.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **XOX cl - Recursos e información para emprendedores** | `xox.cl` | — | watchlist | sitemap en catálogo (xox) |

### Cultura (culture)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **50 años del Golpe de Estado** | `50.cultura.gob.cl` | — | watchlist | feed stale (último item: 2024-09-10, 734 días) |
| ⬜ | **Balmaceda Arte Joven** | `balmacedartejoven.cl` | — | database | Fundación de formación artística juvenil con sedes en varias regiones |
| 🔒 | **Biblioteca Nacional de Chile** | `bibliotecanacional.gob.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ⬜ | **CaballoyRodeo** | `caballoyrodeo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Centro Cultural La Moneda** | `cclm.cl` | — | database | sitemap en catálogo (cclm) |
| 🔒 | **Centro GAM** | `gam.cl` | — | watchlist | su robots declara /sitemap.xml, que responde HTTP 500; los otros endpoints dan 404 |
| ⬜ | **Chile Cultura** | `chilecultura.gob.cl` | — | database | Plataforma del Ministerio de las Culturas, las Artes y el Patrimonio |
| ✅ | **Chile es Tuyo** | `chileestuyo.cl` | — | database | sitemap en catálogo (chileestuyo) |
| ⬜ | **CineChile** | `cinechile.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Disorder** | `disorder.cl` | — | watchlist | sitemap en catálogo (disorder) |
| 🔒 | **Editorial Quimantú** | `quimantu.cl` | — | database | índice de 4 CPTs sin archivo periodístico: 61 "noticias" (incluida la página de listado) y |
| ✅ | **Espacio Regional** | `espacioregional.cl` | Valparaiso | database | sitemap en catálogo (espacioregional) |
| ⬜ | **Fondos Cultura** | `fondosdecultura.cl` | — | database | Sitio de fondos concursables del Ministerio de las Culturas, las Artes y el Patrimonio de |
| ⬜ | **Fundación Cultural de Providencia** | `culturaprovidencia.cl` | — | database | Corporación cultural de la comuna de Providencia, Santiago |
| 🔒 | **Fundación Teatro a Mil** | `teatroamil.cl` | — | watchlist | urlset plano de 287 locs, casi todas páginas institucionales (/quienes-somos/…) sin fecha |
| ✅ | **La Tendencia** | `latendencia.cl` | — | database | sitemap en catálogo (latendencia) |
| 🟡 | **Londres 38** | `londres38.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **Memoria Chilena** | `memoriachilena.gob.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Mestizos Magazine** | `mestizos.cl` | — | database | sitemap en catálogo (mestizos) |
| ⬜ | **Museo de Arte Contemporáneo** | `mac.uchile.cl` | — | database | Museo de Arte Contemporáneo de la Universidad de Chile |
| 🔒 | **Museo de la Memoria** | `museodelamemoria.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Museo Nacional de Bellas Artes** | `mnba.gob.cl` | — | watchlist | /sitemap.xml es un urlset de 1 loc (google-news-xml); los otros endpoints dan 404 |
| ✅ | **Museo Violeta Parra** | `museovioletaparra.cl` | — | database | sitemap en catálogo (museovioletaparra) |
| 🔒 | **MusicaPopular.cl** | `musicapopular.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| ⬜ | **Revista Ckuri** | `revistackuri.cl` | Antofagasta | database | Revista digital bimensual sobre artes, culturas, patrimonio y turismo cultural de la Regió |
| ✅ | **Revista Nos** | `revistanos.cl` | Biobio | database | sitemap en catálogo (revistanos) |
| ⬜ | **Teatro Municipal de Santiago** | `municipal.cl` | — | watchlist | feed stale (último item: 2022-07-21, 1516 días) |
| ⬜ | **Tell Magazine** | `tell.cl` | Antofagasta | database | Revista digital de Antofagasta sobre sociedad, cultura, eventos y estilo de vida. |
| 🟡 | **Unnie Pop** | `unniepop.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Villa Grimaldi** | `villagrimaldi.cl` | — | database | robots.txt 404 y los 3 endpoints estándar devuelven 404 |

### Educación (education)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ✅ | **Actualidad UDLA** | `actualidad.udla.cl` | — | database | sitemap en catálogo (actualidadudla) |
| 🔒 | **ANID** | `anid.cl` | — | database | urlset plano de 388 locs, casi todas páginas institucionales (conoce-anid, etc.), sin artí |
| ⬜ | **Ayuda Mineduc** | `ayudamineduc.cl` | — | watchlist | feed stale (último item: 2021-10-25, 1785 días) |
| ✅ | **CEP Chile** | `cepchile.cl` | — | database | sitemap en catálogo (cepchile) |
| 🟡 | **CLAPES UC** | `clapesuc.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Colegio Alemán de Santiago** | `dsstgo.cl` | — | database | sitemap en catálogo (dsstgo) |
| ⬜ | **Colegio Atenea** | `colegioatenea.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Colegio Cordillera** | `colegiocordillera.cl` | — | database | sitemap en catálogo (colegiocordillera) |
| ✅ | **Colegio de Profesores** | `colegiodeprofesores.cl` | — | database | sitemap en catálogo (colegiodeprofesores) |
| ✅ | **Colegio San Ignacio El Bosque** | `sanignacio.cl` | — | database | sitemap en catálogo (sanignacio) |
| ✅ | **Colegio Tabancura** | `tabancura.cl` | — | database | sitemap en catálogo (tabancura) |
| ⬜ | **Colegio Verbo Divino** | `verbodivino.cl` | — | database | Colegio privado de Santiago |
| ⬜ | **Comunidad Escolar** | `comunidadescolar.cl` | — | database | Portal de noticias del sistema escolar chileno, dirigido a sostenedores y comunidades educ |
| 🔒 | **CONICYT** | `conicyt.cl` | — | database | su robots declara `http://www.conicyt.cl/sitemap.xml`, que devuelve 404; los otros endpoints |
| ⬜ | **DaemsPP** | `daemspp.cl` | — | database | Feed principal de DaemsPP |
| ✅ | **Diario UACh** | `diario.uach.cl` | — | database | sitemap en catálogo (diario_uach) |
| ✅ | **Dirección de Educación Pública** | `dep.gob.cl` | — | database | sitemap en catálogo (dep) |
| ✅ | **Espacio Público** | `espaciopublico.cl` | — | database | sitemap en catálogo (espaciopublico) |
| ✅ | **Explora** | `explora.cl` | — | database | sitemap en catálogo (explora) |
| ⬜ | **FLACSO Chile** | `flacsochile.org` | — | database | Institución académica dedicada a la investigación, formación y análisis de temas sociales, |
| ⬜ | **Instituto Nacional** | `institutonacional.cl` | — | database | Liceo público de Santiago |
| ✅ | **JUNJI** | `junji.cl` | — | database | sitemap en catálogo (junji) |
| ⬜ | **Kdoce** | `kdoce.cl` | — | database | Portal de noticias de educación, innovación y tecnología educativa en Chile |
| ✅ | **Libertad y Desarrollo** | `lyd.org` | — | database | sitemap en catálogo (lyd) |
| ⬜ | **Liceo Brainstorm Temuco** | `liceobrainstorm.cl` | — | database | Liceo particular de Temuco |
| ✅ | **Liceo de Aplicación** | `liceodeaplicacion.cl` | — | database | sitemap en catálogo (liceodeaplicacion) |
| ⬜ | **Liceo N°1 Javiera Carrera** | `liceo1.cl` | — | database | Liceo público de Santiago |
| ✅ | **Noticias de la Universidad del Bío-Bío** | `noticias.ubiobio.cl` | Biobio | database | sitemap en catálogo (noticiasubiobio) |
| 🟡 | **Observatorio de Datos UAI** | `observatoriodedatos.uai.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Portal Educa** | `portaleduca.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Profesor en línea** | `profesorenlinea.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **PUC (Pontificia Universidad Católica)** | `uc.cl` | — | database | Noticias e investigación de la PUC |
| ✅ | **PUCV** | `pucv.cl` | — | watchlist | sitemap en catálogo (pucv) |
| ⬜ | **Red Educacional Crecemos** | `redcrecemos.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Repositorio Académico de la Universidad de Chile** | `repositorio.uchile.cl` | — | database | Repositorio institucional que preserva y distribuye publicaciones académicas de la Univers |
| ⬜ | **Revista de Sociología** | `revistadesociologia.uchile.cl` | — | watchlist | sitio no responde |
| ⬜ | **Revista Signos. Estudios de Lingüística** | `revistasignos.cl` | — | watchlist | feed stale (último item: 2026-08-14, 32 días) |
| ✅ | **Saint George's College** | `saintgeorge.cl` | — | watchlist | sitemap en catálogo (saintgeorge) |
| ✅ | **SIP Red de Colegios** | `sip.cl` | — | database | sitemap en catálogo (sip) |
| ⬜ | **Sistema de Admisión Escolar** | `sistemadeadmisionescolar.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **SLEP Licancabur** | `sleplicancabur.cl` | Antofagasta | database | Servicio Local de Educación Pública que administra establecimientos de Calama, Ollagüe, Sa |
| ⬜ | **SLEP Tamarugal** | `sleptamarugal.gob.cl` | Tarapaca | database | Servicio Local de Educación Pública que administra 45 establecimientos de cinco comunas de |
| ✅ | **The Grange School** | `grange.cl` | — | database | sitemap en catálogo (grange) |
| ⬜ | **U. del Bío-Bío** | `ubiobio.cl` | — | watchlist | sitio no responde |
| ⬜ | **UACh** | `uach.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **UCSC** | `ucsc.cl` | — | watchlist | sitemap en catálogo (ucsc) |
| ⬜ | **Universia Chile** | `noticias.universia.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Universidad Adolfo Ibáñez** | `uai.cl` | — | watchlist | sitemap en catálogo (uai) |
| ✅ | **Universidad Andrés Bello** | `unab.cl` | — | database | sitemap en catálogo (unab) |
| ✅ | **Universidad Autónoma de Chile** | `uautonoma.cl` | — | watchlist | sitemap en catálogo (uautonoma) |
| ✅ | **Universidad Católica del Norte** | `ucn.cl` | — | watchlist | sitemap en catálogo (ucn) |
| ⬜ | **Universidad de Antofagasta** | `uantof.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Universidad de Chile** | `uchile.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Universidad de Concepción** | `noticias.udec.cl` | — | database | sitemap en catálogo (udec) |
| 🔒 | **Universidad de La Frontera** | `ufro.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Universidad de Las Américas** | `udla.cl` | — | watchlist | sitemap en catálogo (udla) |
| ✅ | **Universidad de Los Lagos** | `ulagos.cl` | — | database | sitemap en catálogo (ulagos) |
| 🔒 | **Universidad de Talca** | `utalca.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ⬜ | **Universidad de Valparaíso** | `uv.cl` | — | watchlist | sin feed RSS detectado |
| 🔒 | **Universidad Diego Portales** | `udp.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Universidad Mayor** | `umayor.cl` | — | watchlist | sitemap en catálogo (umayor) |
| ⬜ | **Universidad San Sebastián** | `uss.cl` | — | watchlist | feed stale (último item: 2023-05-10, 1223 días) |
| ✅ | **Universidad Técnica Federico Santa María** | `usm.cl` | — | database | sitemap en catálogo (usm) |
| ⬜ | **USACH** | `usach.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **UTE USACH Noticias** | `corporacionuteusach-noticias.cl` | — | database | sitemap en catálogo (uteusach) |
| ✅ | **Vergara 240** | `vergara240.udp.cl` | — | database | sitemap en catálogo (vergara240) |
| ⬜ | **VRIIC USACH** | `vriic.usach.cl` | — | database | Vicerrectoría de Investigación, Innovación y Creación de la USACH; difunde investigación, |

### Medio ambiente (environment)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **Acción Climática** | `accionclimatica.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **ACERA** | `acera.cl` | — | watchlist | sitemap en catálogo (acera) |
| ⬜ | **Aguas Andinas** | `aguasandinas.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Chile Sustentable** | `chilesustentable.net` | — | watchlist | sin feed RSS detectado |
| 🔒 | **CODEFF** | `codeff.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🟡 | **Codex Verde** | `codexverde.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Conservación Patagónica** | `conservacionpatagonica.org` | — | watchlist | sitio no responde |
| ✅ | **CR2 - Centro de Ciencia del Clima y la Resiliencia** | `cr2.cl` | — | database | sitemap en catálogo (cr2) |
| ⬜ | **Diario Sustentable** | `dsustentable.cl` | — | database | Medio chileno de noticias sobre sustentabilidad |
| ✅ | **ECOceanos** | `ecoceanos.cl` | — | database | sitemap en catálogo (ecoceanos) |
| ✅ | **Ecosistemas** | `ecosistemas.cl` | — | database | sitemap en catálogo (ecosistemas) |
| ✅ | **FIMA (Fiscalía del Medio Ambiente)** | `fima.cl` | — | database | sitemap en catálogo (fima) |
| ⬜ | **Fundación Adapta** | `adapta.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Fundación Legado Chile** | `legadochile.cl` | — | database | sitemap en catálogo (legadochile) |
| ⬜ | **Fundación Reforestemos** | `reforestemos.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Fundación Rewilding Chile** | `rewildingchile.org` | — | database | sitemap en catálogo (rewildingchile) |
| ✅ | **Fundación Terram** | `terram.cl` | — | database | sitemap en catálogo (terram) |
| ✅ | **Generadoras de Chile** | `generadoras.cl` | — | database | sitemap en catálogo (generadoras) |
| ⬜ | **Greenpeace Chile** | `greenpeace.org` | — | database | Greenpeace Chile, organización ambientalista con campañas locales en Chile |
| 🔒 | **Induambiente** | `induambiente.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| ✅ | **InfoSalmon** | `infosalmon.cl` | — | database | sitemap en catálogo (infosalmon) |
| 🔒 | **Instituto Antártico Chileno** | `inach.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ⬜ | **Instituto de Ecología y Biodiversidad** | `ie-b.cl` | — | watchlist | sitio no responde |
| ⬜ | **Ladera Sur** | `laderasur.com` | — | database | Medio de comunicación y multiplataforma sobre naturaleza, conservación, medio ambiente, ci |
| 🔒 | **Meteored Chile** | `meteored.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Oceana Chile** | `oceana.org` | — | watchlist | sitemap en catálogo (oceana) |
| 🟡 | **OLCA** | `olca.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Patagonia.cl** | `patagonia.cl` | — | watchlist | es la tienda de ecommerce patagonia.com: su /sitemap.xml es un índice de sitemap_agentic_d |
| ✅ | **Revista Ecociencias** | `revistaecociencias.cl` | — | database | sitemap en catálogo (revistaecociencias) |
| ⬜ | **Semillas de Agua** | `semillasdeagua.cl` | — | watchlist | feed stale (último item: 2015-10-18, 3984 días) |
| ⬜ | **Sostenibilidad UNAB** | `sostenibilidad.unab.cl` | — | database | Portal institucional de la UNAB sobre sostenibilidad, gestión ambiental y carbono neutrali |
| ⬜ | **Superintendencia del Medio Ambiente** | `portal.sma.gob.cl` | — | database | Organismo nacional que publica fiscalizaciones, sanciones, proyectos, permisos y medidas a |
| 🔒 | **Tierra Adentro** | `tierraadentro.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ⬜ | **WCS Chile** | `chile.wcs.org` | — | watchlist | sin feed RSS detectado |
| ✅ | **WWF Chile** | `wwf.cl` | — | watchlist | sitemap en catálogo (wwf) |

### Gobierno / instituciones (government)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| 🔒 | **Ammot** | `ammot.cl` | — | watchlist | wp-sitemap con un único shard de 9 posts, varios con slug opaco (937-2, 954-2): reevaluar |
| ✅ | **ANCI** | `anci.gob.cl` | — | watchlist | sitemap en catálogo (anci) |
| ✅ | **ANEPE** | `anepe.cl` | — | watchlist | sitemap en catálogo (anepe) |
| ✅ | **ANIP** | `funcionariopublico.cl` | — | watchlist | sitemap en catálogo (funcionariopublico) |
| 🟡 | **Banco Central de Chile** | `bcentral.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Biblioteca del Congreso Nacional (BCN)** | `bcn.cl` | — | database | sitemap de portal con ~70k sub-sitemaps (normas LeyChile, no prensa) — no catalogable |
| 🔒 | **Cámara de Diputadas y Diputados** | `camara.cl` | — | watchlist | bloquea el rastreo: robots.txt responde HTTP 403 y los 3 endpoints estándar también 403 |
| 🔒 | **Chile** | `chile.gob.cl` | — | watchlist | su robots declara `http://www.chile.gob.cl/chile/sitemap_pags.xml`, que devuelve 404; los |
| 🟡 | **ChileAtiende** | `chileatiende.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **ChileCompra** | `chilecompra.cl` | — | database | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **Comisión Nacional de Energía** | `cne.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **CONAF** | `conaf.cl` | — | database | sitemap en catálogo (conaf) |
| ✅ | **Consejo para la Transparencia** | `consejotransparencia.cl` | — | database | sitemap en catálogo (consejotransparencia) |
| 🔒 | **Contraloría General** | `contraloria.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **CORFO** | `corfo.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt sin línea Sitemap) |
| ✅ | **Defensoría de la Niñez** | `defensorianinez.cl` | — | database | sitemap en catálogo (defensorianinez) |
| 🔒 | **Delegación Presidencial Regional La Araucanía** | `dprlaaraucania.dpr.gob.cl` | Araucania | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🟡 | **Diario Constitucional** | `diarioconstitucional.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Diario Oficial** | `diariooficial.interior.gob.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| ✅ | **DICREP** | `dicrep.gob.cl` | — | database | sitemap en catálogo (dicrep) |
| 🔒 | **Dirección de Presupuestos** | `dpp.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| ✅ | **Dirección de Vialidad** | `vialidad.mop.gob.cl` | — | database | sitemap en catálogo (vialidad) |
| 🔒 | **Dirección del Trabajo** | `dt.gob.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **EFE** | `efe.cl` | — | database | verificado sin sitemap (solo RSS /feed/) |
| 🔒 | **Fiscalía de Chile** | `fiscaliadechile.cl` | — | database | verificado sin sitemap (Drupal 10 sin xmlsitemap) |
| ✅ | **Gobierno de Chile** | `gob.cl` | — | database | sitemap en catálogo (gob) |
| 🔒 | **Gobierno en Terreno** | `gobiernoenterreno.interior.gob.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **Gobierno Regional de Tarapacá** | `goretarapaca.gov.cl` | — | database | sitemap en catálogo (goretarapaca) |
| ✅ | **Gobierno Regional Metropolitano de Santiago** | `gobiernosantiago.cl` | — | database | sitemap en catálogo (gobiernosantiago) |
| 🔒 | **Ilustre Municipalidad de Santiago** | `munistgo.cl` | — | database | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **INE** | `ine.gob.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Instituto de Salud Pública** | `ispch.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **MarcaChile** | `marcachile.cl` | — | database | post-sitemap.xml con 1.667 artículos, pero el `<lastmod>` es una migración de feb-2025 (1.04 |
| 🔒 | **MercadoPublico** | `mercadopublico.cl` | — | database | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Metro de Santiago** | `metro.cl` | — | watchlist | urlset plano de 66 locs, todas páginas de servicio (planificador, estado-red, estaciones, |
| 🔒 | **Ministerio de Agricultura** | `minagri.gob.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Ministerio de Bienes Nacionales** | `bienesnacionales.cl` | — | database | sitemap en catálogo (bienesnacionales) |
| 🟡 | **Ministerio de Ciencia, Tecnología, Conocimiento e Innovación** | `minciencia.gob.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **Ministerio de Desarrollo Social y Familia** | `desarrollosocialyfamilia.gob.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Ministerio de Economía, Fomento y Turismo** | `economia.gob.cl` | — | database | sitemap en catálogo (economia) |
| 🟡 | **Ministerio de Educación** | `mineduc.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Ministerio de Energía** | `energia.gob.cl` | — | watchlist | /sitemap.xml devuelve 404 y sitemap_index.xml + wp-sitemap.xml devuelven 0 locs |
| 🟡 | **Ministerio de Hacienda** | `hacienda.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Ministerio de Justicia y Derechos Humanos** | `minjusticia.gob.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Ministerio de la Mujer y la Equidad de Género** | `minmujeryeg.gob.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **Ministerio de las Culturas, las Artes y el Patrimonio** | `cultura.gob.cl` | — | database | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| 🔒 | **Ministerio de Minería** | `minmineria.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Ministerio de Obras Públicas** | `mop.gob.cl` | — | database | sitemap en catálogo (mop) |
| ✅ | **Ministerio de Relaciones Exteriores** | `minrel.gob.cl` | — | watchlist | sitemap en catálogo (minrel) |
| 🟡 | **Ministerio de Salud** | `minsal.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Ministerio de Transportes y Telecomunicaciones** | `mtt.gob.cl` | — | database | sitemap en catálogo (mtt) |
| ✅ | **Ministerio de Vivienda y Urbanismo** | `minvu.gob.cl` | — | watchlist | sitemap en catálogo (minvu) |
| 🟡 | **Ministerio del Deporte** | `mindep.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **Ministerio del Interior** | `interior.gob.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Ministerio del Medio Ambiente** | `mma.gob.cl` | — | database | sitemap en catálogo (mma) |
| ✅ | **Ministerio del Trabajo y Previsión Social** | `mintrab.gob.cl` | — | database | sitemap en catálogo (mintrab) |
| 🟡 | **Ministerio Secretaría General de Gobierno** | `msgg.gob.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **Ministerio Secretaría General de la Presidencia** | `minsegpres.gob.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Municipalidad de Alto Biobío** | `munialtobiobio.cl` | — | watchlist | sitemap en catálogo (munialtobiobio) |
| 🔒 | **Municipalidad de Arica** | `muniarica.cl` | Arica Y Parinacota | watchlist | su robots declara /sitemap.xml, que responde HTTP 500; sitemap_index.xml y wp-sitemap.xml |
| 🔒 | **Municipalidad de Providencia** | `providencia.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🟡 | **Municipalidad de Puerto Montt** | `puertomontt.cl` | Los Lagos | database | referenciado en src/content/sources/*.md |
| ✅ | **Municipalidad de Traiguén** | `mtraiguen.cl` | Araucania | watchlist | sitemap en catálogo (mtraiguen) |
| 🔒 | **Municipalidad de Viña del Mar** | `munivina.cl` | — | database | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Poder Judicial** | `pjud.cl` | — | watchlist | verificado sin sitemap (robots.txt 404) |
| 🟡 | **Prensa Presidencia** | `prensa.presidencia.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **ProChile** | `prochile.gob.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **Publilegales** | `publilegales.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Radio Cámara** | `radiocamara.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **SEA Chile** | `sea.gob.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **SENADIS** | `senadis.gob.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| ✅ | **Senado** | `senado.cl` | — | watchlist | sitemap en catálogo (senado) |
| ✅ | **SENAPRED** | `senapred.cl` | — | watchlist | sitemap en catálogo (senapred) |
| 🔒 | **SENCE** | `sence.gob.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **SENDA** | `senda.gob.cl` | — | watchlist | sitemap en catálogo (senda) |
| 🔒 | **SERNAC** | `sernac.cl` | — | watchlist | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **SERNATUR (Servicio Nacional de Turismo)** | `sernatur.cl` | — | database | sitemap en catálogo (sernatur) |
| 🔒 | **Servicio Agrícola y Ganadero** | `sag.gob.cl` | — | database | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Servicio de Impuestos Internos** | `sii.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Servicio Hidrográfico y Oceanográfico de la Armada (SHOA)** | `shoa.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Servicio Hidrográfico y Oceanográfico de la Armada de Chile** | `snamchile.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Servicio Nacional de Aduanas** | `aduana.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **Servicio Nacional de Migraciones** | `serviciomigraciones.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **SP (Superintendencia de Pensiones)** | `spensiones.cl` | — | watchlist | alias: el sitio real es pensiones.cl (su sitemap declara post-sitemap1.xml), con solo 4 lo |
| 🔒 | **Subsecretaría de Turismo** | `subturismo.gob.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Subsecretaría del Trabajo** | `subtrab.gob.cl` | — | database | sitemap en catálogo (subtrab) |
| ✅ | **SUBTEL (Subsecretaría de Telecomunicaciones)** | `subtel.gob.cl` | — | database | sitemap en catálogo (subtel) |
| 🔒 | **Superintendencia de Salud** | `supersalud.gob.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🟡 | **SUSESO (Superintendencia de Seguridad Social)** | `suseso.gob.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **Tesorería General de la República** | `tgr.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Transparencia Activa Presidencia** | `transparenciaactiva.presidencia.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **Veredictum** | `veredictum.cl` | — | database | referenciado en src/content/sources/*.md |

### Salud (health)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **ANAMED** | `anamed.cl` | — | watchlist | sitio no responde |
| ✅ | **CENABAST** | `cenabast.cl` | — | database | sitemap en catálogo (cenabast) |
| ✅ | **CIPS - Centro de Políticas Públicas e Innovación en Salud** | `gobierno.udd.cl` | — | database | sitemap en catálogo (gobiernoudd) |
| ⬜ | **Clínica Alemana** | `alemana.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Clínica Alemana Temuco** | `clinicaalemanatemuco.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Clínica Las Condes** | `clinicalascondes.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Colegio de Enfermeras de Chile** | `colegiodeenfermeras.cl` | — | watchlist | sitemap en catálogo (colegiodeenfermeras) |
| ✅ | **Colegio Médico de Chile** | `colegiomedico.cl` | — | database | sitemap en catálogo (colegiomedico) |
| ✅ | **Cruz Roja Chilena** | `cruzroja.cl` | — | database | sitemap en catálogo (cruzroja) |
| ⬜ | **Escuela de Salud Pública U. de Chile** | `escuela.medicina.uchile.cl` | — | watchlist | sitio no responde |
| ✅ | **Fonasa** | `fonasa.cl` | — | database | sitemap en catálogo (fonasa) |
| ⬜ | **Fundación Gabriel** | `fundaciongabriel.cl` | — | watchlist | sitio no responde |
| ⬜ | **Fundación IPSUSS** | `ipsuss.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Fundación Nuestros Hijos** | `fnch.cl` | — | watchlist | sitio no responde |
| ⬜ | **Hospital Clínico U. de Chile** | `hospitalclinico.uchile.cl` | — | watchlist | sitio no responde |
| ⬜ | **Hospital Clínico UFRO** | `hospitalclinicoufro.cl` | — | watchlist | sitio no responde |
| ⬜ | **Hospital Digital** | `hospitaldigital.minsal.cl` | — | watchlist | sitio no responde |
| ✅ | **Instituto de Seguridad Laboral** | `isl.gob.cl` | — | database | sitemap en catálogo (isl) |
| 🔒 | **Instituto Nacional del Tórax** | `torax.cl` | — | watchlist | wp-sitemap con un único shard de 9 artículos: reevaluar si crece |
| 🔒 | **Medwave** | `medwave.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Observatorio de Salud Pública UC** | `observatorio.medicina.uc.cl` | — | watchlist | sitemap en catálogo (observatoriomedicina) |
| ⬜ | **Pediatría y Salud** | `pediatriaysalud.cl` | — | watchlist | feed stale (último item: 2026-05-24, 113 días) |
| ✅ | **Portal Red Salud** | `portalredsalud.cl` | — | database | sitemap en catálogo (portalredsalud) |
| 🔒 | **Revista Chilena de Pediatría** | `revistachilenadepediatria.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven HTTP 403 |
| 🔒 | **Revista Médica de Chile** | `revistamedicadechile.cl` | — | database | OJS con 36.051 artículos, pero SIN ningún `<lastmod>` y casi sin fecha en el path (679 de 36 |
| ⬜ | **Salud Responde** | `saludresponde.minsal.cl` | — | database | Portal de información del Ministerio de Salud para la ciudadanía |
| ⬜ | **Servicio de Salud Chiloé** | `sschiloe.redsalud.gob.cl` | — | database | Organismo público que articula la red de atención de salud en la provincia de Chiloé |
| ✅ | **Sociedad Chilena de Cardiología y Cirugía Cardiovascular** | `sochicar.cl` | — | database | sitemap en catálogo (sochicar) |
| ✅ | **Sociedad Chilena de Endocrinología y Diabetes** | `soched.cl` | — | database | sitemap en catálogo (soched) |
| ⬜ | **Sociedad Chilena de Infectología** | `sochinf.cl` | — | watchlist | HTTP error (429) |
| ✅ | **Sociedad Chilena de Obesidad** | `sochob.cl` | — | database | sitemap en catálogo (sochob) |
| ⬜ | **Sociedad Chilena de Pediatría** | `sochipe.cl` | — | watchlist | sin feed RSS detectado |
| 🔒 | **Sociedad de Cirugía de Chile** | `sociedadcirugia.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |

### Noticias nacionales (news)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| 🔒 | **123.cl** | `noticias.123.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde) |
| ✅ | **24 Horas** | `24horas.cl` | — | watchlist | sitemap en catálogo (24horas) |
| ✅ | **aDiarioCR** | `adiariocr.com` | — | database | sitemap en catálogo (adiariocr) |
| ✅ | **ADN Radio** | `adnradio.cl` | — | database | sitemap en catálogo (adnradio) |
| ✅ | **Agencia de Noticias** | `agenciadenoticias.org` | — | database | sitemap en catálogo (agenciadenoticias) |
| 🔒 | **Amarillos por Chile** | `amarillosxchile.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Aurora Noticias** | `auroranoticias.cl` | — | database | sitemap en catálogo (auroranoticias) |
| ✅ | **Base Nacional** | `basenacional.cl` | — | database | sitemap en catálogo (basenacional) |
| ✅ | **BioBioChile** | `biobiochile.cl` | — | database | sitemap en catálogo (biobiochile) |
| 🟡 | **Cambio21** | `cambio21.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Canal 13** | `13.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Canal de Noticias** | `canaldenoticias.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs |
| ✅ | **CentralWeb** | `centralweb.cl` | — | database | sitemap en catálogo (centralweb) |
| 🟡 | **Chile Mejor Sin TLC** | `mejorsintlc.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Chile21** | `chile21.cl` | — | database | urlset plano de 777 locs que mezcla 664 URLs de un solo segmento (secciones y artículos, s |
| 🔒 | **Chilena FM** | `chilenafm.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **Chilenews** | `chilenews.cl` | — | watchlist | /sitemap.xml es un urlset plano de 100 URLs |
| 🔒 | **ChileNoticias** | `chilenoticias.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Chilevisión** | `chilevision.cl` | — | watchlist | sitemap en catálogo (chilevision) |
| ✅ | **Ciper Chile** | `ciperchile.cl` | — | database | sitemap en catálogo (ciper) |
| ✅ | **CNN Chile** | `cnnchile.com` | — | watchlist | sitemap en catálogo (cnnchile) |
| ✅ | **Cóndor** | `condor.cl` | Metropolitana | database | sitemap en catálogo (condor) |
| ✅ | **Contingencia Chile** | `contingenciachile.cl` | — | database | sitemap en catálogo (contingenciachile) |
| ✅ | **Contrapoder Chile** | `contrapoderchile.cl` | — | database | sitemap en catálogo (contrapoderchile) |
| 🟡 | **Correo de los Trabajadores** | `cctt.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **CREAS UAH** | `creas.uahurtado.cl` | — | watchlist | subdominio sin sitemap: fetch failed en los 3 endpoints y su robots.txt no responde |
| 🟡 | **Crónicas de Chile** | `cronicasdechile.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **Dalenoticias** | `dalenoticias.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Desenfoque** | `desenfoque.cl` | — | database | sitemap en catálogo (desenfoque) |
| ✅ | **Diario Chile** | `diariochile.cl` | — | database | sitemap en catálogo (diariochile) |
| 🔒 | **Diario El Observador** | `diarioelobservador.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Diario El Progreso** | `diarioelprogreso.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Diario Informativo** | `diarioinformativo.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde) |
| 🔒 | **Diario La Portada** | `diariolaportada.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Diario La Tribuna** | `diariolatribuna.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **Diario USACH** | `diariousach.cl` | — | watchlist | sitemap en catálogo (diariousach) |
| ✅ | **El Arrebato** | `elarrebato.cl` | — | database | sitemap en catálogo (elarrebato) |
| ✅ | **El Ciudadano** | `elciudadano.com` | — | database | sitemap en catálogo (elciudadano) |
| ✅ | **El Clarín de Chile** | `elclarin.cl` | — | database | sitemap en catálogo (elclarin) |
| 🟡 | **El Corto** | `elcorto.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **El Definido** | `eldefinido.cl` | — | watchlist | sitemap en catálogo (eldefinido) |
| 🔒 | **El Desarrollo** | `eldesarrollo.cl` | — | database | urlset plano de 237 locs (142 con `<lastmod>`, todos de sept-2026) y sin fecha en el path: n |
| ✅ | **El Desconcierto** | `eldesconcierto.cl` | — | database | sitemap en catálogo (eldesconcierto) |
| ✅ | **El Diario de Santiago** | `eldiariodesantiago.cl` | — | watchlist | sitemap en catálogo (eldiariodesantiago) |
| 🟡 | **El Diario Santiago** | `eldiariosantiago.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **El Dínamo** | `eldinamo.cl` | — | watchlist | sitemap en catálogo (eldinamo) |
| ✅ | **El Filtrador** | `elfiltrador.com` | — | watchlist | sitemap en catálogo (elfiltrador) |
| ✅ | **El Gong** | `diarioelgong.cl` | — | watchlist | sitemap en catálogo (diarioelgong) |
| 🟡 | **El Hilo** | `elhilo.cl` | — | watchlist | org de prensa en src/content/organizations/*.md |
| ✅ | **El Informador Chile** | `elinformadorchile.cl` | — | database | sitemap en catálogo (elinformadorchile) |
| 🔒 | **El Lanquihue** | `ellanquihue.cl` | Los Lagos | database | robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs |
| ✅ | **El Líbero** | `ellibero.cl` | — | watchlist | sitemap en catálogo (ellibero) |
| ✅ | **El Libertario** | `ellibertario.cl` | — | watchlist | sitemap en catálogo (ellibertario) |
| ✅ | **El Mercurio (Edición Impresa)** | `impresa.elmercurio.com` | — | watchlist | sitemap en catálogo (elmegacl) |
| ✅ | **El Minuto** | `elminuto.cl` | — | database | sitemap en catálogo (elminuto) |
| ✅ | **El País - Chile** | `elpais.com` | — | database | sitemap en catálogo (elpais) |
| ✅ | **El Periscopio** | `elperiscopio.cl` | — | database | sitemap en catálogo (elperiscopio) |
| ✅ | **El Quinto Poder** | `elquintopoder.cl` | — | database | sitemap en catálogo (elquintopoder) |
| ✅ | **El Radar** | `elradar.cl` | — | database | sitemap en catálogo (elradar) |
| ✅ | **El Regionalista** | `elregionalista.cl` | — | database | sitemap en catálogo (elregionalista) |
| 🟡 | **El Reporte Diario** | `reportediario.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **El Siglo** | `elsiglo.cl` | — | database | sitemap en catálogo (elsiglo) |
| 🟡 | **El Telescopio** | `eltelescopio.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **El Vigilante** | `elvigilante.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Emol** | `emol.com` | — | database | sitemap en catálogo (emol) |
| 🔒 | **En la Ciudad** | `enlaciudad.cl` | — | database | blog en Blogger sin sitemap: fetch failed en los 3 endpoints y robots.txt no responde |
| ✅ | **Entérate Hoy** | `enteratehoy.cl` | — | watchlist | sitemap en catálogo (enteratehoy) |
| ✅ | **Esperanza FM** | `esperanzafm.cl` | Araucania | database | sitemap en catálogo (esperanzafm) |
| ✅ | **Está Pasando** | `estapasando.cl` | — | database | sitemap en catálogo (estapasando) |
| ✅ | **Ex-Ante** | `ex-ante.cl` | Metropolitana | database | sitemap en catálogo (ex_ante) |
| ✅ | **Fact Checking UC** | `factchecking.cl` | — | watchlist | sitemap en catálogo (factchecking) |
| ✅ | **Factos** | `factos.cl` | — | database | sitemap en catálogo (factos) |
| ✅ | **FastCheckCL** | `fastcheck.cl` | — | database | sitemap en catálogo (fastcheck) |
| ✅ | **Futura FM** | `futurafm.cl` | Maule | database | sitemap en catálogo (futurafm) |
| 🟡 | **G5 Noticias** | `g5noticias.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **G80** | `g80.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **Gamba.cl** | `gamba.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Google News** | `news.google.com` | — | database | robots.txt 200 sin línea Sitemap y los 3 endpoints devuelven 200 con 0 locs; además es un |
| 🔒 | **Hoy** | `hoy.cl` | — | watchlist | los 3 endpoints estándar devuelven 404 (robots.txt no declara sitemap) |
| ✅ | **Infogate** | `infogate.cl` | — | watchlist | sitemap en catálogo (infogate) |
| 🔒 | **Informe:Chile** | `informechile.cl` | — | watchlist | /sitemap.xml es un índice de 2 entradas, sin artículos |
| 🔒 | **INoticias.CL** | `inoticias.cl` | — | database | verificado sin artículos en el catálogo |
| 🟡 | **Interferencia** | `interferencia.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **La Coyuntura** | `lacoyuntura.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| 🟡 | **La Cuarta** | `lacuarta.cl` | — | watchlist | referenciado en src/content/sources/*.md [medio en catálogo como lacuarta] |
| 🔒 | **La Estrella de Antofagasta** | `estrellaantofagasta.cl` | — | watchlist | conglomerado Estrella/Mercurio: 450 (verificado) |
| 🔒 | **La Estrella de Chiloé** | `laestrellachiloe.cl` | Los Lagos | database | conglomerado Estrella/Mercurio: 450 (verificado) |
| 🔒 | **La Estrella de Concepción** | `estrellaconcepcion.cl` | — | watchlist | su /sitemap.xml no es suyo: devuelve el índice compartido de Prontus con los sitemaps de e |
| 🔒 | **La Estrella del Loa** | `estrellaloa.cl` | — | watchlist | conglomerado Estrella/Mercurio: 450 (verificado) |
| ✅ | **La Izquierda Diario** | `laizquierdadiario.cl` | — | database | sitemap en catálogo (laizquierdadiario) |
| ✅ | **La Máquina Medio** | `lamaquinamedio.com` | — | database | sitemap en catálogo (lamaquinamedio) |
| ✅ | **La Nación** | `lanacion.cl` | — | database | sitemap en catálogo (lanacion) |
| 🟡 | **La Segunda** | `lasegunda.cl` | — | watchlist | referenciado en src/content/sources/*.md [medio en catálogo como lasegunda] |
| 🔒 | **La Segunda (Edición Impresa)** | `impresa.lasegunda.com` | — | watchlist | subdominio de la edición impresa: fetch failed en los 3 endpoints. El sitemap del medio ya |
| ✅ | **La Tercera** | `latercera.com` | — | database | sitemap en catálogo (latercera) |
| ✅ | **La Voz de los que Sobran** | `lavozdelosquesobran.cl` | — | database | sitemap en catálogo (lavozdelosquesobran) |
| 🔒 | **Libertad Digital** | `libertaddigital.cl` | — | watchlist | su /sitemap.xml no le pertenece: devuelve los sitemaps de fifa55cs.com (otro sitio del mis |
| 🔒 | **M360** | `m360.cl` | — | watchlist | DNS fail al pedir /noticias/sitemap_pags.xml (declarado en robots) |
| ✅ | **Magia Digital** | `magiadigital.cl` | — | watchlist | sitemap en catálogo (magiadigital) |
| ✅ | **Mala Espina** | `malaespinacheck.cl` | — | database | sitemap en catálogo (malaespina) |
| 🔒 | **Mapuche Nation** | `mapuche-nation.org` | — | database | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs |
| 🔒 | **Mapuexpress** | `mapuexpress.org` | — | watchlist | sin sitemap (los 4 endpoints no devuelven locs) |
| ✅ | **Mediabanco** | `mediabanco.com` | — | database | sitemap en catálogo (mediabanco) |
| 🟡 | **Mega** | `mega.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Meganoticias** | `meganoticias.cl` | — | watchlist | sitemap en catálogo (meganoticias) |
| 🔒 | **Megatiempo** | `megatiempo.cl` | — | watchlist | mismo CMS y shards content-noticias/sitemap-YYYY-MM.xml que meganoticias (ya catalogado): |
| 🔒 | **Mercurio de Antofagasta** | `mercurioantofagasta.cl` | Antofagasta | database | conglomerado Estrella/Mercurio: 450 (verificado) |
| 🔒 | **Mercurio de Calama** | `mercuriocalama.cl` | Antofagasta | database | conglomerado Estrella/Mercurio: 450 (verificado) |
| ✅ | **Mi Radio LS** | `miradiols.cl` | — | database | sitemap en catálogo (miradiols) |
| 🔒 | **MQN (Más Que Noticias)** | `mqn.cl` | — | database | post-sitemap plano de 85 locs, todas de 2026 (el `<lastmod>` máximo se repite 2 veces): volu |
| ✅ | **Música y Noticias** | `musicaynoticias.cl` | — | database | sitemap en catálogo (musicaynoticias) |
| ✅ | **Nostálgica** | `nostalgica.cl` | — | database | sitemap en catálogo (nostalgica) |
| 🟡 | **NotiChile** | `notichile.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Noticias Importantes** | `noticiasimportantes.cl` | — | watchlist | /sitemap.xml responde 0 locs (declarado en robots) |
| 🟡 | **Onda Expansiva** | `ondaexpansiva.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Oro Coipo** | `orocoipo.cl` | Ohiggins | database | variantes ?sitemapindex.xml y ?sitemapNNN.xml con 0 locs; /sitemap.xml es un urlset de 1 l |
| ✅ | **Página 19** | `pagina19.cl` | — | database | sitemap en catálogo (pagina19) |
| ✅ | **Panorama Noticioso** | `panoramanoticioso.cl` | — | database | sitemap en catálogo (panoramanoticioso) |
| 🔒 | **Partido de la Gente** | `partidodelagente.cl` | — | watchlist | post-sitemap plano de 9 locs de 2023 y medio inactivo (su feed moría en 2023-07) |
| 🔒 | **Partido Social Cristiano** | `pscchile.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Periodismo Sanador** | `periodismosanador.blogspot.com` | — | watchlist | blog en Blogger sin sitemap: fetch failed en los 3 endpoints y robots.txt no responde |
| 🔒 | **Periodismo2** | `periodismo2.cl` | — | database | agregador: urlset plano topado en 5.000 locs que solo cubre 2026-06-17→2026-09-26 (66% en |
| ✅ | **Piensa Chile** | `piensachile.com` | — | database | sitemap en catálogo (piensachile) |
| ✅ | **Portal Metropolitano** | `portalmetropolitano.cl` | — | database | sitemap en catálogo (portalmetropolitano) |
| 🔒 | **Portal Nacional** | `portalnacional.cl` | — | database | Yoast con 8.157 artículos, pero el `<lastmod>` es el dateModified: una oleada de retoques (2 |
| ✅ | **Prime Digital** | `primedigital.cl` | — | watchlist | sitemap en catálogo (primedigital) |
| ✅ | **Publimetro Chile** | `publimetro.cl` | — | database | sitemap en catálogo (publimetro) |
| ✅ | **Publimicro** | `publimicro.cl` | — | database | sitemap en catálogo (publimicro) |
| 🔒 | **Puerto Montt Online** | `puertomonttonline.cl` | Los Lagos | watchlist | post-sitemap plano de 120 locs con el `<lastmod>` de una migración (2023-12-12) mientras el |
| ✅ | **Pulso Público** | `pulsopublico.cl` | — | database | sitemap en catálogo (pulsopublico) |
| 🟡 | **Puranoticia** | `puranoticia.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **PuraNoticia** | `puranoticia.pnt.cl` | Valparaiso | database | referenciado en src/content/sources/*.md |
| 🔒 | **Qué Pasa** | `quepasa.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **Radar BioBio** | `radarbiobio.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Radar Informativo** | `radarinformativo.cl` | — | watchlist | agregador que republica notas de otros medios (/medio/biobio, etc.): sus 1.200 URLs /n/<id |
| ✅ | **Radio Agricultura** | `radioagricultura.cl` | — | watchlist | sitemap en catálogo (radioagricultura) |
| 🔒 | **Radio Araucanía** | `radioaraucania.cl` | — | database | los 4 endpoints WP devuelven 0 locs |
| 🔒 | **Radio Buena Nueva** | `radiobuenanueva.cl` | Maule | database | robots.txt 404, sin sitemap |
| ✅ | **Radio Concierto** | `concierto.cl` | — | database | sitemap en catálogo (concierto) |
| ✅ | **Radio Cooperativa** | `cooperativa.cl` | — | database | sitemap en catálogo (cooperativa) |
| ✅ | **Radio El Puelche** | `elpuelche.cl` | Los Lagos | database | sitemap en catálogo (elpuelche) |
| ✅ | **Radio Festival** | `radiofestival.cl` | — | database | sitemap en catálogo (radiofestival) |
| ✅ | **Radio Imagina** | `radioimagina.cl` | — | database | sitemap en catálogo (radioimagina) |
| ✅ | **Radio Infinita** | `infinita.cl` | — | database | sitemap en catálogo (infinita) |
| ✅ | **Radio Nuevo Mundo** | `radionuevomundo.cl` | — | database | sitemap en catálogo (radionuevomundo) |
| 🟡 | **Radio Ñuble** | `radionuble.cl` | Nuble | database | referenciado en src/content/sources/*.md |
| ✅ | **Radio Paulina** | `radiopaulina.cl` | Tarapaca | database | sitemap en catálogo (radiopaulina) |
| 🟡 | **Radio Pauta** | `pauta.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Radio Pilmaiquén** | `radiopilmaiquen.cl` | — | watchlist | su /sitemap.xml es un índice de 4 CPTs, pero el shard wp-sitemap-posts-post-1.xml devuelve |
| 🔒 | **Radio Presidente Ibáñez** | `radiopresidenteibanez.cl` | Magallanes | database | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Radio Pudahuel** | `pudahuel.cl` | — | database | el único sitemap con artículos es el /out/sitemap.xml que declara su robots: 61 locs con / |
| 🔒 | **Radio San Bartolomé** | `radiosanbartolome.cl` | Coquimbo | database | robots.txt 500 y los 3 endpoints estándar devuelven 500 |
| ✅ | **Radio UdeC** | `radioudec.cl` | Biobio | database | sitemap en catálogo (radioudec) |
| ✅ | **Radio Valparaíso** | `radiovalparaiso.cl` | Valparaiso | watchlist | sitemap en catálogo (radiovalparaiso) |
| 🟡 | **Red Digital** | `reddigital.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Redacción** | `redaccion.cl` | — | database | sitemap en catálogo (redaccion) |
| ✅ | **Renovación Nacional** | `rn.cl` | — | watchlist | sitemap en catálogo (rn) |
| ✅ | **Reportea** | `reportea.cl` | — | database | sitemap en catálogo (reportea) |
| 🔒 | **Revista Enfoque** | `revistaenfoque.cl` | — | database | wp-sitemap con 786 artículos, pero todos de moda y turismo de Argentina (slugs en inglés): |
| 🟡 | **Revista Seguridad** | `revistaseguridad.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **RLN (Radio Las Nieves)** | `rln.cl` | Aysen | database | sitemap en catálogo (rln) |
| ✅ | **Santiago Times** | `santiagotimes.cl` | — | watchlist | sitemap en catálogo (santiagotimes) |
| 🔒 | **Somos9** | `somos9.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| 🟡 | **SoyChile** | `soychile.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🟡 | **T13** | `t13.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Tercera Dosis** | `terceradosis.cl` | — | watchlist | /sitemap.xml es un índice de 3 entradas (pags/image/video), sin artículos |
| ✅ | **Terra Chile** | `terra.cl` | — | watchlist | sitemap en catálogo (terra) |
| ✅ | **The Clinic** | `theclinic.cl` | — | database | sitemap en catálogo (theclinic) |
| 🔒 | **The Times en Español** | `thetime.cl` | — | database | el sitio responde desde otro dominio (thetimeslatino.com) y su sitemap plano de 269 locs s |
| 🟡 | **The Times Latino** | `thetimeslatino.com` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Tropezón Tu Diario** | `nuevotropezon.tropezon.cl` | — | database | sitemap en catálogo (nuevotropezon) |
| ✅ | **TVN** | `tvn.cl` | — | watchlist | sitemap en catálogo (tvn) |
| 🔒 | **Ufro Medios** | `ufromedios.cl` | — | database | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Vivimos la Noticia** | `vivimoslanoticia.cl` | Maule | database | sitemap en catálogo (vivimoslanoticia) |
| 🔒 | **Werken** | `werken.cl` | — | watchlist | índice plano de ~90 artículos (temática mapuche), sin paginación |

### Noticias internacionales (news-international)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ✅ | **ANSA Latina** | `ansalatina.com` | — | watchlist | sitemap en catálogo (ansalatina) |
| ✅ | **BBC Mundo** | `bbc.com` | — | database | sitemap en catálogo (bbc) |
| ⬜ | **Cadena Política** | `cadenapolitica.com` | — | database | Portal mexicano de noticias políticas, salud y actualidad |
| 🔒 | **El Nacional** | `elnacional.com` | — | database | prensa venezolana (El Nacional, Caracas), fuera del alcance chileno; además sus `<loc>` apun |
| ✅ | **France 24** | `france24.com` | — | database | sitemap en catálogo (france24) |
| ⬜ | **Ground News - Chile** | `ground.news` | — | watchlist | sin feed RSS detectado |
| ✅ | **HolaNews** | `holanews.com` | — | database | sitemap en catálogo (holanews) |
| ✅ | **IPS Agencia de Noticias** | `ipsnoticias.net` | — | database | sitemap en catálogo (ipsnoticias) |
| ✅ | **Le Monde Diplomatique - Edición Chilena** | `lemondediplomatique.cl` | — | database | sitemap en catálogo (lemondediplomatique) |
| ✅ | **MercoPress** | `es.mercopress.com` | — | database | sitemap en catálogo (mercopress) |
| 🔒 | **MercoPress Chile** | `en.mercopress.com` | — | database | misma agencia que mercopress.cl (ya catalogado, 46.710 artículos): la edición en inglés du |
| 🟡 | **Perfil** | `perfil.com` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Prensa Opal** | `prensaopal.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **RFI Español** | `rfi.fr` | — | database | sitemap en catálogo (rfi) |
| ✅ | **The Guardian** | `theguardian.com` | — | database | sitemap en catálogo (theguardian) |
| ✅ | **Voz de América Chile** | `vozdeamerica.com` | — | database | sitemap en catálogo (vozdeamerica) |

### Partidos políticos (political-parties)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| 🔒 | **Demócratas Chile** | `democratas.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ⬜ | **Evópoli** | `evopoli.cl` | — | watchlist | feed stale (último item: 2026-06-15, 91 días) |
| ✅ | **Federación Regionalista Verde Social** | `frevs.cl` | — | database | sitemap en catálogo (frevs) |
| ✅ | **Frente Amplio** | `frenteampliochile.cl` | — | database | sitemap en catálogo (frenteampliochile) |
| ⬜ | **Fundación Jaime Guzmán** | `fjguzman.cl` | — | database | Centro de estudios vinculado a la UDI |
| 🟡 | **Fundación Nodo XXI** | `nodoxxi.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Partido Comunista de Chile** | `pcchile.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **Partido Demócrata Cristiano** | `pdc.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Partido Humanista de Chile** | `partidohumanista.cl` | — | database | sitemap en catálogo (partidohumanista) |
| ✅ | **Partido Igualdad** | `partidoigualdad.cl` | — | database | sitemap en catálogo (partidoigualdad) |
| ✅ | **Partido Liberal de Chile** | `liberaleschile.cl` | — | database | sitemap en catálogo (liberaleschile) |
| 🔒 | **Partido por la Democracia** | `ppd.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🟡 | **Partido Republicano de Chile** | `partidorepublicanodechile.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Partido Socialista de Chile** | `pschile.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Unión Demócrata Independiente** | `udi.cl` | — | database | sitemap en catálogo (udi) |

### Radio (radio)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ✅ | **Duna** | `duna.cl` | — | watchlist | sitemap en catálogo (duna) |
| 🔒 | **FM Joven** | `fmjoven.com` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs |
| 🟡 | **FM Plus** | `fmplus.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **FM Stylo** | `fmstylo.cl` | — | watchlist | es una estación de la red Patagonia Radio: su robots declara el sitemap de patagoniaradio. |
| 🔒 | **La Radioneta** | `laradioneta.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs |
| 🔒 | **Los 40** | `los40.cl` | — | database | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Mirador FM** | `miradorfm.cl` | — | watchlist | el sitio real es mirador.fm y su wp-sitemap no declara ningún shard de posts: los 16 CPTs |
| 🔒 | **Ojo Subterráneo** | `ojosubterraneo.caster.fm` | — | watchlist | el sitemap que declara es el de la plataforma (www.caster.fm) y sus 34 locs son noticias d |
| 🟡 | **Orolonco FM** | `oroloncofm.cl` | Valparaiso | database | referenciado en src/content/sources/*.md |
| 🔒 | **Radio 1° de Mayo** | `radio1demayo.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **Radio 45 Sur** | `radio45sur.cl` | Los Rios | database | referenciado en src/content/sources/*.md |
| 🔒 | **Radio 80** | `radio80.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Radio 920** | `radionueveveinte.com` | — | watchlist | dominio estacionado: su /sitemap.xml devuelve 2 locs de otro sitio (www.foriamking.nl) y l |
| ✅ | **Radio Acogida** | `radioacogida.cl` | Los Lagos | database | sitemap en catálogo (radioacogida) |
| ✅ | **Radio Activa** | `radioactiva.cl` | — | database | sitemap en catálogo (radioactiva) |
| 🔒 | **Radio Alborada** | `radioalborada.cl` | — | watchlist | robots.txt 403 y los 3 endpoints estándar devuelven 403 |
| 🔒 | **Radio Alternativa** | `radioalternativa.cl` | — | watchlist | los 3 endpoints estándar dan timeout (fetch aborted) |
| 🔒 | **Radio Angelina** | `radioangelina.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Radio Armonía** | `radioarmonia.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🟡 | **Radio Atacama** | `radioatacama.cl` | Atacama | database | referenciado en src/content/sources/*.md |
| 🔒 | **Radio Austral CD 970** | `radioaustralvaldivia.cl` | Los Rios | database | wp-sitemap con shards de posts residuales; radio sin volumen |
| 🔒 | **Radio Azúcar** | `radioazucar.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Radio Beat** | `radiobeat.cl` | — | watchlist | sitemap en catálogo (radiobeat) |
| 🔒 | **Radio Carillón** | `radiocarillon.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Radio Carolina** | `carolina.cl` | — | database | sitemap en catálogo (carolina) |
| ✅ | **Radio Chilena** | `radiochilena.cl` | — | watchlist | sitemap en catálogo (radiochilena) |
| 🔒 | **Radio Colo-Colo** | `radiocolocolo.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap: el sitio no responde desde esta red |
| ✅ | **Radio Comunicativa de Ovalle** | `radiocomunicativa.cl` | Coquimbo | database | sitemap en catálogo (radiocomunicativa) |
| 🟡 | **Radio Contacto** | `radiocontacto.cl` | Nuble | database | referenciado en src/content/sources/*.md |
| 🔒 | **Radio Cristalina** | `radiocristalina.cl` | — | database | wp-sitemap con un solo shard wp-sitemap-posts-post-1.xml |
| 🔒 | **Radio del Mar** | `radiodelmar.cl` | — | watchlist | 1.001 locs con slugs en inglés traducidos y temas genéricos globales (`take-precautions-wh |
| 🔒 | **Radio Disney Chile** | `radiodisney.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Radio El Conquistador** | `elconquistador.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Radio FM Centro** | `fmcentro.cl` | Araucania | database | sitemap en catálogo (fmcentro) |
| 🟡 | **Radio Futuro** | `futuro.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Radio Galactika** | `galactika.wordpress.com` | — | watchlist | sitemap en catálogo (galactika) |
| 🔒 | **Radio Guayacán** | `radioguayacan.cl` | Coquimbo | database | robots.txt vacío (0 bytes), sin sitemap |
| 🔒 | **Radio Horizonte** | `horizonte.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Radio HVA** | `hvaradio.cl` | Atacama | database | sitemap en catálogo (hvaradio) |
| ✅ | **Radio Interamericana** | `radiointeramericana.cl` | Biobio | database | sitemap en catálogo (radiointeramericana) |
| 🟡 | **Radio JGM** | `radiojgm.uchile.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Radio Konciencia** | `radiokonciencia.org` | — | watchlist | 48 locs, todas de 2023, sobre cultura japonesa (sección kyouteijou) y sin cobertura de gob |
| 🔒 | **Radio La Clave** | `laclave.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Radio La Señal** | `radiolasenal.cl` | — | database | sitemap en catálogo (radiolasenal) |
| ✅ | **Radio María Chile** | `radiomaria.cl` | — | database | sitemap en catálogo (radiomaria) |
| 🔒 | **Radio Máxima** | `radiomaxima.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Radio Melodía** | `radiomelodia.cl` | — | database | sitemap en catálogo (radiomelodia) |
| ✅ | **Radio Modelo** | `radiomodelo.cl` | — | database | sitemap en catálogo (radiomodelo) |
| 🔒 | **Radio Placeres** | `radioplaceres.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Radio Play** | `radioplay.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Radio Portales** | `radioportales.cl` | — | watchlist | robots.txt 500 y los 3 endpoints estándar devuelven 500 |
| ✅ | **Radio Riquelme** | `radioriquelme.cl` | — | database | sitemap en catálogo (radioriquelme) |
| ✅ | **Radio Romántica** | `romantica.cl` | — | database | sitemap en catálogo (romantica) |
| 🟡 | **Radio Sago** | `radiosago.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Radio Santa Cruz** | `santacruzfm.cl` | Ohiggins | database | sitemap en catálogo (santacruzfm) |
| 🔒 | **Radio Santiago** | `radiosantiago.cl` | Metropolitana | watchlist | su robots declara el wp-sitemap de eldiariodesantiago.cl: es el mismo sitio bajo otro nomb |
| 🔒 | **Radio Sinfonía** | `radiosinfonia.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Radio Tiempo** | `radiotiempo.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Radio Universal** | `radiouniversal.cl` | — | watchlist | sitemap en catálogo (radiouniversal) |
| ✅ | **Radio Universidad de Chile** | `radio.uchile.cl` | Metropolitana | database | sitemap en catálogo (radio_uchile) |
| 🔒 | **Radio Universo** | `radiouniverso.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Radio Uno** | `radiouno.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Radio Usach** | `radio.usach.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Radio Valentín Letelier** | `rvl.uv.cl` | Valparaiso | database | robots.txt 404 y los 3 endpoints estándar devuelven 500 |
| 🔒 | **Radio Villa Francia** | `radiovillafrancia.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 200 con 0 locs |
| 🔒 | **Radio Zero** | `radiozero.cl` | — | watchlist | su wp-sitemap declara un único shard (wp-sitemap-posts-page-1.xml): solo páginas, ningún a |
| 🔒 | **Radios Regionales** | `radiosregionales.cl` | — | watchlist | mismo caso que fmstylo.cl: su robots declara el sitemap de patagoniaradio.cl y sus 3 endpo |
| 🔒 | **Rock & Pop** | `rockandpop.cl` | — | database | el único sitemap con artículos es su /out/sitemap.xml, con 37 locs de 2026 y el path /YYYY |
| 🔒 | **Soberanía Radio** | `soberaniaradio.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **UC Radio Beethoven** | `beethovenfm.cl` | — | watchlist | post-sitemap plano de 2 locs, ambas de 2021: medio inactivo |
| ✅ | **Vilas Radio** | `vilasradio.cl` | Tarapaca | database | sitemap en catálogo (vilasradio) |

### Regional (regional)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ✅ | **Aconcagua Digital** | `aconcaguadigital.cl` | Valparaiso | database | sitemap en catálogo (aconcaguadigital) |
| ✅ | **Alerta Noticias** | `alertanoticias.cl` | Valparaiso | database | sitemap en catálogo (alertanoticias) |
| ✅ | **Alerta Noticias Temuco** | `alertanoticiastemuco.cl` | Araucania | database | sitemap en catálogo (alertanoticiastemuco) |
| ✅ | **Alto La Dehesa** | `altoladehesa.cl` | Metropolitana | database | sitemap en catálogo (altoladehesa) |
| 🔒 | **Angelino** | `angelino.cl` | — | database | wp-sitemap con shards de posts residuales (volumen bajo) |
| ✅ | **Angol Noticias** | `angolnoticiasnew.cl` | Araucania | database | sitemap en catálogo (angolnoticias) |
| 🔒 | **Angolinos** | `angolinos.cl` | Araucania | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Antofacity** | `antofacity.com` | Antofagasta | database | sitemap en catálogo (antofacity) |
| ✅ | **Antofagasta al Día** | `antofagastaaldia.cl` | Antofagasta | database | sitemap en catálogo (antofagastaaldia) |
| ✅ | **Antofagasta Noticias** | `antofagastanoticias.cl` | Antofagasta | database | sitemap en catálogo (antofagastanoticias) |
| 🔒 | **Antofagasta TV** | `antofagasta.tv` | Antofagasta | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Araucanía Cuenta** | `araucaniacuenta.cl` | Araucania | watchlist | sitemap en catálogo (araucaniacuenta) |
| 🟡 | **Araucanía Diario** | `araucaniadiario.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Araucanía Noticias** | `araucanianoticias.cl` | Araucania | database | sitemap en catálogo (noticiasdellago) |
| 🔒 | **Arica Al Día** | `aricaldia.cl` | Arica Y Parinacota | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Arica Chile** | `aricachile.cl` | Arica Y Parinacota | database | sitemap en catálogo (aricachile) |
| ✅ | **Arica es Noticia** | `aricaesnoticia.cl` | Arica Y Parinacota | database | sitemap en catálogo (aricaesnoticia) |
| ✅ | **Arica Hoy** | `aricahoy.cl` | Arica Y Parinacota | database | sitemap en catálogo (aricahoy) |
| 🔒 | **Arica Mía** | `aricamia.cl` | Arica Y Parinacota | watchlist | Yoast con 51 locs, pero las 51 tienen `<lastmod>` 2026-03-03 (el día que se publicó el sitio |
| 🔒 | **Arica Online** | `aricaonline.cl` | — | database | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **Arica TV** | `arica.tv` | Arica Y Parinacota | watchlist | sitemap en catálogo (aricastv) |
| 🔒 | **Arica365** | `arica365.cl` | Arica Y Parinacota | database | sin sitemap (los 4 endpoints no devuelven locs) |
| ✅ | **Atacama en Línea** | `atacamaenlinea.cl` | Atacama | database | sitemap en catálogo (atacamaenlinea) |
| ✅ | **Atacama Noticias** | `atacamanoticias.cl` | Atacama | database | sitemap en catálogo (atacamanoticias) |
| 🟡 | **Atentos** | `atentos.cl` | Maule | database | referenciado en src/content/sources/*.md |
| ✅ | **Aysén Ahora** | `aysenahora.cl` | Aysen | database | sitemap en catálogo (aysenahora) |
| ✅ | **Aysén TV** | `aysentv.cl` | Aysen | database | sitemap en catálogo (aysentv) |
| ✅ | **Cabrero en Línea** | `wp.cabreroenlinea.cl` | Biobio | database | sitemap en catálogo (cabreroenlinea) |
| ✅ | **Calama en Línea** | `noticias.calamaenlinea.cl` | Antofagasta | database | sitemap en catálogo (calamaenlinea) |
| ✅ | **Canal 9 Biobío** | `canal9.cl` | — | watchlist | sitemap en catálogo (canal9) |
| 🔒 | **Canal Sur Patagonia** | `canalsurpatagonia.cl` | Aysen | database | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde) |
| ✅ | **CauquenesNet** | `cauquenesnet.cl` | Maule | database | sitemap en catálogo (cauquenesnet) |
| 🔒 | **CEI Noticias** | `ceinoticias.cl` | Tarapaca | database | DNS ENOTFOUND (verificado 27-09-2026) |
| ✅ | **Central Noticia** | `centralnoticia.cl` | Los Lagos | database | sitemap en catálogo (centralnoticia) |
| 🔒 | **Central Noticias** | `centralnoticias.cl` | Los Rios | database | sin sitemap (los 4 endpoints no devuelven locs) |
| 🔒 | **Chasquis** | `chasquis.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| ✅ | **Chicureo Hoy** | `chicureohoy.cl` | Metropolitana | database | sitemap en catálogo (chicureohoy) |
| 🔒 | **Chile Mosaico** | `chilemosaico.cl` | — | watchlist | su robots declara /eventos/wp-sitemap.xml, que responde 0 locs; los otros 3 endpoints dan |
| 🔒 | **Chillán Online** | `chillanonline.cl` | Nuble | database | sin sitemap (robots, wp-sitemap, sitemap_index, sitemap y news-sitemap sin locs útiles) |
| 🟡 | **ChiloeNews** | `chiloenews.cl` | Los Lagos | database | referenciado en src/content/sources/*.md |
| 🔒 | **Chinchorro** | `periodicochinchorro.cl` | Arica Y Parinacota | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Clave 9** | `clave9.cl` | Araucania | database | sitemap en catálogo (clave9) |
| ✅ | **CLG Medios** | `clgmedios.cl` | Los Lagos | database | sitemap en catálogo (clgmedios) |
| ✅ | **Coquimbo Noticias** | `coquimbonoticias.cl` | Coquimbo | database | sitemap en catálogo (coquimbonoticias) |
| 🔒 | **Crónica Chillán** | `cronicachillan.cl` | — | watchlist | su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquiq |
| 🟡 | **Crónica Digital** | `cronicadigital.cl` | Metropolitana | database | referenciado en src/content/sources/*.md |
| 🔒 | **Crónica Noticias** | `cronicanoticias.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **Curacaví Digital** | `curacavidigital.cl` | Metropolitana | database | sitemap en catálogo (curacavidigital) |
| 🔒 | **Datos Sur** | `datossur.cl` | Los Lagos | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **David Noticias** | `davidnoticias.cl` | Coquimbo | database | índice de 1.292 shards íntegramente SEO spam (?id=link-slot*), sin un solo artículo |
| ✅ | **De Mar a Cordillera TV** | `demaracordilleratv.cl` | Ohiggins | database | sitemap en catálogo (demaracordilleratv) |
| 🔒 | **De Todo Valdivia** | `dtvaldivia.cl` | Los Rios | database | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| ✅ | **Desierto FM** | `desiertofm.cl` | Antofagasta | database | sitemap en catálogo (desiertofm) |
| ✅ | **Diálogo Sur** | `dialogosur.cl` | Magallanes | database | sitemap en catálogo (dialogosur) |
| ✅ | **Diario Aconcagua** | `diarioaconcagua.cl` | Valparaiso | database | sitemap en catálogo (diarioaconcagua) |
| ✅ | **Diario Angamos** | `diarioangamos.com` | Antofagasta | database | sitemap en catálogo (diarioangamos) |
| ✅ | **Diario Antofagasta** | `diarioantofagasta.cl` | Antofagasta | database | sitemap en catálogo (diarioantofagasta) |
| 🔒 | **Diario Austral Osorno** | `australosorno.cl` | Los Lagos | database | conglomerado Estrella/Mercurio: 450 (verificado) |
| 🔒 | **Diario Austral Temuco** | `australtemuco.cl` | Araucania | database | conglomerado Estrella/Mercurio: 450 (verificado) |
| ✅ | **Diario Avísale** | `diarioavisale.cl` | Tarapaca | database | sitemap en catálogo (diarioavisale) |
| ✅ | **Diario Aysén** | `diarioaysen.cl` | — | database | sitemap en catálogo (diarioaysen) |
| 🔒 | **Diario Aysén Opina** | `diarioaysenopina.cl` | Aysen | watchlist | robots.txt 403 y los 3 endpoints estándar devuelven 200 con 0 locs |
| ✅ | **Diario Cauquenes** | `diariocauquenes.cl` | Maule | database | sitemap en catálogo (diariocauquenes) |
| ✅ | **Diario Chañarcillo** | `chanarcillo.cl` | Atacama | database | sitemap en catálogo (chanarcillo) |
| ✅ | **Diario Chiloé** | `diariochiloe.cl` | — | watchlist | sitemap en catálogo (diariochiloe) |
| ✅ | **Diario Concepción** | `diarioconcepcion.cl` | Biobio | database | sitemap en catálogo (diarioconcepcion) |
| ✅ | **Diario Curicó** | `diariocurico.cl` | Maule | database | sitemap en catálogo (diariocurico) |
| ✅ | **Diario de Osorno** | `diariodeosorno.cl` | — | watchlist | sitemap en catálogo (diariodeosorno) |
| ✅ | **Diario de Puerto Montt** | `diariodepuertomontt.cl` | — | watchlist | sitemap en catálogo (diariodepuertomontt) |
| ✅ | **Diario de Valdivia** | `diariodevaldivia.cl` | — | watchlist | sitemap en catálogo (diariodevaldivia) |
| ✅ | **Diario El Cautín** | `diarioelcautin.cl` | Araucania | database | sitemap en catálogo (diarioelcautin) |
| ✅ | **Diario El Centro** | `diarioelcentro.cl` | Maule | database | sitemap en catálogo (diarioelcentro) |
| ✅ | **Diario El Cóndor** | `diariocondor.cl` | Ohiggins | database | sitemap en catálogo (elcondor) |
| ✅ | **Diario El Día** | `diarioeldia.cl` | Coquimbo | database | sitemap en catálogo (diarioeldia) |
| 🟡 | **Diario El Heraldo** | `diarioelheraldo.cl` | Maule | database | referenciado en src/content/sources/*.md |
| ✅ | **Diario El Huemul** | `elhuemul.cl` | Los Lagos | database | sitemap en catálogo (elhuemul) |
| ✅ | **Diario El Longino** | `diariolongino.cl` | Tarapaca | database | sitemap en catálogo (diariolongino) |
| ✅ | **Diario El Marino** | `diarioelmarino.cl` | Ohiggins | database | sitemap en catálogo (diarioelmarino) |
| ✅ | **Diario El Nortino** | `diarioelnortino.cl` | Tarapaca | database | sitemap en catálogo (diarioelnortino) |
| ✅ | **Diario El Porteño** | `elporteno.cl` | Valparaiso | database | sitemap en catálogo (elporteno) |
| ✅ | **Diario El Pulso** | `diarioelpulso.cl` | Ohiggins | database | sitemap en catálogo (diarioelpulso) |
| ✅ | **Diario El Ranco** | `diarioelranco.cl` | — | database | sitemap en catálogo (diarioelranco) |
| ✅ | **Diario Futrono** | `diariofutrono.cl` | — | watchlist | sitemap en catálogo (diariofutrono) |
| ✅ | **Diario La Prensa** | `new.diariolaprensa.cl` | — | watchlist | sitemap en catálogo (laprensadiariolaprensa) |
| 🟡 | **Diario La Prensa** | `diariolaprensa.cl` | Biobio | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Diario La Quinta** | `diariolaquinta.cl` | Valparaiso | database | robots.txt declara sitemap.xml y sitemap.rss, ambos con 0 locs |
| 🟡 | **Diario La Región** | `diariolaregion.cl` | Coquimbo | database | referenciado en src/content/sources/*.md |
| 🔒 | **Diario Labrador** | `diariolabrador.cl` | Los Rios | watchlist | robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs |
| ✅ | **Diario Lago Ranco** | `diariolagoranco.cl` | — | watchlist | sitemap en catálogo (diariolagoranco) |
| 🔒 | **Diario Laguino** | `diariolaguino.cl` | — | watchlist | /sitemap.xml es un urlset plano de 180 páginas, sin artículos |
| 🔒 | **Diario Lanco** | `diariolanco.cl` | — | watchlist | /sitemap.xml es un urlset plano de 180 páginas, sin artículos |
| ✅ | **Diario Linares** | `diariolinares.cl` | Maule | database | sitemap en catálogo (diariolinares) |
| ✅ | **Diario Los Lagos** | `diarioloslagos.cl` | Los Lagos | database | sitemap en catálogo (diarioloslagos) |
| 🔒 | **Diario Máfil** | `diariomafil.cl` | — | watchlist | /sitemap.xml es un urlset plano de 180 páginas, sin artículos |
| ✅ | **Diario Paillaco** | `diariopaillaco.cl` | — | watchlist | sitemap en catálogo (diariopaillaco) |
| ✅ | **Diario Puerto Varas** | `diariopuertovaras.cl` | Los Lagos | database | sitemap en catálogo (diariopuertovaras) |
| ✅ | **Diario Regional Aysén** | `diarioregionalaysen.cl` | — | watchlist | sitemap en catálogo (diarioregionalaysen) |
| 🔒 | **Diario Río Bueno** | `diarioriobueno.cl` | — | watchlist | /sitemap.xml es un urlset plano de 180 páginas, sin artículos |
| ✅ | **Diario San José** | `diariosanjose.cl` | — | watchlist | sitemap en catálogo (diariosanjose) |
| 🔒 | **Diario Sol** | `diariosol.cl` | Antofagasta | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **Diario Sur Noticias** | `diariosurnoticias.com` | Metropolitana | database | sitemap en catálogo (diariosurnoticias) |
| ✅ | **Diario Talca** | `diariotalca.cl` | Maule | database | sitemap en catálogo (diariotalca) |
| 🔒 | **Diario VI Región** | `diarioviregion.cl` | Ohiggins | database | su robots declara el sitemap de diariosextaregion.cl: 2.078 locs de páginas SEO autogenera |
| 🔒 | **Dirario Austral** | `australvaldivia.cl` | Los Rios | database | su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquiq |
| ✅ | **Duplos** | `duplos.cl` | Metropolitana | database | sitemap en catálogo (duplos) |
| ✅ | **Edición Cero** | `edicioncero.cl` | Tarapaca | database | sitemap en catálogo (edicioncero) |
| ✅ | **El Aconcagua** | `elaconcagua.cl` | Valparaiso | database | sitemap en catálogo (elaconcagua) |
| 🔒 | **El Amaule** | `elamaule.cl` | — | watchlist | HTTP 403 Cloudflare (verificado) |
| ✅ | **El América** | `elamerica.cl` | Antofagasta | database | sitemap en catálogo (elamerica) |
| ✅ | **El Andacollino** | `elandacollino.cl` | Coquimbo | database | sitemap en catálogo (elandacollino) |
| 🔒 | **El Andino** | `elandino.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **El Boyaldía** | `elboyaldia.cl` | Tarapaca | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **El Cachapoal** | `elcachapoal.cl` | — | database | sitemap en catálogo (elcachapoal) |
| ✅ | **El Calbucano** | `elcalbucano.cl` | Los Lagos | database | sitemap en catálogo (elcalbucano) |
| ✅ | **El Capo de Provincia** | `capodeprovincia.cl` | Valparaiso | database | sitemap en catálogo (capodeprovincia) |
| 🔒 | **El Chelenko** | `elchelenko.cl` | Aysen | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **El Comunicador** | `elcomunicador.cl` | Metropolitana | database | sitemap en catálogo (elcomunicador) |
| 🔒 | **El Concecuente** | `elconcecuente.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **El Concordia** | `elconcordia.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **El Cóndor** | `diarioelcondor.cl` | Ohiggins | watchlist | wp-sitemap.xml solo declara posts-page + taxonomías, sin posts [medio en catálogo como elc |
| ✅ | **El Contraste** | `elcontraste.cl` | — | database | sitemap en catálogo (elcontraste) |
| ✅ | **El Coquimbano** | `elcoquimbano.cl` | Coquimbo | database | sitemap en catálogo (elcoquimbano) |
| 🔒 | **El Correo del Lago** | `correodellago.cl` | Los Lagos | watchlist | su wp-sitemap-posts-post-1.xml responde HTTP 500 pero entrega 133 URLs de contenido SEO/li |
| 🔒 | **El Diario de Atacama** | `diarioatacama.cl` | Atacama | database | su /sitemap.xml no es suyo: devuelve el índice compartido de Prontus con los sitemaps de e |
| 🔒 | **El Diario de Curacaví** | `eldiariodecuracavi.cl` | Metropolitana | database | wp-sitemap con un único post-sitemap residual |
| ✅ | **El Diario de La Araucanía** | `eldiariodelaaraucania.cl` | Araucania | database | sitemap en catálogo (eldiariodelaaraucania) |
| 🔒 | **El Diario de Maule** | `eldiariodemaule.com` | Maule | watchlist | su sitemap_index declara solo 2 CPTs (page-sitemap y blocks-sitemap), ningún shard de post |
| 🔒 | **El Diario Panguipulli** | `eldiariopanguipulli.cl` | — | watchlist | los 4 endpoints WP devuelven 0 locs |
| 🔒 | **El Divisadero** | `eldivisadero.cl` | — | watchlist | robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs |
| ✅ | **El Gong** | `elgong.cl` | Araucania | database | sitemap en catálogo (elgong) |
| 🔒 | **El Heraldo Austral** | `eha.cl` | — | watchlist | /sitemap.xml es un urlset de 41 locs (home + 40 noticias) sin fecha en el path y con <last |
| 🔒 | **El Heraldo Austral** | `elheraldoaustral.cl` | Aysen | watchlist | alias de eha.cl: devuelve el mismo /sitemap.xml de 41 locs |
| ✅ | **El Informador** | `elinformador.cl` | Valparaiso | database | sitemap en catálogo (elinformador) |
| ✅ | **El Insular** | `elinsular.cl` | Los Lagos | database | sitemap en catálogo (elinsular) |
| 🔒 | **El Lector** | `lectoronline.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **El Líder San Antonio** | `lidersanantonio.cl` | Valparaiso | database | su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquiq |
| 🔒 | **El Llanquihue** | `elllanquihue.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **El Magallanews** | `elmagallanews.cl` | — | watchlist | HTTP 403 en los 3 endpoints estándar (robots.txt no declara sitemap) |
| ✅ | **El Magallánico** | `elmagallanico.com` | Magallanes | database | sitemap en catálogo (elmagallanico) |
| ✅ | **El Maipo** | `elmaipo.cl` | Metropolitana | database | sitemap en catálogo (elmaipo) |
| 🔒 | **El Matutino** | `elmartutino.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven HTTP 403 |
| ✅ | **El Maule Informa** | `elmauleinforma.cl` | Maule | database | sitemap en catálogo (elmauleinforma) |
| 🔒 | **El Mercurio Valparaíso** | `mercuriovalpo.cl` | — | database | su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquiq |
| 🔒 | **El Monitor** | `elmonitorparral.com` | Maule | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt tampoco responde) |
| ✅ | **El Morro de Arica** | `elmorrodearica.cl` | Arica Y Parinacota | database | sitemap en catálogo (elmorrodearica) |
| 🟡 | **El Morrocotudo** | `elmorrocotudo.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **El Mostrador** | `elmostrador.cl` | — | watchlist | sitemap en catálogo (elmostrador) |
| 🔒 | **El Naveghable** | `elnaveghable.cl` | — | watchlist | HTTP 403 en los 3 endpoints estándar (robots.txt no declara sitemap) |
| 🔒 | **El Nortero** | `elnortero.cl` | — | watchlist | HTTP 403 en los 3 endpoints estándar (robots.txt sin línea Sitemap) |
| ✅ | **El Noticiero del Huasco** | `elnoticierodelhuasco.cl` | Atacama | database | sitemap en catálogo (elnoticierodelhuasco) |
| ✅ | **El Observador** | `observador.cl` | Valparaiso | database | sitemap en catálogo (observador) |
| 🟡 | **El Observatodo** | `elobservatodo.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **El Ovallino** | `elovallino.cl` | Coquimbo | database | sitemap en catálogo (elovallino) |
| 🔒 | **El Paila** | `lapaila.cl` | — | watchlist | urlset plano de 3 locs (la home + 2 páginas de categoría), sin artículos |
| 🔒 | **El Paradiario 14** | `elparadiario14.cl` | Los Rios | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🟡 | **El Patagónico** | `elpatagonico.com` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **El Periódico** | `elperiodico.cl` | Araucania | database | sitemap en catálogo (elperiodico) |
| ✅ | **El Periodista** | `elperiodista.cl` | Metropolitana | database | sitemap en catálogo (el_periodista) |
| ✅ | **El Pingüino** | `elpinguino.com` | Magallanes | database | sitemap en catálogo (elpinguino) |
| ✅ | **El Proa** | `elproa.cl` | Valparaiso | database | sitemap en catálogo (elproa) |
| 🔒 | **El Provincial** | `elprovincial.cl` | Los Rios | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🟡 | **El Quehaydecierto** | `elquehaydecierto.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **El Rancagüino** | `elrancaguino.cl` | Ohiggins | database | sitemap en catálogo (elrancaguino) |
| 🔒 | **El Rancahuaso** | `elrancahuaso.cl` | Ohiggins | watchlist | HTTP 403 en los 3 endpoints estándar (robots.txt no declara sitemap) |
| 🔒 | **El Regional** | `elregional.cl` | Coquimbo | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **El Reportero de Iquique** | `elreporterodeiquique.com` | Tarapaca | database | sitemap en catálogo (elreporterodeiquique) |
| 🔒 | **El Repuertero** | `elrepuertero.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **El Sancarlino** | `elsancarlino.cl` | Nuble | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **El Serenense** | `elserenense.cl` | Coquimbo | database | sitemap en catálogo (elserenense) |
| ✅ | **El Sol de Iquique** | `elsoldeiquique.cl` | Tarapaca | database | sitemap en catálogo (elsoldeiquique) |
| 🔒 | **El Sur** | `elsur.cl` | — | watchlist | su /sitemap.xml no es suyo: devuelve el índice compartido de Prontus con los sitemaps de e |
| 🟡 | **El Tipógrafo** | `eltipografo.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **El Tirapiedras** | `eltirapiedras.cl` | Magallanes | database | sitemap en catálogo (eltirapiedras) |
| 🔒 | **El Trabajo** | `eltrabajo.cl` | Valparaiso | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **El Urbano Rural** | `elurbanorural.cl` | Ohiggins | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **El Vacanudo** | `elvacanudo.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **El Vicuñense** | `xn--elvicuense-y9a.cl` | Coquimbo | database | sitemap en catálogo (elvicuense) |
| 🟡 | **El Zorro Nortino** | `elzorronortino.cl` | Atacama | database | referenciado en src/content/sources/*.md |
| ✅ | **Elqui Global** | `elquiglobal.cl` | Coquimbo | database | sitemap en catálogo (elquiglobal) |
| ✅ | **En La Línea** | `enlalinea.cl` | Antofagasta | database | sitemap en catálogo (enlalinea) |
| ✅ | **En Línea Maule** | `enlineamaule.cl` | Maule | database | sitemap en catálogo (enlineamaule) |
| ✅ | **Enfoque Digital** | `enfoquedigital.cl` | Atacama | database | sitemap en catálogo (enfoquedigital) |
| ✅ | **Enfoque Digital O'Higgins** | `vi.cl` | Ohiggins | database | sitemap en catálogo (enfoquedigitalohiggins) |
| 🔒 | **EPD Noticias** | `elpatagondomingo.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Epicentro Chile** | `epicentrochile.com` | — | database | sitemap en catálogo (epicentrochile) |
| ✅ | **Fresia Ahora** | `fresiaahora.cl` | Los Lagos | database | sitemap en catálogo (fresiaahora) |
| ✅ | **Frontera Norte** | `fronteranorte.cl` | Arica Y Parinacota | database | sitemap en catálogo (fronteranorte) |
| 🔒 | **FrutillarHoy** | `frutillarhoy.cl` | Los Lagos | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **Grafelberg Noticias** | `grafelbergnoticias.blogspot.com` | Los Lagos | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap; el blog no responde (robots.txt tampoco) |
| 🔒 | **Gran Valparaíso** | `granvalparaiso.cl` | Valparaiso | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Guardián del Sur** | `guardiandelsur.cl` | Los Lagos | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| ✅ | **HDN** | `hdn.cl` | Ohiggins | database | sitemap en catálogo (hdn) |
| ✅ | **Hora de Noticias** | `horadenoticias.cl` | Ohiggins | database | sitemap en catálogo (horadenoticias) |
| 🔒 | **Hoyxhoy** | `hoyxhoy.cl` | — | watchlist | su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquiq |
| ✅ | **Info Tarapacá** | `infotarapaca.cl` | Tarapaca | database | sitemap en catálogo (infotarapaca) |
| ✅ | **Informa Al Minuto** | `informaalminuto.cl` | Los Rios | database | sitemap en catálogo (informaalminuto) |
| ✅ | **Insular FM** | `insularfm.cl` | Los Lagos | database | sitemap en catálogo (insularfm) |
| ✅ | **Iquique Hoy** | `iquiquehoy.cl` | Tarapaca | database | sitemap en catálogo (iquiquehoy) |
| 🔒 | **Iquique Online** | `iquiqueonline.cl` | Tarapaca | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Iquique TV** | `iquiquetv.cl` | Tarapaca | database | sitemap en catálogo (iquiquetv) |
| ✅ | **ITV Patagonia** | `itvpatagonia.com` | Magallanes | database | sitemap en catálogo (itvpatagonia) |
| ✅ | **La Batalla de Maipú** | `labatalla.cl` | Metropolitana | database | sitemap en catálogo (labatalla) |
| 🔒 | **La Discusión** | `ladiscusion.cl` | Nuble | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🟡 | **La Estrella de Arica** | `estrellaarica.cl` | — | watchlist | org de prensa en src/content/organizations/*.md |
| ✅ | **La Estrella de Iquique** | `estrellaiquique.cl` | Tarapaca | database | sitemap en catálogo (estrellaiquique) |
| 🔒 | **La Estrella de Tocopilla** | `estrellatocopilla.cl` | Antofagasta | watchlist | su /sitemap.xml no le pertenece: devuelve los sitemaps de estrellaarica.cl y estrellaiquiq |
| 🔒 | **La Estrella de Valparaíso** | `estrellavalpo.cl` | Valparaiso | watchlist | DNS ENOTFOUND (verificado 27-09-2026) |
| ✅ | **La Fontana** | `lafontana.cl` | Nuble | database | sitemap en catálogo (lafontana) |
| ✅ | **La Hora** | `lahora.cl` | — | database | sitemap en catálogo (la_hora) |
| ✅ | **La Kalle** | `lakalle.cl` | — | watchlist | sitemap en catálogo (lakalle) |
| 🔒 | **La Ligua Noticias** | `laliguanoticias.cl` | Valparaiso | database | wp-sitemap con shards de posts residuales (volumen bajo) |
| ✅ | **La Mega FM** | `lamegafm.cl` | Tarapaca | database | sitemap en catálogo (lamegafm) |
| 🔒 | **La Noticia** | `lanoticia.cl` | Ohiggins | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **La Noticia Online** | `lanoticiaonline.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **La Opinión de Chiloé** | `laopiniondechiloe.cl` | Los Lagos | database | sitemap en catálogo (laopiniondechiloe) |
| 🔒 | **La Opinión Online** | `laopiniononline.cl` | Valparaiso | database | wp-sitemap con shards de posts residuales (volumen bajo) |
| 🔒 | **La Opiñón** | `laopinon.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **La Perla del Limarí** | `laperladellimari.cl` | Coquimbo | database | sitemap en catálogo (laperladellimari) |
| ✅ | **La Prensa Austral** | `laprensaaustral.cl` | Magallanes | database | sitemap en catálogo (laprensaaustral) |
| 🟡 | **La Razón** | `larazon.cl` | Metropolitana | database | referenciado en src/content/sources/*.md |
| 🟡 | **La Región Hoy** | `laregionhoy.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **La Segunda** | `lasegunda.com` | — | watchlist | sitemap en catálogo (lasegunda) |
| ✅ | **La Serena Online** | `laserenaonline.cl` | Coquimbo | database | sitemap en catálogo (laserenaonline) |
| 🟡 | **La Tribuna** | `latribuna.cl` | Biobio | database | referenciado en src/content/sources/*.md |
| ✅ | **La Tribuna de Colchagua** | `latribunadecolchagua.cl` | Ohiggins | database | sitemap en catálogo (latribunadecolchagua) |
| ✅ | **La Unión** | `diariolaunion.cl` | — | watchlist | sitemap en catálogo (diariolaunion) |
| 🟡 | **La Voz de Maipú** | `lavozdemaipu.cl` | Metropolitana | database | referenciado en src/content/sources/*.md |
| 🔒 | **La Voz de Paillaco** | `lavozdepaillaco.cl` | — | watchlist | urlset plano de 3 locs (la home + 2 páginas de categoría), sin artículos |
| ✅ | **La Voz de Pucón** | `lavozdepucon.cl` | Araucania | database | sitemap en catálogo (lavozdepucon) |
| 🔒 | **La Voz de Valdivia** | `lavozdevaldivia.cl` | Los Rios | watchlist | sin sitemap (los 4 endpoints no devuelven locs) |
| 🔒 | **La Voz del Norte** | `lavozdelnorte.cl` | Coquimbo | database | robots.txt declara sitemap.xml y sitemap.rss, ambos con 0 locs |
| ✅ | **Las Noticias de Malleco** | `lasnoticiasdemalleco.cl` | Araucania | database | sitemap en catálogo (lasnoticiasdemalleco) |
| 🔒 | **Las Últimas Noticias** | `lun.com` | — | watchlist | robots.txt (en www) 200 sin línea Sitemap y con `Googlebot: Disallow: /`; el apex falla el |
| ✅ | **Linares en Línea** | `linaresenlinea.cl` | Maule | database | sitemap en catálogo (linaresenlinea) |
| 🔒 | **Linares Noticia** | `linaresnoticia.cl` | Maule | database | DNS ENOTFOUND (verificado) |
| 🔒 | **Los Andes On Line** | `losandesonline.cl` | — | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| ✅ | **Los Lagos al Día** | `loslagosaldia.cl` | Los Lagos | watchlist | sitemap en catálogo (loslagosaldia) |
| ✅ | **Los Ríos Al Día** | `losriosaldia.cl` | — | database | sitemap en catálogo (losriosaldia) |
| ✅ | **Los Ríos Noticias** | `losriosnoticias.cl` | Los Rios | database | sitemap en catálogo (losriosnoticias) |
| 🟡 | **Magallanes Check** | `magallanescheck.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Malleco 7** | `malleco7.cl` | Araucania | database | sitemap en catálogo (malleco7) |
| ✅ | **Margamarga TV** | `margamargatv.cl` | Valparaiso | database | sitemap en catálogo (margamargatv) |
| ✅ | **Más Noticia** | `masnoticia.cl` | Valparaiso | database | sitemap en catálogo (masnoticia) |
| 🔒 | **Maule al Día** | `maulealdia.cl` | Maule | watchlist | los 4 endpoints WP devuelven 0 locs |
| 🔒 | **Maule EE** | `maulee.cl` | Maule | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Maule Hoy** | `maulehoy.cl` | Maule | database | sitemap en catálogo (maulehoy) |
| ✅ | **Mi San Felipe** | `misanfelipe.cl` | — | database | sitemap en catálogo (misanfelipe) |
| ✅ | **Mirada Sur TV** | `miradasurtv.cl` | Los Lagos | database | sitemap en catálogo (miradasurtv) |
| 🔒 | **Montealegre** | `montealegre.cl` | — | database | wp-sitemap con shards de posts residuales (volumen bajo) |
| 🔒 | **Municipalidad de Cobquecura** | `cobquecura.cl` | Nuble | database | verificado sin artículos en el catálogo |
| ✅ | **Nacimentano** | `nacimentano.cl` | Biobio | database | sitemap en catálogo (nacimentano) |
| 🔒 | **Natales Online** | `natalesonline.cl` | Magallanes | watchlist | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| ✅ | **Norte Online** | `norteonline.cl` | Arica Y Parinacota | database | sitemap en catálogo (norteonline) |
| 🔒 | **Norte y Energía** | `norteyenergia.cl` | Antofagasta | database | robots.txt declara sitemap.xml y sitemap.rss, ambos con 0 locs |
| ✅ | **Noticias Biobío** | `noticiasbiobio.cl` | Biobio | database | sitemap en catálogo (noticiasbiobio) |
| ✅ | **Noticias Chiloé** | `noticiaschiloe.cl` | Los Lagos | database | sitemap en catálogo (noticiaschiloe) |
| ✅ | **Noticias del Lago** | `noticiasdellago.cl` | Araucania | database | sitemap en catálogo (noticiasdellago) |
| ✅ | **Noticias del Sur** | `noticiasdelsur.cl` | Araucania | database | sitemap en catálogo (noticiasdelsur) |
| 🟡 | **Noticias Los Ríos** | `noticiaslosrios.cl` | Los Rios | database | referenciado en src/content/sources/*.md |
| ✅ | **Novena Digital** | `novenadigital.cl` | Araucania | database | sitemap en catálogo (novenadigital) |
| ✅ | **Nuevo Poder** | `nuevopoder.cl` | Metropolitana | database | sitemap en catálogo (nuevopoder) |
| ✅ | **Ñuble Actual** | `nubleactual.cl` | Nuble | database | sitemap en catálogo (nubleactual) |
| ✅ | **Ñuble Digital** | `nubledigital.cl` | Nuble | database | sitemap en catálogo (nubledigital) |
| ✅ | **Ñuble Online** | `nubleonline.cl` | Nuble | database | sitemap en catálogo (nubleonline) |
| 🔒 | **Opinión Sur** | `opinionsur.cl` | — | watchlist | su robots declara /sitemap.xml, que devuelve 200 con 0 locs; los otros endpoints dan 404 |
| 🔒 | **Órbita Noticias** | `orbitanoticias.cl` | Nuble | watchlist | los 3 endpoints estándar devuelven HTTP 500 |
| ✅ | **Ovalle Hoy** | `ovallehoy.cl` | Coquimbo | database | sitemap en catálogo (ovallehoy) |
| ✅ | **Ovejero Noticias** | `ovejeronoticias.cl` | Magallanes | database | sitemap en catálogo (ovejeronoticias) |
| ✅ | **Página 7** | `pagina7.cl` | — | watchlist | sitemap en catálogo (pagina7) |
| ✅ | **País Lobo** | `paislobo.cl` | Los Lagos | database | sitemap en catálogo (paislobo) |
| ✅ | **PanoramicAysén** | `panoramicaysen.cl` | Aysen | database | sitemap en catálogo (panoramicaysen) |
| 🔒 | **Parral Actual** | `parralactual.com` | Maule | watchlist | urlset plano de 686 locs sin ningún `<lastmod>` y solo 47 con fecha en el path; casi todos s |
| 🔒 | **Pauta Los Ríos** | `pautalosrios.cl` | Los Rios | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **Periódico Contraplano** | `contraplano.cl` | — | database | robots.txt declara sitemap_index.xml, pero ese y sitemap.xml dan 404 |
| 🔒 | **Periódico Los Ríos** | `periodicolosrios.cl` | Los Rios | watchlist | sin sitemap (los 4 endpoints no devuelven locs) |
| ✅ | **Pichilemu News** | `pichilemunews.cl` | Ohiggins | database | sitemap en catálogo (pichilemunews) |
| ✅ | **Portal Informativo** | `portalinformativo.cl` | Los Lagos | database | sitemap en catálogo (portalinformativo) |
| ✅ | **Prensa Ciudadana** | `prensaciudadana.cl` | Araucania | database | sitemap en catálogo (prensaciudadana) |
| 🔒 | **Prensa Curicó** | `prensacurico.cl` | Maule | watchlist | los 4 endpoints WP (wp-sitemap/sitemap_index/sitemap) devuelven 0 locs |
| ✅ | **Primera Fuente** | `primerafuente.cl` | Maule | database | sitemap en catálogo (primerafuente) |
| 🔒 | **Primera Nota** | `primeranota.cl` | — | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🔒 | **Pto. Williams** | `ptowilliams.cl` | Magallanes | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Pucón TV** | `pucontv.com` | Araucania | database | sitemap_index plano sin sub-sitemaps (flat urlset) |
| 🟡 | **Puente Alto al Día** | `puentealtoaldia.cl` | Metropolitana | watchlist | referenciado en src/content/sources/*.md |
| 🔒 | **Puerto al Día** | `puertoaldia.cl` | Los Lagos | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Pulso Comunal** | `radiopulsocomunal.cl` | Antofagasta | database | su robots declara /sitemap.xml, que devuelve 200 con 0 locs en los 3 endpoints |
| ✅ | **Qué pasa Araucanía** | `quepasaaraucania.cl` | Araucania | database | sitemap en catálogo (quepasaaraucania) |
| ✅ | **Queilen** | `queilen.cl` | Los Lagos | database | sitemap en catálogo (queilen) |
| ✅ | **Quilpué Online** | `quilpueonline.cl` | Valparaiso | database | sitemap en catálogo (quilpueonline) |
| 🔒 | **Quinta Interior** | `quintainterior.cl` | Valparaiso | watchlist | los 4 endpoints WP devuelven 0 locs |
| ✅ | **Quintero** | `quintero.cl` | Valparaiso | database | sitemap en catálogo (quintero) |
| ✅ | **Quirihue Noticias** | `quirihuenoticias.cl` | Nuble | database | sitemap en catálogo (quirihue_noticias) |
| ✅ | **Radio Magallanes** | `radiomagallanes.cl` | Magallanes | database | sitemap en catálogo (radiomagallanes) |
| ✅ | **Radio Maray** | `maray.cl` | Atacama | database | sitemap en catálogo (maray) |
| ✅ | **Radio Pirque** | `radiopirque.cl` | Metropolitana | database | sitemap en catálogo (radiopirque) |
| ✅ | **Radio Polar** | `radiopolar.com` | — | watchlist | sitemap en catálogo (radiopolar) |
| ✅ | **Radio Puerta Norte** | `radiopuertanorte.cl` | Arica Y Parinacota | database | sitemap en catálogo (radiopuertanorte) |
| ✅ | **Radio Santa María** | `radiosantamaria.cl` | Aysen | database | sitemap en catálogo (radiosantamaria) |
| ✅ | **Radio Siente** | `radiosiente.com` | — | database | sitemap en catálogo (radiosiente) |
| ✅ | **Radio Ventisqueros** | `radioventisqueros.cl` | Aysen | database | sitemap en catálogo (radioventisqueros) |
| 🔒 | **Red Araucanía** | `redaraucania.com` | Araucania | watchlist | su robots declara el sitemap de redaraucania.com, pero las 1.001 locs son de otro dominio |
| ✅ | **Red Informativa** | `redinformativa.cl` | Araucania | database | sitemap en catálogo (redinformativa) |
| 🔒 | **Red Maule** | `redmaule.com` | Maule | watchlist | Prontus declara solo sitemap_pags.xml: 1.001 locs SIN ningún `<lastmod>` y sin fecha en el p |
| 🔒 | **Red Valparaíso** | `redvalparaiso.com` | Valparaiso | watchlist | Prontus: sitemap_pags.xml plano de 1.001 locs SIN `<lastmod>` ni fecha en el path, y sin sha |
| 🔒 | **Región 2** | `region2.cl` | — | database | /sitemap.xml es un urlset plano de 500 URLs, sin historia |
| ✅ | **Región de Coquimbo** | `regiondecoquimbo.cl` | Coquimbo | database | sitemap en catálogo (regiondecoquimbo) |
| ✅ | **Región Visual** | `regionvisual.com` | Valparaiso | database | sitemap en catálogo (regionvisual) |
| ✅ | **Regionalista** | `regionalista.cl` | Antofagasta | database | sitemap en catálogo (regionalista) |
| 🟡 | **Regiones Noticias** | `regionesnoticias.cl` | — | database | referenciado en src/content/sources/*.md |
| 🔒 | **Rengo Notas** | `rengonotas.cl` | Ohiggins | watchlist | sin sitemap (los 4 endpoints no devuelven locs) |
| ✅ | **Resonancia Diario** | `resonanciadiario.cl` | Antofagasta | database | sitemap en catálogo (resonanciadiario) |
| 🟡 | **Resumen** | `resumen.cl` | — | watchlist | referenciado en src/content/sources/*.md |
| ✅ | **Río en Línea** | `rioenlinea.cl` | Los Rios | database | sitemap en catálogo (rioenlinea) |
| 🔒 | **Río Negro Un Sueño** | `rionegro.ligup2.com` | Los Lagos | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| ✅ | **Sabes** | `sabes.cl` | — | watchlist | sitemap en catálogo (sabes) |
| ✅ | **Sala de Prensa** | `saladeprensa.cl` | Biobio | database | sitemap en catálogo (saladeprensa) |
| 🔒 | **San Carlos Al Día** | `sancarlosaldia.cl` | Nuble | watchlist | robots declara /sitemap.xml pero responde HTTP 404 |
| ✅ | **San Carlos On Line** | `sancarlosonline.cl` | Nuble | database | sitemap en catálogo (sancarlosonline) |
| 🔒 | **Séptima Página** | `septimapaginanoticias.cl` | — | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 404 |
| ✅ | **Sera Noticia** | `seranoticia.cl` | Maule | database | sitemap en catálogo (seranoticia) |
| ✅ | **Serena y Coquimbo** | `serenaycoquimbo.cl` | Coquimbo | database | sitemap en catálogo (serenaycoquimbo) |
| 🔒 | **Sexta Noticias** | `sextanoticias.cl` | Ohiggins | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| ✅ | **Sitio del Suceso** | `sitiodelsuceso.cl` | Metropolitana | database | sitemap en catálogo (sitiodelsuceso) |
| 🔒 | **SoyAntofagasta** | `soyantofagasta.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **SoyArica** | `soyarica.cl` | — | watchlist | robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs |
| 🔒 | **SoyCalama** | `soycalama.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **SoyChiloé** | `soychiloe.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **SoyConcepción** | `soyconcepcion.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **SoyCopiapó** | `soycopiapo.cl` | — | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **SoyIquique** | `soyiquique.cl` | Tarapaca | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **SoyOsorno** | `soyosorno.cl` | — | watchlist | robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs |
| 🔒 | **SoyPuerto Montt** | `soypuertomontt.cl` | — | watchlist | robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs |
| 🔒 | **SoyQuillota** | `soyquillota.cl` | Valparaiso | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **SoyTemuco** | `soytemuco.cl` | — | watchlist | robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs |
| 🔒 | **SoyValparaíso** | `soyvalparaiso.cl` | Valparaiso | watchlist | fetch failed en sitemap/sitemap_index/wp-sitemap (robots.txt no responde) |
| 🔒 | **Sur Actual** | `suractual.cl` | Los Lagos | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **Tarapacá Online** | `tarapacaonline.cl` | Tarapaca | database | sitemap en catálogo (tarapacaonline) |
| 🔒 | **Tehuelche Noticias** | `tehuelchenoticias.cl` | Aysen | database | Wix: store/sitemap-dru-index.xml responde 0 locs |
| ✅ | **Temuco Diario** | `temucodiario.cl` | Araucania | database | sitemap en catálogo (temucodiario) |
| 🔒 | **Temuco Televisión** | `temucotelevision.cl` | Araucania | database | robots.txt 404 y los 3 endpoints estándar devuelven 404 |
| 🔒 | **Temuco Ya** | `temucoya.cl` | Araucania | database | sitemap mensual WP válido (sitemap-pt-post-YYYY-MM, 76 meses) pero solo ~1.000 artículos: |
| 🔒 | **The Puerto Varas** | `thepuertovaras.cl` | Los Lagos | database | robots.txt declara sitemap.xml y sitemap.rss, ambos con 0 locs |
| ✅ | **Tiempo 21** | `tiempo21.cl` | Araucania | database | sitemap en catálogo (tiempo21) |
| 🔒 | **Tiempo 21 Araucanía** | `tiempo21araucania.cl` | Araucania | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **Tierramarillano** | `tierramarillano.cl` | Atacama | database | sitemap en catálogo (tierramarillano) |
| ✅ | **Timeline** | `timeline.cl` | Antofagasta | database | sitemap en catálogo (timeline_cl) |
| ✅ | **Tomé al Día** | `tomealdia.com` | Biobio | database | sitemap en catálogo (tomealdia) |
| ✅ | **Traiguén City** | `traiguencity.cl` | Araucania | database | sitemap en catálogo (traiguencity) |
| 🔒 | **Tribuna del Biobío** | `tribunadelbiobio.cl` | Biobio | watchlist | robots.txt 200 sin línea Sitemap y los 3 endpoints estándar devuelven 0 locs |
| ✅ | **Tu Región Noticias** | `trnoticias.cl` | Maule | database | sitemap en catálogo (trnoticias) |
| ✅ | **Tus Noticias** | `tusnoticias.cl` | Biobio | database | sitemap en catálogo (tusnoticias) |
| ✅ | **TV Canal 5** | `tvcanal5.cl` | Los Lagos | database | sitemap en catálogo (tvcanal5) |
| ✅ | **TVO San Vicente** | `tvosanvicente.cl` | Ohiggins | database | sitemap en catálogo (tvosanvicente) |
| ✅ | **Vallenar Digital** | `portalweb.vallenardigital.cl` | Atacama | database | sitemap en catálogo (vallenardigital) |
| ✅ | **Valparaíso Noticias** | `valparaisonoticias.cl` | Valparaiso | database | sitemap en catálogo (valparaisonoticias) |
| ✅ | **Vértice TV** | `verticetv.cl` | Los Lagos | database | sitemap en catálogo (verticetv) |
| 🔒 | **Viento Patagón** | `vientopatagon.cl` | Magallanes | watchlist | robots.txt no responde (fetch failed) y los 3 endpoints estándar dan 0 locs |
| ✅ | **Villarrica al Día** | `villarricaldia.cl` | Araucania | database | sitemap en catálogo (villarricaldia) |
| ✅ | **VLN Radio** | `vlnradio.cl` | Maule | database | sitemap en catálogo (vlnradio) |
| ✅ | **Zona Zero** | `zonazero.cl` | Magallanes | database | sitemap en catálogo (zonazero) |

## Leyenda

- ✅ **En catálogo:** el sitemap del medio ya está sincronizado en `sitemaps/<slug>/`.
- 🟡 **En uso:** el medio ya aparece como fuente en `src/content/sources/*.md` o como org de prensa en `src/content/organizations/*.md`, pero su sitemap aún no se sincroniza — prioridad para ampliar el catálogo.
- 🔒 **Sin sitemap:** el sitio fue verificado y no expone sitemap; no reintentar.
- ⬜ **Pendiente:** sitio de prensa sin sitemap en el catálogo ni referencia en el vault.

## Instrucciones para agregar un medio nuevo

1. Verificar el sitemap del sitio (robots.txt o `/sitemap.xml`).
2. Agregar la entrada a `MEDIA` en `scripts/sitemaps/media.mjs` (slug, nombre, sitemaps, filtro).
3. Sincronizar: `pnpm run sitemaps-sync -- <slug>`.
4. Regenerar README/AGENTS: `pnpm run sitemaps-index`.
5. Registrar la org de prensa en `src/content/organizations/*.md` si no existe (regla de wikilinks).
6. Actualizar este archivo: `pnpm run sitemaps-watchlist` (o `--source <ruta>` / `--offline`).
