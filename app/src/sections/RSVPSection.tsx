import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ScrollReveal from '@/components/ScrollReveal';
import RSVPForm, { type RsvpPayload, type SubmitResult } from '@/components/RSVPForm';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(ScrollTrigger);

interface SiteConfig {
  rsvp_open: boolean;
  rsvp_closed_message: string | null;
  kerala_non_veg: boolean;
  kolkata_railway_stations: string[];
  kerala_railway_stations: string[];
}

const DEFAULT_CLOSED_MESSAGE =
  "RSVPs are now closed. If you've already submitted yours, you can still update your details using the private edit link we sent. For anything else, please reach out to us directly.";

export default function RSVPSection() {
  // Render optimistically as "open". If the config fetch comes back closed,
  // we'll swap to the closed card. Avoids a loading flash on the most common
  // path (open) and keeps the server-side trigger as the real enforcement.
  const [config, setConfig] = useState<SiteConfig>({
    rsvp_open: true,
    rsvp_closed_message: null,
    kerala_non_veg: false,
    kolkata_railway_stations: [],
    kerala_railway_stations: [],
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data, error } = await supabase
        .from('site_config')
        .select(
          'rsvp_open, rsvp_closed_message, kerala_non_veg, kolkata_railway_stations, kerala_railway_stations'
        )
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        // Fail open: if config can't be read, leave guests able to try
        // submitting. The server-side trigger is the actual enforcement.
        console.warn('site_config read failed; staying open:', error.message);
        return;
      }
      if (data) {
        setConfig({
          rsvp_open: data.rsvp_open,
          rsvp_closed_message: data.rsvp_closed_message,
          kerala_non_veg: Boolean(data.kerala_non_veg),
          kolkata_railway_stations: Array.isArray(data.kolkata_railway_stations)
            ? data.kolkata_railway_stations
            : [],
          kerala_railway_stations: Array.isArray(data.kerala_railway_stations)
            ? data.kerala_railway_stations
            : [],
        });
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // The form (~1500px) vs the closed card (~300px) are very different heights.
  // When the config fetch flips us between them, the sections *below* RSVP
  // shift on-screen, but their ScrollReveal/ScrollTrigger positions were
  // cached at initial mount. Without recomputing, sections below (Travel,
  // FAQ, Gallery, Footer) keep stale trigger zones and never reveal as the
  // user scrolls past where they actually live now. Refreshing on the next
  // frame -- after the layout has settled -- fixes that.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(id);
  }, [config.rsvp_open]);

  const handleSubmit = async (payload: RsvpPayload): Promise<SubmitResult> => {
    const { data, error } = await supabase
      .from('rsvps')
      .insert([payload])
      .select('edit_token')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      // Friendlier copy for the closed-via-trigger case.
      const closed = /closed/i.test(error.message);
      return {
        ok: false,
        error: closed
          ? 'RSVPs have just been closed. Please message us directly.'
          : 'Something went wrong while submitting.',
      };
    }

    const editUrl =
      data?.edit_token != null
        ? `${window.location.origin}/rsvp/edit/${data.edit_token}`
        : undefined;
    return { ok: true, editUrl };
  };

  return (
    <section id="rsvp" className="bg-[#3B2F2F] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[800px] mx-auto">
        <ScrollReveal>
          <p className="section-label-light mb-3 md:mb-4">RSVP</p>
          <h2 className="section-heading-light mb-2">
            {config.rsvp_open ? "We'd Love to Celebrate With You" : 'RSVPs Are Closed'}
          </h2>
          <p className="font-sans-body text-base text-white/70 mb-8 md:mb-12">
            {config.rsvp_open
              ? "Please let us know if you'll be joining us in Kolkata and/or Pala"
              : "Already submitted? You can still update yours via your private edit link."}
          </p>
        </ScrollReveal>

        {config.rsvp_open ? (
          <ScrollReveal delay={0.15}>
            <RSVPForm
              mode="create"
              onSubmit={handleSubmit}
              keralaNonVeg={config.kerala_non_veg}
              kolkataRailwayStations={config.kolkata_railway_stations}
              keralaRailwayStations={config.kerala_railway_stations}
            />
          </ScrollReveal>
        ) : (
          <ScrollReveal delay={0.15}>
            <ClosedCard message={config.rsvp_closed_message || DEFAULT_CLOSED_MESSAGE} />
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}

function ClosedCard({ message }: { message: string }) {
  return (
    <div className="bg-[#F5F1EB] rounded-[4px] p-8 md:p-12 text-center shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
      <div className="w-12 h-12 rounded-full border-2 border-[#C4A055] flex items-center justify-center mx-auto mb-5">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#C4A055"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 11V7a4 4 0 0 0-8 0v4" />
          <rect x="5" y="11" width="14" height="10" rx="2" />
        </svg>
      </div>
      <h3 className="font-serif-display text-[24px] md:text-[28px] text-[#3B2F2F] mb-4">
        Thank You for Your Interest
      </h3>
      <p className="font-sans-body text-base md:text-[17px] text-[#3B2F2F]/75 max-w-[520px] mx-auto leading-relaxed mb-6">
        {message}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center font-sans-body text-sm text-[#3B2F2F]">
        <a href="tel:+918373987643" className="hover:text-[#C4A055] transition-colors duration-200">
          +91-8373987643
        </a>
        <span className="hidden sm:inline text-[#3B2F2F]/30">·</span>
        <a href="mailto:support@ankhil.club" className="hover:text-[#C4A055] transition-colors duration-200">
          support@ankhil.club
        </a>
      </div>
    </div>
  );
}
