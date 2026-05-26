import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Particles } from '@/components/Particles';
import { ScrollProgress } from '@/components/ScrollProgress';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import Home from '@/pages/Home';
import ReportDemo from '@/pages/ReportDemo';

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
  const isTg = typeof window !== 'undefined' && !!window.Telegram?.WebApp?.initData;

  return (
    <BrowserRouter>
      <ScrollManager />
      <div className="min-h-screen flex flex-col bg-ink text-gray-200 relative overflow-x-hidden">
        <ScrollProgress />
        {!isTg && <Particles />}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/report/demo" element={<ReportDemo />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
