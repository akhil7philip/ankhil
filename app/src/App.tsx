import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import HeroSection from '@/sections/HeroSection';
import OurStorySection from '@/sections/OurStorySection';
import FamiliesSection from '@/sections/FamiliesSection';
import EventsSection from '@/sections/EventsSection';
import RSVPSection from '@/sections/RSVPSection';
import TravelSection from '@/sections/TravelSection';
import FAQSection from '@/sections/FAQSection';
import GallerySection from '@/sections/GallerySection';
import AdminPage from '@/pages/AdminPage';
import RSVPEditPage from '@/pages/RSVPEditPage';
import UploadPage from '@/pages/UploadPage';
import LivePage from '@/pages/LivePage';
import NotFoundPage from '@/pages/NotFoundPage';
import PasscodeGate from '@/components/PasscodeGate';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

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
  // Single source of truth for FAQ visibility. Lifted here so:
  //   * Navigation, FAQSection, GallerySection all see the same value
  //   * we can call ScrollTrigger.refresh() in one place after the value
  //     resolves — without it, hiding FAQ shrinks the page but every
  //     ScrollReveal below it keeps stale cached positions and never
  //     fires as the user scrolls past
  //   * Gallery can swap to a dark background when FAQ is gone, so the
  //     cream/dark section alternation doesn't break into three creams
  //     in a row (Travel → Gallery → Footer)
  const [faqVisible, setFaqVisible] = useState(true);
  const [galleryVisible, setGalleryVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data } = await supabase
        .from('site_config')
        .select('faq_visible, gallery_visible')
        .maybeSingle();
      if (cancelled || !data) return;
      if (data.faq_visible === false) setFaqVisible(false);
      if (data.gallery_visible === false) setGalleryVisible(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // After the FAQ/Gallery visibility settles, recompute ScrollTrigger positions
  // on the next animation frame. Layout has just shifted (sections unmounted,
  // Gallery bg may have flipped); sections below need correct cached zones.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [faqVisible, galleryVisible]);

  return (
    <div className="relative">
      <Navigation lenis={lenis} faqVisible={faqVisible} galleryVisible={galleryVisible} />
      <main>
        <HeroSection lenis={lenis} />
        <OurStorySection />
        <FamiliesSection />
        <EventsSection />
        <RSVPSection lenis={lenis} />
        <TravelSection />
        {faqVisible && <FAQSection />}
        {galleryVisible && <GallerySection darkBackground={!faqVisible} />}
      </main>
      <Footer />
    </div>
  );
}

export default function App({ lenis }: AppProps) {
  return (
    <PasscodeGate>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<HomePage lenis={lenis} />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/rsvp/edit/:token" element={<RSVPEditPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </PasscodeGate>
  );
}
