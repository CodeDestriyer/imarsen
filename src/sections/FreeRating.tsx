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

export function FreeRating() {
  return (
    <section id="rating" className="py-6 sm:py-8 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px surface rounded-lg overflow-hidden">
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
        </Reveal>
      </div>
    </section>
  );
}
