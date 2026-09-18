import { useEffect, useRef } from 'react';

/**
 * Автокарусель «образцов»: непрерывно едет справа налево, но её можно
 * посвайпать руками (на время касания автоскролл ставится на паузу).
 * Фото — плейсхолдеры из /public; замени на реальные снимки в /public/people/.
 */
type Subject = {
  id: string;
  name: string;
  img: string;
  score: number;
  symmetry: number;
  fwhr: number;
};

const subjects: Subject[] = [
  { id: 'C-014', name: 'Образец C-014', img: '/hero-model.jpg', score: 8.7, symmetry: 92, fwhr: 78 },
  { id: 'C-021', name: 'Образец C-021', img: '/example.jpg', score: 7.9, symmetry: 84, fwhr: 71 },
  { id: 'C-033', name: 'Образец C-033', img: '/avatars/ava1.jpg', score: 8.2, symmetry: 88, fwhr: 74 },
  { id: 'C-045', name: 'Образец C-045', img: '/avatars/ava2.jpg', score: 7.4, symmetry: 80, fwhr: 69 },
  { id: 'C-052', name: 'Образец C-052', img: '/avatars/ava3.jpg', score: 8.5, symmetry: 90, fwhr: 76 },
  { id: 'C-061', name: 'Образец C-061', img: '/avatars/ava4.jpg', score: 7.7, symmetry: 83, fwhr: 72 },
];

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">{label}</span>
        <span className="mono tnum text-xs text-ink">{value}%</span>
      </div>
      <div className="metric-bar">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function Card({ s }: { s: Subject }) {
  return (
    <article className="people-card" aria-hidden>
      <div className="people-photo">
        <img src={s.img} alt="" loading="lazy" draggable={false} />
        <span className="people-tag">CASE {s.id}</span>
      </div>
      <div className="p-3.5 space-y-3">
        <div className="flex items-baseline justify-between">
          <h3 className="font-semibold text-sm text-ink">{s.name}</h3>
          <span className="mono tnum text-lg text-accent">{s.score.toFixed(1)}</span>
        </div>
        <Metric label="Симметрия" value={s.symmetry} />
        <Metric label="FWHR" value={s.fwhr} />
      </div>
    </article>
  );
}

export function PeopleCarousel({ onStart }: { onStart: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const SPEED = 0.5; // px per frame, right→left
    const step = () => {
      if (!paused.current) {
        el.scrollLeft += SPEED;
        const half = el.scrollWidth / 2;
        if (el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const hold = () => (paused.current = true);
    const release = () => (paused.current = false);
    el.addEventListener('pointerdown', hold);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
    el.addEventListener('touchstart', hold, { passive: true });
    el.addEventListener('touchend', release);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerdown', hold);
      el.removeEventListener('pointerup', release);
      el.removeEventListener('pointercancel', release);
      el.removeEventListener('pointerleave', release);
      el.removeEventListener('touchstart', hold);
      el.removeEventListener('touchend', release);
    };
  }, []);

  // Дублируем список для бесшовной петли.
  const loop = [...subjects, ...subjects];

  return (
    <section id="cases" className="py-12 sm:py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between px-1 mb-4">
          <span className="live-dot">rec · live intake</span>
          <span className="eyebrow"><span className="med-plus">+</span> swipe</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="people-track" ref={trackRef}>
          {loop.map((s, i) => (
            <Card key={`${s.id}-${i}`} s={s} />
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-6 flex flex-wrap items-center gap-3 px-1">
          <button onClick={onStart} className="btn-primary px-6 py-3 rounded font-medium text-sm">
            Проверить своё лицо
          </button>
          <span className="eyebrow">результат за пару секунд</span>
        </div>
      </div>
    </section>
  );
}
