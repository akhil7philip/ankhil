import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import RSVPForm, { type RsvpFormData, type RsvpPayload, type SubmitResult } from '@/components/RSVPForm';
import { supabase } from '@/lib/supabase';

interface RsvpRow {
  full_name: string;
  phone: string;
  email: string | null;
  dietary: string | null;
  guest_count: number | null;
  attending_kolkata: boolean | null;
  kolkata_events: string[] | null;
  kolkata_arrival: string | null;
  kolkata_departure: string | null;
  kolkata_accommodation: boolean | null;
  kolkata_airport_pickup: boolean | null;
  kolkata_train_pickup: boolean | null;
  kolkata_train_pickup_station: string | null;
  attending_kerala: boolean | null;
  kerala_arrival: string | null;
  kerala_departure: string | null;
  kerala_accommodation: boolean | null;
  kerala_airport_pickup: boolean | null;
  kerala_train_pickup: boolean | null;
  kerala_train_pickup_station: string | null;
  special_notes: string | null;
}

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function accommodationLabel(b: boolean | null): string {
  if (b === true) return 'Yes, I need accommodation help';
  if (b === false) return "No, I've arranged my own";
  return '';
}

function pickupLabel(b: boolean | null): string {
  if (b === true) return 'Yes, I need airport pickup';
  if (b === false) return "No, I'll arrange my own transport";
  return '';
}

function trainPickupLabel(b: boolean | null): string {
  if (b === true) return 'Yes, I need train station pickup';
  if (b === false) return "No, I'll arrange my own transport";
  return '';
}

function rowToFormData(row: RsvpRow): Partial<RsvpFormData> {
  return {
    fullName: row.full_name ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    guestCount: String(row.guest_count ?? 1),
    dietary: (row.dietary === 'veg' || row.dietary === 'non-veg' ? row.dietary : '') as RsvpFormData['dietary'],
    attendingKolkata: Boolean(row.attending_kolkata),
    attendingKerala: Boolean(row.attending_kerala),
    kolkataEvents: row.kolkata_events ?? [],
    kolkataAccommodation: accommodationLabel(row.kolkata_accommodation),
    kolkataAirportPickup: pickupLabel(row.kolkata_airport_pickup),
    kolkataTrainPickup: trainPickupLabel(row.kolkata_train_pickup),
    kolkataTrainPickupStation: row.kolkata_train_pickup_station ?? '',
    kolkataArrival: toLocalDatetime(row.kolkata_arrival),
    kolkataDeparture: toLocalDatetime(row.kolkata_departure),
    keralaAccommodation: accommodationLabel(row.kerala_accommodation),
    keralaAirportPickup: pickupLabel(row.kerala_airport_pickup),
    keralaTrainPickup: trainPickupLabel(row.kerala_train_pickup),
    keralaTrainPickupStation: row.kerala_train_pickup_station ?? '',
    keralaArrival: toLocalDatetime(row.kerala_arrival),
    keralaDeparture: toLocalDatetime(row.kerala_departure),
    specialNotes: row.special_notes ?? '',
  };
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: Partial<RsvpFormData>; name: string }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string };

// Matches the key in AdminPage. When this is set in sessionStorage the
// current tab/session belongs to the authenticated admin, so the back
// link should return to /admin instead of the public home page.
const ADMIN_AUTH_KEY = 'ankhil-admin-auth';

