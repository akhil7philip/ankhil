import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollReveal from '@/components/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

type IconType = 'reception' | 'mehendi' | 'sangeet' | 'wedding' | 'kerala';

interface EventItem {
  date: string;
  name: string;
  time: string;
  venue?: string;
  dressCode: string;
  notes?: string;
  mapUrl?: string;
  city: 'kolkata' | 'kerala';
  iconType: IconType;
  start: string; // ISO with offset
  end: string;   // ISO with offset
}

const kolkataEvents: EventItem[] = [
  {
    date: 'July 6',
    name: 'Reception / Welcome Evening',
    time: '7:00 PM onwards',
    dressCode: 'Festive / Cocktail Attire',
    notes:
      'An informal welcome — drinks, dinner, and the first chance for both families to meet. Casual mingling, no formal program.',
    city: 'kolkata',
    iconType: 'reception',
    start: '2026-07-06T19:00:00+05:30',
    end: '2026-07-06T22:00:00+05:30',
  },
  {
    date: 'July 7',
    name: 'Mehendi & Haldi',
    time: '10:00 AM – 5:00 PM',
    dressCode: 'Bright Colors / Yellow & White Traditional',
    notes:
      "Henna is applied to the bride's hands and feet, followed by a turmeric paste ceremony said to bless the couple. Guests are welcome to get henna applied and join in.",
    city: 'kolkata',
    iconType: 'mehendi',
    start: '2026-07-07T10:00:00+05:30',
    end: '2026-07-07T17:00:00+05:30',
  },
  {
    date: 'July 7',
    name: 'Sangeet Night',
    time: '7:00 PM onwards',
    dressCode: 'Glamorous / Festive Evening Wear',
    notes:
      'An evening of music and dance, with family and friends performing for the couple. Expect a packed dance floor and dinner late into the night.',
    city: 'kolkata',
    iconType: 'sangeet',
    start: '2026-07-07T19:00:00+05:30',
    end: '2026-07-07T23:00:00+05:30',
  },
  {
    date: 'July 8',
    name: 'Wedding Ceremony & Pheras',
    time: '10:30 PM – 12:30 AM (July 9)',
    dressCode: 'Traditional Indian / Formal',
    notes:
      'The sacred Hindu rites — including the Pheras (seven circles around a holy fire) — that mark Ankita and Akhil as married. The ceremony runs about 2 hours; seating is provided.',
    city: 'kolkata',
    iconType: 'wedding',
    start: '2026-07-08T22:30:00+05:30',
    end: '2026-07-09T00:30:00+05:30',
  },
];

const keralaEvents: EventItem[] = [
  {
    date: 'July 18–19',
    name: 'Kerala Reception',
    time: 'Evening',
    dressCode: 'Smart Casual / Semi-Formal',
    notes:
      "A warm Kerala-Christian-style celebration with the couple, both families, and Akhil's hometown community. Expect a sit-down meal, speeches, and blessings from elders.",
    city: 'kerala',
    iconType: 'kerala',
    start: '2026-07-18T19:00:00+05:30',
    end: '2026-07-18T22:00:00+05:30',
  },
];

// --- Icons ---------------------------------------------------------------
function EventIcon({ type, color }: { type: IconType; color: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (type) {
    case 'reception':
      // Champagne / toast — coupe glass
      return (
        <svg {...common}>
          <path d="M7 4h10l-1.5 7a3.5 3.5 0 0 1-7 0z" />
          <path d="M12 14v6" />
          <path d="M8.5 20.5h7" />
        </svg>
      );
    case 'mehendi':
      // Henna leaf swirl
      return (
        <svg {...common}>
          <path d="M12 3c4 4 4 10 0 14" />
          <path d="M12 17c-4-4-4-10 0-14" />
          <circle cx="12" cy="20" r="0.8" fill={color} stroke="none" />
        </svg>
      );
    case 'sangeet':
      // Music notes
      return (
        <svg {...common}>
          <path d="M9 18V5l11-2v12" />
          <circle cx="7" cy="18" r="2.2" />
          <circle cx="18" cy="15" r="2.2" />
        </svg>
      );
    case 'wedding':
      // Sacred flame
      return (
        <svg {...common}>
          <path d="M12 3c1.8 3.2 4.5 5.2 4.5 9a4.5 4.5 0 0 1-9 0c0-1.8.8-2.8 1.8-3.6-.6-2 .6-3.7 2.7-5.4z" />
        </svg>
      );
    case 'kerala':
      // Palm / cross — abstract crossing strokes evoking Kerala's traveled palms and Christian heritage
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M7 9c2 0 4 1 5 3" />
          <path d="M17 9c-2 0-4 1-5 3" />
        </svg>
      );
  }
}

