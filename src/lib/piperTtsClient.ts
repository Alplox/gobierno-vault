// Puente entre la ficha del evento y el worker de Piper (src/workers/piper.worker.ts).
//
// Existe porque la inferencia ONNX no se puede ejecutar en el hilo principal: `predict()` de
// @realtimex/piper-tts-web no activa `ort.env.wasm.proxy`, así que `session.run()` bloquea el
// hilo que lo llama mientras el decodificador VITS genera el audio del trozo (decenas de
// segundos a un hilo). Con la síntesis aquí, la página sigue respondiendo a scroll, clics y
// cancelar. Sin SharedArrayBuffer (las fichas no llevan COOP+COEP para no romper los embeds
// de video) el worker sintetiza a un hilo: más lento (~8-12 s por trozo medido) pero por
// delante del audio en casi todos los párrafos, y nunca congela la UI.

type Pending = {
  resolve: (blob: Blob) => void;
  reject: (err: unknown) => void;
  onProgress?: (p: { total: number; loaded: number }) => void;
  onPhase?: (message: string) => void;
};

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

// URL del chunk del worker. Con `?worker&url` Vite lo compila como worker de verdad y
// exporta su URL (/_astro/piper.worker-*.js) en vez de un constructor. El `new URL(...)`
// plano NO sirve: Vite lo trata como asset y lo embebe como `data:` con el fuente crudo.
import WORKER_URL from '../workers/piper.worker.ts?worker&url';

function boot(): Worker {
  if (!worker) {
    const w = new Worker(WORKER_URL, { type: 'module', name: 'piper-tts' });
    w.onmessage = (e: MessageEvent<Record<string, unknown>>) => {
      const msg = e.data;
      const entry = pending.get(msg.id as number);
      if (!entry) return; // cancelado o worker reiniciado: el resultado ya no importa
      if (msg.type === 'phase') {
        entry.onPhase?.(String(msg.message ?? ''));
        return;
      }
      if (msg.type === 'progress') {
        entry.onProgress?.({ total: Number(msg.total ?? 0), loaded: Number(msg.loaded ?? 0) });
        return;
      }
      pending.delete(msg.id as number);
      if (msg.type === 'done') entry.resolve(msg.blob as Blob);
      else entry.reject(new Error(String(msg.message ?? 'Fallo de síntesis')));
    };
    w.onerror = (e) => {
      const err = new Error(`Worker de Piper: ${e.message || 'error no especificado'}`);
      for (const [, entry] of pending) entry.reject(err);
      pending.clear();
    };
    worker = w;
  }
  return worker;
}

// Síntesis de un trozo. Rechaza con AbortError si el worker se reinicia mientras espera.
export function synthesizeChunk(
  text: string,
  voiceId: string,
  hooks: { onProgress?: Pending['onProgress']; onPhase?: Pending['onPhase'] } = {}
): Promise<Blob> {
  const w = boot();
  const id = nextId++;
  return new Promise<Blob>((resolve, reject) => {
    pending.set(id, { resolve, reject, ...hooks });
    w.postMessage({ type: 'predict', id, voiceId, text });
  });
}

// Cancelación cooperativa: el worker descarta lo que tenga en vuelo. No libera los hilos
// (el wasm no se puede abortar a mitad), por eso `stopWorker` es la cancelación real.
export function cancelSynthesis(): void {
  worker?.postMessage({ type: 'cancel' });
}

// Reinicio duro: mata la inferencia en curso y la sesión ONNX. Se usa al cancelar, al
// cambiar de voz y al salir de la página. El modelo sigue en OPFS, así que la siguiente
// síntesis solo paga la compilación del wasm.
export function stopWorker(): void {
  const w = worker;
  worker = null;
  if (w) w.terminate();
  for (const [, entry] of pending) {
    entry.reject(new DOMException('Síntesis cancelada', 'AbortError'));
  }
  pending.clear();
}
