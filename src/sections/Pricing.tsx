import { Check, Gift, Send } from 'lucide-react';
import clsx from 'clsx';
import { Reveal } from '@/components/Reveal';
import { Tilt } from '@/components/Tilt';
import { plans, type Plan } from '@/data/content';

function PriceCard({ plan, delay }: { plan: Plan; delay: number }) {
  const accent = plan.highlight ? 'text-purple-300' : 'text-indigo-300';
  return (
    <Reveal delay={delay}>
      <Tilt
        className={clsx(
          'relative p-8 border flex flex-col h-full',
          plan.highlight
            ? 'glass-strong border-white/20 price-card-highlight z-10 rounded-2xl'
            : 'glass border-white/10 rounded-2xl cut-corner',
        )}
      >
        {plan.highlight && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2"><span className="badge-popular">Популярный</span></div>
        )}
        <div className="mb-6">
          <div className="telemetry mb-2">PLAN_0{plan.highlight ? 2 : delay > 0.05 ? 3 : 1}</div>
          <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
          <p className="text-sm text-gray-400 mt-1">{plan.tagline}</p>
        </div>
        <div className="mb-6 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white mono">{plan.price}</span>
          <span className="text-gray-500 text-sm">{plan.period}</span>
        </div>
        <ul className="w-full space-y-3 text-sm text-gray-300 flex-1">
          {plan.features.map((f) => (
            <li key={f} className="flex gap-2">
              <Check className={clsx('w-4 h-4 mt-0.5', accent)} />{f}
            </li>
          ))}
        </ul>
        <div className="mt-6 text-xs text-gray-500 flex items-center gap-1"><Gift className="w-3.5 h-3.5" /> Есть промокод?</div>
        <a
          href="#buy"
          className={clsx(
            'mt-4 px-4 py-2.5 rounded-lg text-center text-sm font-medium',
            plan.highlight ? 'btn-primary' : 'btn-ghost',
          )}
        >
          {plan.cta}
        </a>
      </Tilt>
    </Reveal>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <div className="telemetry mb-3">03 — pricing</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Выбери формат</h2>
            <p className="mt-4 text-gray-400">Разовый анализ для знакомства или подписка для отслеживания прогресса. Пригласи друга — получи бесплатный анализ в подарок.</p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
          {plans.map((p, i) => (
            <PriceCard key={p.name} plan={p} delay={i * 0.1} />
          ))}
        </div>
        <Reveal>
          <div id="contact" className="mt-16 glass rounded-2xl p-8 border border-white/10 max-w-3xl mx-auto text-center">
            <div className="icon-bubble mx-auto mb-4"><Send /></div>
            <h3 className="text-xl font-semibold text-white">Связь с нами</h3>
            <p className="text-gray-400 mt-2 text-sm max-w-xl mx-auto">Все новости, обновления и обратная связь — в нашем Telegram-канале.</p>
            <a
              href="https://t.me/+OBtlpNOrmPU1MTFk"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-lg text-sm font-medium"
            >
              <Send className="w-4 h-4" /> Перейти в Telegram
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
