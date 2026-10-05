export type Point = { x: number; y: number; z?: number };

export const IDX = {
  rOuter: 33, rInner: 133,
  lOuter: 263, lInner: 362,
  // Верхняя и нижняя точки века по центру глаза.
  rLidTop: 159, lLidTop: 386,
  chin: 152,
  rGonion: 172, lGonion: 397,
  rZyg: 234, lZyg: 454,
  noseTip: 1,
  subnasale: 2,
  glabella: 9,
  foreheadTop: 10,
  upperLipOuter: 0,
  upperLipInner: 13,
  lowerLipInner: 14,
  lowerLipOuter: 17,
  // Пики «лука Купидона» — там заканчиваются колонны фильтрума.
  rBowPeak: 37, lBowPeak: 267,
  mouthR: 61, mouthL: 291,
  // Центры радужек — есть только в 478-точечной модели (face_landmarker.task).
  rIris: 468, lIris: 473,
  // Крылья носа. Пара 98/327 выбрана замером: её ширина даёт 24.3% от бизигоматика,
  // что совпадает с антропометрией (al-al ≈ 25%); 48/278 и 129/358 шире, 115/344 уже.
  rAla: 98, lAla: 327,
} as const;

/**
 * Порядок — как в таблице результата: сначала замеры, сверенные с эталонным
 * разбором (нормы оттуда же), в конце две наши метрики без внешнего эталона.
 */
export const METRIC_KEYS = [
  'midface',
  'fwhr',
  'chinPhiltrum',
  'tilt',
  'mouthNose',
  'bigonial',
  'lips',
  'esr',
  'eyeMouth',
  'symmetry',
  'jawFront',
] as const;
export type MetricKey = (typeof METRIC_KEYS)[number];

/** 0 — идеально … 5 — экстремально. */
export type Severity = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Очки за степень. Шкала взята у эталонного разбора: на скрине 6 идеальных,
 * 3 «слегка», 1 «заметно», 1 «сильно» дают ровно 14 — 6·2 + 3·1 + 0 − 1.
 */
export const SEVERITIES: ReadonlyArray<{ label: string; adverb: string; points: number }> = [
  { label: 'Идеально', adverb: 'идеально', points: 2 },
  { label: 'Слегка', adverb: 'слегка', points: 1 },
  { label: 'Заметно', adverb: 'заметно', points: 0 },
  { label: 'Сильно', adverb: 'сильно', points: -1 },
  { label: 'Критично', adverb: 'критично', points: -2 },
  { label: 'Экстремально', adverb: 'экстремально', points: -3 },
];
const MAX_POINTS = SEVERITIES[0].points;
const MIN_POINTS = SEVERITIES[SEVERITIES.length - 1].points;

/**
 * Норма — диапазон, у которого может не быть одной из границ («больше 1.9»).
 * step — ширина одной ступени тяжести за границей нормы: вышел на одну
 * ступень — «слегка», на две — «заметно» и так далее.
 */
export type Norm = { min?: number; max?: number; step: number };

export type MetricDef = {
  label: string;
  norm: Norm;
  /** Что не так, когда замер ниже нормы и выше неё. После наречия: «слегка узкий рот». */
  low?: string;
  high?: string;
  unit?: '°' | '%';
  digits: number;
  /** Совет, если метрика оказалась самой слабой. */
  tip: string;
};

/**
 * Ступень по умолчанию — 5% от границы нормы. Так совпадают все оценки на
 * эталонном скрине: рот/нос 1.44 при норме от 1.5 — «слегка», челюсть 1.25
 * при норме до 1.15 — «заметно», угол глаза–рот–глаз 50° при норме до 49° — «слегка».
 */
const rel = (bound: number) => +(bound * 0.05).toFixed(4);

