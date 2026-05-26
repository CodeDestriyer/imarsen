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

export function analyzeFace(lm: Point[]): Metrics {
  const p = (i: number) => lm[i];

  const midX = (p(IDX.glabella).x + p(IDX.noseTip).x + p(IDX.chin).x) / 3;

  const pairs: Array<[number, number]> = [
    [IDX.rOuter, IDX.lOuter],
    [IDX.rInner, IDX.lInner],
    [IDX.mouthR, IDX.mouthL],
    [IDX.rGonion, IDX.lGonion],
    [IDX.rZyg, IDX.lZyg],
  ];
  const faceWidth = Math.abs(p(IDX.lZyg).x - p(IDX.rZyg).x);
  const offsets = pairs.map(([a, b]) => {
    const da = midX - p(a).x;
    const db = p(b).x - midX;
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
    overall: Math.max(0, Math.min(1, overall)),
    midX,
  };
}
