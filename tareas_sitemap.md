# Tareas — Ampliación del catálogo de sitemaps

> Bitácora de sitios de prensa chilenos para sincronizar su sitemap al catálogo
> local (`sitemaps/<medio>/`) y así poder revisar eventos de gobiernos pasados
> con mayor variedad de puntos de vista al verificar datos.
>
> **Fuente de sitios:** [awesome-chilean-rss](https://github.com/Alplox/awesome-chilean-rss)
> — `feeds-database.json` (sitios con feeds verificados) y `watchlist.json`
> (candidatos, muchos sin feed RSS o con solo proxies de Google/Bing News).
> Este archivo se genera con `pnpm run sitemaps-watchlist -- --source <ruta-al-repo>`.
>
> **Cómo usar:** cada fila pendiente (`⬜`) se sincroniza con
> `pnpm run sitemaps-sync -- <slug>` (tras agregar el medio a `MEDIA` en
> `scripts/sync-sitemaps.mjs`) o se descarta si el sitio no tiene sitemap.
> Los sitios de la watchlist suelen no tener sitemap (solo RSS) — se marcan para
> intentar el sync y registrar el resultado.

## Resumen

- **Total de sitios de prensa listados:** 885
- ✅ En catálogo local: **77**
- 🟡 Ya usados en el vault (sources.yaml/orgs) sin sitemap: **158**
- 🔒 Verificados sin sitemap: **15**
- ⬜ Pendientes de sincronizar: **635**

Categorías consideradas (prensa y afines): Noticias nacionales, Noticias internacionales, Regional, Gobierno / instituciones, Radio, Partidos políticos, Negocios / economía, Comunidad / sociedad civil, Medio ambiente, Educación, Salud, Cultura.
Se excluyen: deportes, gaming, empleos, entretenimiento y tecnología.

## Sitios por categoría

### Negocios / economía (business)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **(Empresa) Apex Pymes** | `apexpymes.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **(Empresa) Contapapaya** | `contapapaya.cl` | — | database | Plataforma de contabilidad online para pymes chilenas, con artículos sobre contabilidad y |
| ⬜ | **(Empresa) Logros Servicios Financieros** | `empresaslogros.cl` | — | database | Servicios financieros y contables, con artículos sobre finanzas y asesoría tributaria |
| ⬜ | **(Empresa) Nexos Chile** | `nexos.cl` | — | database | Consultora de comunicación estratégica y asuntos públicos |
| ✅ | **ABIF** | `abif.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Acero y Roca** | `aceroyroca.com` | — | database | referenciado en sources.yaml |
| ✅ | **AmCham Chile** | `amchamchile.cl` | — | watchlist | Feed RSS existe pero vacío (0 ítems en feed) |
| ⬜ | **América Economía** | `americaeconomia.com` | — | watchlist | Sitio no responde |
| ⬜ | **AQUA** | `aqua.cl` | — | database | Revista especializada del sector acuícola, pesquero y medio ambiente |
| ⬜ | **BancoEstado** | `bancoestado.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Cámara Chilena de la Construcción** | `cchc.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Cámara de Comercio de Santiago** | `ccs.cl` | — | watchlist | Feed RSS detectado (WordPress) pero devuelve error 500 |
| ✅ | **Chile País Minero** | `chilepaisminero.com` | — | database | sitemap en catálogo (chilepaisminero) |
| ✅ | **Chocale** | `chocale.cl` | — | database | sitemap en catálogo (chocale) |
| 🟡 | **Diario Agrícola** | `diarioagricola.com` | — | database | referenciado en sources.yaml |
| ✅ | **Diario Estrategia** | `diarioestrategia.cl` | — | database | sitemap en catálogo (diarioestrategia) |
| ✅ | **Diario Financiero** | `df.cl` | — | database | sitemap en catálogo (df) |
| ⬜ | **Diario Pyme** | `diariopyme.com` | — | watchlist | Sitio no accesible |
| ⬜ | **Economía y Negocios** | `economiaynegocios.cl` | — | watchlist | Sitio no responde (error de conexión) |
| ⬜ | **El Periódico de la Energía** | `elperiodicodelaenergia.com` | — | database | Noticias del sector energético en español |
| ⬜ | **Electrominería** | `electromineria.cl` | — | database | Medio chileno especializado en electromovilidad y minería |
| ⬜ | **Energía Estratégica** | `energiaestrategica.com` | — | watchlist | No RSS feed detected (site returns HTML en todas las rutas de /feed/, /rss/) |
| ⬜ | **Estrategia** | `estrategia.cl` | — | watchlist | Sitio no responde (error de conexión) |
| ⬜ | **Forbes Chile** | `forbeschile.com` | — | watchlist | Sitio no responde |
| ⬜ | **ICARE** | `icare.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Instituto de la Construcción** | `iconstruccion.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Los Abogados Laborales** | `losabogadoslaborales.cl` | — | watchlist | No se detectó feed RSS |
| ⬜ | **MCH (Mineria Chilena)** | `mch.cl` | — | database | MCH, medio de comunicación especializado en minería, construcción y energía |
| ⬜ | **NSS** | `nss.cl` | — | watchlist | No se detectó feed RSS |
| 🟡 | **Portal Agro Chile** | `portalagrochile.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Portal del Agro** | `portaldelagro.cl` | — | watchlist | Sitio no responde, sin feed RSS detectado |
| ✅ | **Portal Frutícola** | `portalfruticola.com` | — | database | Portal especializado en el sector frutícola chileno |
| ✅ | **Portal Minero** | `portalminero.com` | — | database | Portal chileno de la industria minera |
| ✅ | **PortalPortuario** | `portalportuario.cl` | — | database | Medio especializado en puertos, transporte marítimo y comercio exterior en español |
| ⬜ | **pv magazine Latin America** | `pv-magazine-latam.com` | — | database | Noticias de la industria solar fotovoltaica en Latinoamérica |
| ✅ | **REDIMIN** | `redimin.cl` | — | database | sitemap en catálogo (redimin) |
| ✅ | **Reporte Agrícola** | `reporteagricola.cl` | — | watchlist | Sin feed RSS detectado (path /feed/ devuelve texto plano, no XML RSS) |
| 🟡 | **Reporte Minero** | `reporteminero.cl` | — | watchlist | WordPress sin feed RSS detectable (todas las rutas /* retornan HTML homepage) |
| ⬜ | **Revista Capital** | `capital.cl` | — | watchlist | Sitio no responde |
| ⬜ | **SalmonExpert** | `salmonexpert.cl` | — | watchlist | Sin feed RSS detectado (Labrador CMS, todos los feed paths devuelven 404) |
| ✅ | **SOFOFA** | `sofofa.cl` | — | database | Sociedad de Fomento Fabril, gremio empresarial industrial de Chile |
### Comunidad / sociedad civil (community)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **Aldeas Infantiles SOS Chile** | `aldeasinfantiles.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Anda** | `anda.cl` | — | database | Plataforma chilena de ofertas y compras grupales |
| ⬜ | **ANEF** | `anef.cl` | — | database | Asociación Nacional de Empleados Fiscales |
| ⬜ | **Atención Chilena** | `atencionchilena.cl` | — | watchlist | Feed RSS detectado pero sin items (feed vacío) |
| ⬜ | **Bomberos de Chile** | `bomberos.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Capa9** | `capa9.net` | — | database | Comunidad chilena de tecnología, hardware y reviews |
| ⬜ | **Chile Travel** | `chile.travel` | — | database | Sitio Servicio Nacional de Turismo para impulsar turismo |
| ⬜ | **Coaniquem** | `coaniquem.cl` | — | database | Coaniquem, fundación chilena de atención integral al niño quemado |
| ⬜ | **CODEPU** | `codepu.cl` | — | database | Corporación de Defensa de los Derechos del Pueblo, con comunicados y noticias sobre derech |
| ⬜ | **ComunidadMujer** | `comunidadmujer.cl` | — | database | ComunidadMujer, organización chilena por la autonomía y participación de las mujeres |
| ⬜ | **Corporación La Morada** | `lamorada.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Cupones Chile** | `cuponeschile.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **CUT (Central Unitaria de Trabajadores de Chile)** | `cut.cl` | — | database | Central sindical que representa a trabajadores del sector público y privado en Chile |
| ⬜ | **Defensa Civil de Chile** | `defensacivil.cl` | — | database | Defensa Civil de Chile, institución de voluntariado para emergencias y catástrofes |
| ⬜ | **Diario El Itihue** | `diarioelitihue.blogspot.com` | — | database | Blog chileno de noticias comunitarias y crónica social |
| 🟡 | **FASIC** | `fasic.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Federación CCU** | `federacionccu.cl` | — | database | Federación Nacional Sindicatos Holding Heineken CCU |
| ⬜ | **Fundación Chile** | `fch.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2026-03) |
| ⬜ | **Fundación Iguales** | `iguales.cl` | — | database | Fundación Iguales, organización chilena por los derechos de las diversidades sexuales |
| ⬜ | **Fundación Las Rosas** | `lasrosas.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2020-01) |
| ⬜ | **Fundación Paréntesis** | `fundacionparentesis.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Fundación Superación de la Pobreza** | `fundacionpobreza.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Guía Turismo Chile** | `guiaturismo.cl` | — | database | Guía turística de destinos y actividades en Chile |
| ⬜ | **Hogar de Cristo** | `hogardecristo.cl` | — | database | Hogar de Cristo, fundación chilena de ayuda social y superación de la pobreza |
| ⬜ | **Iglesia.cl** | `iglesia.cl` | — | watchlist | No se detectó feed RSS — sitio web con CMS PHP personalizado sin soporte RSS |
| ⬜ | **Los Angeles** | `losangeles.cl` | Biobio | watchlist | /feed/ devuelve 500 error (WordPress con problemas técnicos) |
| ⬜ | **Mapuche Info** | `mapuche.info` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Mapuche NL** | `mapuche.nl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Mastodon Chile** | `mastodon.cl` | — | database | Instancia(s) chilena(s) de Mastodon (red social descentralizada) |
| ⬜ | **Mi Voz** | `comercial.mivoz.cl` | — | watchlist | Sitio sin feed RSS detectado |
| ⬜ | **MUMS** | `mums.cl` | — | watchlist | Feed RSS sin actividad reciente |
| ⬜ | **Observatorio Ciudadano** | `observatorio.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Reddit** | `reddit.com` | — | database | Reddit feeds from various chilean subreddits |
| ⬜ | **Supervivencia y Desastres** | `supervivencia-y-desastres.cl` | — | database | Blog chileno de preparación ante emergencias y supervivencia |
| ⬜ | **TECHO Chile** | `cl.techo.org` | — | database | TECHO, organización que trabaja con comunidades en situación de pobreza en Chile |
| ⬜ | **Teletón Chile** | `teleton.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Triunfo** | `triunfo.cl` | — | watchlist | Sin feed RSS detectado (sitio tipo red social/Elgg) |
| ⬜ | **Turismo en Chile** | `turismoenchile.cl` | — | watchlist | Sitio PHP personalizado sin feed RSS detectado |
| ⬜ | **Turismochile.cl (Beta)** | `beta.turismochile.cl` | — | watchlist | Sitio HTML estático sin feed RSS detectado |
| ⬜ | **UNICEF Chile** | `unicef.org` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Vicaría de la Solidaridad** | `vicariadelasolidaridad.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2022) |
| ⬜ | **XOX cl - Recursos e información para emprendedores** | `xox.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
### Cultura (culture)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **50 años del Golpe de Estado** | `50.cultura.gob.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Balmaceda Arte Joven** | `balmacedartejoven.cl` | — | database | Fundación de formación artística juvenil con sedes en varias regiones |
| ⬜ | **Biblioteca Nacional de Chile** | `bibliotecanacional.gob.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **CaballoyRodeo** | `caballoyrodeo.cl` | — | watchlist | Sitio sin feed RSS detectado |
| ⬜ | **Centro Cultural La Moneda** | `cclm.cl` | — | database | Centro cultural y de exposiciones en Santiago |
| ⬜ | **Centro GAM** | `gam.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Chile Cultura** | `chilecultura.gob.cl` | — | database | Plataforma del Ministerio de las Culturas, las Artes y el Patrimonio |
| ⬜ | **Chile es Tuyo** | `chileestuyo.cl` | — | database | Portal de turismo y viajes del Gobierno de Chile |
| ⬜ | **CineChile** | `cinechile.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Editorial Quimantú** | `quimantu.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Fundación Cultural de Providencia** | `culturaprovidencia.cl` | — | database | Corporación cultural de la comuna de Providencia, Santiago |
| ⬜ | **Fundación Teatro a Mil** | `teatroamil.cl` | — | watchlist | Sitio web institucional, sin feed RSS detectado |
| ⬜ | **La Tendencia** | `latendencia.cl` | — | database | Medio digital de noticias y tendencias de cultura, internet, deportes y vida sana |
| 🟡 | **Londres 38** | `londres38.cl` | — | watchlist | No feed RSS detectado |
| ⬜ | **Memoria Chilena** | `memoriachilena.gob.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **Mestizos Magazine** | `mestizos.cl` | — | database | sitemap en catálogo (mestizos) |
| ⬜ | **Museo de Arte Contemporáneo** | `mac.uchile.cl` | — | database | Museo de Arte Contemporáneo de la Universidad de Chile |
| ⬜ | **Museo de la Memoria** | `museodelamemoria.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Museo Nacional de Bellas Artes** | `mnba.gob.cl` | — | watchlist | Feed RSS existe pero vacío (0 ítems en rss.xml) |
| ⬜ | **Museo Violeta Parra** | `museovioletaparra.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2026-06) |
| ⬜ | **MusicaPopular.cl** | `musicapopular.cl` | — | watchlist | Feed RSS existe pero vacío (0 ítems en feed) |
| ⬜ | **Teatro Municipal de Santiago** | `municipal.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2022) |
| 🟡 | **Unnie Pop** | `unniepop.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Villa Grimaldi** | `villagrimaldi.cl` | — | database | Corporación Parque por la Paz Villa Grimaldi, sitio de memoria histórica y derechos humano |
### Educación (education)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **Actualidad UDLA** | `actualidad.udla.cl` | — | database | Portal de actualidad e información de la Universidad de Las Américas |
| ⬜ | **ANID** | `anid.cl` | — | database | Agencia Nacional de Investigación y Desarrollo |
| ⬜ | **Ayuda Mineduc** | `ayudamineduc.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2021) |
| ⬜ | **CEP Chile** | `cepchile.cl` | — | database | Centro de estudios e investigación dedicado al análisis de políticas públicas, economía y |
| 🟡 | **CLAPES UC** | `clapesuc.cl` | — | watchlist | No se detectó feed RSS |
| ⬜ | **Colegio Alemán de Santiago** | `dsstgo.cl` | — | database | Colegio alemán de Santiago (Deutsche Schule) |
| ⬜ | **Colegio Atenea** | `colegioatenea.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Colegio Cordillera** | `colegiocordillera.cl` | — | database | Colegio privado de Santiago, miembro de la red SEDUC |
| ⬜ | **Colegio San Ignacio El Bosque** | `sanignacio.cl` | — | database | Colegio jesuita privado de Santiago |
| ⬜ | **Colegio Tabancura** | `tabancura.cl` | — | database | Colegio privado de Santiago, miembro de la red SEDUC |
| ⬜ | **Colegio Verbo Divino** | `verbodivino.cl` | — | database | Colegio privado de Santiago |
| ⬜ | **Explora** | `explora.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Instituto Nacional** | `institutonacional.cl` | — | database | Liceo público de Santiago |
| ⬜ | **JUNJI** | `junji.cl` | — | database | Junta Nacional de Jardines Infantiles - institución de educación parvularia |
| ⬜ | **Liceo Brainstorm Temuco** | `liceobrainstorm.cl` | — | database | Liceo particular de Temuco |
| ⬜ | **Liceo de Aplicación** | `liceodeaplicacion.cl` | — | database | Liceo público de Santiago |
| ⬜ | **Liceo N°1 Javiera Carrera** | `liceo1.cl` | — | database | Liceo público de Santiago |
| ⬜ | **Profesor en línea** | `profesorenlinea.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **PUC (Pontificia Universidad Católica)** | `uc.cl` | — | database | Noticias e investigación de la PUC |
| ✅ | **PUCV** | `pucv.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Red Educacional Crecemos** | `redcrecemos.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Revista de Sociología** | `revistadesociologia.uchile.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Revista Signos. Estudios de Lingüística** | `revistasignos.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Saint George's College** | `saintgeorge.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2022) |
| ⬜ | **SIP Red de Colegios** | `sip.cl` | — | database | Red de colegios de la Sociedad de Instrucción Primaria de Santiago |
| ⬜ | **Sistema de Admisión Escolar** | `sistemadeadmisionescolar.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **The Grange School** | `grange.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **U. del Bío-Bío** | `ubiobio.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **UACh** | `uach.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **UCSC** | `ucsc.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Universia Chile** | `noticias.universia.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **Universidad Adolfo Ibáñez** | `uai.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Universidad Andrés Bello** | `unab.cl` | — | database | Universidad privada chilena con sedes en Santiago, Viña del Mar y Concepción |
| ⬜ | **Universidad Autónoma de Chile** | `uautonoma.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Universidad Católica del Norte** | `ucn.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Universidad de Antofagasta** | `uantof.cl` | — | watchlist | Feed RSS existe (WordPress) pero devuelve 0 ítems en todas las rutas probadas |
| ⬜ | **Universidad de Chile** | `uchile.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Universidad de Concepción** | `noticias.udec.cl` | — | database | Noticias e investigación de la Universidad de Concepción |
| ⬜ | **Universidad de La Frontera** | `ufro.cl` | — | database | Noticias e investigación de la UFRO, Temuco |
| ⬜ | **Universidad de Las Américas** | `udla.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Universidad de Talca** | `utalca.cl` | — | database | Noticias e investigación de la Universidad de Talca |
| ⬜ | **Universidad de Valparaíso** | `uv.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Universidad Diego Portales** | `udp.cl` | — | database | Universidad privada de Santiago |
| ✅ | **Universidad Mayor** | `umayor.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Universidad San Sebastián** | `uss.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2023) |
| ✅ | **Universidad Técnica Federico Santa María** | `usm.cl` | — | database | Universidad técnica estatal con sede en Valparaíso |
| ⬜ | **USACH** | `usach.cl` | — | watchlist | Feed RSS existe pero vacío (0 ítems en rss.xml) |
| 🟡 | **UTE USACH Noticias** | `corporacionuteusach-noticias.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Vergara 240** | `vergara240.udp.cl` | — | database | Medio digital de la Escuela de Periodismo de la Universidad Diego Portales |
### Medio ambiente (environment)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **Acción Climática** | `accionclimatica.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **ACERA** | `acera.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Aguas Andinas** | `aguasandinas.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Chile Sustentable** | `chilesustentable.net` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **CODEFF** | `codeff.cl` | — | database | Comité Nacional Pro Defensa de la Fauna y Flora (CODEFF), organización ambientalista chile |
| 🟡 | **Codex Verde** | `codexverde.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Conservación Patagónica** | `conservacionpatagonica.org` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **CR2 - Centro de Ciencia del Clima y la Resiliencia** | `cr2.cl` | — | database | Centro de Ciencia del Clima y la Resiliencia - Comunidad científica chilena |
| ⬜ | **Diario Sustentable** | `dsustentable.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **ECOceanos** | `ecoceanos.cl` | — | database | Organización chilena dedicada a la defensa del océano, la biodiversidad marina y los ecosi |
| ⬜ | **Ecosistemas** | `ecosistemas.cl` | — | database | Ecosistemas, revista y organización chilena de medio ambiente y sustentabilidad |
| ⬜ | **FIMA (Fiscalía del Medio Ambiente)** | `fima.cl` | — | database | FIMA (Fiscalía del Medio Ambiente), ONG chilena de defensa legal ambiental |
| ⬜ | **Fundación Adapta** | `adapta.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Fundación Legado Chile** | `legadochile.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Fundación Reforestemos** | `reforestemos.cl` | — | watchlist | Feed RSS existe pero vacío (0 ítems en feed) |
| ⬜ | **Fundación Rewilding Chile** | `rewildingchile.org` | — | database | Fundación Rewilding Chile, organización de conservación y restauración de ecosistemas |
| 🟡 | **Fundación Terram** | `terram.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Generadoras de Chile** | `generadoras.cl` | — | database | Asociación de Generadoras de Chile, gremio de empresas de generación eléctrica |
| ⬜ | **Greenpeace Chile** | `greenpeace.org` | — | database | Greenpeace Chile, organización ambientalista con campañas locales en Chile |
| ⬜ | **Induambiente** | `induambiente.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Instituto Antártico Chileno** | `inach.cl` | — | database | Instituto Antártico Chileno (INACH), organismo público de ciencia antártica |
| ⬜ | **Instituto de Ecología y Biodiversidad** | `ie-b.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Ladera Sur** | `laderasur.com` | — | database | Medio de comunicación y multiplataforma sobre naturaleza, conservación, medio ambiente, ci |
| ⬜ | **Meteored Chile** | `meteored.cl` | — | database | Información meteorológica y pronóstico del tiempo a 14 días para Chile |
| ⬜ | **Oceana Chile** | `oceana.org` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **OLCA** | `olca.cl` | — | watchlist | No se detectó feed RSS |
| ⬜ | **Patagonia.cl** | `patagonia.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Semillas de Agua** | `semillasdeagua.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Tierra Adentro** | `tierraadentro.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **WCS Chile** | `chile.wcs.org` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **WWF Chile** | `wwf.cl` | — | watchlist | Sin feed RSS detectado |
### Gobierno / instituciones (government)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **ANCI** | `anci.gob.cl` | — | watchlist | Sitio gubernamental sin feed RSS detectado |
| ⬜ | **ANEPE** | `anepe.cl` | — | watchlist | Sitio WordPress sin feed detectable (HTTP 500 en /feed/) |
| 🟡 | **Banco Central de Chile** | `bcentral.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Biblioteca del Congreso Nacional (BCN)** | `bcn.cl` | — | database | Biblioteca del Congreso Nacional de Chile - Servicios de información legislativa y parlame |
| ⬜ | **Cámara de Diputadas y Diputados** | `camara.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Chile** | `chile.gob.cl` | — | watchlist | No se detectó feed RSS — sitio web sin soporte RSS |
| ⬜ | **ChileAtiende** | `chileatiende.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **ChileCompra** | `chilecompra.cl` | — | database | Plataforma estatal de licitaciones y compras públicas |
| 🔒 | **Comisión Nacional de Energía** | `cne.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **CONAF** | `conaf.cl` | — | database | Corporación Nacional Forestal - incendios, parques y biodiversidad |
| ✅ | **Consejo para la Transparencia** | `consejotransparencia.cl` | — | database | Sitio oficial del Consejo para la Transparencia de Chile, con noticias, dictámenes y resol |
| ⬜ | **Contraloría General** | `contraloria.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **CORFO** | `corfo.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Defensoría de la Niñez** | `defensorianinez.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Delegación Presidencial Regional La Araucanía** | `dprlaaraucania.dpr.gob.cl` | Araucania | watchlist | No se detectó feed RSS en el sitio |
| 🟡 | **Diario Constitucional** | `diarioconstitucional.cl` | — | watchlist | Feed no verificable (protección Cloudflare) |
| ⬜ | **Diario Oficial** | `diariooficial.interior.gob.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Dirección de Presupuestos** | `dpp.cl` | — | watchlist | No se detectó feed RSS — sitio web sin soporte RSS |
| ⬜ | **Dirección del Trabajo** | `dt.gob.cl` | — | watchlist | Sin feed RSS detectado |
| 🔒 | **EFE** | `efe.cl` | — | database | verificado sin sitemap (solo RSS /feed/) |
| 🔒 | **Fiscalía de Chile** | `fiscaliadechile.cl` | — | database | verificado sin sitemap (Drupal 10 sin xmlsitemap) |
| ✅ | **Gobierno de Chile** | `gob.cl` | — | database | sitemap en catálogo (gob) |
| ⬜ | **Gobierno en Terreno** | `gobiernoenterreno.interior.gob.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Gobierno Regional de Tarapacá** | `goretarapaca.gov.cl` | — | database | Gobierno Regional de Tarapacá |
| ⬜ | **Gobierno Regional Metropolitano de Santiago** | `gobiernosantiago.cl` | — | database | Gobierno Regional de la Región Metropolitana de Santiago |
| ⬜ | **Ilustre Municipalidad de Santiago** | `munistgo.cl` | — | database | Ilustre Municipalidad de Santiago, sitio oficial con noticias, trámites y servicios munici |
| ⬜ | **INE** | `ine.gob.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Instituto de Salud Pública** | `ispch.cl` | — | database | Sitio oficial del Instituto de Salud Pública de Chile |
| ⬜ | **MercadoPublico** | `mercadopublico.cl` | — | database | Plataforma oficial de compras públicas y licitaciones del Estado de Chile |
| ⬜ | **Metro de Santiago** | `metro.cl` | — | watchlist | No se detectó feed RSS |
| ⬜ | **Ministerio de Agricultura** | `minagri.gob.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **Ministerio de Bienes Nacionales** | `bienesnacionales.cl` | — | database | Sitio oficial del Ministerio de Bienes Nacionales de Chile |
| ⬜ | **Ministerio de Ciencia, Tecnología, Conocimiento e Innovación** | `minciencia.gob.cl` | — | watchlist | Sitio no responde |
| ⬜ | **Ministerio de Desarrollo Social y Familia** | `desarrollosocialyfamilia.gob.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **Ministerio de Economía, Fomento y Turismo** | `economia.gob.cl` | — | database | Sitio oficial del Ministerio de Economía, Fomento y Turismo de Chile - Noticias y comunica |
| 🟡 | **Ministerio de Educación** | `mineduc.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Ministerio de Energía** | `energia.gob.cl` | — | watchlist | No se detectó feed RSS — sitio web sin soporte RSS |
| 🟡 | **Ministerio de Hacienda** | `hacienda.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Ministerio de Justicia y Derechos Humanos** | `minjusticia.gob.cl` | — | watchlist | Sitio no responde |
| ⬜ | **Ministerio de la Mujer y la Equidad de Género** | `minmujeryeg.gob.cl` | — | database | Sitio oficial del Ministerio de la Mujer y la Equidad de Género de Chile |
| ⬜ | **Ministerio de las Culturas, las Artes y el Patrimonio** | `cultura.gob.cl` | — | database | Sitio oficial del Ministerio de las Culturas, las Artes y el Patrimonio de Chile |
| 🔒 | **Ministerio de Minería** | `minmineria.cl` | — | watchlist | Sitio no responde |
| 🟡 | **Ministerio de Obras Públicas** | `mop.gob.cl` | — | database | referenciado en sources.yaml |
| ✅ | **Ministerio de Relaciones Exteriores** | `minrel.gob.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| 🟡 | **Ministerio de Salud** | `minsal.cl` | — | database | referenciado en sources.yaml |
| ✅ | **Ministerio de Transportes y Telecomunicaciones** | `mtt.gob.cl` | — | database | Sitio oficial del Ministerio de Transportes y Telecomunicaciones de Chile |
| 🟡 | **Ministerio de Vivienda y Urbanismo** | `minvu.gob.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Ministerio del Deporte** | `mindep.cl` | — | watchlist | Sitio no responde |
| 🟡 | **Ministerio del Interior** | `interior.gob.cl` | — | watchlist | Sitio no responde |
| 🟡 | **Ministerio del Medio Ambiente** | `mma.gob.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **Ministerio del Trabajo y Previsión Social** | `mintrab.gob.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **Ministerio Secretaría General de Gobierno** | `msgg.gob.cl` | — | watchlist | Sitio no responde |
| ⬜ | **Ministerio Secretaría General de la Presidencia** | `minsegpres.gob.cl` | — | watchlist | Feed no accesible (HTTP 403) |
| ⬜ | **Municipalidad de Alto Biobío** | `munialtobiobio.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **Municipalidad de Providencia** | `providencia.cl` | — | watchlist | No se detectó feed RSS |
| ⬜ | **Municipalidad de Traiguén** | `mtraiguen.cl` | Araucania | watchlist | Sitio municipal redirige (302), sin feed RSS |
| ⬜ | **Municipalidad de Viña del Mar** | `munivina.cl` | — | watchlist | Feed nativo vacío, solo feeds proxy activos |
| ⬜ | **Poder Judicial** | `pjud.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Prensa Presidencia** | `prensa.presidencia.cl` | — | watchlist | sitio no responde |
| ⬜ | **ProChile** | `prochile.gob.cl` | — | watchlist | Feed nativo sin contenido activo, solo feeds proxy activos |
| 🟡 | **Publilegales** | `publilegales.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Radio Cámara** | `radiocamara.cl` | — | database | Radio de la Cámara de Diputadas y Diputados de Chile |
| ⬜ | **SEA Chile** | `sea.gob.cl` | — | watchlist | feed stale (último item: 2025-12-09, 237 días) |
| ⬜ | **SENADIS** | `senadis.gob.cl` | — | watchlist | No se detectó feed RSS — sitio web sin soporte RSS |
| ✅ | **Senado** | `senado.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **SENAPRED** | `senapred.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SENCE** | `sence.gob.cl` | — | database | Servicio Nacional de Capacitación y Empleo |
| ⬜ | **SENDA** | `senda.gob.cl` | — | watchlist | Feed RSS existe pero vacío (0 ítems en feed) |
| ⬜ | **SERNAC** | `sernac.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SERNATUR (Servicio Nacional de Turismo)** | `sernatur.cl` | — | database | Servicio Nacional de Turismo de Chile - promoción y desarrollo del turismo nacional |
| ⬜ | **Servicio Agrícola y Ganadero** | `sag.gob.cl` | — | database | Sitio oficial del Servicio Agrícola y Ganadero de Chile - Noticias del sector agropecuario |
| ⬜ | **Servicio Hidrográfico y Oceanográfico de la Armada (SHOA)** | `shoa.cl` | — | watchlist | Sitio gubernamental sin feed RSS detectado |
| ⬜ | **Servicio Hidrográfico y Oceanográfico de la Armada de Chile** | `snamchile.cl` | — | watchlist | Sitio gubernamental sin feed RSS detectado |
| ⬜ | **Servicio Nacional de Aduanas** | `aduana.cl` | — | watchlist | Sitio no responde |
| ⬜ | **SII (Servicio de Impuestos Internos)** | `sii.cl` | — | database | Servicio de Impuestos Internos de Chile |
| ⬜ | **SP (Superintendencia de Pensiones)** | `spensiones.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Subsecretaría de Turismo** | `subturismo.gob.cl` | — | database | Subsecretaría de Turismo del Gobierno de Chile - políticas y desarrollo del turismo |
| ⬜ | **Subsecretaría del Trabajo** | `subtrab.gob.cl` | — | database | Subsecretaría del Trabajo de Chile, políticas, programas y noticias del mundo laboral |
| ⬜ | **SUBTEL (Subsecretaría de Telecomunicaciones)** | `subtel.gob.cl` | — | database | Subsecretaría de Telecomunicaciones - regulación y conectividad en Chile |
| ⬜ | **Superintendencia de Salud** | `supersalud.gob.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **SUSESO (Superintendencia de Seguridad Social)** | `suseso.gob.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| 🟡 | **Tesorería General de la República** | `tgr.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Transparencia Activa Presidencia** | `transparenciaactiva.presidencia.cl` | — | watchlist | Sitio no accesible (error de certificado SSL) |
### Salud (health)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **ANAMED** | `anamed.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **CENABAST** | `cenabast.cl` | — | database | Central de Abastecimiento del Sistema Nacional de Servicios de Salud, organismo público de |
| ⬜ | **CIPS - Centro de Políticas Públicas e Innovación en Salud** | `gobierno.udd.cl` | — | database | Centro de Políticas Públicas e Innovación en Salud de la Universidad del Desarrollo |
| ⬜ | **Clínica Alemana** | `alemana.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Clínica Alemana Temuco** | `clinicaalemanatemuco.cl` | — | watchlist | Sitefinity CMS sin soporte RSS |
| ⬜ | **Clínica Las Condes** | `clinicalascondes.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Colegio de Enfermeras de Chile** | `colegiodeenfermeras.cl` | — | watchlist | Feed RSS existe pero sin contenido reciente (último item 2026-02) |
| ⬜ | **Colegio Médico de Chile** | `colegiomedico.cl` | — | database | Gremio de médicos de Chile, noticias de salud y medicina |
| ⬜ | **Cruz Roja Chilena** | `cruzroja.cl` | — | database | Cruz Roja Chilena, organización humanitaria de salud y socorro |
| ⬜ | **Escuela de Salud Pública U. de Chile** | `escuela.medicina.uchile.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Fonasa** | `fonasa.cl` | — | database | Fondo Nacional de Salud de Chile, noticias y comunicados |
| ⬜ | **Fundación Gabriel** | `fundaciongabriel.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Fundación IPSUSS** | `ipsuss.cl` | — | watchlist | No feed RSS detectado |
| ⬜ | **Fundación Nuestros Hijos** | `fnch.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Hospital Clínico U. de Chile** | `hospitalclinico.uchile.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Hospital Clínico UFRO** | `hospitalclinicoufro.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Hospital Digital** | `hospitaldigital.minsal.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Instituto Nacional del Tórax** | `torax.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Medwave** | `medwave.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Observatorio de Salud Pública UC** | `observatorio.medicina.uc.cl` | — | watchlist | Feed RSS no disponible (HTTP 500 en /feed/) |
| ⬜ | **Pediatría y Salud** | `pediatriaysalud.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **Portal Red Salud** | `portalredsalud.cl` | — | database | Portal chileno de noticias y contenidos sobre salud |
| ⬜ | **Revista Chilena de Pediatría** | `revistachilenadepediatria.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Revista Médica de Chile** | `revistamedicadechile.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Salud Responde** | `saludresponde.minsal.cl` | — | database | Portal de información del Ministerio de Salud para la ciudadanía |
| ⬜ | **Sociedad Chilena de Cardiología y Cirugía Cardiovascular** | `sochicar.cl` | — | database | Sociedad Chilena de Cardiología y Cirugía Cardiovascular, sociedad científica médica |
| ⬜ | **Sociedad Chilena de Endocrinología y Diabetes** | `soched.cl` | — | database | Sociedad Chilena de Endocrinología y Diabetes (SOCHED), sociedad científica médica |
| ⬜ | **Sociedad Chilena de Infectología** | `sochinf.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Sociedad Chilena de Obesidad** | `sochob.cl` | — | database | Sociedad científica médica dedicada al estudio de la obesidad |
| ⬜ | **Sociedad Chilena de Pediatría** | `sochipe.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Sociedad de Cirugía de Chile** | `sociedadcirugia.cl` | — | watchlist | Sin feed RSS detectado |
### Noticias nacionales (news)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **123.cl** | `noticias.123.cl` | — | watchlist | Sitio no responde (timeout) |
| 🟡 | **24 Horas** | `24horas.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **aDiarioCR** | `adiariocr.com` | — | database | Periódico digital con noticias de Chile y el mundo |
| ✅ | **ADN Radio** | `adnradio.cl` | — | database | sitemap en catálogo (adnradio) |
| ⬜ | **Agencia de Noticias** | `agenciadenoticias.org` | — | database | Agencia chilena de noticias con cobertura en actualidad, tecnología, medio ambiente y cult |
| ⬜ | **Amarillos por Chile** | `amarillosxchile.cl` | — | watchlist | Sitio no responde (DNS no resuelve, partido disuelto Feb 2026) |
| ⬜ | **Aurora Noticias** | `auroranoticias.cl` | — | database | Portal chileno de noticias nacionales e internacionales |
| ⬜ | **Base Nacional** | `basenacional.cl` | — | database | Medio de información nacional con noticias de actualidad, política, economía y sociedad |
| ✅ | **BioBioChile** | `biobiochile.cl` | — | database | sitemap en catálogo (biobiochile) |
| 🟡 | **Cambio21** | `cambio21.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **Canal 13** | `13.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| ⬜ | **Canal de Noticias** | `canaldenoticias.cl` | — | watchlist | Sitio caído (HTTP 410 Gone), sin feed RSS detectado |
| ⬜ | **CentralWeb** | `centralweb.cl` | — | database | Noticias de Chile con cobertura nacional e internacional |
| 🟡 | **Chile Mejor Sin TLC** | `mejorsintlc.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Chilena FM** | `chilenafm.cl` | — | database | Emisora FM regional |
| ⬜ | **Chilenews** | `chilenews.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **ChileNoticias** | `chilenoticias.cl` | — | database | Periodismo de inteligencia - Reportes sobre política y contingencia nacional |
| 🟡 | **Chilevisión** | `chilevision.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| ✅ | **Ciper Chile** | `ciperchile.cl` | — | database | sitemap en catálogo (ciper) |
| ✅ | **CNN Chile** | `cnnchile.com` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Cóndor** | `condor.cl` | Metropolitana | database | Periódico digital chileno de información general y análisis político |
| 🟡 | **Contingencia Chile** | `contingenciachile.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **Contrapoder Chile** | `contrapoderchile.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Correo de los Trabajadores** | `cctt.cl` | — | database | Quincenario de los trabajadores chilenos |
| ⬜ | **CREAS UAH** | `creas.uahurtado.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| 🟡 | **Crónicas de Chile** | `cronicasdechile.cl` | — | watchlist | Sitio no responde (DNS) |
| 🟡 | **Desenfoque** | `desenfoque.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Diario Chile** | `diariochile.cl` | — | database | Medio de comunicación digital independiente con noticias nacionales e internacionales |
| ⬜ | **Diario El Observador** | `diarioelobservador.cl` | — | watchlist | Sitio no responde (error de conexión) |
| ⬜ | **Diario El Progreso** | `diarioelprogreso.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Diario Informativo** | `diarioinformativo.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Diario La Portada** | `diariolaportada.cl` | — | watchlist | Sitio no responde, sin feed RSS detectado |
| ⬜ | **Diario La Tribuna** | `diariolatribuna.cl` | — | watchlist | Sin feed RSS detectado (responde HTML en todas las rutas) |
| 🟡 | **Diario USACH** | `diariousach.cl` | — | watchlist | CMS Prontus sin feed RSS |
| 🟡 | **El Arrebato** | `elarrebato.cl` | — | database | referenciado en sources.yaml |
| ✅ | **El Ciudadano** | `elciudadano.com` | — | database | sitemap en catálogo (elciudadano) |
| ✅ | **El Clarín de Chile** | `elclarin.cl` | — | database | sitemap en catálogo (elclarin) |
| ⬜ | **El Corto** | `elcorto.cl` | — | database | Resumen diario de las noticias más importantes de Chile - Autodenominado el diario para lo |
| ⬜ | **El Definido** | `eldefinido.cl` | — | watchlist | Feed RSS sin actualizar desde 2019, sitio parece inactivo |
| ✅ | **El Desconcierto** | `eldesconcierto.cl` | — | database | sitemap en catálogo (eldesconcierto) |
| 🟡 | **El Diario de Santiago** | `eldiariodesantiago.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **El Dínamo** | `eldinamo.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Filtrador** | `elfiltrador.com` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Gong** | `diarioelgong.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| 🟡 | **El Hilo** | `elhilo.cl` | — | watchlist | Sitio no responde (DNS) |
| 🟡 | **El Informador Chile** | `elinformadorchile.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **El Lanquihue** | `ellanquihue.cl` | Los Lagos | database | Diario regional de Puerto Montt y la Región de Los Lagos |
| 🟡 | **El Líbero** | `ellibero.cl` | — | watchlist | RSS feeds deshabilitados por el sitio mediante plugin de redirección |
| 🟡 | **El Libertario** | `ellibertario.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Mercurio (Edición Impresa)** | `impresa.elmercurio.com` | — | watchlist | Sitio no responde (edición impresa digital) |
| ⬜ | **El Minuto** | `elminuto.cl` | — | database | Plataforma informativa digital orientada a la cobertura de acontecimientos nacionales e in |
| ✅ | **El Mostrador** | `elmostrador.cl` | — | database | sitemap en catálogo (elmostrador) |
| ⬜ | **El País - Chile** | `elpais.com` | — | database | Medio de comunicación español de noticias internacionales |
| 🟡 | **El Periscopio** | `elperiscopio.cl` | — | database | referenciado en sources.yaml |
| ✅ | **El Quinto Poder** | `elquintopoder.cl` | — | database | sitemap en catálogo (elquintopoder) |
| 🟡 | **El Radar** | `elradar.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **El Reporte Diario** | `reportediario.cl` | — | database | referenciado en sources.yaml |
| ✅ | **El Siglo** | `elsiglo.cl` | — | database | sitemap en catálogo (el_siglo) |
| ⬜ | **El Telescopio** | `eltelescopio.cl` | — | watchlist | Sitio no disponible (transport error) |
| 🟡 | **El Vigilante** | `elvigilante.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ✅ | **Emol** | `emol.com` | — | database | sitemap en catálogo (emol) |
| ⬜ | **En la Ciudad** | `enlaciudad.cl` | — | database | Blog de noticias locales en Blogger, con secciones de economía, tecnología, deportes y act |
| ⬜ | **Entérate Hoy** | `enteratehoy.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Esperanza FM** | `esperanzafm.cl` | Araucania | database | Emisora regional parte de la región del Bio Bio y Los Lagos 101.3 FM |
| ⬜ | **Está Pasando** | `estapasando.cl` | — | database | Medio digital de noticias de Chile y el mundo |
| ✅ | **Ex-Ante** | `ex-ante.cl` | Metropolitana | database | sitemap en catálogo (ex_ante) |
| ✅ | **Fact Checking UC** | `factchecking.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| 🟡 | **Factos** | `factos.cl` | — | database | referenciado en sources.yaml |
| ✅ | **FastCheckCL** | `fastcheck.cl` | — | database | sitemap en catálogo (fastcheck) |
| ⬜ | **Futura FM** | `futurafm.cl` | Maule | database | Emisora regional de Talca 100.7 FM |
| 🟡 | **G5 Noticias** | `g5noticias.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **G80** | `g80.cl` | — | watchlist | Sitio no responde (error de conexión) |
| 🟡 | **Gamba.cl** | `gamba.cl` | — | watchlist | Feed no verificable (protección Cloudflare) |
| ⬜ | **Google News** | `news.google.com` | — | database | Segregador de noticias de Google |
| ⬜ | **Hoy** | `hoy.cl` | — | watchlist | Agregador de noticias sin feed RSS propio |
| 🟡 | **Infogate** | `infogate.cl` | — | watchlist | Sitio sin feed RSS detectado |
| ⬜ | **Informe:Chile** | `informechile.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| 🟡 | **Interferencia** | `interferencia.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **La Coyuntura** | `lacoyuntura.cl` | — | watchlist | Feed RSS vacío |
| 🟡 | **La Cuarta** | `lacuarta.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **La Estrella de Antofagasta** | `estrellaantofagasta.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **La Estrella de Chiloé** | `laestrellachiloe.cl` | Los Lagos | database | Diario regional de Chiloé |
| ⬜ | **La Estrella de Concepción** | `estrellaconcepcion.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **La Estrella del Loa** | `estrellaloa.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| 🟡 | **La Izquierda Diario** | `laizquierdadiario.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **La Máquina Medio** | `lamaquinamedio.com` | — | database | Medio digital con análisis político, cultural y social |
| ✅ | **La Nación** | `lanacion.cl` | — | database | sitemap en catálogo (la_nacion) |
| 🟡 | **La Segunda** | `lasegunda.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **La Segunda (Edición Impresa)** | `impresa.lasegunda.com` | — | watchlist | Sitio no responde (edición impresa digital) |
| ✅ | **La Tercera** | `latercera.com` | — | database | sitemap en catálogo (latercera) |
| 🟡 | **La Voz de los que Sobran** | `lavozdelosquesobran.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Libertad Digital** | `libertaddigital.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **M360** | `m360.cl` | — | watchlist | Sitio construido con Prontus, sin feed RSS |
| ⬜ | **Magia Digital** | `magiadigital.cl` | — | watchlist | feed stale (último item: 2026-03-27, 84 días) |
| ✅ | **Mala Espina** | `malaespinacheck.cl` | — | database | sitemap en catálogo (malaespina) |
| ⬜ | **Mapuche Nation** | `mapuche-nation.org` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Mapuexpress** | `mapuexpress.org` | — | watchlist | Sitio no accesible (mapuexpress.org caído, mapuexpress.net ahora es sitio vietnamita) |
| 🟡 | **Mediabanco** | `mediabanco.com` | — | database | referenciado en sources.yaml |
| 🟡 | **Mega** | `mega.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| ✅ | **Meganoticias** | `meganoticias.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Megatiempo** | `megatiempo.cl` | — | watchlist | No se detectó feed RSS |
| ⬜ | **Mercurio de Antofagasta** | `mercurioantofagasta.cl` | Antofagasta | database | Diario regional de Antofagasta |
| ⬜ | **Mercurio de Calama** | `mercuriocalama.cl` | Antofagasta | database | Diario regional de Calama |
| 🟡 | **Mi Radio LS** | `miradiols.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Música y Noticias** | `musicaynoticias.cl` | — | database | Diario electrónico de las regiones del Maule y O’Higgins |
| 🟡 | **Nostálgica** | `nostalgica.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Noticias Importantes** | `noticiasimportantes.cl` | — | watchlist | Sitio sin feed RSS detectado |
| ⬜ | **Oro Coipo** | `orocoipo.cl` | Ohiggins | database | Emisora regional de Rancagua y la Región de O'Higgins 95.1 FM |
| 🟡 | **Página 19** | `pagina19.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Panorama Noticioso** | `panoramanoticioso.cl` | — | database | Portal de noticias chileno |
| ⬜ | **Partido de la Gente** | `partidodelagente.cl` | — | watchlist | Feed sin actividad desde Jun 2023 |
| ⬜ | **Partido Social Cristiano** | `pscchile.cl` | — | watchlist | Sitio no responde (DNS no resuelve, partido disuelto Feb 2026) |
| ⬜ | **Periodismo Sanador** | `periodismosanador.blogspot.com` | — | watchlist | sitio no responde |
| ⬜ | **Piensa Chile** | `piensachile.com` | — | database | Portal de análisis, opinión y noticias nacionales |
| ⬜ | **Portal Metropolitano** | `portalmetropolitano.cl` | — | database | Portal de noticias de la Región Metropolitana |
| 🟡 | **Prime Digital** | `primedigital.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **Publimetro Chile** | `publimetro.cl` | — | database | sitemap en catálogo (publimetro) |
| 🟡 | **Publimicro** | `publimicro.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Puerto Montt Online** | `puertomonttonline.cl` | Los Lagos | watchlist | Sin feed RSS detectado |
| 🟡 | **Pulso Público** | `pulsopublico.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **Puranoticia** | `puranoticia.pnt.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **Puranoticia** | `puranoticia.cl` | — | watchlist | Sin feed RSS detectado (responde HTML en lugar de feed) |
| ⬜ | **Qué Pasa** | `quepasa.cl` | — | watchlist | Sitio no responde |
| 🟡 | **Radar BioBio** | `radarbiobio.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Radar Informativo** | `radarinformativo.cl` | — | watchlist | No se detectó feed RSS (respuestas 410) |
| ✅ | **Radio Agricultura** | `radioagricultura.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Radio Araucanía** | `radioaraucania.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Radio Buena Nueva** | `radiobuenanueva.cl` | Maule | database | Emisora regional de Linares 97.9 FM Linares, 106.3 FM Chanco, 102.7 FM Longaví, 89.5 FM Co |
| ⬜ | **Radio Concierto** | `concierto.cl` | — | database | Emisora FM con programación musical y noticias |
| ✅ | **Radio Cooperativa** | `cooperativa.cl` | — | database | sitemap en catálogo (cooperativa) |
| ⬜ | **Radio El Puelche** | `elpuelche.cl` | Los Lagos | database | Radio mapuche de la Región de Los Lagos |
| ⬜ | **Radio Festival** | `radiofestival.cl` | — | database | Radio chilena de música y entretenimiento |
| ⬜ | **Radio Imagina** | `radioimagina.cl` | — | database | Radio chilena de música y noticias |
| ⬜ | **Radio Infinita** | `infinita.cl` | — | database | Emisora FM con programación informativa y musical |
| 🟡 | **Radio Nuevo Mundo** | `radionuevomundo.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Radio Ñuble** | `radionuble.cl` | Nuble | database | Emisora regional de la Región de Ñuble 89.7 FM, 900 AM |
| 🟡 | **Radio Paulina** | `radiopaulina.cl` | Tarapaca | database | referenciado en sources.yaml |
| 🟡 | **Radio Pauta** | `pauta.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| ⬜ | **Radio Pilmaiquén** | `radiopilmaiquen.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Radio Presidente Ibáñez** | `radiopresidenteibanez.cl` | Magallanes | database | Emisora regional de Magallanes 88.5 FM |
| ⬜ | **Radio Pudahuel** | `pudahuel.cl` | — | database | Radio chilena de música, entretención y noticias 90.5 FM |
| ⬜ | **Radio San Bartolomé** | `radiosanbartolome.cl` | Coquimbo | database | Emisora regional de coquimbo 96.7 FM |
| ✅ | **Radio UdeC** | `radioudec.cl` | Biobio | database | sitemap en catálogo (radioudec) |
| ⬜ | **Radio Valparaíso** | `radiovalparaiso.cl` | Valparaiso | watchlist | Sin actividad (todos los feeds inactivos) |
| 🟡 | **Red Digital** | `reddigital.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Renovación Nacional** | `rn.cl` | — | watchlist | Sin feed RSS detectado (sitio Wix sin soporte RSS) |
| 🟡 | **Reportea** | `reportea.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Revista Enfoque** | `revistaenfoque.cl` | — | watchlist | Sitio no responde, sin feed RSS detectado |
| 🟡 | **Revista Seguridad** | `revistaseguridad.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **RLN (Radio Las Nieves)** | `rln.cl` | Aysen | database | Radio regional ubicada en el 102.9 MHz del dial FM en Puerto Aysén |
| ⬜ | **Santiago Times** | `santiagotimes.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Somos9** | `somos9.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **SoyChile** | `soychile.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **T13** | `t13.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Tercera Dosis** | `terceradosis.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **Terra Chile** | `terra.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ✅ | **The Clinic** | `theclinic.cl` | — | database | sitemap en catálogo (theclinic) |
| ⬜ | **The Times en Español** | `thetime.cl` | — | database | Noticias, deportes, política, negocios y actualidad de Chile |
| 🟡 | **The Times Latino** | `thetimeslatino.com` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Tropezón Tu Diario** | `nuevotropezon.tropezon.cl` | — | database | Diario con noticias de actualidad, policial y emergencias |
| ⬜ | **TVN** | `tvn.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| ⬜ | **Ufro Medios** | `ufromedios.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Vivimos la Noticia** | `vivimoslanoticia.cl` | Maule | database | Medio de noticias regional de Curicó 105.7 FM |
| ⬜ | **Voz de América** | `vozdeamerica.com` | — | database | La Voz de América es el medio de radiodifusión internacional del gobierno de los Estados U |
| ⬜ | **Werken** | `werken.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
### Noticias internacionales (news-international)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **ANSA Latina** | `ansalatina.com` | — | watchlist | No se detectó feed RSS en el sitio (agencia de noticias italiana, no chilena) |
| ⬜ | **BBC Mundo** | `bbc.com` | — | database | Cobertura de noticias globales y análisis desde una perspectiva internacional |
| ⬜ | **Cadena Política** | `cadenapolitica.com` | — | database | Portal mexicano de noticias políticas, salud y actualidad |
| ⬜ | **El Nacional** | `elnacional.com` | — | database | Diario venezolano de noticias nacionales e internacionales |
| 🟡 | **France 24** | `france24.com` | — | database | referenciado en sources.yaml |
| ⬜ | **Ground News - Chile** | `ground.news` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **HolaNews** | `holanews.com` | — | database | Agregador de noticias latinoamericano basado en Estados Unidos |
| ⬜ | **IPS Agencia de Noticias** | `ipsnoticias.net` | — | database | Inter Press Service, agencia internacional de noticias con edición en español |
| ⬜ | **Le Monde Diplomatique - Edición Chilena** | `lemondediplomatique.cl` | — | database | Edición chilena del periódico Le Monde Diplomatique |
| ⬜ | **MercoPress** | `es.mercopress.com` | — | database | Agencia de noticias en español sobre América Latina y el Caribe, con sección especial de C |
| 🟡 | **Perfil** | `perfil.com` | — | watchlist | Feed válido 'Internacionales' está roto (HTTP 404), otros feeds activos, |
| 🟡 | **Prensa Opal** | `prensaopal.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **RFI Español** | `rfi.fr` | — | database | Radio Francia Internacional en español — noticias internacionales, América Latina y el mun |
| 🟡 | **The Guardian** | `theguardian.com` | — | database | referenciado en sources.yaml |
### Partidos políticos (political-parties)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **Demócratas Chile** | `democratas.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades de Demócratas Chile |
| ⬜ | **Evópoli** | `evopoli.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Federación Regionalista Verde Social** | `frevs.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades de la Federación Regionalis |
| ⬜ | **Frente Amplio** | `frenteampliochile.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades del Frente Amplio |
| ⬜ | **Partido Comunista de Chile** | `pcchile.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades del Partido Comunista |
| ⬜ | **Partido Demócrata Cristiano** | `pdc.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades de la DC |
| ⬜ | **Partido Humanista de Chile** | `partidohumanista.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Partido Igualdad** | `partidoigualdad.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Partido Liberal de Chile** | `liberaleschile.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades del Partido Liberal |
| ⬜ | **Partido por la Democracia** | `ppd.cl` | — | database | Partido político chileno - Noticias, comunicados y actividades del PPD |
| 🟡 | **Partido Republicano de Chile** | `partidorepublicanodechile.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **Partido Socialista de Chile** | `pschile.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Unión Demócrata Independiente** | `udi.cl` | — | watchlist | Sin actividad (todos los feeds inactivos) |
### Radio (radio)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ⬜ | **Duna** | `duna.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **FM Joven** | `fmjoven.com` | — | watchlist | Sitio no accesible |
| ⬜ | **FM Plus** | `fmplus.cl` | — | watchlist | No se detectó feed RSS en el sitio (Next.js, sin soporte RSS) |
| ⬜ | **FM Stylo** | `fmstylo.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **La Radioneta** | `laradioneta.cl` | — | watchlist | Sitio caído (HTTP 410 Gone), sin feed RSS detectado |
| ⬜ | **Los 40** | `los40.cl` | — | database | Radio chilena Los 40, música popular y actualidad |
| ⬜ | **Mirador FM** | `miradorfm.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Ojo Subterráneo** | `ojosubterraneo.caster.fm` | — | watchlist | Sitio no disponible en caster.fm, sin feed RSS detectado |
| 🟡 | **Orolonco FM** | `oroloncofm.cl` | Valparaiso | database | referenciado en sources.yaml |
| ⬜ | **Radio 1° de Mayo** | `radio1demayo.cl` | — | watchlist | Sitio no alcanzable, sin feed RSS detectado |
| 🟡 | **Radio 45 Sur** | `radio45sur.cl` | Los Rios | database | referenciado en sources.yaml |
| ⬜ | **Radio 80** | `radio80.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio 920** | `radionueveveinte.com` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Radio Activa** | `radioactiva.cl` | — | database | Radioemisora chilena de música contemporánea |
| ⬜ | **Radio Alborada** | `radioalborada.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Alternativa** | `radioalternativa.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Radio Angelina** | `radioangelina.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| ⬜ | **Radio Armonía** | `radioarmonia.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Radio Atacama** | `radioatacama.cl` | Atacama | database | referenciado en sources.yaml |
| ⬜ | **Radio Azúcar** | `radioazucar.cl` | — | watchlist | Sitio no responde |
| ⬜ | **Radio Beat** | `radiobeat.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Carillón** | `radiocarillon.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Radio Carolina** | `carolina.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| ⬜ | **Radio Chilena** | `radiochilena.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Colo-Colo** | `radiocolocolo.cl` | — | watchlist | Sitio no responde |
| 🟡 | **Radio Contacto** | `radiocontacto.cl` | Nuble | database | referenciado en sources.yaml |
| ⬜ | **Radio Cristalina** | `radiocristalina.cl` | — | database | Radio Cristalina, emisora chilena de la Región de Coquimbo |
| ⬜ | **Radio del Mar** | `radiodelmar.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Disney Chile** | `radiodisney.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio El Conquistador** | `elconquistador.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio FM Centro** | `fmcentro.cl` | Araucania | database | Radio FM Centro de Gorbea, Región de La Araucanía |
| 🟡 | **Radio Futuro** | `futuro.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Radio Galactika** | `galactika.wordpress.com` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Radio Horizonte** | `horizonte.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio ICEI** | `icei.uchile.cl` | — | watchlist | Sitio no alcanzable, sin feed RSS detectado |
| 🟡 | **Radio Interamericana** | `radiointeramericana.cl` | Biobio | database | referenciado en sources.yaml |
| ⬜ | **Radio JGM** | `radiojgm.uchile.cl` | — | database | Radio Juan Gómez Millas, de la Universidad de Chile |
| ⬜ | **Radio JGM** | `radiojgm.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Radio Konciencia** | `radiokonciencia.org` | — | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Radio La Clave** | `laclave.cl` | — | watchlist | Sitio no responde |
| 🟡 | **Radio La Señal** | `radiolasenal.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Radio María Chile** | `radiomaria.cl` | — | database | Emisora católica de alcance nacional en Chile |
| ⬜ | **Radio Máxima** | `radiomaxima.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Melodía** | `radiomelodia.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Radio Modelo** | `radiomodelo.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Radio Placeres** | `radioplaceres.cl` | — | watchlist | Sitio sin feed RSS detectado |
| ⬜ | **Radio Play** | `radioplay.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Portales** | `radioportales.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Radio Riquelme** | `radioriquelme.cl` | — | database | Radioemisora chilena con programación informativa y musical |
| ⬜ | **Radio Romántica** | `romantica.cl` | — | watchlist | No se detectó feed RSS en el sitio |
| 🟡 | **Radio Sago** | `radiosago.cl` | — | watchlist | Sitio no accesible (sin respuesta al validar) |
| ⬜ | **Radio Santiago** | `radiosantiago.cl` | Metropolitana | watchlist | Sitio no responde (timeout) |
| ⬜ | **Radio Sinfonía** | `radiosinfonia.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Tiempo** | `radiotiempo.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Universal** | `radiouniversal.cl` | — | watchlist | Sitio no accesible |
| ✅ | **Radio Universidad de Chile** | `radio.uchile.cl` | Metropolitana | database | sitemap en catálogo (radio_uchile) |
| ⬜ | **Radio Universo** | `radiouniverso.cl` | — | watchlist | Sitio no responde |
| ⬜ | **Radio Uno** | `radiouno.cl` | — | watchlist | Sitio no responde |
| ⬜ | **Radio Usach** | `radio.usach.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Radio Villa Francia** | `radiovillafrancia.cl` | — | watchlist | Sitio no accesible |
| ⬜ | **Radio Zero** | `radiozero.cl` | — | watchlist | Feed RSS existe pero vacío (0 ítems en feed) |
| ⬜ | **Radios Regionales** | `radiosregionales.cl` | — | watchlist | SSL handshake failed (sitio no accesible) |
| ⬜ | **Rock & Pop** | `rockandpop.cl` | — | database | Radio chilena de rock, música y actualidad |
| ⬜ | **Soberanía Radio** | `soberaniaradio.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **UC Radio Beethoven** | `beethovenfm.cl` | — | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| 🟡 | **Vilas Radio** | `vilasradio.cl` | Tarapaca | database | referenciado en sources.yaml |
### Regional (regional)

| Estado | Sitio | Web | Región | Fuente | Notas |
|---|---|---|---|---|---|
| ✅ | **Aconcagua Digital** | `aconcaguadigital.cl` | Valparaiso | database | Diario regional de San Felipe, Valparaíso |
| ✅ | **Alerta Noticias** | `alertanoticias.cl` | Valparaiso | database | Medio de comunicación de la Región de Valparaíso |
| 🟡 | **Alerta Noticias Temuco** | `alertanoticiastemuco.cl` | Araucania | database | referenciado en sources.yaml |
| ⬜ | **Angelino** | `angelino.cl` | Biobio | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Angol Noticias** | `angolnoticiasnew.cl` | Araucania | database | Diario regional de Angol, La Araucanía |
| ⬜ | **Angolinos** | `angolinos.cl` | Araucania | watchlist | Sitio no accesible |
| ✅ | **Antofacity** | `antofacity.com` | Antofagasta | database | Medio de comunicación de la Región de Antofagasta |
| ✅ | **Antofagasta al Día** | `antofagastaaldia.cl` | Antofagasta | database | Portal de noticias de la Región de Antofagasta |
| ✅ | **Antofagasta Noticias** | `antofagastanoticias.cl` | Antofagasta | database | Diario regional de Antofagasta, Antofagasta |
| ⬜ | **Antofagasta TV** | `antofagasta.tv` | Antofagasta | database | Canal de televisión digital y portal de noticias de la Región de Antofagasta |
| ⬜ | **Araucanía Cuenta** | `araucaniacuenta.cl` | Araucania | watchlist | Sin feed RSS detectado |
| 🟡 | **Araucanía Diario** | `araucaniadiario.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Araucanía Noticias** | `araucanianoticias.cl` | Araucania | database | referenciado en sources.yaml |
| 🔒 | **Arica Al Día** | `aricaldia.cl` | Arica Y Parinacota | database | Diario regional de Arica y Parinacota |
| ⬜ | **Arica Chile** | `aricachile.cl` | Arica Y Parinacota | database | Medio de comunicación de la Región de Arica y Parinacota |
| ✅ | **Arica es Noticia** | `aricaesnoticia.cl` | Arica Y Parinacota | database | Medio de comunicación de la Región de Arica y Parinacota |
| 🔒 | **Arica Hoy** | `aricahoy.cl` | Arica Y Parinacota | database | Diario regional de Arica y Parinacota |
| ⬜ | **Arica Mía** | `aricamia.cl` | Arica Y Parinacota | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **Arica Online** | `aricaonline.cl` | — | watchlist | Sitio no disponible, solo feeds proxy activos |
| ⬜ | **Arica365** | `arica365.cl` | Arica Y Parinacota | database | Diario regional de Arica y Parinacota |
| ✅ | **Atacama en Línea** | `atacamaenlinea.cl` | Atacama | database | Diario regional de Copiapó, Atacama |
| 🟡 | **Atacama Noticias** | `atacamanoticias.cl` | Atacama | database | referenciado en sources.yaml |
| 🟡 | **Atentos** | `atentos.cl` | Maule | database | referenciado en sources.yaml |
| ⬜ | **Aysén Ahora** | `aysenahora.cl` | Aysen | database | Diario regional de Puerto Aysén, Aysén |
| ⬜ | **Calama en Línea** | `noticias.calamaenlinea.cl` | Antofagasta | database | Medio de comunicación de la Región de Antofagasta |
| ✅ | **Canal 9 Biobío** | `canal9.cl` | — | watchlist | Feed nativo no encontrado, solo feeds proxy activos |
| ⬜ | **CauquenesNet** | `cauquenesnet.cl` | Maule | database | Diario regional de Cauquenes, Maule |
| 🔒 | **CEI Noticias** | `ceinoticias.cl` | Tarapaca | database | Diario regional de Iquique, Tarapacá |
| 🟡 | **Central Noticia** | `centralnoticia.cl` | Los Lagos | database | referenciado en sources.yaml |
| ⬜ | **Central Noticias** | `centralnoticias.cl` | Los Rios | database | Diario regional de Panguipulli, Los Ríos |
| ⬜ | **Chasquis** | `chasquis.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Chicureo Hoy** | `chicureohoy.cl` | Metropolitana | database | referenciado en sources.yaml |
| ⬜ | **Chile Mosaico** | `chilemosaico.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **Chillán Online** | `chillanonline.cl` | Nuble | database | Diario regional de Chillán, Ñuble |
| 🟡 | **ChiloeNews** | `chiloenews.cl` | Los Lagos | database | referenciado en sources.yaml |
| ⬜ | **Chinchorro** | `periodicochinchorro.cl` | Arica Y Parinacota | watchlist | Sitio no accesible |
| ✅ | **Clave 9** | `clave9.cl` | Araucania | database | Diario regional de Temuco, La Araucanía |
| 🟡 | **CLG Medios** | `clgmedios.cl` | Los Lagos | database | referenciado en sources.yaml |
| ✅ | **Coquimbo Noticias** | `coquimbonoticias.cl` | Coquimbo | database | Medio digital de noticias de la Región de Coquimbo |
| ⬜ | **Crónica Chillán** | `cronicachillan.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| 🟡 | **Crónica Digital** | `cronicadigital.cl` | Metropolitana | database | referenciado en sources.yaml |
| ⬜ | **Crónica Noticias** | `cronicanoticias.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Datos Sur** | `datossur.cl` | Los Lagos | database | Diario regional de Llanquihue, Puerto Montt |
| 🔒 | **David Noticias** | `davidnoticias.cl` | Coquimbo | database | Diario regional de Los Vilos, Coquimbo |
| ⬜ | **De Mar a Cordillera TV** | `demaracordilleratv.cl` | Ohiggins | database | Medio digital chileno de la Región de O'Higgins con noticias, turismo, cultura y reportaje |
| ⬜ | **Desierto FM** | `desiertofm.cl` | Antofagasta | database | Radio chilena de Calama y Antofagasta con 44 años de trayectoria, noticias regionales |
| ⬜ | **Diálogo Sur** | `dialogosur.cl` | Magallanes | database | Diario regional de Punta Arenas, Magallanes |
| ✅ | **Diario Angamos** | `diarioangamos.com` | Antofagasta | database | Diario digital de la Región de Antofagasta, Chile |
| ⬜ | **Diario Antofagasta** | `diarioantofagasta.cl` | Antofagasta | database | Diario regional de Antofagasta, Antofagasta |
| 🔒 | **Diario Austral Osorno** | `australosorno.cl` | Los Lagos | database | Diario regional de Osorno |
| 🔒 | **Diario Austral Temuco** | `australtemuco.cl` | Araucania | database | Diario regional de La Araucanía |
| 🟡 | **Diario Avísale** | `diarioavisale.cl` | Tarapaca | database | referenciado en sources.yaml |
| ⬜ | **Diario Aysén** | `diarioaysen.cl` | Aysen | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Diario Aysén Opina** | `diarioaysenopina.cl` | Aysen | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ✅ | **Diario Cauquenes** | `diariocauquenes.cl` | Maule | database | Diario regional de Cauquenes, Maule |
| 🟡 | **Diario Chañarcillo** | `chanarcillo.cl` | Atacama | database | referenciado en sources.yaml |
| ⬜ | **Diario Chiloé** | `diariochiloe.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Diario Concepción** | `diarioconcepcion.cl` | Biobio | database | referenciado en sources.yaml |
| ✅ | **Diario Curicó** | `diariocurico.cl` | Maule | database | Diario regional de Curicó, Maule |
| 🟡 | **Diario de Osorno** | `diariodeosorno.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario de Puerto Montt** | `diariodepuertomontt.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Diario de Valdivia** | `diariodevaldivia.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **Diario El Cautín** | `diarioelcautin.cl` | Araucania | database | Medio de comunicación de la Región de Araucanía |
| 🟡 | **Diario El Centro** | `diarioelcentro.cl` | Maule | database | referenciado en sources.yaml |
| ⬜ | **Diario El Cóndor** | `diariocondor.cl` | Ohiggins | database | Diario regional de Santa Cruz, O'Higgins |
| 🟡 | **Diario El Día** | `diarioeldia.cl` | Coquimbo | database | referenciado en sources.yaml |
| 🟡 | **Diario El Heraldo** | `diarioelheraldo.cl` | Maule | database | referenciado en sources.yaml |
| ⬜ | **Diario El Huemul** | `elhuemul.cl` | Los Lagos | database | Diario regional de Chaitén, Los Lagos |
| ✅ | **Diario El Longino** | `diariolongino.cl` | Tarapaca | database | Diario regional de Iquique, Tarapacá |
| ⬜ | **Diario El Marino** | `diarioelmarino.cl` | Ohiggins | database | Diario regional de Pichilemu, O'Higgins |
| ⬜ | **Diario El Nortino** | `diarioelnortino.cl` | Tarapaca | database | Diario regional de Alto Hospicio, Tarapacá |
| ⬜ | **Diario El Porteño** | `elporteno.cl` | Valparaiso | database | Medio de comunicación de la Región de Valparaíso |
| ✅ | **Diario El Pulso** | `diarioelpulso.cl` | Ohiggins | database | Diario regional de Rancagua, O'Higgins |
| 🟡 | **Diario El Ranco** | `diarioelranco.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **Diario Futrono** | `diariofutrono.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Diario La Prensa** | `new.diariolaprensa.cl` | — | watchlist | Feed nativo no encontrado, solo feeds proxy activos |
| 🟡 | **Diario La Prensa** | `diariolaprensa.cl` | Biobio | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario La Quinta** | `diariolaquinta.cl` | Valparaiso | database | Diario regional de Valparaíso, Valparaíso |
| ⬜ | **Diario La Región** | `diariolaregion.cl` | Coquimbo | database | Diario regional de Coquimbo, Coquimbo |
| ⬜ | **Diario Labrador** | `diariolabrador.cl` | Los Rios | watchlist | Sitio inalcanzable (error de transporte/dns) |
| ⬜ | **Diario Lago Ranco** | `diariolagoranco.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario Laguino** | `diariolaguino.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario Lanco** | `diariolanco.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario Linares** | `diariolinares.cl` | Maule | database | Diario regional de Linares, Maule |
| ✅ | **Diario Los Lagos** | `diarioloslagos.cl` | Los Lagos | database | Diario regional de Puerto Montt, Los Lagos |
| ⬜ | **Diario Máfil** | `diariomafil.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario Paillaco** | `diariopaillaco.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **Diario Puerto Varas** | `diariopuertovaras.cl` | Los Lagos | database | Diario regional de Puerto Varas, Los Lagos |
| ⬜ | **Diario Regional Aysén** | `diarioregionalaysen.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario Río Bueno** | `diarioriobueno.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario San José** | `diariosanjose.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Diario Sol** | `diariosol.cl` | Antofagasta | database | Medio de comunicación de la Región de Antofagasta |
| 🟡 | **Diario Sur Noticias** | `diariosurnoticias.com` | Metropolitana | database | referenciado en sources.yaml |
| ✅ | **Diario Talca** | `diariotalca.cl` | Maule | database | Diario regional de Talca, Maule |
| ⬜ | **Diario VI Región** | `diarioviregion.cl` | Ohiggins | database | Diario regional de Libertador General Bernardo O'Higgins |
| 🔒 | **Dirario Austral** | `australvaldivia.cl` | Los Rios | database | Diario regional de Los Ríos |
| ⬜ | **Duplos** | `duplos.cl` | Metropolitana | database | Diario regional de Santiago, Metropolitana |
| 🟡 | **Edición Cero** | `edicioncero.cl` | Tarapaca | database | referenciado en sources.yaml |
| 🔒 | **El Aconcagua** | `elaconcagua.cl` | Valparaiso | database | Diario regional de San Felipe, Valparaíso |
| ⬜ | **El Amaule** | `elamaule.cl` | — | watchlist | Feed nativo no encontrado, solo feeds proxy activos |
| ⬜ | **El América** | `elamerica.cl` | Antofagasta | database | Diario regional de Calama, Antofagasta |
| ✅ | **El Andacollino** | `elandacollino.cl` | Coquimbo | database | Medio de comunicación de la Región de Coquimbo |
| ⬜ | **El Andino** | `elandino.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Boyaldía** | `elboyaldia.cl` | Tarapaca | watchlist | Sin feed RSS detectado - empresa matriz: Mi Voz |
| ⬜ | **El Cachapoal** | `elcachapoal.cl` | — | database | Diario regional de la Región de O'Higgins |
| ⬜ | **El Calbucano** | `elcalbucano.cl` | Los Lagos | database | Diario regional de Calbuco, Los Lagos |
| ⬜ | **El Capo de Provincia** | `capodeprovincia.cl` | Valparaiso | database | Medio digital de la Provincia de San Antonio, Región de Valparaíso |
| ⬜ | **El Chelenko** | `elchelenko.cl` | Aysen | watchlist | Sin feed RSS detectado |
| ✅ | **El Comunicador** | `elcomunicador.cl` | Metropolitana | database | Diario regional de Melipilla, Metropolitana |
| ⬜ | **El Concecuente** | `elconcecuente.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Concordia** | `elconcordia.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Cóndor** | `diarioelcondor.cl` | Ohiggins | watchlist | Feed RSS vacío |
| ✅ | **El Contraste** | `elcontraste.cl` | — | database | Diario regional de Los Ángeles, Biobío |
| ✅ | **El Coquimbano** | `elcoquimbano.cl` | Coquimbo | database | Diario regional de Coquimbo, Coquimbo |
| ⬜ | **El Correo del Lago** | `correodellago.cl` | Los Lagos | watchlist | Sin actividad (todos los feeds inactivos) |
| 🔒 | **El Diario de Atacama** | `diarioatacama.cl` | Atacama | database | Medio de comunicación de la Región de Atacama |
| 🟡 | **El Diario de La Araucanía** | `eldiariodelaaraucania.cl` | Araucania | database | referenciado en sources.yaml |
| ⬜ | **El Diario de Maule** | `eldiariodemaule.com` | Maule | watchlist | Feed RSS vacío |
| ⬜ | **El Diario Panguipulli** | `eldiariopanguipulli.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Divisadero** | `eldivisadero.cl` | — | watchlist | XML malformado, no parseable |
| ✅ | **El Gong** | `elgong.cl` | Araucania | database | Diario regional de La Araucanía |
| ⬜ | **El Heraldo Austral** | `eha.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Heraldo Austral** | `elheraldoaustral.cl` | Aysen | watchlist | Sin feed RSS detectado |
| ⬜ | **El Informador** | `elinformador.cl` | Valparaiso | database | Diario regional de Los Andes, Valparaíso |
| 🟡 | **El Insular** | `elinsular.cl` | Los Lagos | database | referenciado en sources.yaml |
| ⬜ | **El Lector** | `lectoronline.cl` | — | watchlist | Sin feed RSS detectado |
| 🔒 | **El Líder San Antonio** | `lidersanantonio.cl` | Valparaiso | database | Diario regional de San Antonio, Valparaíso |
| ⬜ | **El Llanquihue** | `elllanquihue.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Magallanews** | `elmagallanews.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **El Magallánico** | `elmagallanico.com` | Magallanes | database | Diario regional de Punta Arenas, Magallanes |
| 🟡 | **El Maipo** | `elmaipo.cl` | Metropolitana | database | referenciado en sources.yaml |
| ⬜ | **El Matutino** | `elmartutino.cl` | — | watchlist | Sin feed RSS detectado - empresa matriz: Mi Voz |
| ✅ | **El Maule Informa** | `elmauleinforma.cl` | Maule | database | Diario regional de Talca, Maule |
| 🔒 | **El Mercurio Valparaíso** | `mercuriovalpo.cl` | — | database | Diario regional de Valparaíso |
| ⬜ | **El Monitor** | `elmonitorparral.com` | Maule | watchlist | Sin feed RSS detectado |
| ✅ | **El Morro de Arica** | `elmorrodearica.cl` | Arica Y Parinacota | database | Diario regional de Arica y Parinacota |
| 🟡 | **El Morrocotudo** | `elmorrocotudo.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Naveghable** | `elnaveghable.cl` | — | watchlist | XML malformado, no parseable |
| ⬜ | **El Nortero** | `elnortero.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **El Noticiero del Huasco** | `elnoticierodelhuasco.cl` | Atacama | database | Diario regional de Vallenar, Atacama |
| ✅ | **El Observador** | `observador.cl` | Valparaiso | database | Diario regional de Quillota, Valparaíso |
| 🟡 | **El Observatodo** | `elobservatodo.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Ovallino** | `elovallino.cl` | Coquimbo | database | Diario regional de Ovalle, Coquimbo |
| ⬜ | **El Paila** | `lapaila.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Paradiario 14** | `elparadiario14.cl` | Los Rios | watchlist | Sitio no accesible |
| ⬜ | **El Patagónico** | `elpatagonico.com` | — | watchlist | Feed nativo no encontrado, solo feeds proxy activos |
| 🟡 | **El Periódico** | `elperiodico.cl` | Araucania | database | referenciado en sources.yaml |
| ✅ | **El Periodista** | `elperiodista.cl` | Metropolitana | database | sitemap en catálogo (el_periodista) |
| 🟡 | **El Pingüino** | `elpinguino.com` | Magallanes | database | referenciado en sources.yaml |
| 🟡 | **El Proa** | `elproa.cl` | Valparaiso | database | referenciado en sources.yaml |
| ⬜ | **El Provincial** | `elprovincial.cl` | Los Rios | database | Medio de comunicación de la Región de Los Ríos |
| ⬜ | **El Quehaydecierto** | `elquehaydecierto.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **El Rancagüino** | `elrancaguino.cl` | Ohiggins | database | Diario regional de O'Higgins |
| ⬜ | **El Rancahuaso** | `elrancahuaso.cl` | Ohiggins | watchlist | Sin feed RSS detectado |
| ⬜ | **El Regional** | `elregional.cl` | Coquimbo | database | Diario regional de Coquimbo, Coquimbo |
| ⬜ | **El Reportero de Iquique** | `elreporterodeiquique.com` | Tarapaca | database | Diario regional de Iquique, Tarapacá |
| ⬜ | **El Repuertero** | `elrepuertero.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Sancarlino** | `elsancarlino.cl` | Nuble | database | Diario regional de San Carlos, Ñuble |
| ⬜ | **El Serenense** | `elserenense.cl` | Coquimbo | database | Diario regional de La Serena, Coquimbo |
| ⬜ | **El Sol de Iquique** | `elsoldeiquique.cl` | Tarapaca | database | Diario regional de Iquique, Tarapacá |
| ⬜ | **El Sur** | `elsur.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **El Tipógrafo** | `eltipografo.cl` | — | watchlist | Feed nativo no encontrado, solo feeds proxy activos |
| ⬜ | **El Tirapiedras** | `eltirapiedras.cl` | Magallanes | database | Diario regional de Puerto Natales, Magallanes |
| ⬜ | **El Trabajo** | `eltrabajo.cl` | Valparaiso | database | Diario regional de San Felipe, Valparaíso |
| ⬜ | **El Urbano Rural** | `elurbanorural.cl` | Ohiggins | database | Medio de comunicación de la Región de O'Higgins |
| ⬜ | **El Vacanudo** | `elvacanudo.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **El Vicuñense** | `xn--elvicuense-y9a.cl` | Coquimbo | database | Diario regional de Vicuña, Coquimbo |
| 🟡 | **El Zorro Nortino** | `elzorronortino.cl` | Atacama | database | referenciado en sources.yaml |
| ⬜ | **Elqui Global** | `elquiglobal.cl` | Coquimbo | database | Medio de comunicación de la Región de Coquimbo |
| ⬜ | **En La Línea** | `enlalinea.cl` | Antofagasta | database | Diario regional de Calama, Antofagasta |
| ⬜ | **En Línea Maule** | `enlineamaule.cl` | Maule | database | Diario regional de Talca, Maule |
| ⬜ | **Enfoque Digital** | `enfoquedigital.cl` | Atacama | database | Medio de comunicación de la Región de Atacama |
| ⬜ | **Enfoque Digital O'Higgins** | `vi.cl` | Ohiggins | database | Medio de comunicación de la Región de O'Higgins |
| ⬜ | **EPD Noticias** | `elpatagondomingo.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Epicentro Chile** | `epicentrochile.com` | — | database | referenciado en sources.yaml |
| ⬜ | **Frontera Norte** | `fronteranorte.cl` | Arica Y Parinacota | database | Diario regional de Arica y Parinacota |
| ⬜ | **FrutillarHoy** | `frutillarhoy.cl` | Los Lagos | database | Noticias de Frutillar y la Región de Los Lagos |
| ⬜ | **Grafelberg Noticias** | `grafelbergnoticias.blogspot.com` | Los Lagos | watchlist | Sin feed RSS detectado |
| ⬜ | **Gran Valparaíso** | `granvalparaiso.cl` | Valparaiso | watchlist | Sin feed RSS detectado (HTTP error en todas las rutas) |
| ⬜ | **Guardián del Sur** | `guardiandelsur.cl` | Los Lagos | database | Diario regional de Puerto Montt, Los Lagos |
| ⬜ | **HDN** | `hdn.cl` | Ohiggins | database | Diario regional de Santa Cruz, O'Higgins |
| ⬜ | **Hora de Noticias** | `horadenoticias.cl` | Ohiggins | database | Diario regional de Rancagua, O'Higgins |
| ⬜ | **Hoyxhoy** | `hoyxhoy.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| 🟡 | **Info Tarapacá** | `infotarapaca.cl` | Tarapaca | database | referenciado en sources.yaml |
| ⬜ | **Informa Al Minuto** | `informaalminuto.cl` | Los Rios | database | Diario regional de Valdivia, Los Ríos |
| ⬜ | **Insular FM** | `insularfm.cl` | Los Lagos | database | Radio Insular FM desde Castro, Chiloé, Región de Los Lagos |
| ⬜ | **Iquique Online** | `iquiqueonline.cl` | Tarapaca | watchlist | Sin feed RSS detectado |
| ⬜ | **Iquique TV** | `iquiquetv.cl` | Tarapaca | database | Medio de comunicación de la Región de Tarapacá |
| 🟡 | **ITV Patagonia** | `itvpatagonia.com` | Magallanes | database | referenciado en sources.yaml |
| ⬜ | **La Batalla de Maipú** | `labatalla.cl` | Metropolitana | database | Diario digital de Maipú con información local, comunitaria y nacional |
| 🟡 | **La Discusión** | `ladiscusion.cl` | Nuble | database | referenciado en sources.yaml |
| ⬜ | **La Estrella de Arica** | `estrellaarica.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| ⬜ | **La Estrella de Iquique** | `estrellaiquique.cl` | Tarapaca | database | Diario regional de Iquique |
| ⬜ | **La Estrella de Tocopilla** | `estrellatocopilla.cl` | Antofagasta | watchlist | Sin feed RSS detectado |
| ⬜ | **La Estrella de Valparaíso** | `estrellavalpo.cl` | Valparaiso | watchlist | Sin feed RSS detectado |
| ✅ | **La Fontana** | `lafontana.cl` | Nuble | database | sitemap en catálogo (lafontana) |
| 🟡 | **La Hora** | `lahora.cl` | — | database | referenciado en sources.yaml |
| ⬜ | **La Kalle** | `lakalle.cl` | — | watchlist | Feed RSS vacío |
| ⬜ | **La Mega FM** | `lamegafm.cl` | Tarapaca | database | Medio de comunicación de la Región de Tarapacá |
| ⬜ | **La Noticia** | `lanoticia.cl` | Ohiggins | database | Diario regional de Rancagua, O'Higgins |
| ⬜ | **La Noticia Online** | `lanoticiaonline.cl` | — | watchlist | Sitio no accesible |
| 🟡 | **La Opinión de Chiloé** | `laopiniondechiloe.cl` | Los Lagos | database | referenciado en sources.yaml |
| ⬜ | **La Opiñón** | `laopinon.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **La Perla del Limarí** | `laperladellimari.cl` | Coquimbo | database | Diario regional de Ovalle, Coquimbo |
| 🟡 | **La Prensa Austral** | `laprensaaustral.cl` | Magallanes | database | referenciado en sources.yaml |
| ⬜ | **La Razón** | `larazon.cl` | Metropolitana | database | Diario regional de Santiago, Metropolitana |
| 🟡 | **La Región Hoy** | `laregionhoy.cl` | — | database | referenciado en sources.yaml |
| 🟡 | **La Segunda** | `lasegunda.com` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **La Serena Online** | `laserenaonline.cl` | Coquimbo | database | Diario regional de La Serena, Coquimbo |
| 🟡 | **La Tribuna** | `latribuna.cl` | Biobio | database | referenciado en sources.yaml |
| ⬜ | **La Tribuna de Colchagua** | `latribunadecolchagua.cl` | Ohiggins | database | Diario regional de San Fernando, O'Higgins |
| ⬜ | **La Unión** | `diariolaunion.cl` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **La Voz de Maipú** | `lavozdemaipu.cl` | Metropolitana | database | referenciado en sources.yaml |
| ⬜ | **La Voz de Paillaco** | `lavozdepaillaco.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **La Voz de Valdivia** | `lavozdevaldivia.cl` | Los Rios | watchlist | Sin feed RSS detectado |
| ⬜ | **Las Noticias de Malleco** | `lasnoticiasdemalleco.cl` | Araucania | database | Diario regional de Angol, La Araucanía |
| ⬜ | **Las Últimas Noticias** | `lun.com` | — | watchlist | Sin feed RSS detectado |
| 🟡 | **Linares en Línea** | `linaresenlinea.cl` | Maule | database | referenciado en sources.yaml |
| ⬜ | **Linares Noticia** | `linaresnoticia.cl` | Maule | database | Diario regional de Linares, Maule |
| ⬜ | **Los Andes On Line** | `losandesonline.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Los Lagos al Día** | `loslagosaldia.cl` | Los Lagos | watchlist | Sitio sin feed RSS detectado |
| ⬜ | **Los Ríos Al Día** | `losriosaldia.cl` | Los Rios | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Los Ríos Noticias** | `losriosnoticias.cl` | Los Rios | database | Diario regional de Valdivia, Los Ríos |
| 🟡 | **Magallanes Check** | `magallanescheck.cl` | Magallanes | watchlist | Sin feed RSS detectado |
| ⬜ | **Malleco 7** | `malleco7.cl` | Araucania | database | Diario regional de Angol, La Araucanía |
| ⬜ | **Margamarga TV** | `margamargatv.cl` | Valparaiso | database | Canal de televisión regional de la Provincia de Marga Marga, Región de Valparaíso |
| ⬜ | **Más Noticia** | `masnoticia.cl` | Valparaiso | database | Diario regional de Quillota, Valparaíso |
| ⬜ | **Maule al Día** | `maulealdia.cl` | Maule | watchlist | Sin feed RSS detectado |
| ⬜ | **Maule EE** | `maulee.cl` | Maule | watchlist | Sitio no responde, sin feed RSS detectado |
| ⬜ | **Maule Hoy** | `maulehoy.cl` | Maule | database | Diario regional de Talca, Maule |
| ⬜ | **Mi San Felipe** | `misanfelipe.cl` | — | watchlist | Feed nativo stale (sin contenido reciente), solo feeds proxy activos |
| 🟡 | **Mirada Sur TV** | `miradasurtv.cl` | Los Lagos | database | referenciado en sources.yaml |
| ⬜ | **Montealegre** | `montealegre.cl` | Valparaiso | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **Municipalidad de Cobquecura** | `cobquecura.cl` | Nuble | database | Medio de comunicación de la Región de Ñuble |
| ⬜ | **Nacimentano** | `nacimentano.cl` | Biobio | database | Medio de comunicación de la Región de Biobío |
| ⬜ | **Natales Online** | `natalesonline.cl` | Magallanes | watchlist | Sin feed RSS detectado |
| ⬜ | **Norte Online** | `norteonline.cl` | Arica Y Parinacota | database | Medio regional de la región de Arica y Parinacota |
| ⬜ | **Noticias Biobío** | `noticiasbiobio.cl` | Biobio | database | Medio de comunicación de la Región de Biobío |
| ⬜ | **Noticias Chiloé** | `noticiaschiloe.cl` | Los Lagos | database | Diario regional de Castro, Los Lagos |
| ⬜ | **Noticias del Lago** | `noticiasdellago.cl` | Araucania | database | Diario regional de Villarrica, La Araucanía |
| ⬜ | **Noticias del Sur** | `noticiasdelsur.cl` | Araucania | database | Medio de comunicación de la Región de Araucanía |
| 🟡 | **Noticias Los Ríos** | `noticiaslosrios.cl` | Los Rios | database | referenciado en sources.yaml |
| 🟡 | **Novena Digital** | `novenadigital.cl` | Araucania | database | referenciado en sources.yaml |
| 🟡 | **Nuevo Poder** | `nuevopoder.cl` | Metropolitana | database | referenciado en sources.yaml |
| 🟡 | **Ñuble Actual** | `nubleactual.cl` | Nuble | database | referenciado en sources.yaml |
| ⬜ | **Ñuble Digital** | `nubledigital.cl` | Nuble | database | Diario regional de Chillán, Ñuble |
| 🟡 | **Ñuble Online** | `nubleonline.cl` | Nuble | database | referenciado en sources.yaml |
| ⬜ | **Opinión Sur** | `opinionsur.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Órbita Noticias** | `orbitanoticias.cl` | Nuble | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Ovalle Hoy** | `ovallehoy.cl` | Coquimbo | database | Diario regional de Ovalle, Coquimbo |
| 🟡 | **Ovejero Noticias** | `ovejeronoticias.cl` | Magallanes | database | referenciado en sources.yaml |
| 🟡 | **Página 7** | `pagina7.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **País Lobo** | `paislobo.cl` | Los Lagos | database | Diario regional de Osorno, Los Lagos |
| ⬜ | **Parral Actual** | `parralactual.com` | Maule | watchlist | Sin feed RSS detectado |
| ⬜ | **Periódico Contraplano** | `contraplano.cl` | — | watchlist | Feed nativo no encontrado, solo feeds proxy activos |
| ⬜ | **Periódico Los Ríos** | `periodicolosrios.cl` | Los Rios | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Pichilemu News** | `pichilemunews.cl` | Ohiggins | database | Medio de comunicación de la Región de O'Higgins |
| ⬜ | **Portal Informativo** | `portalinformativo.cl` | Los Lagos | database | Medio de comunicación de la Región de Los Lagos |
| ⬜ | **Prensa Ciudadana** | `prensaciudadana.cl` | Araucania | database | Diario regional de Temuco, La Araucanía |
| ⬜ | **Prensa Curicó** | `prensacurico.cl` | Maule | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Primera Nota** | `primeranota.cl` | — | database | Medio de comunicación regional |
| ⬜ | **Pto. Williams** | `ptowilliams.cl` | Magallanes | watchlist | Sitio no accesible |
| ⬜ | **Pucón TV** | `pucontv.com` | Araucania | database | Medio de comunicación de la Región de Araucanía |
| 🟡 | **Puente Alto al Día** | `puentealtoaldia.cl` | Metropolitana | watchlist | Sitio no responde (timeout) |
| ⬜ | **Puerto al Día** | `puertoaldia.cl` | Los Lagos | watchlist | Sitio no responde, sin feed RSS detectado |
| ✅ | **Qué pasa Araucanía** | `quepasaaraucania.cl` | Araucania | database | sitemap en catálogo (quepasaaraucania) |
| ⬜ | **Queilen** | `queilen.cl` | Los Lagos | database | Medio de comunicación de la Región de Los Lagos |
| ⬜ | **Quilpué Online** | `quilpueonline.cl` | Valparaiso | database | Medio de comunicación de la Región de Valparaíso |
| ⬜ | **Quinta Interior** | `quintainterior.cl` | Valparaiso | watchlist | Sin feed RSS detectado |
| ⬜ | **Radio Magallanes** | `radiomagallanes.cl` | Magallanes | database | Medio de comunicación de la Región de Magallanes y de la Antártica Chilena |
| 🟡 | **Radio Maray** | `maray.cl` | Atacama | database | referenciado en sources.yaml |
| ⬜ | **Radio Polar** | `radiopolar.com` | — | watchlist | Sitio no disponible, solo feeds proxy activos |
| ⬜ | **Radio Puerta Norte** | `radiopuertanorte.cl` | Arica Y Parinacota | database | Radio de la Región de Arica y Parinacota 92.1 FM |
| 🟡 | **Radio Santa María** | `radiosantamaria.cl` | Aysen | database | referenciado en sources.yaml |
| ⬜ | **Radio Siente** | `radiosiente.com` | Arica Y Parinacota | watchlist | Sin actividad (todos los feeds inactivos) |
| ⬜ | **Radio Ventisqueros** | `radioventisqueros.cl` | Aysen | database | Medio de comunicación de la Región de Aysén |
| ⬜ | **Red Araucanía** | `redaraucania.com` | Araucania | watchlist | Sin feed RSS detectado |
| ⬜ | **Red Informativa** | `redinformativa.cl` | Araucania | database | Medio de comunicación de la Región de Araucanía |
| ⬜ | **Red Maule** | `redmaule.com` | Maule | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **Red Valparaíso** | `redvalparaiso.com` | Valparaiso | watchlist | Sin feed RSS detectado |
| ⬜ | **Región 2** | `region2.cl` | — | watchlist | Sitio no disponible, solo feeds proxy activos |
| ⬜ | **Región Visual** | `regionvisual.com` | Valparaiso | database | Medio regional de la Región de Valparaíso |
| ⬜ | **Regionalista** | `regionalista.cl` | Antofagasta | database | Medio de comunicación de la Región de Antofagasta |
| ⬜ | **Rengo Notas** | `rengonotas.cl` | Ohiggins | watchlist | Sin actividad (todos los feeds inactivos) |
| 🟡 | **Resonancia Diario** | `resonanciadiario.cl` | Antofagasta | database | referenciado en sources.yaml |
| 🟡 | **Resumen** | `resumen.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Río en Línea** | `rioenlinea.cl` | Los Rios | database | Diario regional de Valdivia, Los Ríos |
| ⬜ | **Río Negro Un Sueño** | `rionegro.ligup2.com` | Los Lagos | watchlist | Sin actividad (todos los feeds inactivos) |
| ✅ | **Sabes** | `sabes.cl` | — | watchlist | Sin feed RSS detectado |
| ✅ | **Sala de Prensa** | `saladeprensa.cl` | Biobio | database | Medio de comunicación regional de Concepción y la Región del Biobío |
| ⬜ | **San Carlos Al Día** | `sancarlosaldia.cl` | Nuble | watchlist | Solo feeds proxy activos (feeds nativos inactivos) |
| ⬜ | **San Carlos On Line** | `sancarlosonline.cl` | Nuble | database | Diario regional de San Carlos, Ñuble |
| ⬜ | **Séptima Página** | `septimapaginanoticias.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **Sera Noticia** | `seranoticia.cl` | Maule | database | Diario regional del Maule |
| ⬜ | **Serena y Coquimbo** | `serenaycoquimbo.cl` | Coquimbo | database | Portal de noticias de La Serena y Coquimbo |
| ⬜ | **Sexta Noticias** | `sextanoticias.cl` | Ohiggins | watchlist | Sitio no responde, sin feed RSS detectado |
| ⬜ | **Sitio del Suceso** | `sitiodelsuceso.cl` | Metropolitana | database | Cobertura de sucesos y noticias de Santiago, Región Metropolitana y Región de Valparaíso |
| ⬜ | **SoyAntofagasta** | `soyantofagasta.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyArica** | `soyarica.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyCalama** | `soycalama.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyChiloé** | `soychiloe.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyConcepción** | `soyconcepcion.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyCopiapó** | `soycopiapo.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyIquique** | `soyiquique.cl` | Tarapaca | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyOsorno** | `soyosorno.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyPuerto Montt** | `soypuertomontt.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyQuillota** | `soyquillota.cl` | Valparaiso | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyTemuco** | `soytemuco.cl` | — | watchlist | Sin feed RSS detectado |
| ⬜ | **SoyValparaíso** | `soyvalparaiso.cl` | Valparaiso | watchlist | Sin feed RSS detectado |
| ⬜ | **Sur Actual** | `suractual.cl` | Los Lagos | watchlist | Sitio no accesible |
| 🟡 | **Tarapacá Online** | `tarapacaonline.cl` | Tarapaca | database | referenciado en sources.yaml |
| ⬜ | **Temuco Diario** | `temucodiario.cl` | Araucania | database | Diario regional de Temuco, La Araucanía |
| ⬜ | **Tiempo 21** | `tiempo21.cl` | Araucania | database | Diario regional de Temuco, La Araucanía |
| ⬜ | **Tiempo 21 Araucanía** | `tiempo21araucania.cl` | Araucania | watchlist | Sin feed RSS detectado |
| 🟡 | **Tierramarillano** | `tierramarillano.cl` | Atacama | database | referenciado en sources.yaml |
| ⬜ | **Timeline** | `timeline.cl` | Antofagasta | database | Diario regional de Antofagasta, Antofagasta |
| ⬜ | **Tomé al Día** | `tomealdia.com` | Biobio | database | Medio de comunicación de la Región de Biobío |
| ⬜ | **Traiguén City** | `traiguencity.cl` | Araucania | database | Diario regional de Traiguén, La Araucanía |
| ⬜ | **Tribuna del Biobío** | `tribunadelbiobio.cl` | Biobio | watchlist | Sin feed RSS detectado |
| ⬜ | **Tus Noticias** | `tusnoticias.cl` | Biobio | database | Medio digital de San Pedro de la Paz, Región del Biobío |
| ⬜ | **Vallenar Digital** | `vallenardigital.cl` | Atacama | database | Medio de comunicación de la Región de Atacama |
| ✅ | **Valparaíso Noticias** | `valparaisonoticias.cl` | Valparaiso | database | Medio digital de noticias de la Región de Valparaíso |
| ⬜ | **Viento Patagón** | `vientopatagon.cl` | Magallanes | watchlist | Sitio no accesible |
| ⬜ | **Villarrica al Día** | `villarricaldia.cl` | Araucania | database | Medio de comunicación de la Región de Araucanía |
| 🟡 | **VLN Radio** | `vlnradio.cl` | Maule | database | referenciado en sources.yaml |
| 🟡 | **Zona Zero** | `zonazero.cl` | Magallanes | database | referenciado en sources.yaml |

## Leyenda

- ✅ **En catálogo:** el sitemap del medio ya está sincronizado en `sitemaps/<slug>/`.
- 🟡 **En uso:** el medio ya aparece como fuente en `sources.yaml` o como org de prensa en `entities.yaml`, pero su sitemap aún no se sincroniza — prioridad para ampliar el catálogo.
- 🔒 **Sin sitemap:** el sitio fue verificado y no expone sitemap; no reintentar.
- ⬜ **Pendiente:** sitio de prensa sin sitemap en el catálogo ni referencia en el vault.

## Instrucciones para agregar un medio nuevo

1. Verificar el sitemap del sitio (robots.txt o `/sitemap.xml`).
2. Agregar la entrada a `MEDIA` en `scripts/sync-sitemaps.mjs` (slug, nombre, sitemaps, filtro).
3. Sincronizar: `pnpm run sitemaps-sync -- <slug>`.
4. Regenerar README/AGENTS: `pnpm run sitemaps-index`.
5. Agregar dominio y nombre a `CATALOG_MEDIO_BY_DOMAIN`/`CATALOG_MEDIO_NAMES` de `scripts/add-source.mjs`.
6. Registrar la org de prensa en `entities.yaml` si no existe (regla de wikilinks).
7. Actualizar este archivo: `pnpm run sitemaps-watchlist -- --source <ruta-al-repo>`.
