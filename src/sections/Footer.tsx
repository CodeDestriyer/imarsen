import { Send } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="max-w-md">
          <a href="#top" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="imarsen" className="w-8 h-8 rounded-lg object-cover border border-white/15" />
            <span className="font-semibold text-white">imarsen</span>
          </a>
          <p className="text-gray-500 text-sm mt-4">
            Объективный ИИ-анализ внешности по геометрическим метрикам. Попробуй бесплатный рейтинг прямо в браузере.
          </p>
        </div>
        <a
          href="https://t.me/+OBtlpNOrmPU1MTFk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded-lg text-sm font-medium self-start"
        >
          <Send className="w-4 h-4" /> Telegram-канал
        </a>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-gray-500">© 2026 imarsen</div>
    </footer>
  );
}
