import type { Metrics, Point } from './faceAnalyzer';
import { IDX, JAW_CONTOUR, LIPS_OUTER, mid } from './faceAnalyzer';

type Px = { x: number; y: number };

const COLORS = {
  jaw: 'rgba(192, 72, 72, 0.95)',
  symAxis: 'rgba(214, 168, 92, 0.95)',
  thirds: 'rgba(96, 168, 178, 0.85)',
  fwhr: 'rgba(155, 110, 196, 0.95)',
  canthalTilt: 'rgba(96, 184, 120, 0.95)',
  lips: 'rgba(204, 102, 122, 0.95)',
  dots: 'rgba(190, 210, 230, 0.45)',
};

function stroke(ctx: CanvasRenderingContext2D, pts: Px[], color: string, width: number, dashed = false) {
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

function dots(ctx: CanvasRenderingContext2D, pts: Px[], color: string, r: number) {
  ctx.fillStyle = color;
  for (const p of pts) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function pill(
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

  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = fg;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText(text, x + padX, y + h / 2 + 1);
}

function leader(ctx: CanvasRenderingContext2D, from: Px, to: Px, color: string, width: number) {
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
  const map = (idxs: readonly number[]): Px[] => idxs.map((i) => toPx(lm[i]));

  const ys = lm.map((p) => p.y * h);
  const faceTop = Math.min(...ys);
  const faceBottom = Math.max(...ys);
  const faceHeight = faceBottom - faceTop;

  const JAW_OFFSET_Y = faceHeight * 0.06;

  const shift = (p: Px, dy: number): Px => ({ x: p.x, y: p.y + dy });
  const shiftAll = (pts: Px[], dy: number): Px[] => pts.map((p) => shift(p, dy));

  const lineW = Math.max(2.5, h * 0.0045);
  const thinW = Math.max(1.5, h * 0.0025);
  const dotR = Math.max(1.2, h * 0.0022);
  const fontSize = Math.max(15, Math.round(h * 0.028));

  const forehead = px(IDX.FOREHEAD);
  const glabella = px(168);
  const noseTip = px(IDX.NOSE_TIP);
  const subnasale = px(2);
  const chin = shift(px(IDX.CHIN), JAW_OFFSET_Y);

  const thirdsY = [forehead.y, glabella.y, subnasale.y, chin.y];
  const thirdsX1 = w * 0.025;
  const thirdsX2 = w * 0.975;
  for (const y of thirdsY) {
    stroke(ctx, [{ x: thirdsX1, y }, { x: thirdsX2, y }], COLORS.thirds, thinW);
  }

  const midX = (glabella.x + noseTip.x + chin.x) / 3;
  stroke(
    ctx,
    [{ x: midX, y: forehead.y - 20 }, { x: midX, y: chin.y + 30 }],
    COLORS.symAxis,
    Math.max(2, h * 0.003),
    true,
  );

  stroke(ctx, shiftAll(map(JAW_CONTOUR), JAW_OFFSET_Y), COLORS.jaw, lineW + 0.5);
  stroke(ctx, map(LIPS_OUTER), COLORS.lips, thinW + 0.5);

  const lCheek = px(IDX.LEFT_CHEEK);
  const rCheek = px(IDX.RIGHT_CHEEK);
  stroke(ctx, [lCheek, rCheek], COLORS.fwhr, thinW + 0.5);

  const lEye = toPx(mid(lm[IDX.LEFT_EYE_OUT], lm[IDX.LEFT_EYE_IN]));
  const rEye = toPx(mid(lm[IDX.RIGHT_EYE_IN], lm[IDX.RIGHT_EYE_OUT]));
  stroke(ctx, [lEye, rEye], COLORS.canthalTilt, lineW);

  dots(ctx, [...map(JAW_CONTOUR).map((p) => shift(p, JAW_OFFSET_Y)), ...map(LIPS_OUTER)], COLORS.dots, dotR);

  const marginX = Math.max(12, w * 0.02);
  const marginY = Math.max(12, h * 0.025);
  const labelY1 = Math.max(marginY + fontSize, faceTop - 20);
  const labelY2 = Math.min(h - marginY - fontSize, faceBottom + 20);

  const tiltAnchor = { x: marginX, y: labelY1 };
  const eyeMid = { x: (lEye.x + rEye.x) / 2, y: (lEye.y + rEye.y) / 2 };
  leader(ctx, eyeMid, { x: tiltAnchor.x + fontSize * 3, y: tiltAnchor.y }, COLORS.canthalTilt, thinW);
  pill(ctx, tiltAnchor, `TILT ${m.tilt >= 0 ? '+' : ''}${m.tilt.toFixed(1)}°`, '#365314', '#ecfccb', fontSize, 'left');

  const symAnchor = { x: w - marginX, y: labelY1 };
  leader(ctx, { x: midX, y: glabella.y }, { x: symAnchor.x - fontSize * 3, y: symAnchor.y }, COLORS.symAxis, thinW);
  pill(ctx, symAnchor, `SYM ${m.symmetry}%`, '#78350f', '#fef3c7', fontSize, 'right');

  const fwhrAnchor = { x: marginX, y: labelY2 };
  const cheekMid = { x: (lCheek.x + rCheek.x) / 2, y: (lCheek.y + rCheek.y) / 2 };
  leader(ctx, cheekMid, { x: fwhrAnchor.x + fontSize * 3, y: fwhrAnchor.y }, COLORS.fwhr, thinW);
  pill(ctx, fwhrAnchor, `FWHR ${m.fwhr.toFixed(2)}`, '#581c87', '#f5e8ff', fontSize, 'left');

  const jawAnchor = { x: w - marginX, y: labelY2 };
  leader(ctx, chin, { x: jawAnchor.x - fontSize * 3, y: jawAnchor.y }, COLORS.jaw, thinW);
  pill(ctx, jawAnchor, `JAW ${m.jawAngle.toFixed(0)}°`, '#7f1d1d', '#fee2e2', fontSize, 'right');

  pill(
    ctx,
    { x: w / 2, y: marginY + fontSize * 0.8 },
    `${m.overall.toFixed(1)} / 10`,
    'rgba(0,0,0,0.78)',
    '#fff',
    Math.round(fontSize * 1.18),
    'center',
  );
}
