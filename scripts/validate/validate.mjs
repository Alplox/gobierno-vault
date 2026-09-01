import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';
import { buildPeopleIndex, findReplaceableMentions } from '../lib/proseNames.mjs';

const root = join(process.cwd(), 'src');
const dataDir = join(root, 'data');
const eventsDir = join(root, 'content', 'events');

function readYaml(filename) {
  try {
    return YAML.parse(readFileSync(join(dataDir, filename), 'utf8')) ?? {};
  } catch (e) {
    try {
      const map = { 'sources.yaml': 'sources', 'topics.yaml': 'topics' };
      const coll = map[filename];
      if (coll) {
        const dir = join(process.cwd(), 'src', 'content', coll);
        if (existsSync(dir)) {
          const rec = {};
          for (const f of readdirSync(dir).filter(f=>f.endsWith('.md'))) {
            const id = f.replace(/\.md$/, '');
            const raw = readFileSync(join(dir, f), 'utf8');
            const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
            if (m) rec[id] = YAML.parse(m[1]);
          }
          if (Object.keys(rec).length) return rec;
        }
      }
      if (filename === 'entities.yaml') {
        const rec = { people: {}, organizations: {}, cifras: {} };
        let found = false;
        for (const [dir, key] of [[join(process.cwd(),'src/content/people'),'people'],[join(process.cwd(),'src/content/organizations'),'organizations'],[join(process.cwd(),'src/content/cifras'),'cifras']]) {
          if (existsSync(dir)) {
            for (const f of readdirSync(dir).filter(f=>f.endsWith('.md'))) {
              const id = f.replace(/\.md$/, '');
              const raw = readFileSync(join(dir, f), 'utf8');
              const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
              if (m) { rec[key][id] = YAML.parse(m[1]); found = true; }
            }
          }
        }
        if (found) return rec;
      }
    } catch {}
    console.error(`✖ YAML inválido en src/data/${filename}: ${e.message.split('\n')[0]}`);
    console.error(`  Causa típica: edición concurrente, caracteres reservados sin citar (ej. "autor: @usuario") o líneas basura de un grabado con encoding incorrecto (PowerShell Set-Content/Out-File).`);
    process.exit(1);
  }
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
const peopleData = entitiesData.people ?? {};
const cifrasData = entitiesData.cifras ?? {};
// Índice de personas para la regla de wikilinks en prosa (AGENTS.md n.º 8).
// Misma lógica que scripts/fix-prose-wikilinks.mjs (backlog).
const peopleProseIndex = buildPeopleIndex(peopleData);
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
  'Cámara de Diputados',
  'Cámara de Diputadas y Diputados',
  'Voto Visible',
  'Sociedad de Fomento Fabril',
  'Partido Socialista de Chile',
  'Gobierno de Chile',
  'Puig Abogados',
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
  'Ministerio de Educación',
  'Fast Check CL',
  'AIM Chile',
  'Ministerio del Interior',
  'Subsecretaria del Interior',
  'Subsecretaría del Interior',
  'Ministerio de Obras Públicas',
  'Ministerio de Vivienda y Urbanismo',
  'Ministerio del Trabajo y Previsión Social',
  'Ministerio de Economía, Fomento y Turismo',
  'Ministerio de Justicia',
  'Ministerio de Justicia y Derechos Humanos (Subsecretaría de DDHH)',
  'Ministerio de Minería de Chile',
  'Ministerio de Seguridad Pública',
  'Ministerio de Relaciones Exteriores',
  'Ministerio Secretaría General de Gobierno',
  'Contraloría General de la República',
  'Defensoría de la Niñez',
  'Instituto de Previsión Social (IPS)',
  'Poder Judicial de Chile',
  'Tribunal de la Libre Competencia',
  'Tribunal de Defensa de la Libre Competencia',
  'Fiscalía Nacional Económica',
  'Fiscalía de Chile (División de Estudios, Unidad de DDHH)',
  'FinCEN (Departamento del Tesoro de EE.UU.)',
  'Departamento de Estado de EE.UU.',
  'Electronic Frontier Foundation (EFF)',
  'IRS (Servicio de Impuestos Internos de EE.UU.)',
  'Unidad de Información Financiera de Italia (UIF - Banca d Italia)',
  'SAG',
  'Servicio Electoral (Servel)',
  'Servicio de Evaluación Ambiental',
  'Dirección de Presupuestos (DIPRES)',
  'Ministerio del Medio Ambiente',
  'Ministerio del Medio Ambiente (MMA)',
  'Universidad Austral de Chile',
  'Tesorería General de la República',
  'Instituto Nacional de Estadísticas (INE)',
  'Banco Central de Chile',
  'Codelco',
  'Archivo Nacional de Chile',
  'Biblioteca del Congreso Nacional',
  'Biblioteca del Congreso Nacional (LeyChile)',
  'Biblioteca del Congreso Nacional (Ley Chile)',
  'Comisión Económica para América Latina y el Caribe (CEPAL)',
  'Subsecretaría de Telecomunicaciones',
  'Diario Oficial de la República de Chile',
  'Cuerpo de Bomberos de Chile',
  'BCN Historia de la Ley',
  'Wikipedia',
  'Comisión para la Fijación de Remuneraciones',
  'Servicio de Impuestos Internos (SII)',
  'ChileAtiende',
  'Observatorio Social (MDS)',
  'El Universo',
  'Actualidad Jurídica DOE',
  'Portal de Datos Abiertos del Estado (datos.gob.cl)',
  'Portal de Transparencia',
  'Delegación Presidencial Regional de La Araucanía',
  'Delegación Presidencial Regional de Antofagasta',
  'Consejo de Monumentos Nacionales',
  'Municipalidad de Santiago',
  'Municipalidad de Santiago (munistgo.cl)',
  'Municipalidad de Antofagasta',
  'Federación CCU',
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
  'CLAPES UC',
  'Instituto Nacional de Derechos Humanos',
  'Fiscalía de Chile',
  'Amnistía Internacional Chile',
  'Consejo para la Transparencia (CPLT)',
  'Carabineros de Chile',
  'BCN (Ley Chile)',
  'SUSESO (Superintendencia de Seguridad Social)',
  'XTB Chile',
  'Alerta Prevencion (AGRICET)',
  'Scribd',
  'Scribd (documento filtrado)',
  'Facebook',
  'Instagram',
  'Movilh',
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
  'InSight Crime',
  'OECO (Observatorio Ecuatoriano de Crimen Organizado)',
  'Banco Mundial',
  'Vergara 240 (Escuela de Periodismo UDP)',
  'Hudson Rock',
  'Conadecus',
  'Economía y Negocios',
  'El Rancagüino',
  'Región XV',
  'Vilas Radio',
  'Servicio Nacional de Migraciones',
  'El Carrerino',
  'Ministerio de Obras Públicas',
  'Tribunal Constitucional de Chile',
  'Tribunal Constitucional',
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
  for (const match of content.matchAll(/\[\[(?:source|sources)\/([A-Za-z0-9_.-]+)\]\]/g)) {
    referencedSources.add(match[1]);
  }
}
// Fuentes referenciadas desde src/data/sueldos.yaml (página /sueldos): cuentan
// como citadas. Estructura: orden_refs[] + fuentes de sección + vigencias[].fuente.
try {
  const sueldos = YAML.parse(readFileSync(join(process.cwd(), 'src', 'data', 'sueldos.yaml'), 'utf8'));
  const pushRef = (id) => { if (id) referencedSources.add(id); };
  for (const id of sueldos.orden_refs ?? []) pushRef(id);
  pushRef(sueldos.segundo_piso?.fuente);
  pushRef(sueldos.topes_dipres?.fuente);
  pushRef(sueldos.ipc?.registro_presidente_mayo_2026?.fuente);
  for (const p of sueldos.presidentes ?? []) {
    for (const v of p.vigencias ?? []) pushRef(v.fuente);
  }
} catch {
  // sueldos.yaml ausente o ilegible: no aporta referencias (los errores propios
  // de esa página se detectan en el build de Astro).
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
// la bitácora (patrón `✅ \`20260807-12\``, repartida en TAREAS/PENDIENTES/*.md +
// TAREAS/SEGUIMIENTO/*.md y TAREAS/SEGUIMIENTO_INDEX.md) debe referenciar un archivo de evento EXISTENTE. Esto evita la colisión recurrente
// de IDs pre-asignados: entradas que apuntaban a `20260807-11/-12/-13` antes de que
// esos IDs fueran ocupados por otros eventos, dejando la fuente registrada sin evento
// real (fuentes huérfanas).
function readTareasMarkdown() {
  const chunks = [];
  const root = process.cwd();
  const scan = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) scan(p);
      else if (e.isFile() && e.name.endsWith('.md')) chunks.push(readFileSync(p, 'utf8'));
    }
  };
  const dir = join(root, 'TAREAS');
  if (existsSync(dir)) scan(dir);
  return chunks.join('\n');
}
try {
  const tareasContent = readTareasMarkdown();
  for (const match of tareasContent.matchAll(/✅\s*`(\d{8}-\d{1,3})`/g)) {
    const id = match[1];
    if (!allEventBasenames.has(id)) {
      console.error(`✖ TAREAS/ marca como hecho el evento "${id}" pero no existe ningun archivo con ese ID (¿colisión de ID pre-asignado?)`);
      errors++;
    }
  }
} catch (e) {
  console.error(`✖ no se pudo leer TAREAS/ para verificar IDs: ${e.message}`);
  errors++;
}

