import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ScrollProgress } from '@/components/ScrollProgress';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { ProfileProvider } from '@/hooks/useProfile';
import { SoonScreen, soonScreenActive } from '@/components/SoonScreen';
import Home from '@/pages/Home';

const VALID_ANCHOR = /^#[A-Za-z][\w-]*$/;

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash && VALID_ANCHOR.test(hash)) {
      try {
        const el = document.querySelector(hash);
        if (el) {
          setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50);
          return;
        }
      } catch {
        // ignore invalid selectors (e.g. Telegram hash params)
      }
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash]);
  return null;
}

export default function App() {
  useTelegramWebApp();
  // Считаем один раз: признак Telegram не меняется в течение сессии.
  const [soon] = useState(soonScreenActive);
  const backdropRef = useRef<HTMLDivElement>(null);

  // inert ставим атрибутом напрямую: типы React 18 его ещё не знают, а нам
  // важно, чтобы под заглушкой нельзя было сфокусироваться табом.
  useEffect(() => {
    if (soon) backdropRef.current?.setAttribute('inert', '');
  }, [soon]);

  return (
    <ProfileProvider>
      <BrowserRouter>
        <ScrollManager />
        {/*
          Сайт под заглушкой остаётся в разметке — он и есть тот самый блюр на
          фоне. Клики и фокус выключены, иначе камеру можно было бы запустить
          вслепую с клавиатуры. Заглушка лежит рядом, а не внутри: filter на
          родителе сделал бы его точкой отсчёта для position: fixed.
        */}
        <div
          ref={backdropRef}
          className={`min-h-screen flex flex-col bg-paper text-ink relative overflow-x-hidden${
            soon ? ' pointer-events-none select-none blur-lg' : ''
          }`}
          aria-hidden={soon || undefined}
        >
          <ScrollProgress />
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </div>
        {soon && <SoonScreen />}
      </BrowserRouter>
    </ProfileProvider>
  );
}
