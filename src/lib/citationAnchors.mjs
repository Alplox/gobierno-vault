// Ancla de retorno por ocurrencia de una cita [[sources/id]] en el cuerpo del
// evento. La usa remarkWikiLinks.mjs para marcar cada [N] inline y la ficha del
// evento para generar los enlaces "volver a" de Referencias: ambos deben
// coincidir para que id y href apunten al mismo sitio.
const SOURCE_WIKILINK = /\[\[sources?\/([A-Za-z0-9_.-]+)(?:\|[^\]]*)?\]\]/g;

export function citationAnchorId(id, occurrence) {
  return `cite-${id}-${occurrence}`;
}

// Mapa id de fuente -> ids de ancla, en orden de aparición en el markdown.
// El cuerpo ya viene sin frontmatter (readEventBody), igual que el árbol que
// recorre remark, así que la numeración de ocurrencias coincide.
export function sourceAnchorsBySource(markdown) {
  const counts = new Map();
  const anchors = new Map();
  SOURCE_WIKILINK.lastIndex = 0;
  let match;
  while ((match = SOURCE_WIKILINK.exec(markdown)) !== null) {
    const id = match[1];
    const n = (counts.get(id) ?? 0) + 1;
    counts.set(id, n);
    const list = anchors.get(id) ?? [];
    list.push(citationAnchorId(id, n));
    anchors.set(id, list);
  }
  return anchors;
}
