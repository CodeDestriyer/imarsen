import { ShieldCheck, Zap, ScanFace } from 'lucide-react';
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
    <section id="rating" className="py-16 sm:py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="surface rounded-lg p-6 sm:p-10">
            <div className="section-index mb-2">02 — диагностика</div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Бесплатный <span className="serif italic font-normal">ИИ-рейтинг</span> внешности
            </h2>
            <p className="mt-4 text-muted max-w-2xl leading-relaxed text-sm sm:text-base">
              Автоматический ИИ-тест: наведи камеру или сделай снимок — нейросеть сама
              разберёт черты лица по геометрическим метрикам и выдаст объективную оценку.
              Без людей, без регистрации, бесплатно.
            </p>
            <button
              onClick={onStart}
              className="mt-7 btn-primary px-6 py-3 rounded font-medium text-sm sm:text-base"
            >
              Запустить ИИ-рейтинг
            </button>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-px surface rounded overflow-hidden">
              {points.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="bg-white p-5 border-t-2 border-accent">
                    <div className="icon-bubble mb-3 text-accent"><Icon className="w-5 h-5" /></div>
                    <h3 className="text-ink font-semibold text-sm">{p.title}</h3>
                    <p className="text-muted text-sm mt-1 leading-relaxed">{p.desc}</p>
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
