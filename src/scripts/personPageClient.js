// Filtros de la ficha de persona.
//
// Dos bloques independientes:
//  1. Eventos  — búsqueda de texto + tipo (multi) + tema + año. Los cuatro se
//     combinan: un evento se ve si cumple TODOS los activos.
//  2. Declaraciones — año + búsqueda de texto (las citas no van por tipo/tema).
//
// El estado vive en `#person-events-root[data-year-filter|type-filter|topic-filter]`,
// que es la única fuente de verdad compartida con personEventClient.js: el
// renderer de scroll infinito lo lee al pintar cada tanda, así que lo pintado
// nunca queda desfasado respecto a lo que el usuario está viendo.
//
// Aplicar un filtro obliga a volcar el dataset completo (`__gvPersonFillAll`):
// si no, el conteo y la lista dependerían de cuánta parte se haya alcanzado a
// pintar por scroll.
//
// Con View Transitions el DOM se reemplaza en cada navegación: los listeners se
// registran sobre los nodos nuevos con un guard por elemento (`__gvWired`) y el
// estado cacheado a nivel de módulo se reinicia en cada init.

function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const ICON = `<svg class="h-3 w-3 shrink-0 translate-y-0.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 22h16a2 2 0 0 0 2-2V7l-4-4H6a2 2 0 0 0-2 2v4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 12h8M8 16h5"/></svg>`;

/**
 * Un blockquote puede ocupar varias líneas: extractEntities une sus párrafos con
 * "\n\n" y la atribución va en la última. Aquí se cierra cada párrafo con <p>,
 * como en QuoteCard.astro (que es quien genera el markup del SSR).
 */
function quoteParrafos(texto) {
  const html = String(texto)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p class="mb-2 last:mb-0">${esc(p).replace(/\n/g, '<br />')}</p>`)
    .join('');
  // Comillas dentro del primer y del ultimo parrafo (ver QuoteCard.astro).
  const abierta = html.replace('<p class="mb-2 last:mb-0">', '<p class="mb-2 last:mb-0">&ldquo;');
  return abierta.replace(/<\/p>(?![\s\S]*<\/p>)/, '&rdquo;</p>');
}

/**
 * Declaración cargada bajo demanda. El HTML espeja PersonQuoteItem.astro; si ese
 * componente cambia su marcado, hay que actualizarlo aquí también.
 */
function quoteHTML(q) {
  return (
    `<div data-quote-group="${esc(q.year)}" data-year="${esc(q.year)}">` +
    `<article class="rounded-xl bg-base-200/50 p-3.5" data-quote-item data-search="${esc(q.search)}">` +
    `<div class="quote-card md:ml-5 border-l-2 border-primary/30 pl-4 pt-1 pb-2 min-w-0" data-quote-payload='${esc(
      JSON.stringify({
        quotes: [{ text: q.texto, person: '', personId: '', sources: q.fuentes, fecha: q.fecha }],
        titulo: q.titulo,
        sources: {},
      })
    )}'>` +
    `<div class="flex items-center justify-between mb-2">` +
    `<span class="text-[11px] font-semibold uppercase tracking-wide text-primary">${esc(q.fechaLarga)}</span>` +
    `<div class="flex gap-1.5">` +
    `<button type="button" data-copy="apa" class="copy-btn inline-flex items-center gap-1 text-[10px] font-medium text-base-content/70 bg-base-200 hover:bg-primary/15 hover:text-primary px-2 py-1 rounded-md transition-colors" title="Copiar cita en formato APA"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span class="copy-label">APA</span></button>` +
    `<button type="button" data-copy="md" class="copy-btn inline-flex items-center gap-1 text-[10px] font-medium text-base-content/70 bg-base-200 hover:bg-primary/15 hover:text-primary px-2 py-1 rounded-md transition-colors" title="Copiar cita en formato markdown (wikilinks del vault)"><svg class="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg><span class="copy-label">MD</span></button>` +
    `</div></div>` +
    `<div class="flex flex-col gap-2"><blockquote class="text-sm text-base-content/80 leading-relaxed italic border-l-2 border-primary/20 pl-3">&ldquo;${quoteParrafos(
      q.texto
    )}&rdquo;</blockquote></div>` +
    `</div>` +
    `<a href="${esc(q.href)}" class="mt-1.5 flex items-baseline gap-1.5 text-xs text-base-content/55 hover:text-primary transition-colors group" title="${esc(
      q.titulo
    )}">${ICON}<span class="min-w-0"><span class="tabular-nums text-base-content/45">${esc(
      q.fechaCorta
    )} · </span><span>${esc(q.titulo)}</span></span></a>` +
    `</article></div>`
  );
}

const ON = ['bg-primary', 'text-primary-content'];
const OFF = ['bg-base-200', 'text-base-content/70'];

function markPressed(btn, on) {
  btn.setAttribute('aria-pressed', String(on));
  btn.classList.toggle(...ON, on);
  btn.classList.toggle(...OFF, !on);
}

const CHIP_OFF = ['bg-base-100', 'text-base-content/60', 'ring-base-300', 'hover:bg-base-200'];

