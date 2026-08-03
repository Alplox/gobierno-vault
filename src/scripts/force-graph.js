import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

const EDGE_COLORS = {
  contradice: '#ef4444', confirma: '#10b981', cumple: '#10b981',
  incumple: '#ef4444', amplia: '#0ea5e9', corrige: '#f59e0b',
  rectifica: '#f59e0b', responde_a: '#8b5cf6', deriva_en: '#6366f1',
  provoca: '#f97316', cita: '#78716c', reemplaza: '#06b6d4',
  actualiza: '#3b82f6', mismo_contexto: '#a8a29e',
};

function init() {
  const dataEl = document.getElementById('graph-data');
  const container = document.getElementById('graph-container');
  if (!dataEl || !container) return;

  let data;
  try { data = JSON.parse(dataEl.textContent); } catch { return; }
  const { nodes: nodesData, links: linksData, size = 'full' } = data;
  if (!nodesData?.length) return;

  const isMini = size === 'mini';
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
    label.setAttribute('fill', '#44403c');
    label.setAttribute('font-size', String(FONT_SIZE));
    label.setAttribute('font-weight', '500');
    label.style.pointerEvents = 'none';
    label.textContent = n.label.length > MAX_LABEL ? n.label.slice(0, MAX_LABEL) + '...' : n.label;
    group.appendChild(label);

    if (!isMini) {
      const dateText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      dateText.setAttribute('y', R + 26);
      dateText.setAttribute('text-anchor', 'middle');
      dateText.setAttribute('fill', '#a8a29e');
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

  // Drag
  let dragNode = null, dragMoved = false, dragSX = 0, dragSY = 0;
  nodes.forEach(n => {
    n._circle.addEventListener('mousedown', e => {
      dragNode = n;
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

  window.addEventListener('mousemove', e => {
    if (!dragNode) return;
    if (Math.abs(e.clientX - dragSX) > 3 || Math.abs(e.clientY - dragSY) > 3) dragMoved = true;
    const r = svg.getBoundingClientRect();
    dragNode.fx = (e.clientX - r.left - tx) / scale;
    dragNode.fy = (e.clientY - r.top - ty) / scale;
  });

  window.addEventListener('mouseup', () => {
    if (dragNode) {
      if (!dragMoved) window.location.href = dragNode.url;
      dragNode.fx = null;
      dragNode.fy = null;
      simulation.alphaTarget(0);
      dragNode = null;
    }
  });

  // Zoom & pan
  let scale = 1, tx = 0, ty = 0;
  let isPanning = false, panSX = 0, panSY = 0;

  function applyTransform() {
    g.setAttribute('transform', `translate(${tx},${ty}) scale(${scale})`);
  }

  svg.addEventListener('wheel', e => {
    e.preventDefault();
    const r = svg.getBoundingClientRect();
    const cx = e.clientX - r.left, cy = e.clientY - r.top;
    const ns = Math.min(Math.max(scale * (1 + (e.deltaY < 0 ? 0.1 : -0.1)), 0.1), 5);
    tx = cx - (cx - tx) * (ns / scale);
    ty = cy - (cy - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  }, { passive: false });

  svg.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target !== svg) return;
    isPanning = true;
    panSX = e.clientX - tx;
    panSY = e.clientY - ty;
    svg.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!isPanning) return;
    tx = e.clientX - panSX;
    ty = e.clientY - panSY;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (isPanning) { isPanning = false; svg.style.cursor = 'grab'; }
  });

  // Tooltip
  const tip = document.getElementById('graph-tooltip');
  if (tip) {
    nodes.forEach(n => {
      n._el.addEventListener('mouseenter', e => {
        tip.innerHTML = `<div style="font-weight:600;color:#111827">${n.label}</div><div style="margin-top:2px;color:#6b7280;font-size:11px">${n.tipoLabel} · ${n.fecha}${n.connections > 0 ? ` · ${n.connections} vinculo(s)` : ''}</div>`;
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

  // Zoom buttons (full mode only — they don't exist in mini)
  document.getElementById('zoom-in')?.addEventListener('click', () => {
    const r = svg.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const ns = Math.min(scale * 1.2, 5);
    tx = cx - (cx - tx) * (ns / scale);
    ty = cy - (cy - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  });
  document.getElementById('zoom-out')?.addEventListener('click', () => {
    const r = svg.getBoundingClientRect();
    const cx = r.width / 2, cy = r.height / 2;
    const ns = Math.max(scale / 1.2, 0.1);
    tx = cx - (cx - tx) * (ns / scale);
    ty = cy - (cy - ty) * (ns / scale);
    scale = ns;
    applyTransform();
  });
  document.getElementById('zoom-reset')?.addEventListener('click', () => {
    scale = 1; tx = 0; ty = 0;
    applyTransform();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
