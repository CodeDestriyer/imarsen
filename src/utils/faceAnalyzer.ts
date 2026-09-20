export type Point = { x: number; y: number; z?: number };

export const IDX = {
  rOuter: 33, rInner: 133,
  lOuter: 263, lInner: 362,
  chin: 152,
  rGonion: 172, lGonion: 397,
  rZyg: 234, lZyg: 454,
  noseTip: 1,
  subnasale: 2,
  glabella: 9,
  foreheadTop: 10,
  upperLip: 13,
  upperLipOuter: 0,
  upperLipInner: 13,
  lowerLipInner: 14,
  lowerLipOuter: 17,
  mouthR: 61, mouthL: 291,
  // Центры радужек — есть только в 478-точечной модели (face_landmarker.task).
  rIris: 468, lIris: 473,
  // Крылья носа. Пара 98/327 выбрана замером: её ширина даёт 24.3% от бизигоматика,
  // что совпадает с антропометрией (al-al ≈ 25%); 48/278 и 129/358 шире, 115/344 уже.
  rAla: 98, lAla: 327,
} as const;

export type Thirds = { upper: number; middle: number; lower: number };

export type SubScores = {
  symmetry: number;
  fwhr: number;
  jaw: number;
  tilt: number;
  thirds: number;
  lips: number;
  philtrum: number;
  lipChin: number;
};

/**
 * Дополнительные замеры. Держим их отдельно от SubScores намеренно: они не
 * входят в overall и не участвуют в выборе слабой точки. Досыпать пять новых
 * метрик в средневзвешенное — значит размазать распределение к середине, и
 * все получат один и тот же тир.
 */
export type ExtraScores = {
  esr: number;
  midface: number;
  mouthNose: number;
  bigonial: number;
  pfl: number;
};

export type ExtraMetrics = {
  /** Межзрачковое / бизигоматик. */
  esr: number;
  /** Межзрачковое / (линия зрачков -> верхняя губа). */
  midfaceRatio: number;
  /** Ширина рта / ширина крыльев носа. */
  mouthNoseRatio: number;
  /** Бигониальная ширина / бизигоматик. */
  bigonialRatio: number;
  /** Длина глазной щели / бизигоматик. В миллиметрах её не посчитать — нет калибровки масштаба. */
  pflRatio: number;
  /** Зрачки взяты из радужек, а не приближены серединой углов глаза. */
  irisBased: boolean;
  scores: ExtraScores;
};

export type Metrics = {
  symmetry: number;
  fwhr: number;
  jawAngle: number;
  canthalTilt: number;
  thirds: Thirds;
  thirdsBalance: number;
  lipRatio: number;
  philtrumRatio: number;
  lipChinRatio: number;
  scores: SubScores;
  extra: ExtraMetrics;
  overall: number;
  midX: number;
};

export type Tier = { max: number; key: TierKey; label: string };
export type TierKey = 'sub3' | 'sub5' | 'ltn' | 'mtn' | 'htn' | 'chad' | 'trueAdam';

export const TIERS: Tier[] = [
  { max: 0.30, key: 'sub3',     label: 'Sub-3' },
  { max: 0.45, key: 'sub5',     label: 'Sub-5' },
  { max: 0.55, key: 'ltn',      label: 'Low-Tier Normie' },
  { max: 0.65, key: 'mtn',      label: 'Mid-Tier Normie' },
  { max: 0.75, key: 'htn',      label: 'High-Tier Normie' },
  { max: 0.88, key: 'chad',     label: 'CHAD' },
  { max: 1.01, key: 'trueAdam', label: 'True Adam' },
];

export function tierFor(v: number): Tier {
  return TIERS.find((t) => v < t.max) ?? TIERS[TIERS.length - 1];
}

export const SCORE_LABELS: Record<keyof SubScores, string> = {
  symmetry: 'Симметрия',
  fwhr: 'FWHR',
  jaw: 'Угол челюсти',
  tilt: 'Кантальный наклон',
  thirds: 'Трети лица',
  lips: 'Губы',
  philtrum: 'Фильтрум',
  lipChin: 'Подбородок',
};

export const SCORE_TIPS: Record<keyof SubScores, string> = {
  symmetry: 'Поработай над балансом — ровный сон, осанка, мьюинг. Асимметрия часто связана со сторонним пережёвыванием.',
  fwhr: 'Соотношение ширины к высоте отклоняется от нормы 1.9. Над FWHR работают укреплением жевательных мышц и снижением подкожного жира.',
  jaw: 'Угол челюсти отклоняется от 125°. Mastic gum, лимфодренаж, дефицит калорий — типовой план.',
  tilt: 'Наклон уголков глаз ниже оптимального (+4°). Можно скорректировать визуально через брови, реально — кантопластика.',
  thirds: 'Пропорции третей лица сбиты. Чаще всего проблема в укорочении нижней или средней трети — мьюинг и тонус.',
  lips: 'Соотношение губ нестандартное (идеал 1:1.6). Можно работать с гиалуронкой или upper lip flip.',
  philtrum: 'Длина фильтрума выбивается из нормы ~22%. Хирургическая коррекция (lip lift) или визуальные трюки.',
  lipChin: 'Стомион-подбородок не в идеальной пропорции к подносовой части. Подбородок: импланты, или жевательные нагрузки.',
};

