# Reporte de cruce con awesome-chilean-rss

> Generado por `node .agents/skills/sitemaps/scripts/report-awesome.mjs` el 2026-09-28,
> cruzando el catálogo de sitemaps del vault (`sitemaps/_manifest.json`,
> 477 medios) y las fuentes citadas en
> `src/content/sources/*.md` contra `feeds-database.json` (664 sitios) y
> `watchlist.json` (525 sitios) de awesome-chilean-rss, con verificación de feed en vivo.

## 1. Sitios nuevos en el repo que aún no evaluamos

**Ninguno.
La bitácora `TAREAS/tareas_sitemap.md` ya cubre los 1135 dominios del repo: los
1001 que caen en las 12 categorías de prensa que el vault
rastrea, más los 134 de categorías excluidas, que no generan fila. Para que aparezcan
sitios nuevos basta con regenerar la bitácora (`pnpm run sitemaps-watchlist`), que vuelve a
cruzar contra el repo.
Aparte, el repo suma 134 dominios en categorías que
el vault excluye **por diseño** (deportes, gaming, empleos, entretenimiento,
tecnología, blogs personales), así que no generan tareas:
`acti.cl`, `alairelibre.cl`, `alertageekchile.cl`, `alianzaciberseguridad.cl`, `amigospenquistas.cl`, `anfp.cl`, `animechile.cl`, `autonoticias.cl`, `blaster.cl`, `blog.broota.com`, `bne.cl`, `brunner.cl`, …


## 2. Medios del vault que awesome-chilean-rss NO lista

Estos son los candidatos a reportarse al repo. **108 de 236 respondieron con un feed RSS/Atom real** y son proposal-ready (53 de ellos son de tipo `prensa`, o sea dominios `.cl`); los 128 sin feed se listan aparte para no proponer feeds rotos.

### 2.1 Con feed verificado (enviables al repo)

La columna **Tipo** separa lo que el repo probablemente quiere de lo que no:
solo los `prensa` (dominio `.cl`) son candidatos directos; los `institución` y
`internacional/otros` son think tanks, organismos o medios foráneos que citamos
como fuente y que se decide aparte.

