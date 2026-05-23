import type { Metrics, Point } from './faceAnalyzer';
import {
  IDX,
  JAW_CONTOUR,
  EYE_LEFT_CONTOUR,
  EYE_RIGHT_CONTOUR,
  LIPS_OUTER,
  NOSE_BRIDGE,
  mid,
} from './faceAnalyzer';

type Px = { x: number; y: number };

function drawPolyline(
  ctx: CanvasRenderingContext2D,
  pts: Px[],
  color: string,
  width: number,
  dashed = false,
) {
  if (pts.length < 2) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (dashed) ctx.setLineDash([width * 3, width * 2.5]);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawDots(ctx: CanvasRenderingContext2D, pts: Px[], color: string, radius: number) {
  ctx.fillStyle = color;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  anchor: Px,
  text: string,
  bg: string,
  fg: string,
  fontSize: number,
  align: 'left' | 'right' | 'center' = 'center',
) {
  ctx.font = `600 ${fontSize}px "JetBrains Mono", ui-monospace, monospace`;
  const padX = Math.round(fontSize * 0.7);
  const padY = Math.round(fontSize * 0.4);
  const tw = ctx.measureText(text).width;
  const w = tw + padX * 2;
  const h = fontSize + padY * 2;

  let x = anchor.x;
  if (align === 'center') x -= w / 2;
  if (align === 'right') x -= w;
  const y = anchor.y - h / 2;

  const r = Math.min(h / 2, 10);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + padX, y + h / 2 + 1);

  return { x, y, w, h };
}

function drawLeader(ctx: CanvasRenderingContext2D, from: Px, to: Px, color: string, width: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash([width * 2, width * 1.5]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(from.x, from.y, width * 1.5, 0, Math.PI * 2);
  ctx.fill();
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
  const mapIdx = (idxs: readonly number[]): Px[] => idxs.map((i) => toPx(lm[i]));

  const lineW = Math.max(2.5, h * 0.0045);
  const thinW = Math.max(1.5, h * 0.0022);
  const dotR = Math.max(1.5, h * 0.003);
  const fontSize = Math.max(15, Math.round(h * 0.028));

  drawPolyline(ctx, mapIdx(JAW_CONTOUR), 'rgba(99,102,241,0.9)', lineW);
  drawPolyline(ctx, mapIdx(EYE_LEFT_CONTOUR), 'rgba(34,211,238,0.8)', thinW);
  drawPolyline(ctx, mapIdx(EYE_RIGHT_CONTOUR), 'rgba(34,211,238,0.8)', thinW);
  drawPolyline(ctx, mapIdx(LIPS_OUTER), 'rgba(16,185,129,0.85)', thinW);
  drawPolyline(ctx, mapIdx(NOSE_BRIDGE), 'rgba(249,115,22,0.85)', thinW, true);

  drawDots(
    ctx,
    [
      ...mapIdx(EYE_LEFT_CONTOUR),
      ...mapIdx(EYE_RIGHT_CONTOUR),
      ...mapIdx(LIPS_OUTER),
      ...mapIdx(JAW_CONTOUR),
    ],
    'rgba(196,181,253,0.85)',
    dotR,
  );

  const lEye = toPx(mid(lm[IDX.LEFT_EYE_OUT], lm[IDX.LEFT_EYE_IN]));
  const rEye = toPx(mid(lm[IDX.RIGHT_EYE_IN], lm[IDX.RIGHT_EYE_OUT]));
  drawPolyline(ctx, [lEye, rEye], '#22d3ee', lineW);

  const ys = lm.map((p) => p.y * h);
  const faceTop = Math.min(...ys);
  const faceBottom = Math.max(...ys);

  const marginX = Math.max(12, w * 0.02);
  const marginY = Math.max(12, h * 0.025);

  const tiltAnchor = { x: marginX, y: Math.max(marginY + fontSize, faceTop - 20) };
  const eyeMid = { x: (lEye.x + rEye.x) / 2, y: (lEye.y + rEye.y) / 2 };
  drawLeader(ctx, eyeMid, { x: tiltAnchor.x + fontSize * 3, y: tiltAnchor.y }, 'rgba(34,211,238,0.5)', thinW);
  drawPill(ctx, tiltAnchor, `TILT ${m.tilt >= 0 ? '+' : ''}${m.tilt.toFixed(1)}°`, '#0e7490', '#ecfeff', fontSize, 'left');

  const symAnchor = { x: w - marginX, y: Math.max(marginY + fontSize, faceTop - 20) };
  const noseTopPx = px(IDX.NOSE_TOP);
  drawLeader(ctx, noseTopPx, { x: symAnchor.x - fontSize * 3, y: symAnchor.y }, 'rgba(249,115,22,0.5)', thinW);
  drawPill(ctx, symAnchor, `SYM ${m.symmetry}%`, '#9a3412', '#fff7ed', fontSize, 'right');

  const fwhrAnchor = { x: marginX, y: Math.min(h - marginY - fontSize, faceBottom + 20) };
  const cheekMid = {
    x: (px(IDX.LEFT_CHEEK).x + px(IDX.RIGHT_CHEEK).x) / 2,
    y: (px(IDX.LEFT_CHEEK).y + px(IDX.RIGHT_CHEEK).y) / 2,
  };
  drawLeader(ctx, cheekMid, { x: fwhrAnchor.x + fontSize * 3, y: fwhrAnchor.y }, 'rgba(168,85,247,0.5)', thinW);
  drawPill(ctx, fwhrAnchor, `FWHR ${m.fwhr.toFixed(2)}`, '#6b21a8', '#faf5ff', fontSize, 'left');

  const jawAnchor = { x: w - marginX, y: Math.min(h - marginY - fontSize, faceBottom + 20) };
  const chinPx = px(IDX.CHIN);
  drawLeader(ctx, chinPx, { x: jawAnchor.x - fontSize * 3, y: jawAnchor.y }, 'rgba(99,102,241,0.5)', thinW);
  drawPill(ctx, jawAnchor, `JAW ${m.jawAngle.toFixed(0)}°`, '#3730a3', '#eef2ff', fontSize, 'right');

  const scoreText = `${m.overall.toFixed(1)} / 10`;
  const scoreAnchor = { x: w / 2, y: marginY + fontSize * 0.8 };
  drawPill(ctx, scoreAnchor, scoreText, 'rgba(0,0,0,0.7)', '#fff', Math.round(fontSize * 1.15), 'center');
}
