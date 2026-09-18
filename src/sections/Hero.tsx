import { Reveal } from '@/components/Reveal';
import { Counter } from '@/components/Counter';

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section id="top" className="relative pt-24 pb-14 lg:pt-36 lg:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-3xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 mb-6 live-dot">
              N = <Counter to={50} suffix="+" /> оценок проведено
            </div>
          </Reveal>
          <Reveal delay={0.08} variant="blur">
            <h1 className="serif font-semibold text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.06]">
              Научный ИИ-анализ внешности
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
              Набор геометрических метрик вместо пустых комплиментов.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <button
                onClick={onStart}
                className="btn-primary px-8 py-4 rounded-md font-medium text-lg sm:text-xl"
              >
                ИИ-рейтинг
              </button>
              <span className="eyebrow">без регистрации · локально</span>
            </div>
          </Reveal>

          {/* Metric masthead */}
          <Reveal delay={0.32}>
            <dl className="mt-14 grid grid-cols-3 gap-px surface rounded overflow-hidden text-left">
              {[
                { k: 'Метрик', v: '17' },
                { k: 'Точек лица', v: '68' },
                { k: 'Рейтинг', v: '4.9' },
              ].map((s) => (
                <div key={s.k} className="bg-white px-4 py-4">
                  <dt className="eyebrow">{s.k}</dt>
                  <dd className="mono tnum text-2xl sm:text-3xl mt-1">{s.v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
