# Gabinetes ministeriales — Verificación de fechas y cargos (1938–2026)

> Archivo de seguimiento para sesiones futuras: cruzar y validar las fechas y cargos
> registrados en `entities.yaml` (`cargos[]`) contra eventos del vault y fuentes externas
> (sitios oficiales y prensa). Cubre Aguirre Cerda (1938) en adelante; Ríos (1942-46)
> pendiente por formato de fuente.
> **Última verificación integral:** 20-ago-2026 — `pnpm run verify-gabinete`:
> **891/929 nombramientos exactos (96%)** contra los anexos de gabinetes de Wikipedia;
> discrepancias restantes son artefactos del parser o casos resueltos y documentados abajo.

## Cómo re-verificar en una sesión futura

1. Extraer todos los `cargos[]` ministeriales fechados de `src/data/entities.yaml`
   (regex `/^(ministr[oa]|biministr[oa]?)\b/i`, excluyendo `/corte|.../` — ver
   `EXCLUDE_RE` en `src/lib/cabinet.ts`).
2. Comparar contra:
   - **Fuente secundaria completa**: anexos de gabinetes de Wikipedia es.wikipedia.org
     (`Anexo:Gabinetes ministeriales de los gobiernos de la Concertación`, `...del primer
     gobierno de Sebastián Piñera`, `...del segundo gobierno de Michelle Bachelet`,
     `...del segundo gobierno de Sebastián Piñera`, `...del gobierno de Gabriel Boric`,
     y `Ministro de Estado de Chile` para el gabinete vigente). Descargar wikitexto con
     `curl "<https://es.wikipedia.org/w/index.php?title=<PAGIN>A>&action=raw"` y parsear
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

Resumen: 929 nombramientos fechados en el vault (1938-2026), 891 coincidencia exacta con
los anexos de Wikipedia (`pnpm run verify-gabinete`); todas las discrepancias 1990-2026
resueltas contra fuente oficial o prensa (detalle en "Correcciones aplicadas"). El detalle
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
| Ibáñez 2.º (1952-58) | [Anexo](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_segundo_gobierno_de_Carlos_Ib%C3%A1%C3%B1ez_del_Campo>) | 106 | El anexo no trae fechas del Interior 1952-57 (22 filas omitidas); 🟡 completar |
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

