// Renderer de cliente: agrega tarjetas de evento a los grids de mes ya emitidos por SSR
// y aplica en cliente los filtros/búsqueda (?tema, ?persona, ?org, ?q).
//
// Por qué en cliente: el sitio es SSG (estático), así que la página /events se genera
// sin query string y Astro.url.searchParams no existe en runtime. El dataset completo
// viaja en <script type="application/json" id="event-index-data"> y aquí se filtra.
//
// Los shells de año/mes ya existen en el DOM (los pinta el SSR); cada mes vacío se
// llena en cuanto entra al viewport (carga bajo demanda por scroll).

const TIPO_LABELS = {
  declaracion: 'Declaracion', accion: 'Accion', anuncio: 'Anuncio', decreto: 'Decreto',
  proyecto: 'Proyecto', ley: 'Ley', votacion: 'Votacion', fallo_judicial: 'Fallo judicial',
  entrevista: 'Entrevista', publicacion: 'Publicacion', documento: 'Documento',
  investigacion: 'Investigacion', reaccion: 'Reaccion', resultado: 'Resultado',
};
const TIPO_STYLES = {
  declaracion: 'rel-chip [--chip-hue:#0ea5e9]', accion: 'rel-chip [--chip-hue:#10b981]',
  anuncio: 'rel-chip [--chip-hue:#f59e0b]', decreto: 'rel-chip [--chip-hue:#a855f7]',
  proyecto: 'rel-chip [--chip-hue:#6366f1]', ley: 'rel-chip [--chip-hue:#3b82f6]',
  votacion: 'rel-chip [--chip-hue:#8b5cf6]', fallo_judicial: 'rel-chip [--chip-hue:#f43f5e]',
  entrevista: 'rel-chip [--chip-hue:#14b8a6]', publicacion: 'rel-chip [--chip-hue:#06b6d4]',
  documento: 'bg-base-200 text-base-content/70 ring-base-300', investigacion: 'rel-chip [--chip-hue:#f97316]',
  reaccion: 'rel-chip [--chip-hue:#ec4899]', resultado: 'rel-chip [--chip-hue:#10b981]',
};
const RELATION_CHIPS = {
  contradice: 'rel-chip [--chip-hue:#ef4444]', confirma: 'rel-chip [--chip-hue:#10b981]',
  cumple: 'rel-chip [--chip-hue:#10b981]', incumple: 'rel-chip [--chip-hue:#ef4444]',
  amplia: 'rel-chip [--chip-hue:#0ea5e9]', corrige: 'rel-chip [--chip-hue:#f59e0b]',
  rectifica: 'rel-chip [--chip-hue:#f59e0b]', responde_a: 'rel-chip [--chip-hue:#8b5cf6]',
  deriva_en: 'rel-chip [--chip-hue:#6366f1]', provoca: 'rel-chip [--chip-hue:#f97316]',
  cita: 'bg-base-200 text-base-content/80 ring-base-300/80', reemplaza: 'rel-chip [--chip-hue:#06b6d4]',
  actualiza: 'rel-chip [--chip-hue:#3b82f6]', mismo_contexto: 'bg-base-200 text-base-content/70 ring-base-300',
};
const RELATION_LABELS = {
  contradice: 'Contradice', confirma: 'Confirma', cumple: 'Cumple', incumple: 'Incumple',
  amplia: 'Amplia', corrige: 'Corrige', rectifica: 'Rectifica', responde_a: 'Responde a',
  deriva_en: 'Deriva en', provoca: 'Provoca', cita: 'Cita', reemplaza: 'Reemplaza',
  actualiza: 'Actualiza', mismo_contexto: 'Mismo contexto',
};

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function chip(tipo) {
  return RELATION_CHIPS[tipo] || 'bg-base-200 text-base-content/80 ring-base-300/80';
}
// Normaliza minúsculas + sin acentos para la búsqueda.
function norm(s) {
  return String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const byMonth = new Map();
const state = { maps: { topics: {}, people: {}, orgs: {} }, events: [] };

function gridFor(year, month) {
  const sec = document.getElementById(`month-${year}-${month}`);
  if (!sec) return null;
  return sec.querySelector(':scope > .event-grid');
}

export function createEventGrid(year, month) {
  let sec = document.getElementById(`month-${year}-${month}`);
  let grid = null;
  if (sec) {
    grid = sec.querySelector(':scope > .event-grid');
    return grid;
  }
  sec = document.createElement('section');
  sec.id = `month-${year}-${month}`;
  sec.className = 'scroll-mt-32 mb-8';
  grid = document.createElement('div');
  grid.className = 'event-grid grid grid-cols-1 md:grid-cols-2 gap-4';
  sec.appendChild(grid);
  return grid;
}

function cardHTML(e) {
  const maps = state.maps;
  const personaNames = (e.personas || []).map((id) => maps.people[id] || id);
  const temaNames = (e.temas || []).map((id) => maps.topics[id] || id);
  const previews = (e.previews || [])
    .map(
      (p) =>
        `<span class="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${chip(p.tipo)}"><span class="shrink-0">${p.arrow}</span><span class="shrink-0 font-semibold">${esc(RELATION_LABELS[p.tipo] || p.tipo)}</span><span class="truncate">${esc(p.titulo)}</span></span>`
    )
    .join('');
  const temas = (temaNames || [])
    .map((t) => `<span class="inline-flex items-center gap-1 text-xs bg-base-200/80 text-base-content/70 px-2 py-0.5 rounded-md font-medium"><span>${esc(t)}</span></span>`)
    .join('');
  const vinculo = e.links
    ? `<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary ring-1 ring-inset ring-primary/30"><span>${e.links} ${e.links === 1 ? 'vinculo' : 'vinculos'}</span></span>`
    : '';

  return `<a href="/events/${e.year}/${e.id}" data-tipo="${esc(e.tipo)}" data-tema="${esc((e.temas || []).join(','))}" data-personas="${esc((e.personas || []).join(','))}" data-orgs="${esc((e.orgs || []).join(','))}" data-etiquetas="${esc((e.etiquetas || []).join(','))}" data-search="${esc(e.search || '')}" class="block shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] rounded-xl p-5 hover:shadow-md hover:border-primary/40 active:scale-[0.99] transition-all duration-200 bg-base-100 border border-base-300 overflow-hidden">
  <div class="flex flex-wrap items-center gap-2 mb-2 text-xs">
    <span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ring-1 ring-inset ${TIPO_STYLES[e.tipo] || 'bg-base-200 text-base-content/80 ring-base-300'}">${TIPO_LABELS[e.tipo] || e.tipo}</span>
    <span class="inline-flex items-center gap-1 text-base-content/60 font-medium"><span>${esc(e.fechaStr)}</span></span>
    ${vinculo}
  </div>
  <h3 style="view-transition-name:event-title-${e.id}" class="font-semibold text-base-content text-balance text-base leading-snug mb-2 group-hover:text-primary">${esc(e.titulo)}</h3>
  ${personaNames.length ? `<div class="flex items-center gap-1.5 text-xs text-base-content/70 mb-2.5 min-w-0"><span class="truncate">${esc(personaNames.join(', '))}</span></div>` : ''}
  ${temas ? `<div class="flex gap-1.5 flex-wrap mb-3">${temas}</div>` : ''}
  ${previews ? `<div class="pt-2 border-t border-base-300 flex flex-wrap gap-1.5">${previews}</div>` : ''}
</a>`;
}

export { cardHTML as eventCardHTML, gridFor as eventGridFor };

function fillMonth(key) {
  const sec = document.getElementById(`month-${key}`);
  if (!sec) return false;
  const grid = sec.querySelector(':scope > .event-grid');
  if (!grid) return false;
  const events = byMonth.get(key);
  if (!events?.length) return false;
  grid.insertAdjacentHTML('beforeend', events.map(cardHTML).join(''));
  byMonth.delete(key);
  // Si hay filtros activos, las tarjetas recién insertadas deben respetarlos:
  // el observer puede llenar meses DESPUÉS de un applyFilters (carrera clásica
  // en la que quedaban tarjetas visibles que no matcheaban).
  const f = currentFilters();
  if (f.tema || f.persona || f.org || f.q || f.tipos.length || f.etiqueta) {
    [...grid.children].slice(-events.length).forEach((card) => {
      if (!matchesFilter(card, f)) card.style.display = 'none';
    });
  }
  return true;
}

export function forceFillMonth(key) {
  return fillMonth(key);
}

// Llena todos los meses pendientes de una vez (necesario para filtrar sobre el DOM completo).
// Nota: el dataset JSON ya excluye los eventos renderizados en SSR (ver index.astro),
// así que byMonth solo contiene tarjetas no emitidas; no hace falta un guard anti-duplicado.
function forceFillAll() {
  for (const key of [...byMonth.keys()]) fillMonth(key);
}

function currentFilters() {
  const p = new URLSearchParams(window.location.search);
  return {
    tema: (p.get('tema') || '').trim(),
    persona: (p.get('persona') || '').trim(),
    org: (p.get('org') || '').trim(),
    q: norm(p.get('q') || '').trim(),
    tipos: p.getAll('tipo').map((t) => t.trim()).filter(Boolean),
    etiqueta: norm(p.get('etiqueta') || '').trim(),
  };
}

function matchesFilter(card, f) {
  if (f.tema) {
    const ids = (card.dataset.tema || '').split(',').filter(Boolean);
    if (!ids.includes(f.tema)) return false;
  }
  if (f.persona) {
    const ids = (card.dataset.personas || '').split(',').filter(Boolean);
    if (!ids.includes(f.persona)) return false;
  }
  if (f.org) {
    const ids = (card.dataset.orgs || '').split(',').filter(Boolean);
    if (!ids.includes(f.org)) return false;
  }
  // Tipos seleccionados (chips multi-toggle): la tarjeta debe ser de uno de ellos.
  if (f.tipos.length && !f.tipos.includes(card.dataset.tipo || '')) return false;
  // Etiqueta: coincidencia exacta de token (no substring), normalizada.
  if (f.etiqueta) {
    const tags = (card.dataset.etiquetas || '').split(',').filter(Boolean).map(norm);
    if (!tags.includes(f.etiqueta)) return false;
  }
  if (f.q && !(card.dataset.search || '').includes(f.q)) return false;
  return true;
}

export function applyFilters() {
  const f = currentFilters();
  const active = Boolean(f.tema || f.persona || f.org || f.q || f.tipos.length || f.etiqueta);

  // Sincroniza los controles del FilterBar con la URL.
  const setSelect = (name, val) => {
    const el = document.querySelector(`select[data-filter-select="${name}"]`);
    if (el) el.value = val;
  };
  setSelect('tema', f.tema);
  setSelect('persona', f.persona);
  setSelect('org', f.org);
  const qInput = document.querySelector('input[data-search-input]');
  if (qInput && document.activeElement !== qInput) qInput.value = f.q;
  syncTipoChips(f);
  const etInput = document.querySelector('input[data-etiqueta-input]');
  if (etInput && document.activeElement !== etInput) etInput.value = f.etiqueta;

  // Botón limpiar + grafo mini (se oculta con filtros activos para no confundir).
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) clearBtn.classList.toggle('hidden', !active);
  const graph = document.getElementById('graph-container');
  if (graph) graph.style.display = active ? 'none' : '';

  const empty = document.getElementById('no-results');
  const root = document.getElementById('event-index-root');

  // Consulta FRESCA en cada uso: las tarjetas lazy solo existen en el DOM tras
  // forceFillAll(); capturar la lista antes dejaba el conteo en las 12 de SSR y
  // mostraba "No se encontraron..." aunque hubieran matches en meses recién
  // llenados (bug al filtrar desde /topics o con cualquier filtro en carga).
  const getCards = () =>
    document.querySelectorAll('#event-index-root .event-grid > a[href^="/events/"]');

  if (!active) {
    // Sin filtros: restaura todo lo que un filtrado previo pudo ocultar.
    getCards().forEach((card) => (card.style.display = ''));
    document.querySelectorAll('#event-index-root .event-grid').forEach((grid) => {
      const monthSec = grid.closest('section[id^="month-"]');
      if (monthSec) monthSec.style.display = '';
    });
    document.querySelectorAll('#event-index-root > section[id^="year-"]').forEach((ys) => (ys.style.display = ''));
    if (empty) empty.classList.add('hidden');
    if (root) root.classList.remove('hidden');
    return;
  }

  forceFillAll();

  // Con filtros activos se abren todos los años para que los resultados queden visibles.
  // La apertura es programática: no debe persistirse en localStorage (el listener de
  // toggle en events/index.astro respeta window.__gvSkipPersist).
  const prevSkip = window.__gvSkipPersist;
  window.__gvSkipPersist = true;
  document.querySelectorAll('details[data-persist]').forEach((d) => (d.open = true));
  window.__gvSkipPersist = prevSkip;

  let visible = 0;
  getCards().forEach((card) => {
    const ok = matchesFilter(card, f);
    card.style.display = ok ? '' : 'none';
    if (ok) visible++;
  });

  // Oculta meses y años sin resultados.
  document.querySelectorAll('#event-index-root .event-grid').forEach((grid) => {
    const monthSec = grid.closest('section[id^="month-"]');
    const hasVisible = grid.querySelector('a[href^="/events/"]:not([style*="display: none"])');
    if (monthSec) monthSec.style.display = hasVisible ? '' : 'none';
  });
  document.querySelectorAll('#event-index-root > section[id^="year-"]').forEach((yearSec) => {
    const hasVisible = yearSec.querySelector('a[href^="/events/"]:not([style*="display: none"])');
    yearSec.style.display = hasVisible ? '' : 'none';
  });

  if (empty) empty.classList.toggle('hidden', visible > 0);
  if (root) root.classList.toggle('hidden', visible === 0);
}

