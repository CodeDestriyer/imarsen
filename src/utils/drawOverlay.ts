import type { Metrics, Point } from './faceAnalyzer';

export function drawSnapshotOverlay(
  ctx: CanvasRenderingContext2D,
  lm: Point[],
  w: number,
  h: number,
  _m: Metrics,
) {
  ctx.clearRect(0, 0, w, h);
  ctx.save();

  const scale = Math.max(w, h) / 720;
  const lw = (n: number) => Math.max(1, n * scale);

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const p = (i: number) => ({ x: (1 - lm[i].x) * w, y: lm[i].y * h });

  const ys = lm.map((q) => q.y * h);
  const faceTop = Math.min(...ys);
  const faceBottom = Math.max(...ys);
  const JAW_DY = (faceBottom - faceTop) * 0.06;
  const sh = (pt: { x: number; y: number }, dy: number) => ({ x: pt.x, y: pt.y + dy });

  ctx.fillStyle = 'rgba(190, 210, 230, 0.55)';
  for (const pt of lm) {
    ctx.beginPath();
    ctx.arc((1 - pt.x) * w, pt.y * h, Math.max(0.8, scale * 1.0), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 4 * scale;

  const top = p(10);
  const brow = p(9);
  const sub = p(2);
  const noseTip = p(1);
  const chin = sh(p(152), JAW_DY);
  const rZyg = p(234);
  const lZyg = p(454);
  const rGonion = sh(p(172), JAW_DY);
  const lGonion = sh(p(397), JAW_DY);
  const rI = p(133), rO = p(33);
  const lI = p(362), lO = p(263);
  const uo = p(0), ui = p(13), li = p(14), lo = p(17);

  const midX = (brow.x + noseTip.x + chin.x) / 3;

  ctx.strokeStyle = 'rgba(214, 168, 92, 0.95)';
  ctx.lineWidth = lw(2.2);
  ctx.setLineDash([8 * scale, 6 * scale]);
  ctx.beginPath();
  ctx.moveTo(midX, top.y - 20 * scale);
  ctx.lineTo(midX, chin.y + 30 * scale);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.strokeStyle = 'rgba(96, 168, 178, 0.85)';
  ctx.lineWidth = lw(2);
  for (const yy of [top.y, brow.y, sub.y, chin.y]) {
    ctx.beginPath();
    ctx.moveTo(w * 0.05, yy);
    ctx.lineTo(w * 0.95, yy);
    ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(192, 72, 72, 0.95)';
  ctx.lineWidth = lw(3);
  ctx.beginPath();
  ctx.moveTo(rZyg.x, rZyg.y);
  ctx.lineTo(rGonion.x, rGonion.y);
  ctx.lineTo(chin.x, chin.y);
  ctx.lineTo(lGonion.x, lGonion.y);
  ctx.lineTo(lZyg.x, lZyg.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(155, 110, 196, 0.95)';
  ctx.lineWidth = lw(2.4);
  ctx.beginPath();
  ctx.moveTo(rZyg.x, rZyg.y);
  ctx.lineTo(lZyg.x, lZyg.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(204, 102, 122, 0.95)';
  ctx.lineWidth = lw(2.4);
  ctx.beginPath();
  for (const lip of [uo, ui, li, lo]) {
    ctx.moveTo(lip.x - 18 * scale, lip.y);
    ctx.lineTo(lip.x + 18 * scale, lip.y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(96, 184, 120, 0.95)';
  ctx.lineWidth = lw(2.6);
  ctx.beginPath();
  ctx.moveTo(rI.x, rI.y); ctx.lineTo(rO.x, rO.y);
  ctx.moveTo(lI.x, lI.y); ctx.lineTo(lO.x, lO.y);
  ctx.stroke();

  ctx.shadowBlur = 0;

  const hasIris = lm.length > 477;
  const rIris = hasIris
    ? p(468)
    : { x: (rI.x + rO.x) / 2, y: (lm[159].y * h + lm[145].y * h) / 2 };
  const lIris = hasIris
    ? p(473)
    : { x: (lI.x + lO.x) / 2, y: (lm[386].y * h + lm[374].y * h) / 2 };

  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 6 * scale;
  for (const iris of [rIris, lIris]) {
    ctx.fillStyle = 'rgba(96, 184, 120, 1)';
    ctx.beginPath();
    ctx.arc(iris.x, iris.y, lw(5), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(iris.x, iris.y, lw(2), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  const accents: Array<[{ x: number; y: number }, string]> = [
    [rZyg, 'rgba(192, 72, 72, 1)'],
    [lZyg, 'rgba(192, 72, 72, 1)'],
    [rGonion, 'rgba(192, 72, 72, 1)'],
    [lGonion, 'rgba(192, 72, 72, 1)'],
    [chin, 'rgba(192, 72, 72, 1)'],
    [rI, 'rgba(96, 184, 120, 1)'],
    [rO, 'rgba(96, 184, 120, 1)'],
    [lI, 'rgba(96, 184, 120, 1)'],
    [lO, 'rgba(96, 184, 120, 1)'],
    [brow, 'rgba(96, 168, 178, 1)'],
    [sub, 'rgba(96, 168, 178, 1)'],
    [top, 'rgba(96, 168, 178, 1)'],
  ];
  for (const [pt, color] of accents) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, lw(3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
