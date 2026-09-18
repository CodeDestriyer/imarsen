import { Reveal } from '@/components/Reveal';

/**
 * Карусель «исследованных образцов».
 * Фото — плейсхолдеры из /public (замени на реальные снимки людей/знаменитостей:
 * положи файлы в /public/people/ и поменяй поле `img`; поле `name` — подпись под фото).
 */
type Subject = {
  id: string;
  name: string;
  img: string;
  score: number; // общий балл 0..10
  symmetry: number; // %
  fwhr: number; // %
};

const subjects: Subject[] = [
  { id: 'C-014', name: 'Образец C-014', img: '/hero-model.jpg', score: 8.7, symmetry: 92, fwhr: 78 },
  { id: 'C-021', name: 'Образец C-021', img: '/example.jpg', score: 7.9, symmetry: 84, fwhr: 71 },
  { id: 'C-033', name: 'Образец C-033', img: '/avatars/ava1.jpg', score: 8.2, symmetry: 88, fwhr: 74 },
  { id: 'C-045', name: 'Образец C-045', img: '/avatars/ava2.jpg', score: 7.4, symmetry: 80, fwhr: 69 },
  { id: 'C-052', name: 'Образец C-052', img: '/avatars/ava3.jpg', score: 8.5, symmetry: 90, fwhr: 76 },
  { id: 'C-061', name: 'Образец C-061', img: '/avatars/ava4.jpg', score: 7.7, symmetry: 83, fwhr: 72 },
];

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">{label}</span>
        <span className="mono tnum text-xs text-ink">{value}%</span>
      </div>
      <div className="metric-bar">
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function PeopleCarousel({ onStart }: { onStart: () => void }) {
  return (
    <section id="cases" className="py-16 sm:py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex items-end justify-between border-b hairline pb-4 mb-8">
            <div>
              <div className="section-index mb-2">01 — dataset</div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Разбор реальных <span className="serif italic font-normal">образцов</span>
              </h2>
              <p className="text-muted text-sm mt-2 max-w-xl leading-relaxed">
                Каждое лицо прогнано через те же 17 геометрических метрик. Листай, чтобы
                посмотреть, как модель раскладывает симметрию, FWHR и линию челюсти.
              </p>
            </div>
            <span className="eyebrow hidden sm:block">swipe →</span>
          </div>
        </Reveal>

        <Reveal delay={0.08} variant="fade">
          <div className="people-track">
            {subjects.map((s) => (
              <article key={s.id} className="people-card">
                <div className="people-photo">
                  <img src={s.img} alt={s.name} loading="lazy" />
                  <span className="people-tag">CASE {s.id}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-semibold text-sm text-ink">{s.name}</h3>
                    <span className="mono tnum text-lg text-accent">{s.score.toFixed(1)}</span>
                  </div>
                  <Metric label="Симметрия" value={s.symmetry} />
                  <Metric label="FWHR" value={s.fwhr} />
                </div>
              </article>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button onClick={onStart} className="btn-primary px-6 py-3 rounded font-medium text-sm">
              Проверить своё лицо
            </button>
            <span className="eyebrow">результат за пару секунд</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
