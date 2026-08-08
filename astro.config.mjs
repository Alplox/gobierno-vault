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
  // onnxruntime-web (motor de Piper TTS) se sirve desde CDN en runtime: el fork
  // @realtimex/piper-tts-web usa wasmPaths/fallbackStrategy 'cdn' apuntando a
  // jsdelivr. Vite igualmente emite su .wasm local (~25,6 MiB) por el patrón
  // new URL("ort-wasm-*.wasm", import.meta.url); es peso muerto y supera el
  // límite de 25 MiB por archivo de Cloudflare Pages. Se elimina del output.
  vite: {
    plugins: [
      {
        name: 'drop-ort-wasm-assets',
        enforce: 'post',
        generateBundle(_opts, bundle) {
          for (const file of Object.keys(bundle)) {
            // Solo assets .wasm; NO tocar chunks .js/.mjs que puedan contener 'ort-wasm'
            // en su nombre (ej. el wrapper jsep.mjs que el glue importa dinámicamente).
            if (file.includes('ort-wasm') && file.endsWith('.wasm')) delete bundle[file];
          }
        },
      },
    ],
  },
  markdown: {
    processor: unified({
      remarkPlugins: [remarkWikiLinks],
    }),
  },
});