export const METRICS: Record<MetricKey, MetricDef> = {
  midface: {
    label: 'Средняя зона лица',
    norm: { min: 1, max: 1.05, step: rel(1.05) },
    low: 'длинная средняя зона',
    high: 'короткая средняя зона',
    digits: 2,
    tip: 'Средняя зона вытянута — классика «лошадиного» мидфейса. Кость не перекроишь, но прическа с объёмом по бокам и щетина визуально сжимают лицо по вертикали. Мьюинг держи, вреда не будет.',
  },
  fwhr: {
    label: 'FWHR',
    norm: { min: 1.9, step: rel(1.9) },
    low: 'вытянутое лицо',
    digits: 2,
    tip: 'FWHR ниже нормы — лицо читается узким и длинным. Сушка до низкого процента жира открывает скулы, а мышцы шеи и трапеции добавляют массивности в кадре. Голодай, брат, скулы сами вылезут.',
  },
  chinPhiltrum: {
    label: 'Подбородок / фильтрум',
    // Ступень шире 5%: фильтрум на кадре веб-камеры — пара десятков пикселей,
    // и один пиксель ошибки уже даёт 4%.
    norm: { min: 2, max: 2.25, step: 0.18 },
    low: 'короткий подбородок',
    high: 'длинный подбородок',
    digits: 2,
    tip: 'Подбородок не в пропорции к фильтруму. Лёгкий случай лечится бородой нужной формы, тяжёлый — у хирурга (гениопластика или lip lift). Чинмаксинг жвачкой — на свой страх и риск.',
  },
  tilt: {
    label: 'Наклон глаз',
    norm: { min: 4, step: 2 },
    low: 'опущенные уголки глаз',
    unit: '°',
    digits: 1,
    tip: 'Наклон глаз ниже +4° — до охотничьих глаз далеко. Визуально вытягивают брови с подъёмом к хвосту и нормальный сон без отёков. Кантопластика — это уже ультра-максинг, сначала подумай.',
  },
  mouthNose: {
    label: 'Ширина рта / носа',
    norm: { min: 1.5, max: 1.62, step: rel(1.5) },
    low: 'узкий рот',
    high: 'широкий рот',
    digits: 2,
    tip: 'Рот и нос не в балансе. Если нос широковат — контуринг и правильный ракурс, если рот узкий — улыбка с зубами в кадре решает. Ринопластика — последний аргумент.',
  },
  bigonial: {
    label: 'Ширина челюсти',
    norm: { min: 1.1, max: 1.15, step: rel(1.15) },
    // Замер — скулы к челюсти, поэтому большое значение значит узкую челюсть.
    low: 'широкая челюсть',
    high: 'узкая челюсть',
    digits: 2,
    tip: 'Челюсть уже скул — рамка лица не держит. Сушка, жевательные нагрузки (mastic gum), щетина по линии челюсти. Если совсем грустно — филлеры в углы челюсти. Джомаксинг не пропускаем.',
  },
  lips: {
    label: 'Пропорция губ',
    // Верхняя губа — около 10 пикселей, поэтому ступень 10%, а не 5%: иначе шум
    // замера сам по себе давал бы «заметно».
    norm: { min: 1.55, max: 1.65, step: 0.16 },
    low: 'тонкая нижняя губа',
    high: 'тонкая верхняя губа',
    digits: 2,
    tip: 'Губы не в пропорции 1:1.6. Гигиеничка и увлажнение — база, дальше гиалуронка или lip flip у нормального косметолога. Не перекачай, утиные губы — минус тир.',
  },
  esr: {
    label: 'Межглазное расстояние',
    norm: { min: 0.45, max: 0.49, step: rel(0.47) },
    low: 'близко посаженные глаза',
    high: 'широко посаженные глаза',
    digits: 2,
    tip: 'Посадка глаз выходит из нормы. Это кость — тут только прическа и брови: густая переносица сводит глаза ближе, выщипанная — разводит. Работай с тем, что есть.',
  },
  eyeMouth: {
    label: 'Угол глаза–рот–глаз',
    norm: { min: 45, max: 49, step: rel(49) },
    low: 'острый угол',
    high: 'пологий угол',
    unit: '°',
    digits: 1,
    tip: 'Треугольник глаза–рот выбивается: черты лица либо разбросаны, либо слишком сжаты. Борода и правильная длина прически перераспределяют акценты. Хардмаксинг тут не нужен.',
  },
  symmetry: {
    label: 'Симметрия',
    // Модели дают 94–98%; сдвиг половины лица на 1% кадра — уже около 90%.
    norm: { min: 0.93, step: 0.04 },
    low: 'асимметричное лицо',
    unit: '%',
    digits: 0,
    tip: 'Лицо асимметрично. Часть — свет и ракурс, так что переснимись ровно. Остальное: жуй на обе стороны, спи на спине, следи за осанкой. Идеальной симметрии нет даже у Чада.',
  },
  jawFront: {
    label: 'Угол челюсти анфас',
    // Своя метрика без эталона: замерена на 12 портретах моделей, медиана 140°.
    // Это не гониальный угол — тот меряют только в профиль.
    norm: { min: 130, max: 141, step: 3 },
    low: 'острый угол челюсти',
    high: 'мягкий угол челюсти',
    unit: '°',
    digits: 0,
    tip: 'Линия челюсти анфас размыта. Главный рычаг — процент жира: на сушке угол проявляется сам. Плюс шея и мьюинг для осанки головы. Джомаксинг, брат.',
  },
};

