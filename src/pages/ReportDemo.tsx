import { Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Star, Lock } from 'lucide-react';
import { Reveal } from '@/components/Reveal';
import { reportDemo } from '@/data/report-demo';
import { plans } from '@/data/content';
import clsx from 'clsx';

function ScoreCircle({ value, max = 10, label, accent = false }: { value: number; max?: number; label: string; accent?: boolean }) {
  const pct = (value / max) * 100;
  const r = 54;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r={r} fill="none"
            stroke={accent ? 'url(#grad-strong)' : 'url(#grad-soft)'}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct / 100)}
          />
          <defs>
            <linearGradient id="grad-soft" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="grad-strong" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#c026d3" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white mono">{value.toFixed(1)}</span>
          <span className="text-xs text-gray-500 mono">/{max}</span>
        </div>
      </div>
      <span className="mt-3 text-xs telemetry">{label}</span>
    </div>
  );
}

function MetricBar({ m }: { m: typeof reportDemo.metrics[number] }) {
  const pct = (m.score / 10) * 100;
  return (
    <div className="glass rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium">{m.name}</span>
          {m.flag === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
          {m.flag === 'star' && <Star className="w-3.5 h-3.5 text-purple-300 fill-purple-300" />}
        </div>
        <span className="mono text-sm text-white">{m.score.toFixed(1)}<span className="text-gray-500">/10</span></span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: m.flag === 'warning'
              ? 'linear-gradient(90deg, #f59e0b, #d97706)'
              : 'linear-gradient(90deg, #818cf8, #a855f7)',
          }}
        />
      </div>
    </div>
  );
}