- **Obtención** (única fuente masiva por ahora): [Anexo:Gabinetes ministeriales de la dictadura militar chilena](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_de_la_dictadura_militar_chilena>) — 157 filas parseadas → **131 personas nuevas** en `entities.yaml`.
- **Verificación oficial (muestreo 20-ago-2026)**: 3 ministros / 6 cargos contra BCN y fuentes biográficas:
  - [BCN Sergio Fernández Fernández](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/Sergio_Fern%C3%A1ndez_Fern%C3%A1ndez>): Trabajo 8-mar-1976→1-ene-1978 ✅ e Interior 14-abr-1978→22-abr-1982 ✅ exactos; su 2.º Interior figura como designado 7-jul-1987 (texto BCN) pero asumido 11-jul-1987 (tabla BCN) — el import usa 8-jul-1987, fecha uniforme del remix en el anexo para los 14 ministros de ese cambio; se deja así y queda anotado.
  - Mónica Madariaga ([Wikipedia](<https://es.wikipedia.org/wiki/M%C3%B3nica_Madariaga>), [revista RLD UAI](<https://lals.uai.cl/index.php/rld/article/view/139/231>)): Justicia 20-abr-1977→14-feb-1983 ✅ y Educación Pública 14-feb-1983→18-oct-1983 ✅ exactos.
  - [BCN Sergio Onofre Jarpa](<https://www.bcn.cl/historiapolitica/resenas_parlamentarias/wiki/Sergio_Onofre_Jarpa_Reyes>): Interior 10-ago-1983→12-feb-1985 ✅ exacto.
  - Resultado del muestreo: **5/6 cargos exactos**, 1 ambigüedad de fuente documentada.
- Panel `/gabinete`: 136 nombramientos visibles (114 personas, carteras mapeables a ministerios actuales).
- **Cierres**: los 7 titulares sin fecha de término se cerraron en `1990-03-11` (fin del gobierno).
- **Carteras históricas mapeadas** en `cabinet.ts` (`KEYWORD_MINISTERIO`): Guerra/Marina/Aviación → Defensa Nacional; Salud Pública → Salud. Educación Pública y Obras Públicas y Transportes matchean keywords existentes.
- **Carteras sin equivalente actual** (registradas en YAML pero sin panel): Tierras y Colonización, Coordinación Económica y Desarrollo, Oficina de Planificación (ODEPLAN), Jefatura de Estado Mayor Presidencial.
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

- **Obtención**: eventos propios del vault (`20260120-1` anuncio, `20260519-1/-2` remix, `20260813-2` Duco, `20260814-2` Riveros) con sus fuentes en `sources.yaml`.
- **Cruce externo**: [Anexo:Gabinetes ministeriales del gobierno de José Antonio Kast](<https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Jos%C3%A9_Antonio_Kast>) — 23/28 exactos; 5 diffs explicadas (biministros Alvarado/de Grange no desglosados en el anexo; Duco 14-ago en wiki vs comunicado oficial de Presidencia del 13-ago que sigue el vault).
- **Oficial/prensa**: [El País organigrama 11-mar-2026](<https://elpais.com/chile/2026-03-11/quienes-son-los-ministros-subsecretarios-y-delegados-presidenciales-de-jose-antonio-kast.html>) — lista nominal completa de los 24 ministros; [La Tercera 11-mar-2026](<https://www.latercera.com/politica/noticia/jose-antonio-kast-asume-como-presidente-de-chile-y-pone-en-marcha-el-gobierno-de-emergencia/>) y [Radio Uchile 11-mar-2026](<https://radio.uchile.cl/2026/03/11/jose-antonio-kast-asume-la-presidencia-y-marca-inicio-del-gobierno-de-emergencia/>) confirman la ceremonia de juramento de los ministros ese mismo día tras el cambio de mando; [CIPER 20-ene-2026](<https://www.ciperchile.cl/2026/01/20/radar-20-01-2026/>) (lista nominal del anuncio); [prensa.presidencia.cl comunicado 13-ago-2026](<https://prensa.presidencia.cl/comunicado.aspx?id=338091>) (salida Duco); [Emol 14-ago-2026](<https://www.emol.com/noticias/Nacional/2026/08/14/1208526/cambio-gabinete-riveros-ministro-deportes.html>) y [CNN Chile](<https://www.cnnchile.com/pais/francisco-riveros-prioridades-ministro-deporte-natalia-duco-ceremonia/>) (Riveros juró el 14-ago al mediodía).

## Verificación automática

`pnpm run verify-gabinete` (`scripts/verify-gabinete.mjs`) descarga los anexos de Wikipedia
(con caché en `sitemaps/.cache/gabinete-wiki/`, `--sin-cache` para forzar), parsea las
tablas de ministros y compara cada nombramiento fechado de `entities.yaml` contra ellas.
Reporta: exactos, diferencias de fecha, registros solo en el vault y filas solo en el
anexo. Última ejecución (20-ago-2026): **509/557 exactos**; las diferencias restantes son
artefactos conocidos del parser (filas de continuación con rowspan) o casos ya resueltos
y documentados arriba. Es una herramienta de auditoría: reporta, no falla el build.

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

- 🟡 **Pinochet y 1938-1973: ampliar muestreo oficial** — Pinochet tiene 3 ministros
  verificados (5/6 cargos exactos); los 6 gobiernos 1938-1973 importados aún sin cruce
  individual contra BCN/Diario Oficial. La ambigüedad del remix del 8-jul-1987
  (designación 7-jul vs asunción 11-jul en BCN) aplica a 14 entradas del import.
  Origen: <https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_de_la_dictadura_militar_chilena>
- 🟡 **Ibáñez 2.º: fechas del Interior 1952-57** — el anexo no las trae; completar desde
  BCN/Diario Oficial (22 filas omitidas).
  Origen: <https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_segundo_gobierno_de_Carlos_Ib%C3%A1%C3%B1ez_del_Campo>
- ⬜ **Ríos (1942-46)**: su anexo usa formato compacto (solo años, varios ministros por
  celda) — requiere parser propio o carga manual.
  Origen: <https://es.wikipedia.org/wiki/Anexo:Gabinetes_ministeriales_del_gobierno_de_Juan_Antonio_R%C3%ADos>
- ⬜ **Gobiernos anteriores a 1938**: sin datos en el vault. Anexos wiki disponibles por
  gobierno — mismo método de importación aplica.

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

## Historial de correcciones

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
