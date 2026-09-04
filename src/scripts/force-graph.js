import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

const EDGE_COLORS = {
  contradice: '#ef4444', confirma: '#10b981', cumple: '#10b981',
  incumple: '#ef4444', amplia: '#0ea5e9', corrige: '#f59e0b',
  rectifica: '#f59e0b', responde_a: '#8b5cf6', deriva_en: '#6366f1',
  provoca: '#f97316', cita: '#78716c', reemplaza: '#06b6d4',
  actualiza: '#3b82f6', mismo_contexto: '#a8a29e',
};

const cleanupFns = [];

function cleanup() {
  while (cleanupFns.length) {
    const fn = cleanupFns.pop();
    try { fn(); } catch { /* noop */ }
  }
  // Remueve SVGs interactivos creados en inits previos. Si init corre dos veces
  // sobre el mismo DOM (llamada directa + astro:page-load en la carga inicial),
  // sin esto se apilarian dos SVGs. El SVG estatico de fallback no se toca aqui:
  // el init siguiente lo vuelve a ocultar (idempotente).
  document.querySelectorAll('svg[data-gv-graph]').forEach((el) => el.remove());
}

function addWindowListener(type, handler) {
  window.addEventListener(type, handler);
  cleanupFns.push(() => window.removeEventListener(type, handler));
}

// --- Filtros de /graph (solo full + form #graph-filters presente; mini no los usa) ---
function norm(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function readGraphFilters() {
  const form = document.getElementById('graph-filters');
  if (!form) return null;
  const val = (id) => document.getElementById(id)?.value ?? '';
  return {
    q: val('graph-q').trim(),
    tipo: val('graph-tipo'),
    year: val('graph-year') ? Number(val('graph-year')) : 0,
    tema: val('graph-tema'),
    persona: val('graph-persona'),
    org: val('graph-org'),
    minConn: Math.max(0, parseInt(document.getElementById('graph-minconn')?.value || '0', 10) || 0),
  };
}

// URL <-> controles (vistas compartibles ?q=&tipo=&year=&tema=&persona=&org=&minconn=&aislados=1).
// Se sincroniza una vez por query distinto: con View Transitions el modulo persiste
// y una visita nueva puede traer otro query.
function syncGraphControlsFromURL() {
  const key = location.search;
  if (window.__gvGraphURLSynced === key) return;
  window.__gvGraphURLSynced = key;
  let sp;
  try { sp = new URLSearchParams(key); } catch { return; }
  const set = (id, v) => { const el = document.getElementById(id); if (el && v != null) el.value = v; };
  set('graph-q', sp.get('q') || '');
  set('graph-tipo', sp.get('tipo') || '');
  set('graph-year', sp.get('year') || '');
  set('graph-tema', sp.get('tema') || '');
  set('graph-persona', sp.get('persona') || '');
  set('graph-org', sp.get('org') || '');
  set('graph-minconn', sp.get('minconn') || '0');
  const iso = document.getElementById('graph-include-isolated');
  if (iso) iso.checked = sp.get('aislados') === '1';
}

function writeGraphURL(f) {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.tipo) sp.set('tipo', f.tipo);
  if (f.year) sp.set('year', String(f.year));
  if (f.tema) sp.set('tema', f.tema);
  if (f.persona) sp.set('persona', f.persona);
  if (f.org) sp.set('org', f.org);
  if (f.minConn > 0) sp.set('minconn', String(f.minConn));
  if (document.getElementById('graph-include-isolated')?.checked) sp.set('aislados', '1');
  const qs = sp.toString();
  try { history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '')); } catch { /* noop */ }
}

function graphFiltersActive(f) {
  return !!(f.q || f.tipo || f.year || f.tema || f.persona || f.org || f.minConn > 0 ||
    document.getElementById('graph-include-isolated')?.checked);
}

function updateGraphUI(f, shown, total) {
  const count = document.getElementById('graph-count');
  if (count) count.textContent = `Mostrando ${shown} de ${total}`;
  document.getElementById('graph-clear')?.classList.toggle('hidden', !graphFiltersActive(f));
}

