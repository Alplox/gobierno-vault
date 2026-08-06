// Renderer de cliente: agrega tarjetas de evento a los grids de mes ya emitidos por SSR.
// Lee el JSON embebido en <script type="application/json" id="event-index-data">.
// Los shells de año/mes ya existen en el DOM (los pinta el SSR); cada mes vacío
// se llena en cuanto entra al viewport (carga bajo demanda por scroll).

const TIPO_LABELS = {
  declaracion: 'Declaracion', accion: 'Accion', anuncio: 'Anuncio', decreto: 'Decreto',
  proyecto: 'Proyecto', ley: 'Ley', votacion: 'Votacion', fallo_judicial: 'Fallo judicial',
  entrevista: 'Entrevista', publicacion: 'Publicacion', documento: 'Documento',
  investigacion: 'Investigacion', reaccion: 'Reaccion', resultado: 'Resultado',
};
const TIPO_STYLES = {
  declaracion: 'bg-sky-50 text-sky-700 ring-sky-200/60', accion: 'bg-emerald-50 text-emerald-700 ring-emerald-200/60',
  anuncio: 'bg-amber-50 text-amber-700 ring-amber-200/60', decreto: 'bg-purple-50 text-purple-700 ring-purple-200/60',
  proyecto: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60', ley: 'bg-blue-50 text-blue-700 ring-blue-200/60',
  votacion: 'bg-violet-50 text-violet-700 ring-violet-200/60', fallo_judicial: 'bg-rose-50 text-rose-700 ring-rose-200/60',
  entrevista: 'bg-teal-50 text-teal-700 ring-teal-200/60', publicacion: 'bg-cyan-50 text-cyan-700 ring-cyan-200/60',
  documento: 'bg-stone-100 text-stone-700 ring-stone-200/60', investigacion: 'bg-orange-50 text-orange-700 ring-orange-200/60',
  reaccion: 'bg-pink-50 text-pink-700 ring-pink-200/60', resultado: 'bg-emerald-50 text-emerald-800 ring-emerald-300/60',
};
const RELATION_CHIPS = {
  contradice: 'bg-red-50 text-red-800 ring-red-200/80', confirma: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  cumple: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80', incumple: 'bg-red-50 text-red-800 ring-red-200/80',
  amplia: 'bg-sky-50 text-sky-800 ring-sky-200/80', corrige: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  rectifica: 'bg-amber-50 text-amber-900 ring-amber-200/80', responde_a: 'bg-violet-50 text-violet-800 ring-violet-200/80',
  deriva_en: 'bg-indigo-50 text-indigo-800 ring-indigo-200/80', provoca: 'bg-orange-50 text-orange-800 ring-orange-200/80',
  cita: 'bg-gray-100 text-gray-700 ring-gray-200/80', reemplaza: 'bg-cyan-50 text-cyan-800 ring-cyan-200/80',
  actualiza: 'bg-blue-50 text-blue-800 ring-blue-200/80', mismo_contexto: 'bg-gray-100 text-gray-600 ring-gray-200/80',
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
  return RELATION_CHIPS[tipo] || 'bg-gray-100 text-gray-700 ring-gray-200/80';
}

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
  const previews = (e.previews || [])
    .map(
      (p) =>
        `<span class="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${chip(p.tipo)}"><span class="shrink-0">${p.arrow}</span><span class="shrink-0 font-semibold">${esc(RELATION_LABELS[p.tipo] || p.tipo)}</span><span class="truncate">${esc(p.titulo)}</span></span>`
    )
    .join('');
  const temas = (e.temas || [])
    .map((t) => `<span class="inline-flex items-center gap-1 text-xs bg-gray-100/80 text-gray-600 px-2 py-0.5 rounded-md font-medium"><span>${esc(t)}</span></span>`)
    .join('');
  const vinculo = e.links
    ? `<span class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 ring-1 ring-inset ring-blue-200/70"><span>${e.links} ${e.links === 1 ? 'vinculo' : 'vinculos'}</span></span>`
    : '';

  return `<a href="/events/${e.year}/${e.id}" class="block shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] rounded-xl p-5 hover:shadow-md hover:border-blue-200/80 active:scale-[0.99] transition-all duration-200 bg-white border border-gray-100 overflow-hidden">
  <div class="flex flex-wrap items-center gap-2 mb-2 text-xs">
    <span class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium ring-1 ring-inset ${TIPO_STYLES[e.tipo] || 'bg-gray-100 text-gray-700 ring-gray-200'}">${TIPO_LABELS[e.tipo] || e.tipo}</span>
    <span class="inline-flex items-center gap-1 text-gray-500 font-medium"><span>${esc(e.fechaStr)}</span></span>
    ${vinculo}
  </div>
  <h3 style="view-transition-name:event-title-${e.id}" class="font-semibold text-gray-900 text-balance text-base leading-snug mb-2 group-hover:text-blue-600">${esc(e.titulo)}</h3>
  ${e.personas?.length ? `<div class="flex items-center gap-1.5 text-xs text-gray-600 mb-2.5 min-w-0"><span class="truncate">${esc(e.personas.join(', '))}</span></div>` : ''}
  ${temas ? `<div class="flex gap-1.5 flex-wrap mb-3">${temas}</div>` : ''}
  ${previews ? `<div class="pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">${previews}</div>` : ''}
</a>`;
}

export { cardHTML as eventCardHTML, gridFor as eventGridFor };

const byMonth = new Map();

function fillMonth(key) {
  const sec = document.getElementById(`month-${key}`);
  if (!sec) return false;
  const grid = sec.querySelector(':scope > .event-grid');
  if (!grid) return false;
  const events = byMonth.get(key);
  if (!events?.length) return false;
  grid.insertAdjacentHTML('beforeend', events.map(cardHTML).join(''));
  byMonth.delete(key);
  return true;
}

export function forceFillMonth(key) {
  return fillMonth(key);
}

export function initEventList() {
  if (window.__gvEventListInit) return;
  window.__gvEventListInit = true;

  window.__gvFillMonth = forceFillMonth;

  const script = document.getElementById('event-index-data');
  if (!script) return;
  let data = [];
  try {
    data = JSON.parse(script.textContent || '[]');
  } catch {
    return;
  }
  if (!data.length) return;

  // Agrupar por mes: mes -> eventos lazy pendientes.
  for (const e of data) {
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
}