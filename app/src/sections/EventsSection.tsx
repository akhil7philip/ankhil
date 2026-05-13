import { useEffect, useRef, useLayoutEffect, useMemo, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollReveal from '@/components/ScrollReveal';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

type IconType = 'reception' | 'mehendi' | 'haldi' | 'sangeet' | 'wedding' | 'kerala';

interface EventItem {
  date: string;
  name: string;
  time: string;
  venue?: string;
  dressCode?: string;
  notes?: string;
  mapUrl?: string;
  city: 'kolkata' | 'kerala';
  iconType: IconType;
  start: string; // ISO with offset
  end: string;   // ISO with offset
}

// Default venue strings. Real values come from site_config (editable in /admin).
const DEFAULT_KOLKATA_VENUE = 'New Town, Kolkata';
const DEFAULT_KERALA_VENUE = 'Pala, Kerala';

// Event content is defined without venue/mapUrl — those are injected at render
// from site_config so the couple can update them from /admin without a deploy.
const kolkataEventsBase: EventItem[] = [
  {
    date: 'July 6',
    name: 'Mehendi',
    time: '3:00 PM onwards',
    dressCode: 'Shades of green',
    notes:
      "An evening as henna is applied to the bride's hands and feet. Family and close friends are welcome to get henna applied themselves.",
    city: 'kolkata',
    iconType: 'mehendi',
    start: '2026-07-06T15:00:00+05:30',
    end: '2026-07-06T22:00:00+05:30',
  },
  {
    date: 'July 7',
    name: 'Haldi',
    time: '10:00 AM – 1:00 PM',
    dressCode: 'Shades of yellow',
    notes:
      'A playful turmeric ceremony where family and friends apply a paste of turmeric, sandalwood, and rose water on the bride and groom — said to bless the couple and leave them glowing.',
    city: 'kolkata',
    iconType: 'haldi',
    start: '2026-07-07T10:00:00+05:30',
    end: '2026-07-07T13:00:00+05:30',
  },
  {
    date: 'July 7',
    name: 'Musical Night',
    time: '7:00 PM onwards',
    dressCode: 'Shades of gold and silver',
    notes:
      'An evening of music and dance, with family and friends performing for the couple.',
    city: 'kolkata',
    iconType: 'sangeet',
    start: '2026-07-07T19:00:00+05:30',
    end: '2026-07-07T23:00:00+05:30',
  },
  {
    date: 'July 8',
    name: 'Varmala & Reception',
    time: '6:00 PM onwards',
    notes:
      'The couple exchange floral garlands (varmala), followed by a reception with extended family and friends before the wedding ceremony later that night.',
    city: 'kolkata',
    iconType: 'reception',
    start: '2026-07-08T18:00:00+05:30',
    end: '2026-07-08T22:00:00+05:30',
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

const keralaEventsBase: EventItem[] = [
  {
    date: 'July 18',
    name: 'Wedding Reception',
    time: '6:00 PM onwards',
    notes:
      'A wedding reception with the couple, both families, friends and hometown community.',
    city: 'kerala',
    iconType: 'kerala',
    start: '2026-07-18T18:00:00+05:30',
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
    case 'haldi':
      // Stylized sun — central disc with eight short rays. Evokes turmeric's
      // golden glow and the playful, sunny mood of the ceremony.
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.6" />
          <path d="M12 3v2.2" />
          <path d="M12 18.8V21" />
          <path d="M3 12h2.2" />
          <path d="M18.8 12H21" />
          <path d="M5.6 5.6l1.5 1.5" />
          <path d="M16.9 16.9l1.5 1.5" />
          <path d="M5.6 18.4l1.5-1.5" />
          <path d="M16.9 7.1l1.5-1.5" />
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
      // Crossed palm strokes — evokes Kerala's traveled palms.
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

      {event.dressCode && (
        <p className="font-sans-body text-xs italic text-[#7B2D41] mt-2">
          Attire: {event.dressCode}
        </p>
      )}

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

// --- Section -------------------------------------------------------------
export default function EventsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const kolkataCardsRef = useRef<HTMLDivElement>(null);
  const keralaCardsRef = useRef<HTMLDivElement>(null);

  const [venues, setVenues] = useState({
    kolkata: DEFAULT_KOLKATA_VENUE,
    kolkataMapUrl: '',
    kerala: DEFAULT_KERALA_VENUE,
    keralaMapUrl: '',
  });

  // Fetch venue strings from site_config. Defaults are already correct for the
  // current "not finalized" state, so a failed read still renders sensible
  // copy ("New Town, Kolkata" / "Pala, Kerala") with no map link.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('site_config')
        .select('kolkata_venue, kolkata_map_url, kerala_venue, kerala_map_url')
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn('site_config venues read failed; using defaults:', error.message);
        return;
      }
      if (data) {
        setVenues({
          kolkata: data.kolkata_venue || DEFAULT_KOLKATA_VENUE,
          kolkataMapUrl: data.kolkata_map_url || '',
          kerala: data.kerala_venue || DEFAULT_KERALA_VENUE,
          keralaMapUrl: data.kerala_map_url || '',
        });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Inject venue + mapUrl into each event from the current config.
  const kolkataEvents = useMemo(
    () =>
      kolkataEventsBase.map((e) => ({
        ...e,
        venue: venues.kolkata,
        mapUrl: venues.kolkataMapUrl || undefined,
      })),
    [venues.kolkata, venues.kolkataMapUrl]
  );

  const keralaEvents = useMemo(
    () =>
      keralaEventsBase.map((e) => ({
        ...e,
        venue: venues.kerala,
        mapUrl: venues.keralaMapUrl || undefined,
      })),
    [venues.kerala, venues.keralaMapUrl]
  );

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
            Pala, Kerala &bull; July 18, 2026
          </p>
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
