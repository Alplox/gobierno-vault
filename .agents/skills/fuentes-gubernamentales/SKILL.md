---
name: fuentes-gubernamentales
description: Fuentes gubernamentales directas antes que prensa reinterpretada (Presidencia, ministerios, servicios, BCN/LeyChile, Cámara/Senado, INE/CPLT). Usa esta skill SIEMPRE al investigar eventos del Estado, buscar cifras oficiales, votaciones, normativa, remuneraciones o reducir sesgo, incluso si solo dice 'buscar fuente oficial' o 'verificar cifra'.
---

# Fuentes gubernamentales — fuente directa antes que prensa

> Cuándo cargar: vas a investigar un evento que involucra al Estado, necesitas cifras, votaciones, normativa, remuneraciones, transparencia o quieres reducir sesgo con fuente primaria antes que reinterpretación de prensa.
> **Handoff:** si descubres una nueva fuente oficial, cambia una URL, agregas un ministerio/servicio o calibras el uso (WAF, paywall, caída), actualiza este skill en la misma sesión.

> **Principio anti-sesgo:** **fuente directa primero**. El vault prioriza el dato en su fuente generadora (Presidencia, ministerio, BCN/LeyChile, Cámara/Senado, servicio, INE, CPLT, SAI) y deja la prensa como segunda fuente que confirma, contextualiza o aporta reacciones. Esto reduce el sesgo de reinterpretación y hace los eventos verificables contra el registro oficial. Ver `event-rules.md:10` y `content-model.md` (votaciones, cifras).

## Cómo usar esta skill (flujo para agentes)

1. **Identifica el dominio** del evento (Presidencia, ministerio sectorial, servicio, legislativo, remuneraciones, normativa). Ubica la fila en las tablas de abajo.
2. **Intenta la fuente oficial primero** con `read_url` o `defuddle`/`pnpm run fetch-content` (ver `tools.md`). Si falla por WAF/JS (ej. `camara.cl` 403, `consultatransparencia.cl` caído), usa el mirror o la alternativa documentada en la fila.
3. **Cita la URL oficial como fuente primaria** en `src/content/sources/*.md` con `medio:` exacto (ej. `Presidencia de la República`, `Biblioteca del Congreso`, `Senado de Chile`, `Cámara de Diputados`, `Ministerio de Salud`). Agrega la prensa como fuente secundaria (mínimo 5 fuentes totales, nunca red social sola).
4. **Si la fuente oficial está caída o no tiene sitemap**, no la agregues al catálogo `sitemaps/` — es `fetch-on-demand` (ver `sitemaps.md` → “Sitios institucionales SIN sitemap”).
5. **Para votaciones** (`tipo: votacion`) siempre cita la URL nominal concreta de Cámara/Senado además de prensa (ver “Poder Legislativo” abajo y `content-model.md`).

Si la fuente directa contradice la prensa, documenta la desincronización con párrafo + tabla (ver `content-model.md` → Cifras en disputa) y deja lo no conciliado en `TAREAS/` con `Origen:`.

## Presidencia

| Institución | URL | Notas |
| --- | --- | --- |
| Presidencia de la República (Prensa) | <https://prensa.presidencia.cl> | Comunicados — validado 2026-08-27: `fetch` falla desde esta red (transport error); probar `fetch-impersonate` o `<https://www.gob.cl/noticias/>` como fallback |
| Gobierno de Chile (Noticias) | <https://www.gob.cl/noticias/> | Noticias del Ejecutivo — OK 2026-08-27 |
| Sec. Gral. de la Presidencia (Segpres) | <https://www.minsegpres.gob.cl/noticias/> | OK 2026-08-27 |
| Sec. Gral. de Gobierno (Segegob) | <https://www.msgg.gob.cl/noticias/> | Validado 2026-08-27: `fetch` falla desde esta red; probar `fetch-impersonate` |
| Prensa Presidencia Comunicados | <https://prensa.presidencia.cl/comunicados.aspx> | Listado histórico — mismo `fetch` que arriba |

