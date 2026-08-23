// Renderer de cliente para /topics/[id]: agrega tarjetas de evento bajo demanda.
// Lee el JSON embebido en <script type="application/json" id="topic-events-data">.
// Los eventos lazy se agregan al grid al entrar al viewport (scroll).
//
// Re-ejecutable por navegación (View Transitions): el DOM (#topic-events-data /
// #topic-events-root) se relee en cada init y el observer/sentinel previos se
// desconectan antes de crear los nuevos (patrón force-graph.js).

import { eventCardHTML } from './eventListClient.js';

let observer = null;
let sentinel = null;

function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (sentinel) {
    sentinel.remove();
    sentinel = null;
  }
}

export function initTopicList() {
  cleanup();
  const script = document.getElementById('topic-events-data');
  const root = document.getElementById('topic-events-root');
  if (!script || !root) return;
  let data = [];
  try {
    data = JSON.parse(script.textContent || '[]');
  } catch {
    return;
  }
  if (!data.length) return;

  // Los primeros se sirven en SSR desde el grid mismo; el resto viaja en JSON.
  const fillAll = () => {
    root.insertAdjacentHTML('beforeend', data.map(eventCardHTML).join(''));
    data = [];
  };

  if ('IntersectionObserver' in window) {
    sentinel = document.createElement('div');
    sentinel.id = 'topic-load-sentinel';
    sentinel.className = 'h-2';
    root.appendChild(sentinel);
    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        fillAll();
        cleanup();
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(sentinel);
  } else {
    fillAll();
  }
}

// El guard protege solo el registro del listener (los scripts bundleados se
// evalúan UNA vez); initTopicList() corre en cada astro:page-load con DOM fresco.
if (!window.__gvTopicListInit) {
  window.__gvTopicListInit = true;
  document.addEventListener('astro:page-load', initTopicList);
}
// Llamada directa: si astro:page-load ya se disparó antes de que este módulo se
// evaluara (SPA donde el bundle llega tarde), init() no correría por listener.
// init es idempotente (cleanup remueve observer/sentinel previos).
initTopicList();
