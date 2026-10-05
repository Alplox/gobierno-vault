# Gabinetes ministeriales — Verificación de fechas y cargos (1938–2026)

> Archivo de seguimiento para sesiones futuras: cruzar y validar las fechas y cargos
> registrados en `src/content/people/*.md` (`cargos[]` en el frontmatter de cada persona)
> contra eventos del vault y fuentes externas
> (sitios oficiales y prensa). Cubre Aguirre Cerda (1938) en adelante; Ríos (1942-46)
> pendiente por formato de fuente.
> **Última verificación integral:** 05-oct-2026 — `pnpm run verify-gabinete`:
> **905/1025 exactos (88%)** + **67 nombramientos
> Ríos** contra su anexo compacto (64 aporta-fecha, 3 de cola 1946 que el anexo
> no trae); discrepancias restantes son filas incompletas del anexo
> o casos resueltos y documentados abajo.

## Cómo re-verificar en una sesión futura

1. Extraer todos los `cargos[]` ministeriales fechados de `src/content/people/*.md`
   (un `.md` por persona; el frontmatter se parsea con `^---\r?\n([\s\S]*?)\r?\n---` —
   ver `loadPeopleFromMarkdown()` en `scripts/validate/verify-gabinete.mjs`; el corpus es
   LF/CRLF mixto). Filtro de cargo: regex `/^(ministr[oa]|biministr[oa]?)\b/i`, excluyendo
   `/corte|.../` — ver `EXCLUDE_RE` en `src/lib/cabinet.ts`.
2. Comparar contra:
   - **Fuente secundaria completa**: anexos de gabinetes de Wikipedia es.wikipedia.org
     (`Anexo:Gabinetes ministeriales de los gobiernos de la Concertación`, `...del primer
     gobierno de Sebastián Piñera`, `...del segundo gobierno de Michelle Bachelet`,
     `...del segundo gobierno de Sebastián Piñera`, `...del gobierno de Gabriel Boric`,
     y `Ministro de Estado de Chile` para el gabinete vigente). Descargar wikitexto con
     `curl "<https://es.wikipedia.org/w/index.php?title=<PAGINA>&action=raw>"` y parsear
     tablas `! Ministerio !! Nombre`.
   - **Fuentes oficiales por cartera** (preferentes para fechas):
     - Salud: <https://www.minsal.cl/historial-de-ministros-de-salud/> (tabla completa 1990–hoy)
     - Hacienda: <https://biblio.hacienda.cl/200-anos-del-ministerio-de-hacienda-de-la-republica-de-chile/ministros-de-hacienda-desde-1814-2014>
     - BCN reseñas: <https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/<Nombre_Person>a>
     - Comunicados: <https://www.gob.cl/noticias/> y prensa.presidencia.cl
     - Archivo audiovisual Lagos/Bachelet: <https://arle.udp.cl> (fechas de juramento)
3. Tras cualquier cambio en `cargos[]`: `pnpm run build` y revisar el panel del gobierno
   en `dist/gabinete/index.html` (`<section data-gv-gob-panel="<id>">`).
4. Al registrar un cambio nuevo de gabinete: crear evento primero, cerrar con `hasta` el
   día de cesación y abrir entrada nueva con `desde` el día de juramento/asunción, y
   actualizar este archivo.

## Convención de fechas

- `desde` = día de juramento/asunción (no del anuncio). Si solo se conoce el anuncio,
  marcar la fila 🟡.
- `hasta` = día de cesación (juramento del reemplazante, renuncia aceptada, destitución
  o fin de gobierno).
- Casos especiales documentados: subrogancias NO abren entrada propia; cambios de nombre
  de ministerio (ej. Economía "y Reconstrucción" → "y Turismo" en feb-2010) sí dividen la
  entrada; ministerios creados a mitad de gobierno (Medio Ambiente oct-2010, Deporte
  nov-2013, Mujer jun-2016, Ciencia dic-2018, Seguridad Pública abr-2025) empiezan en su
  fecha de creación efectiva.

## Estado de verificación por gobierno

Resumen: 1025 nombramientos fechados en el vault (1938-2026), 905 coincidencia exacta con
los anexos de Wikipedia (`pnpm run verify-gabinete`, parser v6 con conciencia de
cartera y soporte Ríos compacto); el resto va a buckets informativos (misma cartera
con fecha distinta, anexo sin fila para la cartera, anexo sin fechas —incluidos los
64 aporta-fecha de Ríos, cuyo anexo solo da años—) o a solo-vault/wiki ya triageados
abajo. El detalle
de **de dónde se obtuvo y con qué se verificó cada gobierno** está en las subsecciones
siguientes.

### Gobiernos 1938-1973 — importados 20-ago-2026 (sesión 4)

Importados desde sus anexos de Wikipedia (fuente secundaria) con el mismo pipeline que
Pinochet: **273 personas nuevas** + cargos agregados a 19 fichas existentes. Paneles en
`/gabinete`: aguirre_cerda (40 nombramientos), gonzalez_videla (65), ibanez2 (91),
alessandri_jorge (41), frei_mtva (24), allende (70).

| Gobierno | Anexo fuente | Filas importadas | Notas |
| --- | --- | --- | --- |
| Aguirre Cerda (1938-41) | [Anexo](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Pedro_Aguirre_Cerda>) | 43 | Incluye carteras extintas: Fomento, Comercio y Abastecimiento, Salubridad |
| González Videla (1946-52) | [Anexo](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Gabriel_Gonz%C3%A1lez_Videla>) | 73 | 9 filas sin fecha exacta omitidas |
| Ibáñez 2.º (1952-58) | [Anexo](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_segundo_gobierno_de_Carlos_Ib%C3%A1%C3%B1ez_del_Campo>) | 106 | Interior 1952-58 completado el 04-oct-2026 (16/16 con fecha, ver tanda 3) |
| Jorge Alessandri (1958-64) | [Anexo](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Jorge_Alessandri>) | 49 | |
| Frei Montalva (1964-70) | [Anexo](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Eduardo_Frei_Montalva>) | 28 | 8 filas sin fecha omitidas; incluye creación de Vivienda (1965) |
| Allende (1970-73) | [Anexo](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Salvador_Allende>) | 73 | |

- **Verificación oficial**: 🟡 pendiente muestreo BCN (mismo método que Pinochet).
- **Homónimos resueltos**: los importados "Mario Astorga" y "Sótero del Río" se
  renombraron a nombre completo ("Mario Astorga Fernández", "Sótero del Río Gutiérrez")
  para no colisionar con menciones homónimas en eventos (imputado DN Medcorp 2026;
  Hospital Sótero del Río).
- **Fuera de alcance**: Ríos (1942-46) — su anexo usa formato compacto (solo años, varios
  ministros por celda) que requiere parser propio; gobiernos anteriores a 1938.

### Pinochet (1973-1990) — importado 20-ago-2026

