import { Send } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 border-t hairline mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="max-w-md">
          <a href="#top" className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="imarsen" className="w-7 h-7 rounded object-cover border hairline" />
            <span className="font-semibold text-ink">imarsen</span>
          </a>
          <p className="text-muted text-sm mt-4 leading-relaxed">
            Научный ИИ-анализ внешности по геометрическим метрикам. Попробуй бесплатный рейтинг прямо в браузере.
          </p>
        </div>
        <a
          href="https://t.me/+OBtlpNOrmPU1MTFk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 rounded text-sm font-medium self-start"
        >
          <Send className="w-4 h-4" /> Telegram-канал
        </a>
      </div>
      <div className="border-t hairline py-5 text-center eyebrow">© 2026 imarsen</div>
    </footer>
  );
}
