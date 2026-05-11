import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import CountdownTimer from '@/components/CountdownTimer';
import type Lenis from 'lenis';

interface HeroSectionProps {
  lenis: Lenis | null;
}

export default function HeroSection({ lenis }: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);
  const namesRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const datesRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef<HTMLDivElement>(null);
  const keralaCountdownRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  const kolkataDate = new Date('2026-07-06T00:00:00+05:30');
  const keralaDate = new Date('2026-07-18T18:00:00+05:30');

  useLayoutEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Initial states
      gsap.set([labelRef.current, namesRef.current, datesRef.current, countdownRef.current, keralaCountdownRef.current, buttonsRef.current], {
        opacity: 0,
        y: 30,
      });
      gsap.set(bgRef.current, { opacity: 0 });
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(lineRef.current, { width: 0 });

      // Step 1: Background fade in
      tl.to(bgRef.current, {
        opacity: 1,
        duration: 1.2,
        ease: 'power2.out',
      })
      .to(overlayRef.current, {
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.6')
      // Step 2: Label
      .to(labelRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.2')
      // Step 3: Names
      .to(namesRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
      }, '-=0.2')
      // Step 4: Decorative line
      .to(lineRef.current, {
        width: 80,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.3')
      // Step 5: Dates
      .to(datesRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.2')
      // Step 6: Countdown
      .to(countdownRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.2')
      // Step 7: Kerala countdown
      .to(keralaCountdownRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.3')
      // Step 8: Buttons
      .to(buttonsRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      }, '-=0.3');
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const handleScrollTo = (id: string) => {
    if (lenis) {
      lenis.scrollTo(`#${id}`, { offset: -48 });
    }
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative w-full min-h-[100dvh] max-h-[900px] overflow-hidden flex items-center justify-center"
    >
      {/* Background image */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/images/hero-background.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Dark overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-[1] bg-[rgba(59,47,47,0.25)]"
      />

      {/* Warm overlay */}
      <div className="absolute inset-0 z-[2] bg-[rgba(245,241,235,0.08)]" />

      {/* Content */}
      <div className="relative z-[3] text-center px-5 md:px-10 pt-16">
        {/* Save the Date */}
        <p
          ref={labelRef}
          className="font-sans-body text-xs font-semibold uppercase tracking-[0.15em] text-[#C4A055] mb-4"
        >
          Save the Date
        </p>

        {/* Names */}
        <div ref={namesRef}>
          <h1 className="font-serif-display text-[32px] md:text-[48px] text-white leading-[1.1] tracking-[-0.02em]"
              style={{ textShadow: '0 2px 24px rgba(59,47,47,0.3)' }}>
            Ankita Agarwal
          </h1>
          <p className="font-serif-display text-[28px] md:text-[40px] text-white leading-[1.1] tracking-[-0.02em] my-1"
             style={{ textShadow: '0 2px 24px rgba(59,47,47,0.3)' }}>
            &amp;
          </p>
          <h1 className="font-serif-display text-[32px] md:text-[48px] text-white leading-[1.1] tracking-[-0.02em]"
              style={{ textShadow: '0 2px 24px rgba(59,47,47,0.3)' }}>
            Akhil Philip
          </h1>
        </div>

        {/* Decorative gold line */}
        <div
          ref={lineRef}
          className="h-px bg-[#C4A055] mx-auto my-5 md:my-6"
          style={{ width: 0 }}
        />

        {/* Dates */}
        <div ref={datesRef}>
          <p className="font-sans-body text-sm md:text-base text-white/90 leading-relaxed">
            Kolkata, India &bull; July 6 &ndash; 8, 2026
          </p>
          <p className="font-sans-body text-sm md:text-base text-white/70 leading-relaxed mt-1">
            Kerala Reception &bull; Pala / Kottayam &bull; July 18 &ndash; 19, 2026
          </p>
        </div>

        {/* Countdown timers */}
        <div ref={countdownRef}>
          <CountdownTimer targetDate={kolkataDate} title="Countdown to Kolkata" />
        </div>

        <div ref={keralaCountdownRef}>
          <CountdownTimer targetDate={keralaDate} title="Countdown to Kerala" scale="small" />
        </div>

        {/* CTA Buttons */}
        <div ref={buttonsRef} className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mt-7 md:mt-8">
          <button
            onClick={() => handleScrollTo('events')}
            className="w-full sm:w-auto bg-[#3B2F2F] text-white font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-10 py-3.5 hover:bg-[#C4A055] transition-colors duration-300"
          >
            View Events
          </button>
          <button
            onClick={() => handleScrollTo('rsvp')}
            className="w-full sm:w-auto bg-transparent border border-white/60 text-white font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-10 py-3.5 hover:bg-white hover:text-[#3B2F2F] transition-all duration-300"
          >
            RSVP Now
          </button>
        </div>
      </div>
    </section>
  );
}