## Ministerios — Economía y Hacienda

| Institución | URL |
| --- | --- |
| Ministerio de Hacienda | <https://www.hacienda.cl/noticias-y-eventos/noticias> |
| Ministerio de Economía, Fomento y Turismo | <https://www.economia.gob.cl/category/noticias> |
| Ministerio de Minería | <https://www.minmineria.gob.cl/> | Noticias en `?cat-noticias=noticias` (validado 2026-08-27; dominio `.cl` obsoleto) |
| Ministerio de Energía | <https://energia.gob.cl/noticias> |

## Ministerios — Interior y Seguridad

| Institución | URL |
| --- | --- |
| Ministerio del Interior | <https://www.interior.gob.cl/noticias/> |
| Ministerio de Justicia y Derechos Humanos | <https://www.minjusticia.gob.cl/category/noticias/> |

## Ministerios — Social y Salud

| Institución | URL |
| --- | --- |
| Ministerio de Salud | <https://www.minsal.cl/category/noticias/> |
| Ministerio del Trabajo y Previsión Social | <https://www.mintrab.gob.cl/category/noticias/> |
| Ministerio de Desarrollo Social y Familia | <https://www.desarrollosocialyfamilia.gob.cl/noticias> |
| Ministerio de la Mujer y la Equidad de Género | <https://minmujeryeg.gob.cl/?cat=noticias> |
| Ministerio de Educación | <https://www.mineduc.cl/noticias/> |
| Ministerio de las Culturas, las Artes y el Patrimonio | <https://www.cultura.gob.cl/noticias/> |
| Ministerio del Deporte | <https://www.mindep.cl/noticias> |

## Ministerios — Infraestructura y Territorio

| Institución | URL |
| --- | --- |
| Ministerio de Obras Públicas | <https://www.mop.gob.cl/noticias/> (`/prensa/` da 404) |
| Ministerio de Vivienda y Urbanismo | <https://www.minvu.gob.cl/noticias/> |
| Ministerio de Transportes y Telecomunicaciones | <https://www.mtt.gob.cl/noticias> |
| Ministerio de Bienes Nacionales | <https://www.bienesnacionales.cl/noticias/> |

## Ministerios — Otros

| Institución | URL |
| --- | --- |
| Ministerio de Relaciones Exteriores | <https://www.minrel.gob.cl/noticias> |
| Ministerio de Agricultura | <https://www.minagri.gob.cl/noticias/> |
| Ministerio del Medio Ambiente | <https://mma.gob.cl/noticias/> |
| Ministerio de Ciencia, Tecnología, Conocimiento e Innovación | <https://www.minciencia.gob.cl/noticias/> |

## Servicios Públicos

