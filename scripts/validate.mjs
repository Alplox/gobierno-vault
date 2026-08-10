import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';

const root = join(process.cwd(), 'src');
const dataDir = join(root, 'data');
const eventsDir = join(root, 'content', 'events');

function readYaml(filename) {
  return YAML.parse(readFileSync(join(dataDir, filename), 'utf8')) ?? {};
}

const sourcesData = readYaml('sources.yaml');
const validSourceIds = new Set(Object.keys(sourcesData));

const topicsData = readYaml('topics.yaml');
const validTopicIds = new Set(Object.keys(topicsData));

const colectivosData = readYaml('colectivos.yaml');
const sectoresData = readYaml('sectores.yaml');
const validColectivos = new Set(Array.isArray(colectivosData) ? colectivosData : Object.keys(colectivosData));
const validSectores = new Set(Array.isArray(sectoresData) ? sectoresData : Object.keys(sectoresData));

// Regla AGENTS.md (convención de medios): el campo `medio:` de cada fuente en
// sources.yaml debe ser EXACTAMENTE el nombre (`nombre`) de una org de prensa
// (tipo medio_comunicacion / red_social / canal_television / programa_tv /
// programa_streaming) registrada en entities.yaml, o estar en la lista blanca
// de instituciones/plataformas/documentos (que no son "medios de prensa" y por
// lo tanto no requieren org). Esto impide que las variantes de nombre (y el
// mojibake de doble-encoding UTF-8) vuelvan a degradar la convención.
const entitiesData = readYaml('entities.yaml');
const orgsData = entitiesData.organizations ?? {};
const MEDIA_ORG_TYPES = new Set([
  'medio_comunicacion',
  'red_social',
  'canal_television',
  'programa_tv',
  'programa_streaming',
]);
const mediaOrgNames = new Set(
  Object.values(orgsData)
    .filter((o) => o && MEDIA_ORG_TYPES.has(o.tipo) && typeof o.nombre === 'string')
    .map((o) => o.nombre)
);

