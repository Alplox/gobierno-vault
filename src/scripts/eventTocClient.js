// Índice del detalle de evento: rail lateral en escritorio ancho, <details>
// plegable sobre el cuerpo en móvil. El flotado/acoplamiento de la línea de
// tiempo NO vive aquí: es position:sticky dentro del rail de grid.Este módulo
// construye el TOC, resalta el tramo activo y decide cuándo hay espacio para
// las 3 columnas.
//
// El TOC se arma en cliente a partir de los h2/h3 ya renderizados en .prose
// (con IDs puestos por Astro) + las secciones fijas de la ficha. Así no se
// toca el pipeline markdown y el texto mostrado es la fuente de verdad.

const WIDE_QUERY = '(min-width: 76rem)';
let wired = false;
let cleanupCurrent = null;

function headingText(el) {
  const clone = el.cloneNode(true);
  // Tooltips de fuente y marcadores: el texto visible del encabezado, sin ruido.
  clone.querySelectorAll('.source-ref-tip').forEach((n) => n.remove());
  clone.querySelectorAll('.source-ref').forEach((n) => {
    const num = n.querySelector('.source-ref-num');
    n.replaceWith(num ? `[${num.textContent ?? ''}]` : '');
  });
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function makeId(text, used) {
  const base = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'seccion';
  let id = base;
  let n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

function build() {
  const shell = document.getElementById('gv-event-shell');
  const list = document.getElementById('gv-event-toc-list');
  const mobileList = document.getElementById('gv-event-toc-list-mobile');
  if (!shell || !list) return () => {};

  const lists = [list, mobileList].filter(Boolean);
  const hasTimeline = shell.dataset.hasTimeline === '1';
  const prose = shell.querySelector('.prose');
  const usedIds = new Set();
  // Dos grupos: lo que escribió el evento y lo que añade la ficha. Se pintan
  // separados para que no se confundan los títulos del cuerpo con las
  // secciones generadas por la página.
  const eventEntries = [{ id: 'evento-body', title: 'Resumen', level: 2 }];
  const pageEntries = [];

  const headings = prose ? [...prose.querySelectorAll('h2, h3')] : [];
  for (const h of headings) {
    const title = headingText(h);
    if (!title) continue;
    if (!h.id) h.id = makeId(title, usedIds);
    else usedIds.add(h.id);
    eventEntries.push({ id: h.id, title, level: h.tagName === 'H3' ? 3 : 2 });
  }

  const fixed = [
    ['entidades', 'Entidades y etiquetas'],
    ['linea-tiempo', 'Línea de tiempo'],
    ['conexiones', 'Conexiones'],
    ['referencias', 'Referencias y fuentes'],
  ];
  for (const [id, title] of fixed) {
    if (shell.querySelector(`[data-toc-target="${id}"]`)) pageEntries.push({ id, title, level: 2 });
  }

  const links = [];
  const timelineLinks = [];
  function addGroup(label, entries) {
    if (entries.length === 0) return;
    for (const targetList of lists) {
      const group = document.createElement('div');
      group.className = 'gv-event-toc-group';
      const title = document.createElement('div');
      title.className = 'gv-event-toc-label';
      title.textContent = label;
      group.appendChild(title);
      for (const entry of entries) {
        const a = document.createElement('a');
        a.href = `#${entry.id}`;
        a.dataset.tocId = entry.id;
        a.dataset.level = String(entry.level);
        a.textContent = entry.title;
        if (entry.level === 3) a.setAttribute('aria-level', '3');
        group.appendChild(a);
        links.push(a);
        if (entry.id === 'linea-tiempo') timelineLinks.push(a);
      }
      targetList.appendChild(group);
    }
  }

  for (const targetList of lists) targetList.replaceChildren();
  addGroup('Del evento', eventEntries);
  addGroup('De esta ficha', pageEntries);

  if (mobileList) {
    const details = document.getElementById('gv-event-toc-mobile');
    mobileList.addEventListener('click', (e) => {
      if (e.target.closest('a') && details) details.open = false;
    });
  }

  const entries = [...eventEntries, ...pageEntries];
  const mobileBar = document.getElementById('gv-event-toc-mobile');
  let lastScrollY = window.scrollY;
  let barHidden = false;

  function setBarHidden(hidden) {
    if (!mobileBar || barHidden === hidden) return;
    barHidden = hidden;
    mobileBar.classList.toggle('gv-bottom-nav-hidden', hidden);
    // Fuera de pantalla no debe recibir Tab ni clics «invisibles».
    mobileBar.inert = hidden;
  }

  // Al bajar la barra se aparta; al subir vuelve. Abierta o en escritorio
  // permanece visible siempre (el usuario la está usando o no existe).
  function updateBar() {
    if (!mobileBar || mq.matches || mobileBar.open) {
      setBarHidden(false);
      lastScrollY = window.scrollY;
      return;
    }
    const y = window.scrollY;
    const dy = y - lastScrollY;
    if (Math.abs(dy) < 8) return; // umbral: evita parpadeo en scroll mínimo
    setBarHidden(dy > 0);
    lastScrollY = y;
  }

  const onBarToggle = () => {
    if (mobileBar?.open) {
      setBarHidden(false);
      lastScrollY = window.scrollY;
    }
  };
  mobileBar?.addEventListener('toggle', onBarToggle);

  let targets = [];
  let ticking = false;
  function updateActive() {
    ticking = false;
    updateBar();
    let active = targets[0]?.id ?? null;
    for (const el of targets) {
      if (!el.isConnected || el.getClientRects().length === 0) continue;
      if (el.getBoundingClientRect().top <= 140) active = el.id;
      else break;
    }
    for (const a of links) {
      const on = a.dataset.tocId === active;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  }
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateActive);
  }

  const mq = window.matchMedia(WIDE_QUERY);
  function applyMode() {
    const wide = mq.matches;
    shell.classList.toggle('is-enhanced', wide);
    shell.classList.toggle('no-timeline', !hasTimeline);
    // En escritorio la línea de tiempo ya está siempre visible en el rail:
    // enlace redundante y que además sabotearía el resaltado del TOC.
    const hideTimelineLink = wide && hasTimeline;
    for (const a of timelineLinks) a.hidden = hideTimelineLink;
    targets = entries
      .filter((e) => !(e.id === 'linea-tiempo' && hideTimelineLink))
      .map((e) => document.getElementById(e.id))
      .filter(Boolean);
    updateActive();
  }
  mq.addEventListener('change', applyMode);
  applyMode();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('resize', onScroll);
    mq.removeEventListener('change', applyMode);
    mobileBar?.removeEventListener('toggle', onBarToggle);
  };
}

function init() {
  cleanupCurrent?.();
  cleanupCurrent = build();
}

export function initEventToc() {
  if (!wired) {
    wired = true;
    document.addEventListener('astro:page-load', init);
  }
  init();
}
