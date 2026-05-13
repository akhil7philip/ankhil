import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface RSVP {
  id: string;
  created_at: string;
  edit_token: string;
  full_name: string;
  phone: string;
  email: string | null;
  dietary: string | null;
  guest_count: number;
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

const ADMIN_AUTH_KEY = 'ankhil-admin-auth';

function formatDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatShortDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function eventLabel(value: string) {
  const map: Record<string, string> = {
    // Current schedule
    mehendi: 'Mehendi',
    haldi: 'Haldi',
    sangeet: 'Musical Night',
    varmala: 'Varmala & Reception',
    pheras: 'Wedding (Pheras)',
    // Legacy values from RSVPs submitted before the schedule was rewritten
    reception: 'Reception (legacy)',
    'mehendi-haldi': 'Mehendi/Haldi/Sangeet (legacy)',
    wedding: 'Wedding (legacy)',
  };
  return map[value] || value;
}

function BoolBadge({ val, label }: { val: boolean | null; label?: string }) {
  const prefix = label ? `${label}: ` : '';
  if (val === true)
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#3D6B5B] bg-[#3D6B5B]/10 px-2 py-0.5 rounded">
        {prefix}Yes
      </span>
    );
  if (val === false)
    return (
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7B2D41] bg-[#7B2D41]/10 px-2 py-0.5 rounded">
        {prefix}No
      </span>
    );
  return <span className="text-[10px] text-[#3B2F2F]/40">{prefix}—</span>;
}

interface SiteConfig {
  rsvp_open: boolean;
  rsvp_closed_message: string | null;
  kolkata_venue: string | null;
  kolkata_map_url: string | null;
  kolkata_railway_stations: string[] | null;
  kerala_venue: string | null;
  kerala_map_url: string | null;
  kerala_railway_stations: string[] | null;
  kerala_non_veg: boolean;
  faq_visible: boolean;
  updated_at: string;
}

const CONFIG_SELECT =
  'rsvp_open, rsvp_closed_message, kolkata_venue, kolkata_map_url, kolkata_railway_stations, kerala_venue, kerala_map_url, kerala_railway_stations, kerala_non_veg, faq_visible, updated_at';

interface VenueFormState {
  kolkataVenue: string;
  kolkataMapUrl: string;
  /** One station per line. Empty lines are dropped on save. */
  kolkataRailwayStationsText: string;
  keralaVenue: string;
  keralaMapUrl: string;
  keralaRailwayStationsText: string;
}

function stationsToText(arr: string[] | null | undefined): string {
  return (arr ?? []).join('\n');
}

