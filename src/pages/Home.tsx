import { lazy, Suspense, useState } from 'react';
import { Nav } from '@/sections/Nav';
import { Hero } from '@/sections/Hero';
import { PeopleCarousel } from '@/sections/PeopleCarousel';
import { FreeRating } from '@/sections/FreeRating';
import { Footer } from '@/sections/Footer';

const TryDemo = lazy(() => import('@/components/TryDemo').then((m) => ({ default: m.TryDemo })));

export default function Home() {
  const [demoOpen, setDemoOpen] = useState(false);
  const openDemo = () => setDemoOpen(true);

  return (
    <>
      <div className="bg-grid" aria-hidden />
      <Nav onStart={openDemo} />
      <main className="flex-1 relative z-10">
        <Hero onStart={openDemo} />
        <PeopleCarousel onStart={openDemo} />
        <FreeRating />
      </main>
      <Footer />

      {demoOpen && (
        <Suspense fallback={null}>
          <TryDemo open={demoOpen} onClose={() => setDemoOpen(false)} />
        </Suspense>
      )}
    </>
  );
}
