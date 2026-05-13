import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import CountdownTimer from '@/components/CountdownTimer';
import type Lenis from 'lenis';

interface HeroSectionProps {
  lenis: Lenis | null;
}

const KOLKATA_DATE = new Date('2026-07-06T00:00:00+05:30');
const KOLKATA_EVENTS_END = new Date('2026-07-09T00:00:00+05:30');
const KERALA_DATE = new Date('2026-07-18T18:00:00+05:30');

function pickCountdown(now: Date): { target: Date; title: string } {
  if (now < KOLKATA_EVENTS_END) {
    return { target: KOLKATA_DATE, title: 'Countdown to Kolkata' };
  }
  return { target: KERALA_DATE, title: 'Countdown to Kerala' };
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
  const buttonsRef = useRef<HTMLDivElement>(null);
  const storyLinkRef = useRef<HTMLButtonElement>(null);
  const hasAnimated = useRef(false);

  const { target: countdownTarget, title: countdownTitle } = pickCountdown(new Date());

  useLayoutEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Uses gsap.from() so elements default to their final visible state.
      // If JS fails or is slow to load, the hero stays visible instead of blank.
      tl.from(bgRef.current, {
        opacity: 0,
        duration: 1.2,
        ease: 'power2.out',
      })
        .from(
          overlayRef.current,
          { opacity: 0, duration: 0.8, ease: 'power2.out' },
          '-=0.6'
        )
        .from(
          labelRef.current,
          { opacity: 0, y: 30, duration: 0.6, ease: 'power2.out' },
          '-=0.2'
        )
        .from(
          namesRef.current,
          { opacity: 0, y: 30, duration: 0.8, ease: 'power2.out' },
          '-=0.2'
        )
        .from(
          lineRef.current,
          { width: 0, duration: 0.6, ease: 'power2.out' },
          '-=0.3'
        )
        .from(
          datesRef.current,
          { opacity: 0, y: 30, duration: 0.6, ease: 'power2.out' },
          '-=0.2'
        )
        .from(
          countdownRef.current,
          { opacity: 0, y: 30, duration: 0.6, ease: 'power2.out' },
          '-=0.2'
        )
        .from(
          buttonsRef.current,
          { opacity: 0, y: 30, duration: 0.6, ease: 'power2.out' },
          '-=0.3'
        )
        .from(
          storyLinkRef.current,
          { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' },
          '-=0.4'
        );
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

      {/* Dark overlay — vertical gradient: lighter at top/bottom so the tree
          silhouette and water stay visible, strongest mid-band where the
          names + dates + countdown sit. */}
      <div
        ref={overlayRef}
        className="absolute inset-0 z-[1]"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(59,47,47,0.20) 0%, rgba(59,47,47,0.55) 45%, rgba(59,47,47,0.25) 90%)',
        }}
      />

      {/* Warm overlay */}
      <div className="absolute inset-0 z-[2] bg-[rgba(245,241,235,0.08)]" />

      {/* Content */}
      <div className="relative z-[3] text-center px-5 md:px-10 pt-16">
        {/* Heading label */}
        <p
          ref={labelRef}
          className="font-sans-body text-xs font-semibold uppercase tracking-[0.18em] text-white mb-4"
          style={{ textShadow: '0 2px 10px rgba(0,0,0,0.55)' }}
        >
          We're Getting Married
        </p>

        {/* Names */}
        <div ref={namesRef}>
          <h1
            className="font-serif-display text-[32px] md:text-[48px] text-white leading-[1.1] tracking-[-0.02em]"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
          >
            Ankita Agarwal
          </h1>
          <p
            className="font-serif-display text-[28px] md:text-[40px] text-white leading-[1.1] tracking-[-0.02em] my-1"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
          >
            &amp;
          </p>
          <h1
            className="font-serif-display text-[32px] md:text-[48px] text-white leading-[1.1] tracking-[-0.02em]"
            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}
          >
            Akhil Binny Philip
          </h1>
        </div>

        {/* Decorative gold line */}
        <div
          ref={lineRef}
          className="h-px bg-[#C4A055] mx-auto my-5 md:my-6"
          style={{ width: '80px' }}
        />

        {/* Dates */}
        <div ref={datesRef}>
          <p
            className="font-sans-body text-sm md:text-base text-white/90 leading-relaxed"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
          >
            Kolkata, West Bengal &bull; July 6 &ndash; 8, 2026
          </p>
          <p
            className="font-sans-body text-sm md:text-base text-white/80 leading-relaxed mt-1"
            style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
          >
            Pala, Kerala &bull; July 25, 2026
          </p>
        </div>

        {/* Single conditional countdown — switches to Kerala after Kolkata events end */}
        <div ref={countdownRef}>
          <CountdownTimer targetDate={countdownTarget} title={countdownTitle} />
        </div>

        {/* CTA Buttons */}
        <div
          ref={buttonsRef}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mt-7 md:mt-8"
        >
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

        {/* Our Story text link */}
        <button
          ref={storyLinkRef}
          onClick={() => handleScrollTo('story')}
          className="group mt-5 md:mt-6 font-sans-body text-xs font-semibold uppercase tracking-[0.15em] text-white/90 hover:text-[#C4A055] transition-colors duration-300"
          style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}
        >
          Read Our Story
          <span className="inline-block ml-1.5 transition-transform duration-300 group-hover:translate-x-1">
            &rarr;
          </span>
        </button>
      </div>
    </section>
  );
}
