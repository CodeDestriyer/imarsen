import type { MouseEvent } from 'react';
import { Reveal } from '@/components/Reveal';
import { features } from '@/data/content';

function FeatureCard({ feature, delay, idx }: { feature: typeof features[number]; delay: number; idx: number }) {
  const { icon: Icon, title, desc, metricLabel, metricValue } = feature;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  const id = String(idx + 1).padStart(2, '0');

  return (
    <Reveal delay={delay} variant={idx % 2 === 0 ? 'up' : 'blur'}>
      <div className={`feature-card ${idx === 1 || idx === 4 ? 'cut-corner-bl' : ''}`} onMouseMove={onMove}>
        <div className="flex items-start justify-between mb-5">
          <div className="icon-bubble"><Icon /></div>
          <span className="telemetry mt-1">M.{id}</span>
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
        <div className="flex items-center justify-between pt-4 mt-5 border-t border-white/10 text-xs text-gray-500">
          <span>{metricLabel}</span>
          <span className="text-indigo-300 font-medium mono">{metricValue}</span>
        </div>
      </div>
    </Reveal>
  );
}

export function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="telemetry mb-3">02 — features</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Почему imarsen</h2>
            <p className="mt-4 text-gray-400">Не просто оценка, а полноценная система для тех, кто работает над собой. Сравнивайте прогресс, получайте бонусы, следуйте роадмапу.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} delay={i * 0.05} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
