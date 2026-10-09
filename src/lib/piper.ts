// Configuración de Piper compartida por la ficha del evento y su worker de síntesis.
//
// El worker corre en su propio hilo: NO comparte estado de módulo con la página. Por eso
// todo lo que ambos necesitan (voces curadas, rutas en HF, descarga a OPFS) vive aquí y no
// duplicado en el .astro. Si se añade una voz curada, se añade solo en este archivo.

export const PIPER_PREFIX = 'piper:';
export const PIPER_HF_BASE = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/';

// Las tres NO están en el mirror `diffusionstudio` que usa la librería, sino en
// rhasspy/piper-voices. Se registran en PATH_MAP para que download()/stored() las vean y se
// bajan a OPFS a mano (gvCachePiperFiles) porque su URL de red no pasa por la librería.
export const PIPER_PATHS: Record<string, string> = {
  'es_MX-claude-high': 'es/es_MX/claude/high/es_MX-claude-high.onnx',
  'es_AR-daniela-high': 'es/es_AR/daniela/high/es_AR-daniela-high.onnx',
  'es_ES-davefx-medium': 'es/es_ES/davefx/medium/es_ES-davefx-medium.onnx',
};

export interface PiperCuratedVoice {
  key: string;
  label: string;
  tag: string;
  hint: string;
}

// Curadas primero en el selector: el vault es chileno y es_MX es el acento latinoamericano
// más neutro disponible en Piper (es_AR suena rioplatense, es_ES europeo). La pista va en
// title/aria-label porque el option va truncado por el max-w del select.
export const PIPER_CURATED: PiperCuratedVoice[] = [
  {
    key: 'es_MX-claude-high',
    label: 'Latinoamericana',
    tag: 'es_MX',
    hint: 'Acento mexicano neutro; la más cercana a una voz de televisión para texto latinoamericano.',
  },
  { key: 'es_AR-daniela-high', label: 'Rioplatense', tag: 'es_AR', hint: 'Acento de Río de la Plata.' },
  {
    key: 'es_ES-davefx-medium',
    label: 'Española',
    tag: 'es_ES',
    hint: 'Acento de España. Mismo tamaño de descarga (~60 MB) que las otras dos.',
  },
];

// La librería resuelve el .onnx por PATH_MAP[voiceId]. Registrando las curadas también en la
// página, `tts.stored()` y `tts.download()` las reconocen igual que al mirror.
export function regPiperPaths(ttsModule: unknown): void {
  try {
    const map = (ttsModule as { PATH_MAP?: Record<string, string> }).PATH_MAP;
    if (!map) return;
    for (const [key, path] of Object.entries(PIPER_PATHS)) map[key] = path;
  } catch {
    /* ya no soporta mutar */
  }
}

// Descarga .onnx y .onnx.json directo a OPFS (misma estructura de cache que la librería).
// Verifica existencia por archivo antes de bajar: idempotente, se puede llamar siempre.
export async function cachePiperFiles(
  voiceId: string,
  onProgress?: (p: number) => void
): Promise<void> {
  const path = PIPER_PATHS[voiceId];
  if (!path) throw new Error(`Voz Piper sin ruta en HF: ${voiceId}`);
  const blame = (u: string) => u.split('/').at(-1) as string;
  const total = 2;
  let doneFiles = 0;
  const root = await navigator.storage.getDirectory();
  const dir = await root.getDirectoryHandle('piper', { create: true });
  for (const suffix of ['', '.json']) {
    const url = `${PIPER_HF_BASE}${path}${suffix}`;
    try {
      const file = await dir.getFileHandle(blame(url), { create: false });
      await file.getFile(); // existe ya → no re-descarga
      doneFiles++;
      onProgress?.(Math.round((doneFiles / total) * 100));
      continue;
    } catch {
      /* no existe, descargar */
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} para ${blame(url)}`);
    const blob = await res.blob();
    const file = await dir.getFileHandle(blame(url), { create: true });
    const w = await file.createWritable();
    await w.write(blob);
    await w.close();
    doneFiles++;
    onProgress?.(Math.round((doneFiles / total) * 100));
  }
}