export default function RSVPEditPage() {
  const { token } = useParams<{ token: string }>();
  const [load, setLoad] = useState<LoadState>({ kind: 'loading' });
  const [keralaNonVeg, setKeralaNonVeg] = useState(false);
  const [kolkataRailwayStations, setKolkataRailwayStations] = useState<string[]>([]);
  const [keralaRailwayStations, setKeralaRailwayStations] = useState<string[]>([]);
  const isAdmin =
    typeof window !== 'undefined' &&
    window.sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  const backHref = isAdmin ? '/admin' : '/';
  const backLabel = isAdmin ? 'admin' : 'home';

  useEffect(() => {
    let cancelled = false;
    async function fetchRsvp() {
      if (!token) {
        setLoad({ kind: 'not-found' });
        return;
      }
      const { data, error } = await supabase.rpc('get_rsvp_by_token', { p_token: token });
      if (cancelled) return;
      if (error) {
        console.error('get_rsvp_by_token error:', error);
        setLoad({ kind: 'error', message: error.message });
        return;
      }
      const row: RsvpRow | undefined = Array.isArray(data) ? data[0] : data;
      if (!row) {
        setLoad({ kind: 'not-found' });
        return;
      }
      setLoad({ kind: 'ready', data: rowToFormData(row), name: row.full_name ?? '' });
    }
    fetchRsvp();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Pick up the Kerala non-veg toggle and pickup-station strings so the
  // form mirrors what a fresh submission would see.
  useEffect(() => {
    let cancelled = false;
    async function loadConfig() {
      const { data } = await supabase
        .from('site_config')
        .select('kerala_non_veg, kolkata_railway_stations, kerala_railway_stations')
        .maybeSingle();
      if (cancelled || !data) return;
      setKeralaNonVeg(Boolean(data.kerala_non_veg));
      setKolkataRailwayStations(
        Array.isArray(data.kolkata_railway_stations) ? data.kolkata_railway_stations : []
      );
      setKeralaRailwayStations(
        Array.isArray(data.kerala_railway_stations) ? data.kerala_railway_stations : []
      );
    }
    loadConfig();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (payload: RsvpPayload): Promise<SubmitResult> => {
    if (!token) return { ok: false, error: 'Missing edit token.' };
    const { error } = await supabase.rpc('update_rsvp_by_token', {
      p_token: token,
      p_payload: payload,
    });
    if (error) {
      console.error('update_rsvp_by_token error:', error);
      return { ok: false, error: 'Something went wrong while saving your changes.' };
    }
    return { ok: true };
  };

  return (
    <section className="bg-[#3B2F2F] min-h-screen py-[60px] md:py-[100px] px-5 md:px-10">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-8 md:mb-12">
          <Link
            to={backHref}
            className="font-sans-body text-xs font-semibold uppercase tracking-[0.15em] text-white/60 hover:text-[#C4A055] transition-colors duration-200"
          >
            &larr; Back to {backLabel}
          </Link>
        </div>

        <p className="section-label-light mb-3 md:mb-4">Edit RSVP</p>
        <h1 className="section-heading-light mb-2">
          {load.kind === 'ready' && load.name
            ? `Welcome back, ${load.name.split(' ')[0]}`
            : 'Update Your RSVP'}
        </h1>
        <p className="font-sans-body text-base text-white/70 mb-8 md:mb-12">
          Change anything you need to. Your update will reach us right away.
        </p>

        {load.kind === 'loading' && (
          <div className="bg-[#F5F1EB] rounded-[4px] p-10 text-center">
            <p className="font-sans-body text-sm text-[#3B2F2F]/60">Loading your RSVP…</p>
          </div>
        )}

        {load.kind === 'not-found' && (
          <div className="bg-[#F5F1EB] rounded-[4px] p-10 text-center">
            <h2 className="font-serif-display text-2xl text-[#3B2F2F] mb-3">
              We couldn&rsquo;t find that RSVP
            </h2>
            <p className="font-sans-body text-sm text-[#3B2F2F]/70 max-w-[420px] mx-auto">
              The link may have been mistyped, or your RSVP record may have been removed. If you
              think this is an error, please message us at{' '}
              <a href="tel:+918373987643" className="underline hover:text-[#C4A055]">+91-8373987643</a>{' '}
              or{' '}
              <a href="mailto:support@ankhil.club" className="underline hover:text-[#C4A055]">support@ankhil.club</a>.
            </p>
            <Link
              to={isAdmin ? '/admin' : '/#rsvp'}
              className="inline-block mt-6 bg-[#3B2F2F] text-white font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-8 py-3 hover:bg-[#C4A055] transition-colors duration-300"
            >
              {isAdmin ? 'Back to admin' : 'Submit a new RSVP'}
            </Link>
          </div>
        )}

        {load.kind === 'error' && (
          <div className="bg-[#F5F1EB] rounded-[4px] p-10 text-center">
            <h2 className="font-serif-display text-2xl text-[#3B2F2F] mb-3">Something went wrong</h2>
            <p className="font-sans-body text-sm text-[#3B2F2F]/70">{load.message}</p>
          </div>
        )}

        {load.kind === 'ready' && (
          <RSVPForm
            mode="edit"
            initial={load.data}
            onSubmit={handleSubmit}
            keralaNonVeg={keralaNonVeg}
            kolkataRailwayStations={kolkataRailwayStations}
            keralaRailwayStations={keralaRailwayStations}
          />
        )}
      </div>
    </section>
  );
}
