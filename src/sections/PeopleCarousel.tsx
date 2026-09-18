import { useEffect, useMemo, useRef } from 'react';

/**
 * Автокарусель фотографий: непрерывно едет справа налево, её можно
 * посвайпать руками (на время касания автоскролл ставится на паузу).
 *
 * Фото: /public/people/*.jpg. Это реальные люди — перед публичным
 * запуском убедись, что есть право на использование (consent/сток).
 */
const PHOTO_IDS = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11];
const PHOTOS = PHOTO_IDS.map((n) => `/people/${n}.jpg`);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function PeopleCarousel() {
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

  // случайный порядок на загрузку + дублируем для бесшовной петли
  const shuffled = useMemo(() => shuffle(PHOTOS), []);
  const loop = [...shuffled, ...shuffled];

  return (
    <section id="cases" className="pt-4 pb-8 sm:pt-6 sm:pb-10 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
      </div>
    </section>
  );
}
