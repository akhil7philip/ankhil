import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import TravelSection from './TravelSection';

const configMaybeSingleFn = vi.fn();
const configSelectFn = vi.fn(() => ({ maybeSingle: configMaybeSingleFn }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: configSelectFn }),
  },
}));

vi.mock('@/components/ScrollReveal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('TravelSection', () => {
  beforeEach(() => {
    configMaybeSingleFn.mockReset();
    configSelectFn.mockClear();
  });

  it('renders venue name when provided in site_config', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: {
        kolkata_railway_stations: ['Sealdah Railway Station'],
        kerala_railway_stations: ['Kottayam Railway Station'],
        kolkata_venue: 'New Town, Kolkata',
        kolkata_map_url: '',
        kerala_venue: 'Pala, Kerala',
        kerala_map_url: '',
        hidden_events: [],
      },
      error: null,
    });

    render(<TravelSection />);

    await vi.waitFor(() => {
      expect(screen.getByText('New Town, Kolkata')).toBeInTheDocument();
      expect(screen.getByText('Pala, Kerala')).toBeInTheDocument();
    });
  });

  it('renders map link when venue and mapUrl are provided', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: {
        kolkata_railway_stations: [],
        kerala_railway_stations: [],
        kolkata_venue: 'New Town, Kolkata',
        kolkata_map_url: 'https://maps.google.com/kolkata',
        kerala_venue: 'Pala, Kerala',
        kerala_map_url: 'https://maps.google.com/kerala',
        hidden_events: [],
      },
      error: null,
    });

    render(<TravelSection />);

    await vi.waitFor(() => {
      const links = screen.getAllByText(/View on Maps/i);
      expect(links.length).toBe(2);
    });
  });

  it('updates date string when events are hidden', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: {
        kolkata_railway_stations: [],
        kerala_railway_stations: [],
        kolkata_venue: '',
        kolkata_map_url: '',
        kerala_venue: '',
        kerala_map_url: '',
        hidden_events: ['mehendi'],
      },
      error: null,
    });

    render(<TravelSection />);

    await vi.waitFor(() => {
      expect(screen.getByText(/Wedding Events • July 7 – 8, 2026/i)).toBeInTheDocument();
    });
  });
});