// Estado visual de los chips de tipo según los filtros activos.
const CHIP_OFF = ['bg-base-100', 'text-base-content/60', 'ring-base-300', 'hover:bg-base-200'];
function syncTipoChips(f) {
  document.querySelectorAll('[data-tipo-chip]').forEach((btn) => {
    const on = f.tipos.includes(btn.dataset.tipoChip || '');
    btn.setAttribute('aria-pressed', String(on));
    const styleOn = (btn.dataset.styleOn || '').split(' ').filter(Boolean);
    btn.classList.remove(...CHIP_OFF, ...styleOn);
    btn.classList.add(...(on ? styleOn : CHIP_OFF));
  });
}

function wireFilterForm() {
  const form = document.querySelector('#filter-form');
  if (!form) return;
  if (form.__gvWired) return;
  form.__gvWired = true;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const p = new URLSearchParams();
    for (const [k, v] of fd) {
      if (String(v).trim()) p.set(k, String(v).trim());
    }
    // Los chips de tipo no viajan en FormData: preservar los de la URL actual.
    for (const t of new URLSearchParams(window.location.search).getAll('tipo')) {
      p.append('tipo', t);
    }
    const qs = p.toString();
    history.pushState({}, '', qs ? `${location.pathname}?${qs}` : location.pathname);
    applyFilters();
  });
  // Chips multi-toggle: clic alterna el tipo en la URL preservando los demás filtros.
  form.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-tipo-chip]');
    if (!btn) return;
    const id = btn.dataset.tipoChip || '';
    const p = new URLSearchParams(window.location.search);
    const cur = p.getAll('tipo');
    p.delete('tipo');
    for (const t of cur.includes(id) ? cur.filter((t2) => t2 !== id) : [...cur, id]) {
      p.append('tipo', t);
    }
    history.pushState({}, '', [...p.keys()].length ? `${location.pathname}?${p}` : location.pathname);
    applyFilters();
  });
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn && !clearBtn.__gvWired) {
    clearBtn.__gvWired = true;
    clearBtn.addEventListener('click', () => {
      history.pushState({}, '', location.pathname);
      applyFilters();
    });
  }
}