// Cablea controles una sola vez por DOM (guard en el form: tras un swap de View
// Transitions el form es nuevo y hay que re-cablear). Incluye el checkbox de
// aislados, que vive en el header fuera del form.
function wireGraphFilters() {
  const form = document.getElementById('graph-filters');
  if (!form || form.__gvWired) return;
  form.__gvWired = true;
  let searchTimer = 0;
  form.addEventListener('input', (e) => {
    const id = e.target?.id;
    if (id === 'graph-q') {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(init, 250);
    } else if (id === 'graph-minconn') {
      init();
    }
    // selects: los cubre 'change' (algunos navegadores disparan ambos).
  });
  form.addEventListener('change', () => init());
  document.getElementById('graph-include-isolated')?.addEventListener('change', () => init());
  document.getElementById('graph-clear')?.addEventListener('click', () => {
    form.reset();
    const iso = document.getElementById('graph-include-isolated');
    if (iso) iso.checked = false;
    init();
  });
}

function init() {
  // Debounce del doble init (llamada directa + astro:page-load en la misma carga):
  // si el SVG interactivo acaba de crearse, este init es redundante y solo
  // re-barajaria los nodos. Los re-inits legitimos (checkbox, navegacion VT)
  // ocurren mucho despues de 300ms.
  const prevSvg = document.getElementById('graph-container')?.querySelector('svg[data-gv-graph]');
  if (prevSvg && performance.now() - Number(prevSvg.dataset.builtAt || 0) < 300) return;
  cleanup();
  const dataEl = document.getElementById('graph-data');
  const container = document.getElementById('graph-container');
  if (!dataEl || !container) return;

  let data;
  try { data = JSON.parse(dataEl.textContent); } catch { return; }
  let { nodes: nodesData, links: linksData, size = 'full' } = data;
  if (!nodesData?.length) return;

  const totalNodes = nodesData.length;
  const isMini = size === 'mini';

  // Toggle "Incluir sin conexiones" (solo full): por defecto se muestran solo los
  // eventos con conexiones explicitas — los aislados son ruido visual y encarecen
  // la simulacion en movil. El cambio del checkbox re-ejecuta init().
  const includeIsolated = document.getElementById('graph-include-isolated')?.checked ?? true;
  if (!isMini && !includeIsolated) {
    nodesData = nodesData.filter((n) => n.connected !== false);
    const ids = new Set(nodesData.map((n) => n.id));
    linksData = linksData.filter((l) => ids.has(l.source) && ids.has(l.target));
  }

  // Filtros de /graph (ver helpers arriba): se aplican sobre el resultado del
  // toggle de aislados y recortan links a nodos visibles.
  let graphFilters = null;
  if (!isMini && document.getElementById('graph-filters')) {
    syncGraphControlsFromURL();
    graphFilters = readGraphFilters();
    const q = norm(graphFilters.q);
    nodesData = nodesData.filter((n) =>
      (!graphFilters.tipo || n.tipo === graphFilters.tipo) &&
      (!graphFilters.year || n.year === graphFilters.year) &&
      (!graphFilters.tema || (n.temas || []).includes(graphFilters.tema)) &&
      (!graphFilters.persona || (n.personas || []).includes(graphFilters.persona)) &&
      (!graphFilters.org || (n.orgs || []).includes(graphFilters.org)) &&
      (!(graphFilters.minConn > 0) || (n.connections || 0) >= graphFilters.minConn) &&
      (!q || (n.search || norm(n.label)).includes(q))
    );
    const ids = new Set(nodesData.map((n) => n.id));
    linksData = linksData.filter((l) => ids.has(l.source) && ids.has(l.target));
    writeGraphURL(graphFilters);
    updateGraphUI(graphFilters, nodesData.length, totalNodes);
  }
  wireGraphFilters();
  if (!nodesData.length) {
    const skeletonEmpty = container.querySelector('[data-graph-skeleton]');
    if (skeletonEmpty) skeletonEmpty.style.display = 'none';
    document.getElementById('graph-empty')?.classList.remove('hidden');
    return;
  }
  document.getElementById('graph-empty')?.classList.add('hidden');
  const W = parseInt(container.dataset.width) || (isMini ? 800 : 1200);
  const H = parseInt(container.dataset.height) || (isMini ? 280 : 600);
  const R = isMini ? 6 : 8;
  const MAX_LABEL = isMini ? 28 : 42;
  const FONT_SIZE = isMini ? 9 : 11;

  // Hide skeleton / static SVG fallback (skeleton reemplaza al SVG solapado, se oculta al crear el SVG interactivo)
  const skeleton = container.querySelector('[data-graph-skeleton]');
  if (skeleton) skeleton.style.display = 'none';
  const staticSvg = container.querySelector('svg');
  if (staticSvg) staticSvg.style.display = 'none';

  // Create interactive SVG
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('data-gv-graph', '1');
  svg.dataset.builtAt = String(Math.round(performance.now()));
  svg.setAttribute('width', '100%');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.style.cursor = 'grab';
  svg.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  if (!isMini) svg.style.height = '100%';
  container.appendChild(svg);

  // Defs (arrow markers)
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const markerTypes = [...new Set(linksData.map(l => l.tipo))];
  markerTypes.forEach(tipo => {
    const m = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    m.setAttribute('id', `arrow-${tipo}`);
    m.setAttribute('viewBox', '0 0 10 6');
    m.setAttribute('refX', '10');
    m.setAttribute('refY', '3');
    m.setAttribute('markerWidth', '8');
    m.setAttribute('markerHeight', '6');
    m.setAttribute('orient', 'auto-start-reverse');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', 'M0,0 L10,3 L0,6');
    p.setAttribute('fill', EDGE_COLORS[tipo] || '#78716c');
    m.appendChild(p);
    defs.appendChild(m);
  });
  svg.appendChild(defs);

  // Zoom container
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  svg.appendChild(g);
  const gLinks = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  const gNodes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.appendChild(gLinks);
  g.appendChild(gNodes);

  // Nodes
  const nodes = nodesData.map(n => ({ ...n }));
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  // Links
  const links = linksData.map(l => ({
    source: nodeMap[l.source],
    target: nodeMap[l.target],
    tipo: l.tipo,
    label: l.label,
  })).filter(l => l.source && l.target);

  // Render edges
  const edgeLines = [];
  links.forEach(l => {
    const color = EDGE_COLORS[l.tipo] || '#78716c';
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-opacity', '0.5');
    line.setAttribute('marker-end', `url(#arrow-${l.tipo})`);
    gLinks.appendChild(line);
    edgeLines.push(line);

    if (!isMini) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', '9');
      text.setAttribute('font-weight', '500');
      text.setAttribute('opacity', '0.8');
      text.textContent = l.label;
      gLinks.appendChild(text);
      edgeLines.push(text);
    }
  });

  // Render nodes
  nodes.forEach(n => {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.style.cursor = 'pointer';

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', R);
    circle.setAttribute('fill', n.color);
    circle.setAttribute('stroke', 'white');
    circle.setAttribute('stroke-width', '2');
    group.appendChild(circle);

    if (n.connections > 0 && !isMini) {
      const badge = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      badge.setAttribute('cx', R + 4);
      badge.setAttribute('cy', -R - 2);
      badge.setAttribute('r', '7');
      badge.setAttribute('fill', '#3b82f6');
      badge.setAttribute('stroke', 'white');
      badge.setAttribute('stroke-width', '1.5');
      group.appendChild(badge);

      const badgeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      badgeText.setAttribute('x', R + 4);
      badgeText.setAttribute('y', -R + 1);
      badgeText.setAttribute('text-anchor', 'middle');
      badgeText.setAttribute('fill', 'white');
      badgeText.setAttribute('font-size', '8');
      badgeText.setAttribute('font-weight', '600');
      badgeText.style.pointerEvents = 'none';
      badgeText.textContent = n.connections;
      group.appendChild(badgeText);
    }

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('y', R + (isMini ? 12 : 14));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', 'var(--color-base-content)');
    label.setAttribute('font-size', String(FONT_SIZE));
    label.setAttribute('font-weight', '500');
    label.style.pointerEvents = 'none';
    label.textContent = n.label.length > MAX_LABEL ? n.label.slice(0, MAX_LABEL) + '...' : n.label;
    group.appendChild(label);

    if (!isMini) {
      const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      dateText.setAttribute('y', R + 26);
      dateText.setAttribute('text-anchor', 'middle');
      dateText.setAttribute('fill', 'var(--color-base-content)');
      dateText.setAttribute('fill-opacity', '0.55');
      dateText.setAttribute('font-size', '9');
      dateText.style.pointerEvents = 'none';
      dateText.textContent = n.fecha;
      group.appendChild(dateText);
    }

    gNodes.appendChild(group);
    n._el = group;
    n._circle = circle;
  });

  // Force simulation — adjust params for mini/full
  const simulation = forceSimulation(nodes)
    .force('link', forceLink(links).id(d => d.id).distance(isMini ? 80 : 120))
    .force('charge', forceManyBody().strength(isMini ? -200 : -350))
    .force('center', forceCenter(W / 2, H / 2))
    .force('collide', forceCollide(R + (isMini ? 8 : 12)))
    // Deja de tickar antes: alphaMin mas alto = menos ticks = menos bateria/CPU
    // en movil. El encuadre automatico ocurre una sola vez, en el primer 'end'
    // (ver didFitOnce); los asentamientos posteriores (tras tap/drag) respetan
    // la vista del usuario.
    .alphaMin(0.01)
    .on('end', () => {
      if (!didFitOnce && !userMovedView) {
        didFitOnce = true;
        fitView();
      }
    })
    .on('tick', () => {
      const edgeStep = isMini ? 1 : 2;
      links.forEach((l, i) => {
        const dx = l.target.x - l.source.x;
        const dy = l.target.y - l.source.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const line = edgeLines[i * edgeStep];
        if (line) {
          line.setAttribute('x1', l.source.x + dx / d * R);
          line.setAttribute('y1', l.source.y + dy / d * R);
          line.setAttribute('x2', l.target.x - dx / d * (R + 8));
          line.setAttribute('y2', l.target.y - dy / d * (R + 8));
        }
        if (!isMini) {
          const text = edgeLines[i * edgeStep + 1];
          if (text) {
            text.setAttribute('x', (l.source.x + l.target.x) / 2);
            text.setAttribute('y', (l.source.y + l.target.y) / 2 - 4);
          }
        }
      });
      nodes.forEach(n => {
        if (n._el) n._el.setAttribute('transform', `translate(${n.x},${n.y})`);
      });
    });

  // Interacción: Pointer Events unifican mouse y táctil (arrastrar nodos, pan con
  // un dedo, pinch-zoom con dos, tap para navegar). touch-action:none evita que el
  // navegador secuestre el gesto para scrollear la página en móviles.
  svg.style.touchAction = 'none';
  svg.style.userSelect = 'none';
  svg.style.webkitUserSelect = 'none';

  let scale = 1, tx = 0, ty = 0;
  let isPanning = false, panSX = 0, panSY = 0;
  let dragNode = null, dragPointerId = null, dragMoved = false, dragSX = 0, dragSY = 0;
  const pointers = new Map();
  let pinchDist = 0;
  // El re-encuadre automatico (fitView) corre solo en el PRIMER asentamiento y
  // solo si el usuario no ha movido la vista: sin esto, cada tap/drag reinicia la
  // simulacion y el 'end' deshacia el pan/zoom del usuario ~2s despues.
  let didFitOnce = false;
  let userMovedView = false;

  function applyTransform() {
    g.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
  }

  function svgRect() {
    return svg.getBoundingClientRect();
  }

  // Convierte coordenadas de pantalla (clientX/Y) a unidades del viewBox del SVG.
  // En móvil el contenedor escala el viewBox (1200 unidades) a ~360px físicos:
  // sin esta conversión el pan/drag/pinch van ~3x más rápido que el dedo.
  function toLocal(clientX, clientY) {
    const m = svg.getScreenCTM();
    if (!m) return { x: clientX, y: clientY };
    const pt = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
    return { x: pt.x, y: pt.y };
  }

  // Nodos: arrastrar con un puntero. Si el gesto no se movió, se navega al evento.
  // El listener va en el grupo (n._el) para dar un área de toque mayor en móvil.
  nodes.forEach(n => {
    n._el.addEventListener('pointerdown', e => {
      if (pointers.size >= 2) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragNode = n;
      dragPointerId = e.pointerId;
      dragMoved = false;
      dragSX = e.clientX;
      dragSY = e.clientY;
      n.fx = n.x;
      n.fy = n.y;
      simulation.alphaTarget(0.3).restart();
      e.preventDefault();
      e.stopPropagation();
    });
  });

  // Fondo: pan con un dedo, pinch-zoom con dos.
  svg.addEventListener('pointerdown', e => {
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      const p = toLocal(e.clientX, e.clientY);
      isPanning = true;
      panSX = p.x - tx;
      panSY = p.y - ty;
      svg.style.cursor = 'grabbing';
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
    e.preventDefault();
  }, { passive: false });

  addWindowListener('pointermove', e => {
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (!prev) return;

    // Pinch: dos punteros activos → zoom centrado en el punto medio
    // (convertido a unidades del viewBox para que el zoom quede bajo los dedos).
    if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const la = toLocal(a.x, a.y);
      const lb = toLocal(b.x, b.y);
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0 && dist > 0) {
        userMovedView = true;
        const cx = (la.x + lb.x) / 2;
        const cy = (la.y + lb.y) / 2;
        const ns = Math.min(Math.max(scale * (dist / pinchDist), 0.1), 5);
        tx = cx - (cx - tx) * (ns / scale);
        ty = cy - (cy - ty) * (ns / scale);
        scale = ns;
        applyTransform();
      }
      pinchDist = dist;
      return;
    }

    const p = toLocal(e.clientX, e.clientY);

    if (dragNode) {
      if (Math.abs(e.clientX - dragSX) > 3 || Math.abs(e.clientY - dragSY) > 3) dragMoved = true;
      dragNode.fx = (p.x - tx) / scale;
      dragNode.fy = (p.y - ty) / scale;
      return;
    }

    if (isPanning) {
      const ntx = p.x - panSX;
      const nty = p.y - panSY;
      if (ntx !== tx || nty !== ty) userMovedView = true;
      tx = ntx;
      ty = nty;
      applyTransform();
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchDist = 0;
    // Solo el dedo que inició el arrastre libera el nodo: si levantan el OTRO
    // dedo de un pinch, el nodo sigue fijo donde lo dejaron.
    if (e.pointerId === dragPointerId) {
      if (dragNode) {
        if (!dragMoved) {
          // Tap/click sin arrastre: abre el modal del evento (mantiene la posicion
          // del grafo). Si no hay modal (mini), navega directo como antes.
          openGraphModal(dragNode);
        }
        dragNode.fx = null;
        dragNode.fy = null;
        simulation.alphaTarget(0);
        dragNode = null;
      }
      dragPointerId = null;
    }
    if (pointers.size === 1 && !dragNode) {
      // Transición pinch→pan: re-anclar al dedo restante con el transform ACTUAL.
      // Sin esto la vista saltaba porque quedaba el ancla de antes del pinch.
      const [rp] = [...pointers.values()];
      const p = toLocal(rp.x, rp.y);
      isPanning = true;
      panSX = p.x - tx;
      panSY = p.y - ty;
    }
    if (pointers.size === 0) {
      isPanning = false;
      svg.style.cursor = 'grab';
    }
  }

  addWindowListener('pointerup', endPointer);
  addWindowListener('pointercancel', endPointer);

  // Wheel (desktop)
  svg.addEventListener('wheel', e => {
    e.preventDefault();
    userMovedView = true;
    const c = toLocal(e.clientX, e.clientY);
    const ns = Math.min(Math.max(scale * (1 + (e.deltaY < 0 ? 0.1 : -0.1)), 0.1), 5);
    tx = c.x - (c.x - tx) * (ns / scale);
    ty = c.y - (c.y - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  }, { passive: false });

  // Encuadra todos los nodos visibles en el viewport (crucial en móvil: la
  // simulación puede dejar nodos fuera del viewBox original y sin pan no se veían).
  function fitView() {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      if (n.x == null || n.y == null) continue;
      minX = Math.min(minX, n.x); maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y); maxY = Math.max(maxY, n.y);
    }
    if (!isFinite(minX) || !isFinite(maxX) || !isFinite(minY) || !isFinite(maxY)) return;
    const pad = 48;
    // Usar dimensiones del viewBox (W/H), no CSS px de getBoundingClientRect:
    // el transform translate/scale vive en coordenadas del viewBox y el viewBox
    // ya escala al contenedor via SVG. Usar vw/vh CSS mezclaba unidades y dejaba
    // nodos fuera o con zoom excesivo en mini (W=800 vs vw~360 en movil).
    const bw = (maxX - minX) || 1;
    const bh = (maxY - minY) || 1;
    // Permitir scale muy pequeño para grafos densos (mini con 800+ nodos llega a bw>120k).
    // El clamp anterior 0.1 impedía encuadrar: a 0.1 aún quedaban nodos a 60k fuera de W=800.
    const raw = Math.min((W - pad * 2) / bw, (H - pad * 2) / bh);
    const ns = Math.min(Math.max(raw, 0.005), isMini ? 1 : 1.5);
    tx = (W - (minX + maxX) * ns) / 2;
    ty = (H - (minY + maxY) * ns) / 2;
    scale = ns;
    applyTransform();
  }

  // Encuadre inicial: solo al asentarse la simulación (evita fit intermedio que queda desactualizado cuando la simulación sigue dispersando).
  // El skeleton cubre el flash inicial. El resize sí re-encuadra si el usuario no movió la vista.
  addWindowListener('resize', () => { if (!userMovedView) setTimeout(fitView, 150); });

  // Tooltip
  const tip = document.getElementById('graph-tooltip');
  if (tip) {
    nodes.forEach(n => {
      n._el.addEventListener('mouseenter', e => {
        tip.innerHTML = `<div class="font-semibold text-base-content">${n.label}</div><div class="mt-0.5 text-[11px] text-base-content/60">${n.tipoLabel} · ${n.fecha}${n.connections > 0 ? ` · ${n.connections} vinculo(s)` : ''}</div>`;
        tip.classList.remove('hidden');
        tip.style.left = e.clientX + 12 + 'px';
        tip.style.top = e.clientY - 10 + 'px';
      });
      n._el.addEventListener('mousemove', e => {
        tip.style.left = e.clientX + 12 + 'px';
        tip.style.top = e.clientY - 10 + 'px';
      });
      n._el.addEventListener('mouseleave', () => tip.classList.add('hidden'));
    });
  }

  // Modal del evento (full mode): se llena con los datos del nodo y sus vecinos
  // (calculados desde `links`, que ya traen tipo/etiqueta de relacion). El grafo
  // queda intacto detras: cerrar permite seguir explorando donde estaba.
  const dlg = document.getElementById('graph-modal');
  function openGraphModal(n) {
    if (!dlg) {
      // Fallback (mini): navegar directo con View Transitions.
      const a = document.createElement('a');
      a.href = n.url;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }
    const badge = dlg.querySelector('#graph-modal-badge');
    badge.textContent = n.tipoLabel;
    badge.style.backgroundColor = n.color + '1a';
    badge.style.color = n.color;
    badge.style.borderColor = n.color + '55';
    badge.style.setProperty('--tw-ring-color', 'transparent');
    dlg.querySelector('#graph-modal-title').textContent = n.label;
    dlg.querySelector('#graph-modal-meta').textContent =
      `${n.tipoLabel} · ${n.fecha}${n.connections > 0 ? ` · ${n.connections} vinculo(s)` : ''}`;

    // Contenido del evento: fetch de la pagina estatica y extraccion del bloque
    // .prose (cero dependencias). Asi el usuario lee sin salir del grafo; las
    // relaciones quedan como seccion secundaria y el CTA lleva a la pagina completa.
    const box = dlg.querySelector('#graph-modal-content');
    if (box) {
      const token = Symbol();
      box.__gvLoad = token;
      box.innerHTML = '<p class="text-xs text-base-content/50">Cargando evento…</p>';
      fetch(n.url)
        .then((r) => r.text())
        .then((html) => {
          if (box.__gvLoad !== token) return;
          const doc = new DOMParser().parseFromString(html, 'text/html');
          const prose = doc.querySelector('.prose') || doc.querySelector('article') || doc.body;
          box.innerHTML = prose.innerHTML;
          // La barra de acciones del detalle (Ver en Markdown, Copiar, ...) vive
          // dentro de .prose marcada como .not-prose: no corresponde al preview.
          box.querySelectorAll('.not-prose').forEach((el) => el.remove());
          // Los style="view-transition-name:..." del documento fuente chocarian con
          // los de la pagina actual (nombres duplicados rompen la transicion).
          box.querySelectorAll('[style]').forEach((el) => {
            if ((el.getAttribute('style') || '').includes('view-transition-name')) {
              el.removeAttribute('style');
            }
          });
          // Inyectar referencias (li#ref-*) dentro del modal para que
          // los [N] tengan destino. En /events el hash #ref-N no existe
          // y navegaba a /events#ref-1 (bug reportado).
          const refItems = doc.querySelectorAll('li[id^="ref-"]');
          if (refItems.length) {
            const refsWrap = document.createElement('div');
            refsWrap.className = 'mt-4 border-t border-base-300 pt-3';
            refsWrap.innerHTML = '<p class="text-[11px] font-bold uppercase tracking-wider text-base-content/60 mb-2">Referencias</p>';
            const ol = document.createElement('ol');
            ol.className = 'space-y-2';
            refItems.forEach((li) => {
              const clone = li.cloneNode(true);
              clone.querySelectorAll('a[href^="/"]').forEach((a) => a.setAttribute('target', '_blank'));
              ol.appendChild(clone);
            });
            refsWrap.appendChild(ol);
            box.appendChild(refsWrap);
          }
          // Links internos del preview en pestana nueva: navegar aqui perderia
          // el estado del grafo (la queja original del modal).
          box.querySelectorAll('a[href^="/"]').forEach((a) => a.setAttribute('target', '_blank'));
          // Interceptar [N] → scroll dentro del modal en vez de
          // navegar a /events#ref-N (hash del listado, sin destino).
          box.querySelectorAll('a[href^="#ref-"]').forEach((a) => {
            a.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              const id = a.getAttribute('href').slice(1);
              try {
                const target = box.querySelector('#' + CSS.escape(id));
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              } catch { /* CSS.escape no disponible */ }
            });
          });
          box.scrollTop = 0;
        })
        .catch(() => {
          if (box.__gvLoad === token) box.innerHTML = '';
        });
    }

    const linksBox = dlg.querySelector('#graph-modal-links');
    const nodeIdOf = (ref) => (typeof ref === 'string' ? ref : ref.id);
    const rels = links
      .filter((l) => nodeIdOf(l.source) === n.id || nodeIdOf(l.target) === n.id)
      .map((l) => {
        const outgoing = nodeIdOf(l.source) === n.id;
        return { neighbor: outgoing ? l.target : l.source, label: l.label, outgoing };
      })
      .sort((a, b) => b.neighbor.connections - a.neighbor.connections);
    linksBox.innerHTML = rels.length
      ? rels.map((r) => `
        <a href="${r.neighbor.url}" target="_blank" class="flex items-center gap-2 rounded-lg border border-base-300 bg-base-200 px-2.5 py-1.5 text-xs hover:bg-primary/10 hover:border-primary/40 transition-colors">
          <span class="h-2 w-2 shrink-0 rounded-full" style="background:${r.neighbor.color}"></span>
          <span class="shrink-0 font-semibold" style="color:${EDGE_COLORS[r.label] || '#78716c'}">${r.outgoing ? '→' : '←'} ${r.label}</span>
          <span class="truncate text-base-content/80">${r.neighbor.label}</span>
        </a>`).join('')
      : '<p class="text-xs text-base-content/40">Sin conexiones explicitas.</p>';
    dlg.querySelector('#graph-modal-open').setAttribute('href', n.url);
    dlg.showModal();
  }

  if (dlg && !dlg.__gvWired) {
    dlg.__gvWired = true;
    dlg.querySelector('#graph-modal-close')?.addEventListener('click', () => dlg.close());
    // Click en el backdrop (el contenido es el unico hijo): cierra.
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  }

  // Zoom buttons (full mode only — they don't exist in mini). Los listeners se
  // registran con cleanup para no duplicarse si init corre mas de una vez.
  const zoomIn = document.getElementById('zoom-in');
  const zoomOut = document.getElementById('zoom-out');
  const zoomReset = document.getElementById('zoom-reset');
  if (zoomIn) {
    const onZoomIn = () => {
      const r = svg.getBoundingClientRect();
      const c = toLocal(r.left + r.width / 2, r.top + r.height / 2);
      const ns = Math.min(scale * 1.2, 5);
      tx = c.x - (c.x - tx) * (ns / scale);
      ty = c.y - (c.y - ty) * (ns / scale);
      scale = ns;
      applyTransform();
    };
    zoomIn.addEventListener('click', onZoomIn);
    cleanupFns.push(() => zoomIn.removeEventListener('click', onZoomIn));
  }
  if (zoomOut) {
    const onZoomOut = () => {
      const r = svg.getBoundingClientRect();
      const c = toLocal(r.left + r.width / 2, r.top + r.height / 2);
      const ns = Math.max(scale / 1.2, 0.1);
      tx = c.x - (c.x - tx) * (ns / scale);
      ty = c.y - (c.y - ty) * (ns / scale);
      scale = ns;
      applyTransform();
    };
    zoomOut.addEventListener('click', onZoomOut);
    cleanupFns.push(() => zoomOut.removeEventListener('click', onZoomOut));
  }
  if (zoomReset) {
    // El reset congela la simulación y re-encuadra: sin esto la simulación sigue dispersando nodos tras el fit y el usuario necesita alejar para verlos (reporte actual).
    const onZoomReset = () => {
      userMovedView = false;
      didFitOnce = true;
      simulation.stop();
      fitView();
      setTimeout(fitView, 50);
    };
    zoomReset.addEventListener('click', onZoomReset);
    cleanupFns.push(() => zoomReset.removeEventListener('click', onZoomReset));
  }

  // Toggle de aislados + filtros: cableado centralizado en wireGraphFilters()
  // (corre al inicio de init, antes del return por vacio, para no perderlo).
}

// Se ejecuta en cada carga de página, incluida la navegación con View Transitions.
// (astro:page-load se dispara también en la carga inicial tras el swap del DOM.)
if (!window.__gvGraphInit) {
  window.__gvGraphInit = true;
  document.addEventListener('astro:page-load', init);
}
// Llamada directa (patrón del vault): si astro:page-load ya se disparó antes de
// que este módulo se evaluara (carga inicial o SPA donde el módulo llega tarde),
// init() no correría por listener. init es idempotente (cleanup remueve el SVG
// interactivo previo antes de recrearlo).
init();