export type MetricResult = {
  key: MetricKey;
  value: number;
  /** Для парных замеров — сторона кадра слева и справа, как их видит человек. */
  sides?: { left: number; right: number };
  /** На сколько ступеней замер вышел за норму. 0 — внутри нормы. */
  deviation: number;
  direction: 'low' | 'high' | null;
  severity: Severity;
  points: number;
};

export type Metrics = {
  results: Record<MetricKey, MetricResult>;
  /** Сколько метрик попало в каждую степень, от «идеально» до «экстремально». */
  counts: number[];
  points: number;
  maxPoints: number;
  /** Очки, приведённые к 0..1. От него считается тир. */
  overall: number;
  /** Зрачки взяты из радужек, а не приближены серединой углов глаза. */
  irisBased: boolean;
  midX: number;
};

/** short — то, что показываем крупно; label — расшифровка под ним. */
export type Tier = { max: number; key: TierKey; short: string; label: string };
export type TierKey = 'sub3' | 'sub5' | 'ltn' | 'mtn' | 'htn' | 'chad' | 'trueAdam';

/**
 * Пороги по overall = (очки + 3n) / 5n. Эталон: 14 очков из 22 на скрине —
 * это PSL6 Chad, у нас 0.85, середина CHAD. ADAM — почти всё идеально.
 */
export const TIERS: Tier[] = [
  { max: 0.40, key: 'sub3',     short: 'SUB3', label: 'Sub-3' },
  { max: 0.55, key: 'sub5',     short: 'SUB5', label: 'Sub-5' },
  { max: 0.65, key: 'ltn',      short: 'LTN',  label: 'Low-Tier Normie' },
  { max: 0.73, key: 'mtn',      short: 'MTN',  label: 'Mid-Tier Normie' },
  { max: 0.80, key: 'htn',      short: 'HTN',  label: 'High-Tier Normie' },
  { max: 0.92, key: 'chad',     short: 'CHAD', label: 'Chad' },
  { max: 1.01, key: 'trueAdam', short: 'ADAM', label: 'True Adam' },
];

/**
 * Метрики, которые закрываются пейволлом, когда он включён. Сейчас пейволл
 * выключен (`PAYWALL_ENABLED` в config.ts), но список держим под рукой.
 */
export const LOCKED_METRICS: ReadonlyArray<MetricKey> = ['symmetry', 'tilt', 'bigonial', 'lips'];

export function tierFor(v: number): Tier {
  return TIERS.find((t) => v < t.max) ?? TIERS[TIERS.length - 1];
}

/** Число так, как его пишем в таблице: с единицей, проценты — из доли. */
export function formatValue(key: MetricKey, v: number): string {
  const { unit, digits } = METRICS[key];
  if (unit === '%') return `${(v * 100).toFixed(digits)}%`;
  return `${v.toFixed(digits)}${unit ?? ''}`;
}

/** «1–1.05», «больше 1.9», «больше 4°». */
export function formatNorm(key: MetricKey): string {
  const { norm, unit } = METRICS[key];
  const f = (n: number) => (unit === '%' ? `${Math.round(n * 100)}%` : `${+n.toFixed(3)}${unit ?? ''}`);
  if (norm.min !== undefined && norm.max !== undefined) return `${f(norm.min)}–${f(norm.max)}`;
  if (norm.min !== undefined) return `больше ${f(norm.min)}`;
  if (norm.max !== undefined) return `меньше ${f(norm.max)}`;
  return '—';
}

