import ScrollReveal from '@/components/ScrollReveal';

interface FamilyCardProps {
  ledBy: string;
  parents: string[];
  siblings: string[];
  accentColor: string;
}

function FamilyCard({ ledBy, parents, siblings, accentColor }: FamilyCardProps) {
  const siblingLabel = siblings.length === 1 ? 'Sibling' : 'Siblings';

  return (
    <div className="bg-white rounded-[4px] shadow-[0_2px_12px_rgba(59,47,47,0.06)] overflow-hidden">
      <div className="h-[3px]" style={{ backgroundColor: accentColor }} />
      <div className="p-7 md:p-9 text-center">
        <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3D6B5B] mb-4">
          {ledBy}
        </p>
        <div className="w-10 h-px bg-[#C4A055] mx-auto mb-5" />
        <div className="space-y-1.5">
          {parents.map((name) => (
            <p
              key={name}
              className="font-serif-display text-lg md:text-[22px] text-[#3B2F2F] leading-snug"
            >
              {name}
            </p>
          ))}
        </div>

        {siblings.length > 0 && (
          <>
            <div className="w-6 h-px bg-[#C4A055]/40 mx-auto my-5" />
            <p className="font-sans-body text-[10px] font-semibold uppercase tracking-[0.15em] text-[#3B2F2F]/60 mb-2">
              {siblingLabel}
            </p>
            <div className="space-y-1">
              {siblings.map((name) => (
                <p
                  key={name}
                  className="font-serif-display text-base md:text-[17px] text-[#3B2F2F]/85 leading-snug"
                >
                  {name}
                </p>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FamiliesSection() {
  return (
    <section id="families" className="bg-[#3B2F2F] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <p className="section-label-light mb-3 md:mb-4">Our Families</p>
          <h2 className="section-heading-light mb-3 md:mb-4">
            With Love, From Our Parents
          </h2>
          <p className="font-sans-body text-base text-white/70 mb-10 md:mb-[60px] max-w-[600px]">
            We are grateful to be celebrating this day with the people who raised us
            and shaped who we are.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
          <ScrollReveal direction="left" delay={0.1}>
            <FamilyCard
              ledBy="Parents of the Bride"
              parents={['Kiran Agarwal', 'Manoher Kumar Agarwal']}
              siblings={['Ayush Agarwal']}
              accentColor="#C4A055"
            />
          </ScrollReveal>

          <ScrollReveal direction="right" delay={0.15}>
            <FamilyCard
              ledBy="Parents of the Groom"
              parents={['Elsamma Binny', 'Binny Philip']}
              siblings={['Jerrin Thomas George', 'Amy Binny Philip', 'Allen Emmanuel Binny']}
              accentColor="#3D6B5B"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