| Institución | URL | Notas |
| --- | --- | --- |
| SENAPRED | <https://www.senapred.cl/noticias/> | Prevención y Respuesta ante Desastres |
| Servicio Nacional de Migraciones (SERMIG) | <https://serviciomigraciones.cl/> | Portal oficial; el Balance Migratorio 2026 se consulta en <https://datastudio.google.com/reporting/c45a1db4-25a1-4afb-9a56-d19425f8a6d5/page/EiD0F> y actualiza mensualmente expulsiones, salidas, reconducciones e ingresos por pasos no habilitados |
| Unidad de Análisis Financiero (UAF) | <https://www.uaf.cl/es-cl/> | Portal oficial; las notas se consultan en `noticia-detalle?id=<n>`. Fuente primaria para cifras de alertas, carga y propuestas de la UAF ante comisionesParlamentarias |
| SII | <https://www.sii.cl/noticias/> | Servicio de Impuestos Internos |
| SERNAC | <https://www.sernac.cl/> | Portal principal (validado 2026-08-27: `/portal/noticias/` → 404) |
| Tesorería General de la República | <https://www.tgr.cl/noticias/> | Redirige a `tgr.gob.cl` |
| Servicio Nacional de Aduanas | <https://www.aduana.cl/> | Portal principal (validado 2026-08-27: `/noticias/aduana/site/...` → 404) |
| Comisión Nacional de Energía (CNE) | <https://www.cne.cl/noticias/> | Redirige a `/nuestros-servicios/.../noticias/` |
| Instituto de Salud Pública (ISP) | <https://www.ispch.cl/> | Portal principal (validado 2026-08-27: `/noticias/` no responde desde esta red; verificar con `fetch-impersonate`) |
| Servicio Agrícola y Ganadero (SAG) | <https://www.sag.gob.cl/noticias> | |
| U. de Chile — Revalidación de títulos extranjeros | <https://revalidaciones.uchile.cl/> | Sitio de consulta de títulos revalidados (excluye países con tratado, cuyo registro lleva Minrel). Búsqueda por nombres/paterno/materno contra `GET /api/revalidaciones/revalidados`; 204 = sin resultados. Verificado sep-2026 (caso Rubio: tres combinaciones sin resultados). Solo referencial, no sustituye certificados oficiales |

## Combustibles y energía — ENAP, CNE y normativa

| Institución | URL | Notas |
| --- | --- | --- |
| ENAP — Informe semanal de precios de combustibles | Índice vigente <https://www.enap.cl/informacion-comercial/informe-semanal-de-precios> · histórico <https://www.enap.cl/informe-semanal-de-precios> | **Fuente primaria de toda variación de combustibles.** Se publica **todos los miércoles** y cubre la semana siguiente (jueves a miércoles). Cada informe es un PDF de 1 página en `https://www.enap.cl/files/get/<id>`, firmado "Santiago, <fecha>" al pie, con la variación estimada por litro de gasolina 93/97, diésel, kerosene y GLP vehicular, y el aviso de que ENAP no fija el precio final. El histórico ordena los PDFs por rótulo ("INFORME DE PRECIOS ESTIMADOS PARA COMBUSTIBLES-<DD> AL <DD> DE <MES> DE <AÑO>"), así que el del día se localiza por el rango de fechas y no por fecha de subida. `fetch-content` cae en `archive.ph` con "No results" en estas páginas de índice (soft-404 que la escalera no siempre detecta): leer el índice con `Invoke-WebRequest` + regex `href="(https://www\.enap\.cl/files/get/\d+)"` y luego `pnpm run pdf-extract -- <URL del PDF>` |
| ENAP — capacidad de refinación | <https://www.enap.cl/nuestras-operaciones/refinacion-y-comercializacion-rc/enap-refinerias/bio-bio> | Fichas por refinería (capacidad de destilación, dotación); sin fecha de publicación, la fecha de la fuente es la de consulta |
| CNE — informes y estudios | <https://www.cne.cl/noticias/> | Además del Reporte Mensual del Sector Energético, la CNE publica estudios en `cne.cl/wp-content/uploads/<AAAA>/<MM>/<archivo>.pdf` (p. ej. el informe de combustibles carbono neutral elaborado por DEUMAN, subido en marzo de 2026 y de 204 páginas). Son la fuente primaria para el marco regulatorio de biocombustibles y mezclas: su sección 6.4 analiza bioetanol y su capítulo de normativa cita el D.S. N°11/2008, que limita la mezcla con gasolina a 2% o 5% |
| LeyChile vía MCP `leychile` → URL oficial | `https://www.bcn.cl/leychile/navegar?idNorma=<idNorma>` | El `idNorma` que devuelve el MCP es **el mismo** de BCN/LeyChile, así que la URL oficial se compone sin buscar: `search_laws` para localizar, `get_article`/`get_modifications`/`list_versions` para leer articulado, vigencia y cadena de modificaciones, y `https://www.bcn.cl/leychile/navegar?idNorma=<idNorma>` como `url` de la fuente con `medio: Biblioteca del Congreso Nacional (LeyChile)`. Citar el articulado literal (ej. D.S. N°11/2008 art. 11 sobre mezcla de bioetanol) permite contrastar lo que afirma la prensa sin tener que abrir bcn.cl |

