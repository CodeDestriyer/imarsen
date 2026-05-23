export type Point = { x: number; y: number };

export const IDX = {
  LEFT_EYE_OUT: 33,
  LEFT_EYE_IN: 133,
  RIGHT_EYE_IN: 362,
  RIGHT_EYE_OUT: 263,
  NOSE_TIP: 1,
  NOSE_TOP: 168,
  CHIN: 152,
  FOREHEAD: 10,
  LEFT_CHEEK: 234,
  RIGHT_CHEEK: 454,
  LEFT_MOUTH: 61,
  RIGHT_MOUTH: 291,
  MOUTH_TOP: 13,
  MOUTH_BOTTOM: 14,
  LEFT_JAW: 172,
  RIGHT_JAW: 397,
  LEFT_BROW: 105,
  RIGHT_BROW: 334,
} as const;

export const JAW_CONTOUR = [
  172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397,
];

export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109,
];

export const EYE_LEFT_CONTOUR = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
export const EYE_RIGHT_CONTOUR = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
export const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185];
export const NOSE_BRIDGE = [168, 6, 197, 195, 5, 4, 1];

const BILATERAL_PAIRS: [number, number][] = [
  [33, 263],
  [133, 362],
  [61, 291],
  [172, 397],
  [234, 454],
  [105, 334],
  [127, 356],
  [93, 323],
];

const toDeg = (rad: number) => (rad * 180) / Math.PI;

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function mid(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function perpDist(p: Point, a: Point, b: Point): number {
  const num = (b.x - a.x) * (a.y - p.y) - (a.x - p.x) * (b.y - a.y);
  const den = Math.hypot(b.x - a.x, b.y - a.y);
  return num / (den || 1);
}

function angleBetween(p0: Point, p1: Point, p2: Point): number {
  const v1x = p0.x - p1.x, v1y = p0.y - p1.y;
  const v2x = p2.x - p1.x, v2y = p2.y - p1.y;
  const dot = v1x * v2x + v1y * v2y;
  const mag = Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y);
  return toDeg(Math.acos(Math.max(-1, Math.min(1, dot / (mag || 1)))));
}

export type Metrics = {
  tilt: number;
  mouthTilt: number;
  symmetry: number;
  fwhr: number;
  jawAngle: number;
  overall: number;
};

export function analyzeFace(lm: Point[]): Metrics {
  const leftEye = mid(lm[IDX.LEFT_EYE_OUT], lm[IDX.LEFT_EYE_IN]);
  const rightEye = mid(lm[IDX.RIGHT_EYE_IN], lm[IDX.RIGHT_EYE_OUT]);

  const tilt = toDeg(Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x));

  const a = lm[IDX.NOSE_TOP];
  const b = lm[IDX.CHIN];
  const faceWidth = dist(lm[IDX.LEFT_CHEEK], lm[IDX.RIGHT_CHEEK]);
  let sumDiff = 0;
  for (const [l, r] of BILATERAL_PAIRS) {
    const dl = Math.abs(perpDist(lm[l], a, b));
    const dr = Math.abs(perpDist(lm[r], a, b));
    sumDiff += Math.abs(dl - dr);
  }
  const avgDiff = sumDiff / BILATERAL_PAIRS.length;
  const symmetry = Math.max(0, Math.min(100, 100 - (avgDiff / (faceWidth || 1)) * 800));

  const browMid = mid(lm[IDX.LEFT_BROW], lm[IDX.RIGHT_BROW]);
  const mouthTop = lm[IDX.MOUTH_TOP];
  const fwhr = faceWidth / (Math.abs(mouthTop.y - browMid.y) || 1);

  const lJaw = angleBetween(lm[IDX.LEFT_CHEEK], lm[IDX.LEFT_JAW], lm[IDX.CHIN]);
  const rJaw = angleBetween(lm[IDX.RIGHT_CHEEK], lm[IDX.RIGHT_JAW], lm[IDX.CHIN]);
  const jawAngle = (lJaw + rJaw) / 2;

  const lMouth = lm[IDX.LEFT_MOUTH];
  const rMouth = lm[IDX.RIGHT_MOUTH];
  const mouthTilt = toDeg(Math.atan2(rMouth.y - lMouth.y, rMouth.x - lMouth.x));

  const sNorm = symmetry / 100;
  const tNorm = Math.max(0, 1 - Math.abs(tilt) / 20);
  const fNorm = Math.max(0, 1 - Math.abs(fwhr - 1.9) / 0.6);
  const jNorm = Math.max(0, 1 - Math.abs(jawAngle - 130) / 30);
  const overall = Math.round((sNorm * 0.4 + tNorm * 0.15 + fNorm * 0.25 + jNorm * 0.2) * 10 * 10) / 10;

  return {
    tilt: Math.round(tilt * 10) / 10,
    mouthTilt: Math.round(mouthTilt * 10) / 10,
    symmetry: Math.round(symmetry),
    fwhr: Math.round(fwhr * 100) / 100,
    jawAngle: Math.round(jawAngle * 10) / 10,
    overall,
  };
}
