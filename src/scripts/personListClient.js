// Renderer, scroll infinito y filtros del indice de personas.
// SSR emite las primeras tarjetas; el resto viaja en #people-index-data y se
// inserta al acercarse al sentinel (IntersectionObserver). Los filtros y el
// orden se aplican en cliente con los data-* de todas las tarjetas, igual que
// en /organizations: no dependen de las fichas individuales ni del runtime.

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const fmt = new Intl.NumberFormat('es-CL');

function personCard(p) {
  const cargo = p.cargo
    ? `<p class="flex items-center gap-1.5 text-xs text-base-content/80 font-medium mt-1"><span>${esc(p.cargo)}</span></p>`
    : '';
  const org = p.orgNombre
    ? `<p class="flex items-center gap-1.5 text-xs text-base-content/80 mt-0.5"><span>${esc(p.orgNombre)}</span></p>`
    : '';
  const count = p.n
    ? `<p class="flex items-center gap-1 text-[11px] text-base-content/60 mt-1.5 tabular-nums"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18M3 12h18"/></svg><span>${fmt.format(p.n)} ${p.n === 1 ? 'evento' : 'eventos'}</span>${p.last ? `<span>· hasta ${esc(p.last)}</span>` : ''}</p>`
    : '';

  return `<a data-person-card data-id="${esc(p.id)}" data-org="${esc(p.organizacion || '')}" data-n="${p.n || 0}" data-last="${esc(p.last || '')}" data-order="${p.order}" data-search="${esc(p.search || norm(`${p.nombre} ${p.cargo} ${p.orgNombre}`))}" href="/people/${encodeURIComponent(p.id)}" class="group block rounded-xl p-5 bg-base-100 border-0 shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)] active:scale-[0.96] transition-[box-shadow,scale,border-color] duration-200 ease-out">
  <div class="flex items-start gap-4">
    <div class="h-16 w-12 rounded-lg bg-base-200 flex items-center justify-center shrink-0"><svg class="h-5 w-5 text-base-content/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
    <div class="min-w-0 flex-1">
      <h3 transition:name="person-title-${esc(p.id)}" class="font-bold text-base-content text-base group-hover:text-base-content transition-colors leading-snug">${esc(p.nombre)}</h3>
      ${cargo}
      ${org}
      ${count}
    </div>
    <svg class="h-5 w-5 text-base-content/30 group-hover:text-base-content group-hover:translate-x-0.5 transition-[translate,color] duration-200 ease-out shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
  </div>
</a>`;
}

let cleanupFns = [];