export default function ReportDemo() {
  const r = reportDemo;
  return (
    <div className="min-h-screen bg-ink text-gray-200 relative overflow-x-hidden">
      <div className="bg-aurora" />
      <div className="grain" aria-hidden />

      <nav className="fixed top-0 w-full z-50 glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            <span>На главную</span>
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white">i</div>
            <span className="font-semibold tracking-tight text-white">imarsen</span>
          </Link>
          <Link to="/#pricing" className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Заказать</Link>
        </div>
      </nav>

      <main className="relative z-10 pt-28 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <Reveal>
          <div className="text-center mb-12">
            <div className="telemetry mb-3">REPORT / DEMO</div>
            <h1 className="text-3xl sm:text-5xl font-bold text-gradient leading-[1.1]">Пример полного отчёта</h1>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
              Полный разбор внешности по 17 метрикам с персональным планом улучшений на 30 дней.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 glass rounded-full px-3 py-1 border border-white/10 text-xs text-purple-300 mono">
              DEMO_VERSION
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none" />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <Lock className="w-8 h-8 text-gray-600" />
                </div>
                <span className="text-sm text-white font-medium">Ваше фото</span>
                <span className="telemetry mt-1">доступно после оплаты</span>
              </div>
            </div>
            <div className="glass rounded-2xl border border-white/10 p-8 flex flex-col items-center justify-center">
              <span className="telemetry mb-2">Объективная оценка</span>
              <ScoreCircle value={r.currentScore} label={r.category} />
            </div>
            <div className="glass-strong rounded-2xl border border-purple-400/30 p-8 flex flex-col items-center justify-center relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="badge-popular">Потенциал</span></div>
              <span className="telemetry mb-2">После роадмапа</span>
              <ScoreCircle value={r.potentialScore} label="GOAL" accent />
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="glass rounded-2xl border border-white/10 p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="icon-bubble shrink-0">
                <span className="mono text-sm">Σ</span>
              </div>
              <div className="flex-1">
                <div className="telemetry mb-2">Резюме</div>
                <p className="text-gray-300 leading-relaxed">{r.summary}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-xs">
                  <span className="text-gray-500">Категория:</span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-400/30 text-purple-300 mono">{r.category}</span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <div className="telemetry mb-2">02 — metrics</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">17 детальных метрик</h2>
              </div>
              <div className="hidden md:flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-gray-500"><AlertTriangle className="w-3 h-3 text-amber-400" /> слабая зона</span>
                <span className="flex items-center gap-1.5 text-gray-500"><Star className="w-3 h-3 text-purple-300 fill-purple-300" /> сильная зона</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {r.metrics.map((m) => <MetricBar key={m.name} m={m} />)}
            </div>

            <div className="mt-6 glass-strong rounded-2xl border border-purple-400/30 p-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="telemetry mb-1">Акцентированный отчёт · только в CHAD</div>
                  <div className="text-sm text-gray-300 mb-3">Слабые зоны для проработки:</div>
                  <div className="flex flex-wrap gap-2">
                    {r.weakZones.map((z) => (
                      <span key={z} className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-sm flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />{z}
                      </span>
                    ))}
                  </div>
                </div>
                <Link to="/#pricing" className="btn-primary px-5 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap">
                  Открыть в CHAD
                </Link>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="mb-12">
            <div className="mb-6">
              <div className="telemetry mb-2">03 — roadmap</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Персональный роадмап на 30 дней</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {r.roadmap.map((p, i) => (
                <div key={p.week} className="relative glass rounded-2xl border border-white/10 p-5 overflow-hidden">
                  <div className={clsx(
                    'absolute top-0 left-0 w-full h-1',
                    i === 0 && 'bg-gradient-to-r from-indigo-500 to-purple-500',
                    i === 1 && 'bg-gradient-to-r from-purple-500 to-fuchsia-500',
                    i === 2 && 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
                    i === 3 && 'bg-gradient-to-r from-pink-500 to-rose-400',
                  )} />
                  <div className="telemetry mb-2">Неделя {p.week}</div>
                  <h3 className="text-lg font-semibold text-white mb-4">{p.title}</h3>
                  <ul className="space-y-2 text-sm text-gray-300">
                    {p.actions.map((a) => (
                      <li key={a} className="flex gap-2">
                        <span className="text-purple-400">→</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="glass-strong rounded-2xl border border-white/15 p-8 text-center mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/15 to-fuchsia-500/10 pointer-events-none" />
            <div className="relative z-10">
              <div className="telemetry mb-3">Итоговая оценка</div>
              <div className="text-5xl font-bold text-gradient mono">{r.currentScore.toFixed(1)} → {r.potentialScore.toFixed(1)}</div>
              <p className="text-gray-400 mt-3 max-w-md mx-auto text-sm">
                Это твой потенциал за 30 дней работы по роадмапу.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/#pricing" className="btn-primary px-6 py-3 rounded-xl font-medium">Получить свой отчёт за 199₽</Link>
                <Link to="/#pricing" className="btn-ghost px-6 py-3 rounded-xl font-medium">Сравнить тарифы</Link>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div>
            <div className="text-center mb-8">
              <div className="telemetry mb-2">04 — plans</div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Что включено в каждый тариф</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.name}
                  className={clsx(
                    'relative rounded-2xl p-6 border flex flex-col',
                    p.highlight ? 'glass-strong border-purple-400/30' : 'glass border-white/10',
                  )}
                >
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2"><span className="badge-popular">Популярный</span></div>
                  )}
                  <h3 className="text-lg font-semibold text-white">{p.name}</h3>
                  <div className="mt-1 mb-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-white mono">{p.price}</span>
                    <span className="text-gray-500 text-xs">{p.period}</span>
                  </div>
                  <ul className="space-y-2 text-sm text-gray-300 flex-1">
                    {p.features.slice(0, 6).map((f) => (
                      <li key={f} className="flex gap-2"><span className="text-purple-400">✓</span>{f}</li>
                    ))}
                  </ul>
                  <Link
                    to="/#pricing"
                    className={clsx(
                      'mt-5 px-4 py-2.5 rounded-lg text-center text-sm font-medium',
                      p.highlight ? 'btn-primary' : 'btn-ghost',
                    )}
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

      </main>
    </div>
  );
}
