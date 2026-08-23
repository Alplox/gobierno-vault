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
  if (!nodesData.length) return;
  const W = parseInt(container.dataset.width) || (isMini ? 800 : 1200);
  const H = parseInt(container.dataset.height) || (isMini ? 280 : 600);
  const R = isMini ? 6 : 8;
  const MAX_LABEL = isMini ? 28 : 42;
  const FONT_SIZE = isMini ? 9 : 11;

  // Hide static SVG fallback
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
    const r = svgRect();
    const vw = r.width || W;
    const vh = r.height || H;
    const bw = (maxX - minX) || 1;
    const bh = (maxY - minY) || 1;
    const ns = Math.min(Math.max(Math.min((vw - pad * 2) / bw, (vh - pad * 2) / bh), 0.1), 1);
    tx = (vw - (minX + maxX) * ns) / 2;
    ty = (vh - (minY + maxY) * ns) / 2;
    scale = ns;
    applyTransform();
  }

  // Encuadre inicial tras el primer asentamiento de la simulación y al cambiar
  // el tamaño del contenedor (rotación de pantalla en móvil) — SOLO si el
  // usuario no movió la vista: el scroll de página dispara resize (barra URL
  // móvil, scrollbar desktop) y resetear el pan/zoom aquí lo deshacía.
  setTimeout(fitView, 400);
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
          // Links internos del preview en pestana nueva: navegar aqui perderia
          // el estado del grafo (la queja original del modal).
          box.querySelectorAll('a[href^="/"]').forEach((a) => a.setAttribute('target', '_blank'));
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
    // El reset re-encuadra todos los nodos (mejor que volver a 1,0,0 en móvil).
    const onZoomReset = () => fitView();
    zoomReset.addEventListener('click', onZoomReset);
    cleanupFns.push(() => zoomReset.removeEventListener('click', onZoomReset));
  }

  // Toggle de aislados: re-ejecuta init() (idempotente via cleanup) con el nuevo
  // filtro. El guard evita duplicar el listener en el doble init de la carga inicial.
  const includeCb = document.getElementById('graph-include-isolated');
  if (includeCb && !includeCb.__gvWired) {
    includeCb.__gvWired = true;
    includeCb.addEventListener('change', () => init());
  }
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
