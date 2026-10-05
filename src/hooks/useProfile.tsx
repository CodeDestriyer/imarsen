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
  createUnlockInvoice,
  miniappConfigured,
  saveRating,
  syncProfile,
  type Profile,
} from '@/lib/miniapp';
import { PAYWALL_TELEGRAM_ONLY } from '@/config';

/** Вебхук бота подтверждает оплату с задержкой — столько раз переспрашиваем. */
const UNLOCK_POLL_TRIES = 6;
const UNLOCK_POLL_MS = 1500;
const SHARE_TEXT = 'Узнай свой тир по лицу — ИИ-рейт за пару секунд 👀';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Status = 'unavailable' | 'loading' | 'ready' | 'error';

type ProfileCtx = {
  status: Status;
  profile: Profile | null;
  /** Имя и аватарка из initDataUnsafe — есть сразу, до ответа бэкенда. */
  preview: { name: string; photoUrl?: string } | null;
  refresh: () => void;
  recordRating: (m: Metrics, tierKey: string, tierLabel: string) => void;
  /** Закрытые метрики текущего скана прячем: пейволл действует здесь и скан не открыт. */
  locked: boolean;
  /** Оплата доступна: мы в Telegram, клиент умеет openInvoice и скан сохранён. */
  canBuy: boolean;
  buying: boolean;
  /** Открыть текущий скан за звёзды. */
  buyUnlock: () => Promise<InvoiceStatus>;
  /** Поделиться реферальной ссылкой через нативный шаринг Telegram. */
  shareReferral: () => void;
};

const Ctx = createContext<ProfileCtx>({
  status: 'unavailable',
  profile: null,
  preview: null,
  refresh: () => {},
  recordRating: () => {},
  locked: false,
  canBuy: false,
  buying: false,
  buyUnlock: async () => 'failed',
  shareReferral: () => {},
});

// Считаем один раз: признак Telegram в течение сессии не меняется.
const paywallHere = () => !PAYWALL_TELEGRAM_ONLY || isInTelegram();

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('unavailable');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preview, setPreview] = useState<ProfileCtx['preview']>(null);
  const [buying, setBuying] = useState(false);
  const [paywalled] = useState(paywallHere);
  /** id текущего скана в базе: открытие оплачивается именно за него. */
  const [currentId, setCurrentId] = useState<number | null>(null);
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
    setCurrentId(null); // новый скан закрыт, пока не сохранится и не оплатится
    if (!miniappConfigured || !getTgInitData()) return;
    saveRating(m, tierKey, tierLabel)
      .then(({ savedId, ...p }) => {
        setProfile(p);
        setStatus('ready');
        setCurrentId(savedId);
      })
      .catch((err) => console.warn('[profile] save failed', err));
  }, []);

  const buyUnlock = useCallback(async (): Promise<InvoiceStatus> => {
    const tg = getTgWebApp();
    if (!tg?.openInvoice || currentId === null) return 'failed';
    setBuying(true);
    try {
      const { link } = await createUnlockInvoice(currentId);
      const result = await new Promise<InvoiceStatus>((resolve) => tg.openInvoice!(link, resolve));
      if (result === 'paid') {
        // «paid» от клиента — только повод переспросить сервер: скан
        // открывает вебхук бота, и он может прийти на секунду-другую позже.
        for (let i = 0; i < UNLOCK_POLL_TRIES; i++) {
          const p = await syncProfile().catch(() => null);
          if (p) {
            setProfile(p);
            setStatus('ready');
            if (p.history.some((r) => r.id === currentId && r.unlocked)) break;
          }
          await sleep(UNLOCK_POLL_MS);
        }
        tg.HapticFeedback?.notificationOccurred('success');
      }
      return result;
    } catch (err) {
      console.warn('[unlock] purchase failed', err);
      return 'failed';
    } finally {
      setBuying(false);
    }
  }, [currentId]);

  const shareReferral = useCallback(() => {
    const link = profile?.referral.link;
    if (!link) return;
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(SHARE_TEXT)}`;
    const tg = getTgWebApp();
    if (tg?.openTelegramLink) tg.openTelegramLink(url);
    else window.open(url, '_blank', 'noopener');
  }, [profile?.referral.link]);

  const currentUnlocked = Boolean(
    currentId !== null && profile?.history.some((r) => r.id === currentId && r.unlocked),
  );
  const locked = paywalled && !currentUnlocked;
  const canBuy =
    isInTelegram() && Boolean(getTgWebApp()?.openInvoice) && miniappConfigured && currentId !== null;

  const value = useMemo(
    () => ({ status, profile, preview, refresh, recordRating, locked, canBuy, buying, buyUnlock, shareReferral }),
    [status, profile, preview, refresh, recordRating, locked, canBuy, buying, buyUnlock, shareReferral],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProfile = () => useContext(Ctx);
