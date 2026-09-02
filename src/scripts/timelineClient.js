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
  declaracion: 'rel-chip [--chip-hue:#0ea5e9]', accion: 'rel-chip [--chip-hue:#10b981]',
  anuncio: 'rel-chip [--chip-hue:#f59e0b]', decreto: 'rel-chip [--chip-hue:#a855f7]',
  proyecto: 'rel-chip [--chip-hue:#6366f1]', ley: 'rel-chip [--chip-hue:#3b82f6]',
  votacion: 'rel-chip [--chip-hue:#8b5cf6]', fallo_judicial: 'rel-chip [--chip-hue:#f43f5e]',
  entrevista: 'rel-chip [--chip-hue:#14b8a6]', publicacion: 'rel-chip [--chip-hue:#06b6d4]',
  documento: 'bg-base-200 text-base-content/70 ring-base-300', investigacion: 'rel-chip [--chip-hue:#f97316]',
  reaccion: 'rel-chip [--chip-hue:#ec4899]', resultado: 'rel-chip [--chip-hue:#10b981]',
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
    .map((t) => `<span class="inline-flex items-center gap-1 rounded-md bg-base-200 px-2 py-0.5 text-[11px] font-medium text-base-content/70"><span>${esc(t)}</span></span>`)
    .join('');
  const previews = (e.previews || [])
    .map((p) => `<span class="inline-flex max-w-full items-center gap-1 rounded-md bg-base-200/80 px-2 py-0.5 text-[10px] font-medium text-base-content/70"><span class="shrink-0 font-semibold text-base-content/80">${esc(RELATION_LABELS[p.tipo] || p.tipo)}:</span><span class="truncate text-base-content/60">${esc(p.titulo)}</span></span>`)
    .join('');
  const vinculo = e.links
    ? `<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary ring-1 ring-inset ring-primary/30"><span>${e.links} ${e.links === 1 ? 'vinculo' : 'vinculos'}</span></span>`
    : '';
  const hora = e.timeStr ? `<time class="inline-flex items-center gap-1 text-[11px] tabular-nums text-base-content/60"><span>${e.timeStr}</span></time>` : '';

  return `<a href="/events/${e.year}/${e.id}" class="group flex gap-3 rounded-lg py-3 transition-colors hover:bg-base-200/80">
  <article class="min-w-0 flex-1">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ring-1 ring-inset ${TIPO_STYLES[e.tipo] || 'bg-base-200 text-base-content/70 ring-base-300'}">${TIPO_LABELS[e.tipo] || e.tipo}</span>
          ${hora}
          ${vinculo}
        </div>
        <h4 style="view-transition-name:event-title-${e.id}" class="text-sm font-semibold leading-snug text-base-content text-balance transition-colors group-hover:text-primary sm:text-[15px]">${esc(e.titulo)}</h4>
        ${e.personas?.length ? `<p class="mt-1.5 flex items-center gap-1.5 truncate text-xs text-base-content/60"><span class="truncate">${esc(e.personas.join(', '))}</span></p>` : ''}
        ${temas ? `<div class="mt-2 flex flex-wrap gap-1">${temas}</div>` : ''}
        ${previews ? `<div class="mt-2.5 flex flex-wrap gap-1.5">${previews}</div>` : ''}
      </div>
      <span class="mt-5 h-4 w-4 shrink-0 text-base-content/30 transition-[translate,color] duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-primary">›</span>
    </div>
  </article>
</a>`;
}

function dayGroup(e, day) {
  const rows = day.events.map(eventRow).join('');
  const dayKey = `${e.year}-${String(e.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
  return `<details id="day-${dayKey}" class="group/day scroll-mt-32" open data-crumb-level="day" data-crumb-label="${day.day}">
  <summary class="relative flex cursor-pointer list-none items-center gap-2.5 py-2 pl-24 [&::-webkit-details-marker]:hidden">
    <span class="pointer-events-none absolute left-[15px] top-0 h-full w-20 border-b-2 border-l-2 border-base-300 rounded-bl-[10px]" aria-hidden="true"></span>
    <span class="text-sm font-semibold tabular-nums text-base-content">${day.day} ${MESES[Number(e.month) - 1]}</span>
    <span class="text-[11px] font-medium uppercase tracking-wide text-base-content/40">${esc(day.weekday)}</span>
    <span class="ml-auto text-[11px] text-base-content/40">${day.events.length} ${day.events.length === 1 ? 'evento' : 'eventos'}</span>
  </summary>
  <div class="ml-24 space-y-0.5 border-l-2 border-base-300 pl-4">${rows}</div>
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
  // Los scripts de pagina se re-ejecutan en cada navegacion (View Transitions).
  // En vez de un guard persistente (que dejaba el observer sin recrear al volver),
  // se desconecta el observer previo y se reconstruye con el DOM nuevo.
  if (window.__gvTimelineObserver) {
    window.__gvTimelineObserver.disconnect();
    window.__gvTimelineObserver = null;
  }

  window.__gvFillMonth = forceFillMonth;

  const script = document.getElementById('timeline-index-data');
  if (!script) return;
  try {
    window.__gvTimelineData = JSON.parse(script.textContent || '[]');
  } catch {
    return;
  }

  // Marcas de meses ya cargados anteriormente no aplican en el DOM nuevo.
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
    window.__gvTimelineObserver = observer;
    for (const btn of buttons) observer.observe(btn);
  } else {
    for (const btn of buttons) fillMonth(btn.dataset.year, btn.dataset.month);
  }
}
