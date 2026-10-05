import { useState } from 'react';
import { Gift, Loader2, Sparkles } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { isInTelegram } from '@/hooks/useTelegramWebApp';

const FAIL_TEXT = 'Оплата не прошла. Попробуй ещё раз.';

/**
 * Кнопка «открыть рейт» за звёзды и под ней — приглашение друга со скидкой.
 * Цены приходят из профиля (их задаёт функция miniapp), здесь только показ.
 */
export function UnlockButton() {
  const { canBuy, buying, buyUnlock, profile, shareReferral } = useProfile();
  const [error, setError] = useState<string | null>(null);

  if (!isInTelegram()) {
    return <p className="text-xs text-center text-gray-500">Открыть рейт можно в Telegram-приложении IMARSEN.</p>;
  }
  // Скан ещё сохраняется: без его id счёт не выписать.
  if (!canBuy || !profile) {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 py-3">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Готовим оплату…
      </div>
    );
  }

  const { price, nextPrice } = profile.unlock;
  const discounted = nextPrice < price;
  const ref = profile.referral;

  const onClick = async () => {
    setError(null);
    const res = await buyUnlock();
    if (res === 'failed') setError(FAIL_TEXT);
  };

  return (
    <div>
      <button
        onClick={onClick}
        disabled={buying}
        className="pro-btn w-full rounded-xl px-5 py-3.5 font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
      >
        {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        <span>Открыть рейт</span>
        <span className="opacity-60">·</span>
        {discounted && <span className="mono line-through opacity-50">{price}⭐</span>}
        <span className="mono">{nextPrice}⭐</span>
      </button>
      {error && <p className="text-xs text-center text-red-400 mt-2">{error}</p>}

      {ref.link && (
        <button
          onClick={shareReferral}
          className="mt-2 w-full rounded-xl border border-white/15 px-4 py-2.5 text-xs text-gray-300 inline-flex items-center justify-center gap-2 hover:border-white/30"
        >
          <Gift className="w-3.5 h-3.5" />
          {discounted
            ? `Скидка применена · ещё друг −${ref.discount}⭐`
            : `Позови друга — скидка ${ref.discount}⭐`}
        </button>
      )}
    </div>
  );
}
