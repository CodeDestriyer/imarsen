import { useState } from 'react';
import { Menu } from 'lucide-react';

const links = [
  { href: '#top', label: 'Главная' },
  { href: '#features', label: 'Анализ' },
  { href: '#pricing', label: 'Тарифы' },
  { href: '#faq', label: 'FAQ' },
  { href: '#referral', label: 'Рефералка' },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-ink/95 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <a href="#top" className="flex items-center gap-2">
            <img src="/logo.jpg" alt="imarsen" className="w-8 h-8 rounded-lg object-cover border border-white/15" />
            <span className="font-semibold tracking-tight text-white">imarsen</span>
          </a>

          <div className="hidden md:flex items-center space-x-8 text-sm">
            {links.map((l) => (
              <a key={l.href} href={l.href} className="text-gray-300 hover:text-white transition">{l.label}</a>
            ))}
          </div>

          <div className="hidden md:flex items-center space-x-3">
            <a href="#login" className="btn-ghost px-4 py-2 rounded-lg text-sm">Войти</a>
            <a href="#pricing" className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Начать</a>
          </div>

          <button onClick={() => setOpen(!open)} className="md:hidden text-gray-200 p-2" aria-label="menu">
            <Menu />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-ink/95 backdrop-blur-xl shadow-2xl">
          <div className="px-4 py-4 flex flex-col gap-3 text-sm">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-gray-300">{l.label}</a>
            ))}
            <a href="#login" onClick={() => setOpen(false)} className="btn-ghost px-4 py-2 rounded-lg text-center">Войти</a>
            <a href="#pricing" onClick={() => setOpen(false)} className="btn-primary px-4 py-2 rounded-lg text-center font-medium">Начать</a>
          </div>
        </div>
      )}
    </nav>
  );
}