## Mercado de capitales

| Institución | URL | Uso |
| --- | --- | --- |
| Bolsa de Comercio de Santiago — Estadísticas Anuales | <https://servicioscms.bolsadesantiago.com/Sintesis%20y%20Estadisticas/Estad%C3%ADsticas%20Anuales%202006.pdf> | PDF oficial histórico; la página de ranking separa capitalización bursátil, montos transados y rentabilidad. Para años recientes el nombre/acento del archivo cambia (por ejemplo, `Sintesis%20y%20Estadistica%20Anual%202025.pdf`); localizar el PDF y citar la URL exacta, con `medio: Bolsa de Comercio de Santiago` en la lista blanca. |

## Compras públicas — licitaciones y órdenes de compra

| Institución | URL | Uso |
| --- | --- | --- |
| Mercado Público — ficha de licitación | <https://www.mercadopublico.cl/Procurement/Modules/RFB/DetailsAcquisition.aspx?idlicitacion=NNNNNN-N-LE26> | Bases, cronograma, estimado y descripción oficial; fetch-legible (verificado sep-2026). Citar como fuente `tipo: documento`, `medio: Mercado Público (ChileCompra)` (ya en `WHITELIST_MEDIOS`) |
| TodoLicitaciones (espejo) | <https://www.todolicitaciones.cl/licitacion/NNNNNN-N-LE26/slug> | Adjudicatario y monto adjudicado cuando la ficha oficial no los renderiza; agregador sin reportería, solo como espejo con `medio: TodoLicitaciones` (ya en whitelist) y org `tipo: medio_comunicacion` con nota de espejo |

## Poder Legislativo — Historia política, normativa y votaciones

| Institución | URL | Uso |
| --- | --- | --- |
| BCN — LeyChile (normas) | <https://www.bcn.cl/leychile> | Texto vigente de leyes, historia de la ley |
| BCN — Historia Política | <https://www.bcn.cl/historiapolitica> | Biografías oficiales 1823–presente (presidentes, ministros, parlamentarios, gobernadores, constituyentes) |
| Cámara — Sesiones | <https://www.camara.cl/legislacion/sesiones/> | |
| Cámara — Votaciones (sesión) | <https://www.camara.cl/legislacion/sala_sesiones/votaciones.aspx> | Detalle nominal por votación (a favor/en contra/abstención) |
| Cámara — Votaciones por proyecto | <https://www.camara.cl/legislacion/ProyectosDeLey/votaciones.aspx?prmBOLETIN=18216-05&prmID=18872> | Todas las votaciones de un boletín |
| Senado — Tramitación | <https://www.senado.cl/tramitacion-de-proyectos> | |
| Senado — Votaciones en Sala | <https://www.senado.cl/actividad-legislativa/sala/votaciones> | |

**Cámara (votaciones):** el listado por sesión permite ver el detalle nominal de cada votación; el listado por proyecto rastrea un boletín `NNNNN-NN` a lo largo de su tramitación. Para `tipo: votacion` cita la URL concreta como fuente oficial (`medio: Cámara de Diputados` / `Senado de Chile`) además de prensa y registra conteos como `[[cifras/...]]` (ej. vetos megarreforma `20260810-10`).

**BCN — Historia Política:** base de datos gubernamental, no prensa. Usar como hecho primario y citar `medio: Biblioteca del Congreso`. Es la fuente para verificar `cargos[]` históricos (gabinetes, `TAREAS/GABINETES-VERIFICACION.md`) y biografías.

## Remuneraciones del Presidente y transparencia

Referencia para sueldos de autoridades, reajuste legal y actualización IPC.