export const EXTRA_LABELS: Record<keyof ExtraScores, string> = {
  esr: 'Разлёт глаз',
  midface: 'Мидфейс',
  mouthNose: 'Рот / нос',
  bigonial: 'Челюсть / скулы',
  pfl: 'Длина глаза',
};

/**
 * Нормы измерены на 14 реальных портретах, а не взяты с форумов: цифры оттуда
 * для трёх из пяти метрик мимо, потому что MediaPipe ставит контур по мягким
 * тканям. В комментариях — что говорит фольклор и что получилось на деле.
 */
const EXTRA_IDEALS: Record<keyof ExtraScores, { ideal: number; tol: number }> = {
  esr: { ideal: 0.47, tol: 0.06 },       // фольклор 0.45; замер дал 0.450-0.502, медиана 0.472
  midface: { ideal: 1.0, tol: 0.18 },    // фольклор 1.0; замер дал медиану 1.025 — совпало
  mouthNose: { ideal: 1.5, tol: 0.3 },   // фольклор 1.5; замер дал 1.494. Допуск широкий: метрика самая шумная
  bigonial: { ideal: 0.8, tol: 0.12 },   // фольклор 0.75; замер дал 0.80 — гонионы идут по коже, не по кости
  pfl: { ideal: 0.21, tol: 0.07 },       // замер дал медиану 0.214
};

export function weakestOf(scores: SubScores) {
  let worst: { k: keyof SubScores; v: number } | null = null;
  for (const k of Object.keys(scores) as Array<keyof SubScores>) {
    const v = scores[k];
    if (worst === null || v < worst.v) worst = { k, v };
  }
  return worst;
}

const angleAt = (a: Point, b: Point, c: Point): number => {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  return (Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180) / Math.PI;
};

/**
 * @param lm  Лендмарки MediaPipe, нормированные в 0..1 по ширине и высоте кадра.
 * @param aspect  Отношение ширины кадра к высоте. Обязательно: x нормирован по W,
 *   а y по H, поэтому без домножения x на W/H любые смешанные x-y замеры врут
 *   ровно во столько раз, во сколько кадр не квадратный. На вебкамере 16:9 это
 *   уводило FWHR с 1.6 на 0.9 — то есть в гарантированный ноль по этой оси.
 */
