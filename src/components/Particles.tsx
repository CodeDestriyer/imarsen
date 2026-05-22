import { useEffect, useRef } from 'react';

type Dot = { x: number; y: number; vx: number; vy: number; r: number };

const COLORS = ['#a78bfa', '#818cf8', '#c4b5fd'];
const LINK_DIST = 140;
const COUNT = 55;
const SPEED = 0.25;

export function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dots: Dot[] = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let raf = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      dots = Array.from({ length: COUNT }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * SPEED,
        vy: (Math.random() - 0.5) * SPEED,
        r: 0.6 + Math.random() * 1.6,
      }));
    };

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => { mouseRef.current = { x: -9999, y: -9999 }; };

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        const color = COLORS[Math.floor(d.r) % COLORS.length];
        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DIST) {
            ctx.globalAlpha = (1 - dist / LINK_DIST) * 0.22;
            ctx.strokeStyle = '#7c3aed';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        const m = mouseRef.current;
        const dx = dots[i].x - m.x, dy = dots[i].y - m.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 160) {
          ctx.globalAlpha = (1 - dist / 160) * 0.5;
          ctx.strokeStyle = '#a855f7';
          ctx.beginPath(); ctx.moveTo(dots[i].x, dots[i].y); ctx.lineTo(m.x, m.y); ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouse);
    window.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}
