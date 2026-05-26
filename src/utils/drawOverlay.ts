import type { Metrics, Point } from './faceAnalyzer';
import { IDX } from './faceAnalyzer';

export function drawSnapshotOverlay(
  ctx: CanvasRenderingContext2D,
  lm: Point[],
  w: number,
  h: number,
  metrics: Metrics,
) {
  ctx.save();

  const scale = Math.max(w, h) / 720;
  const lw = (n: number) => Math.max(1, n * scale);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 4 * scale;

  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(190, 210, 230, 0.45)';
  for (const pt of lm) {
    ctx.beginPath();
    ctx.arc(pt.x * w, pt.y * h, Math.max(0.7, scale * 0.9), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 4 * scale;

  const p = (i: number) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const top = p(IDX.foreheadTop);
  const brow = p(IDX.glabella);
  const sub = p(IDX.subnasale);
  const chin = p(IDX.chin);

  ctx.strokeStyle = 'rgba(214, 168, 92, 0.95)';
  ctx.lineWidth = lw(2.2);
  ctx.setLineDash([8 * scale, 6 * scale]);
  ctx.beginPath();
  ctx.moveTo(metrics.midX * w, top.y - 20 * scale);
  ctx.lineTo(metrics.midX * w, chin.y + 30 * scale);
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
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  const r = p(IDX.rZyg);
  const rg = p(IDX.rGonion);
  const lg = p(IDX.lGonion);
  const l = p(IDX.lZyg);
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(rg.x, rg.y);
  ctx.lineTo(chin.x, chin.y);
  ctx.lineTo(lg.x, lg.y);
  ctx.lineTo(l.x, l.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(155, 110, 196, 0.95)';
  ctx.lineWidth = lw(2.4);
  ctx.beginPath();
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(l.x, l.y);
  ctx.stroke();

  const uo = p(IDX.upperLipOuter);
  const ui = p(IDX.upperLipInner);
  const li = p(IDX.lowerLipInner);
  const lo = p(IDX.lowerLipOuter);
  ctx.strokeStyle = 'rgba(204, 102, 122, 0.95)';
  ctx.lineWidth = lw(2.4);
  ctx.beginPath();
  ctx.moveTo(uo.x - 18 * scale, uo.y); ctx.lineTo(uo.x + 18 * scale, uo.y);
  ctx.moveTo(ui.x - 18 * scale, ui.y); ctx.lineTo(ui.x + 18 * scale, ui.y);
  ctx.moveTo(li.x - 18 * scale, li.y); ctx.lineTo(li.x + 18 * scale, li.y);
  ctx.moveTo(lo.x - 18 * scale, lo.y); ctx.lineTo(lo.x + 18 * scale, lo.y);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(96, 184, 120, 0.95)';
  ctx.lineWidth = lw(2.6);
  ctx.beginPath();
  const rI = p(IDX.rInner);
  const rO = p(IDX.rOuter);
  const lI = p(IDX.lInner);
  const lO = p(IDX.lOuter);
  ctx.moveTo(rI.x, rI.y); ctx.lineTo(rO.x, rO.y);
  ctx.moveTo(lI.x, lI.y); ctx.lineTo(lO.x, lO.y);
  ctx.stroke();

  ctx.shadowBlur = 0;
  const accent: Array<[number, string]> = [
    [IDX.rZyg, 'rgba(192, 72, 72, 1)'],
    [IDX.lZyg, 'rgba(192, 72, 72, 1)'],
    [IDX.rGonion, 'rgba(192, 72, 72, 1)'],
    [IDX.lGonion, 'rgba(192, 72, 72, 1)'],
    [IDX.chin, 'rgba(192, 72, 72, 1)'],
    [IDX.rInner, 'rgba(96, 184, 120, 1)'],
    [IDX.rOuter, 'rgba(96, 184, 120, 1)'],
    [IDX.lInner, 'rgba(96, 184, 120, 1)'],
    [IDX.lOuter, 'rgba(96, 184, 120, 1)'],
    [IDX.glabella, 'rgba(96, 168, 178, 1)'],
    [IDX.subnasale, 'rgba(96, 168, 178, 1)'],
    [IDX.foreheadTop, 'rgba(96, 168, 178, 1)'],
  ];
  for (const [idx, color] of accent) {
    const pt = p(idx);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, lw(3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
