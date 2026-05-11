import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import type Lenis from 'lenis';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HeroSection from '@/sections/HeroSection';
import EventsSection from '@/sections/EventsSection';
import RSVPSection from '@/sections/RSVPSection';
import TravelSection from '@/sections/TravelSection';
import FAQSection from '@/sections/FAQSection';
import GallerySection from '@/sections/GallerySection';
import AdminPage from '@/pages/AdminPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

interface AppProps {
  lenis: Lenis | null;
  lenisReady: boolean;
}

function HomePage({ lenis }: { lenis: Lenis | null }) {
  return (
    <div className="relative">
      <Navigation lenis={lenis} />
      <main>
        <HeroSection lenis={lenis} />
        <EventsSection />
        <RSVPSection />
        <TravelSection />
        <FAQSection />
        <GallerySection />
      </main>
      <Footer />
    </div>
  );
}

export default function App({ lenis }: AppProps) {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage lenis={lenis} />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}
