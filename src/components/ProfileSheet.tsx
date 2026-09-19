import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ShieldCheck, Ticket, Star } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const pct = (v: number) => Math.round(v * 100) + '%';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { status, profile, preview } = useProfile();

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
                    <dt className="eyebrow">Лучший</dt>
                    <dd className="mono tnum text-2xl mt-1">
                      {profile.stats.best ? pct(profile.stats.best.overall) : '—'}
                    </dd>
                  </div>
                </dl>

                {profile.stats.best && (
                  <div className="px-5 -mt-1 pb-4 text-sm text-muted">
                    Твой тир: <span className="text-ink font-semibold">{profile.stats.best.tier_label}</span>
                  </div>
                )}

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
                            <div className="text-sm font-medium truncate">{r.tier_label}</div>
                            <div className="text-muted text-xs mono">{fmtDate(r.created_at)}</div>
                          </div>
                          <span className="mono tnum text-lg shrink-0">{pct(r.overall)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="px-5 py-3 border-t hairline flex items-start gap-2 text-xs text-muted leading-relaxed">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-px" />
                  <span>Сохраняются только цифры метрик. Фото остаётся на твоём устройстве.</span>
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
