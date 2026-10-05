import type { Metrics, Point } from './faceAnalyzer';
import { IDX, pupilPair } from './faceAnalyzer';

/**
 * Разметка поверх снимка. Каждая линия — реальный замер из таблицы:
 * FWHR (скулы и высота веки–губа), челюсть, треугольник глаза–рот–глаз,
 * наклон глаз, губы.
 */
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

  ctx.fillStyle = 'rgba(190, 210, 230, 0.45)';
  for (const pt of lm) {
    ctx.beginPath();
    ctx.arc(pt.x * w, pt.y * h, Math.max(0.7, scale * 0.9), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
  ctx.shadowBlur = 4 * scale;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const p = (i: number) => ({ x: lm[i].x * w, y: lm[i].y * h });
  const line = (a: Point, b: Point) => {
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
  };
  const top = p(IDX.foreheadTop);
  const chin = p(IDX.chin);
  const r = p(IDX.rZyg);
  const l = p(IDX.lZyg);
  const rg = p(IDX.rGonion);
  const lg = p(IDX.lGonion);

  // Средняя линия лица.
  ctx.strokeStyle = 'rgba(214, 168, 92, 0.95)';
  ctx.lineWidth = lw(2.2);
  ctx.setLineDash([8 * scale, 6 * scale]);
  ctx.beginPath();
  line({ x: metrics.midX * w, y: top.y - 20 * scale }, { x: metrics.midX * w, y: chin.y + 30 * scale });
  ctx.stroke();
  ctx.setLineDash([]);

  // FWHR: высота от верхних век до верхней губы, между скулами.
  const lidY = (p(IDX.rLidTop).y + p(IDX.lLidTop).y) / 2;
  const lipY = p(IDX.upperLipOuter).y;
  ctx.strokeStyle = 'rgba(96, 168, 178, 0.85)';
  ctx.lineWidth = lw(2);
  ctx.beginPath();
  line({ x: r.x, y: lidY }, { x: l.x, y: lidY });
  line({ x: r.x, y: lipY }, { x: l.x, y: lipY });
  line({ x: r.x, y: lidY }, { x: r.x, y: lipY });
  line({ x: l.x, y: lidY }, { x: l.x, y: lipY });
  ctx.stroke();

  // Контур челюсти: скула — гонион — подбородок.
  ctx.strokeStyle = 'rgba(192, 72, 72, 0.95)';
  ctx.lineWidth = lw(3);
  ctx.beginPath();
  ctx.moveTo(r.x, r.y);
  ctx.lineTo(rg.x, rg.y);
  ctx.lineTo(chin.x, chin.y);
  ctx.lineTo(lg.x, lg.y);
  ctx.lineTo(l.x, l.y);
  ctx.stroke();

  // Ширина челюсти.
  ctx.strokeStyle = 'rgba(155, 110, 196, 0.95)';
  ctx.lineWidth = lw(2.4);
  ctx.beginPath();
  line(rg, lg);
  ctx.stroke();

  // Треугольник глаза–рот–глаз.
  const pupils = pupilPair(lm);
  const pr = { x: pupils.r.x * w, y: pupils.r.y * h };
  const pl = { x: pupils.l.x * w, y: pupils.l.y * h };
  const ui = p(IDX.upperLipInner);
  const li = p(IDX.lowerLipInner);
  const mouth = { x: (ui.x + li.x) / 2, y: (ui.y + li.y) / 2 };
  ctx.strokeStyle = 'rgba(232, 120, 96, 0.9)';
  ctx.lineWidth = lw(1.8);
  ctx.beginPath();
  line(pr, mouth);
  line(pl, mouth);
  line(pr, pl);
  ctx.stroke();

  // Губы: верх по пикам лука Купидона, линия смыкания, низ нижней губы.
  const bowY = (p(IDX.rBowPeak).y + p(IDX.lBowPeak).y) / 2;
  const lo = p(IDX.lowerLipOuter);
  const half = 18 * scale;
  ctx.strokeStyle = 'rgba(204, 102, 122, 0.95)';
  ctx.lineWidth = lw(2.4);
  ctx.beginPath();
  for (const yy of [bowY, ui.y, li.y, lo.y]) line({ x: mouth.x - half, y: yy }, { x: mouth.x + half, y: yy });
  ctx.stroke();

  // Наклон глаз: внутренний — внешний угол.
  ctx.strokeStyle = 'rgba(96, 184, 120, 0.95)';
  ctx.lineWidth = lw(2.6);
  ctx.beginPath();
  line(p(IDX.rInner), p(IDX.rOuter));
  line(p(IDX.lInner), p(IDX.lOuter));
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
  ];
  for (const [idx, color] of accent) {
    const pt = p(idx);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, lw(3), 0, Math.PI * 2);
    ctx.fill();
  }
  for (const pt of [pr, pl]) {
    ctx.fillStyle = 'rgba(232, 120, 96, 1)';
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, lw(3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