// Lista blanca: instituciones del Estado, organismos, encuestadoras,
// plataformas sociales/documentos y publicaciones académicas que aparecen como
// `medio:` de una fuente pero NO son medios de prensa (no necesitan org).
// Solo agregar aquí lo que deliberadamente no sea prensa; los medios de prensa
// nuevos deben registrarse en entities.yaml con tipo medio_comunicacion.
const WHITELIST_MEDIOS = new Set([
  'Senado de Chile',
  'Gobierno de Chile',
  'Gobierno de Chile (gob.cl)',
  'Gob.cl',
  'Gobierno de Santiago (GORE Metropolitano)',
  'Presidencia de Chile',
  'Presidencia de la República',
  'Prensa Presidencia',
  'SENAPRED',
  'Ministerio de Hacienda',
  'Ministerio de Salud',
  'Ministerio de Salud (Minsal)',
  'Ministerio del Interior',
  'Subsecretaria del Interior',
  'Subsecretaría del Interior',
  'Ministerio de Obras Públicas',
  'Ministerio de Vivienda y Urbanismo',
  'Ministerio del Trabajo y Previsión Social',
  'Ministerio de Justicia y Derechos Humanos (Subsecretaría de DDHH)',
  'Ministerio de Seguridad Pública',
  'Ministerio Secretaría General de Gobierno',
  'Contraloría General de la República',
  'Poder Judicial de Chile',
  'Tribunal de la Libre Competencia',
  'Tribunal de Defensa de la Libre Competencia',
  'Fiscalía Nacional Económica',
  'Fiscalía de Chile (División de Estudios, Unidad de DDHH)',
  'Servicio Electoral (Servel)',
  'Dirección de Presupuestos (DIPRES)',
  'Tesorería General de la República',
  'Instituto Nacional de Estadísticas (INE)',
  'Banco Central de Chile',
  'Codelco',
  'Archivo Nacional de Chile',
  'Biblioteca del Congreso Nacional',
  'Biblioteca del Congreso Nacional (LeyChile)',
  'Biblioteca del Congreso Nacional (Ley Chile)',
  'BCN Historia de la Ley',
  'Wikipedia',
  'Actualidad Jurídica DOE',
  'Portal de Datos Abiertos del Estado (datos.gob.cl)',
  'Delegación Presidencial Regional de La Araucanía',
  'Delegación Presidencial Regional de Antofagasta',
  'Consejo de Monumentos Nacionales',
  'Municipalidad de Santiago',
  'Municipalidad de Santiago (munistgo.cl)',
  'Municipalidad de Antofagasta',
  'Municipalidad de Coquimbo',
  'Partido Republicano de Chile',
  'Embajada de China en Chile',
  'Centro de Estudios Públicos',
  'Foro Madrid',
  'La Vía Campesina',
  'Chile Mejor Sin TLC',
  'Observatorio de Datos UAI',
  'Universidad del Desarrollo (Ingeniería)',
  'Cuadernos del Centro de Estudios de Diseño y Comunicación (Universidad de Palermo)',
  'Tramas y Redes (CLACSO)',
  'OCMAL (Observatorio de Conflictos Mineros de América Latina)',
  'Federación de Trabajadores del Cobre (FTC)',
  'Museo Universitario Arte Contemporáneo (MUAC-UNAM)',
  'Andes Pediátrica (SciELO)',
  'Forensic Architecture',
  'Fundación Terram',
  'FASIC',
  'Vicaría de la Solidaridad',
  'Londres 38',
  'Human Rights Watch',
  'Programa de gobierno Kast 2025',
  'CentroCompetencia (PDF programa Kast 2022-2026)',
  'PiensaChile (PDF del documento filtrado)',
  'piensaChile',
  'RobotLabot (LaBot)',
  'Contapapaya (asesoría contable)',
  'Empresas Logros (blog)',
  'DecideChile (Unholster)',
  'Activa Research',
  'Criteria',
  'Cadem',
  'XTB Chile',
  'Alerta Prevencion (AGRICET)',
  'Scribd',
  'Scribd (documento filtrado)',
  'Facebook',
  'Instagram',
  'TikTok',
  'Telegram',
  'Google Drive (compilación ciudadana)',
  'Dropbox (compilación ciudadana)',
  'Imgur',
  // Subreddits distintos de r/chile: el org `reddit` es específico de r/chile;
  // los demás subreddits quedan como plataforma complementaria en la lista blanca.
  'Reddit r/RepublicadeChile',
  'Reddit (r/DataHoarder)',
  'Reddit r/iamatotalpieceofshit',
  'Towards Data Science (Medium)',
]);

let errors = 0;

function findDuplicates(list) {
  const seen = new Set();
  const dupes = new Set();
  for (const item of list) {
    if (seen.has(item)) dupes.add(item);
    seen.add(item);
  }
  return [...dupes];
}

