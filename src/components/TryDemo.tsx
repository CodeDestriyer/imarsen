import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Camera, AlertCircle, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from '@mediapipe/tasks-vision';

type State =
  | 'idle'
  | 'loading'
  | 'running'
  | 'snapshot'
  | 'permission-denied'
  | 'no-camera'
  | 'error';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

type Props = { open: boolean; onClose: () => void };

export function TryDemo({ open, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number>(0);
  const lastVideoTimeRef = useRef(-1);

  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [faceDetected, setFaceDetected] = useState(false);

  const drawLandmarks = useCallback((result: FaceLandmarkerResult) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const faces = result.faceLandmarks;
    setFaceDetected(faces.length > 0);
    if (!faces.length) return;

    const w = canvas.width;
    const h = canvas.height;

    for (const face of faces) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.85)';
      for (const p of face) {
        ctx.beginPath();
        ctx.arc((1 - p.x) * w, p.y * h, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const lm = landmarkerRef.current;
    if (!video || !lm) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
      lastVideoTimeRef.current = video.currentTime;
      try {
        const result = lm.detectForVideo(video, performance.now());
        drawLandmarks(result);
      } catch {
        // swallow per-frame errors
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [drawLandmarks]);

  const start = useCallback(async () => {
    setState('loading');
    setErrorMsg('');

    try {
      if (!landmarkerRef.current) {
        const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
        landmarkerRef.current = await FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'VIDEO',
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Не удалось загрузить модель. Проверь интернет.');
      setState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setState('running');
      rafRef.current = requestAnimationFrame(tick);
    } catch (e: unknown) {
      const err = e as { name?: string };
      if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') {
        setState('permission-denied');
      } else if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') {
        setState('no-camera');
      } else {
        setErrorMsg('Не удалось включить камеру.');
        setState('error');
      }
    }
  }, [tick]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    const video = videoRef.current;
    if (video) video.srcObject = null;
  }, []);

  const takeSnapshot = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setState('snapshot');
  }, []);

  const retake = useCallback(() => {
    if (!streamRef.current) {
      start();
      return;
    }
    setState('running');
    rafRef.current = requestAnimationFrame(tick);
  }, [start, tick]);

  const handleClose = useCallback(() => {
    stop();
    setState('idle');
    setFaceDetected(false);
    onClose();
  }, [stop, onClose]);

  useEffect(() => {
    return () => {
      stop();
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, [stop]);

  useEffect(() => {
    if (!open) {
      stop();
      setState('idle');
      setFaceDetected(false);
    }
  }, [open, stop]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="relative glass-strong border border-white/15 rounded-2xl w-full max-w-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <div className="telemetry">PROBNIK / FACE_MESH</div>
                <h3 className="text-lg font-semibold text-white mt-0.5">Бесплатный пробный анализ</h3>
              </div>
              <button onClick={handleClose} className="text-gray-400 hover:text-white p-1 -m-1" aria-label="close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[4/3] bg-black overflow-hidden">
              <video
                ref={videoRef}
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${state === 'running' || state === 'snapshot' ? 'opacity-100' : 'opacity-0'}`}
              />
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full ${state === 'running' || state === 'snapshot' ? 'opacity-100' : 'opacity-0'}`}
              />

              {state === 'running' && !faceDetected && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/90 text-black text-xs font-medium px-3 py-1.5 rounded-full">
                  Лицо не найдено — встань ближе к свету
                </div>
              )}

              {state === 'running' && (
                <div className="absolute top-3 right-3 telemetry bg-black/50 px-2 py-1 rounded">
                  LIVE · 468 pts
                </div>
              )}

              {state === 'idle' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="icon-bubble mb-4"><Camera /></div>
                  <h4 className="text-white font-semibold text-xl">Покажи лицо камере</h4>
                  <p className="text-gray-400 text-sm mt-2 max-w-sm">
                    Фото никуда не загружается — всё считается прямо в браузере. Хорошее освещение даст лучший результат.
                  </p>
                  <button onClick={start} className="mt-6 btn-primary px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Включить камеру
                  </button>
                </div>
              )}

              {state === 'loading' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <Loader2 className="w-8 h-8 text-purple-300 animate-spin mb-3" />
                  <p className="text-gray-300 text-sm">Загружаем модель…</p>
                  <p className="telemetry mt-1">~5 МБ, один раз</p>
                </div>
              )}

              {state === 'permission-denied' && (
                <ErrorBlock
                  title="Нет доступа к камере"
                  desc="Разреши доступ в настройках браузера и обнови страницу."
                />
              )}
              {state === 'no-camera' && (
                <ErrorBlock title="Камера не найдена" desc="Подключи камеру и попробуй снова." />
              )}
              {state === 'error' && <ErrorBlock title="Что-то пошло не так" desc={errorMsg || 'Попробуй ещё раз.'} />}
            </div>

            <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500 mono hidden sm:block">
                {state === 'running' && faceDetected && '● tracking'}
                {state === 'snapshot' && '◼ snapshot'}
                {state === 'loading' && '◌ loading'}
              </div>
              <div className="flex items-center gap-3 ml-auto">
                {state === 'running' && (
                  <button
                    onClick={takeSnapshot}
                    disabled={!faceDetected}
                    className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-4 h-4" /> Сделать снимок
                  </button>
                )}
                {state === 'snapshot' && (
                  <>
                    <button onClick={retake} className="btn-ghost px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" /> Заново
                    </button>
                    <div className="text-xs text-gray-400 max-w-[180px] text-right">
                      Геометрические метрики — в следующем апдейте
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ErrorBlock({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
      <div className="w-12 h-12 rounded-full bg-red-500/15 border border-red-400/30 flex items-center justify-center mb-3">
        <AlertCircle className="w-6 h-6 text-red-300" />
      </div>
      <h4 className="text-white font-semibold">{title}</h4>
      <p className="text-gray-400 text-sm mt-1 max-w-sm">{desc}</p>
    </div>
  );
}