export function initPersonList() {
  const script = document.getElementById('people-index-data');
  // page-load tambien dispara en la carga inicial: sin este guard el segundo
  // init limpiaria el sentinel que acaba de crear el primero.
  if (script && script.__gvLoaded) return;
  if (script) script.__gvLoaded = true;

  const container = document.getElementById('people-index-root');
  const sentinel = document.getElementById('people-sentinel');
  const qEl = document.getElementById('people-q');
  const orgEl = document.getElementById('people-org');
  const sortEl = document.getElementById('people-sort');
  const activeEl = document.getElementById('people-active');
  const countEl = document.getElementById('people-count');
  const clearEl = document.getElementById('people-clear');
  const emptyEl = document.getElementById('people-empty');
  const emptyMsgEl = document.getElementById('people-empty-msg');
  const emptyClearEl = document.getElementById('people-empty-clear');
  if (!script || !container) return;

  let data = [];
  try {
    data = JSON.parse(script.textContent || '[]');
  } catch {
    return;
  }

  const totalNode = document.getElementById('people-total');
  const withEventsNode = document.getElementById('people-with-events');
  const total = Number(totalNode?.textContent) || data.length;
  const withEvents = Number(withEventsNode?.textContent) || 0;
  const state = { i: 0, batch: 40 };
  let observer = null;
  let needsSort = false;
  let lastSort = null;

  cleanupFns.forEach((fn) => fn());
  cleanupFns = [];

  function syncSentinel() {
    if (!sentinel) return;
    const done = state.i >= data.length;
    sentinel.hidden = done;
    sentinel.style.display = done ? 'none' : '';
  }

  function fill(apply = true) {
    if (state.i >= data.length) return;
    const chunk = data.slice(state.i, state.i + state.batch);
    container.insertAdjacentHTML('beforeend', chunk.map(personCard).join(''));
    state.i += chunk.length;
    needsSort = true;
    syncSentinel();
    if (apply) applyState();
  }

  function forceFillAll() {
    while (state.i < data.length) fill(false);
  }

  function sortCards(sort) {
    const cards = [...container.querySelectorAll('[data-person-card]')];
    cards.sort((a, b) => {
      if (sort === 'n') {
        return (Number(b.dataset.n) || 0) - (Number(a.dataset.n) || 0) ||
          (Number(a.dataset.order) || 0) - (Number(b.dataset.order) || 0);
      }
      if (sort === 'last') {
        return (b.dataset.last || '').localeCompare(a.dataset.last || '') ||
          (Number(a.dataset.order) || 0) - (Number(b.dataset.order) || 0);
      }
      return (Number(a.dataset.order) || 0) - (Number(b.dataset.order) || 0);
    });
    const frag = document.createDocumentFragment();
    for (const card of cards) frag.appendChild(card);
    container.appendChild(frag);
    needsSort = false;
  }

  function applyState() {
    const q = norm(qEl?.value || '');
    const org = orgEl?.value || '';
    const sort = sortEl?.value || 'nombre';
    const solo = Boolean(activeEl?.checked);
    const hasFilter = Boolean(q || org || solo);
    if (hasFilter || sort !== 'nombre') forceFillAll();
    // `fill()` marca needsSort, pero si el dataset ya estaba completo no corre:
    // un cambio de orden posterior tiene que marcarlo aqui también.
    if (sort !== lastSort) {
      needsSort = true;
      lastSort = sort;
    }
    if (needsSort) sortCards(sort);

    let visible = 0;
    for (const card of container.querySelectorAll('[data-person-card]')) {
      const okQ = !q || (card.dataset.search || '').includes(q);
      const okOrg = !org || card.dataset.org === org;
      const okSolo = !solo || (Number(card.dataset.n) || 0) > 0;
      const show = okQ && okOrg && okSolo;
      // [hidden] puede ser vencido por la clase `block` segun el orden de CSS.
      card.hidden = !show;
      card.style.display = show ? '' : 'none';
      if (show) visible++;
    }

    if (countEl) {
      countEl.textContent = hasFilter
        ? `${fmt.format(visible)} de ${fmt.format(total)} personas`
        : `${fmt.format(total)} personas · ${fmt.format(withEvents)} con eventos`;
    }
    if (clearEl) clearEl.hidden = !hasFilter && sort === 'nombre';

    // Sin este estado, unos filtros sin coincidencias dejaban solo el contador
    // en cero y una grilla vacia, sin explicar que paso ni como salir.
    if (emptyEl) {
      emptyEl.classList.toggle('hidden', visible !== 0);
      if (emptyMsgEl) {
        emptyMsgEl.textContent = hasFilter
          ? 'No se encontraron personas con los filtros actuales.'
          : 'No hay personas registradas en el índice.';
      }
    }

    const params = new URLSearchParams(location.search);
    for (const [key, value] of [
      ['q', qEl?.value || ''],
      ['org', org],
      ['sort', sort === 'nombre' ? '' : sort],
      ['con', solo ? '1' : ''],
    ]) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const qs = params.toString();
    history.replaceState(null, '', qs ? `${location.pathname}?${qs}` : location.pathname);

    syncSentinel();
    if (observer) {
      if (hasFilter || state.i >= data.length) observer.disconnect();
      else observer.observe(sentinel);
    }
  }

  function syncFromUrl() {
    const params = new URLSearchParams(location.search);
    if (qEl) qEl.value = params.get('q') || '';
    if (orgEl) orgEl.value = params.get('org') || '';
    if (sortEl) sortEl.value = params.get('sort') || 'nombre';
    if (activeEl) activeEl.checked = params.get('con') === '1';
  }

  syncFromUrl();
  applyState();

  if (qEl) {
    const onInput = () => applyState();
    qEl.addEventListener('input', onInput);
    cleanupFns.push(() => qEl.removeEventListener('input', onInput));
  }
  for (const el of [orgEl, sortEl, activeEl]) {
    if (!el) continue;
    const onChange = () => applyState();
    el.addEventListener('change', onChange);
    cleanupFns.push(() => el.removeEventListener('change', onChange));
  }
  function clearFilters() {
    if (qEl) qEl.value = '';
    if (orgEl) orgEl.value = '';
    if (sortEl) sortEl.value = 'nombre';
    if (activeEl) activeEl.checked = false;
    applyState();
  }
  for (const btn of [clearEl, emptyClearEl]) {
    if (!btn) continue;
    btn.addEventListener('click', clearFilters);
    cleanupFns.push(() => btn.removeEventListener('click', clearFilters));
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

  syncSentinel();
}
