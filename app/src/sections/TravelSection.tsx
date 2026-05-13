import ScrollReveal from '@/components/ScrollReveal';

interface CityCardProps {
  city: string;
  dates: string;
  accentColor: string;
  airport: { name: string; code: string; note?: string };
  transport: string;
}

function CityCard({ city, dates, accentColor, airport, transport }: CityCardProps) {
  return (
    <div className="bg-white rounded-[4px] shadow-[0_2px_12px_rgba(59,47,47,0.06)] overflow-hidden">
      <div className="h-[3px]" style={{ backgroundColor: accentColor }} />
      <div className="p-7 md:p-9">
        <h3 className="font-serif-display text-lg md:text-[22px] uppercase tracking-[0.05em] text-[#3B2F2F]">
          {city}
        </h3>
        <p className="font-sans-body text-sm text-[#3B2F2F]/70 mt-1">{dates}</p>
        <div className="w-10 h-px bg-[#C4A055] my-4" />

        {/* Airport */}
        <div className="mb-5">
          <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3D6B5B] mb-2">
            Nearest Airport
          </p>
          <p className="font-sans-body text-[15px] text-[#3B2F2F]">{airport.name}</p>
          <p className="font-sans-body text-sm text-[#3B2F2F]/70">
            {airport.code}
            {airport.note && ` — ${airport.note}`}
          </p>
        </div>

        {/* Transport */}
        <div>
          <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3D6B5B] mb-2">
            Getting Around
          </p>
          <p className="font-sans-body text-sm text-[#3B2F2F] leading-relaxed">{transport}</p>
        </div>
      </div>
    </div>
  );
}

export default function TravelSection() {
  return (
    <section id="travel" className="bg-[#F5F1EB] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <p className="section-label mb-3 md:mb-4">Travel & Stay</p>
          <h2 className="section-heading mb-10 md:mb-[60px]">Getting Here</h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <ScrollReveal direction="left" delay={0.1}>
            <CityCard
              city="Kolkata, West Bengal"
              dates="Wedding Events • July 6 – 8, 2026"
              accentColor="#C4A055"
              airport={{
                name: 'Netaji Subhas Chandra Bose International Airport',
                code: 'CCU',
              }}
              transport="Shared transport options will be arranged — please indicate in your RSVP."
            />
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.15}>
            <CityCard
              city="Pala / Kottayam, Kerala"
              dates="Reception • July 18, 2026"
              accentColor="#3D6B5B"
              airport={{
                name: 'Cochin International Airport',
                code: 'COK',
                note: 'approximately 2-hour drive to Pala/Kottayam',
              }}
              transport="Shared transport options will be arranged — please indicate in your RSVP."
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
