/// <reference lib="webworker" />
import * as tts from '@realtimex/piper-tts-web';
import { regPiperPaths } from '../lib/piper';

// Síntesis de Piper fuera del hilo principal.
//
// `predict()` de @realtimex/piper-tts-web llama a `InferenceSession.run()` sin
// `ort.env.wasm.proxy`, así que el wasm se ejecuta en el hilo que invoca: en la página eso
// bloquea scroll, clic y cancelar durante los decenas de segundos que tarda el decodificador
// VITS de cada trozo. Aquí el trabajo corre en este worker y la UI nunca se congela.
//
// Este worker no comparte estado de módulo con la página (mismo caveat que el singleton de
// TtsSession): por eso importa `stopWorker()` para reiniciar la sesión al cambiar de voz.

declare const self: DedicatedWorkerGlobalScope;

// Sin SharedArrayBuffer (las fichas de evento no llevan COOP+COEP para no romper los embeds
// de video) onnxruntime-web cae a un hilo en silencio: más lento, pero nunca congela la UI
// porque corre aquí y no en la página. Medido: ~8-12 s por trozo frente a ~1,6 s multihilo;
// como un trozo típico son 15-30 s de audio, la síntesis sigue yendo por delante.

// Las tres voces curadas no están en el mirror de la librería: se registran en su PATH_MAP
// para que la resolución del .onnx funcione también desde el worker.
regPiperPaths(tts);

function post(msg: Record<string, unknown>) {
  self.postMessage(msg);
}

interface PredictMsg {
  type: 'predict';
  id: number;
  voiceId: string;
  text: string;
}

// `predict()` reutiliza `_TtsSession._instance` y al cambiar de voz solo reescribe la propiedad
// `voiceId`, sin recargar el .onnx: se seguiría oyendo la primera voz para siempre. Se descarta
// el _instance para forzar una sesión nueva (el .onnx ya está en OPFS, no se vuelve a bajar).
// Reiniciar el worker entero (stopWorker) produce el mismo efecto y además libera los hilos.
let sessionVoice: string | null = null;
let cancelled = false;

async function ensureVoice(voiceId: string, onPhase: (message: string) => void) {
  if (sessionVoice === voiceId) return;
  onPhase('Cargando modelo de voz…');
  (tts as unknown as { TtsSession: { _instance: unknown } }).TtsSession._instance = null;
  await tts.TtsSession.create({ voiceId });
  sessionVoice = voiceId;
}

async function predict(msg: PredictMsg) {
  const { id, voiceId, text } = msg;
  cancelled = false;
  try {
    await ensureVoice(voiceId, (message) => post({ type: 'phase', id, message }));
    if (cancelled) return;
    const blob = await tts.predict({ text, voiceId }, (p) =>
      post({ type: 'progress', id, total: p.total, loaded: p.loaded })
    );
    if (cancelled) return;
    post({ type: 'done', id, blob });
  } catch (err) {
    post({ type: 'error', id, message: err instanceof Error ? err.message : String(err) });
  }
}

self.onmessage = (e: MessageEvent<PredictMsg | { type: 'cancel' }>) => {
  const msg = e.data;
  if (msg.type === 'cancel') {
    // Cancelación cooperativa: la inferencia en curso no se puede abortar (wasm sin
    // AbortSignal), pero su resultado se descarta y el audio nunca arranca.
    cancelled = true;
    return;
  }
  if (msg.type === 'predict') void predict(msg);
};

