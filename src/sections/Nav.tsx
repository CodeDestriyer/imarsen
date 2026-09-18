export function Nav({ onStart }: { onStart: () => void }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-paper/85 backdrop-blur-md border-b hairline">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="imarsen" className="w-7 h-7 rounded object-cover border hairline" />
            <span className="font-semibold tracking-tight text-ink">imarsen</span>
            <span className="eyebrow hidden sm:inline ml-1">research lab</span>
          </a>

          <button
            onClick={onStart}
            className="btn-primary px-4 py-2 rounded text-sm font-medium"
          >
            Бесплатный ИИ-рейтинг
          </button>
        </div>
      </div>
    </nav>
  );
}
