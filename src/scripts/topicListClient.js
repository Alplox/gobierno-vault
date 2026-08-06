// Renderer de cliente para /topics/[id]: agrega tarjetas de evento bajo demanda.
// Lee el JSON embebido en <script type="application/json" id="topic-events-data">.
// Los eventos lazy se agregan al grid al entrar al viewport (scroll).

import { eventCardHTML } from './eventListClient.js';

export function initTopicList() {
  if (window.__gvTopicListInit) return;
  window.__gvTopicListInit = true;

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
    const sentinel = document.createElement('div');
    sentinel.id = 'topic-load-sentinel';
    sentinel.className = 'h-2';
    root.appendChild(sentinel);
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        fillAll();
        observer.disconnect();
      },
      { rootMargin: '600px 0px' }
    );
    observer.observe(sentinel);
  } else {
    fillAll();
  }
}