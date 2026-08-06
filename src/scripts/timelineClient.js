// Renderer de cliente para el Timeline de la home: agrega filas de eventos bajo demanda.
// Los headers de década/año/mes ya los pinta el SSR; aqui solo se rellenan los meses.
// Lee el JSON embebido en <script type="application/json" id="timeline-index-data">.

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
const RELATION_LABELS = {
  contradice: 'Contradice', confirma: 'Confirma', cumple: 'Cumple', incumple: 'Incumple',
  amplia: 'Amplia', corrige: 'Corrige', rectifica: 'Rectifica', responde_a: 'Responde a',
  deriva_en: 'Deriva en', provoca: 'Provoca', cita: 'Cita', reemplaza: 'Reemplaza',
  actualiza: 'Actualiza', mismo_contexto: 'Mismo contexto',
};
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function eventRow(e) {
  const temas = (e.temas || [])
    .map((t) => `<span class="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600"><span>${esc(t)}</span></span>`)
    .join('');
  const previews = (e.previews || [])
    .map((p) => `<span class="inline-flex max-w-full items-center gap-1 rounded-md bg-gray-100/80 px-2 py-0.5 text-[10px] font-medium text-gray-600"><span class="shrink-0 font-semibold text-gray-700">${esc(RELATION_LABELS[p.tipo] || p.tipo)}:</span><span class="truncate text-gray-500">${esc(p.titulo)}</span></span>`)
    .join('');
  const vinculo = e.links
    ? `<span class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-800 ring-1 ring-inset ring-blue-200/70"><span>${e.links} ${e.links === 1 ? 'vinculo' : 'vinculos'}</span></span>`
    : '';
  const hora = e.timeStr ? `<time class="inline-flex items-center gap-1 text-[11px] tabular-nums text-gray-500"><span>${e.timeStr}</span></time>` : '';

  return `<a href="/events/${e.year}/${e.id}" class="group flex gap-3 rounded-lg py-3 transition-colors hover:bg-gray-50/80">
  <article class="min-w-0 flex-1">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1 ring-inset ${TIPO_STYLES[e.tipo] || 'bg-gray-100 text-gray-600 ring-gray-200'}">${TIPO_LABELS[e.tipo] || e.tipo}</span>
          ${hora}
          ${vinculo}
        </div>
        <h4 style="view-transition-name:event-title-${e.id}" class="text-sm font-semibold leading-snug text-gray-900 text-balance transition-colors group-hover:text-blue-600 sm:text-[15px]">${esc(e.titulo)}</h4>
        ${e.personas?.length ? `<p class="mt-1.5 flex items-center gap-1.5 truncate text-xs text-gray-500"><span class="truncate">${esc(e.personas.join(', '))}</span></p>` : ''}
        ${temas ? `<div class="mt-2 flex flex-wrap gap-1">${temas}</div>` : ''}
        ${previews ? `<div class="mt-2.5 flex flex-wrap gap-1.5">${previews}</div>` : ''}
      </div>
      <span class="mt-5 h-4 w-4 shrink-0 text-gray-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-blue-600">›</span>
    </div>
  </article>
</a>`;
}

function dayGroup(e, day) {
  const rows = day.events.map(eventRow).join('');
  const dayKey = `${e.year}-${String(e.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
  return `<details id="day-${dayKey}" class="group/day scroll-mt-32" open data-crumb-level="day" data-crumb-label="${day.day} ${MESES[Number(e.month) - 1]}">
  <summary class="relative flex cursor-pointer list-none items-center gap-2.5 py-2 pl-24 [&::-webkit-details-marker]:hidden">
    <span class="pointer-events-none absolute left-[15px] top-0 h-full w-20 border-b-2 border-l-2 border-gray-300 rounded-bl-[10px]" aria-hidden="true"></span>
    <span class="text-sm font-semibold tabular-nums text-gray-800">${day.day} ${MESES[Number(e.month) - 1]}</span>
    <span class="text-[11px] font-medium uppercase tracking-wide text-gray-400">${esc(day.weekday)}</span>
    <span class="ml-auto text-[11px] text-gray-400">${day.events.length} ${day.events.length === 1 ? 'evento' : 'eventos'}</span>
  </summary>
  <div class="ml-24 space-y-0.5 border-l-2 border-gray-200 pl-4">${rows}</div>
</details>`;
}

function fillMonth(year, month) {
  const padded = String(month).padStart(2, '0');
  const sec = document.getElementById(`month-${year}-${padded}`);
  if (!sec || sec.dataset.gvLoaded) return false;
  const data = window.__gvTimelineData || [];
  const yearN = Number(year), monthN = Number(month);
  const monthEvents = data.filter((e) => Number(e.year) === yearN && Number(e.month) === monthN);
  if (!monthEvents.length) return false;

  const daysMap = new Map();
  for (const e of monthEvents) {
    const key = `${e.day}`;
    if (!daysMap.has(key)) daysMap.set(key, { day: e.day, weekday: e.weekday, events: [] });
    daysMap.get(key).events.push(e);
  }
  const days = [...daysMap.values()].sort((a, b) => b.day - a.day);

  const container = sec.querySelector(':scope > details > div');
  if (!container) return false;
  const missing = days.filter((d) => {
    const dayKey = `${year}-${padded}-${String(d.day).padStart(2, '0')}`;
    return !document.getElementById(`day-${dayKey}`);
  });
  container.insertAdjacentHTML('beforeend', missing.map((d) => dayGroup({ year, month }, d)).join(''));
  sec.dataset.gvLoaded = '1';
  const loader = sec.querySelector('.month-loader');
  if (loader) loader.remove();
  return true;
}

export function forceFillMonth(key) {
  const [y, m] = String(key).split('-');
  return fillMonth(y, m);
}

export function initTimeline() {
  if (window.__gvTimelineInit) return;
  window.__gvTimelineInit = true;

  window.__gvFillMonth = forceFillMonth;

  const script = document.getElementById('timeline-index-data');
  if (!script) return;
  try {
    window.__gvTimelineData = JSON.parse(script.textContent || '[]');
  } catch {
    return;
  }

  const buttons = Array.from(document.querySelectorAll('[data-load-month]'));
  if (!buttons.length) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const btn = entry.target;
          fillMonth(btn.dataset.year, btn.dataset.month);
          observer.unobserve(btn);
        }
      },
      { rootMargin: '600px 0px' }
    );
    for (const btn of buttons) observer.observe(btn);
  } else {
    for (const btn of buttons) fillMonth(btn.dataset.year, btn.dataset.month);
  }
}
