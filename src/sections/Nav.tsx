import { Sparkles } from 'lucide-react';

export function Nav({ onStart }: { onStart: () => void }) {
  return (
    <nav className="fixed top-0 w-full z-50 bg-ink/70 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#top" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="imarsen" className="w-8 h-8 rounded-lg object-cover border border-white/15" />
            <span className="font-semibold tracking-tight text-white">imarsen</span>
          </a>

          <button
            onClick={onStart}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" /> Бесплатный ИИ-рейтинг
          </button>
        </div>
      </div>
    </nav>
  );
}
