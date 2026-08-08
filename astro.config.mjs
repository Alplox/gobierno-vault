import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { unified } from '@astrojs/markdown-remark';
import remarkWikiLinks from './src/lib/remarkWikiLinks.mjs';

export default defineConfig({
  // Necesario para Astro.url/canonical del origen al copiar eventos
  site: 'https://gobierno-vault.pages.dev',
  output: 'static',
  // Precarga las páginas al hover (compatible con ClientRouter de View Transitions)
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [tailwind()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkWikiLinks],
    }),
  },
});
