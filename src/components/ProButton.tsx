import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { PRO_PRICE_STARS } from '@/config';

const FAIL_TEXT = 'Оплата не прошла. Попробуй ещё раз.';

/**
 * Кнопка подписки Pro. Покупка идёт через Telegram.WebApp.openInvoice,
 * поэтому вне мини-аппа (или в старом клиенте без openInvoice) кнопки нет —
 * вместо неё подсказка.
 */
export function ProButton({ label = 'Открыть всё', className = '' }: { label?: string; className?: string }) {
  const { canBuy, buying, buyPro } = useProfile();
  const [error, setError] = useState<string | null>(null);

  if (!canBuy) {
    return <p className="text-xs text-center text-gray-500">Pro оформляется в Telegram-приложении IMARSEN.</p>;
  }

  const onClick = async () => {
    setError(null);
    const res = await buyPro();
    if (res === 'failed') setError(FAIL_TEXT);
  };

  return (
    <div className={className}>
      <button
        onClick={onClick}
        disabled={buying}
        className="pro-btn w-full rounded-xl px-5 py-3.5 font-semibold text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
      >
        {buying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        <span>{label}</span>
        <span className="opacity-60">·</span>
        <span className="mono">{PRO_PRICE_STARS}⭐ / мес</span>
      </button>
      {error && <p className="text-xs text-center text-red-400 mt-2">{error}</p>}
    </div>
  );
}
