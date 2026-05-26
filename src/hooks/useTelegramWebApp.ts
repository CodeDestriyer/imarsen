import { useEffect } from 'react';

type TgThemeParams = {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
};

type TgWebApp = {
  ready: () => void;
  expand: () => void;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  themeParams: TgThemeParams;
  colorScheme: 'light' | 'dark';
  initData: string;
  initDataUnsafe: {
    user?: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string };
  };
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  enableClosingConfirmation: () => void;
  disableVerticalSwipes?: () => void;
  platform: string;
  version: string;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TgWebApp };
  }
}

export function useTelegramWebApp() {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.setBackgroundColor('#05060a');
      tg.setHeaderColor('#05060a');
      tg.disableVerticalSwipes?.();
      document.documentElement.classList.add('tg-webapp');
    } catch (err) {
      console.warn('[tg] init failed', err);
    }
  }, []);
}

export function getTgUser() {
  return window.Telegram?.WebApp?.initDataUnsafe?.user;
}