function textToStations(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(ADMIN_AUTH_KEY) === 'true';
  });
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [rsvps, setRsvps] = useState<RSVP[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [configBusy, setConfigBusy] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const expectedPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'ankhil2026';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === expectedPassword) {
      sessionStorage.setItem(ADMIN_AUTH_KEY, 'true');
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_AUTH_KEY);
    setIsAuthenticated(false);
    setRsvps([]);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setRsvps(data || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchConfig = async () => {
      const { data, error } = await supabase
        .from('site_config')
        .select(CONFIG_SELECT)
        .maybeSingle();
      if (error) {
        setConfigError(error.message);
      } else if (data) {
        setConfig(data);
        setVenueForm({
          kolkataVenue: data.kolkata_venue ?? '',
          kolkataMapUrl: data.kolkata_map_url ?? '',
          kolkataRailwayStationsText: stationsToText(data.kolkata_railway_stations),
          keralaVenue: data.kerala_venue ?? '',
          keralaMapUrl: data.kerala_map_url ?? '',
          keralaRailwayStationsText: stationsToText(data.kerala_railway_stations),
        });
      }
    };
    fetchConfig();
  }, [isAuthenticated]);

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteBusyId, setDeleteBusyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [venueForm, setVenueForm] = useState<VenueFormState | null>(null);
  const [venueBusy, setVenueBusy] = useState(false);
  const [venueError, setVenueError] = useState<string | null>(null);
  const [venueSaved, setVenueSaved] = useState(false);

  const [keralaNonVegBusy, setKeralaNonVegBusy] = useState(false);
  const [keralaNonVegError, setKeralaNonVegError] = useState<string | null>(null);

  const [faqBusy, setFaqBusy] = useState(false);
  const [faqError, setFaqError] = useState<string | null>(null);

  const handleDelete = async (rsvp: RSVP) => {
    setDeleteBusyId(rsvp.id);
    setDeleteError(null);
    const { error } = await supabase.from('rsvps').delete().eq('id', rsvp.id);
    setDeleteBusyId(null);
    if (error) {
      setDeleteError(`Could not delete ${rsvp.full_name}: ${error.message}`);
      return;
    }
    setRsvps((prev) => prev.filter((r) => r.id !== rsvp.id));
    setPendingDeleteId(null);
  };

  const saveVenues = async () => {
    if (!venueForm) return;
    setVenueBusy(true);
    setVenueError(null);
    setVenueSaved(false);
    const { data, error } = await supabase
      .from('site_config')
      .update({
        kolkata_venue: venueForm.kolkataVenue.trim() || null,
        kolkata_map_url: venueForm.kolkataMapUrl.trim() || null,
        kolkata_railway_stations: textToStations(venueForm.kolkataRailwayStationsText),
        kerala_venue: venueForm.keralaVenue.trim() || null,
        kerala_map_url: venueForm.keralaMapUrl.trim() || null,
        kerala_railway_stations: textToStations(venueForm.keralaRailwayStationsText),
      })
      .eq('id', true)
      .select(CONFIG_SELECT)
      .maybeSingle();
    setVenueBusy(false);
    if (error) {
      setVenueError(error.message);
      return;
    }
    if (data) {
      setConfig(data);
      setVenueForm({
        kolkataVenue: data.kolkata_venue ?? '',
        kolkataMapUrl: data.kolkata_map_url ?? '',
        kolkataRailwayStationsText: stationsToText(data.kolkata_railway_stations),
        keralaVenue: data.kerala_venue ?? '',
        keralaMapUrl: data.kerala_map_url ?? '',
        keralaRailwayStationsText: stationsToText(data.kerala_railway_stations),
      });
      setVenueSaved(true);
      setTimeout(() => setVenueSaved(false), 2500);
    }
  };

  const toggleFaqVisible = async () => {
    if (!config) return;
    const next = !config.faq_visible;
    setFaqBusy(true);
    setFaqError(null);
    const { data, error } = await supabase
      .from('site_config')
      .update({ faq_visible: next })
      .eq('id', true)
      .select(CONFIG_SELECT)
      .maybeSingle();
    setFaqBusy(false);
    if (error) {
      setFaqError(error.message);
      return;
    }
    if (data) setConfig(data);
  };

  const toggleKeralaNonVeg = async () => {
    if (!config) return;
    const next = !config.kerala_non_veg;
    setKeralaNonVegBusy(true);
    setKeralaNonVegError(null);
    const { data, error } = await supabase
      .from('site_config')
      .update({ kerala_non_veg: next })
      .eq('id', true)
      .select(CONFIG_SELECT)
      .maybeSingle();
    setKeralaNonVegBusy(false);
    if (error) {
      setKeralaNonVegError(error.message);
      return;
    }
    if (data) setConfig(data);
  };

  const toggleRsvpOpen = async () => {
    if (!config) return;
    const next = !config.rsvp_open;
    setConfigBusy(true);
    setConfigError(null);
    const { data, error } = await supabase
      .from('site_config')
      .update({ rsvp_open: next })
      .eq('id', true)
      .select(CONFIG_SELECT)
      .maybeSingle();
    if (error) {
      setConfigError(error.message);
    } else if (data) {
      setConfig(data);
    }
    setConfigBusy(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#3B2F2F] flex items-center justify-center px-5">
        <div className="bg-[#F5F1EB] rounded-[4px] p-8 md:p-12 w-full max-w-[400px] shadow-[0_4px_24px_rgba(0,0,0,0.2)]">
          <h1 className="font-serif-display text-2xl text-[#3B2F2F] mb-1">Admin Access</h1>
          <p className="font-sans-body text-sm text-[#3B2F2F]/70 mb-6">
            Enter the password to view RSVP submissions.
          </p>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError(false);
              }}
              className="w-full bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-4 py-3 font-sans-body text-[15px] text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200 mb-4"
            />
            {passwordError && (
              <p className="text-xs text-[#7B2D41] mb-3">Incorrect password.</p>
            )}
            <button
              type="submit"
              className="w-full bg-[#3B2F2F] text-white font-sans-body text-xs font-semibold uppercase tracking-[0.12em] py-3.5 hover:bg-[#C4A055] transition-colors duration-300"
            >
              Enter
            </button>
          </form>
          <Link
            to="/"
            className="block text-center mt-5 font-sans-body text-xs text-[#3B2F2F]/60 hover:text-[#C4A055] transition-colors"
          >
            ← Back to wedding site
          </Link>
        </div>
      </div>
    );
  }

  const total = rsvps.length;
  const kolkataCount = rsvps.filter((r) => r.attending_kolkata).length;
  const keralaCount = rsvps.filter((r) => r.attending_kerala).length;
  const bothCount = rsvps.filter((r) => r.attending_kolkata && r.attending_kerala).length;

  return (
    <div className="min-h-screen bg-[#F5F1EB]">
      {/* Header */}
      <header className="bg-[#3B2F2F] px-5 md:px-10 py-5">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif-display text-xl text-white">RSVP Submissions</h1>
            <p className="font-sans-body text-xs text-white/60 mt-0.5">
              {total} total · {kolkataCount} Kolkata · {keralaCount} Kerala · {bothCount} Both
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.reload()}
              className="font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-white/80 hover:text-[#C4A055] transition-colors"
            >
              Refresh
            </button>
            <Link
              to="/"
              className="font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-white/80 hover:text-[#C4A055] transition-colors"
            >
              Wedding Site
            </Link>
            <button
              onClick={handleLogout}
              className="font-sans-body text-xs font-semibold uppercase tracking-[0.1em] text-white/80 hover:text-[#C4A055] transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-5 md:px-10 py-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Site config card */}
          <div className="mb-6 p-5 bg-white border border-[rgba(59,47,47,0.1)] rounded-[2px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/60 mb-1">
                RSVP Form
              </p>
              {config ? (
                <>
                  <p className="font-sans-body text-sm text-[#3B2F2F]">
                    {config.rsvp_open ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#3D6B5B] mr-2 align-middle" />
                        Open &mdash; guests can submit new RSVPs.
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#7B2D41] mr-2 align-middle" />
                        Closed &mdash; new submissions blocked; existing guests can still edit via their token link.
                      </>
                    )}
                  </p>
                  <p className="font-sans-body text-[11px] text-[#3B2F2F]/50 mt-1">
                    Last changed {formatDate(config.updated_at)}
                  </p>
                </>
              ) : configError ? (
                <p className="font-sans-body text-xs text-[#7B2D41]">
                  Could not load site config: {configError}
                </p>
              ) : (
                <p className="font-sans-body text-xs text-[#3B2F2F]/50">Loading site config...</p>
              )}
            </div>
            {config && (
              <button
                onClick={toggleRsvpOpen}
                disabled={configBusy}
                className={`font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-6 py-3 transition-colors duration-300 disabled:opacity-60 self-start md:self-auto whitespace-nowrap ${
                  config.rsvp_open
                    ? 'bg-[#7B2D41] text-white hover:bg-[#3B2F2F]'
                    : 'bg-[#3D6B5B] text-white hover:bg-[#3B2F2F]'
                }`}
              >
                {configBusy
                  ? 'Saving...'
                  : config.rsvp_open
                  ? 'Close RSVPs'
                  : 'Open RSVPs'}
              </button>
            )}
          </div>

          {/* Venues card */}
          <div className="mb-6 p-5 bg-white border border-[rgba(59,47,47,0.1)] rounded-[2px]">
            <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/60 mb-4">
              Venues
            </p>

            {!venueForm ? (
              <p className="font-sans-body text-xs text-[#3B2F2F]/50">Loading venues...</p>
            ) : (
              <div className="space-y-5">
                {/* Kolkata */}
                <div>
                  <p className="font-sans-body text-sm font-semibold text-[#3B2F2F] mb-2 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#C4A055] mr-2" />
                    Kolkata events
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
                    <input
                      type="text"
                      value={venueForm.kolkataVenue}
                      onChange={(e) =>
                        setVenueForm({ ...venueForm, kolkataVenue: e.target.value })
                      }
                      placeholder="Venue (e.g. New Town, Kolkata)"
                      className="bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-3 py-2 font-sans-body text-sm text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200"
                    />
                    <input
                      type="url"
                      value={venueForm.kolkataMapUrl}
                      onChange={(e) =>
                        setVenueForm({ ...venueForm, kolkataMapUrl: e.target.value })
                      }
                      placeholder="Google Maps URL (optional)"
                      className="bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-3 py-2 font-sans-body text-sm text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200"
                    />
                  </div>
                  <div className="mt-3">
                    <textarea
                      value={venueForm.kolkataRailwayStationsText}
                      onChange={(e) =>
                        setVenueForm({ ...venueForm, kolkataRailwayStationsText: e.target.value })
                      }
                      rows={3}
                      placeholder={'Nearest railway stations — one per line\nSealdah Railway Station\nHowrah Railway Station'}
                      className="w-full bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-3 py-2 font-sans-body text-sm text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200 resize-y"
                    />
                    <p className="font-sans-body text-[11px] text-[#3B2F2F]/55 mt-1">
                      One station per line. Guests choose from a dropdown when there are multiple.
                    </p>
                  </div>
                </div>

                {/* Kerala (Pala) */}
                <div>
                  <p className="font-sans-body text-sm font-semibold text-[#3B2F2F] mb-2 flex items-center">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#3D6B5B] mr-2" />
                    Kerala (Pala)
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-3">
                    <input
                      type="text"
                      value={venueForm.keralaVenue}
                      onChange={(e) =>
                        setVenueForm({ ...venueForm, keralaVenue: e.target.value })
                      }
                      placeholder="Venue (e.g. Pala, Kerala)"
                      className="bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-3 py-2 font-sans-body text-sm text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200"
                    />
                    <input
                      type="url"
                      value={venueForm.keralaMapUrl}
                      onChange={(e) =>
                        setVenueForm({ ...venueForm, keralaMapUrl: e.target.value })
                      }
                      placeholder="Google Maps URL (optional)"
                      className="bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-3 py-2 font-sans-body text-sm text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200"
                    />
                  </div>
                  <div className="mt-3">
                    <textarea
                      value={venueForm.keralaRailwayStationsText}
                      onChange={(e) =>
                        setVenueForm({ ...venueForm, keralaRailwayStationsText: e.target.value })
                      }
                      rows={3}
                      placeholder={'Nearest railway stations — one per line\nKottayam Railway Station'}
                      className="w-full bg-white border border-[rgba(59,47,47,0.15)] rounded-[2px] px-3 py-2 font-sans-body text-sm text-[#3B2F2F] placeholder:text-[#3B2F2F]/40 focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200 resize-y"
                    />
                    <p className="font-sans-body text-[11px] text-[#3B2F2F]/55 mt-1">
                      One station per line. Guests choose from a dropdown when there are multiple.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-1">
                  {venueError && (
                    <p className="font-sans-body text-xs text-[#7B2D41]">{venueError}</p>
                  )}
                  {venueSaved && !venueError && (
                    <p className="font-sans-body text-xs text-[#3D6B5B]">Saved.</p>
                  )}
                  <button
                    type="button"
                    onClick={saveVenues}
                    disabled={venueBusy}
                    className="font-sans-body text-xs font-semibold uppercase tracking-[0.12em] bg-[#3B2F2F] text-white px-6 py-2.5 hover:bg-[#C4A055] transition-colors duration-300 disabled:opacity-60"
                  >
                    {venueBusy ? 'Saving...' : 'Save venues'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* FAQ visibility card */}
          <div className="mb-6 p-5 bg-white border border-[rgba(59,47,47,0.1)] rounded-[2px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/60 mb-1">
                FAQ Section
              </p>
              {config ? (
                <>
                  <p className="font-sans-body text-sm text-[#3B2F2F]">
                    {config.faq_visible ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#3D6B5B] mr-2 align-middle" />
                        Visible &mdash; guests see the FAQ section and the FAQ nav link.
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#7B2D41] mr-2 align-middle" />
                        Hidden &mdash; the FAQ section is not rendered and the FAQ nav link is dropped.
                      </>
                    )}
                  </p>
                  {faqError && (
                    <p className="font-sans-body text-xs text-[#7B2D41] mt-1">{faqError}</p>
                  )}
                </>
              ) : (
                <p className="font-sans-body text-xs text-[#3B2F2F]/50">Loading...</p>
              )}
            </div>
            {config && (
              <button
                onClick={toggleFaqVisible}
                disabled={faqBusy}
                className={`font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-6 py-3 transition-colors duration-300 disabled:opacity-60 self-start md:self-auto whitespace-nowrap ${
                  config.faq_visible
                    ? 'bg-[#7B2D41] text-white hover:bg-[#3B2F2F]'
                    : 'bg-[#3D6B5B] text-white hover:bg-[#3B2F2F]'
                }`}
              >
                {faqBusy
                  ? 'Saving...'
                  : config.faq_visible
                  ? 'Hide FAQ'
                  : 'Show FAQ'}
              </button>
            )}
          </div>

          {/* Catering card — Kerala veg/non-veg toggle */}
          <div className="mb-6 p-5 bg-white border border-[rgba(59,47,47,0.1)] rounded-[2px] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="min-w-0">
              <p className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/60 mb-1">
                Catering &middot; Kerala
              </p>
              {config ? (
                <>
                  <p className="font-sans-body text-sm text-[#3B2F2F]">
                    {config.kerala_non_veg ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#3D6B5B] mr-2 align-middle" />
                        Non-vegetarian options available &mdash; guests see a Veg/Non-Veg radio in the Kerala details panel of the RSVP form.
                      </>
                    ) : (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-[#C4A055] mr-2 align-middle" />
                        Vegetarian only &mdash; the Kerala dietary question is hidden from the RSVP form.
                      </>
                    )}
                  </p>
                  {keralaNonVegError && (
                    <p className="font-sans-body text-xs text-[#7B2D41] mt-1">
                      {keralaNonVegError}
                    </p>
                  )}
                </>
              ) : (
                <p className="font-sans-body text-xs text-[#3B2F2F]/50">Loading...</p>
              )}
            </div>
            {config && (
              <button
                onClick={toggleKeralaNonVeg}
                disabled={keralaNonVegBusy}
                className={`font-sans-body text-xs font-semibold uppercase tracking-[0.12em] px-6 py-3 transition-colors duration-300 disabled:opacity-60 self-start md:self-auto whitespace-nowrap ${
                  config.kerala_non_veg
                    ? 'bg-[#C4A055] text-white hover:bg-[#3B2F2F]'
                    : 'bg-[#3D6B5B] text-white hover:bg-[#3B2F2F]'
                }`}
              >
                {keralaNonVegBusy
                  ? 'Saving...'
                  : config.kerala_non_veg
                  ? 'Switch to veg-only'
                  : 'Enable non-veg'}
              </button>
            )}
          </div>

          {deleteError && (
            <div className="mb-4 p-3 bg-[#7B2D41]/10 border border-[#7B2D41]/30 rounded-[2px]">
              <p className="font-sans-body text-sm text-[#7B2D41]">{deleteError}</p>
            </div>
          )}

          {loading && (
            <p className="font-sans-body text-sm text-[#3B2F2F]/70">Loading submissions...</p>
          )}
          {error && (
            <div className="p-4 bg-[#7B2D41]/10 border border-[#7B2D41]/30 rounded-[2px]">
              <p className="font-sans-body text-sm text-[#7B2D41]">
                Error loading data: {error}
              </p>
              <p className="font-sans-body text-xs text-[#3B2F2F]/60 mt-1">
                Make sure the Supabase table and select policy are set up correctly.
              </p>
            </div>
          )}
          {!loading && !error && rsvps.length === 0 && (
            <p className="font-sans-body text-sm text-[#3B2F2F]/70">No submissions yet.</p>
          )}

          {!loading && !error && rsvps.length > 0 && (
            <div className="overflow-x-auto -mx-5 px-5 md:-mx-10 md:px-10">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[rgba(59,47,47,0.15)]">
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4">Name</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4">Phone</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4">Email</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4">Diet</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4">Guests</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4 min-w-[220px]">Kolkata</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4 min-w-[220px]">Kerala</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4 max-w-[180px]">Notes</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4">Submitted</th>
                    <th className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.12em] text-[#3B2F2F]/70 py-3 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[rgba(59,47,47,0.08)] hover:bg-[rgba(196,160,85,0.03)] transition-colors"
                    >
                      <td className="font-sans-body text-sm text-[#3B2F2F] py-3 pr-4 whitespace-nowrap">
                        {r.full_name}
                      </td>
                      <td className="font-sans-body text-sm text-[#3B2F2F] py-3 pr-4 whitespace-nowrap">
                        {r.phone}
                      </td>
                      <td className="font-sans-body text-sm text-[#3B2F2F]/70 py-3 pr-4 whitespace-nowrap">
                        {r.email || '—'}
                      </td>
                      <td className="font-sans-body text-sm text-[#3B2F2F] py-3 pr-4 whitespace-nowrap capitalize">
                        {r.dietary || '—'}
                      </td>
                      <td className="font-sans-body text-sm text-[#3B2F2F] py-3 pr-4 whitespace-nowrap">
                        {r.guest_count}
                      </td>
                      <td className="py-3 pr-4">
                        {r.attending_kolkata ? (
                          <div className="space-y-1.5">
                            <p className="font-sans-body text-[11px] text-[#3B2F2F]/80">
                              {r.kolkata_events?.map(eventLabel).join(', ') || '—'}
                            </p>
                            <div className="flex gap-1.5 flex-wrap">
                              <BoolBadge val={r.kolkata_accommodation} label="Stay" />
                              <BoolBadge val={r.kolkata_airport_pickup} label="Air" />
                              <BoolBadge val={r.kolkata_train_pickup} label="Rail" />
                            </div>
                            {r.kolkata_train_pickup && r.kolkata_train_pickup_station && (
                              <p className="font-sans-body text-[10px] text-[#3B2F2F]/55 italic">
                                Pickup: {r.kolkata_train_pickup_station}
                              </p>
                            )}
                            <p className="font-sans-body text-[10px] text-[#3B2F2F]/50">
                              {formatShortDate(r.kolkata_arrival)} → {formatShortDate(r.kolkata_departure)}
                            </p>
                          </div>
                        ) : (
                          <span className="font-sans-body text-xs text-[#3B2F2F]/30">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        {r.attending_kerala ? (
                          <div className="space-y-1.5">
                            <div className="flex gap-1.5 flex-wrap">
                              <BoolBadge val={r.kerala_accommodation} label="Stay" />
                              <BoolBadge val={r.kerala_airport_pickup} label="Air" />
                              <BoolBadge val={r.kerala_train_pickup} label="Rail" />
                            </div>
                            {r.kerala_train_pickup && r.kerala_train_pickup_station && (
                              <p className="font-sans-body text-[10px] text-[#3B2F2F]/55 italic">
                                Pickup: {r.kerala_train_pickup_station}
                              </p>
                            )}
                            <p className="font-sans-body text-[10px] text-[#3B2F2F]/50">
                              {formatShortDate(r.kerala_arrival)} → {formatShortDate(r.kerala_departure)}
                            </p>
                          </div>
                        ) : (
                          <span className="font-sans-body text-xs text-[#3B2F2F]/30">—</span>
                        )}
                      </td>
                      <td className="font-sans-body text-xs text-[#3B2F2F]/70 py-3 pr-4 max-w-[180px] whitespace-pre-wrap">
                        {r.special_notes || '—'}
                      </td>
                      <td className="font-sans-body text-xs text-[#3B2F2F]/50 py-3 pr-4 whitespace-nowrap">
                        {formatDate(r.created_at)}
                      </td>
                      <td className="py-3 pr-4 whitespace-nowrap text-right">
                        {pendingDeleteId === r.id ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="font-sans-body text-[11px] text-[#3B2F2F]/70 mr-1">Delete?</span>
                            <button
                              type="button"
                              onClick={() => handleDelete(r)}
                              disabled={deleteBusyId === r.id}
                              className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] bg-[#7B2D41] text-white px-3 py-1.5 hover:bg-[#3B2F2F] transition-colors duration-200 disabled:opacity-60"
                            >
                              {deleteBusyId === r.id ? '...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              disabled={deleteBusyId === r.id}
                              className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3B2F2F]/70 hover:text-[#3B2F2F] px-2 py-1.5 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-3">
                            <a
                              href={`/rsvp/edit/${r.edit_token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] text-[#3D6B5B] hover:text-[#3B2F2F] transition-colors duration-200"
                            >
                              Edit ↗
                            </a>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(r.id)}
                              className="font-sans-body text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7B2D41] hover:text-[#3B2F2F] transition-colors duration-200"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
