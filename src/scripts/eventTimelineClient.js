// Rail de línea de tiempo del detalle de evento: permite volver al evento
// actual (que queda enterrado entre tarjetas al desplazarse) y avisa de cuántas
// tarjetas hay fuera del viewport, arriba y abajo.

function init() {
  const root = document.querySelector('[data-gv-tl]');
  if (!root) return () => {};
  const stage = root.querySelector('[data-gv-tl-stage]');
  const current = root.querySelector('[data-gv-tl-current]');
  const items = [...root.querySelectorAll('[data-gv-tl-item]')];
  const button = root.querySelector('[data-gv-tl-focus]');
  const offscreen = root.querySelector('[data-gv-tl-offscreen]');
  const total = Number(root.dataset.gvTlTotal || items.length);
  if (!current || !items.length) return () => {};

  // En escritorio el rail tiene scroll propio: la zona visible es la
  // intersección entre el viewport y ese contenedor, no solo el viewport.
  let scroller = stage?.parentElement ?? null;
  while (scroller && !/(auto|scroll)/.test(getComputedStyle(scroller).overflowY)) {
    scroller = scroller.parentElement;
  }
  let ticking = false;
  function update() {
    ticking = false;
    const sr = scroller?.getBoundingClientRect();
    const top = Math.max(0, sr?.top ?? 0);
    const bottom = Math.min(window.innerHeight, sr?.bottom ?? window.innerHeight);
    let above = 0;
    let below = 0;
    for (const el of items) {
      const r = el.getBoundingClientRect();
      if (r.bottom < top) above++;
      else if (r.top > bottom) below++;
    }
    if (!offscreen) return;
    offscreen.textContent = above || below
      ? `↑ ${above} · ↓ ${below} · ${total} en total`
      : `${total} en total · todos visibles`;
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }
  const onFocus = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    current.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  };

  button?.addEventListener('click', onFocus);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();

  return () => {
    button?.removeEventListener('click', onFocus);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
  };
}

export function initEventTimeline() {
  const w = window;
  if (!w.__gvTimelineInitHooked) {
    w.__gvTimelineInitHooked = true;
    document.addEventListener('astro:page-load', () => {
      w.__gvTimelineCleanup?.();
      w.__gvTimelineCleanup = w.__gvTimelineRun?.();
    });
  }
  w.__gvTimelineRun = init;
  w.__gvTimelineCleanup?.();
  w.__gvTimelineCleanup = init();
}
