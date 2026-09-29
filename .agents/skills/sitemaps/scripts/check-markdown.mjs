// Verificador de las reglas de markdownlint que aplican a los markdown GENERADOS por
// este skill (los abre el VS Code con la extensión markdownlint activa):
//   MD058 tabla sin línea en blanco arriba/abajo · MD022 encabezado sin blanco
//   MD033 HTML inline (<lastmod> se interpreta como etiqueta) · MD034 URL desnuda
//   MD012 dos líneas en blanco seguidas
// Ignora lo que está dentro de un span de código o de un enlace [texto](url).
// Uso: node .agents/skills/sitemaps/scripts/check-markdown.mjs [<archivo.md>...]
//      (sin argumentos revisa TAREAS/tareas_sitemap.md, sitemaps/MEDIOS.md,
//       sitemaps/README.md). Sale con código ≠ 0 si algo falla.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

// scripts/ → sitemaps/ → skills/ → .agents/ → raíz del repo (4 niveles).
const RAIZ = fileURLToPath(new URL('../../../../', import.meta.url));
const porDefecto = ['TAREAS/tareas_sitemap.md', 'sitemaps/MEDIOS.md', 'sitemaps/README.md'];
const archivos = process.argv.slice(2).length ? process.argv.slice(2) : porDefecto;
let total = 0;

// Caracteres que viven dentro de un span de código: no se analizan como texto.
const marcarCodigo = (l) => {
  const mask = new Array(l.length).fill(false);
  let dentro = false;
  for (let i = 0; i < l.length; i++) {
    if (l[i] === '`') dentro = !dentro;
    mask[i] = dentro;
  }
  return mask;
};

for (const rel of archivos) {
  const path = rel.includes('/') || rel.includes('\\') ? rel : RAIZ + rel;
  if (!fs.existsSync(path)) {
    console.log(`${rel}: no existe`);
    total++;
    continue;
  }
  const raw = fs.readFileSync(path, 'utf8').split('\n');
  const codigo = raw.map(marcarCodigo);
  // Las cercas ``` … ```also son código: markdownlint no las analiza y este
  // checker tampoco (los ejemplos en vivo de este skill traen URLs y etiquetas).
  const enCerca = new Array(raw.length).fill(false);
  let fence = null;
  for (let i = 0; i < raw.length; i++) {
    const m = raw[i].match(/^\s*(```+|~~~+)/);
    if (m) {
      if (fence === null) fence = m[1][0];
      else if (m[1][0] === fence) fence = null;
      enCerca[i] = true;
      continue;
    }
    enCerca[i] = fence !== null;
  }
  const errores = [];
  const vacia = (i) => raw[i] === undefined || raw[i].trim() === '';
  const fila = (i) => raw[i] !== undefined && raw[i].startsWith('|');
  const head = (i) => raw[i] !== undefined && /^#{1,6}\s/.test(raw[i]);

  for (let i = 0; i < raw.length; i++) {
    if (enCerca[i]) continue;
    if (fila(i) && !fila(i - 1) && i > 0 && !vacia(i - 1)) errores.push(`MD058:${i + 1} tabla sin blanco arriba`);
    if (fila(i) && !fila(i + 1) && !vacia(i + 1)) errores.push(`MD058:${i + 1} tabla sin blanco abajo`);
    if (head(i) && i > 0 && !vacia(i - 1)) errores.push(`MD022:${i + 1} encabezado sin blanco arriba`);
    if (head(i) && i < raw.length - 1 && !vacia(i + 1)) errores.push(`MD022:${i + 1} encabezado sin blanco abajo`);
    if (raw[i] === '' && raw[i - 1] === '') errores.push(`MD012:${i + 1} dos blancos seguidos`);

    const limpio = raw[i].replace(/\[([^\]]*)\]\([^)]*\)/g, (m) => ' '.repeat(m.length));
    for (let j = 0; j < limpio.length; j++) {
      if (codigo[i][j]) continue;
      const tag = limpio.slice(j).match(/^<\/?[a-zA-Z][^>]*>/);
      // <https://…> es un autolink válido de markdown, no HTML inline.
      if (tag && !/^<\/?https?:\/\//.test(tag[0])) {
        errores.push(`MD033:${i + 1} HTML inline ${tag[0]}`);
        break;
      }
    }
    const url = limpio.match(/(?<![\w(`<])https?:\/\/\S+/);
    if (url) errores.push(`MD034:${i + 1} URL desnuda ${url[0].slice(0, 50)}`);
  }

  total += errores.length;
  console.log(`${rel}: ${raw.length} líneas · ${errores.length} problemas`);
  for (const e of errores.slice(0, 20)) console.log('  ' + e);
  if (errores.length > 20) console.log(`  … y ${errores.length - 20} más`);
}

process.exit(total ? 1 : 0);