/** Los chips de tipo llevan su estilo "encendido" en data-style-on (como /events). */
function markChip(btn, on) {
  btn.setAttribute('aria-pressed', String(on));
  const onClasses = (btn.dataset.styleOn || '').split(' ').filter(Boolean);
  btn.classList.remove(...CHIP_OFF, ...onClasses);
  btn.classList.add(...(on ? onClasses : CHIP_OFF));
}

function mkEl(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

// --- Declaraciones bajo demanda -------------------------------------------
// El SSR pinta solo las primeras 12; el resto viaja en #person-quotes-data.
// Buscar o filtrar por año vuelca el resto, porque si no el resultado
// dependería de cuántas se hayan cargado.
//
// El dataset se cachea por NODO, no solo por módulo: en la carga inicial el init
// corre dos veces (llamada directa + astro:page-load) y en cada navegación con
// View Transitions el <script> llega nuevo. Si se resetease el contador en cada
// init, el segundo init volvería a pintar desde 0 y duplicaría las citas.
let quoteScript = null;
let quoteData = null;
let quotesPainted = 0;

function fillQuotes(all) {
  const list = document.getElementById('pv-quote-list');
  if (!list) return;
  const script = document.getElementById('person-quotes-data');
  if (script !== quoteScript) {
    quoteScript = script;
    try {
      quoteData = script ? JSON.parse(script.textContent || '[]') : [];
    } catch {
      quoteData = [];
    }
    quotesPainted = 0;
  }
  const BATCH = 12;
  const target = all ? quoteData.length : Math.min(quoteData.length, quotesPainted + BATCH);
  if (target <= quotesPainted) return;
  const frag = document.createDocumentFragment();
  for (let i = quotesPainted; i < target; i++) frag.appendChild(mkEl(quoteHTML(quoteData[i])));
  list.appendChild(frag);
  quotesPainted = target;
  const btn = document.getElementById('load-more-person-quotes');
  if (btn) {
    const done = quotesPainted >= quoteData.length;
    btn.classList.toggle('hidden', done);
    const label = btn.querySelector('.person-quote-more-label');
    if (label) label.textContent = `Cargar más declaraciones (${quoteData.length - quotesPainted} restantes)`;
  }
}

/** Repinta las declaraciones aplicando año + búsqueda ya activos. */
function repaintQuotes() {
  const list = document.getElementById('pv-quote-list');
  if (!list) return;
  const input = document.querySelector('[data-quote-search]');
  const yearBtn = document.querySelector('[data-quote-year][aria-pressed="true"]');
  const year = yearBtn?.dataset.quoteYear ?? '';
  const q = norm(input?.value?.trim() ?? '');
  const empty = document.querySelector('[data-quote-empty]');
  let visible = 0;
  list.querySelectorAll('[data-quote-item]').forEach((el) => {
    const okYear = !year || el.closest('[data-quote-group]')?.dataset.year === year;
    const okText = !q || (el.dataset.search || '').includes(q);
    const show = okYear && okText;
    el.classList.toggle('hidden', !show);
    if (show) visible++;
  });
  empty?.classList.toggle('hidden', visible > 0);
}

// --- Eventos: estado de los cuatro filtros --------------------------------

function readEventFilters() {
  const root = document.getElementById('person-events-root');
  if (!root) return null;
  const input = document.querySelector('[data-event-search]');
  return {
    root,
    q: norm(input?.value?.trim() ?? ''),
    year: root.dataset.yearFilter ?? '',
    topic: root.dataset.topicFilter ?? '',
    tipos: (root.dataset.typeFilter ?? '').split(',').filter(Boolean),
  };
}

function hasEventFilters(f) {
  return Boolean(f.q || f.year || f.topic || f.tipos.length);
}

/** Aplica los filtros ya escritos en el dataset del root a todas las tarjetas. */
function applyEventFilters() {
  const f = readEventFilters();
  if (!f) return;
  const counter = document.querySelector('[data-event-count]');
  const total = Number(counter?.dataset.total || 0);
  const active = hasEventFilters(f);

  // Con filtros activos el conjunto debe estar completo, no solo lo pintado.
  if (active) window.__gvPersonFillAll?.();

  let visible = 0;
  f.root.querySelectorAll('[data-event-item]').forEach((el) => {
    const okYear = !f.year || el.dataset.year === f.year;
    const okTipo = !f.tipos.length || f.tipos.includes(el.dataset.tipo);
    const okTopic = !f.topic || (el.dataset.temas || '').split(',').includes(f.topic);
    const okText = !f.q || (el.dataset.search || '').includes(f.q);
    const show = okYear && okTipo && okTopic && okText;
    el.classList.toggle('hidden', !show);
    if (show) visible++;
  });

  if (counter) {
    counter.textContent = !active
      ? ''
      : visible === total
        ? `${n(total)} eventos`
        : `${n(visible)} de ${n(total)} eventos`;
  }
  document.querySelector('[data-event-reset]')?.classList.toggle('hidden', !active);
}

const n = (v) => new Intl.NumberFormat('es-CL').format(v);

// --- Declaraciones: búsqueda ----------------------------------------------

function runQuoteSearch() {
  fillQuotes(true);
  repaintQuotes();
  const input = document.querySelector('[data-quote-search]');
  document.querySelector('[data-quote-clear]')?.classList.toggle('hidden', !input?.value);
}

export function initPersonFilters() {
  // NO se reinicia el estado de citas aquí: el dataset se re-asocia por nodo
  // dentro de fillQuotes(), así un doble init en la misma página no duplica.
  // Ver comentario de quoteScript arriba.
  initEventFilters();
  initQuoteFilters();
}

function initEventFilters() {
  const root = document.getElementById('person-events-root');
  if (!root) return;
  const counter = document.querySelector('[data-event-count]');
  if (counter && !counter.dataset.total) counter.dataset.total = '0';

  // --- Tipo (multi-toggle) ---
  const typeBtns = document.querySelectorAll('[data-event-type]');
  typeBtns.forEach((btn) => {
    if (btn.__gvWired) return;
    btn.__gvWired = true;
    btn.addEventListener('click', () => {
      const id = btn.dataset.eventType || '';
      const cur = (root.dataset.typeFilter || '').split(',').filter(Boolean);
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      root.dataset.typeFilter = next.join(',');
      typeBtns.forEach((b) => markChip(b, next.includes(b.dataset.eventType || '')));
      applyEventFilters();
    });
  });

  // --- Tema (single) ---
  const topicBtns = document.querySelectorAll('[data-event-topic]');
  topicBtns.forEach((btn) => {
    if (btn.__gvWired) return;
    btn.__gvWired = true;
    btn.addEventListener('click', () => {
      const id = btn.dataset.eventTopic || '';
      root.dataset.topicFilter = root.dataset.topicFilter === id && id ? '' : id;
      topicBtns.forEach((b) => markPressed(b, (b.dataset.eventTopic || '') === root.dataset.topicFilter));
      applyEventFilters();
    });
  });

  // --- Año (single) ---
  const yearBtns = document.querySelectorAll('[data-event-year]');
  yearBtns.forEach((btn) => {
    if (btn.__gvWired) return;
    btn.__gvWired = true;
    btn.addEventListener('click', () => {
      const id = btn.dataset.eventYear || '';
      root.dataset.yearFilter = root.dataset.yearFilter === id && id ? '' : id;
      yearBtns.forEach((b) => markPressed(b, (b.dataset.eventYear || '') === root.dataset.yearFilter));
      applyEventFilters();
    });
  });

  // --- Búsqueda (debounce) ---
  const input = document.querySelector('[data-event-search]');
  if (input && !input.__gvWired) {
    input.__gvWired = true;
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(applyEventFilters, 200);
    });
  }

  // --- Limpiar todo ---
  const reset = document.querySelector('[data-event-reset]');
  if (reset && !reset.__gvWired) {
    reset.__gvWired = true;
    reset.addEventListener('click', () => {
      if (input) input.value = '';
      root.dataset.yearFilter = '';
      root.dataset.topicFilter = '';
      root.dataset.typeFilter = '';
      yearBtns.forEach((b) => markPressed(b, (b.dataset.eventYear || '') === ''));
      topicBtns.forEach((b) => markPressed(b, (b.dataset.eventTopic || '') === ''));
      typeBtns.forEach((b) => markChip(b, false));
      applyEventFilters();
    });
  }
}

