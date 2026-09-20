/**
 * Поза головы из матрицы трансформации MediaPipe.
 *
 * Зачем: все «ширинные» метрики (ESR, бигониальная ширина, рот/нос) —
 * это отношения расстояний в плоскости кадра. Стоит повернуть голову на
 * 15–20°, и они молча уезжают: пользователь получит уверенную, но
 * неправильную цифру. Поэтому перед замером просим встать ровно.
 *
 * Раскладка матрицы (row-major) и знаки осей проверены эмпирически:
 * снимки прогонялись с искусственным поворотом кадра на ±15°, roll
 * менялся ровно на ±15°; знак pitch сверялся по фото глазами.
 */

export type PoseAxis = 'yaw' | 'pitch' | 'roll';

export type FacePose = {
  /** Поворот влево-вправо, градусы. 0 — лицом к камере. */
  yaw: number;
  /** Наклон вперёд-назад, градусы, уже с поправкой на смещение модели. Плюс — подбородок вверх. */
  pitch: number;
  /** Завал набок, градусы. */
  roll: number;
  /** Поза достаточно фронтальная, чтобы метрикам можно было верить. */
  ok: boolean;
  /** Ось, которая увела сильнее всех, либо null если всё в порядке. */
  worst: PoseAxis | null;
  /** Мягкая подсказка пользователю на съёмке, либо null. */
  hint: string | null;
  /** Что именно было не так — для пояснения уже в результате. */
  reason: string | null;
};

/**
 * Канонная модель лица у MediaPipe наклонена относительно «прямого взгляда»:
 * на 14 фронтальных портретах медиана сырого pitch вышла около -12°, а не 0.
 * Без этой поправки гейт ругался бы на половину нормальных кадров.
 */
const PITCH_BIAS = 10;

/** Пороги подобраны по реальным портретам: 13 из 14 фронтальных кадров проходят с запасом. */
export const POSE_LIMITS: Record<PoseAxis, number> = {
  yaw: 12,
  pitch: 18,
  roll: 7,
};

const DEG = 180 / Math.PI;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/**
 * Подсказки намеренно не указывают сторону для yaw и roll: в режиме съёмки
 * кадр зеркалится, а в live-превью — нет, так что «влево» означало бы разное
 * в разных местах. Для pitch зеркало ничего не меняет, там сторону говорим.
 */
function hintFor(axis: PoseAxis, pitch: number): string {
  if (axis === 'roll') return 'Выровняй голову — она завалена набок';
  if (axis === 'yaw') return 'Повернись к камере прямо';
  return pitch > 0 ? 'Опусти подбородок чуть ниже' : 'Подними подбородок чуть выше';
}

function reasonFor(axis: PoseAxis, pitch: number): string {
  if (axis === 'roll') return 'голова была завалена набок';
  if (axis === 'yaw') return 'голова была повёрнута в сторону';
  return pitch > 0 ? 'подбородок был задран' : 'подбородок был опущен';
}

/**
 * @param data 16 чисел матрицы 4x4 из `facialTransformationMatrixes[0].data`.
 */
export function facePoseFromMatrix(data?: ArrayLike<number> | null): FacePose | null {
  if (!data || data.length < 16) return null;

  const at = (r: number, c: number) => data[r * 4 + c];
  const yaw = Math.asin(clamp(-at(2, 0), -1, 1)) * DEG;
  const pitch = Math.atan2(at(2, 1), at(2, 2)) * DEG + PITCH_BIAS;
  const roll = Math.atan2(at(1, 0), at(0, 0)) * DEG;

  if (!Number.isFinite(yaw) || !Number.isFinite(pitch) || !Number.isFinite(roll)) return null;

  const over: Array<[PoseAxis, number]> = [
    ['yaw', Math.abs(yaw) / POSE_LIMITS.yaw],
    ['pitch', Math.abs(pitch) / POSE_LIMITS.pitch],
    ['roll', Math.abs(roll) / POSE_LIMITS.roll],
  ];
  over.sort((a, b) => b[1] - a[1]);
  const [axis, excess] = over[0];
  const ok = excess <= 1;

  return {
    yaw,
    pitch,
    roll,
    ok,
    worst: ok ? null : axis,
    hint: ok ? null : hintFor(axis, pitch),
    reason: ok ? null : reasonFor(axis, pitch),
  };
}
