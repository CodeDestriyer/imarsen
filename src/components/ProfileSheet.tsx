import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { X, Ticket, Star, Lock, Gift } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { TIERS } from '@/utils/faceAnalyzer';
import type { RatingRow } from '@/lib/miniapp';
import { PAYWALL_ENABLED } from '@/config';

const pct = (v: number) => Math.round(v * 100) + '%';
/** Ищем по ключу, а для старых записей — по названию (раньше был «CHAD» капсом). */
const shortOf = (key: string | null, label: string | null) =>
  TIERS.find((t) => t.key === key || t.label.toLowerCase() === label?.toLowerCase())?.short ?? label ?? '—';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { status, profile, preview, shareReferral } = useProfile();

  const name =
    [profile?.user.firstName, profile?.user.lastName].filter(Boolean).join(' ') ||
    preview?.name ||
    'Профиль';
  const photo = profile?.user.photoUrl || preview?.photoUrl;
  const username = profile?.user.username;

  // Портал в body: шапка с backdrop-blur создаёт stacking context, внутри
  // которого fixed-оверлей уезжает под лендинг.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-20 bg-black/40 backdrop-blur-sm overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.97, y: -8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: -8, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
            className="relative bg-paper border hairline rounded-lg w-full max-w-md overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Мой профиль"
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b hairline">
              <div className="flex items-center gap-3 min-w-0">
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border hairline shrink-0"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full border hairline flex items-center justify-center font-semibold shrink-0">
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold tracking-tight truncate flex items-center gap-1.5">
                    {name}
                    {profile?.user.isPremium && <Star className="w-3.5 h-3.5 text-accent shrink-0" />}
                  </div>
                  <div className="text-muted text-sm truncate mono">
                    {username ? `@${username}` : 'Telegram'}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-muted hover:text-ink p-1 -m-1" aria-label="Закрыть">
                <X className="w-5 h-5" />
              </button>
            </div>

            {status === 'loading' && !profile && (
              <div className="px-5 py-8 text-center text-muted text-sm">Загружаем профиль…</div>
            )}

            {status === 'error' && !profile && (
              <div className="px-5 py-8 text-center text-muted text-sm">
                Не получилось загрузить профиль. Результаты пока считаются локально — попробуй позже.
              </div>
            )}

            {profile && (
              <>
                <dl className="grid grid-cols-2 gap-px surface m-5 rounded overflow-hidden">
                  <div className="bg-white px-4 py-4">
                    <dt className="eyebrow">Рейтингов</dt>
                    <dd className="mono tnum text-2xl mt-1">{profile.stats.ratings}</dd>
                  </div>
                  <div className="bg-white px-4 py-4">
                    <dt className="eyebrow">Лучший тир</dt>
                    <dd className="mono tnum text-2xl mt-1 flex items-center gap-2">
                      {profile.stats.best ? (
                        shortOf(null, profile.stats.best.tier_label)
                      ) : profile.stats.ratings > 0 ? (
                        <Lock className="w-5 h-5 text-muted" aria-label="Рейт не открыт" />
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                </dl>

                {profile.stats.ticket && (
                  <div className="mx-5 mb-4 flex items-center gap-2.5 rounded border hairline bg-white px-4 py-3 text-sm">
                    <Ticket className="w-4 h-4 text-accent shrink-0" />
                    <span>
                      {profile.stats.ticket.status === 'serving'
                        ? 'Ты сейчас на рейте в эфире 🔴'
                        : `Талон #${profile.stats.ticket.id} — ждёшь вызова в эфире`}
                    </span>
                  </div>
                )}

                {/* Скидка от друга имеет смысл, только пока рейт платный. */}
                {PAYWALL_ENABLED && profile.referral.link && (
                  <div className="mx-5 mb-4 rounded-lg bg-[#0b0b10] text-white p-5">
                    <div className="flex items-center gap-2 font-semibold">
                      <Gift className="w-4 h-4 text-[#f7a1c4]" />
                      <span className="pro-text">Позови друга — −{profile.referral.discount}⭐</span>
                    </div>
                    <p className="mt-2 text-sm text-gray-300 leading-relaxed">
                      Друг заходит в бота по твоей ссылке — тебе скидка {profile.referral.discount}⭐ на открытие
                      рейта. Один друг — одна скидка.
                    </p>
                    <div className="mt-3 flex gap-4 text-xs text-gray-400 mono">
                      <span>Пришло: <span className="text-white">{profile.referral.invited}</span></span>
                      <span>Скидок: <span className="text-white">{profile.referral.credits}</span></span>
                    </div>
                    <button
                      onClick={shareReferral}
                      className="pro-btn mt-4 w-full rounded-xl px-5 py-3 font-semibold text-sm whitespace-nowrap"
                    >
                      Отправить ссылку
                    </button>
                  </div>
                )}

                <ProgressChart rows={profile.history} />

                <div className="px-5 pb-5">
                  <div className="eyebrow mb-2">История</div>
                  {profile.history.length === 0 ? (
                    <p className="text-muted text-sm">
                      Пока пусто. Пройди ИИ-рейтинг — результат сохранится сюда.
                    </p>
                  ) : (
                    <ul className="surface rounded overflow-hidden divide-y hairline">
                      {profile.history.map((r) => (
                        <li key={r.id} className="bg-white px-4 py-2.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            {r.overall === null ? (
                              <div className="text-sm font-medium flex items-center gap-1.5 text-muted">
                                <Lock className="w-3.5 h-3.5" /> Рейт закрыт
                              </div>
                            ) : (
                              <div className="text-sm font-medium truncate">{r.tier_label}</div>
                            )}
                            <div className="text-muted text-xs mono">{fmtDate(r.created_at)}</div>
                          </div>
                          <span className="mono tnum text-lg shrink-0 font-semibold">
                            {r.overall === null ? '···' : shortOf(r.tier_key, r.tier_label)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Прогресс по сканам: одна серия, поэтому без легенды — заголовок её называет.
 * Ось Y — общий балл, полосы фона — границы тиров, чтобы было видно, сколько
 * осталось до следующего.
 */
function ProgressChart({ rows }: { rows: RatingRow[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const pts = rows
    .filter((r): r is RatingRow & { overall: number } => r.overall !== null)
    .slice()
    .reverse(); // сервер отдаёт новые сверху, график идёт слева направо
  if (pts.length < 2) return null;

  const W = 320, H = 120, PAD_X = 10, PAD_TOP = 10, PAD_BOTTOM = 10;
  const vals = pts.map((p) => p.overall);
  const lo = Math.max(0, Math.min(...vals) - 0.06);
  const hi = Math.min(1, Math.max(...vals) + 0.06);
  const x = (i: number) => PAD_X + (i * (W - PAD_X * 2)) / (pts.length - 1);
  const y = (v: number) => PAD_TOP + (1 - (v - lo) / (hi - lo || 1)) * (H - PAD_TOP - PAD_BOTTOM);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.overall).toFixed(1)}`).join('');
  const bounds = TIERS.slice(0, -1).filter((t) => t.max > lo && t.max < hi);
  const first = pts[0].overall;
  const last = pts[pts.length - 1].overall;
  const delta = Math.round((last - first) * 100);
  const h = hover !== null ? pts[hover] : null;

  return (
    <div className="mx-5 mb-4">
      <div className="flex items-baseline justify-between mb-2">
        <div className="eyebrow">Прогресс</div>
        <div className={`mono tnum text-xs ${delta > 0 ? 'text-emerald-700' : 'text-muted'}`}>
          {delta > 0 ? '▲ +' : delta < 0 ? '▼ ' : ''}{delta} пт за {pts.length} сканов
        </div>
      </div>
      <div className="relative surface rounded bg-white">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img"
          aria-label={`Общий балл по сканам: с ${pct(first)} до ${pct(last)}`}
          onMouseLeave={() => setHover(null)}>
          {bounds.map((t) => (
            <g key={t.key}>
              <line x1={0} x2={W} y1={y(t.max)} y2={y(t.max)} stroke="rgba(0,0,0,0.08)" strokeDasharray="3 4" />
              <text x={W - 4} y={y(t.max) - 3} textAnchor="end" fontSize="8" fill="#5b5b5b" fontFamily="'JetBrains Mono', ui-monospace, monospace">
                {TIERS[TIERS.indexOf(t) + 1].short}
              </text>
            </g>
          ))}
          <path d={line} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {pts.map((p, i) => (
            <g key={p.id}>
              {(i === pts.length - 1 || i === hover) && (
                <circle cx={x(i)} cy={y(p.overall)} r={4} fill="var(--accent)" stroke="#fff" strokeWidth={2} />
              )}
              {/* Цель наведения шире точки — по ней легко попасть пальцем. */}
              <rect x={x(i) - (W / pts.length) / 2} y={0} width={W / pts.length} height={H} fill="transparent"
                onMouseEnter={() => setHover(i)} onTouchStart={() => setHover(i)} />
            </g>
          ))}
        </svg>
        {h && hover !== null && (
          <div className="absolute top-1 pointer-events-none bg-ink text-paper text-[11px] mono px-2 py-1 rounded whitespace-nowrap"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${hover > pts.length / 2 ? '-100%' : '0'})` }}>
            {shortOf(h.tier_key, h.tier_label)} · {pct(h.overall)} · {fmtDate(h.created_at)}
          </div>
        )}
      </div>
    </div>
  );
}