// --- Calendar helpers ----------------------------------------------------
// Google Calendar expects local times in YYYYMMDDTHHMMSS when ctz is set.
// Keep the T separator; only strip dashes and colons.
function toGcalLocal(iso: string): string {
  // "2026-07-08T22:30:00+05:30" → "20260708T223000"
  return iso.slice(0, 19).replace(/[-:]/g, '');
}

function buildGoogleCalendarUrl(event: EventItem): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Ankita & Akhil — ${event.name}`,
    dates: `${toGcalLocal(event.start)}/${toGcalLocal(event.end)}`,
    ctz: 'Asia/Kolkata',
  });
  if (event.notes) params.set('details', event.notes);
  if (event.venue) params.set('location', event.venue);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// --- Event card ----------------------------------------------------------
function EventCard({ event, align }: { event: EventItem; align: 'left' | 'right' }) {
  const accent = event.city === 'kolkata' ? '#C4A055' : '#3D6B5B';

  return (
    <div
      className={`relative w-full md:w-[calc(50%-30px)] bg-white rounded-[4px] p-6 md:p-7 shadow-[0_2px_12px_rgba(59,47,47,0.06)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(59,47,47,0.08)] transition-all duration-300 ${
        align === 'right' ? 'md:ml-auto' : ''
      }`}
    >
      {/* Timeline dot — desktop only */}
      <div
        className="hidden md:block absolute top-8 w-3 h-3 rounded-full"
        style={{
          backgroundColor: accent,
          [align === 'left' ? 'right' : 'left']: '-36px',
        }}
      />

      {/* Header row: date + icon */}
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3D6B5B]">
          {event.date.toUpperCase()}
        </p>
        <div className="opacity-80">
          <EventIcon type={event.iconType} color={accent} />
        </div>
      </div>

      <h3 className="font-serif-display text-lg md:text-xl text-[#3B2F2F] leading-tight">
        {event.name}
      </h3>
      <div className="w-10 h-px bg-[#C4A055] my-3" />

      <p className="font-sans-body text-sm text-[#3B2F2F]">{event.time}</p>

      {event.venue && (
        <p className="font-sans-body text-sm text-[#3B2F2F]/70 mt-1">{event.venue}</p>
      )}

      {event.mapUrl && (
        <a
          href={event.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-[#3D6B5B] mt-2 hover:underline"
        >
          View on Maps &rarr;
        </a>
      )}

      <p className="font-sans-body text-xs italic text-[#7B2D41] mt-2">
        Attire: {event.dressCode}
      </p>

      {event.notes && (
        <p className="font-sans-body text-[13px] text-[#3B2F2F]/60 mt-2">{event.notes}</p>
      )}

      {/* Add to Google Calendar */}
      <a
        href={buildGoogleCalendarUrl(event)}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-1.5 mt-4 font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F] hover:text-[#C4A055] transition-colors duration-200"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="16" rx="1.5" />
          <path d="M3 9h18" />
          <path d="M8 3v4" />
          <path d="M16 3v4" />
          <path d="M12 13v5" />
          <path d="M9.5 15.5h5" />
        </svg>
        Add to Calendar
      </a>
    </div>
  );
}

// --- Venue banner --------------------------------------------------------
function VenueBanner({ accent }: { accent: string }) {
  return (
    <div
      className="rounded-[4px] px-4 md:px-5 py-3 mb-8 md:mb-10 flex items-start gap-3"
      style={{ backgroundColor: `${accent}14`, borderLeft: `2px solid ${accent}` }}
    >
      <p className="font-sans-body text-[13px] md:text-sm text-[#3B2F2F] leading-relaxed">
        Exact venues are being finalized &mdash; addresses will be shared with you closer to the date.
      </p>
    </div>
  );
}

// --- Section -------------------------------------------------------------
export default function EventsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const kolkataCardsRef = useRef<HTMLDivElement>(null);
  const keralaCardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (kolkataCardsRef.current) {
        const cards = kolkataCardsRef.current.querySelectorAll('.event-card-wrapper');
        cards.forEach((card, i) => {
          const isLeft = i % 2 === 0;
          gsap.fromTo(
            card,
            { x: isLeft ? -30 : 30, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 85%', once: true },
            }
          );
        });
      }

      if (keralaCardsRef.current) {
        const cards = keralaCardsRef.current.querySelectorAll('.event-card-wrapper');
        cards.forEach((card) => {
          gsap.fromTo(
            card,
            { x: -30, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.6,
              ease: 'power2.out',
              scrollTrigger: { trigger: card, start: 'top 85%', once: true },
            }
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="events" ref={sectionRef} className="bg-[#F5F1EB] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[800px] mx-auto">
        <ScrollReveal>
          <p className="section-label mb-3 md:mb-4">Events</p>
          <h2 className="section-heading mb-3 md:mb-4">Wedding Celebrations</h2>
        </ScrollReveal>

        {/* Kolkata Events */}
        <ScrollReveal delay={0.1}>
          <h3 className="font-serif-display text-lg md:text-[22px] uppercase tracking-[0.05em] text-[#3B2F2F] mb-6 md:mb-8">
            Kolkata, India &bull; July 6 &ndash; 8, 2026
          </h3>
        </ScrollReveal>

        <ScrollReveal delay={0.12}>
          <VenueBanner accent="#C4A055" />
        </ScrollReveal>

        <div ref={kolkataCardsRef} className="relative">
          {/* Timeline line — desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#C4A055] -translate-x-1/2" />
          {/* Mobile timeline line */}
          <div className="md:hidden absolute left-5 top-0 bottom-0 w-0.5 bg-[#C4A055]" />

          <div className="space-y-6 md:space-y-8">
            {kolkataEvents.map((event, i) => (
              <div
                key={`kolkata-${i}`}
                className={`event-card-wrapper relative pl-12 md:pl-0 ${
                  i % 2 === 0 ? '' : 'md:text-right'
                }`}
              >
                {/* Mobile dot */}
                <div className="md:hidden absolute left-[14px] top-8 w-3 h-3 rounded-full bg-[#C4A055]" />
                <EventCard event={event} align={i % 2 === 0 ? 'left' : 'right'} />
              </div>
            ))}
          </div>
        </div>

        {/* Kerala Divider */}
        <ScrollReveal className="my-12 md:my-16">
          <div className="flex items-center justify-center gap-4">
            <div className="w-[60px] h-px bg-[#C4A055]" />
            <h3 className="font-serif-display text-2xl md:text-[28px] uppercase tracking-[0.1em] text-[#3D6B5B]">
              Kerala
            </h3>
            <div className="w-[60px] h-px bg-[#C4A055]" />
          </div>
          <p className="text-center font-serif-display text-base md:text-[22px] uppercase tracking-[0.05em] text-[#3D6B5B] mt-3">
            Pala / Kottayam &bull; July 18 &ndash; 19, 2026
          </p>
        </ScrollReveal>

        <ScrollReveal>
          <VenueBanner accent="#3D6B5B" />
        </ScrollReveal>

        {/* Kerala Events */}
        <div ref={keralaCardsRef} className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#3D6B5B] -translate-x-1/2" />
          <div className="md:hidden absolute left-5 top-0 bottom-0 w-0.5 bg-[#3D6B5B]" />

          <div className="space-y-6">
            {keralaEvents.map((event, i) => (
              <div
                key={`kerala-${i}`}
                className="event-card-wrapper relative pl-12 md:pl-0"
              >
                <div className="md:hidden absolute left-[14px] top-8 w-3 h-3 rounded-full bg-[#3D6B5B]" />
                <EventCard event={event} align="left" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
