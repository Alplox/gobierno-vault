# Tareas — Ampliación del catálogo de sitemaps

> Bitácora de sitios de prensa chilenos para sincronizar su sitemap al catálogo
> local (`sitemaps/<medio>/`) y así poder revisar eventos de gobiernos pasados
> con mayor variedad de puntos de vista al verificar datos.
>
> **Fuente de sitios:** [awesome-chilean-rss](https://github.com/Alplox/awesome-chilean-rss)
> — `feeds-database.json` (sitios con feeds verificados) y `watchlist.json`
> (candidatos, muchos sin feed RSS o con solo proxies de Google/Bing News).
> Este archivo se genera con `pnpm run sitemaps-watchlist` (online por defecto) o `pnpm run sitemaps-watchlist -- --source <ruta-al-repo>` / `--offline`.
>
> **Cómo usar:** cada fila pendiente (`⬜`) se sincroniza con
> `pnpm run sitemaps-sync -- <slug>` (tras agregar el medio a `MEDIA` en
> `scripts/sitemaps/sync.mjs`) o se descarta si el sitio no tiene sitemap.
> Los sitios de la watchlist suelen no tener sitemap (solo RSS) — se marcan para
> intentar el sync y registrar el resultado.

## Resumen

- **Total de sitios de prensa listados:** 1001
- ✅ En catálogo local: **423**
- 🟡 Ya usados en el vault (sources.yaml/orgs) sin sitemap: **96**
- 🔒 Verificados sin sitemap: **2**
- ⬜ Pendientes de sincronizar: **480**

Categorías consideradas (prensa y afines): Noticias nacionales, Noticias internacionales, Regional, Gobierno / instituciones, Radio, Partidos políticos, Negocios / economía, Comunidad / sociedad civil, Medio ambiente, Educación, Salud, Cultura.
Se excluyen: deportes, gaming, empleos, entretenimiento y tecnología.

## Sitios por categoría

### Negocios / economía (business)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **(Empresa) Apex Pymes** | `apexpymes.cl` | — | watchlist | feed stale (último item: 2026-04-23, 144 días) |
| ✅ | **(Empresa) Contapapaya** | `contapapaya.cl` | — | database | sitemap en catálogo (contapapaya) |
| ✅ | **(Empresa) Herejía** | `herejia.cl` | — | watchlist | feed stale (último item: 2025-03-23, 541 días) |
| ⬜ | **(Empresa) LionPro** | `lionpro.cl` | — | watchlist | feed stale (último item: 2026-04-06, 162 días) |
| ⬜ | **(Empresa) Logros Servicios Financieros** | `empresaslogros.cl` | — | database | Servicios financieros y contables, con artículos sobre finanzas y asesoría tributaria |
| ✅ | **(Empresa) Nexos Chile** | `nexos.cl` | — | database | sitemap en catálogo (nexos) |
| ✅ | **ABIF** | `abif.cl` | — | database | sitemap en catálogo (abif) |
| 🟡 | **Acero y Roca** | `aceroyroca.com` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **AmCham Chile** | `amchamchile.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **América Economía** | `americaeconomia.com` | — | watchlist | sitio no responde |
| ⬜ | **Análisis.com** | `analisis.com` | — | database | Medio de noticias de economía, mercados y negocios de América Latina |
| ✅ | **AQUA** | `aqua.cl` | — | database | sitemap en catálogo |
| ⬜ | **BancoEstado** | `bancoestado.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Cámara Chilena de la Construcción** | `cchc.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Cámara de Comercio de Santiago** | `ccs.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Chile País Minero** | `chilepaisminero.com` | — | database | sitemap en catálogo (chilepaisminero) |
| ✅ | **Chocale** | `chocale.cl` | — | database | sitemap en catálogo (chocale) |
| ⬜ | **CPC** | `cpc.cl` | — | database | Feed principal de la CPC |
| 🟡 | **Diario Agrícola** | `diarioagricola.com` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Diario Estrategia** | `diarioestrategia.cl` | — | database | sitemap en catálogo (diarioestrategia) |
| ✅ | **Diario Financiero** | `df.cl` | — | database | sitemap en catálogo (df) |
| ⬜ | **Diario Pyme** | `diariopyme.com` | — | watchlist | sitio no responde |
| ⬜ | **Economía y Negocios** | `economiaynegocios.cl` | — | watchlist | sitio no responde |
| ✅ | **El Periódico de la Energía** | `elperiodicodelaenergia.com` | — | database | sitemap en catálogo (elperiodicodelaenergia) |
| ✅ | **Electrominería** | `electromineria.cl` | — | database | sitemap en catálogo (electromineria) |
| ⬜ | **Energía Estratégica** | `energiaestrategica.com` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Estrategia** | `estrategia.cl` | — | watchlist | sitio no responde |
| ✅ | **FISA** | `fisa.cl` | — | watchlist | feed stale (último item: 2026-06-22, 84 días) |
| ⬜ | **Forbes Chile** | `forbeschile.com` | — | watchlist | sitio no responde |
| ⬜ | **Gerencia** | `gerencia.cl` | — | database | Feed principal de Gerencia |
| ⬜ | **ICARE** | `icare.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Instituto de la Construcción** | `iconstruccion.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Los Abogados Laborales** | `losabogadoslaborales.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Marketing4eCommerce Chile** | `marketing4ecommerce.cl` | — | database | Feed principal de Marketing4eCommerce Chile |
| ⬜ | **MCH (Mineria Chilena)** | `mch.cl` | — | database | MCH, medio de comunicación especializado en minería, construcción y energía |
| 🟡 | **Mundo Minería** | `mundomineria.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **NSS** | `nss.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Portal Agro Chile** | `portalagrochile.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Portal del Agro** | `portaldelagro.cl` | — | watchlist | sitio no responde |
| ✅ | **Portal Frutícola** | `portalfruticola.com` | — | database | sitemap en catálogo (portalfruticola) |
| ✅ | **Portal Minero** | `portalminero.com` | — | database | sitemap en catálogo (portalminero) |
| ✅ | **PortalPortuario** | `portalportuario.cl` | — | database | sitemap en catálogo (portalportuario) |
| ⬜ | **Prensa Digital** | `prensadigital.cl` | — | database | Medio chileno de actualidad y economía que cubre empresas, mercados, comercio exterior, tr |
| ⬜ | **Puerto a Puerto** | `puertoapuerto.cl` | Los Lagos | database | Revista regional de Osorno y Puerto Montt sobre economía, salmonicultura, turismo, ciencia |
| ✅ | **pv magazine Latin America** | `pv-magazine-latam.com` | — | database | sitemap en catálogo (pvmagazine) |
| ⬜ | **RBC Asesores** | `rbcasesores.cl` | — | database | Feed principal de RBC Asesores |
| ✅ | **REDIMIN** | `redimin.cl` | — | database | sitemap en catálogo (redimin) |
| ✅ | **Reporte Agrícola** | `reporteagricola.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Reporte Minero** | `reporteminero.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Revista Capital** | `capital.cl` | — | watchlist | sitio no responde |
| ⬜ | **Ruta 2050** | `ruta2050.cl` | — | database | Medio especializado en minería y energía en Chile, con cobertura de cobre, litio, renovabl |
| ⬜ | **SalmonExpert** | `salmonexpert.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **SOFOFA** | `sofofa.cl` | — | database | sitemap en catálogo (sofofa) |
| ⬜ | **Terminal Puerto Arica** | `portal.tpa.cl` | Arica Y Parinacota | watchlist | sitio no responde |
| ⬜ | **The Rio Times** | `riotimesonline.com` | — | database | Publicación en inglés sobre negocios, finanzas, política y comunidades de expatriados en C |
| ⬜ | **TodoLicitaciones Chile** | `todolicitaciones.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **VC Magazine** | `vcmagazine.cl` | Los Lagos | database | Revista digital chilena sobre valor compartido, sostenibilidad, energías renovables, innov |
### Comunidad / sociedad civil (community)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **Aldeas Infantiles SOS Chile** | `aldeasinfantiles.cl` | — | watchlist | sitio no responde |
| ✅ | **Anda** | `anda.cl` | — | database | sitemap en catálogo (anda) |
| ✅ | **ANEF** | `anef.cl` | — | database | sitemap en catálogo (anef) |
| ⬜ | **Atención Chilena** | `atencionchilena.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Bomberos de Chile** | `bomberos.cl` | — | watchlist | sitio no responde |
| ✅ | **Capa9** | `capa9.net` | — | database | sitemap en catálogo (capa9) |
| ✅ | **Chile Travel** | `chile.travel` | — | database | sitemap en catálogo (chiletravel) |
| ⬜ | **ChileMujeres** | `chilemujeres.cl` | — | database | Feed principal de ChileMujeres |
| ✅ | **Coaniquem** | `coaniquem.cl` | — | database | sitemap en catálogo (coaniquem) |
| ⬜ | **CODEPU** | `codepu.cl` | — | database | Corporación de Defensa de los Derechos del Pueblo, con comunicados y noticias sobre derech |
| ✅ | **ComunidadMujer** | `comunidadmujer.cl` | — | database | sitemap en catálogo (comunidadmujer) |
| 🟡 | **Conadecus** | `conadecus.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Corporación La Morada** | `lamorada.cl` | — | watchlist | sitio no responde |
| ⬜ | **Cuerpo de Bomberos de Santiago** | `cbs.cl` | Metropolitana | database | Cuerpo de bomberos voluntarios que publica novedades operativas, institucionales y de capa |
| ⬜ | **Cupones Chile** | `cuponeschile.cl` | — | watchlist | feed stale (último item: 2025-12-02, 286 días) |
| ⬜ | **CUT (Central Unitaria de Trabajadores de Chile)** | `cut.cl` | — | database | Central sindical que representa a trabajadores del sector público y privado en Chile |
| ✅ | **Defensa Civil de Chile** | `defensacivil.cl` | — | database | sitemap en catálogo (defensacivil) |
| ⬜ | **Diario El Itihue** | `diarioelitihue.blogspot.com` | — | database | Blog chileno de noticias comunitarias y crónica social |
| ⬜ | **Diario Mapuche** | `mapuchediario.cl` | Araucania | database | Medio digital basado en Temuco que informa sobre derechos indígenas, territorios, política |
| 🟡 | **FASIC** | `fasic.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Federación CCU** | `federacionccu.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Fonotel** | `fonotel.cl` | — | database | Guía telefónica y directorio de servicios de Chile |
| ⬜ | **Fundación Chile** | `fch.cl` | — | watchlist | feed stale (último item: 2026-03-13, 185 días) |
| ✅ | **Fundación Iguales** | `iguales.cl` | — | database | sitemap en catálogo (iguales) |
| ⬜ | **Fundación Las Rosas** | `lasrosas.cl` | — | watchlist | feed stale (último item: 2020-01-22, 2428 días) |
| ⬜ | **Fundación Paréntesis** | `fundacionparentesis.cl` | — | watchlist | sitio no responde |
| ⬜ | **Fundación Superación de la Pobreza** | `fundacionpobreza.cl` | — | watchlist | sitio no responde |
| ✅ | **Guía Turismo Chile** | `guiaturismo.cl` | — | database | sitemap en catálogo (guiaturismo) |
| ✅ | **Hogar de Cristo** | `hogardecristo.cl` | — | database | sitemap en catálogo (hogardecristo) |
| ⬜ | **Iglesia.cl** | `iglesia.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Los Angeles** | `losangeles.cl` | Biobio | watchlist | sin feed RSS detectado |
| ⬜ | **Mapuche Info** | `mapuche.info` | — | watchlist | feed stale (último item: 2024-08-10, 765 días) |
| ⬜ | **Mapuche NL** | `mapuche.nl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Mastodon Chile** | `mastodon.cl` | — | database | Instancia(s) chilena(s) de Mastodon (red social descentralizada) |
| ⬜ | **Mi Voz** | `comercial.mivoz.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **MUMS** | `mums.cl` | — | database | Movimiento por la Diversidad Sexual en Chile |
| ⬜ | **Observatorio Ciudadano** | `observatorio.cl` | — | database | Organización de derechos humanos y medio ambiente |
| ⬜ | **Observatorio de Gobernanza Migratoria y DDHH** | `ogmdh-chile.org` | — | database | Observatorio de gobernanza migratoria y derechos humanos de Chile |
| ⬜ | **ODECU** | `odecu.cl` | — | database | Organización chilena de consumidores que trabaja en la defensa de los derechos de las pers |
| ⬜ | **Prensa Eventos** | `prensaeventos.cl` | — | database | Portal chileno de noticias y agendas sobre eventos, ferias, congresos, cultura, tecnología |
| ⬜ | **Reddit** | `reddit.com` | — | database | Reddit feeds from various chilean subreddits |
| ⬜ | **Supervivencia y Desastres** | `supervivencia-y-desastres.cl` | — | database | Blog chileno de preparación ante emergencias y supervivencia |
| ⬜ | **TECHO Chile** | `cl.techo.org` | — | database | TECHO, organización que trabaja con comunidades en situación de pobreza en Chile |
| ⬜ | **Teletón Chile** | `teleton.cl` | — | watchlist | HTTP error (403) |
| ⬜ | **Triunfo** | `triunfo.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Turismo en Chile** | `turismoenchile.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Turismochile.cl (Beta)** | `beta.turismochile.cl` | — | watchlist | sitio no responde |
| ⬜ | **UNICEF Chile** | `unicef.org` | — | watchlist | HTTP error (403) |
| 🟡 | **Vicaría de la Solidaridad** | `vicariadelasolidaridad.cl` | — | watchlist | feed stale (último item: 2022-03-10, 1649 días) |
| ✅ | **XOX cl - Recursos e información para emprendedores** | `xox.cl` | — | watchlist | feed stale (último item: 2024-11-28, 655 días) |
### Cultura (culture)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **50 años del Golpe de Estado** | `50.cultura.gob.cl` | — | watchlist | feed stale (último item: 2024-09-10, 734 días) |
| ⬜ | **Balmaceda Arte Joven** | `balmacedartejoven.cl` | — | database | Fundación de formación artística juvenil con sedes en varias regiones |
| ⬜ | **Biblioteca Nacional de Chile** | `bibliotecanacional.gob.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **CaballoyRodeo** | `caballoyrodeo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Centro Cultural La Moneda** | `cclm.cl` | — | database | sitemap en catálogo (cclm) |
| ⬜ | **Centro GAM** | `gam.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Chile Cultura** | `chilecultura.gob.cl` | — | database | Plataforma del Ministerio de las Culturas, las Artes y el Patrimonio |
| ✅ | **Chile es Tuyo** | `chileestuyo.cl` | — | database | sitemap en catálogo (chileestuyo) |
| ⬜ | **CineChile** | `cinechile.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Disorder** | `disorder.cl` | — | watchlist | feed stale (último item: 2023-06-30, 1172 días) |
| ⬜ | **Editorial Quimantú** | `quimantu.cl` | — | database | Editorial chilena independiente con enfoque en cultura, pueblos originarios y literatura m |
| ⬜ | **Espacio Regional** | `espacioregional.cl` | Valparaiso | database | Medio independiente y colaborativo de sociedad, política y cultura, con especial presencia |
| ⬜ | **Fondos Cultura** | `fondosdecultura.cl` | — | database | Sitio de fondos concursables del Ministerio de las Culturas, las Artes y el Patrimonio de |
| ⬜ | **Fundación Cultural de Providencia** | `culturaprovidencia.cl` | — | database | Corporación cultural de la comuna de Providencia, Santiago |
| ⬜ | **Fundación Teatro a Mil** | `teatroamil.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **La Tendencia** | `latendencia.cl` | — | database | sitemap en catálogo (latendencia) |
| 🟡 | **Londres 38** | `londres38.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Memoria Chilena** | `memoriachilena.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Mestizos Magazine** | `mestizos.cl` | — | database | sitemap en catálogo (mestizos) |
| ⬜ | **Museo de Arte Contemporáneo** | `mac.uchile.cl` | — | database | Museo de Arte Contemporáneo de la Universidad de Chile |
| ⬜ | **Museo de la Memoria** | `museodelamemoria.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Museo Nacional de Bellas Artes** | `mnba.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Museo Violeta Parra** | `museovioletaparra.cl` | — | database | sitemap en catálogo (museovioletaparra) |
| ⬜ | **MusicaPopular.cl** | `musicapopular.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Revista Ckuri** | `revistackuri.cl` | Antofagasta | database | Revista digital bimensual sobre artes, culturas, patrimonio y turismo cultural de la Regió |
| ⬜ | **Revista Nos** | `revistanos.cl` | Biobio | database | Revista digital de Concepción con reportajes, columnas, noticias del Biobío y contenidos s |
| ⬜ | **Teatro Municipal de Santiago** | `municipal.cl` | — | watchlist | feed stale (último item: 2022-07-21, 1516 días) |
| ⬜ | **Tell Magazine** | `tell.cl` | Antofagasta | database | Revista digital de Antofagasta sobre sociedad, cultura, eventos y estilo de vida. |
| 🟡 | **Unnie Pop** | `unniepop.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Villa Grimaldi** | `villagrimaldi.cl` | — | database | Corporación Parque por la Paz Villa Grimaldi, sitio de memoria histórica y derechos humano |
### Educación (education)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **Actualidad UDLA** | `actualidad.udla.cl` | — | database | Portal de actualidad e información de la Universidad de Las Américas |
| ⬜ | **ANID** | `anid.cl` | — | database | Agencia Nacional de Investigación y Desarrollo |
| ⬜ | **Ayuda Mineduc** | `ayudamineduc.cl` | — | watchlist | feed stale (último item: 2021-10-25, 1785 días) |
| ✅ | **CEP Chile** | `cepchile.cl` | — | database | sitemap en catálogo (cepchile) |
| ✅ | **CLAPES UC** | `clapesuc.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Colegio Alemán de Santiago** | `dsstgo.cl` | — | database | sitemap en catálogo (dsstgo) |
| ⬜ | **Colegio Atenea** | `colegioatenea.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Colegio Cordillera** | `colegiocordillera.cl` | — | database | sitemap en catálogo (colegiocordillera) |
| ⬜ | **Colegio de Profesores** | `colegiodeprofesores.cl` | — | database | Feed principal del Colegio de Profesores de Chile |
| ✅ | **Colegio San Ignacio El Bosque** | `sanignacio.cl` | — | database | sitemap en catálogo (sanignacio) |
| ✅ | **Colegio Tabancura** | `tabancura.cl` | — | database | sitemap en catálogo (tabancura) |
| ⬜ | **Colegio Verbo Divino** | `verbodivino.cl` | — | database | Colegio privado de Santiago |
| ⬜ | **Comunidad Escolar** | `comunidadescolar.cl` | — | database | Portal de noticias del sistema escolar chileno, dirigido a sostenedores y comunidades educ |
| ⬜ | **CONICYT** | `conicyt.cl` | — | database | Feed principal de CONICYT |
| ⬜ | **DaemsPP** | `daemspp.cl` | — | database | Feed principal de DaemsPP |
| ⬜ | **Diario UACh** | `diario.uach.cl` | — | database | Medio institucional de la Universidad Austral de Chile con noticias sobre su comunidad, in |
| ⬜ | **Dirección de Educación Pública** | `dep.gob.cl` | — | database | Portal oficial de la Dirección de Educación Pública del Ministerio de Educación de Chile |
| ⬜ | **Espacio Público** | `espaciopublico.cl` | — | database | Centro de estudios independiente que investiga y propone políticas públicas orientadas al |
| ✅ | **Explora** | `explora.cl` | — | database | sitemap en catálogo (explora) |
| ⬜ | **FLACSO Chile** | `flacsochile.org` | — | database | Institución académica dedicada a la investigación, formación y análisis de temas sociales, |
| ⬜ | **Instituto Nacional** | `institutonacional.cl` | — | database | Liceo público de Santiago |
| ✅ | **JUNJI** | `junji.cl` | — | database | sitemap en catálogo (junji) |
| ⬜ | **Kdoce** | `kdoce.cl` | — | database | Portal de noticias de educación, innovación y tecnología educativa en Chile |
| ⬜ | **Libertad y Desarrollo** | `lyd.org` | — | database | Centro de estudios e investigación chileno dedicado al análisis de políticas públicas, eco |
| ⬜ | **Liceo Brainstorm Temuco** | `liceobrainstorm.cl` | — | database | Liceo particular de Temuco |
| ✅ | **Liceo de Aplicación** | `liceodeaplicacion.cl` | — | database | sitemap en catálogo (liceodeaplicacion) |
| ⬜ | **Liceo N°1 Javiera Carrera** | `liceo1.cl` | — | database | Liceo público de Santiago |
| ⬜ | **Noticias de la Universidad del Bío-Bío** | `noticias.ubiobio.cl` | Biobio | database | Portal de actualidad de la Universidad del Bío-Bío sobre investigación, docencia, vida est |
| 🟡 | **Observatorio de Datos UAI** | `observatoriodedatos.uai.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Portal Educa** | `portaleduca.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Profesor en línea** | `profesorenlinea.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **PUC (Pontificia Universidad Católica)** | `uc.cl` | — | database | Noticias e investigación de la PUC |
| ✅ | **PUCV** | `pucv.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Red Educacional Crecemos** | `redcrecemos.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Repositorio Académico de la Universidad de Chile** | `repositorio.uchile.cl` | — | database | Repositorio institucional que preserva y distribuye publicaciones académicas de la Univers |
| ⬜ | **Revista de Sociología** | `revistadesociologia.uchile.cl` | — | watchlist | sitio no responde |
| ⬜ | **Revista Signos. Estudios de Lingüística** | `revistasignos.cl` | — | watchlist | feed stale (último item: 2026-08-14, 32 días) |
| ✅ | **Saint George's College** | `saintgeorge.cl` | — | watchlist | feed stale (último item: 2022-09-04, 1472 días) |
| ✅ | **SIP Red de Colegios** | `sip.cl` | — | database | sitemap en catálogo (sip) |
| ⬜ | **Sistema de Admisión Escolar** | `sistemadeadmisionescolar.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **SLEP Licancabur** | `sleplicancabur.cl` | Antofagasta | database | Servicio Local de Educación Pública que administra establecimientos de Calama, Ollagüe, Sa |
| ⬜ | **SLEP Tamarugal** | `sleptamarugal.gob.cl` | Tarapaca | database | Servicio Local de Educación Pública que administra 45 establecimientos de cinco comunas de |
| ✅ | **The Grange School** | `grange.cl` | — | database | sitemap en catálogo (grange) |
| ⬜ | **U. del Bío-Bío** | `ubiobio.cl` | — | watchlist | sitio no responde |
| ⬜ | **UACh** | `uach.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **UCSC** | `ucsc.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Universia Chile** | `noticias.universia.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Universidad Adolfo Ibáñez** | `uai.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Universidad Andrés Bello** | `unab.cl` | — | database | sitemap en catálogo (unab) |
| ✅ | **Universidad Autónoma de Chile** | `uautonoma.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Universidad Católica del Norte** | `ucn.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Universidad de Antofagasta** | `uantof.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Universidad de Chile** | `uchile.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Universidad de Concepción** | `noticias.udec.cl` | — | database | sitemap en catálogo (udec) |
| ✅ | **Universidad de La Frontera** | `ufro.cl` | — | database | sitemap en catálogo |
| ✅ | **Universidad de Las Américas** | `udla.cl` | — | watchlist | feed stale (último item: 2026-07-02, 74 días) |
| ✅ | **Universidad de Los Lagos** | `ulagos.cl` | — | database | sitemap en catálogo (ulagos) |
| ✅ | **Universidad de Talca** | `utalca.cl` | — | database | sitemap en catálogo |
| ⬜ | **Universidad de Valparaíso** | `uv.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Universidad Diego Portales** | `udp.cl` | — | database | sitemap en catálogo |
| ✅ | **Universidad Mayor** | `umayor.cl` | — | watchlist | sin feed RSS detectado |
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
| ✅ | **ACERA** | `acera.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Aguas Andinas** | `aguasandinas.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Chile Sustentable** | `chilesustentable.net` | — | watchlist | sin feed RSS detectado |
| ✅ | **CODEFF** | `codeff.cl` | — | database | sitemap en catálogo |
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
| ⬜ | **Induambiente** | `induambiente.cl` | — | watchlist | feed stale (último item: 2015-12-30, 3911 días) |
| ⬜ | **InfoSalmon** | `infosalmon.cl` | — | database | Plataforma de difusión de conocimiento técnico y científico sobre acuicultura y salmonicul |
| ✅ | **Instituto Antártico Chileno** | `inach.cl` | — | database | sitemap en catálogo |
| ⬜ | **Instituto de Ecología y Biodiversidad** | `ie-b.cl` | — | watchlist | sitio no responde |
| ✅ | **Ladera Sur** | `laderasur.com` | — | database | sitemap en catálogo |
| ✅ | **Meteored Chile** | `meteored.cl` | — | database | sitemap en catálogo |
| ✅ | **Oceana Chile** | `oceana.org` | — | watchlist | HTTP error (404) |
| 🟡 | **OLCA** | `olca.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Patagonia.cl** | `patagonia.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Revista Ecociencias** | `revistaecociencias.cl` | — | database | Revista digital chilena dedicada a la divulgación de ciencia, naturaleza, biodiversidad, s |
| ⬜ | **Semillas de Agua** | `semillasdeagua.cl` | — | watchlist | feed stale (último item: 2015-10-18, 3984 días) |
| ⬜ | **Sostenibilidad UNAB** | `sostenibilidad.unab.cl` | — | database | Portal institucional de la UNAB sobre sostenibilidad, gestión ambiental y carbono neutrali |
| ⬜ | **Superintendencia del Medio Ambiente** | `portal.sma.gob.cl` | — | database | Organismo nacional que publica fiscalizaciones, sanciones, proyectos, permisos y medidas a |
| ⬜ | **Tierra Adentro** | `tierraadentro.cl` | — | watchlist | sitio no responde |
| ⬜ | **WCS Chile** | `chile.wcs.org` | — | watchlist | sin feed RSS detectado |
| ✅ | **WWF Chile** | `wwf.cl` | — | watchlist | sin feed RSS detectado |
### Gobierno / instituciones (government)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **Ammot** | `ammot.cl` | — | watchlist | feed stale (último item: 2026-03-27, 171 días) |
| ⬜ | **ANCI** | `anci.gob.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **ANEPE** | `anepe.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **ANIP** | `funcionariopublico.cl` | — | watchlist | feed stale (último item: 2025-05-26, 476 días) |
| 🟡 | **Banco Central de Chile** | `bcentral.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Biblioteca del Congreso Nacional (BCN)** | `bcn.cl` | — | database | Biblioteca del Congreso Nacional de Chile - Servicios de información legislativa y parlame |
| ⬜ | **Cámara de Diputadas y Diputados** | `camara.cl` | — | watchlist | HTTP error (403) |
| ⬜ | **Chile** | `chile.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **ChileAtiende** | `chileatiende.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **ChileCompra** | `chilecompra.cl` | — | database | Plataforma estatal de licitaciones y compras públicas |
| 🟡 | **Comisión Nacional de Energía** | `cne.cl` | — | watchlist | feed stale (último item: 2025-05-30, 472 días) |
| ✅ | **CONAF** | `conaf.cl` | — | database | sitemap en catálogo (conaf) |
| ✅ | **Consejo para la Transparencia** | `consejotransparencia.cl` | — | database | sitemap en catálogo (consejotransparencia) |
| ⬜ | **Contraloría General** | `contraloria.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **CORFO** | `corfo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Defensoría de la Niñez** | `defensorianinez.cl` | — | database | sitemap en catálogo (defensorianinez) |
| ⬜ | **Delegación Presidencial Regional La Araucanía** | `dprlaaraucania.dpr.gob.cl` | Araucania | watchlist | sin feed RSS detectado |
| 🟡 | **Diario Constitucional** | `diarioconstitucional.cl` | — | watchlist | HTTP error (403) |
| ⬜ | **Diario Oficial** | `diariooficial.interior.gob.cl` | — | watchlist | feed stale (último item: 2017-06-13, 3380 días) |
| ⬜ | **DICREP** | `dicrep.gob.cl` | — | database | Dirección General del Crédito Prendario: trámites, créditos, remates, subastas y economía |
| ⬜ | **Dirección de Presupuestos** | `dpp.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Dirección de Vialidad** | `vialidad.mop.gob.cl` | — | database | Portal oficial de la Dirección de Vialidad del MOP sobre caminos, rutas, obras, seguridad |
| ⬜ | **Dirección del Trabajo** | `dt.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🔒 | **EFE** | `efe.cl` | — | database | verificado sin sitemap (solo RSS /feed/) |
| 🔒 | **Fiscalía de Chile** | `fiscaliadechile.cl` | — | database | verificado sin sitemap (Drupal 10 sin xmlsitemap) |
| ✅ | **Gobierno de Chile** | `gob.cl` | — | database | sitemap en catálogo (gob) |
| ⬜ | **Gobierno en Terreno** | `gobiernoenterreno.interior.gob.cl` | — | watchlist | feed stale (último item: 2026-06-05, 101 días) |
| ✅ | **Gobierno Regional de Tarapacá** | `goretarapaca.gov.cl` | — | database | sitemap en catálogo (goretarapaca) |
| ✅ | **Gobierno Regional Metropolitano de Santiago** | `gobiernosantiago.cl` | — | database | sitemap en catálogo (gobiernosantiago) |
| ⬜ | **Ilustre Municipalidad de Santiago** | `munistgo.cl` | — | database | Ilustre Municipalidad de Santiago, sitio oficial con noticias, trámites y servicios munici |
| ⬜ | **INE** | `ine.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Instituto de Salud Pública** | `ispch.cl` | — | database | sitemap en catálogo |
| ⬜ | **MarcaChile** | `marcachile.cl` | — | database | Portal oficial de Marca Chile sobre exportación, turismo e internacionalización del país. |
| ⬜ | **MercadoPublico** | `mercadopublico.cl` | — | database | Plataforma oficial de compras públicas y licitaciones del Estado de Chile |
| ⬜ | **Metro de Santiago** | `metro.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Ministerio de Agricultura** | `minagri.gob.cl` | — | watchlist | sitio no responde |
| ✅ | **Ministerio de Bienes Nacionales** | `bienesnacionales.cl` | — | database | sitemap en catálogo (bienesnacionales) |
| 🟡 | **Ministerio de Ciencia, Tecnología, Conocimiento e Innovación** | `minciencia.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Ministerio de Desarrollo Social y Familia** | `desarrollosocialyfamilia.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Ministerio de Economía, Fomento y Turismo** | `economia.gob.cl` | — | database | sitemap en catálogo (economia) |
| ✅ | **Ministerio de Educación** | `mineduc.cl` | — | database | sitemap en catálogo |
| ⬜ | **Ministerio de Energía** | `energia.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Ministerio de Hacienda** | `hacienda.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Ministerio de Justicia y Derechos Humanos** | `minjusticia.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Ministerio de la Mujer y la Equidad de Género** | `minmujeryeg.gob.cl` | — | database | sitemap en catálogo |
| ⬜ | **Ministerio de las Culturas, las Artes y el Patrimonio** | `cultura.gob.cl` | — | database | Sitio oficial del Ministerio de las Culturas, las Artes y el Patrimonio de Chile |
| ⬜ | **Ministerio de Minería** | `minmineria.cl` | — | watchlist | sitio no responde |
| ✅ | **Ministerio de Obras Públicas** | `mop.gob.cl` | — | database | sitemap en catálogo (mop) |
| ✅ | **Ministerio de Relaciones Exteriores** | `minrel.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Ministerio de Salud** | `minsal.cl` | — | database | sitemap en catálogo |
| ✅ | **Ministerio de Transportes y Telecomunicaciones** | `mtt.gob.cl` | — | database | sitemap en catálogo (mtt) |
| ✅ | **Ministerio de Vivienda y Urbanismo** | `minvu.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Ministerio del Deporte** | `mindep.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Ministerio del Interior** | `interior.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Ministerio del Medio Ambiente** | `mma.gob.cl` | — | database | sitemap en catálogo (mma) |
| ✅ | **Ministerio del Trabajo y Previsión Social** | `mintrab.gob.cl` | — | database | sitemap en catálogo (mintrab) |
| 🟡 | **Ministerio Secretaría General de Gobierno** | `msgg.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Ministerio Secretaría General de la Presidencia** | `minsegpres.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Municipalidad de Alto Biobío** | `munialtobiobio.cl` | — | watchlist | feed stale (último item: 2026-08-14, 31 días) |
| ⬜ | **Municipalidad de Arica** | `muniarica.cl` | Arica Y Parinacota | watchlist | sin feed RSS detectado |
| ⬜ | **Municipalidad de Providencia** | `providencia.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Municipalidad de Puerto Montt** | `puertomontt.cl` | Los Lagos | database | referenciado en src/content/sources/*.md |
| ✅ | **Municipalidad de Traiguén** | `mtraiguen.cl` | Araucania | watchlist | sin feed RSS detectado |
| ⬜ | **Municipalidad de Viña del Mar** | `munivina.cl` | — | database | Sitio oficial de la Ilustre Municipalidad de Viña del Mar |
| ⬜ | **Poder Judicial** | `pjud.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Prensa Presidencia** | `prensa.presidencia.cl` | — | watchlist | sitio no responde |
| ⬜ | **ProChile** | `prochile.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Publilegales** | `publilegales.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Radio Cámara** | `radiocamara.cl` | — | database | sitemap en catálogo |
| ⬜ | **SEA Chile** | `sea.gob.cl` | — | watchlist | feed stale (último item: 2025-12-09, 279 días) |
| ⬜ | **SENADIS** | `senadis.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Senado** | `senado.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **SENAPRED** | `senapred.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **SENCE** | `sence.gob.cl` | — | database | sitemap en catálogo |
| ✅ | **SENDA** | `senda.gob.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **SERNAC** | `sernac.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **SERNATUR (Servicio Nacional de Turismo)** | `sernatur.cl` | — | database | sitemap en catálogo (sernatur) |
| ⬜ | **Servicio Agrícola y Ganadero** | `sag.gob.cl` | — | database | Sitio oficial del Servicio Agrícola y Ganadero de Chile - Noticias del sector agropecuario |
| ⬜ | **Servicio de Impuestos Internos** | `sii.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Servicio Hidrográfico y Oceanográfico de la Armada (SHOA)** | `shoa.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Servicio Hidrográfico y Oceanográfico de la Armada de Chile** | `snamchile.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Servicio Nacional de Aduanas** | `aduana.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Servicio Nacional de Migraciones** | `serviciomigraciones.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **SP (Superintendencia de Pensiones)** | `spensiones.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Subsecretaría de Turismo** | `subturismo.gob.cl` | — | database | sitemap en catálogo |
| ✅ | **Subsecretaría del Trabajo** | `subtrab.gob.cl` | — | database | sitemap en catálogo (subtrab) |
| ✅ | **SUBTEL (Subsecretaría de Telecomunicaciones)** | `subtel.gob.cl` | — | database | sitemap en catálogo (subtel) |
| ⬜ | **Superintendencia de Salud** | `supersalud.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **SUSESO (Superintendencia de Seguridad Social)** | `suseso.gob.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Tesorería General de la República** | `tgr.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Transparencia Activa Presidencia** | `transparenciaactiva.presidencia.cl` | — | watchlist | sitio no responde |
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
| ✅ | **Colegio de Enfermeras de Chile** | `colegiodeenfermeras.cl` | — | watchlist | feed stale (último item: 2026-02-19, 207 días) |
| ✅ | **Colegio Médico de Chile** | `colegiomedico.cl` | — | database | sitemap en catálogo (colegiomedico) |
| ✅ | **Cruz Roja Chilena** | `cruzroja.cl` | — | database | sitemap en catálogo (cruzroja) |
| ⬜ | **Escuela de Salud Pública U. de Chile** | `escuela.medicina.uchile.cl` | — | watchlist | sitio no responde |
| ✅ | **Fonasa** | `fonasa.cl` | — | database | sitemap en catálogo |
| ⬜ | **Fundación Gabriel** | `fundaciongabriel.cl` | — | watchlist | sitio no responde |
| ⬜ | **Fundación IPSUSS** | `ipsuss.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Fundación Nuestros Hijos** | `fnch.cl` | — | watchlist | sitio no responde |
| ⬜ | **Hospital Clínico U. de Chile** | `hospitalclinico.uchile.cl` | — | watchlist | sitio no responde |
| ⬜ | **Hospital Clínico UFRO** | `hospitalclinicoufro.cl` | — | watchlist | sitio no responde |
| ⬜ | **Hospital Digital** | `hospitaldigital.minsal.cl` | — | watchlist | sitio no responde |
| ⬜ | **Instituto de Seguridad Laboral** | `isl.gob.cl` | — | database | Institución nacional dedicada a la prevención de accidentes laborales, la seguridad en el |
| ⬜ | **Instituto Nacional del Tórax** | `torax.cl` | — | watchlist | feed stale (último item: 2026-08-07, 38 días) |
| ⬜ | **Medwave** | `medwave.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Observatorio de Salud Pública UC** | `observatorio.medicina.uc.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Pediatría y Salud** | `pediatriaysalud.cl` | — | watchlist | feed stale (último item: 2026-05-24, 113 días) |
| ✅ | **Portal Red Salud** | `portalredsalud.cl` | — | database | sitemap en catálogo (portalredsalud) |
| ⬜ | **Revista Chilena de Pediatría** | `revistachilenadepediatria.cl` | — | watchlist | HTTP error (403) |
| ⬜ | **Revista Médica de Chile** | `revistamedicadechile.cl` | — | database | Revista Médica de Chile, publicación científica |
| ⬜ | **Salud Responde** | `saludresponde.minsal.cl` | — | database | Portal de información del Ministerio de Salud para la ciudadanía |
| ⬜ | **Servicio de Salud Chiloé** | `sschiloe.redsalud.gob.cl` | — | database | Organismo público que articula la red de atención de salud en la provincia de Chiloé |
| ✅ | **Sociedad Chilena de Cardiología y Cirugía Cardiovascular** | `sochicar.cl` | — | database | sitemap en catálogo (sochicar) |
| ✅ | **Sociedad Chilena de Endocrinología y Diabetes** | `soched.cl` | — | database | sitemap en catálogo (soched) |
| ⬜ | **Sociedad Chilena de Infectología** | `sochinf.cl` | — | watchlist | HTTP error (429) |
| ✅ | **Sociedad Chilena de Obesidad** | `sochob.cl` | — | database | sitemap en catálogo (sochob) |
| ⬜ | **Sociedad Chilena de Pediatría** | `sochipe.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Sociedad de Cirugía de Chile** | `sociedadcirugia.cl` | — | watchlist | sitio no responde |
### Noticias nacionales (news)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **123.cl** | `noticias.123.cl` | — | watchlist | sitio no responde |
| ✅ | **24 Horas** | `24horas.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **aDiarioCR** | `adiariocr.com` | — | database | sitemap en catálogo (adiariocr) |
| ✅ | **ADN Radio** | `adnradio.cl` | — | database | sitemap en catálogo (adnradio) |
| ✅ | **Agencia de Noticias** | `agenciadenoticias.org` | — | database | sitemap en catálogo (agenciadenoticias) |
| ⬜ | **Amarillos por Chile** | `amarillosxchile.cl` | — | watchlist | sitio no responde |
| ✅ | **Aurora Noticias** | `auroranoticias.cl` | — | database | sitemap en catálogo (auroranoticias) |
| ✅ | **Base Nacional** | `basenacional.cl` | — | database | sitemap en catálogo (basenacional) |
| ✅ | **BioBioChile** | `biobiochile.cl` | — | database | sitemap en catálogo (biobiochile) |
| 🟡 | **Cambio21** | `cambio21.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Canal 13** | `13.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Canal de Noticias** | `canaldenoticias.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **CentralWeb** | `centralweb.cl` | — | database | sitemap en catálogo (centralweb) |
| 🟡 | **Chile Mejor Sin TLC** | `mejorsintlc.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Chile21** | `chile21.cl` | — | database | Centro de pensamiento que desarrolla investigación y propuestas sobre políticas públicas, |
| ✅ | **Chilena FM** | `chilenafm.cl` | — | database | sitemap en catálogo |
| ⬜ | **Chilenews** | `chilenews.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **ChileNoticias** | `chilenoticias.cl` | — | database | sitemap en catálogo |
| ✅ | **Chilevisión** | `chilevision.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Ciper Chile** | `ciperchile.cl` | — | database | sitemap en catálogo (ciper) |
| ✅ | **CNN Chile** | `cnnchile.com` | — | watchlist | sin feed RSS detectado |
| ✅ | **Cóndor** | `condor.cl` | Metropolitana | database | sitemap en catálogo (condor) |
| ✅ | **Contingencia Chile** | `contingenciachile.cl` | — | database | sitemap en catálogo (contingenciachile) |
| ✅ | **Contrapoder Chile** | `contrapoderchile.cl` | — | database | sitemap en catálogo (contrapoderchile) |
| ✅ | **Correo de los Trabajadores** | `cctt.cl` | — | database | sitemap en catálogo |
| ⬜ | **CREAS UAH** | `creas.uahurtado.cl` | — | watchlist | feed stale (último item: 2014-12-31, 4275 días) |
| 🟡 | **Crónicas de Chile** | `cronicasdechile.cl` | — | watchlist | sitio no responde |
| 🟡 | **Dalenoticias** | `dalenoticias.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Desenfoque** | `desenfoque.cl` | — | database | sitemap en catálogo (desenfoque) |
| ✅ | **Diario Chile** | `diariochile.cl` | — | database | sitemap en catálogo (diariochile) |
| ⬜ | **Diario El Observador** | `diarioelobservador.cl` | — | watchlist | sitio no responde |
| ⬜ | **Diario El Progreso** | `diarioelprogreso.cl` | — | watchlist | sitio no responde |
| ⬜ | **Diario Informativo** | `diarioinformativo.cl` | — | watchlist | sitio no responde |
| ⬜ | **Diario La Portada** | `diariolaportada.cl` | — | watchlist | sitio no responde |
| ⬜ | **Diario La Tribuna** | `diariolatribuna.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario USACH** | `diariousach.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Arrebato** | `elarrebato.cl` | — | database | sitemap en catálogo (elarrebato) |
| ✅ | **El Ciudadano** | `elciudadano.com` | — | database | sitemap en catálogo (elciudadano) |
| ✅ | **El Clarín de Chile** | `elclarin.cl` | — | database | sitemap en catálogo (elclarin) |
| ✅ | **El Corto** | `elcorto.cl` | — | database | sitemap en catálogo |
| ✅ | **El Definido** | `eldefinido.cl` | — | watchlist | sitio no responde |
| ⬜ | **El Desarrollo** | `eldesarrollo.cl` | — | database | Medio chileno de noticias y análisis sobre tecnología, economía, política, sociedad y terr |
| ✅ | **El Desconcierto** | `eldesconcierto.cl` | — | database | sitemap en catálogo (eldesconcierto) |
| 🟡 | **El Diario de Santiago** | `eldiariodesantiago.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **El Diario Santiago** | `eldiariosantiago.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **El Dínamo** | `eldinamo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Filtrador** | `elfiltrador.com` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Gong** | `diarioelgong.cl` | — | watchlist | feed stale (último item: 2025-01-13, 609 días) |
| 🟡 | **El Hilo** | `elhilo.cl` | — | watchlist | sitio no responde |
| ✅ | **El Informador Chile** | `elinformadorchile.cl` | — | database | sitemap en catálogo (elinformadorchile) |
| ✅ | **El Lanquihue** | `ellanquihue.cl` | Los Lagos | database | sitemap en catálogo |
| ✅ | **El Líbero** | `ellibero.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Libertario** | `ellibertario.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Mercurio (Edición Impresa)** | `impresa.elmercurio.com` | — | watchlist | sitio no responde |
| ✅ | **El Minuto** | `elminuto.cl` | — | database | sitemap en catálogo (elminuto) |
| ✅ | **El País - Chile** | `elpais.com` | — | database | sitemap en catálogo (elpais) |
| ✅ | **El Periscopio** | `elperiscopio.cl` | — | database | sitemap en catálogo (elperiscopio) |
| ✅ | **El Quinto Poder** | `elquintopoder.cl` | — | database | sitemap en catálogo (elquintopoder) |
| ✅ | **El Radar** | `elradar.cl` | — | database | sitemap en catálogo (elradar) |
| ⬜ | **El Regionalista** | `elregionalista.cl` | — | database | Feed principal de El Regionalista |
| 🟡 | **El Reporte Diario** | `reportediario.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **El Siglo** | `elsiglo.cl` | — | database | sitemap en catálogo (elsiglo) |
| 🟡 | **El Telescopio** | `eltelescopio.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **El Vigilante** | `elvigilante.cl` | — | watchlist | feed stale (último item: 2026-05-27, 110 días) |
| ✅ | **Emol** | `emol.com` | — | database | sitemap en catálogo (emol) |
| ⬜ | **En la Ciudad** | `enlaciudad.cl` | — | database | Blog de noticias locales en Blogger, con secciones de economía, tecnología, deportes y act |
| ✅ | **Entérate Hoy** | `enteratehoy.cl` | — | watchlist | feed stale (último item: 2024-08-29, 746 días) |
| ⬜ | **Esperanza FM** | `esperanzafm.cl` | Araucania | database | Emisora regional parte de la región del Bio Bio y Los Lagos 101.3 FM |
| ✅ | **Está Pasando** | `estapasando.cl` | — | database | sitemap en catálogo (estapasando) |
| ✅ | **Ex-Ante** | `ex-ante.cl` | Metropolitana | database | sitemap en catálogo (ex_ante) |
| ✅ | **Fact Checking UC** | `factchecking.cl` | — | watchlist | feed stale (último item: 2026-06-02, 105 días) |
| ✅ | **Factos** | `factos.cl` | — | database | sitemap en catálogo (factos) |
| ✅ | **FastCheckCL** | `fastcheck.cl` | — | database | sitemap en catálogo (fastcheck) |
| ⬜ | **Futura FM** | `futurafm.cl` | Maule | database | Emisora regional de Talca 100.7 FM |
| ✅ | **G5 Noticias** | `g5noticias.cl` | — | database | sitemap en catálogo |
| ⬜ | **G80** | `g80.cl` | — | watchlist | sitio no responde |
| 🟡 | **Gamba.cl** | `gamba.cl` | — | watchlist | HTTP error (403) |
| ⬜ | **Google News** | `news.google.com` | — | database | Segregador de noticias de Google |
| ⬜ | **Hoy** | `hoy.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Infogate** | `infogate.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Informe:Chile** | `informechile.cl` | — | watchlist | feed stale (último item: 2026-05-31, 106 días) |
| ✅ | **INoticias.CL** | `inoticias.cl` | — | database | sitemap en catálogo |
| 🟡 | **Interferencia** | `interferencia.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **La Coyuntura** | `lacoyuntura.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **La Cuarta** | `lacuarta.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **La Estrella de Antofagasta** | `estrellaantofagasta.cl` | — | watchlist | feed stale (último item: 2020-07-02, 2265 días) |
| ✅ | **La Estrella de Chiloé** | `laestrellachiloe.cl` | Los Lagos | database | sitemap en catálogo |
| ⬜ | **La Estrella de Concepción** | `estrellaconcepcion.cl` | — | watchlist | feed stale (último item: 2021-07-10, 1892 días) |
| ✅ | **La Estrella del Loa** | `estrellaloa.cl` | — | watchlist | feed stale (último item: 2020-05-09, 2319 días) |
| ✅ | **La Izquierda Diario** | `laizquierdadiario.cl` | — | database | sitemap en catálogo (laizquierdadiario) |
| ✅ | **La Máquina Medio** | `lamaquinamedio.com` | — | database | sitemap en catálogo (lamaquinamedio) |
| ✅ | **La Nación** | `lanacion.cl` | — | database | sitemap en catálogo (lanacion) |
| 🟡 | **La Segunda** | `lasegunda.cl` | — | watchlist | sitio no responde |
| ⬜ | **La Segunda (Edición Impresa)** | `impresa.lasegunda.com` | — | watchlist | sitio no responde |
| ✅ | **La Tercera** | `latercera.com` | — | database | sitemap en catálogo (latercera) |
| ✅ | **La Voz de los que Sobran** | `lavozdelosquesobran.cl` | — | database | sitemap en catálogo (lavozdelosquesobran) |
| ⬜ | **Libertad Digital** | `libertaddigital.cl` | — | watchlist | sitio no responde |
| ⬜ | **M360** | `m360.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Magia Digital** | `magiadigital.cl` | — | watchlist | feed stale (último item: 2026-06-23, 83 días) |
| ✅ | **Mala Espina** | `malaespinacheck.cl` | — | database | sitemap en catálogo (malaespina) |
| ⬜ | **Mapuche Nation** | `mapuche-nation.org` | — | database | Portal de noticias mapuche |
| ⬜ | **Mapuexpress** | `mapuexpress.org` | — | watchlist | sitio no responde |
| ✅ | **Mediabanco** | `mediabanco.com` | — | database | sitemap en catálogo (mediabanco) |
| 🟡 | **Mega** | `mega.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Meganoticias** | `meganoticias.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Megatiempo** | `megatiempo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Mercurio de Antofagasta** | `mercurioantofagasta.cl` | Antofagasta | database | sitemap en catálogo |
| ✅ | **Mercurio de Calama** | `mercuriocalama.cl` | Antofagasta | database | sitemap en catálogo |
| ✅ | **Mi Radio LS** | `miradiols.cl` | — | database | sitemap en catálogo (miradiols) |
| ⬜ | **MQN (Más Que Noticias)** | `mqn.cl` | — | database | Medio digital con noticias de Chile sobre actualidad, deportes, economía y tecnología |
| ✅ | **Música y Noticias** | `musicaynoticias.cl` | — | database | sitemap en catálogo (musicaynoticias) |
| ✅ | **Nostálgica** | `nostalgica.cl` | — | database | sitemap en catálogo (nostalgica) |
| 🟡 | **NotiChile** | `notichile.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Noticias Importantes** | `noticiasimportantes.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Onda Expansiva** | `ondaexpansiva.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Oro Coipo** | `orocoipo.cl` | Ohiggins | database | Emisora regional de Rancagua y la Región de O'Higgins 95.1 FM |
| ✅ | **Página 19** | `pagina19.cl` | — | database | sitemap en catálogo (pagina19) |
| ✅ | **Panorama Noticioso** | `panoramanoticioso.cl` | — | database | sitemap en catálogo (panoramanoticioso) |
| ⬜ | **Partido de la Gente** | `partidodelagente.cl` | — | watchlist | feed stale (último item: 2023-07-31, 1141 días) |
| ⬜ | **Partido Social Cristiano** | `pscchile.cl` | — | watchlist | sitio no responde |
| ⬜ | **Periodismo Sanador** | `periodismosanador.blogspot.com` | — | watchlist | sitio no responde |
| ⬜ | **Periodismo2** | `periodismo2.cl` | — | database | Medio digital con noticias de Chile y el mundo |
| ✅ | **Piensa Chile** | `piensachile.com` | — | database | sitemap en catálogo (piensachile) |
| ✅ | **Portal Metropolitano** | `portalmetropolitano.cl` | — | database | sitemap en catálogo (portalmetropolitano) |
| ⬜ | **Portal Nacional** | `portalnacional.cl` | — | database | Medio digital de noticias |
| ✅ | **Prime Digital** | `primedigital.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Publimetro Chile** | `publimetro.cl` | — | database | sitemap en catálogo (publimetro) |
| ✅ | **Publimicro** | `publimicro.cl` | — | database | sitemap en catálogo (publimicro) |
| ⬜ | **Puerto Montt Online** | `puertomonttonline.cl` | Los Lagos | watchlist | feed stale (último item: 2023-12-09, 1010 días) |
| ✅ | **Pulso Público** | `pulsopublico.cl` | — | database | sitemap en catálogo (pulsopublico) |
| 🟡 | **Puranoticia** | `puranoticia.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **PuraNoticia** | `puranoticia.pnt.cl` | Valparaiso | database | referenciado en src/content/sources/*.md |
| ⬜ | **Qué Pasa** | `quepasa.cl` | — | watchlist | sitio no responde |
| 🟡 | **Radar BioBio** | `radarbiobio.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Radar Informativo** | `radarinformativo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Radio Agricultura** | `radioagricultura.cl` | — | watchlist | feed stale (último item: 2024-06-01, 836 días) |
| ⬜ | **Radio Araucanía** | `radioaraucania.cl` | — | database | Emisora regional de La Araucanía 91.3 FM |
| ⬜ | **Radio Buena Nueva** | `radiobuenanueva.cl` | Maule | database | Emisora regional de Linares 97.9 FM Linares, 106.3 FM Chanco, 102.7 FM Longaví, 89.5 FM Co |
| ⬜ | **Radio Concierto** | `concierto.cl` | — | database | Emisora FM con programación musical y noticias |
| ✅ | **Radio Cooperativa** | `cooperativa.cl` | — | database | sitemap en catálogo (cooperativa) |
| ⬜ | **Radio El Puelche** | `elpuelche.cl` | Los Lagos | database | Radio mapuche de la Región de Los Lagos |
| ⬜ | **Radio Festival** | `radiofestival.cl` | — | database | Radio chilena de música y entretenimiento |
| ✅ | **Radio Imagina** | `radioimagina.cl` | — | database | sitemap en catálogo (radioimagina) |
| ⬜ | **Radio Infinita** | `infinita.cl` | — | database | Emisora FM con programación informativa y musical |
| ✅ | **Radio Nuevo Mundo** | `radionuevomundo.cl` | — | database | sitemap en catálogo (radionuevomundo) |
| 🟡 | **Radio Ñuble** | `radionuble.cl` | Nuble | database | referenciado en src/content/sources/*.md |
| ✅ | **Radio Paulina** | `radiopaulina.cl` | Tarapaca | database | sitemap en catálogo (radiopaulina) |
| 🟡 | **Radio Pauta** | `pauta.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Pilmaiquén** | `radiopilmaiquen.cl` | — | watchlist | feed stale (último item: 2023-04-02, 1262 días) |
| ⬜ | **Radio Presidente Ibáñez** | `radiopresidenteibanez.cl` | Magallanes | database | Emisora regional de Magallanes 88.5 FM |
| ⬜ | **Radio Pudahuel** | `pudahuel.cl` | — | database | Radio chilena de música, entretención y noticias 90.5 FM |
| ⬜ | **Radio San Bartolomé** | `radiosanbartolome.cl` | Coquimbo | database | Emisora regional de coquimbo 96.7 FM |
| ✅ | **Radio UdeC** | `radioudec.cl` | Biobio | database | sitemap en catálogo (radioudec) |
| ⬜ | **Radio Valparaíso** | `radiovalparaiso.cl` | Valparaiso | watchlist | feed stale (último item: 2026-05-22, 116 días) |
| 🟡 | **Red Digital** | `reddigital.cl` | — | watchlist | feed stale (último item: 2026-01-12, 246 días) |
| ✅ | **Redacción** | `redaccion.cl` | — | database | sitemap en catálogo (redaccion) |
| ✅ | **Renovación Nacional** | `rn.cl` | — | watchlist | feed stale (último item: 2025-05-13, 490 días) |
| ✅ | **Reportea** | `reportea.cl` | — | database | sitemap en catálogo (reportea) |
| ⬜ | **Revista Enfoque** | `revistaenfoque.cl` | — | database | Revista digital de noticias y actualidad |
| 🟡 | **Revista Seguridad** | `revistaseguridad.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **RLN (Radio Las Nieves)** | `rln.cl` | Aysen | database | sitemap en catálogo (rln) |
| ✅ | **Santiago Times** | `santiagotimes.cl` | — | watchlist | feed stale (último item: 2023-02-10, 1313 días) |
| ⬜ | **Somos9** | `somos9.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **SoyChile** | `soychile.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **T13** | `t13.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Tercera Dosis** | `terceradosis.cl` | — | watchlist | feed stale (último item: 2026-07-08, 68 días) |
| ⬜ | **Terra Chile** | `terra.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **The Clinic** | `theclinic.cl` | — | database | sitemap en catálogo (theclinic) |
| ⬜ | **The Times en Español** | `thetime.cl` | — | database | Noticias, deportes, política, negocios y actualidad de Chile |
| 🟡 | **The Times Latino** | `thetimeslatino.com` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Tropezón Tu Diario** | `nuevotropezon.tropezon.cl` | — | database | Diario con noticias de actualidad, policial y emergencias |
| ⬜ | **TVN** | `tvn.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Ufro Medios** | `ufromedios.cl` | — | database | Radio de la Universidad de La Frontera |
| ✅ | **Vivimos la Noticia** | `vivimoslanoticia.cl` | Maule | database | sitemap en catálogo (vivimoslanoticia) |
| ⬜ | **Werken** | `werken.cl` | — | watchlist | feed stale (último item: 2026-06-30, 77 días) |
### Noticias internacionales (news-international)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ✅ | **ANSA Latina** | `ansalatina.com` | — | watchlist | sin feed RSS detectado |
| ✅ | **BBC Mundo** | `bbc.com` | — | database | sitemap en catálogo (bbc) |
| ⬜ | **Cadena Política** | `cadenapolitica.com` | — | database | Portal mexicano de noticias políticas, salud y actualidad |
| ⬜ | **El Nacional** | `elnacional.com` | — | database | Diario venezolano de noticias nacionales e internacionales |
| ✅ | **France 24** | `france24.com` | — | database | sitemap en catálogo (france24) |
| ⬜ | **Ground News - Chile** | `ground.news` | — | watchlist | sin feed RSS detectado |
| ✅ | **HolaNews** | `holanews.com` | — | database | sitemap en catálogo (holanews) |
| ✅ | **IPS Agencia de Noticias** | `ipsnoticias.net` | — | database | sitemap en catálogo (ipsnoticias) |
| ✅ | **Le Monde Diplomatique - Edición Chilena** | `lemondediplomatique.cl` | — | database | sitemap en catálogo (lemondediplomatique) |
| ✅ | **MercoPress** | `es.mercopress.com` | — | database | sitemap en catálogo (mercopress) |
| ⬜ | **MercoPress Chile** | `en.mercopress.com` | — | database | Feed principal de MercoPress Chile |
| 🟡 | **Perfil** | `perfil.com` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Prensa Opal** | `prensaopal.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **RFI Español** | `rfi.fr` | — | database | sitemap en catálogo (rfi) |
| ✅ | **The Guardian** | `theguardian.com` | — | database | sitemap en catálogo (theguardian) |
| ✅ | **Voz de América Chile** | `vozdeamerica.com` | — | database | sitemap en catálogo (vozdeamerica) |
### Partidos políticos (political-parties)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ✅ | **Demócratas Chile** | `democratas.cl` | — | database | sitemap en catálogo |
| ⬜ | **Evópoli** | `evopoli.cl` | — | watchlist | feed stale (último item: 2026-06-15, 91 días) |
| ✅ | **Federación Regionalista Verde Social** | `frevs.cl` | — | database | sitemap en catálogo (frevs) |
| ✅ | **Frente Amplio** | `frenteampliochile.cl` | — | database | sitemap en catálogo (frenteampliochile) |
| ⬜ | **Fundación Jaime Guzmán** | `fjguzman.cl` | — | database | Centro de estudios vinculado a la UDI |
| ⬜ | **Fundación Nodo XXI** | `nodoxxi.cl` | — | database | Fundación chilena dedicada al análisis y debate sobre política, ciudadanía y sociedad |
| ✅ | **Partido Comunista de Chile** | `pcchile.cl` | — | database | sitemap en catálogo |
| ✅ | **Partido Demócrata Cristiano** | `pdc.cl` | — | database | sitemap en catálogo |
| ⬜ | **Partido Humanista de Chile** | `partidohumanista.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades del Partido Humanista |
| ⬜ | **Partido Igualdad** | `partidoigualdad.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades del Partido Igualdad de Chi |
| ✅ | **Partido Liberal de Chile** | `liberaleschile.cl` | — | database | sitemap en catálogo (liberaleschile) |
| ✅ | **Partido por la Democracia** | `ppd.cl` | — | database | sitemap en catálogo |
| 🟡 | **Partido Republicano de Chile** | `partidorepublicanodechile.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **Partido Socialista de Chile** | `pschile.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Unión Demócrata Independiente** | `udi.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades de la UDI |
### Radio (radio)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ⬜ | **Duna** | `duna.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **FM Joven** | `fmjoven.com` | — | watchlist | sin feed RSS detectado |
| 🟡 | **FM Plus** | `fmplus.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **FM Stylo** | `fmstylo.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **La Radioneta** | `laradioneta.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Los 40** | `los40.cl` | — | database | Radio chilena Los 40, música popular y actualidad |
| ⬜ | **Mirador FM** | `miradorfm.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Ojo Subterráneo** | `ojosubterraneo.caster.fm` | — | watchlist | HTTP error (404) |
| 🟡 | **Orolonco FM** | `oroloncofm.cl` | Valparaiso | database | referenciado en src/content/sources/*.md |
| ⬜ | **Radio 1° de Mayo** | `radio1demayo.cl` | — | watchlist | sitio no responde |
| 🟡 | **Radio 45 Sur** | `radio45sur.cl` | Los Rios | database | referenciado en src/content/sources/*.md |
| ⬜ | **Radio 80** | `radio80.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio 920** | `radionueveveinte.com` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Acogida** | `radioacogida.cl` | Los Lagos | database | Radio comunitaria con señales en Los Muermos, Puyehue y Puerto Octay; cubre Osorno, Llanqu |
| ⬜ | **Radio Activa** | `radioactiva.cl` | — | database | Radioemisora chilena de música contemporánea |
| ⬜ | **Radio Alborada** | `radioalborada.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Alternativa** | `radioalternativa.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Angelina** | `radioangelina.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Armonía** | `radioarmonia.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Radio Atacama** | `radioatacama.cl` | Atacama | database | referenciado en src/content/sources/*.md |
| ⬜ | **Radio Austral CD 970** | `radioaustralvaldivia.cl` | Los Rios | database | Emisora y radio online de Valdivia con noticias locales y regionales de Los Ríos. |
| ⬜ | **Radio Azúcar** | `radioazucar.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Beat** | `radiobeat.cl` | — | watchlist | feed stale (último item: 2025-07-14, 428 días) |
| ⬜ | **Radio Carillón** | `radiocarillon.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Carolina** | `carolina.cl` | — | database | Emisora chilena de música |
| ✅ | **Radio Chilena** | `radiochilena.cl` | — | watchlist | feed stale (último item: 2026-03-20, 179 días) |
| ⬜ | **Radio Colo-Colo** | `radiocolocolo.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Comunicativa de Ovalle** | `radiocomunicativa.cl` | Coquimbo | database | Radio 93.7 FM y señal online con noticias de Ovalle, el Limarí y la Región de Coquimbo. |
| 🟡 | **Radio Contacto** | `radiocontacto.cl` | Nuble | database | referenciado en src/content/sources/*.md |
| ⬜ | **Radio Cristalina** | `radiocristalina.cl` | — | database | Radio Cristalina, emisora chilena de la Región de Coquimbo |
| ⬜ | **Radio del Mar** | `radiodelmar.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Disney Chile** | `radiodisney.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio El Conquistador** | `elconquistador.cl` | — | watchlist | sitio no responde |
| ✅ | **Radio FM Centro** | `fmcentro.cl` | Araucania | database | sitemap en catálogo (fmcentro) |
| 🟡 | **Radio Futuro** | `futuro.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Radio Galactika** | `galactika.wordpress.com` | — | watchlist | feed stale (último item: 2015-08-18, 4045 días) |
| ⬜ | **Radio Guayacán** | `radioguayacan.cl` | Coquimbo | database | Radio y medio digital de La Serena y el Norte Chico, con noticias regionales, nacionales, |
| ⬜ | **Radio Horizonte** | `horizonte.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio HVA** | `hvaradio.cl` | Atacama | database | Radio regional de Atacama con noticias, entrevistas y cobertura local. |
| ✅ | **Radio Interamericana** | `radiointeramericana.cl` | Biobio | database | sitemap en catálogo (radiointeramericana) |
| 🟡 | **Radio JGM** | `radiojgm.uchile.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Radio Konciencia** | `radiokonciencia.org` | — | watchlist | feed stale (último item: 2023-05-19, 1215 días) |
| ⬜ | **Radio La Clave** | `laclave.cl` | — | watchlist | sitio no responde |
| ✅ | **Radio La Señal** | `radiolasenal.cl` | — | database | sitemap en catálogo (radiolasenal) |
| ✅ | **Radio María Chile** | `radiomaria.cl` | — | database | sitemap en catálogo (radiomaria) |
| ⬜ | **Radio Máxima** | `radiomaxima.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Melodía** | `radiomelodia.cl` | — | database | Radio Melodía, emisora chilena |
| ✅ | **Radio Modelo** | `radiomodelo.cl` | — | database | sitemap en catálogo (radiomodelo) |
| ⬜ | **Radio Placeres** | `radioplaceres.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Play** | `radioplay.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Portales** | `radioportales.cl` | — | watchlist | sitio no responde |
| ✅ | **Radio Riquelme** | `radioriquelme.cl` | — | database | sitemap en catálogo (radioriquelme) |
| ⬜ | **Radio Romántica** | `romantica.cl` | — | database | Emisora chilena de música romántica |
| 🟡 | **Radio Sago** | `radiosago.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Santa Cruz** | `santacruzfm.cl` | Ohiggins | database | Radio regional de Santa Cruz y O’Higgins con noticias, deporte, programas y cobertura loca |
| ⬜ | **Radio Santiago** | `radiosantiago.cl` | Metropolitana | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Sinfonía** | `radiosinfonia.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Tiempo** | `radiotiempo.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Universal** | `radiouniversal.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Radio Universidad de Chile** | `radio.uchile.cl` | Metropolitana | database | sitemap en catálogo (radio_uchile) |
| ⬜ | **Radio Universo** | `radiouniverso.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Uno** | `radiouno.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Usach** | `radio.usach.cl` | — | watchlist | sitio no responde |
| ⬜ | **Radio Valentín Letelier** | `rvl.uv.cl` | Valparaiso | database | Radio de la Universidad de Valparaíso |
| ⬜ | **Radio Villa Francia** | `radiovillafrancia.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radio Zero** | `radiozero.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Radios Regionales** | `radiosregionales.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Rock & Pop** | `rockandpop.cl` | — | database | Radio chilena de rock, música y actualidad |
| ⬜ | **Soberanía Radio** | `soberaniaradio.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **UC Radio Beethoven** | `beethovenfm.cl` | — | watchlist | feed stale (último item: 2021-04-02, 1991 días) |
| ✅ | **Vilas Radio** | `vilasradio.cl` | Tarapaca | database | sitemap en catálogo (vilasradio) |
### Regional (regional)

| Estado | Sitio | Web | Región | Fuente | Notas |
| --- | --- | --- | --- | --- | --- |
| ✅ | **Aconcagua Digital** | `aconcaguadigital.cl` | Valparaiso | database | sitemap en catálogo (aconcaguadigital) |
| ✅ | **Alerta Noticias** | `alertanoticias.cl` | Valparaiso | database | sitemap en catálogo (alertanoticias) |
| ✅ | **Alerta Noticias Temuco** | `alertanoticiastemuco.cl` | Araucania | database | sitemap en catálogo (alertanoticiastemuco) |
| ⬜ | **Alto La Dehesa** | `altoladehesa.cl` | Metropolitana | database | Feed principal de Alto La Dehesa |
| ⬜ | **Angelino** | `angelino.cl` | — | database | Diario regional de Los Ángeles, Biobío |
| ✅ | **Angol Noticias** | `angolnoticiasnew.cl` | Araucania | database | sitemap en catálogo (angolnoticias) |
| ⬜ | **Angolinos** | `angolinos.cl` | Araucania | watchlist | sitio no responde |
| ✅ | **Antofacity** | `antofacity.com` | Antofagasta | database | sitemap en catálogo (antofacity) |
| ✅ | **Antofagasta al Día** | `antofagastaaldia.cl` | Antofagasta | database | sitemap en catálogo (antofagastaaldia) |
| ✅ | **Antofagasta Noticias** | `antofagastanoticias.cl` | Antofagasta | database | sitemap en catálogo (antofagastanoticias) |
| ✅ | **Antofagasta TV** | `antofagasta.tv` | Antofagasta | database | sitemap en catálogo |
| ⬜ | **Araucanía Cuenta** | `araucaniacuenta.cl` | Araucania | watchlist | sin feed RSS detectado |
| 🟡 | **Araucanía Diario** | `araucaniadiario.cl` | — | watchlist | HTTP error (403) |
| ✅ | **Araucanía Noticias** | `araucanianoticias.cl` | Araucania | database | sitemap en catálogo (noticiasdellago) |
| ✅ | **Arica Al Día** | `aricaldia.cl` | Arica Y Parinacota | database | sitemap en catálogo |
| ⬜ | **Arica Chile** | `aricachile.cl` | Arica Y Parinacota | database | Medio de comunicación de la Región de Arica y Parinacota |
| ✅ | **Arica es Noticia** | `aricaesnoticia.cl` | Arica Y Parinacota | database | sitemap en catálogo (aricaesnoticia) |
| ⬜ | **Arica Hoy** | `aricahoy.cl` | Arica Y Parinacota | database | Diario regional de Arica y Parinacota |
| ⬜ | **Arica Mía** | `aricamia.cl` | Arica Y Parinacota | watchlist | feed stale (último item: 2026-03-03, 195 días) |
| ⬜ | **Arica Online** | `aricaonline.cl` | — | database | Medio de comunicación de la Región de Arica y Parinacota |
| ⬜ | **Arica TV** | `arica.tv` | Arica Y Parinacota | watchlist | feed stale (último item: 2026-07-17, 59 días) |
| ⬜ | **Arica365** | `arica365.cl` | Arica Y Parinacota | database | Diario regional de Arica y Parinacota |
| ✅ | **Atacama en Línea** | `atacamaenlinea.cl` | Atacama | database | sitemap en catálogo (atacamaenlinea) |
| ✅ | **Atacama Noticias** | `atacamanoticias.cl` | Atacama | database | sitemap en catálogo (atacamanoticias) |
| 🟡 | **Atentos** | `atentos.cl` | Maule | database | referenciado en src/content/sources/*.md |
| ⬜ | **Aysén Ahora** | `aysenahora.cl` | Aysen | database | Diario regional de Puerto Aysén, Aysén |
| ⬜ | **Aysén TV** | `aysentv.cl` | Aysen | database | Canal de televisión y radio online desde Puerto Aysén, con noticias locales, regionales, d |
| ⬜ | **Cabrero en Línea** | `wp.cabreroenlinea.cl` | Biobio | database | Medio digital de noticias de Cabrero, Región del Biobío |
| ⬜ | **Calama en Línea** | `noticias.calamaenlinea.cl` | Antofagasta | database | Medio de comunicación de la Región de Antofagasta |
| ✅ | **Canal 9 Biobío** | `canal9.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Canal Sur Patagonia** | `canalsurpatagonia.cl` | Aysen | database | Medio de comunicación de la Región de Aysén con noticias, actualidad, turismo y cultura |
| ⬜ | **CauquenesNet** | `cauquenesnet.cl` | Maule | database | Diario regional de Cauquenes, Maule |
| ⬜ | **CEI Noticias** | `ceinoticias.cl` | Tarapaca | database | Diario regional de Iquique, Tarapacá |
| ✅ | **Central Noticia** | `centralnoticia.cl` | Los Lagos | database | sitemap en catálogo (centralnoticia) |
| ⬜ | **Central Noticias** | `centralnoticias.cl` | Los Rios | database | Diario regional de Panguipulli, Los Ríos |
| ⬜ | **Chasquis** | `chasquis.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Chicureo Hoy** | `chicureohoy.cl` | Metropolitana | database | sitemap en catálogo (chicureohoy) |
| ⬜ | **Chile Mosaico** | `chilemosaico.cl` | — | watchlist | feed stale (último item: 2025-05-07, 495 días) |
| ⬜ | **Chillán Online** | `chillanonline.cl` | Nuble | database | Diario regional de Chillán, Ñuble |
| 🟡 | **ChiloeNews** | `chiloenews.cl` | Los Lagos | database | referenciado en src/content/sources/*.md |
| ⬜ | **Chinchorro** | `periodicochinchorro.cl` | Arica Y Parinacota | watchlist | sitio no responde |
| ✅ | **Clave 9** | `clave9.cl` | Araucania | database | sitemap en catálogo (clave9) |
| ✅ | **CLG Medios** | `clgmedios.cl` | Los Lagos | database | sitemap en catálogo (clgmedios) |
| ✅ | **Coquimbo Noticias** | `coquimbonoticias.cl` | Coquimbo | database | sitemap en catálogo (coquimbonoticias) |
| ⬜ | **Crónica Chillán** | `cronicachillan.cl` | — | watchlist | feed stale (último item: 2020-09-30, 2175 días) |
| 🟡 | **Crónica Digital** | `cronicadigital.cl` | Metropolitana | database | referenciado en src/content/sources/*.md |
| ⬜ | **Crónica Noticias** | `cronicanoticias.cl` | — | watchlist | sitio no responde |
| ⬜ | **Curacaví Digital** | `curacavidigital.cl` | Metropolitana | database | Medio digital de la comuna de Curacaví, Región Metropolitana |
| ✅ | **Datos Sur** | `datossur.cl` | Los Lagos | database | sitemap en catálogo |
| ⬜ | **David Noticias** | `davidnoticias.cl` | Coquimbo | database | Diario regional de Los Vilos, Coquimbo |
| ⬜ | **De Mar a Cordillera TV** | `demaracordilleratv.cl` | Ohiggins | database | Medio digital chileno de la Región de O'Higgins con noticias, turismo, cultura y reportaje |
| ⬜ | **De Todo Valdivia** | `dtvaldivia.cl` | Los Rios | database | Portal regional de noticias, opinión, servicios, educación y actividades de Valdivia y Los |
| ⬜ | **Desierto FM** | `desiertofm.cl` | Antofagasta | database | Radio chilena de Calama y Antofagasta con 44 años de trayectoria, noticias regionales |
| ⬜ | **Diálogo Sur** | `dialogosur.cl` | Magallanes | database | Diario regional de Punta Arenas, Magallanes |
| ⬜ | **Diario Aconcagua** | `diarioaconcagua.cl` | Valparaiso | database | Portal noticioso multimedia del Valle del Aconcagua, con cobertura de sus diez comunas y d |
| ✅ | **Diario Angamos** | `diarioangamos.com` | Antofagasta | database | sitemap en catálogo (diarioangamos) |
| ✅ | **Diario Antofagasta** | `diarioantofagasta.cl` | Antofagasta | database | sitemap en catálogo (diarioantofagasta) |
| ✅ | **Diario Austral Osorno** | `australosorno.cl` | Los Lagos | database | sitemap en catálogo |
| ✅ | **Diario Austral Temuco** | `australtemuco.cl` | Araucania | database | sitemap en catálogo |
| ✅ | **Diario Avísale** | `diarioavisale.cl` | Tarapaca | database | sitemap en catálogo (diarioavisale) |
| ⬜ | **Diario Aysén** | `diarioaysen.cl` | — | database | Diario regional de la Región de Aysén |
| ⬜ | **Diario Aysén Opina** | `diarioaysenopina.cl` | Aysen | watchlist | sin feed RSS detectado |
| ✅ | **Diario Cauquenes** | `diariocauquenes.cl` | Maule | database | sitemap en catálogo (diariocauquenes) |
| ✅ | **Diario Chañarcillo** | `chanarcillo.cl` | Atacama | database | sitemap en catálogo (chanarcillo) |
| ⬜ | **Diario Chiloé** | `diariochiloe.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario Concepción** | `diarioconcepcion.cl` | Biobio | database | sitemap en catálogo (diarioconcepcion) |
| ✅ | **Diario Curicó** | `diariocurico.cl` | Maule | database | sitemap en catálogo (diariocurico) |
| ✅ | **Diario de Osorno** | `diariodeosorno.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario de Puerto Montt** | `diariodepuertomontt.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario de Valdivia** | `diariodevaldivia.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario El Cautín** | `diarioelcautin.cl` | Araucania | database | sitemap en catálogo (diarioelcautin) |
| ✅ | **Diario El Centro** | `diarioelcentro.cl` | Maule | database | sitemap en catálogo (diarioelcentro) |
| ✅ | **Diario El Cóndor** | `diariocondor.cl` | Ohiggins | database | sitemap en catálogo (elcondor) |
| ✅ | **Diario El Día** | `diarioeldia.cl` | Coquimbo | database | sitemap en catálogo (diarioeldia) |
| ✅ | **Diario El Heraldo** | `diarioelheraldo.cl` | Maule | database | sitemap en catálogo |
| ⬜ | **Diario El Huemul** | `elhuemul.cl` | Los Lagos | database | Diario regional de Chaitén, Los Lagos |
| ✅ | **Diario El Longino** | `diariolongino.cl` | Tarapaca | database | sitemap en catálogo (diariolongino) |
| ⬜ | **Diario El Marino** | `diarioelmarino.cl` | Ohiggins | database | Diario regional de Pichilemu, O'Higgins |
| ⬜ | **Diario El Nortino** | `diarioelnortino.cl` | Tarapaca | database | Diario regional de Alto Hospicio, Tarapacá |
| ✅ | **Diario El Porteño** | `elporteno.cl` | Valparaiso | database | sitemap en catálogo (elporteno) |
| ✅ | **Diario El Pulso** | `diarioelpulso.cl` | Ohiggins | database | sitemap en catálogo (diarioelpulso) |
| ✅ | **Diario El Ranco** | `diarioelranco.cl` | — | database | sitemap en catálogo (diarioelranco) |
| ⬜ | **Diario Futrono** | `diariofutrono.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario La Prensa** | `new.diariolaprensa.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **Diario La Prensa** | `diariolaprensa.cl` | Biobio | watchlist | sin feed RSS detectado |
| ⬜ | **Diario La Quinta** | `diariolaquinta.cl` | Valparaiso | database | Diario regional de Valparaíso, Valparaíso |
| 🟡 | **Diario La Región** | `diariolaregion.cl` | Coquimbo | database | referenciado en src/content/sources/*.md |
| ⬜ | **Diario Labrador** | `diariolabrador.cl` | Los Rios | watchlist | sitio no responde |
| ✅ | **Diario Lago Ranco** | `diariolagoranco.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Diario Laguino** | `diariolaguino.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Diario Lanco** | `diariolanco.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario Linares** | `diariolinares.cl` | Maule | database | sitemap en catálogo (diariolinares) |
| ✅ | **Diario Los Lagos** | `diarioloslagos.cl` | Los Lagos | database | sitemap en catálogo (diarioloslagos) |
| ⬜ | **Diario Máfil** | `diariomafil.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Diario Paillaco** | `diariopaillaco.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario Puerto Varas** | `diariopuertovaras.cl` | Los Lagos | database | sitemap en catálogo (diariopuertovaras) |
| ✅ | **Diario Regional Aysén** | `diarioregionalaysen.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Diario Río Bueno** | `diarioriobueno.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Diario San José** | `diariosanjose.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Diario Sol** | `diariosol.cl` | Antofagasta | database | sitemap en catálogo |
| ✅ | **Diario Sur Noticias** | `diariosurnoticias.com` | Metropolitana | database | sitemap en catálogo (diariosurnoticias) |
| ✅ | **Diario Talca** | `diariotalca.cl` | Maule | database | sitemap en catálogo (diariotalca) |
| ⬜ | **Diario VI Región** | `diarioviregion.cl` | Ohiggins | database | Diario regional de Libertador General Bernardo O'Higgins |
| ⬜ | **Dirario Austral** | `australvaldivia.cl` | Los Rios | database | Diario regional de Los Ríos |
| ⬜ | **Duplos** | `duplos.cl` | Metropolitana | database | Diario regional de Santiago, Metropolitana |
| ✅ | **Edición Cero** | `edicioncero.cl` | Tarapaca | database | sitemap en catálogo (edicioncero) |
| ⬜ | **El Aconcagua** | `elaconcagua.cl` | Valparaiso | database | Diario regional de San Felipe, Valparaíso |
| ✅ | **El Amaule** | `elamaule.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **El América** | `elamerica.cl` | Antofagasta | database | Diario regional de Calama, Antofagasta |
| ✅ | **El Andacollino** | `elandacollino.cl` | Coquimbo | database | sitemap en catálogo (elandacollino) |
| ⬜ | **El Andino** | `elandino.cl` | — | watchlist | sitio no responde |
| 🟡 | **El Boyaldía** | `elboyaldia.cl` | Tarapaca | watchlist | sin feed RSS detectado |
| ✅ | **El Cachapoal** | `elcachapoal.cl` | — | database | sitemap en catálogo (elcachapoal) |
| ✅ | **El Calbucano** | `elcalbucano.cl` | Los Lagos | database | sitemap en catálogo (elcalbucano) |
| ⬜ | **El Capo de Provincia** | `capodeprovincia.cl` | Valparaiso | database | Medio digital de la Provincia de San Antonio, Región de Valparaíso |
| ⬜ | **El Chelenko** | `elchelenko.cl` | Aysen | watchlist | HTTP error (401) |
| ✅ | **El Comunicador** | `elcomunicador.cl` | Metropolitana | database | sitemap en catálogo (elcomunicador) |
| ⬜ | **El Concecuente** | `elconcecuente.cl` | — | watchlist | sitio no responde |
| ⬜ | **El Concordia** | `elconcordia.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Cóndor** | `diarioelcondor.cl` | Ohiggins | watchlist | sin feed RSS detectado |
| ✅ | **El Contraste** | `elcontraste.cl` | — | database | sitemap en catálogo (elcontraste) |
| ✅ | **El Coquimbano** | `elcoquimbano.cl` | Coquimbo | database | sitemap en catálogo (elcoquimbano) |
| ⬜ | **El Correo del Lago** | `correodellago.cl` | Los Lagos | watchlist | feed stale (último item: 2025-08-28, 382 días) |
| ⬜ | **El Diario de Atacama** | `diarioatacama.cl` | Atacama | database | Medio de comunicación de la Región de Atacama |
| ⬜ | **El Diario de Curacaví** | `eldiariodecuracavi.cl` | Metropolitana | database | Medio periodístico de la comuna de Curacaví, Región Metropolitana |
| ✅ | **El Diario de La Araucanía** | `eldiariodelaaraucania.cl` | Araucania | database | sitemap en catálogo (eldiariodelaaraucania) |
| ⬜ | **El Diario de Maule** | `eldiariodemaule.com` | Maule | watchlist | sin feed RSS detectado |
| ⬜ | **El Diario Panguipulli** | `eldiariopanguipulli.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **El Divisadero** | `eldivisadero.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Gong** | `elgong.cl` | Araucania | database | sitemap en catálogo (elgong) |
| ⬜ | **El Heraldo Austral** | `eha.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **El Heraldo Austral** | `elheraldoaustral.cl` | Aysen | watchlist | sin feed RSS detectado |
| ✅ | **El Informador** | `elinformador.cl` | Valparaiso | database | sitemap en catálogo (elinformador) |
| ✅ | **El Insular** | `elinsular.cl` | Los Lagos | database | sitemap en catálogo (elinsular) |
| ⬜ | **El Lector** | `lectoronline.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **El Líder San Antonio** | `lidersanantonio.cl` | Valparaiso | database | Diario regional de San Antonio, Valparaíso |
| ⬜ | **El Llanquihue** | `elllanquihue.cl` | — | watchlist | sitio no responde |
| ⬜ | **El Magallanews** | `elmagallanews.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Magallánico** | `elmagallanico.com` | Magallanes | database | sitemap en catálogo (elmagallanico) |
| ✅ | **El Maipo** | `elmaipo.cl` | Metropolitana | database | sitemap en catálogo (elmaipo) |
| ⬜ | **El Matutino** | `elmartutino.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Maule Informa** | `elmauleinforma.cl` | Maule | database | sitemap en catálogo (elmauleinforma) |
| ⬜ | **El Mercurio Valparaíso** | `mercuriovalpo.cl` | — | database | Diario regional de Valparaíso |
| ⬜ | **El Monitor** | `elmonitorparral.com` | Maule | watchlist | sitio no responde |
| ✅ | **El Morro de Arica** | `elmorrodearica.cl` | Arica Y Parinacota | database | sitemap en catálogo (elmorrodearica) |
| 🟡 | **El Morrocotudo** | `elmorrocotudo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Mostrador** | `elmostrador.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **El Naveghable** | `elnaveghable.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **El Nortero** | `elnortero.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Noticiero del Huasco** | `elnoticierodelhuasco.cl` | Atacama | database | sitemap en catálogo (elnoticierodelhuasco) |
| ✅ | **El Observador** | `observador.cl` | Valparaiso | database | sitemap en catálogo (observador) |
| 🟡 | **El Observatodo** | `elobservatodo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Ovallino** | `elovallino.cl` | Coquimbo | database | sitemap en catálogo (elovallino) |
| ⬜ | **El Paila** | `lapaila.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **El Paradiario 14** | `elparadiario14.cl` | Los Rios | watchlist | sitio no responde |
| 🟡 | **El Patagónico** | `elpatagonico.com` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Periódico** | `elperiodico.cl` | Araucania | database | sitemap en catálogo (elperiodico) |
| ✅ | **El Periodista** | `elperiodista.cl` | Metropolitana | database | sitemap en catálogo (el_periodista) |
| ✅ | **El Pingüino** | `elpinguino.com` | Magallanes | database | sitemap en catálogo (elpinguino) |
| ✅ | **El Proa** | `elproa.cl` | Valparaiso | database | sitemap en catálogo (elproa) |
| ✅ | **El Provincial** | `elprovincial.cl` | Los Rios | database | sitemap en catálogo |
| 🟡 | **El Quehaydecierto** | `elquehaydecierto.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Rancagüino** | `elrancaguino.cl` | Ohiggins | database | sitemap en catálogo (elrancaguino) |
| ⬜ | **El Rancahuaso** | `elrancahuaso.cl` | Ohiggins | watchlist | sin feed RSS detectado |
| ✅ | **El Regional** | `elregional.cl` | Coquimbo | database | sitemap en catálogo |
| ✅ | **El Reportero de Iquique** | `elreporterodeiquique.com` | Tarapaca | database | sitemap en catálogo (elreporterodeiquique) |
| ⬜ | **El Repuertero** | `elrepuertero.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Sancarlino** | `elsancarlino.cl` | Nuble | database | sitemap en catálogo |
| ✅ | **El Serenense** | `elserenense.cl` | Coquimbo | database | sitemap en catálogo (elserenense) |
| ✅ | **El Sol de Iquique** | `elsoldeiquique.cl` | Tarapaca | database | sitemap en catálogo (elsoldeiquique) |
| ⬜ | **El Sur** | `elsur.cl` | — | watchlist | feed stale (último item: 2021-07-10, 1892 días) |
| 🟡 | **El Tipógrafo** | `eltipografo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Tirapiedras** | `eltirapiedras.cl` | Magallanes | database | sitemap en catálogo (eltirapiedras) |
| ✅ | **El Trabajo** | `eltrabajo.cl` | Valparaiso | database | sitemap en catálogo |
| ✅ | **El Urbano Rural** | `elurbanorural.cl` | Ohiggins | database | sitemap en catálogo |
| ⬜ | **El Vacanudo** | `elvacanudo.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **El Vicuñense** | `xn--elvicuense-y9a.cl` | Coquimbo | database | sitemap en catálogo (elvicuense) |
| 🟡 | **El Zorro Nortino** | `elzorronortino.cl` | Atacama | database | referenciado en src/content/sources/*.md |
| ✅ | **Elqui Global** | `elquiglobal.cl` | Coquimbo | database | sitemap en catálogo (elquiglobal) |
| ✅ | **En La Línea** | `enlalinea.cl` | Antofagasta | database | sitemap en catálogo (enlalinea) |
| ✅ | **En Línea Maule** | `enlineamaule.cl` | Maule | database | sitemap en catálogo (enlineamaule) |
| ✅ | **Enfoque Digital** | `enfoquedigital.cl` | Atacama | database | sitemap en catálogo (enfoquedigital) |
| ✅ | **Enfoque Digital O'Higgins** | `vi.cl` | Ohiggins | database | sitemap en catálogo (enfoquedigitalohiggins) |
| ⬜ | **EPD Noticias** | `elpatagondomingo.cl` | — | watchlist | sitio no responde |
| ✅ | **Epicentro Chile** | `epicentrochile.com` | — | database | sitemap en catálogo (epicentrochile) |
| ⬜ | **Fresia Ahora** | `fresiaahora.cl` | Los Lagos | database | Medio digital local de Fresia y Los Lagos sobre municipalidad, política, salud, educación, |
| ✅ | **Frontera Norte** | `fronteranorte.cl` | Arica Y Parinacota | database | sitemap en catálogo (fronteranorte) |
| ✅ | **FrutillarHoy** | `frutillarhoy.cl` | Los Lagos | database | sitemap en catálogo |
| ⬜ | **Grafelberg Noticias** | `grafelbergnoticias.blogspot.com` | Los Lagos | watchlist | sitio no responde |
| ⬜ | **Gran Valparaíso** | `granvalparaiso.cl` | Valparaiso | watchlist | HTTP error (403) |
| ✅ | **Guardián del Sur** | `guardiandelsur.cl` | Los Lagos | database | sitemap en catálogo |
| ✅ | **HDN** | `hdn.cl` | Ohiggins | database | sitemap en catálogo (hdn) |
| ✅ | **Hora de Noticias** | `horadenoticias.cl` | Ohiggins | database | sitemap en catálogo (horadenoticias) |
| ⬜ | **Hoyxhoy** | `hoyxhoy.cl` | — | watchlist | feed stale (último item: 2021-09-27, 1813 días) |
| ✅ | **Info Tarapacá** | `infotarapaca.cl` | Tarapaca | database | sitemap en catálogo (infotarapaca) |
| ✅ | **Informa Al Minuto** | `informaalminuto.cl` | Los Rios | database | sitemap en catálogo (informaalminuto) |
| ✅ | **Insular FM** | `insularfm.cl` | Los Lagos | database | sitemap en catálogo (insularfm) |
| ⬜ | **Iquique Hoy** | `iquiquehoy.cl` | Tarapaca | database | Medio digital de noticias de Iquique, Alto Hospicio y Tarapacá, con cobertura nacional, de |
| ⬜ | **Iquique Online** | `iquiqueonline.cl` | Tarapaca | watchlist | sitio no responde |
| ✅ | **Iquique TV** | `iquiquetv.cl` | Tarapaca | database | sitemap en catálogo (iquiquetv) |
| ✅ | **ITV Patagonia** | `itvpatagonia.com` | Magallanes | database | sitemap en catálogo (itvpatagonia) |
| ✅ | **La Batalla de Maipú** | `labatalla.cl` | Metropolitana | database | sitemap en catálogo (labatalla) |
| ✅ | **La Discusión** | `ladiscusion.cl` | Nuble | database | sitemap en catálogo |
| ⬜ | **La Estrella de Arica** | `estrellaarica.cl` | — | watchlist | feed stale (último item: 2025-10-26, 324 días) |
| ✅ | **La Estrella de Iquique** | `estrellaiquique.cl` | Tarapaca | database | sitemap en catálogo (estrellaiquique) |
| ⬜ | **La Estrella de Tocopilla** | `estrellatocopilla.cl` | Antofagasta | watchlist | feed stale (último item: 2020-05-09, 2319 días) |
| ⬜ | **La Estrella de Valparaíso** | `estrellavalpo.cl` | Valparaiso | watchlist | feed stale (último item: 2023-05-27, 1207 días) |
| ✅ | **La Fontana** | `lafontana.cl` | Nuble | database | sitemap en catálogo (lafontana) |
| ✅ | **La Hora** | `lahora.cl` | — | database | sitemap en catálogo (lahora) |
| ✅ | **La Kalle** | `lakalle.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **La Ligua Noticias** | `laliguanoticias.cl` | Valparaiso | database | Portal de noticias de La Ligua, Región de Valparaíso |
| ✅ | **La Mega FM** | `lamegafm.cl` | Tarapaca | database | sitemap en catálogo (lamegafm) |
| ✅ | **La Noticia** | `lanoticia.cl` | Ohiggins | database | sitemap en catálogo |
| ⬜ | **La Noticia Online** | `lanoticiaonline.cl` | — | watchlist | sitio no responde |
| ✅ | **La Opinión de Chiloé** | `laopiniondechiloe.cl` | Los Lagos | database | sitemap en catálogo (laopiniondechiloe) |
| ⬜ | **La Opinión Online** | `laopiniononline.cl` | Valparaiso | database | Medio digital de noticias locales, regionales y nacionales de la Región de Valparaíso. |
| ⬜ | **La Opiñón** | `laopinon.cl` | — | watchlist | sitio no responde |
| ✅ | **La Perla del Limarí** | `laperladellimari.cl` | Coquimbo | database | sitemap en catálogo (laperladellimari) |
| ✅ | **La Prensa Austral** | `laprensaaustral.cl` | Magallanes | database | sitemap en catálogo (laprensaaustral) |
| ✅ | **La Razón** | `larazon.cl` | Metropolitana | database | sitemap en catálogo |
| 🟡 | **La Región Hoy** | `laregionhoy.cl` | — | database | referenciado en src/content/sources/*.md |
| 🟡 | **La Segunda** | `lasegunda.com` | — | watchlist | sin feed RSS detectado |
| ✅ | **La Serena Online** | `laserenaonline.cl` | Coquimbo | database | sitemap en catálogo (laserenaonline) |
| ✅ | **La Tribuna** | `latribuna.cl` | Biobio | database | sitemap en catálogo |
| ✅ | **La Tribuna de Colchagua** | `latribunadecolchagua.cl` | Ohiggins | database | sitemap en catálogo (latribunadecolchagua) |
| ✅ | **La Unión** | `diariolaunion.cl` | — | watchlist | sin feed RSS detectado |
| 🟡 | **La Voz de Maipú** | `lavozdemaipu.cl` | Metropolitana | database | referenciado en src/content/sources/*.md |
| ⬜ | **La Voz de Paillaco** | `lavozdepaillaco.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **La Voz de Pucón** | `lavozdepucon.cl` | Araucania | database | Medio regional de Pucón y la Zona Lacustre con noticias de actualidad, política, deportes, |
| ⬜ | **La Voz de Valdivia** | `lavozdevaldivia.cl` | Los Rios | watchlist | sitio no responde |
| ⬜ | **La Voz del Norte** | `lavozdelnorte.cl` | Coquimbo | database | Medio digital regional con sede en La Serena que cubre Coquimbo y asuntos nacionales, cult |
| ✅ | **Las Noticias de Malleco** | `lasnoticiasdemalleco.cl` | Araucania | database | sitemap en catálogo (lasnoticiasdemalleco) |
| ⬜ | **Las Últimas Noticias** | `lun.com` | — | watchlist | sin feed RSS detectado |
| ✅ | **Linares en Línea** | `linaresenlinea.cl` | Maule | database | sitemap en catálogo (linaresenlinea) |
| ✅ | **Linares Noticia** | `linaresnoticia.cl` | Maule | database | sitemap en catálogo |
| ⬜ | **Los Andes On Line** | `losandesonline.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Los Lagos al Día** | `loslagosaldia.cl` | Los Lagos | watchlist | sin feed RSS detectado |
| ⬜ | **Los Ríos Al Día** | `losriosaldia.cl` | — | database | Radio regional de Valdivia, Los Ríos |
| ✅ | **Los Ríos Noticias** | `losriosnoticias.cl` | Los Rios | database | sitemap en catálogo (losriosnoticias) |
| 🟡 | **Magallanes Check** | `magallanescheck.cl` | — | database | referenciado en src/content/sources/*.md |
| ✅ | **Malleco 7** | `malleco7.cl` | Araucania | database | sitemap en catálogo (malleco7) |
| ✅ | **Margamarga TV** | `margamargatv.cl` | Valparaiso | database | sitemap en catálogo (margamargatv) |
| ✅ | **Más Noticia** | `masnoticia.cl` | Valparaiso | database | sitemap en catálogo (masnoticia) |
| ⬜ | **Maule al Día** | `maulealdia.cl` | Maule | watchlist | sin feed RSS detectado |
| ⬜ | **Maule EE** | `maulee.cl` | Maule | watchlist | sitio no responde |
| ✅ | **Maule Hoy** | `maulehoy.cl` | Maule | database | sitemap en catálogo (maulehoy) |
| ⬜ | **Mi San Felipe** | `misanfelipe.cl` | — | database | Medio de comunicación de la Región de Valparaíso |
| ✅ | **Mirada Sur TV** | `miradasurtv.cl` | Los Lagos | database | sitemap en catálogo (miradasurtv) |
| ⬜ | **Montealegre** | `montealegre.cl` | — | database | Medio de comunicación de la Región de Valparaíso |
| ✅ | **Municipalidad de Cobquecura** | `cobquecura.cl` | Nuble | database | sitemap en catálogo |
| ✅ | **Nacimentano** | `nacimentano.cl` | Biobio | database | sitemap en catálogo (nacimentano) |
| ⬜ | **Natales Online** | `natalesonline.cl` | Magallanes | watchlist | sin feed RSS detectado |
| ✅ | **Norte Online** | `norteonline.cl` | Arica Y Parinacota | database | sitemap en catálogo (norteonline) |
| ⬜ | **Norte y Energía** | `norteyenergia.cl` | Antofagasta | database | Revista digital de la Región de Antofagasta |
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
| ⬜ | **Opinión Sur** | `opinionsur.cl` | — | watchlist | sin feed RSS detectado |
| ⬜ | **Órbita Noticias** | `orbitanoticias.cl` | Nuble | watchlist | sin feed RSS detectado |
| ✅ | **Ovalle Hoy** | `ovallehoy.cl` | Coquimbo | database | sitemap en catálogo (ovallehoy) |
| ✅ | **Ovejero Noticias** | `ovejeronoticias.cl` | Magallanes | database | sitemap en catálogo (ovejeronoticias) |
| 🟡 | **Página 7** | `pagina7.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **País Lobo** | `paislobo.cl` | Los Lagos | database | sitemap en catálogo (paislobo) |
| ⬜ | **PanoramicAysén** | `panoramicaysen.cl` | Aysen | database | Medio y radio regional de Puerto Aysén con noticias de la comuna, la región y el país. |
| ⬜ | **Parral Actual** | `parralactual.com` | Maule | watchlist | sitio no responde |
| ✅ | **Pauta Los Ríos** | `pautalosrios.cl` | Los Rios | database | sitemap en catálogo |
| ⬜ | **Periódico Contraplano** | `contraplano.cl` | — | database | Medio de comunicación de la Región de Valparaíso |
| ⬜ | **Periódico Los Ríos** | `periodicolosrios.cl` | Los Rios | watchlist | feed stale (último item: 2026-05-05, 132 días) |
| ✅ | **Pichilemu News** | `pichilemunews.cl` | Ohiggins | database | sitemap en catálogo (pichilemunews) |
| ✅ | **Portal Informativo** | `portalinformativo.cl` | Los Lagos | database | sitemap en catálogo (portalinformativo) |
| ✅ | **Prensa Ciudadana** | `prensaciudadana.cl` | Araucania | database | sitemap en catálogo (prensaciudadana) |
| ⬜ | **Prensa Curicó** | `prensacurico.cl` | Maule | watchlist | feed stale (último item: 2026-04-28, 139 días) |
| ⬜ | **Primera Fuente** | `primerafuente.cl` | Maule | database | Medio digital de noticias de Curicó, la Región del Maule y el país. |
| ✅ | **Primera Nota** | `primeranota.cl` | — | database | sitemap en catálogo |
| ⬜ | **Pto. Williams** | `ptowilliams.cl` | Magallanes | watchlist | sin feed RSS detectado |
| ✅ | **Pucón TV** | `pucontv.com` | Araucania | database | sitemap en catálogo |
| 🟡 | **Puente Alto al Día** | `puentealtoaldia.cl` | Metropolitana | watchlist | sitio no responde |
| ⬜ | **Puerto al Día** | `puertoaldia.cl` | Los Lagos | watchlist | sitio no responde |
| ⬜ | **Pulso Comunal** | `radiopulsocomunal.cl` | Antofagasta | database | Radio y medio digital comunitario de la Región de Antofagasta. |
| ✅ | **Qué pasa Araucanía** | `quepasaaraucania.cl` | Araucania | database | sitemap en catálogo (quepasaaraucania) |
| ✅ | **Queilen** | `queilen.cl` | Los Lagos | database | sitemap en catálogo (queilen) |
| ✅ | **Quilpué Online** | `quilpueonline.cl` | Valparaiso | database | sitemap en catálogo (quilpueonline) |
| ⬜ | **Quinta Interior** | `quintainterior.cl` | Valparaiso | watchlist | sin feed RSS detectado |
| ✅ | **Quintero** | `quintero.cl` | Valparaiso | database | sitemap en catálogo (quintero) |
| ✅ | **Quirihue Noticias** | `quirihuenoticias.cl` | Nuble | database | sitemap en catálogo (quirihue_noticias) |
| ✅ | **Radio Magallanes** | `radiomagallanes.cl` | Magallanes | database | sitemap en catálogo (radiomagallanes) |
| ✅ | **Radio Maray** | `maray.cl` | Atacama | database | sitemap en catálogo (maray) |
| ✅ | **Radio Pirque** | `radiopirque.cl` | Metropolitana | database | sitemap en catálogo (radiopirque) |
| ⬜ | **Radio Polar** | `radiopolar.com` | — | watchlist | sin feed RSS detectado |
| ✅ | **Radio Puerta Norte** | `radiopuertanorte.cl` | Arica Y Parinacota | database | sitemap en catálogo (radiopuertanorte) |
| ✅ | **Radio Santa María** | `radiosantamaria.cl` | Aysen | database | sitemap en catálogo (radiosantamaria) |
| ⬜ | **Radio Siente** | `radiosiente.com` | — | database | Radio de emisión digital de la Región de Arica y Parinacota |
| ✅ | **Radio Ventisqueros** | `radioventisqueros.cl` | Aysen | database | sitemap en catálogo (radioventisqueros) |
| ⬜ | **Red Araucanía** | `redaraucania.com` | Araucania | watchlist | sin feed RSS detectado |
| ✅ | **Red Informativa** | `redinformativa.cl` | Araucania | database | sitemap en catálogo (redinformativa) |
| ⬜ | **Red Maule** | `redmaule.com` | Maule | watchlist | sin feed RSS detectado |
| ⬜ | **Red Valparaíso** | `redvalparaiso.com` | Valparaiso | watchlist | sin feed RSS detectado |
| ⬜ | **Región 2** | `region2.cl` | — | database | Medio de comunicación de la Región de Antofagasta |
| ⬜ | **Región de Coquimbo** | `regiondecoquimbo.cl` | Coquimbo | database | Medio digital con noticias locales, regionales y nacionales de la Región de Coquimbo. |
| ✅ | **Región Visual** | `regionvisual.com` | Valparaiso | database | sitemap en catálogo (regionvisual) |
| ✅ | **Regionalista** | `regionalista.cl` | Antofagasta | database | sitemap en catálogo (regionalista) |
| 🟡 | **Regiones Noticias** | `regionesnoticias.cl` | — | database | referenciado en src/content/sources/*.md |
| ⬜ | **Rengo Notas** | `rengonotas.cl` | Ohiggins | watchlist | feed stale (último item: 2026-01-28, 229 días) |
| ✅ | **Resonancia Diario** | `resonanciadiario.cl` | Antofagasta | database | sitemap en catálogo (resonanciadiario) |
| 🟡 | **Resumen** | `resumen.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Río en Línea** | `rioenlinea.cl` | Los Rios | database | sitemap en catálogo (rioenlinea) |
| ⬜ | **Río Negro Un Sueño** | `rionegro.ligup2.com` | Los Lagos | watchlist | HTTP error (404) |
| ✅ | **Sabes** | `sabes.cl` | — | watchlist | sin feed RSS detectado |
| ✅ | **Sala de Prensa** | `saladeprensa.cl` | Biobio | database | sitemap en catálogo (saladeprensa) |
| ⬜ | **San Carlos Al Día** | `sancarlosaldia.cl` | Nuble | watchlist | feed stale (último item: 2026-04-22, 145 días) |
| ✅ | **San Carlos On Line** | `sancarlosonline.cl` | Nuble | database | sitemap en catálogo (sancarlosonline) |
| ⬜ | **Séptima Página** | `septimapaginanoticias.cl` | — | watchlist | sitio no responde |
| ✅ | **Sera Noticia** | `seranoticia.cl` | Maule | database | sitemap en catálogo (seranoticia) |
| ✅ | **Serena y Coquimbo** | `serenaycoquimbo.cl` | Coquimbo | database | sitemap en catálogo (serenaycoquimbo) |
| ⬜ | **Sexta Noticias** | `sextanoticias.cl` | Ohiggins | watchlist | sitio no responde |
| ✅ | **Sitio del Suceso** | `sitiodelsuceso.cl` | Metropolitana | database | sitemap en catálogo (sitiodelsuceso) |
| ⬜ | **SoyAntofagasta** | `soyantofagasta.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyArica** | `soyarica.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyCalama** | `soycalama.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyChiloé** | `soychiloe.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyConcepción** | `soyconcepcion.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyCopiapó** | `soycopiapo.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyIquique** | `soyiquique.cl` | Tarapaca | watchlist | sitio no responde |
| ⬜ | **SoyOsorno** | `soyosorno.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyPuerto Montt** | `soypuertomontt.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyQuillota** | `soyquillota.cl` | Valparaiso | watchlist | sitio no responde |
| ⬜ | **SoyTemuco** | `soytemuco.cl` | — | watchlist | sitio no responde |
| ⬜ | **SoyValparaíso** | `soyvalparaiso.cl` | Valparaiso | watchlist | sitio no responde |
| ⬜ | **Sur Actual** | `suractual.cl` | Los Lagos | watchlist | sin feed RSS detectado |
| ✅ | **Tarapacá Online** | `tarapacaonline.cl` | Tarapaca | database | sitemap en catálogo (tarapacaonline) |
| ⬜ | **Tehuelche Noticias** | `tehuelchenoticias.cl` | Aysen | database | Medio regional de Aysén que cubre actualidad, política, entrevistas, columnas y noticias d |
| ✅ | **Temuco Diario** | `temucodiario.cl` | Araucania | database | sitemap en catálogo (temucodiario) |
| ⬜ | **Temuco Televisión** | `temucotelevision.cl` | Araucania | database | Canal de televisión online con noticias y coberturas de La Araucanía, especialmente Temuco |
| ⬜ | **Temuco Ya** | `temucoya.cl` | Araucania | database | Medio digital de noticias de Temuco y La Araucanía |
| ⬜ | **The Puerto Varas** | `thepuertovaras.cl` | Los Lagos | database | Medio digital de Puerto Varas y Los Lagos con noticias locales, economía, opinión, pódcast |
| ✅ | **Tiempo 21** | `tiempo21.cl` | Araucania | database | sitemap en catálogo (tiempo21) |
| ⬜ | **Tiempo 21 Araucanía** | `tiempo21araucania.cl` | Araucania | watchlist | sin feed RSS detectado |
| ✅ | **Tierramarillano** | `tierramarillano.cl` | Atacama | database | sitemap en catálogo (tierramarillano) |
| ✅ | **Timeline** | `timeline.cl` | Antofagasta | database | sitemap en catálogo (timeline_cl) |
| ✅ | **Tomé al Día** | `tomealdia.com` | Biobio | database | sitemap en catálogo (tomealdia) |
| ✅ | **Traiguén City** | `traiguencity.cl` | Araucania | database | sitemap en catálogo (traiguencity) |
| ⬜ | **Tribuna del Biobío** | `tribunadelbiobio.cl` | Biobio | watchlist | sin feed RSS detectado |
| ⬜ | **Tu Región Noticias** | `trnoticias.cl` | Maule | database | Portal regional centrado en el Maule, con noticias sobre política, educación, salud, depor |
| ✅ | **Tus Noticias** | `tusnoticias.cl` | Biobio | database | sitemap en catálogo (tusnoticias) |
| ⬜ | **TV Canal 5** | `tvcanal5.cl` | Los Lagos | database | Canal local de Puerto Montt con noticias y programación regional. |
| ⬜ | **TVO San Vicente** | `tvosanvicente.cl` | Ohiggins | database | Estación de televisión local de San Vicente de Tagua Tagua y Santa Cruz, Región de O’Higgi |
| ✅ | **Vallenar Digital** | `portalweb.vallenardigital.cl` | Atacama | database | sitemap en catálogo (vallenardigital) |
| ✅ | **Valparaíso Noticias** | `valparaisonoticias.cl` | Valparaiso | database | sitemap en catálogo (valparaisonoticias) |
| ⬜ | **Vértice TV** | `verticetv.cl` | Los Lagos | database | Canal regional y digital de Puerto Montt y Osorno con actualidad, acuicultura, deportes, c |
| ⬜ | **Viento Patagón** | `vientopatagon.cl` | Magallanes | watchlist | sitio no responde |
| ✅ | **Villarrica al Día** | `villarricaldia.cl` | Araucania | database | sitemap en catálogo (villarricaldia) |
| ✅ | **VLN Radio** | `vlnradio.cl` | Maule | database | sitemap en catálogo (vlnradio) |
| ✅ | **Zona Zero** | `zonazero.cl` | Magallanes | database | sitemap en catálogo (zonazero) |

## Leyenda

- ✅ **En catálogo:** el sitemap del medio ya está sincronizado en `sitemaps/<slug>/`.
- 🟡 **En uso:** el medio ya aparece como fuente en `sources.yaml` o como org de prensa en `entities.yaml`, pero su sitemap aún no se sincroniza — prioridad para ampliar el catálogo.
- 🔒 **Sin sitemap:** el sitio fue verificado y no expone sitemap; no reintentar.
- ⬜ **Pendiente:** sitio de prensa sin sitemap en el catálogo ni referencia en el vault.

## Instrucciones para agregar un medio nuevo

1. Verificar el sitemap del sitio (robots.txt o `/sitemap.xml`).
2. Agregar la entrada a `MEDIA` en `scripts/sitemaps/sync.mjs` (slug, nombre, sitemaps, filtro).
3. Sincronizar: `pnpm run sitemaps-sync -- <slug>`.
4. Regenerar README/AGENTS: `pnpm run sitemaps-index`.
5. Agregar dominio y nombre a `CATALOG_MEDIO_BY_DOMAIN`/`CATALOG_MEDIO_NAMES` de `scripts/extract/add-source.mjs`.
6. Registrar la org de prensa en `entities.yaml` si no existe (regla de wikilinks).
7. Actualizar este archivo: `pnpm run sitemaps-watchlist` (o `--source <ruta>` / `--offline`).