// Mojibake: doble-encoding UTF-8 y round-trips ANSI degradan títulos, notas y nombres.
// Firma C2/C3 + byte 0x80-0xBF: doble-encoding clásico (Ã©, Ã±...).
// Además: controles C1 (0080-009F) = UTF-8 leído como CP1252 (ej. em-dash "â€”"),
// U+FFFD (reemplazo), cirílico y Latin Ext-A/B (basura de round-trips ANSI;
// el vault es español — ningún nombre legítimo usa esos rangos).
const MOJIBAKE_RE = /[\u00c2\u00c3][\u0080-\u00bf]|[\u0080-\u009f\uFFFD\u0400-\u04ff\u0100-\u024f]/g;
const mojibakeScan = new RegExp(MOJIBAKE_RE.source, 'g');
for (const f of ['sources.yaml', 'entities.yaml', 'topics.yaml', 'colectivos.yaml', 'sectores.yaml']) {
  let raw;
  try { raw = readFileSync(join(dataDir, f), 'utf8'); } catch (e) {
    // Fallback markdown: si el YAML fue migrado a src/content/*, revisar .md en vez de fallar
    const map = { 'sources.yaml': 'sources', 'topics.yaml': 'topics', 'entities.yaml': null };
    if (map[f]) {
      const dir = join(process.cwd(), 'src', 'content', map[f]);
      if (existsSync(dir)) { raw = ''; for (const mf of readdirSync(dir).filter(f=>f.endsWith('.md'))) { try { raw += '\n' + readFileSync(join(dir, mf), 'utf8'); } catch {} } }
      else throw e;
    } else if (f === 'entities.yaml') {
      raw = '';
      for (const coll of ['people','organizations','cifras']) {
        const d = join(process.cwd(), 'src', 'content', coll);
        if (existsSync(d)) for (const mf of readdirSync(d).filter(f=>f.endsWith('.md'))) { try { raw += '\n' + readFileSync(join(d, mf), 'utf8'); } catch {} }
      }
      if (!raw) throw e;
    } else throw e;
  }
  const matches = raw.match(mojibakeScan);
  if (matches) {
    const lines = raw.split(/\r?\n/);
    const sample = [];
    for (let li = 0; li < lines.length && sample.length < 3; li++) {
      mojibakeScan.lastIndex = 0;
      if (mojibakeScan.test(lines[li])) sample.push(`    línea ${li + 1}: ${lines[li].trim().slice(0, 90)}`);
    }
    console.error(`✖ mojibake/carácter inválido en src/data/${f}: ${matches.length} ocurrencia(s) — corregir acentos/ñ/em-dashes dañados`);
    for (const s of sample) console.error(s);
    errors++;
  }
}