| Institución | URL | Notas |
| --- | --- | --- |
| Presidencia — TA vigente (PortalPDdT) | <https://www.portaltransparencia.cl/PortalPdT/pdtta?codOrganismo=AA001> | Dato vivo: Personal y remuneraciones (Planta, Contrata, Honorarios, Escala), Adquisiciones, Info Presupuestaria. Detalle por JSF — fetch trae categorías, tablas requieren navegador |
| Presidencia — Transparencia histórica | <https://transparenciaactiva.presidencia.cl/> | Congelado al 12/10/2018 (solo Boric I hacia atrás); el index deriva al PortalPdT. Causa del fallo `fetch`: cadena TLS incompleta (curl_cffi: unable to get local issuer); `fetch-impersonate` también falla — solo `NODE_TLS_REJECT_UNAUTHORIZED=0` para diagnóstico |
| Presidencia — Dotación de Planta 2014 | <https://transparenciaactiva.presidencia.cl/2014/per_planta.html> | Mismo `fetch` que arriba |
| Presidencia — Dotación de Planta 2018 | <https://transparenciaactiva.presidencia.cl/2018/per_planta.html> | Mismo |
| Presidencia — Remuneraciones 2018 | <https://transparenciaactiva.presidencia.cl/2018/per_remuneraciones.html> | Mismo |
| Senado — Informe de Transparencia | <https://tramitacion.senado.cl/appsenado/index.php?ac=informeTransparencia&anno=2023&mesid=0&mo=transparencia&tipo=10> | |
| CFR — Registro Público (Comisión 38 bis) | <https://comision38bis.gob.cl/registro-publico> | La consulta por mes usa `?mes=YYYY-MM` (por ejemplo, <https://comision38bis.gob.cl/registro-publico?mes=2026-07>); el registro declara que los montos son reportados por cada institución |
| BCN — Ley 21.830 | <https://www.bcn.cl/leychile/navegar?idNorma=1225354> | Texto oficial; fija $553.553 (18–65), $412.938 (menores de 18/mayores de 65) y $356.815 (no remuneracionales) desde mayo de 2026 |
| INE — BDE IPC serie empalmada | <https://si3.bcentral.cl/Siete/ES/Siete/Cuadro/CAP_PRECIOS/MN_CAP_PRECIOS/IPC_EMP_2023/638415285164039007> | Serie base diciembre de 2023=100; para agosto de 2026 muestra 113,15 |
| Observatorio Social — CBA y líneas | <https://observatorio.ministeriodesarrollosocial.gob.cl/nueva-serie-cba-2026> | Informes mensuales; para agosto de 2026, CBA $92.327 y líneas por persona equivalente según condición de arrendatario |
| Observatorio Social — CASEN ingresos | <https://observatorio.ministeriodesarrollosocial.gob.cl/storage/docs/casen/2024/Resultados_ingresos_Casen_2024.pdf> | Ingresos monetarios de hogar y per cápita; no mezclar con remuneración individual |
| INE — ESI 2025 | <https://www.ine.gob.cl/sala-de-prensa/prensa/general/noticia/2026/07/14/la-mitad-de-las-personas-ocupadas-en-chile-percibieron-ingresos-menores-o-iguales-a-$680.000-en-2025> | Ingreso laboral neto por persona ocupada; no confundir con ingreso de hogar |
| INE — Calculadora IPC | <https://calculadoraipc.ine.gob.cl/> | |
| INE — Manual IPC (PDF) | <https://www.ine.gob.cl/docs/default-source/%C3%ADndice-de-precios-al-consumidor/metodologias/base-anual-2018-100/metodolog%C3%ADa.pdf> | PDF metodología |

## Verificación de montos de autoridades (régimen 38 bis)

