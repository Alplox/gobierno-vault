/**
 * channels.mjs — Registro de canales de YouTube del catálogo (`sitemaps/youtube_channels/<slug>/`).
 *
 * Viven AQUÍ, no en `media.mjs`: los mapas de dominios (`mediaHosts()`,
 * CATALOG_MEDIO_BY_DOMAIN en add-source.mjs, watchlist, probe, news-search)
 * asumen endpoints de sitemap (robots/index/extra) y un canal no es un dominio.
 * Cada entrada define el canal para `scripts/sitemaps/youtube.mjs` (yt-dlp):
 *   channel    → handle (@T13_cl, con @)
 *   channelId  → id del canal (cacheado: evita resolver el handle cada sync)
 *   tab        → 'videos' | 'streams' | 'shorts' (shorts sin fecha → opt-in)
 *
 * El JSONL es el mismo formato que la prensa ({u, d, t, s} + dur/views), así
 * que el mismo `rg -uu -g '*.jsonl'` cubre ambos. `sync.mjs` une MEDIA +
 * CHANNELS en un solo registro; `resync.mjs` los salta (refresh bajo demanda);
 * `index.mjs` los reporta en tabla propia.
 *
 * Al agregar un canal: verificar el handle real (los parecidos dan 404 o tabs
 * vacíos), sincronizar (`pnpm run sitemaps-sync -- <slug>`) y regenerar
 * índices (`pnpm run sitemaps-index`).
 */
export const CHANNELS = {
  yt_t13: {
    nombre: 'Teletrece (YouTube)',
    tipo: 'youtube', // marca el canal: sync.mjs delega en youtube.mjs
    channel: '@T13_cl', // handle real — NO @teletrece (sin tab de videos) ni @t13 (404)
    channelId: 'UCsRnhjcUCR78Q3Ud6OXCTNg', // cacheado: evita resolver el handle cada sync
    tab: 'videos', // videos | streams | shorts (shorts sin fecha → opt-in)
  },
  yt_24horas: {
    nombre: '24 Horas (YouTube)',
    tipo: 'youtube',
    channel: '@24Horas_TVNChile', // "24 Horas - TVN Chile" (verificado por channel_id)
    channelId: 'UCTXNz3gjAypWp3EhlIATEJQ',
    tab: 'videos',
  },
  yt_meganoticias: {
    nombre: 'Meganoticias (YouTube)',
    tipo: 'youtube',
    channel: '@Meganoticiasoficial', // "Meganoticias" (verificado por channel_id)
    channelId: 'UCkccyEbqhhM3uKOI6Shm-4Q',
    tab: 'videos',
  },
  yt_theclinic: {
    nombre: 'The Clinic (YouTube)',
    tipo: 'youtube',
    channel: '@theclinic_cl', // "The Clinic" (verificado por channel_id)
    channelId: 'UCKr6ve0z-_k1bC_jW3TAWtA',
    tab: 'videos',
  },
  yt_gobierno: {
    nombre: 'Gobierno de Chile (YouTube)',
    tipo: 'youtube',
    channel: '@GobiernoDeChile', // canal oficial (verificado por channel_id)
    channelId: 'UC_5Sh9VhJlgCspl4mLM2duw',
    tab: 'videos',
  },
  yt_boric: {
    nombre: 'Gabriel Boric (YouTube)',
    tipo: 'youtube',
    channel: '@gabrielboricpresidente', // "Gabriel Boric Font" (verificado por channel_id)
    channelId: 'UC0gQkOPt6VVvJGO9mDy0ikw',
    tab: 'videos',
  },
  yt_pinera: {
    nombre: 'Sebastián Piñera (YouTube)',
    tipo: 'youtube',
    channel: '@sebastianpinera', // (verificado por channel_id)
    channelId: 'UCOltFBLjyQORr3VzE7NuRqQ',
    tab: 'videos',
  },
  yt_kast: {
    nombre: 'José Antonio Kast (YouTube)',
    tipo: 'youtube',
    channel: '@JoséAntonioKastOficial', // (verificado por channel_id)
    channelId: 'UCGLRRRKMp4K1AKJabf8OeEg',
    tab: 'videos',
  },
  yt_biobio: {
    nombre: 'Bio Bío (YouTube)',
    tipo: 'youtube',
    channel: '@BioBioChile', // "Bio Bio" (verificado por channel_id)
    channelId: 'UCuvM3c8rmdApmk-g22shZ7w',
    tab: 'videos',
  },
  yt_df: {
    nombre: 'Diario Financiero (YouTube)',
    tipo: 'youtube',
    channel: '@DiarioFinancieroTV', // "Diario Financiero" (verificado por channel_id)
    channelId: 'UClsjSNCR-0KAFw0v5uVMCHQ',
    tab: 'videos',
  },
};