| Medio | Tipo | Dominio | Artículos catálogo | Años | Feed detectado | Visto en |
| --- | --- | --- | ---: | ---: | --- | --- |
| Vallenar Digital | prensa | `vallenardigital.cl` | 25.789 | 15 | https://portalweb.vallenardigital.cl/feed/ | catálogo:vallenardigital |
| Somos Chile | prensa | `somoschile.cl` | 17.544 | 12 | https://www.somoschile.cl/feed/ | catálogo:somoschile |
| ANIP | prensa | `anip.cl` | 70 | 5 | https://anip.cl/feed/ | catálogo:anip |
| Aconcagua al Día | prensa | `aconcaguaaldia.cl` | — | — | https://aconcaguaaldia.cl/feed/ | fuente:Aconcagua al Día |
| ADPrensa | prensa | `adprensa.cl` | — | — | https://adprensa.cl/feed/ | fuente:ADPrensa |
| AIM Chile | prensa | `aimchile.cl` | — | — | https://aimchile.cl/feed/ | fuente:AIM Chile |
| Alerta Prevencion (AGRICET) | prensa | `alertaprevencion.cl` | — | — | https://alertaprevencion.cl/feed/ | fuente:Alerta Prevencion (AGRICET) |
| Amnistía Internacional Chile | prensa | `amnistia.cl` | — | — | https://amnistia.cl/feed/ | fuente:Amnistía Internacional Chile |
| Archivo Andrés Aylwin | prensa | `archivoandresaylwin.cl` | — | — | https://www.archivoandresaylwin.cl/feed/ | fuente:Archivo Andrés Aylwin |
| BioNoticias | prensa | `bionoticias.cl` | — | — | https://bionoticias.cl/feed/ | fuente:BioNoticias |
| Cadem | prensa | `cadem.cl` | — | — | https://cadem.cl/feed/ | fuente:Cadem |
| Centro de Extensión e Investigación Luis Emilio Recabarren | prensa | `ceiler.cl` | — | — | https://www.ceiler.cl/feed/ | fuente:Centro de Extensión e Investigación Luis Emilio Recabarren |
| ConceAhora | prensa | `conceahora.cl` | — | — | https://www.conceahora.cl/feed/ | fuente:ConceAhora |
| Criteria | prensa | `criteria.cl` | — | — | https://www.criteria.cl/feed/ | fuente:Criteria |
| Doble Espacio (Revista de Periodismo de la Universidad de Chile) | prensa | `doble-espacio.uchile.cl` | — | — | https://doble-espacio.uchile.cl/feed/ | fuente:Doble Espacio (Revista de Periodismo de la Universidad de Chile) |
| El Carrerino | prensa | `elcarrerino.cl` | — | — | https://elcarrerino.cl/feed/ | fuente:El Carrerino |
| El Conquistador Concepción | prensa | `elconquistadorconcepcion.cl` | — | — | https://www.elconquistadorconcepcion.cl/feed/ | fuente:El Conquistador Concepción |
| Diario El Latino | prensa | `ellatino.cl` | — | — | https://ellatino.cl/feed/ | fuente:Diario El Latino |
| El Orador Ilustrado | prensa | `eloradorilustrado.cl` | — | — | https://eloradorilustrado.cl/feed/ | fuente:El Orador Ilustrado |
| Federación de Trabajadores del Cobre (FTC) | prensa | `ftc.cl` | — | — | https://www.ftc.cl/feed/ | fuente:Federación de Trabajadores del Cobre (FTC) |
| Geógrafas Chile | prensa | `geografaschile.cl` | — | — | https://www.geografaschile.cl/feed/ | fuente:Geógrafas Chile |
| Giro Visual | prensa | `girovisual.cl` | — | — | https://girovisual.cl/feed/ | fuente:Giro Visual |
| Universidad del Desarrollo (Ingeniería) | prensa | `ingenieria.udd.cl` | — | — | https://ingenieria.udd.cl/feed/ | fuente:Universidad del Desarrollo (Ingeniería) |
| La Chispa Sur | prensa | `lachispasur.cl` | — | — | https://lachispasur.cl/rss.xml | fuente:La Chispa Sur |
| Las Últimas Noticias (LUN) | prensa | `lunmas.cl` | — | — | https://lunmas.cl/feed/ | fuente:Las Últimas Noticias (LUN) |
| MediaInfo | prensa | `mediainfo.cl` | — | — | https://mediainfo.cl/feed/ | fuente:MediaInfo |
| Memoria y Vida (Corporación Pilmaiquen) | prensa | `memoriayvida.cl` | — | — | https://memoriayvida.cl/feed/ | fuente:Memoria y Vida (Corporación Pilmaiquen) |
| Ministerio de Seguridad Pública | prensa | `minsegpublica.cl` | — | — | https://minsegpublica.cl/feed/ | fuente:Ministerio de Seguridad Pública |
| Movilh | prensa | `movilh.cl` | — | — | https://www.movilh.cl/feed/ | fuente:Movilh |
| Museo de la Solidaridad Salvador Allende | prensa | `mssa.cl` | — | — | https://www.mssa.cl/feed/ | fuente:Museo de la Solidaridad Salvador Allende |
| Municipalidad de Rinconada | prensa | `munirinconada.cl` | — | — | https://munirinconada.cl/feed/ | fuente:Municipalidad de Rinconada |
| Observatorio del Contexto Económico de la Universidad Diego Portales (OCEC-UDP) | prensa | `ocec.udp.cl` | — | — | https://ocec.udp.cl/feed/ | fuente:Observatorio del Contexto Económico de la Universidad Diego Portales (OCEC-UDP) |
| Periódico de la Costa | prensa | `periodicodelacosta.cl` | — | — | https://periodicodelacosta.cl/feed/ | fuente:Periódico de la Costa |
| Poder y Liderazgo | prensa | `poderyliderazgo.cl` | — | — | https://www.poderyliderazgo.cl/feed/ | fuente:Poder y Liderazgo |
| Portal Innova | prensa | `portalinnova.cl` | — | — | https://portalinnova.cl/feed/ | fuente:Portal Innova |
| Portal Puente Alto | prensa | `portalpuentealto.cl` | — | — | https://www.portalpuentealto.cl/feed/ | fuente:Portal Puente Alto |
| Preludio Radio | prensa | `preludioradio.cl` | — | — | https://www.preludioradio.cl/feed/ | fuente:Preludio Radio |
| Subsecretaría de Prevención del Delito | prensa | `prevenciondehomicidios.cl` | — | — | https://prevenciondehomicidios.cl/feed/ | fuente:Subsecretaría de Prevención del Delito |
| Quinta Visión Ahora | prensa | `quintavisionahora.cl` | — | — | https://www.quintavisionahora.cl/feed/ | fuente:Quinta Visión Ahora |
| Radio Aconcagua | prensa | `radioaconcagua.cl` | — | — | https://radioaconcagua.cl/feed/ | fuente:Radio Aconcagua |
| Radio Contigo | prensa | `radiocontigo.cl` | — | — | https://radiocontigo.cl/feed/ | fuente:Radio Contigo |
| Radio FM+ | prensa | `radiofmmas.cl` | — | — | https://radiofmmas.cl/feed/ | fuente:Radio FM+ |
| Radio Galáctica | prensa | `radiogalactika.cl` | — | — | https://www.radiogalactika.cl/feed/ | fuente:Radio Galáctica |
| Radio Indómita | prensa | `radioindomita.cl` | — | — | https://radioindomita.cl/feed/ | fuente:Radio Indómita |
| RDN | prensa | `rdn.cl` | — | — | https://rdn.cl/feed/ | fuente:RDN |
| Revista de Frente | prensa | `revistadefrente.cl` | — | — | https://www.revistadefrente.cl/feed/ | fuente:Revista de Frente |
| Revista Tierra Bella | prensa | `revistatierrabella.cl` | — | — | https://revistatierrabella.cl/feed/ | fuente:Revista Tierra Bella |
| El Diario de Salamanca | prensa | `salamancachile.cl` | — | — | https://salamancachile.cl/feed/ | fuente:El Diario de Salamanca |
| Municipalidad de San Bernardo | prensa | `sanbernardo.cl` | — | — | https://www.sanbernardo.cl/feed/ | fuente:Municipalidad de San Bernardo |
| Servicio Electoral (Servel) | prensa | `servel.cl` | — | — | https://www.servel.cl/feed/ | fuente:Servicio Electoral (Servel) |
| Tribunal de Defensa de la Libre Competencia | prensa | `tdlc.cl` | — | — | https://www.tdlc.cl/feed/ | fuente:Tribunal de Defensa de la Libre Competencia, fuente:Tribunal de la Libre Competencia |
| Municipalidad de Temuco | prensa | `temuco.cl` | — | — | https://www.temuco.cl/feed/ | fuente:Municipalidad de Temuco |
| Tribunal Constitucional de Chile | prensa | `www1.tribunalconstitucional.cl` | — | — | https://www1.tribunalconstitucional.cl/feed/ | fuente:Tribunal Constitucional de Chile |
| Archivo Nacional de Chile | institución | `archivonacional.gob.cl` | — | — | https://www.archivonacional.gob.cl/rss.xml | fuente:Archivo Nacional de Chile |
| Subsecretaría de Previsión Social | institución | `previsionsocial.gob.cl` | — | — | https://previsionsocial.gob.cl/feed/ | fuente:Subsecretaría de Previsión Social |
| AIT News | internacional/otros | `aitnews.com` | 79.295 | 17 | https://aitnews.com/feed/ | catálogo:aitnews |
| Corporación 3 y 4 Álamos | internacional/otros | `3y4alamos.com` | — | — | https://3y4alamos.com/feed/ | fuente:Corporación 3 y 4 Álamos |
| Agencia AJN | internacional/otros | `agenciaajn.com` | — | — | https://agenciaajn.com/feed | fuente:Agencia AJN |
| American Jewish Committee (AJC) | internacional/otros | `ajc.org` | — | — | https://www.ajc.org/rss.xml | fuente:American Jewish Committee (AJC) |
| Amnistía Internacional Chile | internacional/otros | `amnesty.org` | — | — | https://www.amnesty.org/en/feed/ | fuente:Amnistía Internacional Chile, fuente:Amnistía Internacional |
| Bardeo.news | internacional/otros | `bardeo.news` | — | — | https://bardeo.news/rss/ | fuente:Bardeo.news |
| CentroCompetencia (PDF programa Kast 2022-2026) | internacional/otros | `centrocompetencia.com` | — | — | https://centrocompetencia.com/sitemap.rss | fuente:CentroCompetencia (PDF programa Kast 2022-2026) |
| Chicureo.com | internacional/otros | `chicureo.com` | — | — | https://chicureo.com/feed/ | fuente:Chicureo.com |
| Activa Research | internacional/otros | `chile.activasite.com` | — | — | https://chile.activasite.com/feed/ | fuente:Activa Research |
| Courthouse News | internacional/otros | `courthousenews.com` | — | — | https://courthousenews.com/feed/ | fuente:Courthouse News |
| Crónicas del Chile Fome | internacional/otros | `cronicasdelchilefome.com` | — | — | https://cronicasdelchilefome.com/feed/ | fuente:Crónicas del Chile Fome |
| defensa.com | internacional/otros | `defensa.com` | — | — | https://www.defensa.com/rss/ | fuente:defensa.com |
| Equipo Nizkor | internacional/otros | `derechos.org` | — | — | https://derechos.org/atom.xml | fuente:Equipo Nizkor |
| Diario Red | internacional/otros | `diario-red.com` | — | — | https://www.diario-red.com/rss/ | fuente:Diario Red |
| Electronic Frontier Foundation (EFF) | internacional/otros | `eff.org` | — | — | https://www.eff.org/rss.xml | fuente:Electronic Frontier Foundation (EFF) |
| elDiarioAR | internacional/otros | `eldiarioar.com` | — | — | https://www.eldiarioar.com/rss/ | fuente:elDiarioAR |
| El Espectador | internacional/otros | `elespectador.com` | — | — | https://www.elespectador.com/feed/ | fuente:El Espectador |
| En Estrado | internacional/otros | `enestrado.com` | — | — | https://enestrado.com/feed/ | fuente:En Estrado |
| Escenario Mundial | internacional/otros | `escenariomundial.com` | — | — | https://www.escenariomundial.com/feed/ | fuente:Escenario Mundial |
| AFP | internacional/otros | `factual.afp.com` | — | — | https://factual.afp.com/rss.xml | fuente:AFP |
| Foro Madrid | internacional/otros | `foromadrid.org` | — | — | https://foromadrid.org/feed/ | fuente:Foro Madrid |
| Fox News | internacional/otros | `foxnews.com` | — | — | https://www.foxnews.com/rss.xml | fuente:Fox News |
| GDA | internacional/otros | `gda.com` | — | — | https://gda.com/feed/ | fuente:GDA |
| HonduDiario | internacional/otros | `hondudiario.com` | — | — | https://www.hondudiario.com/feed/ | fuente:HonduDiario |
| Human Rights Watch | internacional/otros | `hrw.org` | — | — | https://www.hrw.org/rss/news | fuente:Human Rights Watch |
| Hungarian Conservative | internacional/otros | `hungarianconservative.com` | — | — | https://www.hungarianconservative.com/feed/ | fuente:Hungarian Conservative |
| Corte Internacional de Justicia | internacional/otros | `icj.org` | — | — | https://www.icj.org/feed/ | fuente:Corte Internacional de Justicia |
| Infocielo | internacional/otros | `infocielo.com` | — | — | https://www.infocielo.com/feed | fuente:Infocielo |
| vd iglobal Informes | internacional/otros | `informes.vdiglobal.org` | — | — | https://informes.vdiglobal.org/rss/ | fuente:vd iglobal Informes |
| InSight Crime | internacional/otros | `insightcrime.org` | — | — | https://insightcrime.org/feed/ | fuente:InSight Crime |
| JNS.org | internacional/otros | `jns.org` | — | — | https://www.jns.org/index.rss | fuente:JNS.org |
| Kaos en la Red | internacional/otros | `kaosenlared.net` | — | — | https://kaosenlared.net/feed/ | fuente:Kaos en la Red |
| La Opinión | internacional/otros | `laopinion.com` | — | — | https://laopinion.com/feed/ | fuente:La Opinión |
| LatAm Journalism Review | internacional/otros | `latamjournalismreview.org` | — | — | https://latamjournalismreview.org/feed/ | fuente:LatAm Journalism Review |
| Latin Times | internacional/otros | `latintimes.com` | — | — | https://www.latintimes.com/rss/ | fuente:Latin Times |
| La Unión Valpo | internacional/otros | `launionvalpo.com` | — | — | https://launionvalpo.com/feed/ | fuente:La Unión Valpo |
| The National Interest | internacional/otros | `nationalinterest.org` | — | — | https://nationalinterest.org/feed | fuente:The National Interest |
| Negocios.com | internacional/otros | `negocios.com` | — | — | https://www.negocios.com/rss/ | fuente:Negocios.com |
| OECO (Observatorio Ecuatoriano de Crimen Organizado) | internacional/otros | `oeco.padf.org` | — | — | https://oeco.padf.org/feed/ | fuente:OECO (Observatorio Ecuatoriano de Crimen Organizado) |
| openDemocracy | internacional/otros | `opendemocracy.net` | — | — | https://www.opendemocracy.net/rss/ | fuente:openDemocracy |
| PanAm Post | internacional/otros | `panampost.com` | — | — | https://panampost.com/feed/ | fuente:PanAm Post |
| Autoridad del Canal de Panamá | internacional/otros | `pancanal.com` | — | — | https://pancanal.com/feed/ | fuente:Autoridad del Canal de Panamá |
| Parlamentario | internacional/otros | `parlamentario.com` | — | — | https://www.parlamentario.com/feed/ | fuente:Parlamentario |
| Political Network for Values | internacional/otros | `politicalnetworkforvalues.org` | — | — | https://politicalnetworkforvalues.org/feed/ | fuente:Political Network for Values |
| Radio Kurruf | internacional/otros | `radiokurruf.org` | — | — | https://radiokurruf.org/feed/ | fuente:Radio Kurruf |
| Resistencia Chile | internacional/otros | `resistenciachile.org` | — | — | https://resistenciachile.org/rss.xml | fuente:Resistencia Chile |
| Resumen Latinoamericano | internacional/otros | `resumenlatinoamericano.org` | — | — | https://www.resumenlatinoamericano.org/feed/ | fuente:Resumen Latinoamericano |
| Rutamotor | internacional/otros | `rutamotor.com` | — | — | https://www.rutamotor.com/feed/ | fuente:Rutamotor |
| teleSUR | internacional/otros | `telesurtv.net` | — | — | https://www.telesurtv.net/feed/ | fuente:teleSUR |
| The Daily Star | internacional/otros | `thedailystar.net` | — | — | https://www.thedailystar.net/rss.xml | fuente:The Daily Star |
| TVenserio | internacional/otros | `tvenserio.com` | — | — | https://tvenserio.com/feed/ | fuente:TVenserio |
| La Vía Campesina | internacional/otros | `viacampesina.org` | — | — | https://viacampesina.org/feed/ | fuente:La Vía Campesina |
| VIN News | internacional/otros | `vinnews.com` | — | — | https://vinnews.com/feed/ | fuente:VIN News |