function walkMd(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkMd(full));
    } else if (entry.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function eventIdFromPath(filePath) {
  const rel = relative(eventsDir, filePath);
  return rel.replace(/\.md$/, '').replace(/\\/g, '/');
}

const allFiles = walkMd(eventsDir);
const allEventIds = new Set(allFiles.map(eventIdFromPath));
// Also index by basename (e.g. "20250822-1") since relations use that format
const allEventBasenames = new Set(allFiles.map((f) => eventIdFromPath(f).split('/').pop()));

const referencedSources = new Set();
for (const file of allFiles) {
  const content = readFileSync(file, 'utf8');
  for (const match of content.matchAll(/\[\[source\/([A-Za-z0-9_.-]+)\]\]/g)) {
    referencedSources.add(match[1]);
  }
}
for (const id of validSourceIds) {
  if (!referencedSources.has(id)) {
    console.error(`✖ fuente huerfana en sources.yaml: "${id}" (no citada en ningun evento)`);
    errors++;
  }
}
for (const id of referencedSources) {
  if (!validSourceIds.has(id)) {
    console.error(`✖ fuente citada sin registrar en sources.yaml: "[[source/${id}]]"`);
    errors++;
  }
}

// Convención de medios: `medio:` debe ser el nombre canónico de una org de
// prensa o pertenecer a la lista blanca de instituciones/plataformas.
const MEDIA_ORG_TYPES_LABEL = [...MEDIA_ORG_TYPES].join(' / ');
for (const [id, src] of Object.entries(sourcesData)) {
  if (!src || typeof src.medio !== 'string' || src.medio.trim() === '') {
    console.error(`✖ fuente sin campo medio: "${id}"`);
    errors++;
    continue;
  }
  if (mediaOrgNames.has(src.medio)) continue;
  if (WHITELIST_MEDIOS.has(src.medio)) continue;
  console.error(
    `✖ medio "${src.medio}" no corresponde al nombre de una org de prensa (${MEDIA_ORG_TYPES_LABEL}) ni esta en la lista blanca → fuente "${id}". Registrar la org en entities.yaml o agregar a WHITELIST_MEDIOS en validate.mjs si es institucion/plataforma.`
  );
  errors++;
}

// Regla AGENTS.md (bitácora TAREAS): todo ID de evento marcado como ✅ hecho en
// TAREAS.md (patrón `✅ \`20260807-12\``) debe referenciar un archivo de evento
// EXISTENTE. Esto evita la colisión recurrente de IDs pre-asignados: entradas que
// apuntaban a `20260807-11/-12/-13` antes de que esos IDs fueran ocupados por otros
// eventos, dejando la fuente registrada sin evento real (fuentes huérfanas).
const tareasPath = join(process.cwd(), 'TAREAS.md');
try {
  const tareasContent = readFileSync(tareasPath, 'utf8');
  for (const match of tareasContent.matchAll(/✅\s*`(\d{8}-\d{1,3})`/g)) {
    const id = match[1];
    if (!allEventBasenames.has(id)) {
      console.error(`✖ TAREAS.md marca como hecho el evento "${id}" pero no existe ningun archivo con ese ID (¿colisión de ID pre-asignado?)`);
      errors++;
    }
  }
} catch (e) {
  console.error(`✖ no se pudo leer TAREAS.md para verificar IDs: ${e.message}`);
  errors++;
}

// Mojibake: el doble-encoding UTF-8 degrada títulos, notas y nombres canónicos.
// Firma C2/C3 + byte 0x80-0xBF: cubre tanto mayúsculas (Ñ→"Ã‘"=C2 91, Ó→C2 93,
// É→C2 89, Ú→C2 9A) como minúsculas (é→"Ã©"=C2 A9, í→C2 AD, ó→C2 B3, ú→C2 BA,
// ñ→"Ã±"=C2 B1). Un "Ã"/"Â" literal seguido de un carácter Latin-1 suplementario
// es prácticamente siempre mojibake (sin falsos positivos reales).
const MOJIBAKE_RE = /[\u00c2\u00c3][\u0080-\u00bf]/g;
for (const f of ['sources.yaml', 'entities.yaml', 'topics.yaml', 'colectivos.yaml', 'sectores.yaml']) {
  const raw = readFileSync(join(dataDir, f), 'utf8');
  const matches = raw.match(MOJIBAKE_RE);
  if (matches) {
    console.error(`✖ mojibake (doble-encoding UTF-8) en ${f}: ${matches.length} ocurrencia(s) — corregir acentos/ñ dañados`);
    errors++;
  }
}

const colectivosDupes = findDuplicates([...validColectivos]);
const sectoresDupes = findDuplicates([...validSectores]);
for (const d of colectivosDupes) {
  console.error(`✖ colectivo duplicado en colectivos.yaml: "${d}"`);
  errors++;
}
for (const d of sectoresDupes) {
  console.error(`✖ sector duplicado en sectores.yaml: "${d}"`);
  errors++;
}

for (const file of allFiles) {
  const content = readFileSync(file, 'utf8');
  const eventId = eventIdFromPath(file);

  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) continue;

  const fm = YAML.parse(fmMatch[1]);
  if (!fm) continue;

  // Validate tema (comma-separated string or array)
  const rawTemas = Array.isArray(fm.tema) ? fm.tema : fm.tema ? String(fm.tema).split(',') : [];
  const temas = rawTemas.map((t) => String(t).trim()).filter(Boolean);
  for (const t of temas) {
    if (!validTopicIds.has(t)) {
      console.error(`✖ tema "${t}" no existe en topics.yaml → ${eventId}`);
      errors++;
    }
  }

  // Validate relaciones
  if (fm.relaciones && typeof fm.relaciones === 'object') {
    for (const [tipo, targets] of Object.entries(fm.relaciones)) {
      const ids = Array.isArray(targets) ? targets : [targets];
      for (const id of ids) {
        if (typeof id === 'string' && !allEventIds.has(id) && !allEventBasenames.has(id)) {
          console.error(`✖ relacion "${tipo}: ${id}" no existe → ${eventId}`);
          errors++;
        }
      }
    }
  }

  // Regla AGENTS.md 13: el body de un evento no debe contener notas de editor
  // ni metainstrucciones de gestión (para eso existe TAREAS.md).
  const body = content.replace(/^---[\s\S]*?---/, '');
  const editorNote = body.match(
    /tareas\.md|nota de verificación|nota del editor|nota editorial|pendiente evento|queda pendiente de verificación|registrad[oa] para seguimiento|agenda de pendientes/i
  );
  if (editorNote) {
    console.error(`✖ metanota de editor en body → ${eventId}: "${editorNote[0]}"`);
    errors++;
  }

  // Regla AGENTS.md (respaldo ASCII de imagen): el campo `svg_backup` declara
  // `archivo` (ruta a un .svg en public/, render con <img> — sin XSS) o `svg`
  // (contenido inline, render con set:html). Nunca guardar un SVG sin
  // confirmación visual humana — la convención lo exige al generarlo en la web
  // externa. Si declara `fuente`, debe ser una URL http(s) de la imagen original.
  if (fm.svg_backup && typeof fm.svg_backup === 'object') {
    const sb = fm.svg_backup;
    if (typeof sb.archivo === 'string') {
      if (!sb.archivo.startsWith('/') || !/\.svg$/i.test(sb.archivo)) {
        console.error(`✖ svg_backup.archivo debe ser una ruta absoluta del sitio que termine en .svg → ${eventId}: "${sb.archivo}"`);
        errors++;
      } else {
        const publicPath = join(process.cwd(), 'public', sb.archivo.replace(/^\//, ''));
        if (!existsSync(publicPath)) {
          console.error(`✖ svg_backup.archivo no existe en public/ → ${eventId}: "${sb.archivo}" (esperado en ${publicPath})`);
          errors++;
        }
      }
    }
    if (typeof sb.svg === 'string' && sb.svg.trim() !== '') {
      if (!/^\s*<svg/i.test(sb.svg)) {
        console.error(`✖ svg_backup.svg no comienza con <svg (respaldo ASCII inválido) → ${eventId}`);
        errors++;
      } else if (/<script|\son\w+\s*=|javascript:/i.test(sb.svg)) {
        console.error(`✖ svg_backup.svg contiene código ejecutable (<script/on*/javascript:) — no permitido → ${eventId}`);
        errors++;
      } else if (sb.svg.length > 100_000) {
        console.error(`✖ svg_backup.svg excede 100.000 caracteres (${sb.svg.length}) → ${eventId}`);
        errors++;
      }
    }
    if (sb.fuente !== undefined && (typeof sb.fuente !== 'string' || !/^https?:\/\//.test(sb.fuente))) {
      console.error(`✖ svg_backup.fuente no es una URL http(s) válida → ${eventId}`);
      errors++;
    }
  }

  // Validate impacto.colectivos and impacto.sectores against YAML registries
  for (const [key, validIds] of [
    ['colectivos', validColectivos],
    ['sectores', validSectores],
  ]) {
    const raw = fm.impacto?.[key];
    if (!raw) continue;
    const ids = Array.isArray(raw) ? raw : String(raw).split(',');
    const clean = ids.map((i) => String(i).trim()).filter(Boolean);
    const dupes = findDuplicates(clean);
    for (const d of dupes) {
      console.error(`✖ ${key} duplicado en ${eventId}: "${d}"`);
      errors++;
    }
    for (const id of clean) {
      if (!validIds.has(id)) {
        console.error(`✖ ${key} "${id}" no existe en ${key}.yaml → ${eventId}`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\n✖ ${errors} error(es) de validación`);
  process.exit(1);
} else {
  console.log(`✔ ${allFiles.length} archivos validados`);
}
