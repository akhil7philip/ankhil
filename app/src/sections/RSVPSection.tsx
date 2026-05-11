import { useState, useRef, useCallback } from 'react';
import gsap from 'gsap';
import ScrollReveal from '@/components/ScrollReveal';
import { supabase } from '@/lib/supabase';

type RSVPState = 'idle' | 'submitting' | 'success' | 'error';

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  guestCount: string;
  dietary: 'veg' | 'non-veg' | '';
  attendingKolkata: boolean;
  attendingKerala: boolean;
  kolkataEvents: string[];
  kolkataArrival: string;
  kolkataDeparture: string;
  kolkataAccommodation: string;
  kolkataAirportPickup: string;
  keralaArrival: string;
  keralaDeparture: string;
  keralaAccommodation: string;
  keralaAirportPickup: string;
  specialNotes: string;
}

const initialForm: FormData = {
  fullName: '',
  email: '',
  phone: '',
  guestCount: '1',
  dietary: '',
  attendingKolkata: false,
  attendingKerala: false,
  kolkataEvents: [],
  kolkataArrival: '2026-07-05T18:00',
  kolkataDeparture: '2026-07-09T10:00',
  kolkataAccommodation: '',
  kolkataAirportPickup: '',
  keralaArrival: '2026-07-18T12:00',
  keralaDeparture: '2026-07-20T10:00',
  keralaAccommodation: '',
  keralaAirportPickup: '',
  specialNotes: '',
};

const inputClasses =
  'w-full bg-white/80 border border-[rgba(59,47,47,0.15)] rounded-[2px] px-4 py-3 font-sans-body text-[15px] text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200';

const labelClasses =
  'block font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-[#3B2F2F] mb-1.5';

const kolkataOptions = [
  { value: 'reception', label: 'July 6 — Reception / Welcome Evening' },
  { value: 'mehendi-haldi', label: 'July 7 — Mehendi, Haldi & Sangeet' },
  { value: 'wedding', label: 'July 8 — Wedding Ceremony & Pheras' },
];

