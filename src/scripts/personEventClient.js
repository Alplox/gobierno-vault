// Renderer de cliente de la ficha de persona: agrega eventos al scroll
// (infinite scroll) y expone el volcado completo que necesitan los filtros.
//
// Reutiliza eventCardHTML de eventListClient.js. El JSON viaja en
// <script type="application/json" id="person-events-data"> con forma
// { maps, events }: los ids de persona/tema viajan, no los nombres, y `maps`
// trae SOLO los ids referenciados por estos eventos (el registro completo son
// 2.502 entradas = 97 KB extra por ficha).
//
// Re-ejecutable por navegación (View Transitions): el DOM se relee en cada init
// y el observer/sentinel previos se desconectan antes de crear los nuevos
// (patrón topicListClient.js / force-graph.js). El guard del listener protege
// solo el REGISTRO: los scripts bundleados se evalúan una vez.
//
// Filtros: `#person-events-root[data-year-filter]` y `[data-type-filter]` son la
// única fuente de verdad, compartida con personPageClient.js. Cada tanda nueva
// nace con esos filtros ya aplicados, así que lo pintado nunca queda desfasado
// respecto a lo que el usuario está viendo.

import { eventCardHTML } from './eventListClient.js';

/**
 * Resuelve los ids de persona/tema a nombres. `search` es obligatorio para
 * eventCardHTML (lo emite como `data-search` en la tarjeta), así que se calcula
 * aquí con EXACTAMENTE los mismos campos que EventCard.astro: si divergieran,
 * unas tarjetas se encontrarían en la búsqueda y otras no.
 */
const TIPO_LABELS = {
  declaracion: 'Declaracion', accion: 'Accion', anuncio: 'Anuncio', decreto: 'Decreto',
  proyecto: 'Proyecto', ley: 'Ley', votacion: 'Votacion', fallo_judicial: 'Fallo judicial',
  entrevista: 'Entrevista', publicacion: 'Publicacion', documento: 'Documento',
  investigacion: 'Investigacion', reaccion: 'Reaccion', resultado: 'Resultado',
};

function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function hydrate(e, maps) {
  const personas = (e.personas || []).map((id) => maps.people?.[id] || id);
  const temas = (e.temas || []).map((id) => maps.topics?.[id] || id);
  return {
    ...e,
    personas,
    temas,
    // `temaIds` conserva los identificadores: el filtro por tema compara contra
    // el id (`data-event-topic="politica"`), no contra el nombre visible.
    temaIds: e.temas || [],
    search: norm(
      [
        e.titulo,
        ...(e.etiquetas || []),
        ...personas,
        ...temas,
        TIPO_LABELS[e.tipo] || e.tipo,
        e.id,
        e.fechaStr,
        e.year,
      ].join(' ')
    ),
  };
}

let observer = null;
let sentinel = null;

function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (sentinel) {
    sentinel.remove();
    sentinel = null;
  }
}

export function initPersonEventList() {
  const script = document.getElementById('person-events-data');
  const root = document.getElementById('person-events-root');
  // El guard va ANTES de cleanup(): en la carga inicial corren la llamada
  // directa y el listener de astro:page-load, y si el segundo init limpiara
  // primero, se llevaría por delante el sentinel que acaba de crear el primero
  // y la lista dejaría de crecer al hacer scroll.
  if (!script || script.__gvLoaded || !root) return;
  script.__gvLoaded = true;
  cleanup();

  let data = [];
  let maps = {};
  try {
    const payload = JSON.parse(script.textContent || '{}');
    maps = payload.maps || {};
    // Acepta también el array plano histórico.
    data = payload.events || (Array.isArray(payload) ? payload : []);
  } catch {
    return;
  }
  if (!data.length) return;

  const BATCH = 12;
  const status = document.querySelector('[data-event-status]');
  // Tarjetas que ya trajo el SSR: el total real es ssrCount + data.length.
  const ssrCount = root.querySelectorAll('[data-event-item]').length;
  const total = ssrCount + data.length;
  let painted = 0;
  let exhausted = false;

  const activeFilters = () => ({
    year: root.dataset.yearFilter ?? '',
    tipo: (root.dataset.typeFilter ?? '').split(',').filter(Boolean),
    topic: root.dataset.topicFilter ?? '',
  });

  function makeItem(e) {
    const wrap = document.createElement('div');
    wrap.className = 'space-y-3 min-w-0 max-w-full';
    wrap.dataset.eventItem = '';
    wrap.dataset.year = String(e.year);
    wrap.dataset.tipo = e.tipo;
    // `data-temas` lo consume el filtro por tema de personPageClient.js y debe
    // llevar IDS (no nombres), igual que el `data-event-topic` del botón.
    wrap.dataset.temas = (e.temaIds || []).join(',');
    wrap.insertAdjacentHTML('beforeend', eventCardHTML(e));
    // Se reutiliza el `data-search` que la propia tarjeta acaba de emitir, en
    // vez de mantener una segunda copia: así el índice de búsqueda no puede
    // divergir entre la tarjeta y su envoltorio.
    const anchor = wrap.querySelector('a[data-search]');
    wrap.dataset.search = anchor ? anchor.dataset.search : e.search;
    const f = activeFilters();
    if (
      (f.year && String(e.year) !== f.year) ||
      (f.tipo.length && !f.tipo.includes(e.tipo)) ||
      (f.topic && !(e.temaIds || []).includes(f.topic))
    ) {
      wrap.classList.add('hidden');
    }
    return wrap;
  }

  function setStatus() {
    if (!status) return;
    const left = data.length - painted;
    status.textContent = left > 0 ? '' : `Fin del listado · ${total} eventos`;
  }

  /** Inserta los siguientes `count` eventos y refresca el estado. */
  function fill(count) {
    if (exhausted) return 0;
    const chunk = data.slice(painted, painted + count);
    if (!chunk.length) {
      exhausted = true;
      return 0;
    }
    const frag = document.createDocumentFragment();
    chunk.forEach((raw) => frag.appendChild(makeItem(hydrate(raw, maps))));
    root.appendChild(frag);
    painted += chunk.length;
    if (painted >= data.length) {
      exhausted = true;
      // Sin quedan datos, el sentinel deja de tener sentido: se retira.
      cleanup();
    }
    setStatus();
    return chunk.length;
  }

  // El sentinel va como hermano DESPUÉS del grid: dentro de un `grid` se
  // convertiría en celda y ocuparía una fila.
  sentinel = document.createElement('div');
  sentinel.id = 'person-events-sentinel';
  sentinel.className = 'h-px';
  sentinel.setAttribute('aria-hidden', 'true');
  root.insertAdjacentElement('afterend', sentinel);

  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        fill(BATCH);
      },
      { rootMargin: '800px 0px' }
    );
    observer.observe(sentinel);
  } else {
    // Sin IntersectionObserver se vuelca todo de una (mismo criterio que /events).
    fill(data.length);
  }

  // Los filtros lo llaman para que el conteo refleje el conjunto completo, no
  // solo lo que se haya alcanzado a pintar por scroll.
  window.__gvPersonFillAll = () => {
    fill(data.length);
  };
}
