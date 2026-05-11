import { useState, useEffect } from 'react';
import type Lenis from 'lenis';

interface NavigationProps {
  lenis: Lenis | null;
}

const navItems = [
  { label: 'Events', target: 'events' },
  { label: 'RSVP', target: 'rsvp' },
  { label: 'Travel', target: 'travel' },
  { label: 'FAQ', target: 'faq' },
  { label: 'Gallery', target: 'gallery' },
];

export default function Navigation({ lenis }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
    } else {
      document.body.style.overflow = '';
      if (lenis) lenis.start();
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen, lenis]);

  const handleNavClick = (target: string) => {
    setMobileOpen(false);
    setTimeout(() => {
      if (lenis) {
        lenis.scrollTo(`#${target}`, { offset: -48 });
      } else {
        const el = document.getElementById(target);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] h-12 transition-all duration-300 ${
          scrolled
            ? 'bg-[#F5F1EB]/92 backdrop-blur-sm shadow-[0_1px_8px_rgba(59,47,47,0.06)]'
            : 'bg-[#F5F1EB]/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between px-5 md:px-10">
          <button
            onClick={() => handleNavClick('hero')}
            className="font-serif-display text-sm tracking-[0.15em] text-[#3B2F2F] hover:text-[#C4A055] transition-colors duration-300"
          >
            A&A
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.target}
                onClick={() => handleNavClick(item.target)}
                className="group relative font-sans-body text-xs font-semibold uppercase tracking-[0.12em] text-[#3B2F2F] hover:text-[#3B2F2F] transition-colors duration-300 py-1"
              >
                {item.label}
                <span className="absolute bottom-0 left-0 w-full h-px bg-[#C4A055] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Open menu"
          >
            <span className="w-5 h-px bg-[#3B2F2F]" />
            <span className="w-5 h-px bg-[#3B2F2F]" />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 z-[200] bg-[#3B2F2F] flex flex-col items-center justify-center transition-all duration-500 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-5 p-2 text-white"
          aria-label="Close menu"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M2 2L18 18M18 2L2 18" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </button>

        <div className="flex flex-col items-center gap-8">
          {navItems.map((item, i) => (
            <button
              key={item.target}
              onClick={() => handleNavClick(item.target)}
              className="font-sans-body text-base font-semibold uppercase tracking-[0.15em] text-white/90 hover:text-[#C4A055] transition-colors duration-300"
              style={{
                transitionDelay: mobileOpen ? `${i * 50}ms` : '0ms',
                opacity: mobileOpen ? 1 : 0,
                transform: mobileOpen ? 'translateY(0)' : 'translateY(10px)',
                transition: 'opacity 0.4s ease, transform 0.4s ease, color 0.3s ease',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
