import { Send } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <a href="#top" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="imarsen" className="w-8 h-8 rounded-lg object-cover border border-white/15" />
            <span className="font-semibold text-white">imarsen</span>
          </a>
          <p className="text-gray-500 text-sm mt-4 max-w-sm">
            Профессиональный ИИ-анализ внешности по 17 метрикам качества. Получите объективную оценку и персональные рекомендации.
          </p>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3 text-sm">Навигация</h5>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#top" className="hover:text-white transition">Главная</a></li>
            <li><a href="#features" className="hover:text-white transition">Новый анализ</a></li>
            <li><a href="#login" className="hover:text-white transition">Мои отчёты</a></li>
            <li><a href="#login" className="hover:text-white transition">Личный кабинет</a></li>
          </ul>
        </div>
        <div>
          <h5 className="text-white font-semibold mb-3 text-sm">Связь</h5>
          <a
            href="https://t.me/+OBtlpNOrmPU1MTFk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm transition"
          >
            <Send className="w-4 h-4" /> Telegram-канал
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-gray-500">© 2026 imarsen</div>
    </footer>
  );
}
