import { useState } from 'react';
import { lazy, Suspense } from 'react';
import { useProfile } from '@/hooks/useProfile';

const ProfileSheet = lazy(() =>
  import('@/components/ProfileSheet').then((m) => ({ default: m.ProfileSheet })),
);

/**
 * Иконка профиля в шапке. Рендерится только внутри Telegram —
 * в обычном браузере профиля нет и кнопка не показывается.
 */
export function ProfileButton() {
  const { preview, profile } = useProfile();
  const [open, setOpen] = useState(false);

  if (!preview) return null;

  const photo = profile?.user.photoUrl || preview.photoUrl;
  const initial = preview.name.slice(0, 1).toUpperCase();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Мой профиль"
        className="w-9 h-9 rounded-full border hairline overflow-hidden flex items-center justify-center bg-white hover:border-ink transition-colors shrink-0"
      >
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold">{initial}</span>
        )}
      </button>

      {open && (
        <Suspense fallback={null}>
          <ProfileSheet open={open} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
