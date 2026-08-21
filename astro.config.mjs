import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import { availableParallelism } from 'node:os';
import remarkWikiLinks from './src/lib/remarkWikiLinks.mjs';

// ponytail: cross-platform — setear NODE_OPTIONS aquí evita depender de `set` (Windows)
// o `export` (Linux) en el script de build. El flag necesita estar antes del arranque
// de Astro; al estar en este módulo se ejecuta antes de cualquierthing de Astro.
process.env.NODE_OPTIONS = (process.env.NODE_OPTIONS || '') + ' --experimental-global-customevent';

export default defineConfig({
  // Necesario para Astro.url/canonical del origen al copiar eventos
  site: 'https://gobierno-vault.pages.dev',
  output: 'static',
  // El default de Astro 7 es build.concurrency=1 (generacion secuencial de
  // paginas). El vault crece (8.900+ paginas) y el build tarda minutos; se
  // paraleliza con p-limit interno. 2 workers balancea velocidad vs RAM en
  // Cloudflare Pages (runners pequenos); subir a 4 si el runner lo permite.
  build: {
    concurrency: Math.min(availableParallelism(), 2),
  },
  // Precarga las páginas al hover (compatible con ClientRouter de View Transitions)
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [],
  // Tailwind v4 vía plugin Vite (el CSS vive en src/styles/global.css con
  // @import "tailwindcss" + @plugin daisyui/typography). El build es local
  // (pnpm run deploy), así que no aplica la vieja restricción de CI que
  // forzaba @astrojs/tailwind@6 (Tailwind v3) para resolver peers.
  vite: {
    plugins: [
      tailwindcss(),
      // onnxruntime-web (motor de Piper TTS) se sirve desde CDN en runtime: el
      // fork @realtimex/piper-tts-web usa wasmPaths/fallbackStrategy 'cdn'
      // apuntando a jsdelivr. Vite igualmente emite su .wasm local (~25,6 MiB)
      // por el patrón new URL("ort-wasm-*.wasm", import.meta.url); es peso
      // muerto y supera el límite de 25 MiB por archivo de Cloudflare Pages.
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