Cadena: Resolución N°5/2024 → adecuación IPC **+7,8%** (Oficio N°26/2025 Anexo 1) → registro mensual (parlamentarios/SEREMIs cuadran; Presidente/ministros/subsecretarios/gobernadores reportan ~$220–285 mil extra sin desglose público).

| Fuente | URL | Uso para verificar montos |
| --- | --- | --- |
| CFR — Registro Público (bulk) | <https://comision38bis.gob.cl/registro-publico> (descargas al final) | Serie mensual completa: comparar contra Anexo 1 ×1,078 |
| CFR — Actas de sesiones | <https://comision38bis.gob.cl/actas-de-sesiones> | Criterio de “renta bruta única y total”, cálculo IPC |
| CPLT — Jurisprudencia (amparos) | <https://jurisprudencia.cplt.cl/> | Amparos sobre remuneraciones (reemplaza dictámenes CGR — contralor.cl es stub) |
| Plataforma SAI (Ley 20.285) | <https://www.consejotransparencia.cl/solicitud-informacionpublica/> | Pedir desglose a Presidencia/CFR/DIPRES (vía decisiva; `consultatransparencia.cl` caído) |
| Portales de transparencia estatal | <https://tp.cplt.cl/> · <https://www.infotransparencia.cl/> | Agregadores por organismo |
| Transparencia activa por servicio | dominio `transparencia` de cada servicio (ej. SII, SAG, Junaeb, SEA, DT) | Planillas propias → validan ministros/subsecretarios/jefes de servicio |
| GOREs — transparencia regional | sitio de cada GORE | Remuneración gobernador/a (dispersión por zona extrema) |
| Cámara — Transparencia activa | <https://www.camara.cl/transparencia/transparencia_activa.aspx> | Dietas + asignaciones (WAF 403 a curl; verificar en menú) |
| Empresas estatales — memorias | BancoEstado, TVN, CNTV, Banco Central | Únicos sobre Presidente ($16–17M): honorarios de directorio |
| Prensa/fact-checking locales | catálogo `sitemaps/` (`grep -ih '11\.308\|9\.371\|17\.370' sitemaps/<medio>/*.jsonl`) | Cobertura mensual del registro |

Prioridad exceso: (1) SAI, (2) jurisprudencia CPLT, (3) actas CFR. Declaraciones de patrimonio sin portal verificado (`declaraciondeactivos.cl` caído).

## Referencias de investigación (no prensa)

| Herramienta | URL | Uso |
| --- | --- | --- |
| GDELT Project | <https://www.gdeltproject.org/> | Base global de eventos (100+ idiomas, cada 15 min), API abierta para cruzar contexto internacional |
| Meganoticias — Hemeroteca | <https://www.meganoticias.cl/hemeroteca/> | Archivo por año/trimestre/día (2026+); útil cuando sitemap no entrega URL |
| ley-chile (repo + MCP) | <https://github.com/pisanvs/ley-chile> | DB leyes chilenas + MCP `<https://leyes.pisanvs.cl/api/mcp>` (8 tools: search_laws, get_law, get_article, …) — NO es fuente oficial, citar siempre `BCN/LeyChile` |
| Embajada de Estados Unidos en Chile | <https://cl.usembassy.gov/> | Comunicados y textos primarios de la misión estadounidense en Chile; útil para contrastar documentos de seguridad y cooperación con la posición de Cancillería |
| WIPO — Global Innovation Index | <https://www.wipo.int/gii-ranking/en/chile> | Perfil oficial de innovación de Chile; reporta ranking general, insumos y resultados, con advertencias metodológicas del GII |
| ONU DESA — Comité Negociador (Convención Marco de Cooperación Fiscal Internacional) | <https://financing.desa.un.org/unfcitc> | Fuente primaria del proceso multilateral. El `fetch` directo devuelve solo navegación: leer con `r.jina.ai` (trae "Key Dates" y los "Latest Updates" con los PDF de cada sesión). Los borradores de los co-presidentes se citan como `tipo: documento` con `medio: Naciones Unidas` y fecha propia del documento, p. ej. `A/AC.298/CRP.32` del 21-jul-2026 (Zero Draft de la Convención), que se lee con `pnpm run pdf-extract` sobre el `.pdf` en `sites/default/files/AAAA-MM/`. Contiene el articulado citado en los eventos del vault sobre soberanía fiscal |
| OCDE — estudios económicos de Chile | <https://www.oecd.org/en/countries/chile.html> | Informes oficiales sobre productividad, I+D, innovación digital y proyecciones; preferir la página del informe o capítulo concreto |

