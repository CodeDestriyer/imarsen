import { ProfileButton } from '@/components/ProfileButton';

export function Nav({ onStart }: { onStart: () => void }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-paper/85 backdrop-blur-md border-b hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <a
            href="#top"
            className="font-display font-extrabold tracking-tight leading-none text-ink text-[30px] sm:text-[34px] hover:opacity-70 transition-opacity"
          >
            imarsen
          </a>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onStart}
              className="btn-primary px-5 py-2.5 rounded-md text-sm sm:text-base font-medium"
            >
              ИИ-рейтинг
            </button>
            <ProfileButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
