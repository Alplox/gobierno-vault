// Renderer de cliente: agrega eventos de una persona bajo demanda.
// Reutiliza eventCardHTML de eventListClient.js. El JSON viene en
// <script type="application/json" id="person-events-data">.

import { eventCardHTML } from './eventListClient.js';

export function initPersonEventList() {
  if (window.__gvPersonEventListInit) return;
  window.__gvPersonEventListInit = true;

  const script = document.getElementById('person-events-data');
  const btn = document.getElementById('load-more-person-events');
  if (!script || !btn) return;
  let data = [];
  try {
    data = JSON.parse(script.textContent || '[]');
  } catch {
    return;
  }
  if (!data.length) return;

  const root = document.getElementById(btn.dataset.root || 'person-events-root');
  if (!root) return;

  const state = { i: 0, batch: 12 };

  function fill() {
    const chunk = data.slice(state.i, state.i + state.batch);
    chunk.forEach((e) => {
      const wrap = document.createElement('div');
      wrap.className = 'space-y-3 min-w-0 max-w-full';
      wrap.insertAdjacentHTML('beforeend', eventCardHTML(e));
      root.appendChild(wrap);
    });
    state.i += chunk.length;
    btn.disabled = state.i >= data.length;
    const label = btn.querySelector('.person-event-more-label');
    if (label) label.textContent = `Cargar más eventos (${data.length - state.i} restantes)`;
  }

  btn.addEventListener('click', fill);
}