function RadioGroup({
  options,
  name,
  value,
  onChange,
  disabled,
}: {
  options: string[];
  name: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-4 mt-2">
      {options.map((opt) => {
        const inputId = `${name}-${opt.replace(/[^a-zA-Z0-9]/g, '-')}`;
        return (
          <label
            key={opt}
            htmlFor={inputId}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="relative w-4 h-4">
              <input
                id={inputId}
                type="radio"
                name={name}
                value={opt}
                checked={value === opt}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-4 h-4 border border-[rgba(59,47,47,0.3)] rounded-full peer-checked:border-[#C4A055] transition-colors duration-200 flex items-center justify-center pointer-events-none">
                <div className={`w-2 h-2 rounded-full bg-[#C4A055] transition-opacity duration-200 ${value === opt ? 'opacity-100' : 'opacity-0'}`} />
              </div>
            </div>
            <span className="font-sans-body text-sm text-[#3B2F2F] group-hover:text-[#C4A055] transition-colors duration-200">
              {opt}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export default function RSVPSection() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [state, setState] = useState<RSVPState>('idle');
  const successRef = useRef<HTMLDivElement>(null);

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const toggleKolkataEvent = useCallback((event: string) => {
    setForm((prev) => {
      const current = prev.kolkataEvents;
      const next = current.includes(event)
        ? current.filter((e) => e !== event)
        : [...current, event];
      return { ...prev, kolkataEvents: next };
    });
    if (errors.kolkataEvents) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.kolkataEvents;
        return next;
      });
    }
  }, [errors.kolkataEvents]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Please enter your full name';
    if (!form.phone.trim()) newErrors.phone = 'Please enter your phone number';
    if (!form.dietary) newErrors.dietary = 'Please select your dietary preference';
    if (!form.attendingKolkata && !form.attendingKerala) {
      newErrors.attendingKolkata = 'Please select at least one celebration';
    }
    if (form.attendingKolkata && form.kolkataEvents.length === 0) {
      newErrors.kolkataEvents = 'Please select at least one Kolkata event';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const toIso = (val: string) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };

  const toBool = (val: string) => {
    if (val === 'Yes' || val === 'Yes, I need accommodation help' || val === 'Yes, I need airport pickup') return true;
    if (val === 'No' || val === 'No, I\'ve arranged my own' || val === 'No, I\'ll arrange my own transport') return false;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setState('submitting');

    const payload = {
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      dietary: form.dietary,
      guest_count: parseInt(form.guestCount, 10) || 1,
      attending_kolkata: form.attendingKolkata,
      kolkata_events: form.attendingKolkata ? form.kolkataEvents : null,
      kolkata_arrival: form.attendingKolkata ? toIso(form.kolkataArrival) : null,
      kolkata_departure: form.attendingKolkata ? toIso(form.kolkataDeparture) : null,
      kolkata_accommodation: form.attendingKolkata ? toBool(form.kolkataAccommodation) : null,
      kolkata_airport_pickup: form.attendingKolkata ? toBool(form.kolkataAirportPickup) : null,
      attending_kerala: form.attendingKerala,
      kerala_arrival: form.attendingKerala ? toIso(form.keralaArrival) : null,
      kerala_departure: form.attendingKerala ? toIso(form.keralaDeparture) : null,
      kerala_accommodation: form.attendingKerala ? toBool(form.keralaAccommodation) : null,
      kerala_airport_pickup: form.attendingKerala ? toBool(form.keralaAirportPickup) : null,
      special_notes: form.specialNotes.trim() || null,
    };

    const { error } = await supabase.from('rsvps').insert([payload]);

    if (error) {
      console.error('Supabase insert error:', error);
      setState('error');
      return;
    }

    setState('success');
    setTimeout(() => {
      if (successRef.current) {
        gsap.fromTo(
          successRef.current,
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
        );
      }
    }, 50);
  };

  const isSubmitting = state === 'submitting';

  return (
    <section id="rsvp" className="bg-[#3B2F2F] py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[800px] mx-auto">
        <ScrollReveal>
          <p className="section-label mb-3 md:mb-4">RSVP</p>
          <h2 className="section-heading-light mb-2">
            We'd Love to Celebrate With You
          </h2>
          <p className="font-sans-body text-base text-white/70 mb-8 md:mb-12">
            Please let us know if you'll be joining us in Kolkata and/or Kerala
          </p>
        </ScrollReveal>

        {state === 'success' ? (
          <div ref={successRef} className="text-center py-16 opacity-0">
            <div className="w-12 h-12 rounded-full border-2 border-[#C4A055] flex items-center justify-center mx-auto mb-5">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4A055" strokeWidth="2">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-serif-display text-[28px] text-white mb-3">Thank You!</h3>
            <p className="font-sans-body text-base text-white/80 max-w-[400px] mx-auto">
              We're so grateful you'll be celebrating with us. We'll be in touch soon with more details.
            </p>
          </div>
        ) : (
          <ScrollReveal delay={0.15}>
            <form
              onSubmit={handleSubmit}
              className="bg-[#F5F1EB] rounded-[4px] p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
            >
              {/* Error banner */}
              {state === 'error' && (
                <div className="mb-6 p-4 bg-[#7B2D41]/10 border border-[#7B2D41]/30 rounded-[2px]">
                  <p className="font-sans-body text-sm text-[#7B2D41]">
                    Something went wrong while submitting. Please try again or contact us directly.
                  </p>
                </div>
              )}

              {/* --- Personal Details --- */}
              <div className="mb-8">
                <h3 className="font-serif-display text-lg text-[#3B2F2F] mb-5">Your Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className={labelClasses}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Your full name"
                      className={inputClasses}
                      value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.fullName && <p className="text-xs text-[#7B2D41] mt-1">{errors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={labelClasses}>Phone * (preferably WhatsApp)</label>
                    <input
                      type="tel"
                      placeholder="+91-XXXXXXXXXX"
                      className={inputClasses}
                      value={form.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      disabled={isSubmitting}
                    />
                    {errors.phone && <p className="text-xs text-[#7B2D41] mt-1">{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className={labelClasses}>Email</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      className={inputClasses}
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Guest Count */}
                  <div>
                    <label className={labelClasses}>Number of Guests *</label>
                    <select
                      className={inputClasses + ' appearance-none cursor-pointer'}
                      value={form.guestCount}
                      onChange={(e) => updateField('guestCount', e.target.value)}
                      disabled={isSubmitting}
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dietary */}
                  <div>
                    <label className={labelClasses}>Dietary Preference *</label>
                    <RadioGroup
                      name="dietary"
                      options={['Vegetarian', 'Non-Vegetarian']}
                      value={form.dietary === 'veg' ? 'Vegetarian' : form.dietary === 'non-veg' ? 'Non-Vegetarian' : ''}
                      onChange={(val) => updateField('dietary', val === 'Vegetarian' ? 'veg' : 'non-veg')}
                      disabled={isSubmitting}
                    />
                    {errors.dietary && <p className="text-xs text-[#7B2D41] mt-1">{errors.dietary}</p>}
                  </div>
                </div>
              </div>

              <div className="w-full h-px bg-[rgba(59,47,47,0.1)] my-8" />

              {/* --- City Selection --- */}
              <div className="mb-8">
                <h3 className="font-serif-display text-lg text-[#3B2F2F] mb-5">Which Celebrations Will You Attend?</h3>
                <div className="space-y-3">
                  <label htmlFor="attending-kolkata" className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative w-4 h-4 mt-0.5">
                      <input
                        id="attending-kolkata"
                        type="checkbox"
                        checked={form.attendingKolkata}
                        onChange={(e) => updateField('attendingKolkata', e.target.checked)}
                        disabled={isSubmitting}
                        className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-4 h-4 border border-[rgba(59,47,47,0.3)] rounded-[2px] peer-checked:bg-[#C4A055] peer-checked:border-[#C4A055] transition-colors duration-200 flex items-center justify-center pointer-events-none">
                        <svg className={`w-2.5 h-2.5 text-white transition-opacity duration-200 ${form.attendingKolkata ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <span className="font-sans-body text-[15px] text-[#3B2F2F] group-hover:text-[#C4A055] transition-colors duration-200">
                        Kolkata celebrations
                      </span>
                      <p className="font-sans-body text-xs text-[#3B2F2F]/60">July 6 – 8, 2026</p>
                    </div>
                  </label>

                  <label htmlFor="attending-kerala" className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative w-4 h-4 mt-0.5">
                      <input
                        id="attending-kerala"
                        type="checkbox"
                        checked={form.attendingKerala}
                        onChange={(e) => updateField('attendingKerala', e.target.checked)}
                        disabled={isSubmitting}
                        className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                      />
                      <div className="w-4 h-4 border border-[rgba(59,47,47,0.3)] rounded-[2px] peer-checked:bg-[#C4A055] peer-checked:border-[#C4A055] transition-colors duration-200 flex items-center justify-center pointer-events-none">
                        <svg className={`w-2.5 h-2.5 text-white transition-opacity duration-200 ${form.attendingKerala ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 6l3 3 5-5" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <span className="font-sans-body text-[15px] text-[#3B2F2F] group-hover:text-[#C4A055] transition-colors duration-200">
                        Kerala reception
                      </span>
                      <p className="font-sans-body text-xs text-[#3B2F2F]/60">July 18 – 19, 2026 · Pala / Kottayam</p>
                    </div>
                  </label>
                </div>
                {errors.attendingKolkata && (
                  <p className="text-xs text-[#7B2D41] mt-2">{errors.attendingKolkata}</p>
                )}
              </div>

              {/* --- Kolkata Section --- */}
              {form.attendingKolkata && (
                <div className="mb-8 p-6 md:p-8 bg-[rgba(196,160,85,0.06)] rounded-[4px] border border-[rgba(196,160,85,0.15)]">
                  <h3 className="font-serif-display text-lg text-[#3B2F2F] mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C4A055]" />
                    Kolkata Details
                  </h3>

                  {/* Events */}
                  <div className="mb-5">
                    <label className={labelClasses}>Events you'll attend *</label>
                    <div className="space-y-2 mt-2">
                      {kolkataOptions.map((opt) => (
                        <label key={opt.value} htmlFor={`kolkata-event-${opt.value}`} className="flex items-start gap-2.5 cursor-pointer group">
                          <div className="relative w-4 h-4 mt-0.5">
                            <input
                              id={`kolkata-event-${opt.value}`}
                              type="checkbox"
                              checked={form.kolkataEvents.includes(opt.value)}
                              onChange={() => toggleKolkataEvent(opt.value)}
                              disabled={isSubmitting}
                              className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-4 h-4 border border-[rgba(59,47,47,0.3)] rounded-[2px] peer-checked:bg-[#C4A055] peer-checked:border-[#C4A055] transition-colors duration-200 flex items-center justify-center pointer-events-none">
                              <svg className={`w-2.5 h-2.5 text-white transition-opacity duration-200 ${form.kolkataEvents.includes(opt.value) ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M2 6l3 3 5-5" />
                              </svg>
                            </div>
                          </div>
                          <span className="font-sans-body text-sm text-[#3B2F2F] group-hover:text-[#C4A055] transition-colors duration-200">
                            {opt.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {errors.kolkataEvents && <p className="text-xs text-[#7B2D41] mt-1">{errors.kolkataEvents}</p>}
                  </div>

                  {/* Arrival / Departure */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className={labelClasses}>Expected Arrival</label>
                      <input
                        type="datetime-local"
                        className={inputClasses}
                        value={form.kolkataArrival}
                        onChange={(e) => updateField('kolkataArrival', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Expected Departure</label>
                      <input
                        type="datetime-local"
                        className={inputClasses}
                        value={form.kolkataDeparture}
                        onChange={(e) => updateField('kolkataDeparture', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div className="mb-5">
                    <label className={labelClasses}>Accommodation</label>
                    <RadioGroup
                      name="kolkata-accommodation"
                      options={['Yes, I need accommodation help', 'No, I\'ve arranged my own']}
                      value={form.kolkataAccommodation}
                      onChange={(val) => updateField('kolkataAccommodation', val)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Airport Pickup */}
                  <div>
                    <label className={labelClasses}>Airport Pickup</label>
                    <RadioGroup
                      name="kolkata-pickup"
                      options={['Yes, I need airport pickup', 'No, I\'ll arrange my own transport']}
                      value={form.kolkataAirportPickup}
                      onChange={(val) => updateField('kolkataAirportPickup', val)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* --- Kerala Section --- */}
              {form.attendingKerala && (
                <div className="mb-8 p-6 md:p-8 bg-[rgba(61,107,91,0.06)] rounded-[4px] border border-[rgba(61,107,91,0.15)]">
                  <h3 className="font-serif-display text-lg text-[#3B2F2F] mb-5 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#3D6B5B]" />
                    Kerala Details
                  </h3>

                  {/* Arrival / Departure */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <label className={labelClasses}>Expected Arrival</label>
                      <input
                        type="datetime-local"
                        className={inputClasses}
                        value={form.keralaArrival}
                        onChange={(e) => updateField('keralaArrival', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className={labelClasses}>Expected Departure</label>
                      <input
                        type="datetime-local"
                        className={inputClasses}
                        value={form.keralaDeparture}
                        onChange={(e) => updateField('keralaDeparture', e.target.value)}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Accommodation */}
                  <div className="mb-5">
                    <label className={labelClasses}>Accommodation</label>
                    <RadioGroup
                      name="kerala-accommodation"
                      options={['Yes, I need accommodation help', 'No, I\'ve arranged my own']}
                      value={form.keralaAccommodation}
                      onChange={(val) => updateField('keralaAccommodation', val)}
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Airport Pickup */}
                  <div>
                    <label className={labelClasses}>Airport Pickup</label>
                    <RadioGroup
                      name="kerala-pickup"
                      options={['Yes, I need airport pickup', 'No, I\'ll arrange my own transport']}
                      value={form.keralaAirportPickup}
                      onChange={(val) => updateField('keralaAirportPickup', val)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              {/* --- Special Notes --- */}
              <div className="mb-6">
                <label className={labelClasses}>Special Notes</label>
                <textarea
                  placeholder="Anything else we should know..."
                  rows={3}
                  className={inputClasses + ' resize-none'}
                  value={form.specialNotes}
                  onChange={(e) => updateField('specialNotes', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-[#3B2F2F] text-white font-sans-body text-xs font-semibold uppercase tracking-[0.12em] py-4 hover:bg-[#C4A055] transition-colors duration-300 disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting...' : 'Submit RSVP'}
              </button>
            </form>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