### 2.2 Sin feed detectado (no proponer todavía)

| Medio | Tipo | Dominio | Artículos catálogo | Años | Visto en |
| --- | --- | --- | ---: | ---: | --- |
| Tuki | prensa | `tuki.cl` | 905 | 1 | catálogo:tuki |
| RedSalud | prensa | `redsalud.cl` | 388 | 1 | catálogo:redsalud |
| Actualidad Jurídica | prensa | `actualidadjuridica.doe.cl` | — | — | fuente:Actualidad Jurídica, fuente:Actualidad Jurídica DOE |
| AFC Chile | prensa | `afc.cl` | — | — | fuente:AFC Chile |
| Municipalidad de Antofagasta | prensa | `antofagasta.cl` | — | — | fuente:Municipalidad de Antofagasta |
| Museo de la Memoria y los Derechos Humanos | prensa | `archivommdh.cl` | — | — | fuente:Museo de la Memoria y los Derechos Humanos |
| Corporación de Asistencia Judicial Metropolitana | prensa | `cajmetro.cl` | — | — | fuente:Corporación de Asistencia Judicial Metropolitana |
| Carabineros de Chile | prensa | `carabineros.cl` | — | — | fuente:Carabineros de Chile |
| Comisión Chilena del Cobre (Cochilco) | prensa | `cochilco.cl` | — | — | fuente:Comisión Chilena del Cobre (Cochilco) |
| Diario VTV | prensa | `diariovtv.cl` | — | — | fuente:Diario VTV |
| El PUClítico | prensa | `elpuclitico.cl` | — | — | fuente:El PUClítico |
| Empresa Nacional del Petróleo (ENAP) | prensa | `enap.cl` | — | — | fuente:Empresa Nacional del Petróleo (ENAP) |
| Radio Candelaria | prensa | `fmcandelaria.cl` | — | — | fuente:Radio Candelaria |
| Fotografía Patrimonial | prensa | `fotografiapatrimonial.cl` | — | — | fuente:Fotografía Patrimonial |
| Instituto Nacional de Derechos Humanos | prensa | `indh.cl` | — | — | fuente:Instituto Nacional de Derechos Humanos |
| Museo de la Memoria y los Derechos Humanos | prensa | `interactivos.museodelamemoria.cl` | — | — | fuente:Museo de la Memoria y los Derechos Humanos |
| Kapital FM | prensa | `kapitalfm.cl` | — | — | fuente:Kapital FM |
| La Pública | prensa | `lapublica.cl` | — | — | fuente:La Pública |
| La Serena Radio | prensa | `laserenaradio.cl` | — | — | fuente:La Serena Radio |
| Biblioteca del Congreso Nacional (LeyChile) | prensa | `leyes.pisanvs.cl` | — | — | fuente:Biblioteca del Congreso Nacional (LeyChile) |
| Licitaciones de Chile | prensa | `licitacionesdechile.cl` | — | — | fuente:Licitaciones de Chile |
| Cooperativa | prensa | `m.cooperativa.cl` | — | — | fuente:Cooperativa |
| Instituto Nacional de Derechos Humanos | prensa | `media-front.elmostrador.cl` | — | — | fuente:Instituto Nacional de Derechos Humanos, fuente:Poder Judicial de Chile |
| Puig Abogados | prensa | `megareforma.cl` | — | — | fuente:Puig Abogados |
| DecideChile (Unholster) | prensa | `mercadopublico.decidechile.cl` | — | — | fuente:DecideChile (Unholster) |
| Museo de la Memoria y los Derechos Humanos | prensa | `mmdh.cl` | — | — | fuente:Museo de la Memoria y los Derechos Humanos |
| Municipalidad de Coquimbo | prensa | `municoquimbo.cl` | — | — | fuente:Municipalidad de Coquimbo |
| DecideChile (Unholster) | prensa | `new.decidechile.cl` | — | — | fuente:DecideChile (Unholster) |
| Biblioteca del Congreso Nacional (Ley Chile) | prensa | `nuevo.leychile.cl` | — | — | fuente:Biblioteca del Congreso Nacional (Ley Chile) |
| Cooperativa | prensa | `opinion.cooperativa.cl` | — | — | fuente:Cooperativa |
| Plataforma Contexto | prensa | `plataformacontexto.cl` | — | — | fuente:Plataforma Contexto |
| Portal de Transparencia | prensa | `portaltransparencia.cl` | — | — | fuente:Portal de Transparencia |
| Radio Ancoa | prensa | `radioancoa.cl` | — | — | fuente:Radio Ancoa |
| Radio La Unión | prensa | `radiolaunion.cl` | — | — | fuente:Radio La Unión |
| Radio Pasión FM | prensa | `radiopasionfm.cl` | — | — | fuente:Radio Pasión FM |
| Red de Integridad y Estado Abierto | prensa | `reddeintegridad.cl` | — | — | fuente:Red de Integridad y Estado Abierto |
| Región XV | prensa | `regionxv.cl` | — | — | fuente:Región XV |
| Andes Pediátrica (SciELO) | prensa | `scielo.cl` | — | — | fuente:Andes Pediátrica (SciELO) |
| Tele13 Radio | prensa | `tele13radio.cl` | — | — | fuente:Tele13 Radio |
| Transporte Informa | prensa | `transporteinforma.cl` | — | — | fuente:Transporte Informa |
| Segundo Tribunal Ambiental | prensa | `tribunalambiental.cl` | — | — | fuente:Segundo Tribunal Ambiental |
| Unidad de Análisis Financiero (UAF) | prensa | `uaf.cl` | — | — | fuente:Unidad de Análisis Financiero (UAF) |
| UCV Radio | prensa | `ucvradio.cl` | — | — | fuente:UCV Radio |
| Urgente | prensa | `urgente.cl` | — | — | fuente:Urgente |
| Voto Visible | prensa | `votovisible.cl` | — | — | fuente:Voto Visible |
| Xanadu Radio | prensa | `xanaduradio.cl` | — | — | fuente:Xanadu Radio |
| Comisión para la Fijación de Remuneraciones | institución | `comision38bis.gob.cl` | — | — | fuente:Comisión para la Fijación de Remuneraciones |
| Portal de Datos Abiertos del Estado (datos.gob.cl) | institución | `datos.gob.cl` | — | — | fuente:Portal de Datos Abiertos del Estado (datos.gob.cl) |
| DocDigital (doc.digital.gob.cl) | institución | `doc.digital.gob.cl` | — | — | fuente:DocDigital (doc.digital.gob.cl) |
| Delegación Presidencial Regional de Antofagasta | institución | `dprantofagasta.dpr.gob.cl` | — | — | fuente:Delegación Presidencial Regional de Antofagasta |
| Fiscalía Nacional Económica | institución | `fne.gob.cl` | — | — | fuente:Fiscalía Nacional Económica |
| Fondo Nacional de Salud (Fonasa) | institución | `fonasa.gob.cl` | — | — | fuente:Fondo Nacional de Salud (Fonasa) |
| Instituto de Previsión Social (IPS) | institución | `ips.gob.cl` | — | — | fuente:Instituto de Previsión Social (IPS) |
| Ministerio de Justicia y Derechos Humanos (Subsecretaría de DDHH) | institución | `memoriahistorica.minjusticia.gob.cl` | — | — | fuente:Ministerio de Justicia y Derechos Humanos (Subsecretaría de DDHH) |
| Ministerio de Minería de Chile | institución | `minmineria.gob.cl` | — | — | fuente:Ministerio de Minería de Chile |
| Consejo de Monumentos Nacionales | institución | `monumentos.gob.cl` | — | — | fuente:Consejo de Monumentos Nacionales |
| Servicio de Evaluación Ambiental | institución | `recursos.sea.gob.cl` | — | — | fuente:Servicio de Evaluación Ambiental |
| Subrei | institución | `subrei.gob.cl` | — | — | fuente:Subrei |
| Arauco | internacional/otros | `arauco.com` | 190 | 10 | catálogo:arauco |
| Infodefensa | internacional/otros | `infodefensa.com` | 100 | 1 | catálogo:infodefensa, fuente:Infodefensa |
| Ámbito (Argentina) | internacional/otros | `ambito.com` | — | — | fuente:Ámbito (Argentina) |
| Atlantic Council | internacional/otros | `atlanticcouncil.org` | — | — | fuente:Atlantic Council |
| Bloomberg | internacional/otros | `bloomberg.com` | — | — | fuente:Bloomberg |
| Bloomberg Línea | internacional/otros | `bloomberglinea.com` | — | — | fuente:Bloomberg Línea |
| BNamericas | internacional/otros | `bnamericas.com` | — | — | fuente:BNamericas |
| Canal 26 | internacional/otros | `canal26.com` | — | — | fuente:Canal 26 |
| CBS News | internacional/otros | `cbsnews.com` | — | — | fuente:CBS News |
| CEPAL | internacional/otros | `cepal.org` | — | — | fuente:CEPAL |
| CNBC | internacional/otros | `cnbc.com` | — | — | fuente:CNBC |
| CNN en Español | internacional/otros | `cnnespanol.cnn.com` | — | — | fuente:CNN en Español |
| Codelco | internacional/otros | `codelco.com` | — | — | fuente:Codelco |
| CompaniesMarketCap | internacional/otros | `companiesmarketcap.com` | — | — | fuente:CompaniesMarketCap |
| Correo del Sur | internacional/otros | `correodelsur.com` | — | — | fuente:Correo del Sur |
| Daily Mail | internacional/otros | `dailymail.com` | — | — | fuente:Daily Mail |
| Banco Mundial | internacional/otros | `datos.bancomundial.org` | — | — | fuente:Banco Mundial |
| Associated Press | internacional/otros | `denverpost.com` | — | — | fuente:Associated Press |
| Diario Las Américas | internacional/otros | `diariolasamericas.com` | — | — | fuente:Diario Las Américas |
| Diario Libre | internacional/otros | `diariolibre.com` | — | — | fuente:Diario Libre |
| Disidentes | internacional/otros | `disidentescl.com` | — | — | fuente:Disidentes |
| Google Drive (compilación ciudadana) | internacional/otros | `drive.google.com` | — | — | fuente:Google Drive (compilación ciudadana) |
| Dropbox (compilación ciudadana) | internacional/otros | `dropbox.com` | — | — | fuente:Dropbox (compilación ciudadana) |
| El Debate | internacional/otros | `eldebate.com` | — | — | fuente:El Debate |
| El Destape | internacional/otros | `eldestapeweb.com` | — | — | fuente:El Destape |
| El Nuevo Día | internacional/otros | `elnuevodia.com` | — | — | fuente:El Nuevo Día |
| El Tiempo | internacional/otros | `eltiempo.com` | — | — | fuente:El Tiempo |
| El Tribuno | internacional/otros | `eltribuno.com` | — | — | fuente:El Tribuno |
| El Universo | internacional/otros | `eluniverso.com` | — | — | fuente:El Universo |
| United States Holocaust Memorial Museum | internacional/otros | `encyclopedia.ushmm.org` | — | — | fuente:United States Holocaust Memorial Museum |
| Scribd (documento filtrado) | internacional/otros | `es.scribd.com` | — | — | fuente:Scribd (documento filtrado) |
| Wikipedia | internacional/otros | `es.wikipedia.org` | — | — | fuente:Wikipedia |
| Evangélico Digital | internacional/otros | `evangelicodigital.com` | — | — | fuente:Evangélico Digital |
| Expansión | internacional/otros | `expansion.com` | — | — | fuente:Expansión |
| Naciones Unidas | internacional/otros | `financing.desa.un.org` | — | — | fuente:Naciones Unidas |
| Forensic Architecture | internacional/otros | `forensic-architecture.org` | — | — | fuente:Forensic Architecture |
| Naciones Unidas | internacional/otros | `gadebate.un.org` | — | — | fuente:Naciones Unidas |
| Hudson Rock | internacional/otros | `hudsonrock.com` | — | — | fuente:Hudson Rock |
| Imgur | internacional/otros | `imgur.com` | — | — | fuente:Imgur |
| The Jerusalem Post | internacional/otros | `jpost.com` | — | — | fuente:The Jerusalem Post |
| KKL-JNF | internacional/otros | `kkl-jnf.org` | — | — | fuente:KKL-JNF |
| La Política Online | internacional/otros | `lapoliticaonline.com` | — | — | fuente:La Política Online |
| Financial Times | internacional/otros | `media.ft.com` | — | — | fuente:Financial Times |
| Memoria Viva | internacional/otros | `memoriaviva.com` | — | — | fuente:Memoria Viva |
| Military Aerospace | internacional/otros | `militaryaerospace.com` | — | — | fuente:Military Aerospace |
| MSN Noticias | internacional/otros | `msn.com` | — | — | fuente:MSN Noticias |
| Notimérica | internacional/otros | `notimerica.com` | — | — | fuente:Notimérica |
| Nueva Minería | internacional/otros | `nuevamineria.com` | — | — | fuente:Nueva Minería |
| OCMAL (Observatorio de Conflictos Mineros de América Latina) | internacional/otros | `ocmal.org` | — | — | fuente:OCMAL (Observatorio de Conflictos Mineros de América Latina) |
| Organización para la Cooperación y el Desarrollo Económicos | internacional/otros | `oecd.org` | — | — | fuente:Organización para la Cooperación y el Desarrollo Económicos |
| Pixi Legal | internacional/otros | `pixilegal.com` | — | — | fuente:Pixi Legal |
| Instagram | internacional/otros | `pixnoy.com` | — | — | fuente:Instagram |
| Comisión Económica para América Latina y el Caribe (CEPAL) | internacional/otros | `repositorio.cepal.org` | — | — | fuente:Comisión Económica para América Latina y el Caribe (CEPAL) |
| Reuters | internacional/otros | `reutersconnect.com` | — | — | fuente:Reuters |
| Scribd | internacional/otros | `scribd.com` | — | — | fuente:Scribd |
| SeattlePI | internacional/otros | `seattlepi.com` | — | — | fuente:SeattlePI |
| Semana | internacional/otros | `semana.com` | — | — | fuente:Semana |
| Bolsa de Comercio de Santiago | internacional/otros | `servicioscms.bolsadesantiago.com` | — | — | fuente:Bolsa de Comercio de Santiago |
| The Hour | internacional/otros | `thehour.com` | — | — | fuente:The Hour |
| Tiempo de San Juan | internacional/otros | `tiempodesanjuan.com` | — | — | fuente:Tiempo de San Juan |
| Tramas y Redes (CLACSO) | internacional/otros | `tramasyredes-ojs.clacso.org` | — | — | fuente:Tramas y Redes (CLACSO) |
| Naciones Unidas | internacional/otros | `un.org` | — | — | fuente:Naciones Unidas |
| PNUD Chile | internacional/otros | `undp.org` | — | — | fuente:PNUD Chile |
| UPI | internacional/otros | `upi.com` | — | — | fuente:UPI |
| Vox Populi (Honduras) | internacional/otros | `voxpopulihn.com` | — | — | fuente:Vox Populi (Honduras) |
| Vozpopuli | internacional/otros | `vozpopuli.com` | — | — | fuente:Vozpopuli |
| CompaniesMarketCap | internacional/otros | `web.archive.org` | — | — | fuente:CompaniesMarketCap |
| Naciones Unidas | internacional/otros | `webtv.un.org` | — | — | fuente:Naciones Unidas |
| XTB Chile | internacional/otros | `xtb.com` | — | — | fuente:XTB Chile |
| Yahoo News | internacional/otros | `yahoo.com` | — | — | fuente:Yahoo News |

