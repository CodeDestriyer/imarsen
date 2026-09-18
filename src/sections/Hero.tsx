import { Reveal } from '@/components/Reveal';
import { Counter } from '@/components/Counter';

export function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section id="top" className="relative pt-24 pb-14 lg:pt-36 lg:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Running header — journal style */}
        <Reveal variant="fade">
          <div className="flex items-center justify-between border-b hairline pb-3 mb-10 eyebrow">
            <span>imarsen · facial geometry lab</span>
            <span className="hidden sm:inline">vol. 4 — 2026</span>
          </div>
        </Reveal>

        <div className="max-w-3xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 mb-6 eyebrow">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              N = <Counter to={50} suffix="+" /> проведённых анализов
            </div>
          </Reveal>
          <Reveal delay={0.08} variant="blur">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.04]">
              Объективный <span className="serif italic font-normal">ИИ-анализ</span> внешности
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-base sm:text-lg text-muted max-w-2xl leading-relaxed">
              17 геометрических метрик привлекательности, персональная карта улучшений на 30 дней.
              Получи реальные рекомендации, а не пустые комплименты.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <button
                onClick={onStart}
                className="btn-primary px-6 py-3 rounded font-medium text-sm sm:text-base"
              >
                Бесплатный ИИ-рейтинг
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
