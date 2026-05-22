import { ArrowRight, Play, Star } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { Counter } from '@/components/Counter';

export function Hero() {
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
              <span className="telemetry">IMR-<Counter to={200} suffix="+" /> анализов</span>
            </div>
          </Reveal>
          <Reveal delay={0.08} variant="blur">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-gradient leading-[1.05]">
              Объективный AI-анализ внешности
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto md:mx-0 leading-relaxed">
              17 метрик качества, персональный роадмап улучшений на 30 дней и сравнение прогресса «до/после». Получите реальные рекомендации, а не пустые комплименты.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4">
              <a href="#pricing" className="btn-primary px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2">
                Начать анализ за 199₽ <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#features" className="btn-ghost px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2">
                <Play className="w-4 h-4" /> Смотреть пример отчёта
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.32}>
            <div className="mt-16 flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-500 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-ink bg-gradient-to-br from-indigo-500 to-purple-500" />
                  ))}
                </div>
                <span>Реферальная программа</span>
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
    </section>
  );
}
