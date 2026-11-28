// Lista única de espejos de lectura para referencias. La usan el componente
// SSR SourceMirrors.astro (detalle de evento y /sueldos) y el
// script de cliente de /source. Agregar o retirar un mirror se hace solo aquí.
// Son espejos de lectura: nunca sustituyen la URL original de la fuente.
// El estilo de hover es común a todos (solo subrayado), no por mirror.
export interface SourceMirror {
  label: string;
  title: string;
  href: (url: string) => string;
}

export const SOURCE_MIRRORS: SourceMirror[] = [
  { label: 'Archive', title: 'Wayback Machine', href: (u) => `https://web.archive.org/web/${u}` },
  { label: 'archive.ph', title: 'archive.ph', href: (u) => `https://archive.ph/${u}` },
  { label: 'Ghost', title: 'Ghostarchive', href: (u) => `https://ghostarchive.org/search?term=${encodeURIComponent(u)}` },
  { label: 'Memento', title: 'Memento Time Travel', href: (u) => `https://timetravel.mementoweb.org/memento/${u}` },
  { label: 'Cached', title: 'CachedView (Wayback + archive.today + LoC + Perma.cc)', href: (u) => `https://cachedview.nl/#${encodeURIComponent(u)}` },
  { label: 'Reader', title: 'Versión Texto Limpio', href: (u) => `https://r.jina.ai/${u}` },
  { label: 'Paywall', title: 'Paywall Skip', href: (u) => `https://www.paywallskip.com/article?url=${encodeURIComponent(u)}` },
  { label: 'NoPaywall', title: 'nopaywall.net (archivos abiertos / DOI)', href: (u) => `https://www.nopaywall.net/read?url=${encodeURIComponent(u)}` },
  { label: 'Defuddle', title: 'Defuddle', href: (u) => `https://defuddle.md/${u}` },
  { label: 'MD', title: 'Markdown', href: (u) => `https://markdown.new/${u}` },
];