- **GDELT:** no es prensa ni gubernamental; útil para validar escala/contexto internacional antes de fijar expectativa en `TAREAS.md`. No reemplaza fuente primaria.
- **Hemeroteca Meganoticias:** catálogo ya indexa sitemap (desde 2011); hemeroteca es interfaz por fecha para hallar URL exacta.
- **ley-chile MCP:** útil para consultas programáticas (texto vigente, historia, diff). Si `search_laws` falla (Meilisearch caído), usar acceso directo por `idNorma` o `leychile.cl` web. Citar siempre BCN.

## Estado de validación (última revisión: 2026-08-27)

Validado con `node scripts/validate/validate-fuentes.mjs` (60 URLs, timeout 12s, UA Mozilla, `fetch` Node + `webfetch` cruzado):

- **OK 46** — `gob.cl`, `hacienda.cl`, `economia.gob.cl`, `energia.gob.cl`, `interior.gob.cl`, `minjusticia.gob.cl`, `minsal.cl`, `mintrab.gob.cl`, `desarrollosocialyfamilia.gob.cl`, `minmujeryeg.gob.cl`, `mineduc.cl`, `cultura.gob.cl`, `mindep.cl`, `mop.gob.cl/noticias/`, `minvu.gob.cl`, `mtt.gob.cl`, `bienesnacionales.cl`, `minrel.gob.cl`, `minagri.gob.cl`, `mma.gob.cl`, `minciencia.gob.cl`, `senapred.cl`, `sii.cl`, `sernac.cl/`, `tgr.cl`, `aduana.cl/`, `cne.cl`, `sag.gob.cl`, `bcn.cl/*`, `senado.cl/*`, `portaltransparencia.cl/`, `comision38bis.gob.cl/*`, `calculadoraipc.ine.gob.cl`, `ine.gob.cl/.../metodología.pdf`, `jurisprudencia.cplt.cl`, `consejotransparencia.cl/*`, `tp.cplt.cl`, `infotransparencia.cl`, `gdeltproject.org`, `meganoticias.cl/hemeroteca`, `github.com/pisanvs/ley-chile`.
- **WAF 403 esperado 4** — `camara.cl/*` (sesiones, votaciones, transparencia) bloquea `fetch` Node/curl; usar `fetch-impersonate` o verificar en menú (documentado).
- **Reemplazos 3** — `mop.gob.cl/prensa/` → `noticias/`, `sernac.cl/portal/noticias/` → `sernac.cl/`, `aduana.cl/.../taxport_1___1.html` → `aduana.cl/` (arriba). `leyes.pisanvs.cl/api/mcp` da 404 por `fetch` GET — es endpoint MCP, no página; usar tool MCP (no es fallo).
- **Errores de red 9** — `prensa.presidencia.cl*`, `msgg.gob.cl`, `minmineria.gob.cl` (webfetch OK, `fetch` Node falla — usar `fetch-impersonate`), `ispch.cl`, `transparenciaactiva.presidencia.cl*` (4) — no responden a `fetch` Node desde esta red; pueden requerir `fetch-impersonate` o red chilena. Se mantienen con nota y fallback (`gob.cl`, `portaltransparencia.cl`).

Para re-validar: `node scripts/validate/validate-fuentes.mjs` (repite el chequeo; actualiza notas y handoff si cambias URLs).