/** «Идеально», «Слегка узкий рот», «Заметно узкая челюсть». */
export function verdictFor(r: MetricResult): string {
  if (r.severity === 0) return SEVERITIES[0].label;
  const def = METRICS[r.key];
  const what = r.direction === 'low' ? def.low : def.high;
  const adverb = SEVERITIES[r.severity].adverb;
  const text = what ? `${adverb} ${what}` : adverb;
  return text[0].toUpperCase() + text.slice(1);
}

/** Самая проблемная метрика — та, что дальше всех ушла за норму. */
export function weakestOf(m: Metrics): MetricResult | null {
  let worst: MetricResult | null = null;
  for (const k of METRIC_KEYS) {
    const r = m.results[k];
    if (r.severity > 0 && (worst === null || r.deviation > worst.deviation)) worst = r;
  }
  return worst;
}

export function rateMetric(key: MetricKey, value: number, sides?: MetricResult['sides']): MetricResult {
  const { norm } = METRICS[key];
  let gap = 0;
  let direction: MetricResult['direction'] = null;
  if (norm.min !== undefined && value < norm.min) {
    gap = norm.min - value;
    direction = 'low';
  } else if (norm.max !== undefined && value > norm.max) {
    gap = value - norm.max;
    direction = 'high';
  }
  const deviation = gap / norm.step;
  const severity = Math.min(5, Math.ceil(deviation)) as Severity;
  return { key, value, sides, deviation, direction, severity, points: SEVERITIES[severity].points };
}

/**
 * Центры зрачков. В 478-точечной модели берём радужки напрямую; запасной
 * вариант через середины углов глаза нужен только на случай усечённой модели
 * и даёт межглазное примерно на 0.02 меньше — это внутри допуска.
 *
 * @param scaleX Множитель по x, если координаты надо привести к пропорциям кадра.
 */
export function pupilPair(lm: Point[], scaleX = 1) {
  const p = (i: number) => ({ x: lm[i].x * scaleX, y: lm[i].y });
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const irisBased = lm.length > Math.max(IDX.rIris, IDX.lIris);
  return {
    r: irisBased ? p(IDX.rIris) : mid(p(IDX.rOuter), p(IDX.rInner)),
    l: irisBased ? p(IDX.lIris) : mid(p(IDX.lOuter), p(IDX.lInner)),
    irisBased,
  };
}

const angleAt = (a: Point, b: Point, c: Point): number => {
  const v1x = a.x - b.x, v1y = a.y - b.y;
  const v2x = c.x - b.x, v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const m1 = Math.hypot(v1x, v1y);
  const m2 = Math.hypot(v2x, v2y);
  return (Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * 180) / Math.PI;
};

type V3 = { x: number; y: number; z: number };
const sub3 = (a: V3, b: V3): V3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot3 = (a: V3, b: V3) => a.x * b.x + a.y * b.y + a.z * b.z;
const unit3 = (a: V3): V3 => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

/** Пары точек, которые сравниваем для симметрии. */
const SYMMETRY_PAIRS: ReadonlyArray<[number, number]> = [
  [IDX.rOuter, IDX.lOuter],
  [IDX.rInner, IDX.lInner],
  [IDX.mouthR, IDX.mouthL],
  [IDX.rGonion, IDX.lGonion],
  [IDX.rZyg, IDX.lZyg],
];

/**
 * Симметрия в 3D, относительно средней плоскости самого лица.
 *
 * Плоский вариант путал асимметрию с позой: поворот головы на 6–8° (гейт
 * пускает до 12°) ронял симметрию модели с 95% до 60%. Здесь ось «вправо»
 * берём из самих пар точек с глубиной, так что поворот уходит. Проверено
 * сдвигом половины лица на фото: 1% высоты кадра даёт −8 п.п., 2% — −17.
 */
