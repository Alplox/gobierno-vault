// Grafo ego compacto del detalle de evento: d3-force en miniatura, con pan,
// zoom, drag y vecinos resaltados como en Obsidian. El SVG radial del
// componente se elimina del DOM al iniciar (nunca queda una copia debajo).
// Las etiquetas son cortas; el título completo va en tooltip (hover/foco) y en
// una tarjeta al tocar el nodo, porque en móvil no existe hover.

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
} from 'd3-force';

const NS = 'http://www.w3.org/2000/svg';
// El cleanup se guarda en window (ver initEgoGraph): el bundle puede evaluarse
// más de una vez y un guard de módulo dejaría dos SVGs superpuestos.

function el(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}
function trunc(text, max) {
  const s = String(text ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function init() {
  const root = document.querySelector('[data-gv-ego-widget]');
  if (!root) return;
  const stage = root.querySelector('[data-gv-ego-stage]');
  const dataEl = root.querySelector('[data-gv-ego-data]');
  const fallback = root.querySelector('[data-gv-ego-fallback]');
  const tip = root.querySelector('[data-gv-ego-tip]');
  const expandBtn = root.querySelector('[data-gv-ego-expand]');
  const card = root.querySelector('[data-gv-ego-card]');
  const moreBtn = root.querySelector('[data-gv-ego-more]');
  if (!stage || !dataEl) return;

  let data;
  try { data = JSON.parse(dataEl.textContent); } catch { return; }
  const nodes = (data.nodes ?? []).map((n) => ({
    ...n,
    r: n.kind === 'center' ? 12 : n.kind === 'inferred' ? 5 : 8,
  }));
  const links = (data.links ?? []).map((l) => ({ ...l }));
  // Nodos de segundo salto: vienen todos en el payload pero se revelan en
  // tandas. Al agregarlos se mutan `nodes`/`links` (mismas referencias de la
  // simulación) y se recalienta d3, sin reconstruir el SVG ni perder el estado.
  const indirect = (data.indirect ?? []).map((n) => ({ ...n, r: 5.5 }));
  const indirectLinks = data.indirectLinks ?? [];
  const colors = data.colors ?? {};
  if (nodes.length < 2) return;

  // Vecinos directos, calculados antes de que d3-force reemplace los IDs del
  // payload por referencias a nodos.
  const adjacency = new Map();
  for (const l of links) {
    if (!adjacency.has(l.source)) adjacency.set(l.source, new Set());
    if (!adjacency.has(l.target)) adjacency.set(l.target, new Set());
    adjacency.get(l.source).add(l.target);
    adjacency.get(l.target).add(l.source);
  }

  let W = stage.clientWidth || 320;
  let H = stage.clientHeight || 300;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let pinnedId = null;
  const offs = [];

  // Sin copia estática detrás del SVG interactivo.
  const fallbackParent = fallback?.parentNode;
  const fallbackNext = fallback?.nextSibling;
  fallback?.remove();

  const svg = el('svg', {
    width: '100%', height: '100%', viewBox: `0 0 ${W} ${H}`,
    role: 'img', 'aria-label': 'Grafo interactivo de conexiones del evento',
  });
  svg.style.cssText = 'position:absolute;inset:0;cursor:grab;touch-action:none;font-family:system-ui,-apple-system,sans-serif;';
  stage.appendChild(svg);
  const g = el('g');
  const gLinks = el('g');
  const gNodes = el('g');
  g.append(gLinks, gNodes);
  svg.appendChild(g);

  const linkEls = [];
  function addLinkEl(l) {
    // Capturar los IDs antes de que forceLink los reemplace por referencias.
    const sid = l.source;
    const tid = l.target;
    const inferred = l.kind === 'inferred';
    const indirectLink = l.kind === 'indirect';
    const line = el('line', {
      stroke: colors[l.tipo] ?? '#78716c',
      'stroke-width': indirectLink || inferred ? 1 : 1.6,
      'stroke-opacity': indirectLink ? 0.32 : inferred ? 0.45 : 0.65,
      'stroke-dasharray': indirectLink ? '2 4' : inferred ? '3 3' : undefined,
    });
    gLinks.appendChild(line);
    linkEls.push({ l, line, sid, tid });
  }
  for (const l of links) addLinkEl(l);

  const nodeEls = [];
  function addNodeEl(n) {
    const a = el('a', { href: n.url || '#', tabindex: '0' });
    if (n.kind === 'indirect') a.classList.add('is-extra');
    a.dataset.nodeId = n.id;
    a.setAttribute('aria-label', `${n.label} · ${n.relation}${n.depth === 2 && n.via ? ` vía ${trunc(n.via, 42)}` : ''}`);
    const circle = el('circle', {
      r: n.r,
      fill: n.color,
      stroke: 'var(--color-base-100)',
      'stroke-width': n.kind === 'center' ? 2.5 : 1.5,
    });
    const labelText = trunc(n.label, n.kind === 'center' ? 24 : 21);
    const boxW = labelText.length * 4.1 + 10;
    const bg = el('rect', {
      x: -boxW / 2,
      y: n.r + 2,
      width: boxW,
      height: 14,
      rx: 3,
      fill: 'var(--color-base-100)',
      'fill-opacity': 0.88,
      'pointer-events': 'none',
    });
    const label = el('text', {
      y: n.r + 12,
      'text-anchor': 'middle',
      fill: 'var(--color-base-content)',
      'font-size': n.kind === 'center' ? 9 : 8,
      'font-weight': n.kind === 'center' ? 700 : 500,
      'pointer-events': 'none',
    });
    label.textContent = labelText;
    a.append(bg, circle, label);
    gNodes.appendChild(a);
    nodeEls.push({ n, a, circle });
    wireNode(a, n);
  }
  for (const n of nodes) addNodeEl(n);

  const linkForce = forceLink(links).id((d) => d.id)
    .distance((l) => (l.kind === 'inferred' ? 116 : l.kind === 'indirect' ? 96 : 78))
    .strength((l) => (l.kind === 'indirect' ? 0.35 : 0.55));
  const sim = forceSimulation(nodes)
    .force('link', linkForce)
    .force('charge', forceManyBody().strength(-160))
    .force('collide', forceCollide().radius((d) => d.r + 18))
    .force('center', forceCenter(W / 2, H / 2))
    .force('x', forceX(W / 2).strength(0.045))
    .force('y', forceY(H / 2).strength(0.045))
    .alphaDecay(0.045);

  const centerNode = nodes.find((n) => n.kind === 'center') ?? nodes[0];
  centerNode.fx = W / 2;
  centerNode.fy = H / 2;

  sim.on('tick', () => {
    for (const { l, line } of linkEls) {
      line.setAttribute('x1', l.source.x);
      line.setAttribute('y1', l.source.y);
      line.setAttribute('x2', l.target.x);
      line.setAttribute('y2', l.target.y);
    }
    for (const { n, a } of nodeEls) a.setAttribute('transform', `translate(${n.x},${n.y})`);
  });

  function applyTransform() {
    g.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
  }
  function toLocal(clientX, clientY) {
    const r = svg.getBoundingClientRect();
    return { x: (clientX - r.left - tx) / scale, y: (clientY - r.top - ty) / scale };
  }
  function fit() {
    W = stage.clientWidth || 320;
    H = stage.clientHeight || 300;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    centerNode.fx = W / 2;
    centerNode.fy = H / 2;
    sim.force('center', forceCenter(W / 2, H / 2))
      .force('x', forceX(W / 2).strength(0.045))
      .force('y', forceY(H / 2).strength(0.045));
    tx = 0; ty = 0; scale = 1;
    applyTransform();
    sim.alpha(0.5).restart();
  }

  function highlight(id) {
    const active = id ?? pinnedId;
    const neighbors = active ? adjacency.get(active) ?? new Set() : null;
    for (const { n, a } of nodeEls) {
      a.classList.toggle('is-dim', !!active && n.id !== active && !neighbors.has(n.id));
    }
    for (const { line, sid, tid } of linkEls) {
      const lit = !!active && (sid === active || tid === active);
      line.classList.toggle('is-dim', !!active && !lit);
      line.classList.toggle('is-lit', lit);
    }
  }

  // Revela el segundo salto en tandas: se mutan las mismas referencias que
  // usan d3-force y el tick, así que basta con recalentar la simulación.
  const BATCH = 12;
  let shownIndirect = 0;
  function updateMoreButton() {
    if (!moreBtn) return;
    const remaining = indirect.length - shownIndirect;
    moreBtn.classList.toggle('hidden', remaining <= 0);
    moreBtn.textContent = `Cargar conexiones indirectas (+${remaining})`;
  }
  function loadMore() {
    const batch = indirect.slice(shownIndirect, shownIndirect + BATCH);
    if (!batch.length) return;
    const batchIds = new Set(batch.map((n) => n.id));
    for (const n of batch) {
      nodes.push(n);
      addNodeEl(n);
      if (!adjacency.has(n.parentId)) adjacency.set(n.parentId, new Set());
      if (!adjacency.has(n.id)) adjacency.set(n.id, new Set());
      adjacency.get(n.parentId).add(n.id);
      adjacency.get(n.id).add(n.parentId);
    }
    for (const l of indirectLinks) {
      if (!batchIds.has(l.target)) continue;
      links.push(l);
      addLinkEl(l);
    }
    shownIndirect += batch.length;
    sim.nodes(nodes);
    linkForce.links(links);
    sim.alpha(0.65).restart();
    updateMoreButton();
    highlight();
  }
  moreBtn?.addEventListener('click', loadMore);
  offs.push(() => moreBtn?.removeEventListener('click', loadMore));
  updateMoreButton();

  function showTip(n, x, y) {
    if (!tip) return;
    tip.replaceChildren();
    const strong = document.createElement('strong');
    strong.textContent = n.label;
    const small = document.createElement('span');
    small.className = 'mt-0.5 block text-[11px] text-base-content/80';
    // `relation` y `tipoLabel` son cosas distintas (vínculo vs. tipo de evento):
    // si coinciden, o si llega una clave cruda, no repetir / no mostrar la clave.
    const meta = [n.relation];
    if (n.tipoLabel && n.tipoLabel !== n.relation && !/^[a-z_]+$/.test(n.tipoLabel)) {
      meta.push(n.tipoLabel);
    }
    meta.push(n.fecha);
    if (n.depth === 2 && n.via) meta.push(`vía ${trunc(n.via, 42)}`);
    small.textContent = meta.filter(Boolean).join(' · ');
    tip.append(strong, small);
    tip.classList.remove('hidden');
    const pad = 12;
    const w = tip.offsetWidth;
    const h = tip.offsetHeight;
    tip.style.left = `${Math.min(window.innerWidth - w - pad, Math.max(pad, x + 12))}px`;
    tip.style.top = `${Math.min(window.innerHeight - h - pad, Math.max(pad, y + 12))}px`;
  }
  function hideTip() { tip?.classList.add('hidden'); }

  function showCard(n) {
    if (!card) return;
    card.querySelector('[data-gv-ego-card-relation]').textContent = `${n.relation}${n.depth === 2 && n.via ? ` · vía ${trunc(n.via, 42)}` : ''} · ${n.fecha}`;
    card.querySelector('[data-gv-ego-card-title]').textContent = n.label;
    const open = card.querySelector('[data-gv-ego-card-open]');
    open.href = n.url || '#';
    card.classList.remove('hidden');
    card.classList.add('is-open');
  }
  function hideCard() {
    card?.classList.add('hidden');
    card?.classList.remove('is-open');
  }
  function clearSelection() {
    pinnedId = null;
    hideCard();
    highlight(null);
  }
  function navigate(url) {
    const a = document.createElement('a');
    a.href = url;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function wireNode(a, n) {
    a.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      // Evita el click nativo del <a>: la navegación la decidimos aquí.
      e.preventDefault();
      try { a.setPointerCapture?.(e.pointerId); } catch { /* puntero sintético */ }
      const start = { x: e.clientX, y: e.clientY };
      let moved = false;
      n.fx = n.x; n.fy = n.y;
      sim.alphaTarget(0.25).restart();
      const move = (ev) => {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 4) moved = true;
        const p = toLocal(ev.clientX, ev.clientY);
        n.fx = p.x; n.fy = p.y;
      };
      const up = (ev) => {
        if (ev && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 4) moved = true;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        sim.alphaTarget(0);
        if (n.kind !== 'center') {
          n.fx = null; n.fy = null;
          if (!moved && n.url) {
            if (pinnedId === n.id) navigate(n.url);
            else {
              pinnedId = n.id;
              showCard(n);
              highlight();
              hideTip();
            }
          }
        }
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once: true });
      offs.push(() => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      });
    });
    // El <a> nativo dispararía click incluso tras arrastrar: se anula siempre
    // y la navegación la decide el puntero (o Enter, para teclado).
    a.addEventListener('click', (e) => e.preventDefault());
    a.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (!n.url) return;
      if (pinnedId === n.id) navigate(n.url);
      else { pinnedId = n.id; showCard(n); highlight(); }
    });
    a.addEventListener('pointerenter', (e) => { showTip(n, e.clientX, e.clientY); highlight(n.id); });
    a.addEventListener('pointermove', (e) => showTip(n, e.clientX, e.clientY));
    a.addEventListener('pointerleave', () => { hideTip(); highlight(); });
    a.addEventListener('focus', () => { const r = a.getBoundingClientRect(); showTip(n, r.left, r.top); highlight(n.id); });
    a.addEventListener('blur', () => { hideTip(); highlight(); });
  }

  const onCardClose = (e) => { e.stopPropagation(); clearSelection(); };
  const onCardOpen = (e) => {
    e.preventDefault();
    const n = nodes.find((x) => x.id === pinnedId);
    if (n?.url) navigate(n.url);
  };
  card?.querySelector('[data-gv-ego-card-close]')?.addEventListener('click', onCardClose);
  card?.querySelector('[data-gv-ego-card-open]')?.addEventListener('click', onCardOpen);
  offs.push(() => {
    card?.querySelector('[data-gv-ego-card-close]')?.removeEventListener('click', onCardClose);
    card?.querySelector('[data-gv-ego-card-open]')?.removeEventListener('click', onCardOpen);
  });

  // Pan del fondo y zoom con rueda.
  svg.addEventListener('pointerdown', (e) => {
    if (e.target !== svg && e.target !== g && e.target !== gLinks && e.target !== gNodes) return;
    if (pinnedId) clearSelection();
    const start = { x: e.clientX, y: e.clientY, tx, ty };
    svg.style.cursor = 'grabbing';
    const move = (ev) => {
      tx = start.tx + ev.clientX - start.x;
      ty = start.ty + ev.clientY - start.y;
      applyTransform();
    };
    const up = () => {
      svg.style.cursor = 'grab';
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    offs.push(() => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    });
  });
  const onWheel = (e) => {
    e.preventDefault();
    const p = toLocal(e.clientX, e.clientY);
    const next = Math.min(3, Math.max(0.4, scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
    const r = svg.getBoundingClientRect();
    tx = e.clientX - r.left - p.x * next;
    ty = e.clientY - r.top - p.y * next;
    scale = next;
    applyTransform();
  };
  svg.addEventListener('wheel', onWheel, { passive: false });
  offs.push(() => svg.removeEventListener('wheel', onWheel));

  function toggleExpand() {
    const open = root.classList.toggle('is-expanded');
    document.body.classList.toggle('gv-ego-expanded', open);
    expandBtn?.setAttribute('aria-label', open ? 'Cerrar grafo expandido' : 'Expandir grafo');
    root.querySelector('.gv-ego-expand-in')?.classList.toggle('hidden', open);
    root.querySelector('.gv-ego-expand-out')?.classList.toggle('hidden', !open);
    fit();
  }
  expandBtn?.addEventListener('click', toggleExpand);
  const onKey = (e) => {
    if (e.key === 'Escape') {
      if (root.classList.contains('is-expanded')) toggleExpand();
      else if (pinnedId) clearSelection();
    }
  };
  window.addEventListener('keydown', onKey);
  offs.push(() => window.removeEventListener('keydown', onKey));
  if (expandBtn) offs.push(() => expandBtn.removeEventListener('click', toggleExpand));

  const ro = new ResizeObserver(() => fit());
  ro.observe(stage);

  return () => {
    sim.stop();
    ro.disconnect();
    while (offs.length) { try { offs.pop()(); } catch { /* noop */ } }
    svg.remove();
    if (fallback && fallbackParent) fallbackParent.insertBefore(fallback, fallbackNext);
    root.classList.remove('is-expanded');
    document.body.classList.remove('gv-ego-expanded');
    hideCard();
    hideTip();
  };
}

export function initEgoGraph() {
  const w = window;
  if (!w.__gvEgoInitHooked) {
    w.__gvEgoInitHooked = true;
    // page-load también corre en la carga inicial y en cada navegación VT:
    // debe limpiar antes de recrear, si no se apilan SVGs.
    document.addEventListener('astro:page-load', () => {
      w.__gvEgoCleanup?.();
      w.__gvEgoCleanup = w.__gvEgoRun?.();
    });
  }
  w.__gvEgoRun = init;
  w.__gvEgoCleanup?.();
  w.__gvEgoCleanup = init();
}
