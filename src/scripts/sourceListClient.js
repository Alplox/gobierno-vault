// Renderer de cliente: agrega filas de fuente al grid emitido por SSR.
// Lee el JSON embebido en <script type="application/json" id="sources-index-data">.
// La primera tanda la pinta el SSR; el resto se agrega bajo demanda con "Cargar más fuentes".

const TIPO_LABELS = {
  oficial: 'Oficial', prensa: 'Prensa', agencia: 'Agencia',
  documento: 'Documento', entrevista: 'Entrevista', video: 'Video',
  audio: 'Audio', red_social: 'Red social', tribunal: 'Tribunal',
  parlamento: 'Parlamento', organismo_internacional: 'Organismo internacional',
  base_de_datos: 'Base de datos',
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function sourceRow(s) {
  const fecha = s.fechaStr
    ? `<span class="inline-flex items-center gap-1"><span>${esc(s.fechaStr)}</span></span>`
    : '';
  return `<div class="group block border border-gray-200/80 shadow-sm rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200 bg-white">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <a transition:name="source-title-${s.id}" href="/sources/${s.id}" class="font-bold text-gray-900 text-base leading-snug group-hover:text-blue-600 transition-colors block">${esc(s.titulo)}</a>
      <div class="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-500">
        <span class="font-semibold text-gray-700">${esc(s.medio)}</span>
        <span>·</span>
        <span class="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-0.5 font-medium text-gray-600"><span>${TIPO_LABELS[s.tipo] || esc(s.tipo)}</span></span>
        <span>·</span>
        ${fecha}
      </div>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">${s.eventCount} ${s.eventCount === 1 ? 'evento' : 'eventos'}</span>
      <a href="/sources/${s.id}" class="p-1 text-gray-300 group-hover:text-blue-600 transition-colors"><span class="block text-lg leading-none">›</span></a>
    </div>
  </div>
</div>`;
}

export function initSourceList() {
  if (window.__gvSourceListInit) return;
  window.__gvSourceListInit = true;

  const script = document.getElementById('sources-index-data');
  const container = document.getElementById('sources-index-root');
  const btn = document.getElementById('load-more-sources');
  if (!script || !container) return;
  let data = [];
  try {
    data = JSON.parse(script.textContent || '[]');
  } catch {
    return;
  }
  if (!data.length) return;

  const state = { i: 0, batch: 40 };

  function fill() {
    const chunk = data.slice(state.i, state.i + state.batch);
    chunk.forEach((s) => container.insertAdjacentHTML('beforeend', sourceRow(s)));
    state.i += chunk.length;
    if (btn) {
      btn.disabled = state.i >= data.length;
      const label = btn.querySelector('.source-more-label');
      if (label) label.textContent = `Cargar más fuentes (${data.length - state.i} restantes)`;
    }
  }

  if (btn) btn.addEventListener('click', fill);
}