// Prevención (incidente 23-ago-2026): los archivos de la bitácora TAREAS/ no se
// parsean como YAML ni participan en el build de Astro, así que un grabado con
// encoding incorrecto (PowerShell 5.1: Get-Content asume ANSI en archivos sin
// BOM + Set-Content -Encoding UTF8 re-escribe con doble codificación y BOM)
// llegaba a commit sin que ningún chequeo lo detectara. Se aplica el mismo
// MOJIBAKE_RE de los YAML y además se rechaza el BOM UTF-8.
function walkTareasFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) files.push(...walkTareasFiles(p));
    else if (e.isFile() && e.name.endsWith('.md')) files.push(p);
  }
  return files;
}
for (const f of walkTareasFiles(join(process.cwd(), 'TAREAS'))) {
  const raw = readFileSync(f, 'utf8');
  const rel = relative(process.cwd(), f).replace(/\\/g, '/');
  const problems = [];
  if (raw.charCodeAt(0) === 0xfeff) {
    problems.push('BOM UTF-8 al inicio (guardado por una herramienta que antepone BOM — re-guardar como utf8 sin BOM)');
  }
  const matches = raw.match(mojibakeScan);
  if (matches) {
    problems.push(`${matches.length} ocurrencia(s) de doble-codificación/carácter inválido — corregir acentos/ñ/em-dashes/emojis dañados`);
    const lines = raw.split(/\r?\n/);
    for (let li = 0; li < lines.length && problems.length < 4; li++) {
      mojibakeScan.lastIndex = 0;
      if (mojibakeScan.test(lines[li])) problems.push(`    línea ${li + 1}: ${lines[li].trim().slice(0, 90)}`);
    }
  }
  if (problems.length > 0) {
    console.error(`✖ encoding inválido en ${rel}: ${problems[0]}`);
    for (const s of problems.slice(1)) console.error(s);
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

  // CRLF-tolerante: con core.autocrlf=true el checkout de Windows entrega
  // archivos con \r\n; si la regex exigiera \n a secas, se saltarían en silencio
  // ~2/3 de los eventos (bug real: 639 de 949 archivos nunca se validaban).
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
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

  // Wikilinks del body: replica la resolucion de remarkWikiLinks.mjs (que corre
  // en build) para detectar wikilinks rotos ANTES del build. Paridad con el
  // plugin: source/person/org/event se validan contra sus registries; cifra NO
  // se valida (el plugin no la valida en build); los IDs de evento desnudos
  // (\b20\d{6}-\d{1,3}\b) solo se enlazan si existen y no son error si no.
  // El plugin solo procesa nodos `text` del arbol markdown, asi que se excluyen
  // bloques de codigo fenced (```) e inlineCode (\`...\`) para evitar falsos
  // positivos en ejemplos/documentacion dentro del body.
  const body = content.replace(/^---[\s\S]*?---/, '');
  const noCode = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]*`/g, '');
  const WIKILINK_RE = /\[\[(sources?|people|person|organizations?|org|cifras?|cifra|events?|event)\/([A-Za-z0-9_.-]+)(?:\/(-?[\d.,]+)(?:\/([^\]]+))?)?\]\]/g;
  for (const m of noCode.matchAll(WIKILINK_RE)) {
    const [, rawType, id] = m;
    const type = rawType === 'people' ? 'person' : rawType === 'organizations' || rawType === 'organization' ? 'org' : rawType === 'sources' ? 'source' : rawType === 'cifras' ? 'cifra' : rawType === 'events' ? 'event' : rawType;
    if (type === 'source' && !validSourceIds.has(id)) {
      console.error(`✖ wikilink roto [[${rawType}/${id}]] → ${eventId} (fuente no registrada)`);
      errors++;
    } else if (type === 'person' && !peopleData[id]) {
      console.error(`✖ wikilink roto [[${rawType}/${id}]] → ${eventId} (persona no registrada)`);
      errors++;
    } else if (type === 'org' && !orgsData[id]) {
      console.error(`✖ wikilink roto [[${rawType}/${id}]] → ${eventId} (org no registrada)`);
      errors++;
    } else if (type === 'event' && !allEventBasenames.has(id)) {
      console.error(`✖ wikilink roto [[${rawType}/${id}]] → ${eventId} (no existe evento con ese ID)`);
      errors++;
    }
  }

  // Regla AGENTS.md n.º 8: toda mención de una persona en el body debe llevar
  // [[person/id]] — no solo la primera. Replica la misma lógica que el fixer
  // (scripts/proseNames.mjs); si queda alguna mención reemplazable es un error
  // (correr node scripts/fix-prose-wikilinks.mjs para limpiar el backlog).
  const { mentions: proseMentions } = findReplaceableMentions(body, peopleProseIndex);
  if (proseMentions.length > 0) {
    const examples = proseMentions
      .slice(0, 5)
      .map((m) => `"${m.phrase}" → [[person/${m.personId}]]`)
      .join('; ');
    const extra = proseMentions.length > 5 ? ` y ${proseMentions.length - 5} más` : '';
    console.error(
      `✖ ${proseMentions.length} mención(es) de persona en prosa sin wikilink → ${eventId}: ${examples}${extra} (fix: node scripts/fix-prose-wikilinks.mjs)`
    );
    errors++;
  }

  // Referencias a la bitácora TAREAS (la carpeta siempre en mayúsculas) o al viejo
  // TAREAS.md: case-sensitive para no confundir con la palabra común "tareas".
  const tareasRef = body.match(/\bTAREAS(?:\/|\.md|\b)/);
  // Frases de metanota de editor en minúsculas (case-insensitive).
  const editorNote = body.match(
    /nota de verificación|nota del editor|nota editorial|pendiente evento|queda pendiente de verificación|registrad[oa] para seguimiento|agenda de pendientes|pendiente de validación cruzada|validación cruzada|pendiente de reacciones|pendiente el desenlace|matiz sobre sesgo|no se agregan como fuentes|complementarios por definición|reduce el riesgo de reinterpretación|medio con línea editorial/i
  );
  const note = tareasRef ? tareasRef[0] : (editorNote ? editorNote[0] : null);
  if (note) {
    console.error(`✖ metanota de editor en body → ${eventId}: "${note}"`);
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
