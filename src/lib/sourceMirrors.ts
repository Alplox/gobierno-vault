// Lista única de espejos de lectura para referencias. La usan el componente
// SSR SourceMirrors.astro (detalle de evento y /sueldos) y el script de cliente
// de /source. Agregar o retirar un mirror se hace solo aquí.
// Son espejos de lectura: nunca sustituyen la URL original de la fuente.
export interface SourceMirror {
  label: string;
  title: string;
  hover: string;
  href: (url: string) => string;
}

export const SOURCE_MIRRORS: SourceMirror[] = [
  { label: 'Archive', title: 'Wayback Machine', hover: 'hover:text-primary', href: (u) => `https://web.archive.org/web/${u}` },
  { label: 'archive.ph', title: 'archive.ph', hover: 'hover:text-orange-500', href: (u) => `https://archive.ph/${u}` },
  { label: 'Ghost', title: 'Ghostarchive', hover: 'hover:text-purple-500', href: (u) => `https://ghostarchive.org/search?term=${encodeURIComponent(u)}` },
  { label: 'Memento', title: 'Memento Time Travel', hover: 'hover:text-teal-500', href: (u) => `https://timetravel.mementoweb.org/memento/${u}` },
  { label: 'Cached', title: 'CachedView (Wayback + archive.today + LoC + Perma.cc)', hover: 'hover:text-cyan-500', href: (u) => `https://cachedview.nl/#${encodeURIComponent(u)}` },
  { label: 'Reader', title: 'Versión Texto Limpio', hover: 'hover:text-green-500', href: (u) => `https://r.jina.ai/${u}` },
  { label: 'Paywall', title: 'Paywall Skip', hover: 'hover:text-warning', href: (u) => `https://www.paywallskip.com/article?url=${encodeURIComponent(u)}` },
  { label: 'NoPaywall', title: 'nopaywall.net (archivos abiertos / DOI)', hover: 'hover:text-lime-500', href: (u) => `https://www.nopaywall.net/read?url=${encodeURIComponent(u)}` },
  { label: 'Defuddle', title: 'Defuddle', hover: 'hover:text-indigo-500', href: (u) => `https://defuddle.md/${u}` },
  { label: 'MD', title: 'Markdown', hover: 'hover:text-pink-500', href: (u) => `https://markdown.new/${u}` },
];
