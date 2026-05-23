import type { Metrics, Point } from './faceAnalyzer';
import { IDX, mid } from './faceAnalyzer';

type Px = { x: number; y: number };

function drawLine(ctx: CanvasRenderingContext2D, a: Px, b: Px, color: string, width = 2, dashed = false) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  center: Px,
  text: string,
  bg: string,
  fg: string,
  yOffset = -24,
) {
  ctx.font = '600 13px "JetBrains Mono", ui-monospace, monospace';
  const padX = 8;
  const padY = 5;
  const tw = ctx.measureText(text).width;
  const w = tw + padX * 2;
  const h = 22;
  const x = center.x - w / 2;
  const y = center.y + yOffset - h / 2;

  ctx.fillStyle = bg;
  const r = 5;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.fill();

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + padX, y + h / 2 + padY * 0.1);
}

export function drawSnapshotOverlay(
  ctx: CanvasRenderingContext2D,
  lm: Point[],
  w: number,
  h: number,
  m: Metrics,
) {
  ctx.clearRect(0, 0, w, h);

  const toPx = (p: Point): Px => ({ x: (1 - p.x) * w, y: p.y * h });
  const px = (i: number): Px => toPx(lm[i]);
  const between = (a: Px, b: Px): Px => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  ctx.fillStyle = 'rgba(168, 85, 247, 0.35)';
  for (const p of lm) {
    ctx.beginPath();
    ctx.arc((1 - p.x) * w, p.y * h, 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const lEye = toPx(mid(lm[IDX.LEFT_EYE_OUT], lm[IDX.LEFT_EYE_IN]));
  const rEye = toPx(mid(lm[IDX.RIGHT_EYE_IN], lm[IDX.RIGHT_EYE_OUT]));
  const eyeMid = between(lEye, rEye);
  drawLine(ctx, lEye, rEye, '#22d3ee', 2);
  drawLabel(ctx, eyeMid, `Tilt ${m.tilt.toFixed(1)}°`, '#ef4444', '#fff', -34);

  const noseTop = px(IDX.NOSE_TOP);
  const chin = px(IDX.CHIN);
  drawLine(ctx, noseTop, chin, '#f97316', 2, true);
  drawLabel(ctx, { x: between(noseTop, chin).x + 60, y: between(noseTop, chin).y }, `Sym ${m.symmetry}%`, '#f97316', '#000', 0);

  const lMouth = px(IDX.LEFT_MOUTH);
  const rMouth = px(IDX.RIGHT_MOUTH);
  drawLine(ctx, lMouth, rMouth, '#10b981', 2);
  drawLabel(ctx, between(lMouth, rMouth), `${m.mouthTilt.toFixed(1)}°`, '#10b981', '#000', 22);

  const lCheek = px(IDX.LEFT_CHEEK);
  const rCheek = px(IDX.RIGHT_CHEEK);
  drawLine(ctx, lCheek, rCheek, 'rgba(196,181,253,0.4)', 1, true);
  drawLabel(ctx, { x: rCheek.x + 40, y: rCheek.y - 10 }, `FWHR ${m.fwhr.toFixed(2)}`, '#a855f7', '#fff', 0);

  const lJaw = px(IDX.LEFT_JAW);
  const rJaw = px(IDX.RIGHT_JAW);
  drawLine(ctx, lJaw, chin, 'rgba(99,102,241,0.5)', 1.5);
  drawLine(ctx, rJaw, chin, 'rgba(99,102,241,0.5)', 1.5);
  drawLabel(ctx, { x: chin.x, y: chin.y + 16 }, `Jaw ${m.jawAngle.toFixed(0)}°`, '#6366f1', '#fff', 22);
}
