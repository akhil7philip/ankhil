import ScrollReveal from '@/components/ScrollReveal';

export default function OurStorySection() {
  return (
    <section id="story" className="bg-[#F5F1EB] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[1100px] mx-auto">
        <ScrollReveal>
          <p className="section-label mb-3 md:mb-4">Our Story</p>
          <h2 className="section-heading mb-10 md:mb-[60px]">How We Got Here</h2>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
          {/* Image stack — left column on desktop */}
          <div className="md:col-span-5 relative pb-12 md:pb-20">
            <ScrollReveal direction="right">
              <div className="relative">
                {/* Gold offset frame */}
                <div className="hidden md:block absolute -inset-3 border border-[#C4A055]/40 rounded-[4px] translate-x-3 translate-y-3" />
                <img
                  src="/images/story-couple-1.jpg"
                  alt="Ankita and Akhil"
                  className="relative w-full object-cover rounded-[4px] shadow-[0_4px_24px_rgba(59,47,47,0.12)]"
                  style={{ aspectRatio: '3/4' }}
                  loading="lazy"
                />
              </div>
            </ScrollReveal>

            {/* Secondary image — overlapping bottom-right */}
            <ScrollReveal direction="left" delay={0.2} className="absolute bottom-0 right-4 md:right-[-40px] w-[45%] md:w-[55%] z-10">
              <img
                src="/images/story-couple-2.jpg"
                alt="Ankita and Akhil"
                className="w-full object-cover rounded-[4px] border-[6px] border-[#F5F1EB] shadow-[0_6px_20px_rgba(59,47,47,0.18)]"
                style={{ aspectRatio: '1/1' }}
                loading="lazy"
              />
            </ScrollReveal>
          </div>

          {/* Text — right column on desktop */}
          <ScrollReveal direction="left" delay={0.1} className="md:col-span-7">
            <div className="space-y-5 md:space-y-6">
              <p className="font-sans-body text-[16px] md:text-[17px] text-[#3B2F2F] leading-relaxed">
                Ankita and Akhil first met at St. Stephen's College, Delhi, where
                she was studying Economics and he was studying Mathematics.
                Somewhere between college corridors, conversations, and the
                everyday madness of student life, a friendship began &mdash; and
                in 2015, that friendship became the start of a journey together.
              </p>

              <p className="font-sans-body text-[16px] md:text-[17px] text-[#3B2F2F] leading-relaxed">
                Over the years, life took us in different directions. Ankita
                moved from consulting to public service, and Akhil found his way
                into technology. There were exams, career changes, new cities,
                long days, uncertain seasons, and many small victories along the
                way.
              </p>

              <p className="font-sans-body text-[16px] md:text-[17px] text-[#3B2F2F] leading-relaxed">
                Through it all, we remained each other's quiet constant &mdash;
                the person to call, the person to lean on, and the person
                cheering from the other side.
              </p>

              <div className="w-10 h-px bg-[#C4A055]" />

              <p className="font-serif-display italic text-[17px] md:text-[19px] text-[#3B2F2F]/85 leading-relaxed">
                Now, after all these years of growing together, we are so happy
                to begin this next chapter surrounded by the people we love.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
