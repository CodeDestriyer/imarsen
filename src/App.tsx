import { Particles } from '@/components/Particles';
import { ScrollProgress } from '@/components/ScrollProgress';
import { Nav } from '@/sections/Nav';
import { Hero } from '@/sections/Hero';
import { Stats } from '@/sections/Stats';
import { Features } from '@/sections/Features';
import { Pricing } from '@/sections/Pricing';
import { Faq } from '@/sections/Faq';
import { Footer } from '@/sections/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-ink text-gray-200 relative overflow-x-hidden">
      <ScrollProgress />
      <Particles />
      <div className="bg-aurora" />
      <Nav />
      <main className="flex-1 relative z-10">
        <Hero />
        <Stats />
        <Features />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
