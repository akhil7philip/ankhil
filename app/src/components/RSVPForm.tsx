import { useState, useRef, useCallback, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type Lenis from 'lenis';
import DateTimePicker from '@/components/DateTimePicker';
import { getKolkataDateRange } from '@/lib/events';

gsap.registerPlugin(ScrollTrigger);

export interface RsvpFormData {
  fullName: string;
  phone: string;
  email: string;
  guestCount: string;
  dietary: 'veg' | 'non-veg' | '';
  notAttending: boolean;
  attendingKolkata: boolean;
  attendingKerala: boolean;
  kolkataEvents: string[];
  kolkataAccommodation: string;
  kolkataAirportPickup: string;
  kolkataTrainPickup: string;
  kolkataTrainPickupStation: string;
  kolkataArrival: string;
  kolkataDeparture: string;
  keralaAccommodation: string;
  keralaAirportPickup: string;
  keralaTrainPickup: string;
  keralaTrainPickupStation: string;
  keralaArrival: string;
  keralaDeparture: string;
  specialNotes: string;
}

export interface RsvpPayload {
  full_name: string;
  phone: string;
  email: string | null;
  dietary: 'veg' | 'non-veg';
  guest_count: number;
  not_attending: boolean;
  attending_kolkata: boolean;
  kolkata_events: string[] | null;
  kolkata_arrival: string | null;
  kolkata_departure: string | null;
  kolkata_accommodation: boolean | null;
  kolkata_airport_pickup: boolean | null;
  kolkata_train_pickup: boolean | null;
  kolkata_train_pickup_station: string | null;
  attending_kerala: boolean;
  kerala_arrival: string | null;
  kerala_departure: string | null;
  kerala_accommodation: boolean | null;
  kerala_airport_pickup: boolean | null;
  kerala_train_pickup: boolean | null;
  kerala_train_pickup_station: string | null;
  special_notes: string | null;
}

export type SubmitResult =
  | { ok: true; editUrl?: string }
  | { ok: false; error: string };

export interface RSVPFormProps {
  mode: 'create' | 'edit';
  initial?: Partial<RsvpFormData>;
  onSubmit: (payload: RsvpPayload) => Promise<SubmitResult>;
  /** When true, the Kerala details panel includes a Veg/Non-Veg radio. The
   * field is required only when the guest is also attending Kerala. */
  keralaNonVeg?: boolean;
  /** Configured pickup stations. When more than one is listed for a city,
   * the form renders a dropdown after the guest says "yes" to train pickup
   * so they can choose. When exactly one is listed, the form auto-records
   * that one. When empty, no train-pickup helper text is shown. */
  kolkataRailwayStations?: string[];
  keralaRailwayStations?: string[];
  /** Lenis instance for smooth-scrolling the success card into view after
   * submit. When absent, falls back to native window.scrollTo. */
  lenis?: Lenis | null;
  /** Event IDs to hide from the Kolkata event checklist. */
  hiddenEvents?: string[];
}

const emptyForm: RsvpFormData = {
  fullName: '',
  phone: '',
  email: '',
  guestCount: '1',
  dietary: '',
  notAttending: false,
  attendingKolkata: false,
  attendingKerala: false,
  kolkataEvents: [],
  kolkataAccommodation: "No, I've arranged my own",
  kolkataAirportPickup: "No, I'll arrange my own transport",
  kolkataTrainPickup: "No, I'll arrange my own transport",
  kolkataTrainPickupStation: '',
  kolkataArrival: '',
  kolkataDeparture: '',
  keralaAccommodation: "No, I've arranged my own",
  keralaAirportPickup: "No, I'll arrange my own transport",
  keralaTrainPickup: "No, I'll arrange my own transport",
  keralaTrainPickupStation: '',
  keralaArrival: '',
  keralaDeparture: '',
  specialNotes: '',
};

const SUGGESTED = {
  kolkataArrival: '2026-07-07T10:00',
  kolkataDeparture: '2026-07-09T11:00',
  keralaArrival: '2026-07-25T10:00',
  keralaDeparture: '2026-07-26T11:00',
};

const ALL_KOLKATA_OPTIONS = [
  { value: 'mehendi', label: 'July 6 evening — Mehendi' },
  { value: 'haldi', label: 'July 7 morning — Haldi' },
  { value: 'sangeet', label: 'July 7 evening — Musical Night' },
  { value: 'varmala', label: 'July 8 evening — Varmala & Reception' },
  { value: 'pheras', label: 'July 8 night — Wedding Ceremony & Pheras' },
];

function formatSuggestionLabel(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const time = d
    .toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  return `${date} · ${time}`;
}

const inputClasses =
  'w-full bg-white/80 border border-[rgba(59,47,47,0.15)] rounded-[2px] px-4 py-3 font-sans-body text-[15px] text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200';

const labelClasses =
  'block font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-[#3B2F2F] mb-1.5';

const isYes = (val: string) => val.startsWith('Yes');

function SuggestedChip({
  iso,
  onApply,
  disabled,
}: {
  iso: string;
  onApply: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onApply}
      disabled={disabled}
      className="mt-1.5 inline-flex items-center gap-1.5 font-sans-body text-[12px] text-[#3B2F2F]/60 hover:text-[#C4A055] transition-colors duration-200 disabled:opacity-50"
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 12l5 5L20 7" />
      </svg>
      Use suggested: {formatSuggestionLabel(iso)}
    </button>
  );
}

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

