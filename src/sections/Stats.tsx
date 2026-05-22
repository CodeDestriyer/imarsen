import { Reveal } from '@/components/Reveal';
import { Counter } from '@/components/Counter';

const items = [
  { to: 17, suffix: '', label: 'метрик в отчёте' },
  { to: 94, suffix: '%', label: 'точность модели' },
  { to: 30, suffix: '', label: 'дней роадмапа' },
  { to: 4.9, suffix: '', label: 'рейтинг ★', decimals: 1 },
];

export function Stats() {
  return (
    <section className="py-10 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="glass rounded-2xl border border-white/10 px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {items.map((it) => (
              <div key={it.label}>
                <div className="text-2xl md:text-3xl font-bold text-white">
                  <Counter to={it.to} suffix={it.suffix} decimals={it.decimals ?? 0} />
                </div>
                <div className="text-xs text-gray-500 mt-1">{it.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
