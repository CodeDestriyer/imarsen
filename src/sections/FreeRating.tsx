import { Sparkles, ShieldCheck, Zap, ScanFace } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

const points = [
  {
    icon: ScanFace,
    title: '4 ключевые метрики',
    desc: 'Симметрия, наклон, FWHR и линия челюсти — за пару секунд.',
  },
  {
    icon: Zap,
    title: 'Мгновенно в браузере',
    desc: 'Работает прямо на странице, без установки и регистрации.',
  },
  {
    icon: ShieldCheck,
    title: 'Фото не покидает устройство',
    desc: 'Анализ идёт локально — мы никуда не отправляем и не храним снимок.',
  },
];

export function FreeRating({ onStart }: { onStart: () => void }) {
  return (
    <section id="rating" className="py-20 sm:py-28 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="glass-strong border border-white/15 rounded-3xl p-8 sm:p-12 text-center">
            <div className="telemetry mb-3">AI — automated test</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Бесплатный ИИ-рейтинг внешности
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Автоматический ИИ-тест: наведи камеру или сделай снимок — нейросеть сама
              разберёт черты лица по геометрическим метрикам и выдаст объективную оценку.
              Без людей, без регистрации, бесплатно.
            </p>
            <button
              onClick={onStart}
              className="mt-8 btn-primary px-6 py-3 rounded-xl font-medium inline-flex items-center gap-2 text-base"
            >
              <Sparkles className="w-5 h-5" /> Запустить ИИ-рейтинг
            </button>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
              {points.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="glass rounded-2xl p-5 border border-white/10">
                    <div className="icon-bubble mb-3"><Icon /></div>
                    <h3 className="text-white font-semibold text-sm">{p.title}</h3>
                    <p className="text-gray-400 text-sm mt-1 leading-relaxed">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
