import { Nav } from '@/sections/Nav';
import { Hero } from '@/sections/Hero';
import { Features } from '@/sections/Features';
import { Pricing } from '@/sections/Pricing';
import { Faq } from '@/sections/Faq';
import { Footer } from '@/sections/Footer';

export default function Home() {
  return (
    <>
      <div className="bg-aurora" />
      <div className="grain" aria-hidden />
      <Nav />
      <main className="flex-1 relative z-10">
        <Hero />
        <Features />
        <Pricing />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
