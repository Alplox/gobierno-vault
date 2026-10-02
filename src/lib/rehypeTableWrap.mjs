// Rehype plugin: envuelve cada <table> del markdown en un contenedor con
// scroll horizontal para móvil. Sin wrapper, las tablas de eventos con
// 3-5 columnas (Cifra | Fuente | Contexto…) desbordan la tarjeta .prose
// (que es overflow:visible para los tooltips) y quedan cortadas sin scroll.
//
// Emite: <div class="gv-table-scroll[ is-wide]" tabindex="0" role="region"
//   aria-label="..." data-cols="N"><table>…</table></div>
// - tabindex + role="region" permite desplazar con teclado y lo anuncia.
// - data-cols + .is-wide (≥4 columnas): la primera columna queda sticky para
//   no perder la referencia al desplazar (tablas comparativas largas).
// - Idempotente: si la tabla ya viene envuelta, no la re-envuelve.
export default function rehypeTableWrap() {
  return (tree) => {
    const countCols = (tableNode) => {
      const thead = (tableNode.children ?? []).find((c) => c?.tagName === 'thead');
      const tbody = (tableNode.children ?? []).find((c) => c?.tagName === 'tbody');
      const firstRow =
        thead?.children?.find((c) => c?.tagName === 'tr') ??
        tbody?.children?.find((c) => c?.tagName === 'tr') ??
        (tableNode.children ?? []).find((c) => c?.tagName === 'tr');
      if (!firstRow?.children) return 0;
      return firstRow.children.filter((c) => c?.tagName === 'th' || c?.tagName === 'td').length;
    };

    const wrapTable = (tableNode) => {
      const cols = countCols(tableNode);
      const wide = cols >= 4;
      return {
        type: 'element',
        tagName: 'div',
        properties: {
          className: wide ? ['gv-table-scroll', 'is-wide'] : ['gv-table-scroll'],
          tabindex: '0',
          role: 'region',
          ariaLabel: 'Tabla con desplazamiento horizontal',
          dataCols: String(cols),
        },
        children: [tableNode],
      };
    };

    const isWrap = (node) =>
      node?.type === 'element' &&
      node?.tagName === 'div' &&
      Array.isArray(node?.properties?.className) &&
      node.properties.className.includes('gv-table-scroll');

    const transform = (node) => {
      if (!node?.children?.length) return;
      node.children = node.children.flatMap((child) => {
        if (child?.type === 'element' && child?.tagName === 'table') {
          return [wrapTable(child)];
        }
        if (isWrap(child)) {
          // Ya envuelta (doble pasada): transformar el interior sin re-envolver.
          transform(child);
          return [child];
        }
        transform(child);
        return [child];
      });
    };

    transform(tree);
  };
}