function buildPayload(form: RsvpFormData, kolkataTravel: boolean, keralaTravel: boolean): RsvpPayload {
  const toIso = (val: string) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d.toISOString();
  };
  const toBool = (val: string): boolean | null => {
    if (isYes(val)) return true;
    if (val.startsWith('No')) return false;
    return null;
  };

  return {
    full_name: form.fullName.trim(),
    phone: form.phone.trim(),
    email: form.email.trim() || null,
    dietary: (form.dietary || 'veg') as 'veg' | 'non-veg',
    guest_count: parseInt(form.guestCount, 10) || 1,
    not_attending: form.notAttending,
    attending_kolkata: form.attendingKolkata,
    kolkata_events: form.attendingKolkata ? form.kolkataEvents : null,
    kolkata_arrival: kolkataTravel ? toIso(form.kolkataArrival) : null,
    kolkata_departure: kolkataTravel ? toIso(form.kolkataDeparture) : null,
    kolkata_accommodation: form.attendingKolkata ? toBool(form.kolkataAccommodation) : null,
    kolkata_airport_pickup: form.attendingKolkata ? toBool(form.kolkataAirportPickup) : null,
    kolkata_train_pickup: form.attendingKolkata ? toBool(form.kolkataTrainPickup) : null,
    kolkata_train_pickup_station:
      form.attendingKolkata && isYes(form.kolkataTrainPickup)
        ? form.kolkataTrainPickupStation.trim() || null
        : null,
    attending_kerala: form.attendingKerala,
    kerala_arrival: keralaTravel ? toIso(form.keralaArrival) : null,
    kerala_departure: keralaTravel ? toIso(form.keralaDeparture) : null,
    kerala_accommodation: form.attendingKerala ? toBool(form.keralaAccommodation) : null,
    kerala_airport_pickup: form.attendingKerala ? toBool(form.keralaAirportPickup) : null,
    kerala_train_pickup: form.attendingKerala ? toBool(form.keralaTrainPickup) : null,
    kerala_train_pickup_station:
      form.attendingKerala && isYes(form.keralaTrainPickup)
        ? form.keralaTrainPickupStation.trim() || null
        : null,
    special_notes: form.specialNotes.trim() || null,
  };
}

type State = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY_STATIONS: string[] = [];

