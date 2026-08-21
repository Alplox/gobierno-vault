// Renderer de cliente: agrega tarjetas de organización al grid emitido por SSR.
// Lee el JSON embebido en <script type="application/json" id="orgs-index-data">.

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function orgCard(o) {
  const tipo = o.tipo
    ? `<p class="flex items-center gap-1.5 text-xs text-base-content/70 font-medium mt-1"><span>${esc(o.tipo)}</span></p>`
    : '';
  return `<a href="/organizations/${o.id}" class="group block border border-base-300 shadow-sm rounded-xl p-5 hover:border-primary/50 hover:shadow-md active:scale-[0.99] transition-all duration-200 bg-base-100">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <h3 transition:name="org-title-${o.id}" class="font-bold text-base-content text-base group-hover:text-primary transition-colors leading-snug">${esc(o.nombre)}</h3>
      ${tipo}
    </div>
    <span class="text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1">›</span>
  </div>
</a>`;
}

export function initOrgList() {
  if (window.__gvOrgListInit) return;
  window.__gvOrgListInit = true;

  const script = document.getElementById('orgs-index-data');
  const container = document.getElementById('orgs-index-root');
  const btn = document.getElementById('load-more-orgs');
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
    chunk.forEach((o) => container.insertAdjacentHTML('beforeend', orgCard(o)));
    state.i += chunk.length;
    if (btn) {
      btn.disabled = state.i >= data.length;
      const label = btn.querySelector('.org-more-label');
      if (label) label.textContent = `Cargar más organizaciones (${data.length - state.i} restantes)`;
    }
  }

  if (btn) btn.addEventListener('click', fill);
}
