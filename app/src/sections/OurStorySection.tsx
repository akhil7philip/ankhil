import ScrollReveal from '@/components/ScrollReveal';

export default function OurStorySection() {
  return (
    <section id="our-story" className="bg-[#F5F1EB] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[1200px] mx-auto">
        <ScrollReveal>
          <p className="section-label mb-3 md:mb-4">Our Story</p>
          <h2 className="section-heading mb-10 md:mb-[60px]">
            Two Hearts, Two Cultures, One Journey
          </h2>
        </ScrollReveal>

        <div className="flex flex-col md:flex-row gap-10 md:gap-[60px] items-start">
          {/* Left Column — Story Text */}
          <div className="w-full md:w-[55%]">
            <ScrollReveal delay={0.15}>
              <div className="space-y-5">
                <p className="font-sans-body text-base text-[#3B2F2F] leading-relaxed">
                  Ankita and Akhil first crossed paths at a mutual friend's dinner party in Mumbai. 
                  What started as a casual conversation about their shared love for old Hindi films 
                  and Kerala's backwaters quickly turned into something far more meaningful. Over 
                  countless cups of chai and long evening walks, they discovered a connection that 
                  felt both effortless and extraordinary.
                </p>
                <p className="font-sans-body text-base text-[#3B2F2F] leading-relaxed">
                  On a quiet evening overlooking the Arabian Sea, Akhil asked Ankita to spend the 
                  rest of their lives together. With the sun setting behind them and the sound of 
                  waves crashing nearby, she said yes — and they began planning a celebration that 
                  would honor both the families and traditions they hold dear.
                </p>
                <p className="font-sans-body text-base text-[#3B2F2F] leading-relaxed">
                  Their wedding is a beautiful union of two rich heritages — Ankita's Marwadi Hindu 
                  traditions and Akhil's Kerala Christian roots. From the vibrant Mehendi and sacred 
                  Pheras in Kolkata to the heartfelt reception in the lush green hills of Kerala, 
                  every ceremony reflects the love, warmth, and diversity that defines their journey.
                </p>
                <p className="font-sans-body text-base text-[#3B2F2F] leading-relaxed">
                  They are beyond excited to celebrate this new chapter with the people who mean 
                  the most to them — their family, friends, and all the loved ones who have 
                  supported them along the way.
                </p>
              </div>
            </ScrollReveal>

            {/* Decorative Quote */}
            <ScrollReveal delay={0.3}>
              <blockquote className="mt-8 pl-6 border-l-2 border-[#C4A055]">
                <p className="font-serif-display text-lg md:text-[22px] italic text-[#3B2F2F]/80 leading-relaxed">
                  "In each other, we found a love that honors where we come from and where we're 
                  going together."
                </p>
              </blockquote>
            </ScrollReveal>
          </div>

          {/* Right Column — Images */}
          <div className="w-full md:w-[45%] relative">
            <ScrollReveal delay={0.2} direction="right">
              <div className="relative">
                <img
                  src="/images/story-couple-1.jpg"
                  alt="Ankita and Akhil laughing together"
                  className="w-full rounded-[4px] object-cover"
                  style={{ aspectRatio: '3/4' }}
                  loading="lazy"
                />
              </div>
            </ScrollReveal>
            <ScrollReveal delay={0.35} direction="right">
              <div className="w-[60%] ml-auto -mt-16 md:-mt-24 relative z-10">
                <img
                  src="/images/story-couple-2.jpg"
                  alt="Henna hands with wedding ring"
                  className="w-full rounded-[4px] object-cover border-[3px] border-[#F5F1EB]"
                  style={{ aspectRatio: '1/1' }}
                  loading="lazy"
                />
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
