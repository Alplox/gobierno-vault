// Índice de /sueldos con el mismo comportamiento que el TOC del detalle de
// evento: rail lateral en escritorio ancho y barra inferior plegable en móvil.
// Comparte las clases .gv-event-toc* de global.css; este módulo es propio para
// no acoplar la página de datos al script de la ficha de evento.
//
// Las entradas se leen de las secciones ya renderizadas (id + h2), así que
// reordenar secciones no exige tocar este archivo. El segundo grupo se decide
// en el template con data-toc-contexto (IDs separados por coma).

const WIDE_QUERY = '(min-width: 76rem)';
let wired = false;
let cleanupCurrent = null;

function headingText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.source-ref-tip').forEach((n) => n.remove());
  clone.querySelectorAll('.source-ref').forEach((n) => {
    const num = n.querySelector('.source-ref-num');
    n.replaceWith(num ? `[${num.textContent ?? ''}]` : '');
  });
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function build() {
  const shell = document.getElementById('gv-sueldos-shell');
  const list = document.getElementById('gv-sueldos-toc-list');
  const mobileList = document.getElementById('gv-sueldos-toc-list-mobile');
  const mobileBar = document.getElementById('gv-sueldos-toc-mobile');
  if (!shell || !list) return () => {};

  const lists = [list, mobileList].filter(Boolean);
  const contexto = new Set((shell.dataset.tocContexto ?? '').split(',').filter(Boolean));
  const sections = [...shell.querySelectorAll('article section[id]')];
  const entries = sections
    .map((section) => {
      const title = headingText(section.querySelector('h2') ?? section);
      if (!title) return null;
      return { id: section.id, title, group: contexto.has(section.id) ? 1 : 0 };
    })
    .filter(Boolean);
  if (entries.length === 0) return () => {};

  const links = [];
  function addGroup(label, group) {
    const items = entries.filter((e) => e.group === group);
    if (items.length === 0) return;
    for (const targetList of lists) {
      const wrap = document.createElement('div');
      wrap.className = 'gv-event-toc-group';
      const title = document.createElement('div');
      title.className = 'gv-event-toc-label';
      title.textContent = label;
      wrap.appendChild(title);
      for (const entry of items) {
        const a = document.createElement('a');
        a.href = `#${entry.id}`;
        a.dataset.tocId = entry.id;
        a.textContent = entry.title;
        wrap.appendChild(a);
        links.push(a);
      }
      targetList.appendChild(wrap);
    }
  }

  for (const targetList of lists) targetList.replaceChildren();
  addGroup('Comparación e ingresos', 0);
  addGroup('Registro y contexto', 1);

  if (mobileList) {
    mobileList.addEventListener('click', (e) => {
      if (e.target.closest('a') && mobileBar) mobileBar.open = false;
    });
  }

  let lastScrollY = window.scrollY;
  let barHidden = false;
  function setBarHidden(hidden) {
    if (!mobileBar || barHidden === hidden) return;
    barHidden = hidden;
    mobileBar.classList.toggle('gv-bottom-nav-hidden', hidden);
    mobileBar.inert = hidden;
  }
  // Al bajar se aparta, al subir vuelve. Abierta o en escritorio queda visible.
  function updateBar() {
    if (!mobileBar || mq.matches || mobileBar.open) {
      setBarHidden(false);
      lastScrollY = window.scrollY;
      return;
    }
    const y = window.scrollY;
    const dy = y - lastScrollY;
    if (Math.abs(dy) < 8) return;
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

  const mq = window.matchMedia(WIDE_QUERY);
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
  function applyMode() {
    shell.classList.toggle('is-enhanced', mq.matches);
    targets = entries.map((e) => document.getElementById(e.id)).filter(Boolean);
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

export function initSueldosToc() {
  if (!wired) {
    wired = true;
    document.addEventListener('astro:page-load', init);
  }
  init();
}
