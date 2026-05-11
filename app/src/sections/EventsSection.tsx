import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollReveal from '@/components/ScrollReveal';

gsap.registerPlugin(ScrollTrigger);

interface EventItem {
  date: string;
  name: string;
  time: string;
  venue: string;
  dressCode: string;
  notes?: string;
  mapUrl?: string;
  city: 'kolkata' | 'kerala';
}

const kolkataEvents: EventItem[] = [
  {
    date: 'July 6',
    name: 'Reception / Welcome Evening',
    time: '7:00 PM onwards',
    venue: 'Venue TBD, Kolkata',
    dressCode: 'Festive / Cocktail Attire',
    city: 'kolkata',
  },
  {
    date: 'July 7',
    name: 'Mehendi & Haldi',
    time: '10:00 AM – 5:00 PM',
    venue: 'Venue TBD, Kolkata',
    dressCode: 'Bright Colors / Yellow & White Traditional',
    notes: 'Followed by the Sangeet celebration in the evening.',
    city: 'kolkata',
  },
  {
    date: 'July 7',
    name: 'Sangeet Night',
    time: '7:00 PM onwards',
    venue: 'Venue TBD, Kolkata',
    dressCode: 'Glamorous / Festive Evening Wear',
    city: 'kolkata',
  },
  {
    date: 'July 8',
    name: 'Wedding Ceremony & Pheras',
    time: 'Morning',
    venue: 'Venue TBD, Kolkata',
    dressCode: 'Traditional Indian / Formal',
    notes: 'The sacred wedding ceremony with Pheras.',
    city: 'kolkata',
  },
];

const keralaEvents: EventItem[] = [
  {
    date: 'July 18–19',
    name: 'Christian-Style Reception',
    time: 'Evening',
    venue: 'Venue TBD, Near Pala, Kerala',
    dressCode: 'Smart Casual / Semi-Formal',
    notes: 'A warm celebration of love and togetherness.',
    city: 'kerala',
  },
];

function EventCard({ event, align }: { event: EventItem; align: 'left' | 'right' }) {
  const dotColor = event.city === 'kolkata' ? '#C4A055' : '#3D6B5B';

  return (
    <div
      className={`relative w-full md:w-[calc(50%-30px)] bg-white rounded-[4px] p-6 md:p-7 shadow-[0_2px_12px_rgba(59,47,47,0.06)] hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(59,47,47,0.08)] transition-all duration-300 ${
        align === 'right' ? 'md:ml-auto' : ''
      }`}
    >
      {/* Timeline dot - visible only on desktop */}
      <div
        className="hidden md:block absolute top-8 w-3 h-3 rounded-full"
        style={{
          backgroundColor: dotColor,
          [align === 'left' ? 'right' : 'left']: '-36px',
        }}
      />

      <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3D6B5B] mb-1.5">
        {event.date.toUpperCase()}
      </p>
      <h3 className="font-serif-display text-lg md:text-xl text-[#3B2F2F] leading-tight">
        {event.name}
      </h3>
      <div className="w-10 h-px bg-[#C4A055] my-3" />
      <p className="font-sans-body text-sm text-[#3B2F2F]">{event.time}</p>
      <p className="font-sans-body text-sm text-[#3B2F2F]/70 mt-1">{event.venue}</p>
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
    </div>
  );
}

export default function EventsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const kolkataCardsRef = useRef<HTMLDivElement>(null);
  const keralaCardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Animate Kolkata cards alternating
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
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true,
              },
            }
          );
        });
      }

      // Animate Kerala cards
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
              scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                once: true,
              },
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
          <h3 className="font-serif-display text-lg md:text-[22px] uppercase tracking-[0.05em] text-[#3B2F2F] mb-8 md:mb-12">
            Kolkata, India &bull; July 6 &ndash; 8, 2026
          </h3>
        </ScrollReveal>

        <div ref={kolkataCardsRef} className="relative">
          {/* Timeline line - desktop only */}
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
                <div
                  className="md:hidden absolute left-[14px] top-8 w-3 h-3 rounded-full bg-[#C4A055]"
                />
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

        {/* Kerala Events */}
        <div ref={keralaCardsRef} className="relative">
          {/* Timeline line - desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#3D6B5B] -translate-x-1/2" />

          {/* Mobile timeline */}
          <div className="md:hidden absolute left-5 top-0 bottom-0 w-0.5 bg-[#3D6B5B]" />

          <div className="space-y-6">
            {keralaEvents.map((event, i) => (
              <div
                key={`kerala-${i}`}
                className="event-card-wrapper relative pl-12 md:pl-0"
              >
                {/* Mobile dot */}
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
