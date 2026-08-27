import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const base = '.agents/skills-workspace/iteration-1';
const evals = [
  { id: 'eval-0', title: 'MOP Carretera Austral — creación de evento con fuente directa', with: 'eval-0-with_skill', without: 'eval-0-without_skill' },
  { id: 'eval-1', title: 'Búsqueda Catálogo Sitemaps — Cancerbero', with: 'eval-1-with_skill', without: 'eval-1-without_skill' },
  { id: 'eval-2', title: 'Agregar persona SEREMI + wikilink enforcement', with: 'eval-2-with_skill', without: 'eval-2-without_skill' },
];

function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function read(p){ try { return readFileSync(p,'utf8'); } catch { return '(no output)'; } }

let html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Skills — Evaluación Iteración 1 (con vs sin skill)</title>
<style>
:root{ --bg:#fafafa; --fg:#1a1a1a; --muted:#666; --border:#e5e7eb; --accent:#0f766e; --accent-light:#ccfbf1; }
*{box-sizing:border-box}
body{margin:0;font-family: ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; background:var(--bg); color:var(--fg); line-height:1.5}
header{padding:24px 32px; background:white; border-bottom:1px solid var(--border); position:sticky; top:0; z-index:10}
header h1{margin:0 0 6px; font-size:22px}
header p{margin:0; color:var(--muted); font-size:13px}
nav{padding:12px 32px; display:flex; gap:8px; flex-wrap:wrap; background:white; border-bottom:1px solid var(--border); position:sticky; top:81px; z-index:9}
nav a{padding:6px 12px; border:1px solid var(--border); border-radius:999px; text-decoration:none; color:var(--fg); font-size:13px; background:white}
nav a:hover{border-color:var(--accent); color:var(--accent)}
.eval{margin:24px 32px; background:white; border:1px solid var(--border); border-radius:12px; overflow:hidden}
.eval-head{padding:16px 20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; gap:16px; background:linear-gradient(to right, #f0fdfa, white)}
.eval-head h2{margin:0; font-size:16px}
.eval-head .meta{font-size:12px; color:var(--muted)}
.grid{display:grid; grid-template-columns:1fr 1fr; gap:0}
.col{padding:0; border-right:1px solid var(--border); min-width:0}
.col:last-child{border-right:none}
.col-head{padding:10px 16px; font-weight:600; font-size:13px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px}
.col-head.with{background:var(--accent-light); color:#134e4a}
.col-head.without{background:#fef3c7; color:#92400e}
pre{margin:0; padding:16px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size:12.5px; white-space:pre-wrap; word-break:break-word; max-height:70vh; overflow:auto; background:#fff}
.log{margin:12px 16px; padding:12px; background:#f9fafb; border:1px dashed var(--border); border-radius:8px; font-size:12px; color:var(--muted)}
.log b{color:var(--fg)}
footer{padding:24px 32px; color:var(--muted); font-size:12px}
@media(max-width:900px){ .grid{grid-template-columns:1fr} .col{border-right:none; border-bottom:1px solid var(--border)} .col:last-child{border-bottom:none} }
</style>
</head>
<body>
<header>
<h1>Skills — Iteración 1: con skill vs sin skill</h1>
<p>Workspace: <code>.agents/skills-workspace/iteration-1/</code> — 3 evals × 2 condiciones (with_skill / without_skill). El lado izquierdo es <b>con skill</b> (leyó SKILL.md), el derecho es baseline sin skill.</p>
</header>
<nav>
${evals.map(e=>`<a href="#${e.id}">${e.title}</a>`).join('')}
<a href="#resumen">Resumen</a>
</nav>
`;

for(const e of evals){
  const withOut = read(join(base, e.with, 'output.md'));
  const withLog = read(join(base, e.with, 'log.txt'));
  const woOut = read(join(base, e.without, 'output.md'));
  const woLog = read(join(base, e.without, 'log.txt'));
  html += `
<section id="${e.id}" class="eval">
<div class="eval-head"><h2>${esc(e.title)}</h2><span class="meta">${e.id}</span></div>
<div class="grid">
<div class="col">
<div class="col-head with">✅ Con skill <span style="font-weight:400; opacity:.7">— ${e.with}</span></div>
<pre>${esc(withOut)}</pre>
<div class="log"><b>Log con skill:</b><br>${esc(withLog).replace(/\n/g,'<br>')}</div>
</div>
<div class="col">
<div class="col-head without">❌ Sin skill <span style="font-weight:400; opacity:.7">— ${e.without}</span></div>
<pre>${esc(woOut)}</pre>
<div class="log"><b>Log sin skill:</b><br>${esc(woLog).replace(/\n/g,'<br>')}</div>
</div>
</div>
</section>`;
}

html += `
<section id="resumen" class="eval" style="background:#fff">
<div class="eval-head"><h2>Resumen — qué gana el skill</h2></div>
<div style="padding:16px 20px; font-size:13px">
<ul>
<li><b>Eval-0 (MOP):</b> con skill usa frontmatter tipado + <code>[[org/ministerio_obras_publicas]]</code> + <code>[[person/louis_de_grange]]</code> + <code>[[cifra/...]]</code> + fuente primaria <code>mop.gob.cl/noticias/</code> como <code>[1]</code> inline y explica verificación anti-sesgo; sin skill usa texto plano “MOP” y bloque <code>## Referencias</code> sin URLs.</li>
<li><b>Eval-1 (sitemaps):</b> con skill usa <code>rg -i --no-heading -uu -g '*.jsonl'</code> y explica JSONL + escalera <code>fetch-content</code>; sin skill hace 2 <code>websearch</code> genéricos sin tocar <code>sitemaps/</code>.</li>
<li><b>Eval-2 (persona):</b> con skill usa <code>people: maria_gonzalez</code> snake_case + <code>[[person/maria_gonzalez]]</code> + detección <code>proseNames.mjs</code> + <code>fix-prose-wikilinks.mjs --dry-run</code>; sin skill pone <code>María González</code> sin wikilink (falla <code>validate.mjs</code>).</li>
</ul>
<p style="color:var(--muted)">Abre este archivo con doble clic (file://) o sírvelo con <code>npx serve .agents/skills-workspace/iteration-1</code>. Los <code>output.md</code> originales quedan en cada carpeta <code>eval-*/</code> para copiar feedback a <code>feedback.json</code>.</p>
</div>
</section>
<footer>Generado por <code>scripts/generate-eval-viewer.mjs</code> — iteración 1. Para iteración 2, re-ejecutar con <code>--previous-workspace</code> y comparar.</footer>
</body>
</html>`;

writeFileSync(join(base, 'index.html'), html, 'utf8');
console.log(`✔ Generado ${join(base, 'index.html')} (${(html.length/1024).toFixed(1)} KB)`);
