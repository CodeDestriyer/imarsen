import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Metrics } from '@/utils/faceAnalyzer';
import { getTgInitData, getTgUser } from '@/hooks/useTelegramWebApp';
import { miniappConfigured, saveRating, syncProfile, type Profile } from '@/lib/miniapp';

type Status = 'unavailable' | 'loading' | 'ready' | 'error';

type ProfileCtx = {
  status: Status;
  profile: Profile | null;
  /** Имя и аватарка из initDataUnsafe — есть сразу, до ответа бэкенда. */
  preview: { name: string; photoUrl?: string } | null;
  refresh: () => void;
  recordRating: (m: Metrics, tierKey: string, tierLabel: string) => void;
};

const Ctx = createContext<ProfileCtx>({
  status: 'unavailable',
  profile: null,
  preview: null,
  refresh: () => {},
  recordRating: () => {},
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('unavailable');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preview, setPreview] = useState<ProfileCtx['preview']>(null);
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

  const value = useMemo(
    () => ({ status, profile, preview, refresh, recordRating }),
    [status, profile, preview, refresh, recordRating],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useProfile = () => useContext(Ctx);