## 3. Texto listo para el issue / PR del repo

> NOTE: revisar antes de enviar — los nombres salen de `MEDIA` y del campo
> `medio:` de las fuentes, así que algunos no coinciden con el nombre editorial
> que usa el repo. Esta sección lista solo los de tipo `prensa`, que son los
> que el repo puede usar tal cual.

Estos 53 sitios tienen feed funcionando y no figuran en
`feeds-database.json` ni en `watchlist.json`:

- **Vallenar Digital** — https://vallenardigital.cl (`https://portalweb.vallenardigital.cl/feed/`), 25.789 artículos indexados
- **Somos Chile** — https://somoschile.cl (`https://www.somoschile.cl/feed/`), 17.544 artículos indexados
- **ANIP** — https://anip.cl (`https://anip.cl/feed/`), 70 artículos indexados
- **Aconcagua al Día** — https://aconcaguaaldia.cl (`https://aconcaguaaldia.cl/feed/`)
- **ADPrensa** — https://adprensa.cl (`https://adprensa.cl/feed/`)
- **AIM Chile** — https://aimchile.cl (`https://aimchile.cl/feed/`)
- **Alerta Prevencion (AGRICET)** — https://alertaprevencion.cl (`https://alertaprevencion.cl/feed/`)
- **Amnistía Internacional Chile** — https://amnistia.cl (`https://amnistia.cl/feed/`)
- **Archivo Andrés Aylwin** — https://archivoandresaylwin.cl (`https://www.archivoandresaylwin.cl/feed/`)
- **BioNoticias** — https://bionoticias.cl (`https://bionoticias.cl/feed/`)
- **Cadem** — https://cadem.cl (`https://cadem.cl/feed/`)
- **Centro de Extensión e Investigación Luis Emilio Recabarren** — https://ceiler.cl (`https://www.ceiler.cl/feed/`)
- **ConceAhora** — https://conceahora.cl (`https://www.conceahora.cl/feed/`)
- **Criteria** — https://criteria.cl (`https://www.criteria.cl/feed/`)
- **Doble Espacio (Revista de Periodismo de la Universidad de Chile)** — https://doble-espacio.uchile.cl (`https://doble-espacio.uchile.cl/feed/`)
- **El Carrerino** — https://elcarrerino.cl (`https://elcarrerino.cl/feed/`)
- **El Conquistador Concepción** — https://elconquistadorconcepcion.cl (`https://www.elconquistadorconcepcion.cl/feed/`)
- **Diario El Latino** — https://ellatino.cl (`https://ellatino.cl/feed/`)
- **El Orador Ilustrado** — https://eloradorilustrado.cl (`https://eloradorilustrado.cl/feed/`)
- **Federación de Trabajadores del Cobre (FTC)** — https://ftc.cl (`https://www.ftc.cl/feed/`)
- **Geógrafas Chile** — https://geografaschile.cl (`https://www.geografaschile.cl/feed/`)
- **Giro Visual** — https://girovisual.cl (`https://girovisual.cl/feed/`)
- **Universidad del Desarrollo (Ingeniería)** — https://ingenieria.udd.cl (`https://ingenieria.udd.cl/feed/`)
- **La Chispa Sur** — https://lachispasur.cl (`https://lachispasur.cl/rss.xml`)
- **Las Últimas Noticias (LUN)** — https://lunmas.cl (`https://lunmas.cl/feed/`)
- **MediaInfo** — https://mediainfo.cl (`https://mediainfo.cl/feed/`)
- **Memoria y Vida (Corporación Pilmaiquen)** — https://memoriayvida.cl (`https://memoriayvida.cl/feed/`)
- **Ministerio de Seguridad Pública** — https://minsegpublica.cl (`https://minsegpublica.cl/feed/`)
- **Movilh** — https://movilh.cl (`https://www.movilh.cl/feed/`)
- **Museo de la Solidaridad Salvador Allende** — https://mssa.cl (`https://www.mssa.cl/feed/`)
- **Municipalidad de Rinconada** — https://munirinconada.cl (`https://munirinconada.cl/feed/`)
- **Observatorio del Contexto Económico de la Universidad Diego Portales (OCEC-UDP)** — https://ocec.udp.cl (`https://ocec.udp.cl/feed/`)
- **Periódico de la Costa** — https://periodicodelacosta.cl (`https://periodicodelacosta.cl/feed/`)
- **Poder y Liderazgo** — https://poderyliderazgo.cl (`https://www.poderyliderazgo.cl/feed/`)
- **Portal Innova** — https://portalinnova.cl (`https://portalinnova.cl/feed/`)
- **Portal Puente Alto** — https://portalpuentealto.cl (`https://www.portalpuentealto.cl/feed/`)
- **Preludio Radio** — https://preludioradio.cl (`https://www.preludioradio.cl/feed/`)
- **Subsecretaría de Prevención del Delito** — https://prevenciondehomicidios.cl (`https://prevenciondehomicidios.cl/feed/`)
- **Quinta Visión Ahora** — https://quintavisionahora.cl (`https://www.quintavisionahora.cl/feed/`)
- **Radio Aconcagua** — https://radioaconcagua.cl (`https://radioaconcagua.cl/feed/`)
- **Radio Contigo** — https://radiocontigo.cl (`https://radiocontigo.cl/feed/`)
- **Radio FM+** — https://radiofmmas.cl (`https://radiofmmas.cl/feed/`)
- **Radio Galáctica** — https://radiogalactika.cl (`https://www.radiogalactika.cl/feed/`)
- **Radio Indómita** — https://radioindomita.cl (`https://radioindomita.cl/feed/`)
- **RDN** — https://rdn.cl (`https://rdn.cl/feed/`)
- **Revista de Frente** — https://revistadefrente.cl (`https://www.revistadefrente.cl/feed/`)
- **Revista Tierra Bella** — https://revistatierrabella.cl (`https://revistatierrabella.cl/feed/`)
- **El Diario de Salamanca** — https://salamancachile.cl (`https://salamancachile.cl/feed/`)
- **Municipalidad de San Bernardo** — https://sanbernardo.cl (`https://www.sanbernardo.cl/feed/`)
- **Servicio Electoral (Servel)** — https://servel.cl (`https://www.servel.cl/feed/`)
- **Tribunal de Defensa de la Libre Competencia** — https://tdlc.cl (`https://www.tdlc.cl/feed/`)
- **Municipalidad de Temuco** — https://temuco.cl (`https://www.temuco.cl/feed/`)
- **Tribunal Constitucional de Chile** — https://www1.tribunalconstitucional.cl (`https://www1.tribunalconstitucional.cl/feed/`)

Sugerencia de categoría según el cruce: revisar si encaja en `regional`,
`news`, `political-parties`, `community` o `business`.

Quedan 55 candidatos de tipo `institución` o
`internacional/otros` (55 verificados) listados en 2.1; no los incluyo
en el texto de arriba porque un repo de prensa chilena normalmente no los quiere.

## 4. Cómo reproducir

```bash
node .agents/skills/sitemaps/scripts/report-awesome.mjs --verificar
node .agents/skills/sitemaps/scripts/report-awesome.mjs --verificar --min-articulos 0
node .agents/skills/sitemaps/scripts/report-awesome.mjs --fuente <dir-del-clon> --verificar
node .agents/skills/sitemaps/scripts/report-awesome.mjs --include-nochilenos   # sin el filtro de prensa chilena
```

Solo lectura: no escribe en el vault ni en el repo del otro proyecto.
