/// <reference types="astro/client" />

// Vite compila un worker a su propio chunk y, con `?worker&url`, exporta la URL de ese
// chunk en vez de un constructor. La ficha del evento la usa para crear el worker de Piper
// directamente (sin COOP+COEP no hay restricción que obligue al arranque por blob).
// Ver src/lib/piperTtsClient.ts.
declare module '*?worker&url' {
  const url: string;
  export default url;
}
