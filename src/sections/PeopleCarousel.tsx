import { useEffect, useRef } from 'react';

/**
 * Автокарусель фотографий: непрерывно едет справа налево, её можно
 * посвайпать руками (на время касания автоскролл ставится на паузу).
 *
 * Фото: /public/people/1..9.jpg. Это реальные люди — перед публичным
 * запуском убедись, что есть право на использование (consent/сток).
 */
const PHOTOS = Array.from({ length: 9 }, (_, i) => `/people/${i + 1}.jpg`);

export function PeopleCarousel({ onStart }: { onStart: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const SPEED = 0.5; // px/frame, right→left
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

  // дублируем для бесшовной петли
  const loop = [...PHOTOS, ...PHOTOS];

  return (
    <section id="cases" className="py-12 sm:py-16 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-4">
        <div className="flex items-center justify-between px-1">
          <span className="live-dot">rec · live intake</span>
          <span className="eyebrow"><span className="med-plus">+</span> swipe</span>
        </div>
      </div>

      <div className="people-track" ref={trackRef}>
        {loop.map((src, i) => (
          <article className="people-card" key={i} aria-hidden>
            <div className="people-photo">
              <img src={src} alt="" loading="lazy" draggable={false} />
              <span className="people-idx">{String((i % PHOTOS.length) + 1).padStart(2, '0')}</span>
            </div>
          </article>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex flex-wrap items-center gap-3 px-1">
          <button onClick={onStart} className="btn-primary px-6 py-3 rounded font-medium text-sm">
            Проверить своё лицо
          </button>
          <span className="eyebrow">результат за пару секунд</span>
        </div>
      </div>
    </section>
  );
}
