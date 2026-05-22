import { useRef, type ReactNode } from 'react';

type Props = { children: ReactNode; className?: string; max?: number };

export function Tilt({ children, className, max = 6 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el || window.matchMedia('(hover: none)').matches) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-py * max).toFixed(2)}deg) rotateY(${(px * max).toFixed(2)}deg)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0) rotateY(0)';
  };

  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`tilt ${className ?? ''}`}>
      {children}
    </div>
  );
}
