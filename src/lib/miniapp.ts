import { METRIC_KEYS, type Metrics } from '@/utils/faceAnalyzer';
import { getTgInitData } from '@/hooks/useTelegramWebApp';

const BASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Бэкенд настроен? Без переменных окружения профиль просто выключен. */
export const miniappConfigured = Boolean(BASE_URL && ANON_KEY);

export type ProfileUser = {
  tgUserId: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  isPremium: boolean;
  createdAt: string;
};

/** У закрытого скана сервер отдаёт только дату — без балла и тира. */
export type RatingRow = {
  id: number;
  overall: number | null;
  tier_key: string | null;
  tier_label: string | null;
  created_at: string;
  unlocked: boolean;
};

export type Profile = {
  user: ProfileUser;
  unlock: { price: number; nextPrice: number };
  referral: { link: string | null; invited: number; credits: number; discount: number };
  stats: {
    ratings: number;
    best: { overall: number; tier_label: string; created_at: string } | null;
    ticket: { id: number; status: string } | null;
  };
  history: RatingRow[];
};

async function call<T = Profile>(
  action: 'sync' | 'save_result' | 'unlock_invoice',
  extra: Record<string, unknown> = {},
): Promise<T> {
  const initData = getTgInitData();
  if (!miniappConfigured || !initData) throw new Error('miniapp unavailable');

  const res = await fetch(`${BASE_URL}/functions/v1/miniapp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: ANON_KEY as string,
      authorization: `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ action, initData, ...extra }),
  });

  if (!res.ok) throw new Error(`miniapp ${action} failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export const syncProfile = () => call('sync');

/** Ссылка на оплату открытия скана для Telegram.WebApp.openInvoice. */
export const createUnlockInvoice = (resultId: number) =>
  call<{ link: string }>('unlock_invoice', { resultId });

/**
 * Сохраняет результат ИИ-рейтинга. Уходят только числа — снимок остаётся
 * в браузере, как и обещано на лендинге.
 */
export const saveRating = (m: Metrics, tierKey: string, tierLabel: string) => {
  const metrics: Record<string, number> = {};
  const severity: Record<string, number> = {};
  for (const k of METRIC_KEYS) {
    metrics[k] = m.results[k].value;
    severity[k] = m.results[k].severity;
  }
  const tilt = m.results.tilt.sides;
  if (tilt) {
    metrics.tiltLeft = tilt.left;
    metrics.tiltRight = tilt.right;
  }
  return call<Profile & { savedId: number }>('save_result', {
    result: {
      overall: m.overall,
      tierKey,
      tierLabel,
      // scale: 2 — шкала степеней и очков. Записи без него посчитаны старой
      // формулой, и их overall с новыми напрямую не сравнить.
      scores: { scale: 2, points: m.points, maxPoints: m.maxPoints, counts: m.counts, severity },
      metrics,
    },
  });
};
