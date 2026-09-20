import type { Metrics } from '@/utils/faceAnalyzer';
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

export type RatingRow = {
  id: number;
  overall: number;
  tier_key: string;
  tier_label: string;
  created_at: string;
};

export type Profile = {
  user: ProfileUser;
  stats: {
    ratings: number;
    best: { overall: number; tier_label: string; created_at: string } | null;
    ticket: { id: number; status: string } | null;
  };
  history: RatingRow[];
};

async function call(action: 'sync' | 'save_result', extra: Record<string, unknown> = {}): Promise<Profile> {
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
  return res.json() as Promise<Profile>;
}

export const syncProfile = () => call('sync');

/**
 * Сохраняет результат ИИ-рейтинга. Уходят только числа — снимок остаётся
 * в браузере, как и обещано на лендинге.
 */
export const saveRating = (m: Metrics, tierKey: string, tierLabel: string) =>
  call('save_result', {
    result: {
      overall: m.overall,
      tierKey,
      tierLabel,
      scores: m.scores,
      metrics: {
        symmetry: m.symmetry,
        fwhr: m.fwhr,
        jawAngle: m.jawAngle,
        canthalTilt: m.canthalTilt,
        thirds: m.thirds,
        thirdsBalance: m.thirdsBalance,
        lipRatio: m.lipRatio,
        philtrumRatio: m.philtrumRatio,
        lipChinRatio: m.lipChinRatio,
        esr: m.extra.esr,
        midfaceRatio: m.extra.midfaceRatio,
        mouthNoseRatio: m.extra.mouthNoseRatio,
        bigonialRatio: m.extra.bigonialRatio,
        pflRatio: m.extra.pflRatio,
      },
    },
  });