function symmetry3d(lm: Point[], ar: number): number {
  const P = (i: number): V3 => ({ x: lm[i].x * ar, y: lm[i].y, z: (lm[i].z ?? 0) * ar });

  let axis: V3 = { x: 0, y: 0, z: 0 };
  let center: V3 = { x: 0, y: 0, z: 0 };
  for (const [a, b] of SYMMETRY_PAIRS) {
    const A = P(a), B = P(b);
    // Пары в MediaPipe идут «правая, левая» — направления сонаправлены.
    axis = { x: axis.x + B.x - A.x, y: axis.y + B.y - A.y, z: axis.z + B.z - A.z };
    center = { x: center.x + (A.x + B.x) / 2, y: center.y + (A.y + B.y) / 2, z: center.z + (A.z + B.z) / 2 };
  }
  const right = unit3(axis);
  const k = SYMMETRY_PAIRS.length;
  center = { x: center.x / k, y: center.y / k, z: center.z / k };

  // «Вниз» — от глабеллы к подбородку, без составляющей вдоль «вправо».
  const g = sub3(P(IDX.chin), P(IDX.glabella));
  const gr = dot3(g, right);
  const down = unit3({ x: g.x - gr * right.x, y: g.y - gr * right.y, z: g.z - gr * right.z });

  const width = Math.hypot(...(Object.values(sub3(P(IDX.lZyg), P(IDX.rZyg))) as [number, number, number]));
  let off = 0;
  for (const [a, b] of SYMMETRY_PAIRS) {
    const A = sub3(P(a), center), B = sub3(P(b), center);
    off += Math.abs(Math.abs(dot3(A, right)) - Math.abs(dot3(B, right))) + Math.abs(dot3(A, down) - dot3(B, down));
  }
  return Math.max(0, Math.min(1, 1 - (off / k / Math.max(1e-6, width)) * 4));
}

/**
 * Определения замеров сверены с эталонным разбором на том же лице: расхождение
 * в пределах 3% везде, кроме подбородка/фильтрума (1.92 против 2.06 при
 * подбородке от центра губы — поэтому фильтрум меряем до пиков лука Купидона).
 *
 * @param lm  Лендмарки MediaPipe, нормированные в 0..1 по ширине и высоте кадра.
 * @param aspect  Отношение ширины кадра к высоте. Обязательно: x нормирован по W,
 *   а y по H, поэтому без домножения x на W/H любые смешанные x-y замеры врут
 *   ровно во столько раз, во сколько кадр не квадратный.
 */
