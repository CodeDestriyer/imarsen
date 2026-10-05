import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Metrics } from '@/utils/faceAnalyzer';
import {
  getTgInitData,
  getTgUser,
  getTgWebApp,
  isInTelegram,
  type InvoiceStatus,
} from '@/hooks/useTelegramWebApp';
import {
  createProInvoice,
  miniappConfigured,
  saveRating,
  syncProfile,
  type Profile,
} from '@/lib/miniapp';
import { PAYWALL_TELEGRAM_ONLY } from '@/config';

/** Вебхук бота подтверждает оплату с задержкой — столько раз переспрашиваем. */
const PRO_POLL_TRIES = 6;
const PRO_POLL_MS = 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Status = 'unavailable' | 'loading' | 'ready' | 'error';

type ProfileCtx = {
  status: Status;
  profile: Profile | null;
  /** Имя и аватарка из initDataUnsafe — есть сразу, до ответа бэкенда. */
  preview: { name: string; photoUrl?: string } | null;
  refresh: () => void;
  recordRating: (m: Metrics, tierKey: string, tierLabel: string) => void;
  isPro: boolean;
  /** Закрытые метрики прячем: пейволл действует здесь и Pro не куплен. */
  locked: boolean;
  /** Оплата доступна: мы в Telegram и клиент умеет openInvoice. */
  canBuy: boolean;
  buying: boolean;
  buyPro: () => Promise<InvoiceStatus>;
};

const Ctx = createContext<ProfileCtx>({
  status: 'unavailable',
  profile: null,
  preview: null,
  refresh: () => {},
  recordRating: () => {},
  isPro: false,
  locked: false,
  canBuy: false,
  buying: false,
  buyPro: async () => 'failed',
});

// Считаем один раз: признак Telegram в течение сессии не меняется.
const paywallHere = () => !PAYWALL_TELEGRAM_ONLY || isInTelegram();

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('unavailable');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preview, setPreview] = useState<ProfileCtx['preview']>(null);
  const [buying, setBuying] = useState(false);
  const [paywalled] = useState(paywallHere);
  const inFlight = useRef(false);

  const refresh = useCallback(() => {
    if (!miniappConfigured || !getTgInitData() || inFlight.current) return;
    inFlight.current = true;
    setStatus((s) => (s === 'ready' ? s : 'loading'));
    syncProfile()
      .then((p) => {
        setProfile(p);
        setStatus('ready');
      })
      .catch((err) => {
        console.warn('[profile] sync failed', err);
        setStatus('error');
      })
      .finally(() => {
        inFlight.current = false;
      });
  }, []);

  useEffect(() => {
    const tgUser = getTgUser();
    if (!tgUser) return; // сайт открыт вне Telegram — профиля нет
    setPreview({
      name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ') || 'Профиль',
      photoUrl: tgUser.photo_url,
    });
    if (!miniappConfigured || !getTgInitData()) {
      setStatus('error'); // юзер виден, но сохранять некуда
      return;
    }
    refresh();
  }, [refresh]);

  const recordRating = useCallback<ProfileCtx['recordRating']>((m, tierKey, tierLabel) => {
    if (!miniappConfigured || !getTgInitData()) return;
    saveRating(m, tierKey, tierLabel)
      .then((p) => {
        setProfile(p);
        setStatus('ready');
      })
      .catch((err) => console.warn('[profile] save failed', err));
  }, []);

  const buyPro = useCallback(async (): Promise<InvoiceStatus> => {
    const tg = getTgWebApp();
    if (!tg?.openInvoice || !miniappConfigured || !getTgInitData()) return 'failed';
    setBuying(true);
    try {
      const { link } = await createProInvoice();
      const result = await new Promise<InvoiceStatus>((resolve) => tg.openInvoice!(link, resolve));
      if (result === 'paid') {
        // «paid» от клиента — только повод переспросить сервер: доступ
        // открывает вебхук бота, и он может прийти на секунду-другую позже.
        for (let i = 0; i < PRO_POLL_TRIES; i++) {
          const p = await syncProfile().catch(() => null);
          if (p) {
            setProfile(p);
            setStatus('ready');
            if (p.pro.active) break;
          }
          await sleep(PRO_POLL_MS);
        }
        tg.HapticFeedback?.notificationOccurred('success');
      }
      return result;
    } catch (err) {
      console.warn('[pro] purchase failed', err);
      return 'failed';
    } finally {
      setBuying(false);
    }
  }, []);

  const isPro = Boolean(profile?.pro.active);
  const locked = paywalled && !isPro;
  const canBuy = isInTelegram() && Boolean(getTgWebApp()?.openInvoice) && miniappConfigured;

  const value = useMemo(
    () => ({ status, profile, preview, refresh, recordRating, isPro, locked, canBuy, buying, buyPro }),
    [status, profile, preview, refresh, recordRating, isPro, locked, canBuy, buying, buyPro],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProfile = () => useContext(Ctx);
