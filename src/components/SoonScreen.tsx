import { useEffect } from 'react';
import { SOON_FALLBACK, SOON_TELEGRAM_ONLY, SOON_BYPASS_PARAM } from '@/config';
import { isInTelegram } from '@/hooks/useTelegramWebApp';

/**
 * Заглушка поверх заблюренного сайта.
 *
 * Тёмная намеренно: внутри Telegram шапка и фон уже выставлены в #05060a
 * (см. useTelegramWebApp), так что заглушка садится в хром клиента без стыка.
 */
export function SoonScreen() {
  // Пока висит заглушка, страница под ней не должна прокручиваться.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      role="status"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-6 text-center
                 bg-[#05060a]/85 backdrop-blur-2xl"
    >
      <div className="telemetry mb-6 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
        imarsen / обновление
      </div>

      <h1 className="font-display font-semibold text-white tracking-tight leading-[0.85]
                     text-[clamp(4.5rem,28vw,11rem)]">
        Soon
      </h1>

      <div className="mt-7 h-px w-16 bg-accent" />

      <p className="mt-7 max-w-[17rem] text-sm leading-relaxed text-gray-400">
        Дорабатываем анализ. Загляни чуть позже — вернёмся с обновлённой версией.
      </p>
    </div>
  );
}

const BASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
/** Дольше ждать флаг не будем — дальше решает SOON_FALLBACK. */
const FLAG_TIMEOUT_MS = 3000;

/** Касается ли заглушка этого посетителя вообще — без похода в базу. */
export function soonEligible(): boolean {
  // Запасной ключ, чтобы проверять сайт, пока заглушка висит для всех остальных.
  if (new URLSearchParams(window.location.search).has(SOON_BYPASS_PARAM)) return false;
  return SOON_TELEGRAM_ONLY ? isInTelegram() : true;
}

/** Флаг из app_settings (переключается командой бота /soon on|off). */
export async function fetchSoonFlag(): Promise<boolean> {
  if (!BASE_URL || !ANON_KEY) return SOON_FALLBACK;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FLAG_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/rest/v1/app_settings?key=eq.soon&select=value`, {
      headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}` },
      signal: ctrl.signal,
    });
    if (!res.ok) return SOON_FALLBACK;
    const rows = (await res.json()) as Array<{ value: unknown }>;
    return rows.length ? rows[0].value === true : SOON_FALLBACK;
  } catch {
    return SOON_FALLBACK;
  } finally {
    clearTimeout(timer);
  }
}