- **Obtención** (única fuente masiva por ahora): [Anexo:Gabinetes ministeriales de la dictadura militar chilena](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_de_la_dictadura_militar_chilena>) — 157 filas parseadas → **131 personas nuevas** en `src/content/people/*.md`.
- **Verificación oficial (muestreo 20-ago-2026)**: 3 ministros / 6 cargos contra BCN y fuentes biográficas:
  - [BCN Sergio Fernández Fernández](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/Sergio_Fern%C3%A1ndez_Fern%C3%A1ndez>): Trabajo 8-mar-1976→1-ene-1978 ✅ e Interior 14-abr-1978→22-abr-1982 ✅ exactos; su 2.º Interior figura como designado 7-jul-1987 (texto BCN) pero asumido 11-jul-1987 (tabla BCN) — el import usa 8-jul-1987, fecha uniforme del remix en el anexo para los 14 ministros de ese cambio; se deja así y queda anotado.
  - Mónica Madariaga ([Wikipedia](<https://es.wikipedia.org/wiki/M%C3%B3nica_Madariaga>), [revista RLD UAI](<https://lals.uai.cl/index.php/rld/article/view/139/231>)): Justicia 20-abr-1977→14-feb-1983 ✅ y Educación Pública 14-feb-1983→18-oct-1983 ✅ exactos.
  - [BCN Sergio Onofre Jarpa](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/Sergio_Onofre_Jarpa_Reyes>): Interior 10-ago-1983→12-feb-1985 ✅ exacto.
  - Resultado del muestreo: **5/6 cargos exactos**, 1 ambigüedad de fuente documentada.
- Panel `/gabinete`: 137 nombramientos visibles (115 personas, carteras mapeables a ministerios actuales).
- **Cierres**: los 7 titulares sin fecha de término se cerraron en `1990-03-11` (fin del gobierno).
- **Carteras históricas mapeadas** en `cabinet.ts` (`KEYWORD_MINISTERIO`): Guerra/Marina/Aviación → Defensa Nacional; Salud Pública → Salud. Educación Pública y Obras Públicas y Transportes matchean keywords existentes.
- **Carteras sin equivalente actual** (registradas en `cargos[]` pero sin panel): Tierras y Colonización, Coordinación Económica y Desarrollo, Oficina de Planificación (ODEPLAN), Jefatura de Estado Mayor Presidencial.
- **Fuera de alcance por ahora**: gobiernos anteriores a 1973 (anexos wiki disponibles para Frei Montalva, Allende, Jorge Alessandri, Ibáñez, González Videla, Ríos, Aguirre Cerda, etc. — mismo método de importación aplica).

### Aylwin (1990-1994) — 24 nombramientos, 24 exactos ✅

- **Cruce masivo**: [Anexo:Gabinetes ministeriales de los gobiernos de la Concertación](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_de_los_gobiernos_de_la_Concertaci%C3%B3n>) (sección Aylwin).
- **Oficial**: [Minsal — Historial de Ministros de Salud](<https://www.minsal.cl/historial-de-ministros-de-salud/>) (Jiménez hasta 30-oct-1992; Montt desde 2-nov-1992); [BCN reseña Julio Montt](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/Julio_Felipe_Montt_Momberg>) (Decreto 1341); [BCN reseña Jaime Tohá](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/Jaime_Manuel_Toh%C3%A1_Gonz%C3%A1lez>) (Economía desde 16-dic-1993).
- **Prensa**: [FastCheck 3-ago-2026 sobre cambios de Aylwin](<https://www.fastcheck.cl/2026/08/03/patricio-aylwin-si-realizo-cambios-de-gabinete-contrario-a-lo-afirmado-por-rodolfo-carter/>).

### Frei Ruiz-Tagle (1994-2000) — 48 nombramientos, 48 exactos ✅

- **Cruce masivo**: anexo Concertación (sección Frei).
- **Oficial/prensa para discrepancias**: muerte de Teplizky el 3-ago-1997 ([Wikipedia Teplizky](<https://es.wikipedia.org/wiki/Benjam%C3%ADn_Teplizky>), [Wikipedia Sergio Jiménez Moraga](<https://es.wikipedia.org/wiki/Sergio_Jim%C3%A9nez_Moraga>) — asumió 13-ago-1997) y [Boletín Minero Sonami sep-1997](<https://www.bibliotecanacionaldigital.gob.cl/colecciones/BND/00/RE/RE0000545_0127.pdf>) (entrevista al entrante).

### Lagos (2000-2006) — 45 nombramientos, 45 exactos ✅

- **Cruce masivo**: anexo Concertación (sección Lagos).
- **Oficial**: [Minsal historial](<https://www.minsal.cl/historial-de-ministros-de-salud/>) (Artaza desde 7-ene-2002; García desde 3-mar-2003); [Archivo Presidente Lagos UDP — cambio de gabinete feb/mar-2003](<https://arle.udp.cl/index.php/se-concreta-el-cambio-de-gabinete-4>) y [juramento 3-mar-2003](<https://arle.udp.cl/index.php/ceremonia-de-juramento-de-los-nuevos-ministros-de-estado-video>) (Vidal reemplazó a Muñoz en Segegob ese día); [cambio ene-2002](<https://arle.udp.cl/index.php/cambio-de-gabinete-4>).
- **Prensa**: [El País 2-mar-2003](<https://elpais.com/diario/2003/03/02/internacional/1046559618_850215.html>).

### Bachelet 1 (2006-2010) — 42 nombramientos, 42 exactos ✅

- **Cruce masivo**: anexo Concertación (sección Bachelet 1).
- **Oficial**: [Minsal historial](<https://www.minsal.cl/historial-de-ministros-de-salud/>) (Barría hasta 28-oct-2008; Erazo desde 6-nov-2008).
- **Nota**: ficha de Michelle Bachelet completada con Salud 2000-2002 y Defensa 2002-2004 (anexo Concertación + Minsal).

### Piñera 1 (2010-2014) — 49 nombramientos, 49 exactos ✅

- **Cruce masivo**: [Anexo:Gabinetes ministeriales del primer gobierno de Sebastián Piñera](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_primer_gobierno_de_Sebasti%C3%A1n_Pi%C3%B1era>).
- **Oficial**: [Senado.cl 16-abr-2013 — destitución de Beyer](<https://www.senado.cl/comunicaciones/noticias/aprueban-un-capitulo-de-la-acusacion-constitucional-y-ministro-beyer-es>).
- **Prensa**: [La Razón 23-jul-2013](<https://hemeroteca.larazon.bo/mundo/2013/07/23/impelida-por-pinera-la-derecha-chilena-se-obliga-a-elegir-un-candidato-unico/>) (Matthei cesada 23-jul); [Epicentro 24-jul-2013](<https://www.epicentrochile.com/2013/07/24/juan-carlos-jobet-asume-como-el-nuevo-ministro-del-trabajo/>) (Jobet juró 24-jul); [Diario Financiero 7-may-2013](<https://www.df.cl/economia-y-politica/gobierno/pinera-oficializa-a-felix-de-vicente-como-nuevo-ministro-de-economia>) y [CNN Chile](<https://www.cnnchile.com/economia/felix-de-vicente-es-el-nuevo-ministro-de-economia_20130507/>) (De Vicente 7-may); [Cooperativa 6-jun-2013](<https://www.cooperativa.cl/noticias/pais/gobierno/gabinete/joaquin-lavin-y-luciano-cruz-coke-renunciaron-al-gobierno/2013-06-06/172752.html>), [Emol 7-jun-2013](<https://www.emol.com/noticias/nacional/2013/06/07/602623/gobierno-y-despedida-de-ministros-lavin-y-cruz-coke.html>) y [Radio Uchile 10-jun-2013](<https://radio.uchile.cl/2013/06/10/bruno-baranda-y-roberto-ampuero-juran-como-ministros-de-desarrollo-social-y-cultura/>) (Lavín/Baranda: juramento domingo 9-jun).

### Bachelet 2 (2014-2018) — 48 nombramientos, 48 exactos ✅

- **Cruce masivo**: [Anexo:Gabinetes ministeriales del segundo gobierno de Michelle Bachelet](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_segundo_gobierno_de_Michelle_Bachelet>).
- **Oficial**: [BCN reseña Jaime Campos](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/Jaime_Campos_Quiroga>) (Justicia 19-oct-2016 → 11-mar-2018); [Minsal historial](<https://www.minsal.cl/historial-de-ministros-de-salud/>) (Molina hasta 30-dic-2014; Castillo desde 23-ene-2015).
- **Prensa**: [La Tercera 19-oct-2016](<https://www.latercera.com/noticia/radical-ex-companero-gabinete-bachelet-perfil-del-nuevo-ministro-justicia-jaime-campos/>) y [T13 19-oct-2016](<https://www.t13.cl/noticia/politica/cambio-gabinete-javiera-blanco-justicia-maximo-pacheco>) (Blanco sale / Campos asume el mismo día — vault tenía ene-2016, error corregido).

### Piñera 2 (2018-2022) — 66 nombramientos, 66 exactos ✅

- **Cruce masivo**: [Anexo:Gabinetes ministeriales del segundo gobierno de Sebastián Piñera](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_segundo_gobierno_de_Sebasti%C3%A1n_Pi%C3%B1era>).
- **Oficial**: [gob.cl 18-dic-2020 — nombra a Prokurica (Defensa) y Jobet (Minería)](<https://www.gob.cl/noticias/presidente-pinera-nombra-nuevos-ministros-de-defensa-y-mineria/>). OJO: el anexo wiki dice 17-dic para este cambio; gob.cl y toda la prensa del día ([Cooperativa](<https://www.cooperativa.cl/noticias/pais/gobierno/gabinete/enroque-en-el-gabinete-sale-desbordes-prokurica-a-defensa-y-jobet/2020-12-18/121232.html>), [T13](<https://www.t13.cl/noticia/politica/cambio-gabinete-jobet-biministro-prokurica-reemplazara-desbordes-defensa-18-12-20>), [La Tercera](<https://www.latercera.com/pulso/noticia/juan-carlos-jobet-se-convertira-en-biministro-de-mineria-y-energia/I72S2VL4PBENNDJGOWJKK7QF4M/>)) lo fechan el viernes 18 — prevalece la fuente oficial.

### Boric (2022-2026) — 55 nombramientos, 55 exactos ✅

- **Cruce masivo**: [Anexo:Gabinetes ministeriales del gobierno de Gabriel Boric](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Gabriel_Boric>).
- **Oficial**: [Minsal historial](<https://www.minsal.cl/historial-de-ministros-de-salud/>) (Yarza hasta 6-sep-2022 → fija la salida de Siches; Aguilera desde esa fecha); [Diario Oficial decreto N°20, 9-ene-2025](<https://www.diariooficial.interior.gob.cl/publicaciones/2025/04/09/44121/01/2630370.pdf>) (Sandoval cesa 6-ene; Figueroa asume 9-ene); [Diario Oficial decreto N°91, 10-mar-2025](<https://www.diariooficial.interior.gob.cl/publicaciones/2025/05/06/44141/01/2641523.pdf>) (Lobos titular Segpres a contar del 10-mar — vault decía 4-mar, su subrogancia; corregido); [economia.gob.cl 22-ago-2025](<https://www.economia.gob.cl/2025/08/22/alvaro-garcia-asume-como-ministro-de-economia-fomento-y-turismo.htm>) (García Hurtado Economía 21-ago) y [16-oct-2025](<https://www.economia.gob.cl/2025/10/16/alvaro-garcia-asume-como-biministro-en-las-carteras-de-economia-y-de-energia.htm>) (biministro Energía 16-oct).
- **Prensa**: [Pauta 11-ene-2023](<https://www.pauta.cl/actualidad/2023/01/11/asume-nuevo-ministro-justicia-entra-en-polemica-por-indultos-decretos.html>) y [La Nación](<https://www.lanacion.cl/luis-cordero-asumio-como-nuevo-ministro-de-justicia/>) (Cordero asumió 11-ene-2023); [T13/Latercera/ADN/RadioUchile 22-jul-2025](<https://www.t13.cl/noticia/politica/aisen-etcheverry-pasa-al-gabinete-presidencial-aldo-valle-nuevo-ministro-ciencia-22-7-2025>) (Valle Ciencia); [La Tercera/Emol 20-dic-2024](<https://www.emol.com/noticias/Nacional/2024/12/20/1151947/ministra-ciencia-aisen-etcheverry-voceria.html>) (Vallejo NO dejó Segegob: prenatal con subrogancia de Etcheverry — el anexo wiki sugiere término en dic-2024, es engañoso).

### Kast (2026-) — 28 nombramientos, 28 verificados ✅

- **Obtención**: eventos propios del vault (`20260120-1` anuncio, `20260519-1/-2` remix, `20260813-2` Duco, `20260814-2` Riveros) con sus fuentes en `src/content/sources/*.md`.
- **Cruce externo**: [Anexo:Gabinetes ministeriales del gobierno de José Antonio Kast](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Jos%C3%A9_Antonio_Kast>) — 23/28 exactos; 5 diffs explicadas (biministros Alvarado/de Grange no desglosados en el anexo; Duco 14-ago en wiki vs comunicado oficial de Presidencia del 13-ago que sigue el vault).
- **Oficial/prensa**: [El País organigrama 11-mar-2026](<https://elpais.com/chile/2026-03-11/quienes-son-los-ministros-subsecretarios-y-delegados-presidenciales-de-jose-antonio-kast.html>) — lista nominal completa de los 24 ministros; [La Tercera 11-mar-2026](<https://www.latercera.com/politica/noticia/jose-antonio-kast-asume-como-presidente-de-chile-y-pone-en-marcha-el-gobierno-de-emergencia/>) y [Radio Uchile 11-mar-2026](<https://radio.uchile.cl/2026/03/11/jose-antonio-kast-asume-la-presidencia-y-marca-inicio-del-gobierno-de-emergencia/>) confirman la ceremonia de juramento de los ministros ese mismo día tras el cambio de mando; [CIPER 20-ene-2026](<https://www.ciperchile.cl/2026/01/20/radar-20-01-2026/>) (lista nominal del anuncio); [prensa.presidencia.cl comunicado 13-ago-2026](<https://prensa.presidencia.cl/comunicado.aspx?id=338091>) (salida Duco); [Emol 14-ago-2026](<https://www.emol.com/noticias/Nacional/2026/08/14/1208526/cambio-gabinete-riveros-ministro-deportes.html>) y [CNN Chile](<https://www.cnnchile.com/pais/francisco-riveros-prioridades-ministro-deporte-natalia-duco-ceremonia/>) (Riveros juró el 14-ago al mediodía).

## Verificación automática

`pnpm run verify-gabinete` (`scripts/validate/verify-gabinete.mjs`) descarga los anexos de Wikipedia
(con caché en `sitemaps/.cache/gabinete-wiki/`, `--sin-cache` para forzar), parsea las
tablas de ministros y compara cada nombramiento fechado de `src/content/people/*.md`
(campo `cargos[]`) contra ellas.
Reporta: exactos, diferencias de fecha, registros solo en el vault y filas solo en el
anexo. Última ejecución (05-oct-2026): **905/1025** (17 gobiernos, parser
v6: captura 2.os tramos, alias `julo`, matching por cartera con buckets `sinFilaCartera`/
`aportaFecha`, alias Segegob/Segpres y fomento→obras, gobierno `rios` con anexo
compacto multi-nombre); 29 diffs misma-persona-misma-cartera (triage
abajo), 13 sin fila en anexo para la cartera, 68 vault-aporta-fecha (64 Ríos +
4 Ibáñez), 10 solo-vault.
Es una herramienta de
auditoría: reporta, no falla el build.

## Correcciones aplicadas el 04-oct-2026

4 splits por renombre de ministerio (convención vigente: el cambio de nombre divide
la entrada, precedente `hugo_lavados` Economía 2010-02-12) + 2 fichas de Minería
Pinochet con fechas reales. Cada frontera lleva su URL inline en `cargos[]`:

| Persona | Campo antes | Campo ahora | Fuente que respalda |
| --- | --- | --- | --- |
| `rodrigo_hinzpeter` | Interior y Seg. Pública 2010-03-11 → 2012-11-05 | **Interior 2010-03-11 → 2011-02-21** + **Interior y Seg. Pública 2011-02-21 → 2012-11-05** | Anexo Piñera 1 (nota: "renombrado el 21 de febrero de 2011, mediante la ley N° 20.502") |
| `alfredo_moreno` | Desarrollo Social y Familia 2018-03-11 → 2019-06-13 | **Desarrollo Social 2018-03-11 → 2019-04-02** + **Des. Social y Familia 2019-04-02 → 2019-06-13** | Anexo Piñera 2 (nota: "El 2 de abril de 2019, el Ministerio de Desarrollo Social fue renombrado") |
| `joaquin_lavin_infante` | Desarrollo Social 2011-07-18 → 2013-06-09 | **Planificación 2011-07-18 → 2011-10-13** + **Desarrollo Social 2011-10-13 → 2013-06-09** | Anexo Piñera 1 (nota: MDS "creado el 13 de octubre de 2011. Anterior a ello, era Mideplan"; misma `organizacion: ministerio_desarrollo_social` que `felipe_kast`) |
| `alvaro_elizalde` | Interior y Seg. Pública 2025-03-04 → 2026-03-11 | **Interior y Seg. Pública 2025-03-04 → 2025-04-01** + **Interior 2025-04-01 → 2026-03-11** | Anexo Boric (nota: cambio de nombre por Ley N° 21.730; espeja `luis_cordero` Seguridad desde 2025-04-01) |
| `pablo_baraona_urzua` | Minería hasta 1990-03-11 | **1989-06-05** | [Ministerio de Minería — lista de titulares](<https://es.wikipedia.org/wiki/Ministerio_de_Miner%C3%ADa_de_Chile>) (sucesor López Bain desde esa fecha; elimina el solape con él) |
| `jorge_lopez_bain` | Minería 1990-03-11 → 1990-03-11 (rango cero, asignado a Aylwin) | **Minería 1989-06-05 → 1990-03-11 (gobierno pinochet)** + `notas` | [Biografía](<https://es.wikipedia.org/wiki/Jorge_L%C3%B3pez_Bain>) (infobox 5-jun-1989 → 11-mar-1990, último ministro de Pinochet, sucesor Hamilton) + [DTO-128 10-mar-1990](<https://nuevo.leychile.cl/servicios/Consulta/Exportar?exportar_con_notas_al_pie=False&exportar_con_notas_originales=False&exportar_con_notas_bcn=False&exportar_formato=pdf&hddResultadoExportar=90550.1990-03-10.0.0%23&nombrearchivo=DTO-128_10-MAR-1990&radioExportar=Normas>) firmado por él como ministro |

## Correcciones aplicadas el 04-oct-2026 (segunda tanda: parser v5 + juramentos)

**Parser v5** (`scripts/validate/verify-gabinete.mjs`): captura los 2.os tramos de
periodo (líneas de continuación sin `|` inicial → fila propia mismo ministerio+nombre,
con refs limpiadas antes de extraer fechas) y alias `julo` (typo del anexo
Concertación). **892/931 → 904/931**: cierran Provoste (el "14 de julo" era typo),
las 4 colas de splits (Hinzpeter, Moreno, Elizalde), Lavados (el anexo también lo
parte en 2010-02-12), Pascual, Ottone y Benítez (tramos servicio→ministerio que
el v4 perdía). Solo-vault quedan 2 (Boccardo, Lobos: la tabla del anexo solo trae
su subrogancia, el vault registra la titularidad con Diario Oficial/prensa).

4 fechas corregidas contra prensa del día (el vault decía el anuncio, la convención
exige el juramento):

| Persona | Campo antes | Campo ahora | Fuente que respalda |
| --- | --- | --- | --- |
| `ingrid_antonijevic` | Economía hasta 2006-07-17 | **2006-07-14** | Cooperativa 14-jul-2006 (anuncio) + Crónica Digital (juramento viernes 19:50, 1.5h después del anuncio); pares del mismo cambio (Zaldívar, Zilic, Velasco, Provoste) ya estaban en 07-14 |
| `alejandro_ferreiro` | Economía desde 2006-07-17 | **2006-07-14** | Ídem; su bio dice "14 de julio de 2006" |
| `monica_jimenez` | Educación desde 2008-04-17 | **2008-04-18** | Diario Financiero 18-abr-2008 ("juró hoy") + Clarín 17-abr ("asumirá mañana viernes"); interinato Cortázar 16→18-abr no abre entrada (subrogancia) |
| `carolina_toha` | Segegob desde 2009-03-13 | **2009-03-12** | Emol 12-mar-2009 ("asumirá desde hoy") + Clarín/Proceso (juramento jueves 12 en Montt-Varas con Vidal); Vidal Segegob→Defensa ya estaba en 03-12. BCN dice 13 pero su propia bajada dice "nombrada el 12" |
| `jaime_estevez` | sin cambio (trazabilidad) | `# arle.udp.cl juramento 2005-01-03` en ambos `desde` | Archivo Lagos UDP (juramento y reemplazo de Etcheberry) + su bio (MOP 3-ene-2005): el "2000-01-03" del anexo es typo por 2005 (en 2000 presidía BancoEstado) |

## Correcciones aplicadas el 04-oct-2026 (tercera tanda: Interior Ibáñez 16/16 + fusiones)

Cadena completa del Interior 1952-58 (el anexo trae los nombres sin fechas; cada
tramo lleva su URL inline): del Pedregal 1952-11-03 → Koch 1953-04-01 → Wilson
1954-03-01 → Araos 1954-04-23 → Parra 1954-06-05 → Olavarría 1954-11-17 → Recabarren
1955-01-06 → Montero Schmidt 1955-02-21 → Koch 1955-05-30 → Videla 1955-12-30 →
Aravena 1957-04-23 → O'Ryan 1957-07-03 → Arce 1957-09-09 → O'Ryan 1957-11-11 →
Urzúa 1958-02-18 → Valdés 1958-06-16 → 1958-11-03. Fuentes: bios con infobox,
BCN reseñas (Olavarría, Recabarren, Aravena), listas oficiales de Hacienda,
tabla `Carlos Ibáñez del Campo cabinet ministers` y Anexo Interior para la cadena.
`verify-gabinete`: ibanez2 106 → 127 nombramientos (wiki: 128).

Fusiones persona (cero referencias en el corpus, merge directo + `aliases[]`):
`guillermo_del_pedregal` + `guillermo_del_pedregal_herrera` (8 cargos 1941-1954,
incluye Hacienda/Economía/RR.EE. de Ríos con lista oficial de Hacienda),
`osvaldo_koch` + `osvaldo_koch_krefft` (Interior ×2), `arturo_olavarria` +
`arturo_olavarria_bravo` (Interior 1954 con BCN). Renames a nombre completo sin
refs: `jorge_aravena` → `jorge_aravena_carrasco`, `abel_valdes` →
`abel_valdes_acuna` (traslape Agricultura→Interior 16/19-jun-1958 anotado en
`notas`), `santiago_wilson` → `santiago_wilson_hernandez` (+ Economía 01→14-abr-1953).
Nuevas: `jorge_araos_salinas`, `sergio_recabarren_valenzuela` (+ Hacienda con
BCN+biblio.hacienda), `carlos_montero_schmidt`, `eduardo_urzua_merino` (+ Hacienda
1956-58 oficial).

Ajustes con fuente que el vault prevalece: Koch Justicia desde 03-02 → 03-01
(bio; cierra el encadenamiento con Wilson); del Pedregal Hacienda 1941-06-10 →
1942-04-02 en una entrada (precedente Gómez: el cambio de presidente no divide;
el anexo la parte por Aguirre/Méndez).

**Matcher v5.1** (mismo script): conciencia de cartera por tokens (stopwords +
alias Segegob/Segpres) con buckets `sinFilaCartera` (anexo trae a la persona en
otra cartera: los 12 Interior Ibáñez + Kast/Planificación) y `aportaFecha` (fila
del anexo sin fechas: del Pedregal ×3 + Wilson Economía). Sin el alias Segegob,
el biministro Alvarado caía a diff contra la fila Interior en vez de matchear
exacto su fila Segegob 19-may (bug detectado y corregido en la misma sesión).
## Correcciones aplicadas el 05-oct-2026 (quinta tanda: gobierno Ríos completo)

37 fichas nuevas + 15 ediciones. Fuentes: 4 listas ministeriales con día exacto
(Interior, RR.EE., Salud, Justicia) + lista oficial de Hacienda (biblio.hacienda
n°192-197) + bios es/en.wikipedia con infobox + BCN (Bustos) + Time jun-1943
(gabinete militar) + Diario de Sesiones (pensión Ortúzar). Cada tramo lleva su
URL inline en `cargos[]`. Cadenas completas verificadas punta a punta:
Interior 8/8, Hacienda 5/5, Salud 5/5, RR.EE. 2/2, Trabajo 3/3, Tierras 7/7,
Agricultura 7/7 (el anexo no trae a Mendoza 1946).

Renames a nombre completo sin refs (cero citas en el corpus): `alfonso_quintana_burgos`
→ `jaime_alfonso_quintana_burgos` (+ Interior 44-45, Agricultura 43-44, Interior
1948 y 1951-52 de González Videla), `fernando_moller` → `fernando_moller_bordeu`
(+ Agricultura 42-43, Economía 43-44, Justicia 46), `ricardo_bascunan` →
`ricardo_bascunan_stonner` (+ OO.PP. feb→sep-1943), `eugenio_puga` →
`eugenio_puga_fisher` (+ Justicia sep→nov-1946), `fernando_claro_x` →
`fernando_claro_salas` (nombre del anexo Salud), `fidel_estay` → `fidel_estay_cortes`
(+ Tierras 1945-46).

Vault prevalece sobre bio/anexo (documentado por caso): Barros Jarpa RR.EE.
hasta 26-oct (bio dice 26, anexo 21; coincide inicio Fernández); Escudero Salud
hasta 15-ago (bio 17-ago; coincide inicio Etchebarne); Bascuñán OO.PP. hasta
1-sep-1943 (su bio dice 6-oct-1944 pero Alcaíno asumió 1-sep con 2 refs);
Riveros Comercio 1941 hasta 2-abr-1942 (decía 25-nov-1941; DS 1549 + bio:
siguió con Méndez); Arriagada Justicia desde 14-may-1945 (su bio dice 1944,
imposible: Gajardo ocupó hasta sep-1944; coincide con el gran cambio del
14-may-1945 y con la lista del Min. de Justicia).
Fechas por encadenamiento entre dos fuentes (anotado `notas` en cada ficha):
Marshall Herrera Educación, Escudero Defensa, Fuenzalida Tierras, Jaramillo
Comercio. Divergencias no dirimidas sin Diario Oficial (sin cambios):
Alfonso Agricultura 1963 (26-sep vs 14-sep, previa), Pérez Zujovic Interior
1968-69 (15-feb/10-jul vs 05-feb/09-jul, previa).

`cabinet.ts`: keyword `/comercio/i` → `ministerio_economia` (Comercio y
Abastecimiento 1941-42 precedió a Economía y Comercio; mismo precedente que
Fomento→Economía).

## Correcciones aplicadas el 04-oct-2026 (cuarta tanda: muestreo ampliado)

Muestreo oficial extendido a todos los gobiernos (bio + listas oficiales + prensa
del día; todo lo no listado aquí coincidió exacto y no requirió cambios):

| Persona | Resultado |
| --- | --- |
| `sergio_de_castro` | ✅ Economía 1975-04-14→1976-12-27 y Hacienda 1976-12-31→1982-04-22 (bio + biblio.hacienda #232) |
| `miguel_kast_rist` | ✅ ODEPLAN 1978-12-26→1980-12-29 y Trabajo 1980-12-29→1982-04-22 (bio + BCN Historia Ley 20.181) |
| `jose_pinera_echenique` | ✅ ya traía URLs, confirmado |
| `carlos_caceres_contreras` | **Hacienda hasta 1984-04-22 → 1984-04-02**: CSM 03-abr-1984 (ceremonia lunes 2-abr) + biblio.hacienda #235 + old.hacienda.cl + genealog. Las bios dicen 22-abr por confusión con el 22-abr-1982 de De Castro; el anexo arrastra ese error (nuevo diff documentado). Interior ✅ |
| `luis_escobar_cerda` | **Hacienda desde 1984-04-22 → 1984-04-02** (ídem) + **Economía 1961-08-26→1963-09-26 agregada** (bio + anexo Alessandri, exacto) |
| `roberto_vergara_herrera` | ✅ triministro 1958-11-03→1960-09-15 (bio + anexo + BCN Diario Sesiones feb-1960 firmando como "Ministro de Economía, Hacienda y Minería") |
| `hernan_buchi_buc` | ✅ ODEPLAN 1983-08-10→1984-05-08 y Hacienda 1985-02-12→1989-04-05 (bio + El País feb-1985) |
| `jose_toha_gonzalez` | ✅ Interior 1970-11-03→1972-01-22 y Defensa 1972-01-07→1973-07-05 (bio: el traslape 7/22-ene-1972 es real, doble titularidad en la crisis de la acusación) |
| `clodomiro_almeyda_medina` | ✅ RR.EE. 1970-11-03→1973-05-22, Defensa 1973-07-05→1973-08-09, RR.EE. 1973-08-09→1973-09-11 (bio + BCN) |
| `orlando_letelier_del_solar` | ✅ RR.EE./Interior/Defensa may-sep 1973 (bio + juramento 09-ago en prensa) |
| `jacques_chonchol` | ✅ Agricultura 1970-11-03→1972-11-02 (bio + anexo) |
| `pedro_enrique_alfonso` | ✅ Interior/Hacienda 1938-40, Interior 1950-51 (bio; cadenas continuas) + **Economía 1945-05-14→1946-02-03 agregada** (bio es+en, gobierno Ríos). Agricultura 1963: vault==anexo (09-26) pero bio y lista ministerial dicen 09-14 — divergencia no dirimida sin Diario Oficial, sin cambios |
| `marcial_mora_miranda` | ✅ RR.EE. 1940-07-30→1940-11-07 y Hacienda 1940-11-07→1941-06-10 (BCN + biblio.hacienda #190; mismo-día RR.EE.→Hacienda sostiene el 11-07) |
| `edmundo_perez_zujovic` | ✅ OO.PP. 1965-12-16→1967-09-07; Interior vault==anexo (1968-02-15→1969-07-10) pero bios dicen 05-feb/09-jul — sin fuente primaria no se mueve |

Gap detectado (no es error, falta la ficha): el expresidente `Jorge Alessandri Rodríguez`
(Hacienda 1947-50) no tiene `src/content/people/*.md` (`jorge_alessandri.md` es el
diputado UDI homónimo); su fila vive solo en `soloWiki`. Crear la ficha requiere
ciclo TAREAS completo (5 fuentes), queda como pendiente de contenido.

Triage de los 29 diffs + buckets (todos explicados, ninguno es error del vault):
renuncia vs juramento 1-3 días con vault en juramento (Prokurica/Jobet/Desbordes
18-dic-2020, Beyer destituido 16-abr-2013, Matthei cese aceptado 23-jul-2013,
Blanco/Campos 19-oct-2016, Montt decreto 02-nov-1992, Jiménez Moraga asume
13-ago-1997, Foxley 13-mar-2009 —Fernández no estaba en Santiago el 12—,
Lavín/Baranda juramento domingo 09-jun-2013 vs renuncia 06-jun, Duco comunicado
oficial 13-ago-2026 vs 14, Koch Justicia bio 01-mar vs anexo 02-mar);
filas del anexo con una sola fecha vs cierre documentado del vault
(Baraona, López Bain, 4 ODEPLAN de Pinochet);
tramos que cruzan cambio de presidente en una entrada por convención
(del Pedregal Hacienda 1941-42; el anexo parte por Aguirre/Méndez);
errores del anexo donde el vault prevalece (Vallejo: subrogancia prenatal dic-2024
confundida con término; Estévez "2000" por 2005; Gómez: sección Frei cortada en
2000-03-11, continúa en Lagos; Alvarado Interior original vs biministro no
desglosado —el biministro SÍ matchea su fila—; de Grange igual;
Kast fusionado en Desarrollo Social aunque era Mideplan hasta oct-2011;
Cáceres/Escobar Hacienda abr-1984: anexo y bios dicen 22-abr, vault 02-abr con
CSM del día + biblio.hacienda oficial ×2;
Riveros Comercio 1941: anexo Aguirre corta 25-nov-1941, vault 02-abr-1942 con
DS 1549 + bio (siguió con Méndez; precede a Álvarez sin hueco)).
`sinFilaCartera` (13) y `aportaFecha` (4) son vault con fuente donde el anexo no
tiene la fila o la tiene sin fechas; `soloVault` Ibáñez (Araos, Recabarren ×2,
Urzúa ×2) tiene bio/BCN/Hacienda oficial y el anexo simplemente no trae esas
filas (Interior sin fechas + Hacienda).
Ríos aparte: `aportaFecha` 64 (el anexo compacto trae persona+cartera sin fechas;
el vault aporta el día exacto con bio/lista oficial), `soloVault` 3 (cola 1946
que el anexo no lista: Merino Interior, Garafulic Salud, Mendoza Agricultura),
`soloWiki` 1 (Solar Neira Comercio 1942, sin bio ni fechas: posible interinato
entre Álvarez y Arriagada, que encadenan el mismo 21-oct).
Vista por gobierno (`/gabinete`, panel `rios` 1941-11-25→1946-06-27): las 7
Tierras no tienen panel (cartera sin equivalente actual, documentado) y 3
entradas del interinato jun→nov-1946 quedan fuera del rango del panel
(Puga Justicia, Gajardo Economía, Iribarren Interior) — visibles en vista por
cartera, ficha y auditoría.

## Correcciones aplicadas el 28-sep-2026

Ninguna: las fichas ya eran correctas. Se agregó trazabilidad con la URL de BCN a cada
`desde`/`hasta` de `alvaro_elizalde` y `carolina_toha`, y se confirmó que no hay solapamiento:

| Persona | `cargos[]` registrado | Fuente primaria que lo confirma |
| --- | --- | --- |
| `carolina_toha` | Interior 2022-09-06 → 2025-03-04 | [BCN Tohá](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/Carolina_Toh%C3%A1_Morales>): "Ministra de Interior y Seguridad Pública, 6 de septiembre de 2022 - 4 de marzo de 2025" |
| `alvaro_elizalde` | Segpres 2023-04-19 → 2025-03-04 · Interior 2025-03-04 → 2026-03-11 | [BCN Elizalde](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/%C3%81lvaro_Antonio_Elizalde_Soto>): "Ministro de Secretario General de la Presidencia, 19 de abril de 2023 - 4 de marzo de 2025… Ministro de Interior y Seguridad Pública, 4 de marzo de 2025 - 11 de marzo de 2026" |

La sucesión es continua y sin solape: Tohá cesa el 4-mar-2025 y Elizalde asume el Interior ese
mismo día. Cerró `S-2022-003`. La hipótesis del seguimiento (que Elizalde había sido Segpres
2023-2025 y luego Interior 2025-2026) era correcta, pero las fichas ya la reflejaban.

## Correcciones aplicadas el 20-ago-2026

| Persona | Campo antes | Campo ahora | Fuente que respalda |
| --- | --- | --- | --- |
| `felipe_larrain` | Hacienda hasta 2022-03-11 | **2019-10-28** | Anexo Piñera 2; coherente con Briones/Cerda ya registrados |
| `jeannette_jara` | Trabajo hasta 2026-03-11 | **2025-04-07** | Anexo Boric; coherente con Boccardo desde 8-abr-2025 |
| `javiera_blanco` | Justicia hasta 2016-01-05 | **2016-10-19** | BCN reseña Campos + carta de renuncia 19-oct-2016 |
| `jaime_campos` | Justicia desde 2016-01-05 | **2016-10-19** | BCN reseña ("19 de octubre de 2016"), La Tercera, T13 |
| `jorge_jimenez` | Salud hasta 1992-08-30 | **1992-10-30** | Minsal historial oficial |
| `julio_montt_momberg` | Salud desde 1992-08-30 | **1992-11-02** | Minsal historial + BCN (Decreto 1341, 2-nov-1992) |
| `jorge_marshall` | Economía hasta 1993-11-09 | **1993-12-16** | BCN reseña Tohá + Wikipedia Marshall |
| `jaime_toha` | Economía desde 1993-11-09 | **1993-12-16** | BCN reseña Tohá |
| `heraldo_munoz` | Segegob hasta 2004-07-13 | **2003-03-03** | Archivo Lagos (arle.udp.cl), El País 2-mar-2003, Wikidata Vidal |
| `francisco_vidal` | Segegob desde 2004-07-13 | **2003-03-03** | Ídem |
| `osvaldo_artaza` | Salud desde 2002-02-07 | **2002-01-07** | Minsal historial |
| `alvaro_erazo` | Salud desde 2008-10-28 | **2008-11-06** | Minsal historial |
| `helia_molina` | Salud hasta 2015-01-23 | **2014-12-30** | Minsal historial |
| `benjamin_teplizky` | Minería hasta 1997-08-13 | **1997-08-03** (falleció) | Wikipedia Teplizky/Jiménez Moraga |
| `evelyn_matthei` | Trabajo hasta 2013-07-22 | **2013-07-23** | La Razón 23-jul-2013 (aceptación de renuncia) |
| `harald_beyer` | Educación hasta 2013-04-22 | **2013-04-16** (destitución Senado) | Senado.cl 16-abr-2013, CNN Chile |
| `felix_de_vicente` | Economía desde 2013-04-29 | **2013-05-07** | Diario Financiero, CNN Chile 7-may-2013 |
| `joaquin_lavin_infante` | Desarrollo Social hasta 2013-06-13 | **2013-06-09** | Radio Uchile (juramento Baranda domingo 9-jun) |
| `bruno_baranda` | Desarrollo Social desde 2013-06-07 | **2013-06-09** | Ídem |
| `edmundo_perez_yoma` | Interior desde 2008-01-03 | **2008-01-08** | Anexo Concertación (cambio de gabinete 8-ene-2008) |
| `alvaro_rojas` | Agricultura hasta 2008-01-10 | **2008-01-08** | Ídem |
| `marigen_hornkohl` | Agricultura desde 2008-01-10 | **2008-01-08** | Ídem |
| `izkia_siches` | Interior hasta 2022-09-07 | **2022-09-06** | Minsal (Yarza cesó 6-sep-2022); elimina solape con Tohá |
| `luis_cordero` | Justicia desde 2023-01-10 | **2023-01-11** | Pauta, La Nación (decreto y juramento 11-ene) |
| `aldo_valle` | Ciencia desde 2025-07-25 | **2025-07-22** | T13, La Tercera, ADN, Radio Uchile |
| `pilar_armanet` | Segegob desde 2009-12-14 | **2009-12-18** | La Tercera 18-dic-2009 (juramento); nombrada el 14 |
| `ximena_rincon` | Entrada corrupta Energía 2026→2015 | Segpres 2014→2015-05-11 fusionada | Sesión anterior (ver historial antiguo) |

**Duplicados eliminados**: `maria_begona_yarza` (fusionada en `begona_yarza`, nombre
completo "María Begoña Yarza Sáez") y `joaquin_lavin` (fusionado en
`joaquin_lavin_infante`, id con más referencias en eventos).

## Pendientes 🟡

- ✅ **Muestreo oficial ampliado el 04-oct-2026** (resuelve este pendiente): Pinochet
  3 → 11 ministros (de Castro, Kast, Piñera, Cáceres, Vergara, Büchi, Escobar +
  Fernández/Madariaga/Jarpa previos; hallado y corregido el error 22-abr-1984 de
  Cáceres/Escobar), Allende 4/4 (Tohá, Almeyda, Letelier, Chonchol), Aguirre 3
  (Alfonso, Mora + Wachholtz por cadena), Alessandri 2 (Vergara, Escobar),
  Frei 1 (Pérez Zujovic), González Videla 1 (Alfonso), Ibáñez completo (tanda 3).
  Detalle por persona en tanda 4 arriba.
- ✅ **Ríos completado el 05-oct-2026** (cierra el otro pendiente): 12 carteras con
  cadena continua, 36 fichas nuevas, 5 renames. Detalle en tanda 5 arriba.
- ✅ **Ibáñez 2.º Interior 1952-58 completado el 04-oct-2026** (resuelve este
  pendiente): cadena 16/16 con fechas y URL inline (tanda 3 arriba); ibanez2
  106 → 127 nombramientos. Discrepancia anotada: BCN dice Wilson Interior hasta
  5-jun-1954, pero Anexo + bio + sucesor Araos 23-abr coinciden en 23-abr.
- ⬜ **Ríos (1942-46)**: su anexo usa formato compacto (`[[Nombre]] (años)` con varios
  ministros por celda, solo años) — un parser daría rangos anuales que violan la
  convención `cargos[]` (exige día exacto; ver skill gabinete "Rango a medias").
  Completar requiere bio por bio como Ibáñez (ej: del Pedregal 1942-43 ya está).
  `verify-gabinete` tiene gobierno `rios` en `GOBIERNOS` desde el 05-oct-2026
  (parser v6: celdas multi-nombre, anexo sin fechas → bucket aportaFecha).
  Origen: <https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Juan_Antonio_R%C3%ADos>
- ✅ **Ríos (1942-46) completado el 05-oct-2026** (resuelve este pendiente): 37 fichas
  nuevas + 15 editadas bio por bio (Interior 7/7, Hacienda 5/5 vía lista oficial,
  Salud 5/5, RR.EE. 2/2, Justicia 4/5, Educación 5/5, Defensa 3/3, Fomento/OO.PP.
  6/6, Tierras 7/7, Agricultura 7/7, Trabajo 3/3, Comercio 8/9). `verify-gabinete`
  parser v6: gobierno `rios`, celdas multi-nombre, alias fomento→obras, fix
  "Pedro Pobrete"→Poblete. Resultado: vault 67 / wiki 62, 64 aporta-fecha,
  3 soloVault de cola 1946 que el anexo no trae (Merino, Garafulic, Mendoza),
  1 soloWiki (Solar Neira, sin fechas). Detalle en tanda 5 abajo.
- ✅ **Ficha Jorge Alessandri Rodríguez creada el 05-oct-2026** (cierra el gap): Hacienda 1947-08-02→1950-02-07 (BCN + biblio.hacienda) + Presidencia 1958-63; 2 refs históricas re-apuntadas (`20221012-1`, `20260112-2`).
- ✅ **Cuevas Interior 1946 resuelto el 05-oct-2026**: BCN confirma 17-oct→2-nov como suplente bajo Iribarren (sin entrada por convención) + titular 3-nov-1946→2-ago-1947; rename a nombre completo con alias.
- ✅ **Fernández Defensa 1961 resuelto el 05-oct-2026**: su bio es internamente contradictoria (infobox 25-abr vs prosa 15-abr); vault==anexo==infobox, sin cambios.
- ✅ **Solape Puga Fisher feb-1950 documentado el 05-oct-2026**: viene del propio anexo GV (dos filas 7-feb/10-feb); vault==anexo, sucedido por Ruperto Puga el 27-feb.
- ✅ **Fichas Bulnes Sanfuentes + Concha Quezada creadas el 05-oct-2026**: Defensa y Agricultura 1946-11-03→1947-04-16 (bio+anexo coinciden en ambos); homónimos modernos distintos, sin renames.
- ⬜ **Gobiernos anteriores a 1938**: sin datos en el vault. Anexos wiki disponibles por
  gobierno — mismo método de importación aplica.

### Pendientes Ríos (05-oct-2026, sin día exacto verificable)

- Solar Neira (Comercio 1942, único soloWiki Ríos): sin bio en ningún idioma;
  las cadenas Álvarez (→21-oct) → Arriagada (21-oct→) no dejan hueco — posible
  interinato o error del anexo.
- Tovarías Arroyo (OO.PP. desde 28-ene-1946, sucesor de Frei según su bio): sin
  bio ni fechas; cola fuera del anexo.
- Puga Fisher Justicia 1944-45 (entre Claro interino y Arriagada): solo años.
- Marshall Herrera Educación (6-oct-1944→14-may-1945 por encadenamiento),
  Escudero Defensa (7-jun-1943→6-oct-1944), Fuenzalida Tierras
  (4-feb→7-jun-1943), Jaramillo Comercio (4-feb→7-may-1943): día exacto por
  confirmar con Diario Oficial.
- OO.PP. 21-oct→19-dic-1942 sin titular (Schnake→Hidalgo); el sucesor que da la
  bio de Schnake ("Amagada", probable typo por Arriagada) no se sostiene como
  titular. Duhalde Interior 17→28-ene-1946 idem (asume VP el 17, Merino el 28).
- Bascuñán Stonner 1947-48 (González Videla): vault ago-1947 vs bio oct-1947
  (arrastra a Estay desde 14-ago); dirimir con Diario Oficial. Su OO.PP.
  jul→nov-1952 (Ibáñez) sin verificar en el vault.
- Puga Fisher: solape 7→10-feb-1950 heredado del propio anexo GV (dos filas; vault==anexo, documentado en ficha).
- Fernández Defensa 1961: resuelto (bio internamente contradictoria; vault==anexo==infobox). Cuevas Interior 1946: resuelto (suplencia sin entrada).

### Decisiones de alcance

- **Subsecretarios**: NO se trackean en `cargos[]` — quedan como eventos con fuentes
  (Jouannet y Quintana renunciaron 02-jun-2026, `20260602-2/-3`; Rodríguez Hacienda
  23-jul-2026, `20260723-10/-11/-24`). Reabrir solo si se pide un histórico propio.
- **Servicios no ministeriales** (CNE, Sernam, CNCA, CONAMA, Corfo, ODEPLAN): sus
  titulares no son Ministros de Estado propios; se registran solo cuando el cargo es
  "Ministro ..." explícito.

### Resueltos el 20-ago-2026 (sesión 3)

- ✅ Boric tardío verificado con fuentes oficiales: Figueroa/Sandoval BN por Diario
  Oficial (decreto N°20, 9-ene-2025); Lobos Segpres titular desde 10-mar-2025 (Diario
  Oficial decreto N°91 — vault decía 4-mar, era su subrogancia; corregido); García
  Hurtado Economía 21-ago-2025 y Energía 16-oct-2025 (economia.gob.cl).
- ✅ Arzola/Wulf/Undurraga nominalizados por CIPER 20-ene-2026.
- ✅ Riveros juró el 14-ago-2026 al mediodía en La Moneda (Emol/CNN/La Tercera).
- ✅ Kast: fuente nominal completa de los 24 ministros + juramento del 11-mar-2026
  confirmado (El País organigrama, La Tercera, Radio Uchile).
- ✅ Foxley RR.EE.: anuncio del cambio el 12-mar-2009 pero Mariano Fernández asumió el
  13-mar (Wikipedia infobox; RPP señala que ni siquiera estaba en Santiago el día del
  anuncio) — vault correcto con 13-mar.
- ✅ Script `pnpm run verify-gabinete` creado para re-verificación automática.

## Matriz Kast (28 registros)

### Gabinete inicial (asunción 2026-03-11)

| # | Persona (id) | Cargo registrado | Desde | Hasta | Estado |
| --- | --- | --- | --- | --- | --- |
| 1 | Claudio Alvarado (`claudio_alvarado`) | Ministro del Interior | 2026-03-11 | 2026-05-19 | ✅ `20260120-1` + `20260519-1` |
| 2 | José García Ruminot (`jose_garcia_ruminot`) | Ministro Secretario General de la Presidencia | 2026-03-11 | — | ✅ `20260120-1` |
| 3 | Mara Sedini (`mara_sedini`) | Ministra Secretaria General de Gobierno | 2026-03-11 | 2026-05-19 | ✅ `20260120-1` + `20260519-2` |
| 4 | Jorge Quiroz (`jorge_quiroz`) | Ministro de Hacienda | 2026-03-11 | — | ✅ `20260120-1` |
| 5 | Francisco Pérez Mackenna (`francisco_perez_mackenna`) | Ministro de Relaciones Exteriores | 2026-03-11 | — | ✅ `20260120-1` + `20260120-3` |
| 6 | Fernando Barros (`fernando_barros`) | Ministro de Defensa | 2026-03-11 | — | ✅ `20260120-1` |
| 7 | May Chomali (`may_chomali`) | Ministra de Salud | 2026-03-11 | — | ✅ `20260120-1` + Minsal ("Actualidad") |
| 8 | María Paz Arzola (`maria_paz_arzola`) | Ministra de Educación | 2026-03-11 | — | ✅ CIPER 20-ene-2026 |
| 9 | Fernando Rabat (`fernando_rabat`) | Ministro de Justicia y Derechos Humanos | 2026-03-11 | — | ✅ `20260120-1` |
| 10 | Tomás Rau (`tomas_rau`) | Ministro de Trabajo y Previsión Social | 2026-03-11 | — | ✅ `20260120-1` |
| 11 | Daniel Mas (`daniel_mas`) | Biministro de Economía y Minería | 2026-03-11 | — | ✅ `20260120-1` + Ministro de Estado de Chile (wiki) |
| 12 | Martín Arrau (`martin_arrau`) | Ministro de Obras Públicas | 2026-03-11 | 2026-05-19 | ✅ `20260120-1` + `20260120-11` + `20260519-1` |
| 13 | Louis de Grange (`louis_de_grange`) | Ministro de Transporte y Telecomunicaciones | 2026-03-11 | 2026-05-19 | ✅ `20260120-1` + `20260519-1` |
| 14 | Trinidad Steinert (`trinidad_steinert`) | Ministra de Seguridad Pública | 2026-03-11 | 2026-05-19 | ✅ `20260120-1` + `20260519-1` |
| 15 | Iván Poduje (`ivan_poduje`) | Ministro de Vivienda y Urbanismo | 2026-03-11 | — | ✅ `20260120-1` |
| 16 | Jaime Campos (`jaime_campos`) | Ministro de Agricultura | 2026-03-11 | — | ✅ `20260120-1` + Wikipedia Campos |
| 17 | Natalia Duco (`natalia_duco`) | Ministra del Deporte | 2026-03-11 | 2026-08-13 | ✅ `20260120-13` + `20260813-2` |
| 18 | Judith Marín (`judith_marin`) | Ministra de la Mujer y Equidad de Género | 2026-03-11 | — | ✅ `20260120-1` |
| 19 | Catalina Parot (`catalina_parot`) | Ministra de Bienes Nacionales | 2026-03-11 | — | ✅ `20260120-1` |
| 20 | Francisca Toledo (`francisca_toledo`) | Ministra del Medio Ambiente | 2026-03-11 | — | ✅ `20260120-1` |
| 21 | Ximena Lincolao (`ximena_lincolao`) | Ministra de Ciencia, Tecnología, Conocimiento e Innovación | 2026-03-11 | — | ✅ `20260120-1` |
| 22 | Ximena Rincón (`ximena_rincon`) | Ministra de Energía | 2026-03-11 | — | ✅ sitemap El Dínamo 20-ene ("Ximena Rincón asume energía") |
| 23 | María Jesús Wulf (`maria_jesus_wulf`) | Ministra de Desarrollo Social y Familia | 2026-03-11 | — | ✅ CIPER 20-ene-2026 + Diario Republicano |
| 24 | Francisco Undurraga (`francisco_undurraga`) | Ministro de las Culturas, las Artes y el Patrimonio | 2026-03-11 | — | ✅ CIPER 20-ene-2026 |

### Cambios posteriores

| Persona (id) | Cargo registrado | Desde | Hasta | Estado |
| --- | --- | --- | --- | --- |
| Claudio Alvarado | Biministro del Interior y Segegob | 2026-05-19 | — | ✅ `20260519-1` |
| Louis de Grange | Biministro de Obras Públicas y Transportes | 2026-05-19 | — | ✅ `20260519-1` |
| Martín Arrau | Ministro de Seguridad Pública | 2026-05-19 | — | ✅ `20260519-1` |
| Francisco Riveros (`francisco_riveros_cantuarias`) | Ministro del Deporte | 2026-08-14 | — | ✅ `20260814-2` |

## Cobertura de carteras (auditoría 28-sep-2026)

Barrido por intervalo continuo (no por año: un ministro que entra en diciembre
"cubre" dos años calendarios y falsea el conteo) sobre los `cargos[]` de tipo
`Ministro/a` o `Biministro/a` de `src/content/people/*.md`:

| Cartera | Titulares | Cobertura 1990-2026 | Observación |
| --- | --- | --- | --- |
| Agricultura | 58 | completa desde 1938 | |
| Bienes Nacionales | 19 | completa desde 1990 | |
| Ciencia | 6 | completa desde 2018-12-17 | cartera creada dic-2018; el "hueco 1990-2018" es correcto |
| Cultura | 24 | completa desde 2014 | cartera separada desde 2014 |
| Defensa | 59 | completa desde 1938 | |
| Depto del Deporte | 9 | completa desde 2013-11-14 | cartera separada desde nov-2013 |
| Energía | 14 | completa desde 2010-02-01 | cartera separada desde 2010 |
| Interior | 59 | completa desde 1938 | |
| Justicia | 53 | completa desde 1938 | hueco 1990-2018 cerrado en ago-2026 (ver abajo) |
| Medio Ambiente | 8 | completa desde 2010 | cartera separada desde oct-2010 |
| Mujer | 6 | completa desde 2016-06-03 | cartera creada jun-2016 |
| Seguridad Pública | 15 | completa desde 2010-03-11 (como parte de Interior) y desde 2025-04-01 como cartera propia | Ley N° 21.730 |
| Salud | 65 | completa desde 1938 | |
| Trabajo | 60 | completa desde 1938 | |

**Justicia 1990-2018, cerrado el 28-sep-2026.** El barrido de ago-2026 dejó la cartera
 apparently incomplete porque las fichas usaban el rótulo pre-2018 "Ministro de Justicia"
mientras el detector buscaba el rótulo actual "Justicia y Derechos Humanos". La serie sí
estaba completa: Cumplido (1990-1994) → Alvear (1994-1999) → Gómez Urrutia (1999-2003, dos
períodos) → Bates (2003-2006) → Solís Palma (2006-2007) → Maldonado Curti (2007-2010) →
Bulnes (2010-2011) → Ribera (2011-2012) → Pérez Goldberg (2012-2014) → Gómez Urrutia
(2014-2015) → Blanco (2015-2016) → Campos (2016-2018) → Larraín (2018-2022). Fechas
contrastadas contra los anexos wiki de la Concertación y Piñera 1, y la serie de
Justicia se lee completa de punta a punta. Cerró `S-2025-012`, cuyo enunciado ("solo
tienen al titular de Kast") estaba desactualizado: la cobertura de Boric y Piñera ya
existía.

## Historial de correcciones

- **28-sep-2026 (sesión 3)**: cerrada `S-2026-179` con fuente primaria para 2 de los 5
  puntos: `sergio_micco` (INDH 2019-07-29 → 2022-07-18, La Tercera + comunicado INDH) y
  `guillermo_donoso` (Director Nacional del INIA 2010-06-21 → 2011-04-18, D.S. N° 79 y
  D.S. N° 50 del Min. de Agricultura vía LeyChile). `consuelo_contreras` recibió
  solo el segundo período con día exacto (2022-07-18 subrogante → 2025-07-02,
  resolución exenta N° 257 del INDH, 5-sep-2022): el primer período (ene-2018 → 29-jul-2019)
  no tiene día de asunción verificable, así que quedó en `notas` y no en `cargos[]`.
  Sin rango: `maximiliano_ramirez` (el sumario no informa la fecha de asunción),
  `gloria_gonzalez` (sin fecha de cese) y los cinco Seremi con nombramiento revocado
  antes de asumir, que no tienen período de ejercicio por definición.
- **28-sep-2026 (sesión 2)**: cerrada `S-2022-003` — BCN confirma la sucesión Tohá→Elizalde
  sin solape; añadida trazabilidad BCN a `cargos[]` de `alvaro_elizalde` y `carolina_toha`
  (tabla arriba). Sin cambios de fechas. Cerrada `S-2024-003` (`marcela_cubillos`: nombre
  completo "Marcela Cubillos Sigall" y ambos rangos ministeriales confirmados en BCN, con
  URL por fecha). Corregida `johannes_kaiser`: era `Diputado (PNL)` desde 2026-03-11 sin
  `hasta`; BCN y el fallo del TC (evento `20260806-41`) confirman **`desde: 2022-03-11`,
  `hasta: 2026-03-11`** (término natural del mandato), nombre completo
  "Johannes Kaiser Barents-von Hohenhagen" y 4 eventos que lo llamaban "el diputado" en
  agosto-septiembre 2026 corregidos a "ex diputado". Cerrada `S-2026-192`.
- **28-sep-2026 (sesión 1)**: re-auditoría `pnpm run verify-gabinete` (889/927 exactos, cache local de
  los 13 anexos) y referencias al monolito `entities.yaml`/`sources.yaml` reemplazadas por
  `src/content/people/*.md` / `src/content/sources/*.md` en este documento. Sin cambios en
  `cargos[]`.
- **20-ago-2026 (sesión 4)**: import de los gobiernos 1938-1973 (273 personas nuevas,
  cargos agregados a 19 fichas; anexos wiki); 6 paneles nuevos en `/gabinete`; keywords
  Fomento→Economía en `cabinet.ts`; homónimos renombrados a nombre completo
  (Mario Astorga Fernández, Sótero del Río Gutiérrez); `verify-gabinete` extendido a los
  16 gobiernos con parser v4 (años heredados, encabezados multilínea, sufijos de
  partido); decisión documentada: subsecretarios quedan como eventos.
- **20-ago-2026 (sesión 3)**: import del gabinete de Pinochet (131 personas, 157
  nombramientos, anexo wiki); panel `pinochet` agregado a `/gabinete`; keywords de
  carteras históricas en `cabinet.ts`; Lobos Segpres corregida a 10-mar-2025 (Diario
  Oficial); pendientes Boric tardío y Kast nominalizados resueltos.
- **20-ago-2026 (sesión 2, alcance todos los gobiernos)**: 25 correcciones de fechas
  contra fuentes oficiales (Minsal, BCN, Senado, gob.cl, archivo Lagos UDP) y prensa;
  2 duplicados de personas eliminados; cargos Salud/Defensa 2000-2004 agregados a
  Michelle Bachelet. Detalle en la tabla de arriba.
- **20-ago-2026 (sesión 1)**: `ximena_rincon` entrada corrupta fusionada;
  `src/lib/cabinet.ts` EXCLUDE_RE extendido (ministros extranjeros y roles con año
  entre paréntesis dejaron de atribuirse al gobierno en ejercicio).