export function analyzeFace(lm: Point[], aspect = 1): Metrics {
  const ar = Number.isFinite(aspect) && aspect > 0 ? aspect : 1;

  // Голову допускаем заваленной набок до 7°. Все вертикали и симметрию
  // считаем в системе координат лица — поворачиваем точки так, чтобы линия
  // зрачков легла горизонтально. Без этого 3° завала съедали 20% симметрии
  // и разводили наклон левого и правого глаза на 6°.
  const pupilsRaw = pupilPair(lm, ar);
  const [leftPupil, rightPupil] =
    pupilsRaw.r.x <= pupilsRaw.l.x ? [pupilsRaw.r, pupilsRaw.l] : [pupilsRaw.l, pupilsRaw.r];
  const roll = Math.atan2(rightPupil.y - leftPupil.y, rightPupil.x - leftPupil.x);
  const cos = Math.cos(-roll), sin = Math.sin(-roll);
  const cx = (leftPupil.x + rightPupil.x) / 2, cy = (leftPupil.y + rightPupil.y) / 2;
  const level = (q: Point): Point => {
    const dx = q.x - cx, dy = q.y - cy;
    return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
  };
  const p = (i: number) => level({ x: lm[i].x * ar, y: lm[i].y });
  const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const pupilR = level(pupilsRaw.r), pupilL = level(pupilsRaw.l);

  // Для отрисовки нужна нормированная координата кадра, не выровненная.
  const midX = (lm[IDX.glabella].x + lm[IDX.noseTip].x + lm[IDX.chin].x) / 3;

  const bizygomatic = dist(p(IDX.rZyg), p(IDX.lZyg));
  const ipd = dist(pupilR, pupilL);

  const symmetry = symmetry3d(lm, ar);

  // --- FWHR: скулы к высоте от верхней губы до верхних век ---
  // Именно веки, а не переносица: так замер совпадает с эталоном (2.19 против 2.18).
  const lidY = (p(IDX.rLidTop).y + p(IDX.lLidTop).y) / 2;
  const fwhr = bizygomatic / Math.max(1e-6, Math.abs(p(IDX.upperLipOuter).y - lidY));

  // --- Средняя зона: межзрачковое к высоте от зрачков до верхней губы ---
  const midface = ipd / Math.max(1e-6, dist(mid(pupilR, pupilL), p(IDX.upperLipOuter)));

  // --- Подбородок / фильтрум ---
  const bowY = (p(IDX.rBowPeak).y + p(IDX.lBowPeak).y) / 2;
  const chinH = Math.abs(p(IDX.chin).y - p(IDX.lowerLipOuter).y);
  const philtrumH = Math.abs(bowY - p(IDX.subnasale).y);
  const chinPhiltrum = chinH / Math.max(1e-6, philtrumH);

  // --- Наклон глаз: внешний угол относительно внутреннего, от линии зрачков ---
  const tiltOf = (inner: number, outer: number) => {
    const a = p(inner), b = p(outer);
    return (-Math.atan2(b.y - a.y, Math.abs(b.x - a.x)) * 180) / Math.PI;
  };
  const tiltA = tiltOf(IDX.rInner, IDX.rOuter);
  const tiltB = tiltOf(IDX.lInner, IDX.lOuter);
  // «Правый глаз» MediaPipe — не обязательно правый на экране: снимок зеркалится.
  const rOnLeft = p(IDX.rOuter).x < p(IDX.lOuter).x;
  const tiltSides = rOnLeft ? { left: tiltA, right: tiltB } : { left: tiltB, right: tiltA };
  const tilt = (tiltA + tiltB) / 2;

  // --- Ширина рта к ширине крыльев носа ---
  const mouthNose = dist(p(IDX.mouthR), p(IDX.mouthL)) / Math.max(1e-6, dist(p(IDX.rAla), p(IDX.lAla)));

  // --- Ширина челюсти: скулы к гонионам. Гонионы идут по коже, не по кости ---
  const bigonial = bizygomatic / Math.max(1e-6, dist(p(IDX.rGonion), p(IDX.lGonion)));

  // --- Губы: нижняя к верхней. Верхнюю меряем от пиков лука Купидона ---
  // От центральной точки 0 выходило 1.98 против эталонных 1.58: она сидит
  // во впадине лука и занижает верхнюю губу.
  const upperLip = Math.abs(p(IDX.upperLipInner).y - bowY);
  const lowerLip = Math.abs(p(IDX.lowerLipOuter).y - p(IDX.lowerLipInner).y);
  const lips = lowerLip / Math.max(1e-6, upperLip);

  // --- Межглазное: межзрачковое к ширине скул ---
  const esr = ipd / Math.max(1e-6, bizygomatic);

  // --- Угол глаза–рот–глаз с вершиной в центре рта ---
  const mouthC = mid(p(IDX.upperLipInner), p(IDX.lowerLipInner));
  const eyeMouth = angleAt(pupilR, mouthC, pupilL);

  // --- Угол челюсти анфас: скула–гонион–подбородок, среднее двух сторон ---
  const jawFront =
    (angleAt(p(IDX.rZyg), p(IDX.rGonion), p(IDX.chin)) + angleAt(p(IDX.lZyg), p(IDX.lGonion), p(IDX.chin))) / 2;

  const results: Record<MetricKey, MetricResult> = {
    midface: rateMetric('midface', midface),
    fwhr: rateMetric('fwhr', fwhr),
    chinPhiltrum: rateMetric('chinPhiltrum', chinPhiltrum),
    tilt: rateMetric('tilt', tilt, tiltSides),
    mouthNose: rateMetric('mouthNose', mouthNose),
    bigonial: rateMetric('bigonial', bigonial),
    lips: rateMetric('lips', lips),
    esr: rateMetric('esr', esr),
    eyeMouth: rateMetric('eyeMouth', eyeMouth),
    symmetry: rateMetric('symmetry', symmetry),
    jawFront: rateMetric('jawFront', jawFront),
  };

  const counts = SEVERITIES.map(() => 0);
  let points = 0;
  for (const k of METRIC_KEYS) {
    counts[results[k].severity]++;
    points += results[k].points;
  }
  const n = METRIC_KEYS.length;
  const overall = (points - MIN_POINTS * n) / ((MAX_POINTS - MIN_POINTS) * n);

  return {
    results,
    counts,
    points,
    maxPoints: MAX_POINTS * n,
    overall: Math.max(0, Math.min(1, overall)),
    irisBased: pupilsRaw.irisBased,
    midX,
  };
}
