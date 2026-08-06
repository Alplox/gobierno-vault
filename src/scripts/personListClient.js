// Renderer de cliente: agrega tarjetas de persona al grid emitido por SSR.
// Lee el JSON embebido en <script type="application/json" id="people-index-data">.
// La primera tanda la pinta el SSR; el resto se agrega bajo demanda con "Cargar personas".

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function personCard(p) {
  const cargo = p.cargo
    ? `<p class="flex items-center gap-1.5 text-xs text-gray-600 font-medium mt-1"><svg class="h-3.5 w-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg><span>${esc(p.cargo)}</span></p>`
    : '';
  const org = p.organizacion
    ? `<p class="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><svg class="h-3.5 w-3.5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/></svg><span>${esc(p.organizacion)}</span></p>`
    : '';

  return `<a href="/people/${p.id}" class="group block border border-gray-200/80 shadow-sm rounded-xl p-5 hover:border-blue-300 hover:shadow-md active:scale-[0.99] transition-all duration-200 bg-white">
  <div class="flex items-start gap-4">
    <div class="h-16 w-12 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"><svg class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
    <div class="min-w-0 flex-1">
      <h3 transition:name="person-title-${p.id}" class="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors leading-snug">${esc(p.nombre)}</h3>
      ${cargo}
      ${org}
    </div>
    <svg class="h-5 w-5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
  </div>
</a>`;
}

export function initPersonList() {
  if (window.__gvPersonListInit) return;
  window.__gvPersonListInit = true;

  const script = document.getElementById('people-index-data');
  const container = document.getElementById('people-index-root');
  const btn = document.getElementById('load-more-people');
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
    chunk.forEach((p) => container.insertAdjacentHTML('beforeend', personCard(p)));
    state.i += chunk.length;
    if (btn) {
      btn.disabled = state.i >= data.length;
      const label = btn.querySelector('.person-more-label');
      if (label) label.textContent = `Cargar más personas (${data.length - state.i} restantes)`;
    }
  }

  if (btn) btn.addEventListener('click', fill);
}