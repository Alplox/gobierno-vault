import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import { unified } from '@astrojs/markdown-remark';
import remarkWikiLinks from './src/lib/remarkWikiLinks.mjs';

export default defineConfig({
  output: 'static',
  integrations: [tailwind()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkWikiLinks],
    }),
  },
});