// popstate (botón atrás/adelante) se registra una sola vez por sesión.
if (!window.__gvEventPopstate) {
  window.__gvEventPopstate = true;
  window.addEventListener('popstate', () => applyFilters());
}

export function initEventList() {
  // Los scripts de página se re-ejecutan en cada navegación (View Transitions).
  // En vez de un guard persistente, se desconecta el observer previo y se
  // reconstruye con el DOM nuevo; byMonth es module-level y persiste entre
  // navegaciones SPA, por eso se limpia antes de re-poblar.
  if (window.__gvEventListObserver) {
    window.__gvEventListObserver.disconnect();
    window.__gvEventListObserver = null;
  }
  byMonth.clear();

  window.__gvFillMonth = forceFillMonth;

  const script = document.getElementById('event-index-data');
  if (!script) return;
  // Doble init en la MISMA carga (llamada directa + astro:page-load, que tambien
  // se dispara al cargar): sin este guard el JSON se repuebla y forceFillAll/
  // observer insertan tarjetas duplicadas. En navegacion VT el nodo es nuevo
  // (DOM fresco) y el init corre normal.
  if (script.__gvLoaded) return;
  script.__gvLoaded = true;
  let payload = { maps: {}, events: [] };
  try {
    payload = JSON.parse(script.textContent || '{}');
  } catch {
    return;
  }
  state.maps = payload.maps || { topics: {}, people: {}, orgs: {} };
  state.events = payload.events || [];
  if (!state.events.length) return;

  // Agrupar por mes: mes -> eventos lazy pendientes.
  for (const e of state.events) {
    const key = `${e.year}-${String(e.month).padStart(2, '0')}`;
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(e);
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const key = entry.target.dataset.monthKey;
          if (!key) continue;
          fillMonth(key);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '600px 0px' }
    );
    window.__gvEventListObserver = observer;
    for (const key of byMonth.keys()) {
      const sec = document.getElementById(`month-${key}`);
      if (sec) {
        sec.dataset.monthKey = key;
        observer.observe(sec);
      }
    }
  } else {
    for (const key of byMonth.keys()) fillMonth(key);
  }

  wireFilterForm();
  applyFilters();
}
