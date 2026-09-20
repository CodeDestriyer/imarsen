/**
 * Овал-прицел и контроль дистанции до камеры.
 *
 * Зачем дистанция: вблизи объектива нос физически ближе к камере, чем уши,
 * и проекция это преувеличивает — лицо уже, нос шире. Один и тот же человек
 * с 30 и с 80 см даёт разные пропорции, и разница больше, чем между двумя
 * разными людьми. Плюс у лендмарок погрешность примерно фиксирована в
 * пикселях, так что мелкое лицо в кадре — это втрое больший шум на каждом
 * отношении. Фиксируем заполнение кадра — фиксируем и то, и другое.
 *
 * Важно: меряем по межзрачковому расстоянию, а НЕ по тому, влезло ли лицо
 * в контур овала. Иначе широколицые отсаживались бы дальше, узколицые
 * придвигались, и форма лица начала бы коррелировать с дистанцией — мы бы
 * своими руками исказили ровно те метрики, которые считаем. Межзрачковое
 * у взрослых колеблется куда слабее (примерно 58-70 мм).
 */

import type { Point } from './faceAnalyzer';

export type FramingReason = 'far' | 'near' | 'off-center';
export type Framing = { ok: boolean; reason: FramingReason | null; ipdRatio: number };

export type Rect = { x: number; y: number; w: number; h: number };
export type Oval = { cx: number; cy: number; rx: number; ry: number };

/**
 * Целевое межзрачковое в долях видимой высоты кадра. Замерено на портретах,
 * где лицо занимает кадр целиком: медиана 0.179, максимум 0.223.
 */
const IPD_TARGET = 0.19;
const IPD_MIN = 0.15;
const IPD_MAX = 0.235;

/** Пропорции овала: высота к ширине, близко к форме головы. */
const OVAL_RATIO = 1.32;
const OVAL_HEIGHT = 0.78;
/** Насколько далеко зрачки могут уехать от центра овала, в долях его полуосей. */
const CENTER_TOLERANCE = 0.25;

/**
 * Видимая часть кадра. Видео показывается с `object-cover`, то есть
 * обрезается по краям, и рисовать прицел надо внутри того, что реально видно,
 * иначе овал частично уедет за границу.
 */
export function visibleRect(canvasW: number, canvasH: number, containerAspect: number): Rect {
  if (!(canvasW > 0 && canvasH > 0 && containerAspect > 0)) {
    return { x: 0, y: 0, w: canvasW, h: canvasH };
  }
  const videoAspect = canvasW / canvasH;
  if (videoAspect > containerAspect) {
    const w = canvasH * containerAspect;
    return { x: (canvasW - w) / 2, y: 0, w, h: canvasH };
  }
  const h = canvasW / containerAspect;
  return { x: 0, y: (canvasH - h) / 2, w: canvasW, h };
}

export function ovalFor(rect: Rect): Oval {
  const ry = (rect.h * OVAL_HEIGHT) / 2;
  return { cx: rect.x + rect.w / 2, cy: rect.y + rect.h / 2, rx: ry / OVAL_RATIO, ry };
}

/**
 * @param pupils Зрачки в пикселях канваса.
 * @param rect Видимая часть кадра — от её высоты считается целевой размер.
 */
export function checkFraming(pupils: { r: Point; l: Point }, rect: Rect, oval: Oval): Framing {
  const ipd = Math.hypot(pupils.r.x - pupils.l.x, pupils.r.y - pupils.l.y);
  const ipdRatio = ipd / Math.max(1e-6, rect.h);

  if (ipdRatio < IPD_MIN) return { ok: false, reason: 'far', ipdRatio };
  if (ipdRatio > IPD_MAX) return { ok: false, reason: 'near', ipdRatio };

  const cx = (pupils.r.x + pupils.l.x) / 2;
  const cy = (pupils.r.y + pupils.l.y) / 2;
  const offX = Math.abs(cx - oval.cx) / oval.rx;
  const offY = Math.abs(cy - oval.cy) / oval.ry;
  if (offX > CENTER_TOLERANCE || offY > CENTER_TOLERANCE) {
    return { ok: false, reason: 'off-center', ipdRatio };
  }
  return { ok: true, reason: null, ipdRatio };
}

/** Насколько далеко пользователь от нужной дистанции: -1 слишком далеко, +1 слишком близко. */
export function distanceDrift(ipdRatio: number): number {
  return (ipdRatio - IPD_TARGET) / (IPD_MAX - IPD_MIN);
}

export function drawGuide(ctx: CanvasRenderingContext2D, oval: Oval, ready: boolean, scale: number) {
  ctx.save();
  ctx.setLineDash([]);
  ctx.lineWidth = Math.max(1.5, 2.6 * scale);
  ctx.strokeStyle = ready ? 'rgba(52, 211, 153, 0.95)' : 'rgba(255, 255, 255, 0.4)';
  if (ready) {
    ctx.shadowColor = 'rgba(52, 211, 153, 0.55)';
    ctx.shadowBlur = 18 * scale;
  }
  ctx.beginPath();
  ctx.ellipse(oval.cx, oval.cy, oval.rx, oval.ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

/**
 * Отсчёт рисуем дугой по самому овалу, а не цифрой по центру: цифра легла бы
 * ровно на глаза и закрыла бы то, на что человек смотрит, выравниваясь.
 * Сам счётчик показывается в плашке сверху.
 *
 * @param progress Доля пройденного отсчёта, 0..1.
 */
export function drawCountdownArc(
  ctx: CanvasRenderingContext2D,
  oval: Oval,
  progress: number,
  scale: number,
) {
  const span = Math.max(0, Math.min(1, progress)) * Math.PI * 2;
  if (span <= 0) return;
  ctx.save();
  ctx.lineWidth = Math.max(2.5, 4.5 * scale);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(52, 211, 153, 1)';
  ctx.shadowColor = 'rgba(52, 211, 153, 0.7)';
  ctx.shadowBlur = 22 * scale;
  ctx.beginPath();
  // От верхней точки по часовой стрелке.
  ctx.ellipse(oval.cx, oval.cy, oval.rx, oval.ry, 0, -Math.PI / 2, -Math.PI / 2 + span);
  ctx.stroke();
  ctx.restore();
}