export function analyzeFace(lm: Point[], aspect = 1): Metrics {
  const ar = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;
  // Приводим к пропорциям кадра: y оставляем как есть, x растягиваем.
  const p = (i: number) => ({ x: lm[i].x * ar, y: lm[i].y });
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  // Для отрисовки нужна нормированная координата, не растянутая.
  const midX = (lm[IDX.glabella].x + lm[IDX.noseTip].x + lm[IDX.chin].x) / 3;
  const midXScaled = midX * ar;

  const pairs: Array<[number, number]> = [
    [IDX.rOuter, IDX.lOuter],
    [IDX.rInner, IDX.lInner],
    [IDX.mouthR, IDX.mouthL],
    [IDX.rGonion, IDX.lGonion],
    [IDX.rZyg, IDX.lZyg],
  ];
  const faceWidth = Math.abs(p(IDX.lZyg).x - p(IDX.rZyg).x);
  const offsets = pairs.map(([a, b]) => {
    const da = midXScaled - p(a).x;
    const db = p(b).x - midXScaled;
    const dyDelta = Math.abs(p(a).y - p(b).y);
    const dxDelta = Math.abs(da - db);
    return (dxDelta + dyDelta) / faceWidth;
  });
  const meanOff = offsets.reduce((s, v) => s + v, 0) / offsets.length;
  const symmetry = Math.max(0, Math.min(1, 1 - meanOff * 4));

  const upperFaceH = Math.abs(p(IDX.upperLip).y - p(IDX.glabella).y);
  const fwhr = faceWidth / Math.max(1e-6, upperFaceH);

  const jawAngleR = angleAt(p(IDX.rZyg), p(IDX.rGonion), p(IDX.chin));
  const jawAngleL = angleAt(p(IDX.lZyg), p(IDX.lGonion), p(IDX.chin));
  const jawAngle = (jawAngleR + jawAngleL) / 2;

  const tiltDeg = (inner: number, outer: number) => {
    const dx = p(outer).x - p(inner).x;
    const dy = p(outer).y - p(inner).y;
    return (-Math.atan2(dy, Math.abs(dx)) * 180) / Math.PI;
  };
  const tiltR = tiltDeg(IDX.rInner, IDX.rOuter);
  const tiltL = tiltDeg(IDX.lInner, IDX.lOuter);
  const canthalTilt = (tiltR + tiltL) / 2;

  const t1 = Math.abs(p(IDX.glabella).y - p(IDX.foreheadTop).y);
  const t2 = Math.abs(p(IDX.subnasale).y - p(IDX.glabella).y);
  const t3 = Math.abs(p(IDX.chin).y - p(IDX.subnasale).y);
  const totalH = t1 + t2 + t3;
  const thirds: Thirds = { upper: t1 / totalH, middle: t2 / totalH, lower: t3 / totalH };
  const thirdIdeal = 1 / 3;
  const thirdsBalance =
    1 -
    (Math.abs(thirds.upper - thirdIdeal) +
      Math.abs(thirds.middle - thirdIdeal) +
      Math.abs(thirds.lower - thirdIdeal)) *
      1.5;

  const upperVerm = Math.abs(p(IDX.upperLipInner).y - p(IDX.upperLipOuter).y);
  const lowerVerm = Math.abs(p(IDX.lowerLipOuter).y - p(IDX.lowerLipInner).y);
  const lipRatio = lowerVerm / Math.max(1e-6, upperVerm);
  const lipsScore = Math.max(0, 1 - Math.abs(lipRatio - 1.6) / 1.0);

  const philtrumLen = Math.abs(p(IDX.upperLipOuter).y - p(IDX.subnasale).y);
  const lowerFaceH = Math.abs(p(IDX.chin).y - p(IDX.subnasale).y);
  const philtrumRatio = philtrumLen / Math.max(1e-6, lowerFaceH);
  const philtrumScore = Math.max(0, 1 - Math.abs(philtrumRatio - 0.22) / 0.12);

  const stomionY = (p(IDX.upperLipInner).y + p(IDX.lowerLipInner).y) / 2;
  const subToStomion = Math.abs(stomionY - p(IDX.subnasale).y);
  const stomionToChin = Math.abs(p(IDX.chin).y - stomionY);
  const lipChinRatio = stomionToChin / Math.max(1e-6, subToStomion);
  const lipChinScore = Math.max(0, 1 - Math.abs(lipChinRatio - 2.0) / 1.0);

  // --- Дополнительные замеры ---
  // Всё ниже — евклидовы расстояния, поэтому они не зависят от завала головы
  // набок, в отличие от третей и кантального наклона.
  const irisBased = lm.length > Math.max(IDX.rIris, IDX.lIris);
  const pupilR = irisBased ? p(IDX.rIris) : mid(p(IDX.rOuter), p(IDX.rInner));
  const pupilL = irisBased ? p(IDX.lIris) : mid(p(IDX.lOuter), p(IDX.lInner));
  const ipd = dist(pupilR, pupilL);
  const bizygomatic = dist(p(IDX.rZyg), p(IDX.lZyg));

  const esr = ipd / Math.max(1e-6, bizygomatic);
  const midfaceRatio = ipd / Math.max(1e-6, dist(mid(pupilR, pupilL), p(IDX.upperLipOuter)));
  const mouthNoseRatio =
    dist(p(IDX.mouthR), p(IDX.mouthL)) / Math.max(1e-6, dist(p(IDX.rAla), p(IDX.lAla)));
  const bigonialRatio = dist(p(IDX.rGonion), p(IDX.lGonion)) / Math.max(1e-6, bizygomatic);
  const pflAvg = (dist(p(IDX.rOuter), p(IDX.rInner)) + dist(p(IDX.lOuter), p(IDX.lInner))) / 2;
  const pflRatio = pflAvg / Math.max(1e-6, bizygomatic);

  const rate = (k: keyof ExtraScores, v: number) => {
    const { ideal, tol } = EXTRA_IDEALS[k];
    return Math.max(0, Math.min(1, 1 - Math.abs(v - ideal) / tol));
  };
  const extra: ExtraMetrics = {
    esr,
    midfaceRatio,
    mouthNoseRatio,
    bigonialRatio,
    pflRatio,
    irisBased,
    scores: {
      esr: rate('esr', esr),
      midface: rate('midface', midfaceRatio),
      mouthNose: rate('mouthNose', mouthNoseRatio),
      bigonial: rate('bigonial', bigonialRatio),
      pfl: rate('pfl', pflRatio),
    },
  };

  const fwhrScore = Math.max(0, 1 - Math.abs(fwhr - 1.9) / 0.6);
  const jawScore = Math.max(0, 1 - Math.abs(jawAngle - 125) / 30);
  const tiltScore = Math.max(0, 1 - Math.abs(canthalTilt - 4) / 8);
  const thirdsScore = Math.max(0, thirdsBalance);

  const overall =
    symmetry * 0.22 +
    fwhrScore * 0.16 +
    jawScore * 0.16 +
    tiltScore * 0.10 +
    thirdsScore * 0.12 +
    lipsScore * 0.10 +
    philtrumScore * 0.07 +
    lipChinScore * 0.07;

  return {
    symmetry,
    fwhr,
    jawAngle,
    canthalTilt,
    thirds,
    thirdsBalance: Math.max(0, thirdsBalance),
    lipRatio,
    philtrumRatio,
    lipChinRatio,
    scores: {
      symmetry,
      fwhr: fwhrScore,
      jaw: jawScore,
      tilt: tiltScore,
      thirds: thirdsScore,
      lips: lipsScore,
      philtrum: philtrumScore,
      lipChin: lipChinScore,
    },
    extra,
    overall: Math.max(0, Math.min(1, overall)),
    midX,
  };
}
