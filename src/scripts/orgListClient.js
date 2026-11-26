// Renderer + filtros del índice de organizaciones.
// SSR emite las primeras tarjetas; el resto viaja en #orgs-index-data y se
// inserta por scroll (IntersectionObserver). Los filtros se aplican en cliente
// con los data-* de TODAS las tarjetas, sin depender de las fichas individuales.

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function orgCard(o) {
  const tipo = o.tipo
    ? `<p class="flex items-center gap-1.5 text-xs text-base-content/80 font-medium mt-1"><span>${esc(o.tipo)}</span></p>`
    : '';
  return `<a data-org-card data-id="${esc(o.id)}" data-tipo="${esc(o.tipo || '')}" data-pais="${esc(o.pais || '')}" data-search="${esc(o.search || norm(o.nombre))}" href="/organization?id=${encodeURIComponent(o.id)}" class="org-card group block rounded-xl p-5 bg-base-100 border-0 shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96] transition-[box-shadow,scale,border-color] duration-200 ease-out">
  <div class="flex items-start justify-between gap-3">
    <div class="min-w-0 flex-1">
      <h3 class="font-bold text-base-content text-base group-hover:text-base-content transition-colors leading-snug">${esc(o.nombre)}</h3>
      ${tipo}
    </div>
    <span class="text-base-content/30 group-hover:text-base-content group-hover:translate-x-0.5 transition-[translate,color] duration-200 ease-out shrink-0 mt-1">›</span>
  </div>
</a>`;
}

let cleanupFns = [];

export function initOrgList() {
  const script = document.getElementById('orgs-index-data');
  // page-load también dispara en la carga inicial: sin este guard el segundo
  // init limpiaría el sentinel que acaba de crear el primero.
  if (script && script.__gvLoaded) return;
  if (script) script.__gvLoaded = true;

  const container = document.getElementById('orgs-index-root');
  const sentinel = document.getElementById('orgs-sentinel');
  const qEl = document.getElementById('org-q');
  const tipoEl = document.getElementById('org-tipo');
  const paisEl = document.getElementById('org-pais');
  const countEl = document.getElementById('org-count');
  if (!script || !container) return;

  let data = [];
  try { data = JSON.parse(script.textContent || '[]'); } catch { return; }

  const totalNode = document.getElementById('orgs-total');
  const total = Number(totalNode?.textContent || data.length) || data.length;
  const state = { i: 0, batch: 40 };
  let observer = null;
  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];

  function fill(apply = true) {
    if (state.i >= data.length) return;
    const chunk = data.slice(state.i, state.i + state.batch);
    container.insertAdjacentHTML('beforeend', chunk.map(orgCard).join(''));
    state.i += chunk.length;
    if (apply) applyFilters();
  }

  function forceFillAll() {
    while (state.i < data.length) fill(false);
  }

  function applyFilters() {
    const q = norm(qEl?.value || '');
    const tipo = tipoEl?.value || '';
    const pais = paisEl?.value || '';
    const active = Boolean(q || tipo || pais);
    if (active) forceFillAll();

    let visible = 0;
    for (const card of container.querySelectorAll('[data-org-card]')) {
      const okQ = !q || (card.dataset.search || '').includes(q);
      const okTipo = !tipo || card.dataset.tipo === tipo;
      const okPais = !pais || card.dataset.pais === pais;
      const show = okQ && okTipo && okPais;
      card.hidden = !show;
      if (show) visible++;
    }
    if (countEl) {
      countEl.textContent = active
        ? `${visible} de ${total} organizaciones`
        : `${total} organizaciones`;
    }

    const params = new URLSearchParams(location.search);
    for (const [key, value] of [['q', qEl?.value || ''], ['tipo', tipo], ['pais', pais]]) {
      if (value) params.set(key, value); else params.delete(key);
    }
    const qs = params.toString();
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);

    if (observer && (state.i >= data.length || active)) observer.disconnect();
  }

  function syncFromUrl() {
    const params = new URLSearchParams(location.search);
    if (qEl) qEl.value = params.get('q') || '';
    if (tipoEl) tipoEl.value = params.get('tipo') || '';
    if (paisEl) paisEl.value = params.get('pais') || '';
  }

  syncFromUrl();
  fill(false);
  applyFilters();

  if (qEl) {
    const onInput = () => applyFilters();
    qEl.addEventListener('input', onInput);
    cleanupFns.push(() => qEl.removeEventListener('input', onInput));
  }
  for (const sel of [tipoEl, paisEl]) {
    if (!sel) continue;
    const onChange = () => applyFilters();
    sel.addEventListener('change', onChange);
    cleanupFns.push(() => sel.removeEventListener('change', onChange));
  }

  if (sentinel && typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        fill();
        if (state.i >= data.length) observer?.disconnect();
      }
    }, { rootMargin: '800px' });
    observer.observe(sentinel);
    cleanupFns.push(() => observer?.disconnect());
  } else {
    while (state.i < data.length) fill(false);
  }
}
