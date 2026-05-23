import { lazy, Suspense, useState } from 'react';
import { ArrowRight, Play, Star, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';
import { Counter } from '@/components/Counter';

const TryDemo = lazy(() => import('@/components/TryDemo').then((m) => ({ default: m.TryDemo })));

export function Hero() {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <section id="top" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      <div className="hero-portrait">
        <img src="/hero-model.jpg" alt="" loading="eager" />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center md:text-left max-w-4xl md:max-w-2xl mx-auto md:mx-0">
          <Reveal>
            <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-6 text-xs text-gray-300 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <Counter to={50} suffix="+" /> анализов уже проведено
            </div>
          </Reveal>
          <Reveal delay={0.08} variant="blur">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gradient leading-[1.05]">
              Объективный ИИ-анализ внешности
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto md:mx-0 leading-relaxed">
              17 геометрических метрик привлекательности, персональная карта улучшений на 30 дней. Получи реальные рекомендации, а не пустые комплименты.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4">
              <button
                onClick={() => setDemoOpen(true)}
                className="btn-primary px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Попробовать бесплатно
              </button>
              <a href="#pricing" className="btn-ghost px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2">
                Тарифы <ArrowRight className="w-4 h-4" />
              </a>
              <Link to="/report/demo" className="btn-ghost px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2">
                <Play className="w-4 h-4" /> Пример отчёта
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="mt-16 flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-500 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img
                      key={i}
                      src={`/avatars/ava${i}.jpg`}
                      alt=""
                      className="w-8 h-8 rounded-full border-2 border-ink object-cover"
                    />
                  ))}
                </div>
                <span>Довольные клиенты</span>
              </div>
              <div className="h-4 w-px bg-gray-800 hidden sm:block" />
              <div className="rating-pill flex items-center gap-2 cursor-default">
                <div className="flex text-yellow-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400" />
                  ))}
                </div>
                <span className="mono">4.9</span>
                <span>рейтинг</span>
                <span className="rating-tooltip">★★★★★ от @kirill_m · 3 мин назад</span>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {demoOpen && (
        <Suspense fallback={null}>
          <TryDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
        </Suspense>
      )}
    </section>
  );
}