function initQuoteFilters() {
  const quoteList = document.getElementById('pv-quote-list');

  // --- Filtro por año de las declaraciones ---
  const qYearBtns = document.querySelectorAll('[data-quote-year]');
  if (quoteList && qYearBtns.length) {
    qYearBtns.forEach((btn) => {
      if (btn.__gvWired) return;
      btn.__gvWired = true;
      btn.addEventListener('click', () => {
        qYearBtns.forEach((b) => markPressed(b, b === btn));
        if (btn.dataset.quoteYear) fillQuotes(true);
        repaintQuotes();
      });
    });
  }

  // --- Búsqueda en las declaraciones ---
  const input = document.querySelector('[data-quote-search]');
  if (input && quoteList && !input.__gvWired) {
    input.__gvWired = true;
    const clear = document.querySelector('[data-quote-clear]');
    let timer;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(runQuoteSearch, 180);
    });
    if (clear && !clear.__gvWired) {
      clear.__gvWired = true;
      clear.addEventListener('click', () => {
        input.value = '';
        runQuoteSearch();
        input.focus();
      });
    }
  }

  // --- Botón "cargar más declaraciones" (las citas no usan scroll infinito:
  //     son pocas y su carga es barata; el botón da control explícito) ---
  const moreQuotes = document.getElementById('load-more-person-quotes');
  if (moreQuotes && !moreQuotes.__gvWired) {
    moreQuotes.__gvWired = true;
    moreQuotes.addEventListener('click', () => {
      fillQuotes(false);
      repaintQuotes();
    });
  }
}
