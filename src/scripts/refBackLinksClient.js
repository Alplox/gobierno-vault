// Enlaces "volver a" para /sueldos y /presupuesto. El detalle de evento ya los
// genera en SSR (remark pone el id de cada [N]); aquí se generan en cliente para
// las páginas cuyas citas salen de componentes, sin tocar decenas de call sites.
// Solo actúa donde hay [data-ref-back-host]; el handler de clic vive en Base.astro.

const HOST_SELECTOR = '[data-ref-back-host]';
const INLINE_SELECTOR = 'a.source-ref[href^="#ref-"], a.source-ref[href^="#pref-"]';
const WRAP_CLASS = 'mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-base-content/70';
const LINK_CLASS = 'gv-ref-back inline-flex items-center justify-center rounded px-1.5 py-0.5 font-mono font-semibold transition-colors hover:bg-base-200 hover:text-base-content focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-base-content';

function backLink(id, n, single, target) {
  const a = document.createElement('a');
  a.href = `#${id}`;
  a.dataset.refBack = '';
  a.className = LINK_CLASS;
  a.textContent = single ? '↑ volver al texto' : `↑${n}`;
  a.setAttribute('aria-label', single
    ? `Volver a la única aparición de la referencia ${target} en el texto`
    : `Volver a la aparición ${n} de la referencia ${target} en el texto`);
  a.title = single ? 'Volver al texto' : `Volver a la aparición ${n}`;
  return a;
}

function buildFor(host) {
  if (host.dataset.refBackBuilt === '1') return;
  host.dataset.refBackBuilt = '1';
  // En /presupuesto cada panel de año tiene sus propias citas: no mezclar años.
  const scope = host.closest('[data-pres-panel]') ?? document;
  const byTarget = new Map();
  scope.querySelectorAll(INLINE_SELECTOR).forEach((a) => {
    const target = (a.getAttribute('href') ?? '').slice(1);
    if (!target) return;
    if (!a.id) {
      const n = (byTarget.get(target)?.length ?? 0) + 1;
      a.id = `cite-${target}-${n}`;
    }
    const list = byTarget.get(target) ?? [];
    list.push(a.id);
    byTarget.set(target, list);
  });

  host.querySelectorAll('li[id]').forEach((li) => {
    if (li.querySelector('a[data-ref-back]')) return;
    const anchors = byTarget.get(li.id) ?? [];
    if (!anchors.length) return;
    const wrap = document.createElement('div');
    wrap.className = WRAP_CLASS;
    if (anchors.length === 1) {
      wrap.appendChild(backLink(anchors[0], 1, true, li.id));
    } else {
      const label = document.createElement('span');
      label.className = 'opacity-70';
      label.textContent = 'volver a';
      wrap.appendChild(label);
      anchors.forEach((anchor, i) => wrap.appendChild(backLink(anchor, i + 1, false, li.id)));
    }
    (li.querySelector('.min-w-0.flex-1') ?? li).appendChild(wrap);
  });
}

export function initRefBackLinks() {
  const build = () => document.querySelectorAll(HOST_SELECTOR).forEach(buildFor);
  build();
  document.addEventListener('astro:page-load', build);
}
