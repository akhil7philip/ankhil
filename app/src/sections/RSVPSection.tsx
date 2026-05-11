import ScrollReveal from '@/components/ScrollReveal';
import RSVPForm, { type RsvpPayload, type SubmitResult } from '@/components/RSVPForm';
import { supabase } from '@/lib/supabase';

export default function RSVPSection() {
  const handleSubmit = async (payload: RsvpPayload): Promise<SubmitResult> => {
    const { data, error } = await supabase
      .from('rsvps')
      .insert([payload])
      .select('edit_token')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return { ok: false, error: 'Something went wrong while submitting.' };
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
            We'd Love to Celebrate With You
          </h2>
          <p className="font-sans-body text-base text-white/70 mb-8 md:mb-12">
            Please let us know if you'll be joining us in Kolkata and/or Kerala
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <RSVPForm mode="create" onSubmit={handleSubmit} />
        </ScrollReveal>
      </div>
    </section>
  );
}
