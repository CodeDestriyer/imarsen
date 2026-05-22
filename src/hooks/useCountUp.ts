import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(target * eased);
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.unobserve(node);
        }
      });
    }, { threshold: 0.5 });
    io.observe(node);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, value };
}