export default function RSVPForm({
  mode,
  initial,
  onSubmit,
  keralaNonVeg = false,
  kolkataRailwayStations = EMPTY_STATIONS,
  keralaRailwayStations = EMPTY_STATIONS,
  lenis,
  hiddenEvents = EMPTY_STATIONS,
}: RSVPFormProps) {
  const [form, setForm] = useState<RsvpFormData>({ ...emptyForm, ...initial });
  const [errors, setErrors] = useState<Partial<Record<keyof RsvpFormData, string>>>({});
  const [state, setState] = useState<State>('idle');
  const [serverError, setServerError] = useState<string>('');
  const [editUrl, setEditUrl] = useState<string | undefined>(undefined);
  const successRef = useRef<HTMLDivElement>(null);

  // Filter available options by hidden events
  const kolkataOptions = ALL_KOLKATA_OPTIONS.filter(
    (opt) => !hiddenEvents.includes(opt.value)
  );

  // When initial data changes (edit page finishes loading), re-seed the form.
  // Hidden events are automatically stripped from kolkataEvents.
  useEffect(() => {
    if (!initial) return;
    const visibleEvents = (initial.kolkataEvents ?? []).filter(
      (e) => !hiddenEvents.includes(e)
    );
    setForm({ ...emptyForm, ...initial, kolkataEvents: visibleEvents });
  }, [initial, hiddenEvents]);

  const updateField = useCallback(<K extends keyof RsvpFormData>(field: K, value: RsvpFormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const toggleKolkataEvent = useCallback((event: string) => {
    setForm((prev) => {
      const current = prev.kolkataEvents;
      const next = current.includes(event)
        ? current.filter((e) => e !== event)
        : [...current, event];
      return { ...prev, kolkataEvents: next };
    });
    setErrors((prev) => {
      if (!prev.kolkataEvents) return prev;
      const next = { ...prev };
      delete next.kolkataEvents;
      return next;
    });
  }, []);

  const kolkataNeedsTravelInfo =
    form.attendingKolkata &&
    (isYes(form.kolkataAccommodation) ||
      isYes(form.kolkataAirportPickup) ||
      isYes(form.kolkataTrainPickup));
  const keralaNeedsTravelInfo =
    form.attendingKerala &&
    (isYes(form.keralaAccommodation) ||
      isYes(form.keralaAirportPickup) ||
      isYes(form.keralaTrainPickup));

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof RsvpFormData, string>> = {};
    if (!form.fullName.trim()) newErrors.fullName = 'Please enter your full name';
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!form.attendingKolkata && !form.attendingKerala && !form.notAttending) {
      newErrors.attendingKolkata =
        'Please tell us if you can join either celebration, or pick "I won\'t be able to attend"';
    }
    // Require at least one event only when there are visible options to choose from
    if (form.attendingKolkata && kolkataOptions.length > 0 && form.kolkataEvents.length === 0) {
      newErrors.kolkataEvents = 'Please select at least one Kolkata event';
    }
    if (keralaNonVeg && form.attendingKerala && !form.dietary) {
      newErrors.dietary = 'Please select your meal preference for the reception';
    }

    if (
      form.attendingKolkata &&
      isYes(form.kolkataTrainPickup) &&
      kolkataRailwayStations.length > 1 &&
      !form.kolkataTrainPickupStation
    ) {
      newErrors.kolkataTrainPickupStation = 'Please choose your pickup station';
    }
    if (
      form.attendingKerala &&
      isYes(form.keralaTrainPickup) &&
      keralaRailwayStations.length > 1 &&
      !form.keralaTrainPickupStation
    ) {
      newErrors.keralaTrainPickupStation = 'Please choose your pickup station';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setState('submitting');
    setServerError('');

    const payload = buildPayload(form, kolkataNeedsTravelInfo, keralaNeedsTravelInfo);
    const result = await onSubmit(payload);

    if (!result.ok) {
      setServerError(result.error);
      setState('error');
      return;
    }

    setEditUrl(result.editUrl);
    setState('success');
  };

  useEffect(() => {
    if (state !== 'success' || !successRef.current) return;
    const successEl = successRef.current;
    const section = successEl.closest('section') as HTMLElement | null;
    const scrollTarget = section ?? successEl;
    const navOffset = 60;

    if (lenis) {
      lenis.scrollTo(scrollTarget, { offset: -navOffset });
    } else {
      const top = scrollTarget.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    gsap.fromTo(
      successEl,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    const rafId = requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
    return () => cancelAnimationFrame(rafId);
  }, [state, lenis]);

  const isSubmitting = state === 'submitting';
  const submitLabel =
    mode === 'create'
      ? isSubmitting
        ? 'Submitting...'
        : 'Submit RSVP'
      : isSubmitting
      ? 'Saving...'
      : 'Save Changes';

  if (state === 'success') {
    return (
      <div ref={successRef} className="text-center py-16 opacity-0">
        <div className="w-12 h-12 rounded-full border-2 border-[#C4A055] flex items-center justify-center mx-auto mb-5">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#C4A055" strokeWidth="2">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-serif-display text-[28px] text-white mb-3">
          {mode === 'create' ? 'Thank You!' : 'Changes Saved'}
        </h3>
        <p className="font-sans-body text-base text-white/80 max-w-[480px] mx-auto">
          {mode === 'create'
            ? form.notAttending
              ? "Thank you for letting us know — we'll miss you. We'll keep you in our thoughts on the day."
              : "We're so grateful you'll be celebrating with us. We'll be in touch soon with more details."
            : 'Your RSVP has been updated. Thanks for letting us know!'}
        </p>
        {mode === 'create' && editUrl && (
          <div className="mt-8 mx-auto max-w-[480px] p-5 bg-white/[0.06] rounded-[4px] border border-white/15">
            <p className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] text-[#C4A055] mb-2">
              Need to make changes later?
            </p>
            <p className="font-sans-body text-sm text-white/75 leading-relaxed mb-3">
              Bookmark this private link to edit your RSVP at any time.
              {form.email.trim() && " We've also emailed it to you."}
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={editUrl}
                onFocus={(e) => e.currentTarget.select()}
                className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-[2px] px-3 py-2 font-sans-body text-[13px] text-white"
              />
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(editUrl)}
                className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#C4A055] hover:text-white px-3 py-2 transition-colors duration-200"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const kolkataDateRange = getKolkataDateRange(hiddenEvents);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#F5F1EB] rounded-[4px] p-8 md:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.15)]"
    >
      {/* Error banner */}
      {state === 'error' && (
        <div className="mb-6 p-4 bg-[#7B2D41]/10 border border-[#7B2D41]/30 rounded-[2px]">
          <p className="font-sans-body text-sm text-[#7B2D41]">
            {serverError || 'Something went wrong while submitting.'} Please try again, or message us at{' '}
            <a href="tel:+918373987643" className="underline">+91-8373987643</a>{' '}
            /{' '}
            <a href="mailto:support@ankhil.club" className="underline">support@ankhil.club</a>.
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
            <label className={labelClasses}>Phone (preferably WhatsApp)</label>
            <input
              type="tel"
              inputMode="tel"
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
            <label className={labelClasses}>Email (optional)</label>
            <input
              type="email"
              placeholder="your@email.com"
              className={inputClasses}
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
              disabled={isSubmitting}
            />
            <p className="font-sans-body text-[11px] text-[#3B2F2F]/55 mt-1.5">
              We&rsquo;ll email you a confirmation and a link to edit your RSVP later.
            </p>
            {errors.email && <p className="text-xs text-[#7B2D41] mt-1">{errors.email}</p>}
          </div>

          {/* Guest Count */}
          <div className="md:col-span-2">
            <label className={labelClasses}>Number of Guests *</label>
            <select
              className={inputClasses + ' appearance-none cursor-pointer md:max-w-[200px]'}
              value={form.guestCount}
              onChange={(e) => updateField('guestCount', e.target.value)}
              disabled={isSubmitting}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <p className="font-sans-body text-[11px] text-[#3B2F2F]/55 mt-1.5">
              Total people in your party, including yourself.
            </p>
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
                onChange={(e) => {
                  if (e.target.checked && form.notAttending) updateField('notAttending', false);
                  updateField('attendingKolkata', e.target.checked);
                }}
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
              <p className="font-sans-body text-xs text-[#3B2F2F]/60">{kolkataDateRange}</p>
            </div>
          </label>

          <label htmlFor="attending-kerala" className="flex items-start gap-3 cursor-pointer group">
            <div className="relative w-4 h-4 mt-0.5">
              <input
                id="attending-kerala"
                type="checkbox"
                checked={form.attendingKerala}
                onChange={(e) => {
                  if (e.target.checked && form.notAttending) updateField('notAttending', false);
                  updateField('attendingKerala', e.target.checked);
                }}
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
                Pala reception
              </span>
              <p className="font-sans-body text-xs text-[#3B2F2F]/60">July 25, 2026 · Pala / Kottayam</p>
            </div>
          </label>

          {/* Regrets — mutually exclusive with the two city checkboxes. */}
          <label htmlFor="not-attending" className="flex items-start gap-3 cursor-pointer group pt-2 border-t border-[rgba(59,47,47,0.08)]">
            <div className="relative w-4 h-4 mt-0.5">
              <input
                id="not-attending"
                type="checkbox"
                checked={form.notAttending}
                onChange={(e) => {
                  if (e.target.checked) {
                    if (form.attendingKolkata) updateField('attendingKolkata', false);
                    if (form.attendingKerala) updateField('attendingKerala', false);
                  }
                  updateField('notAttending', e.target.checked);
                }}
                disabled={isSubmitting}
                className="peer absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div className="w-4 h-4 border border-[rgba(59,47,47,0.3)] rounded-[2px] peer-checked:bg-[#7B2D41] peer-checked:border-[#7B2D41] transition-colors duration-200 flex items-center justify-center pointer-events-none">
                <svg className={`w-2.5 h-2.5 text-white transition-opacity duration-200 ${form.notAttending ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              </div>
            </div>
            <div>
              <span className="font-sans-body text-[15px] text-[#3B2F2F] group-hover:text-[#7B2D41] transition-colors duration-200">
                I won&rsquo;t be able to attend
              </span>
              <p className="font-sans-body text-xs text-[#3B2F2F]/60">We&rsquo;ll miss you. Leave a note below if you&rsquo;d like.</p>
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

          {kolkataOptions.length > 0 && (
            <div className="mb-5">
              <label className={labelClasses}>Events you&apos;ll attend *</label>
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
          )}

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

          <div className="mb-5">
            <label className={labelClasses}>Airport Pickup</label>
            <RadioGroup
              name="kolkata-pickup"
              options={['Yes, I need airport pickup', 'No, I\'ll arrange my own transport']}
              value={form.kolkataAirportPickup}
              onChange={(val) => updateField('kolkataAirportPickup', val)}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-5">
            <label className={labelClasses}>Train Station Pickup</label>
            <RadioGroup
              name="kolkata-train-pickup"
              options={['Yes, I need train station pickup', 'No, I\'ll arrange my own transport']}
              value={form.kolkataTrainPickup}
              onChange={(val) => updateField('kolkataTrainPickup', val)}
              disabled={isSubmitting}
            />
            {kolkataRailwayStations.length > 0 && (
              <p className="font-sans-body text-[11px] text-[#3B2F2F]/55 mt-2">
                {kolkataRailwayStations.length === 1 ? (
                  <>
                    If yes, we&rsquo;ll arrange pickup from{' '}
                    <span className="text-[#3B2F2F]/75 font-semibold">{kolkataRailwayStations[0]}</span>.
                  </>
                ) : (
                  <>
                    Nearest stations:{' '}
                    <span className="text-[#3B2F2F]/75 font-semibold">{kolkataRailwayStations.join(', ')}</span>.
                  </>
                )}
              </p>
            )}
            {isYes(form.kolkataTrainPickup) && kolkataRailwayStations.length > 1 && (
              <div className="mt-3">
                <label className={labelClasses}>Pickup station *</label>
                <select
                  className={inputClasses + ' appearance-none cursor-pointer'}
                  value={form.kolkataTrainPickupStation}
                  onChange={(e) => updateField('kolkataTrainPickupStation', e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Choose a station...</option>
                  {kolkataRailwayStations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.kolkataTrainPickupStation && (
                  <p className="text-xs text-[#7B2D41] mt-1">{errors.kolkataTrainPickupStation}</p>
                )}
              </div>
            )}
          </div>

          {kolkataNeedsTravelInfo && (
            <div className="mt-6 pt-6 border-t border-[rgba(196,160,85,0.25)]">
              <p className="font-sans-body text-[13px] text-[#3B2F2F]/70 mb-4">
                To help us coordinate{' '}
                {[
                  isYes(form.kolkataAccommodation) && 'accommodation',
                  (isYes(form.kolkataAirportPickup) || isYes(form.kolkataTrainPickup)) &&
                    'your pickup',
                ]
                  .filter(Boolean)
                  .join(' and ')}
                , please share your expected travel dates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>Expected Arrival</label>
                  <DateTimePicker
                    value={form.kolkataArrival}
                    onChange={(val) => updateField('kolkataArrival', val)}
                    disabled={isSubmitting}
                    fallback={SUGGESTED.kolkataArrival}
                  />
                  <SuggestedChip
                    iso={SUGGESTED.kolkataArrival}
                    onApply={() => updateField('kolkataArrival', SUGGESTED.kolkataArrival)}
                    disabled={isSubmitting}
                  />
                  {errors.kolkataArrival && (
                    <p className="text-xs text-[#7B2D41] mt-1">{errors.kolkataArrival}</p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Expected Departure</label>
                  <DateTimePicker
                    value={form.kolkataDeparture}
                    onChange={(val) => updateField('kolkataDeparture', val)}
                    disabled={isSubmitting}
                    fallback={SUGGESTED.kolkataDeparture}
                  />
                  <SuggestedChip
                    iso={SUGGESTED.kolkataDeparture}
                    onApply={() => updateField('kolkataDeparture', SUGGESTED.kolkataDeparture)}
                    disabled={isSubmitting}
                  />
                  {errors.kolkataDeparture && (
                    <p className="text-xs text-[#7B2D41] mt-1">{errors.kolkataDeparture}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Kerala Section --- */}
      {form.attendingKerala && (
        <div className="mb-8 p-6 md:p-8 bg-[rgba(61,107,91,0.06)] rounded-[4px] border border-[rgba(61,107,91,0.15)]">
          <h3 className="font-serif-display text-lg text-[#3B2F2F] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3D6B5B]" />
            Pala Details
          </h3>

          {keralaNonVeg && (
            <div className="mb-5">
              <label className={labelClasses}>Meal preference for the reception *</label>
              <RadioGroup
                name="kerala-dietary"
                options={['Vegetarian', 'Non-Vegetarian']}
                value={
                  form.dietary === 'veg'
                    ? 'Vegetarian'
                    : form.dietary === 'non-veg'
                    ? 'Non-Vegetarian'
                    : ''
                }
                onChange={(val) =>
                  updateField('dietary', val === 'Vegetarian' ? 'veg' : 'non-veg')
                }
                disabled={isSubmitting}
              />
              <p className="font-sans-body text-[11px] text-[#3B2F2F]/55 mt-2">
                Kolkata events are fully vegetarian. The Pala reception has both options.
              </p>
              {errors.dietary && (
                <p className="text-xs text-[#7B2D41] mt-1">{errors.dietary}</p>
              )}
            </div>
          )}

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

          <div className="mb-5">
            <label className={labelClasses}>Airport Pickup</label>
            <RadioGroup
              name="kerala-pickup"
              options={['Yes, I need airport pickup', 'No, I\'ll arrange my own transport']}
              value={form.keralaAirportPickup}
              onChange={(val) => updateField('keralaAirportPickup', val)}
              disabled={isSubmitting}
            />
          </div>

          <div className="mb-5">
            <label className={labelClasses}>Train Station Pickup</label>
            <RadioGroup
              name="kerala-train-pickup"
              options={['Yes, I need train station pickup', 'No, I\'ll arrange my own transport']}
              value={form.keralaTrainPickup}
              onChange={(val) => updateField('keralaTrainPickup', val)}
              disabled={isSubmitting}
            />
            {keralaRailwayStations.length > 0 && (
              <p className="font-sans-body text-[11px] text-[#3B2F2F]/55 mt-2">
                {keralaRailwayStations.length === 1 ? (
                  <>
                    If yes, we&rsquo;ll arrange pickup from{' '}
                    <span className="text-[#3B2F2F]/75 font-semibold">{keralaRailwayStations[0]}</span>.
                  </>
                ) : (
                  <>
                    Nearest stations:{' '}
                    <span className="text-[#3B2F2F]/75 font-semibold">{keralaRailwayStations.join(', ')}</span>.
                  </>
                )}
              </p>
            )}
            {isYes(form.keralaTrainPickup) && keralaRailwayStations.length > 1 && (
              <div className="mt-3">
                <label className={labelClasses}>Pickup station *</label>
                <select
                  className={inputClasses + ' appearance-none cursor-pointer'}
                  value={form.keralaTrainPickupStation}
                  onChange={(e) => updateField('keralaTrainPickupStation', e.target.value)}
                  disabled={isSubmitting}
                >
                  <option value="">Choose a station...</option>
                  {keralaRailwayStations.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                {errors.keralaTrainPickupStation && (
                  <p className="text-xs text-[#7B2D41] mt-1">{errors.keralaTrainPickupStation}</p>
                )}
              </div>
            )}
          </div>

          {keralaNeedsTravelInfo && (
            <div className="mt-6 pt-6 border-t border-[rgba(61,107,91,0.25)]">
              <p className="font-sans-body text-[13px] text-[#3B2F2F]/70 mb-4">
                To help us coordinate{' '}
                {[
                  isYes(form.keralaAccommodation) && 'accommodation',
                  (isYes(form.keralaAirportPickup) || isYes(form.keralaTrainPickup)) &&
                    'your pickup',
                ]
                  .filter(Boolean)
                  .join(' and ')}
                , please share your expected travel dates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={labelClasses}>Expected Arrival</label>
                  <DateTimePicker
                    value={form.keralaArrival}
                    onChange={(val) => updateField('keralaArrival', val)}
                    disabled={isSubmitting}
                    fallback={SUGGESTED.keralaArrival}
                  />
                  <SuggestedChip
                    iso={SUGGESTED.keralaArrival}
                    onApply={() => updateField('keralaArrival', SUGGESTED.keralaArrival)}
                    disabled={isSubmitting}
                  />
                  {errors.keralaArrival && (
                    <p className="text-xs text-[#7B2D41] mt-1">{errors.keralaArrival}</p>
                  )}
                </div>
                <div>
                  <label className={labelClasses}>Expected Departure</label>
                  <DateTimePicker
                    value={form.keralaDeparture}
                    onChange={(val) => updateField('keralaDeparture', val)}
                    disabled={isSubmitting}
                    fallback={SUGGESTED.keralaDeparture}
                  />
                  <SuggestedChip
                    iso={SUGGESTED.keralaDeparture}
                    onApply={() => updateField('keralaDeparture', SUGGESTED.keralaDeparture)}
                    disabled={isSubmitting}
                  />
                  {errors.keralaDeparture && (
                    <p className="text-xs text-[#7B2D41] mt-1">{errors.keralaDeparture}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- Special Notes --- */}
      <div className="mb-6">
        <label className={labelClasses}>Special Notes</label>
        <textarea
          placeholder="Allergies, accessibility needs, or anything else we should know..."
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
        {submitLabel}
      </button>
    </form>
  );
}
