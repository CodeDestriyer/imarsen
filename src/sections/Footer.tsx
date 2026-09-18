import { Send, PlayCircle, Music2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 border-t hairline mt-2">
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

        <div className="flex flex-wrap items-center gap-2.5 self-start">
          <a
            href="https://t.me/+OBtlpNOrmPU1MTFk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white bg-[#229ED9] hover:brightness-105 transition"
          >
            <Send className="w-4 h-4" /> Telegram
          </a>
          <a
            href="https://www.tiktok.com/@imarsennnnn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white bg-black hover:brightness-125 transition"
          >
            <Music2 className="w-4 h-4" /> TikTok
          </a>
          <a
            href="https://www.youtube.com/@imarsennnn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium text-white bg-[#FF0000] hover:brightness-105 transition"
          >
            <PlayCircle className="w-4 h-4" /> YouTube
          </a>
        </div>
      </div>
      <div className="border-t hairline py-5 text-center eyebrow">
        © 2026 <span className="text-accent font-bold">Lookism solutions</span>
      </div>
    </footer>
  );
}
