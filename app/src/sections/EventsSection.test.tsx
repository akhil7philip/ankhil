import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import EventsSection from './EventsSection';

const configMaybeSingleFn = vi.fn();
const configSelectFn = vi.fn(() => ({ maybeSingle: configMaybeSingleFn }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: configSelectFn }),
  },
}));

vi.mock('gsap', () => ({
  default: {
    fromTo: vi.fn(),
    registerPlugin: vi.fn(),
    context: () => ({ revert: vi.fn() }),
  },
}));

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: {
    refresh: vi.fn(),
    create: vi.fn(() => ({ kill: vi.fn() })),
  },
}));

vi.mock('@/components/ScrollReveal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('EventsSection', () => {
  beforeEach(() => {
    configMaybeSingleFn.mockReset();
    configSelectFn.mockClear();
  });

  it('renders all Kolkata events by default', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: {
        kolkata_venue: 'New Town, Kolkata',
        kolkata_map_url: '',
        kerala_venue: 'Pala, Kerala',
        kerala_map_url: '',
        hidden_events: [],
      },
      error: null,
    });

    render(<EventsSection />);

    await vi.waitFor(() => {
      expect(screen.getByText('Mehendi')).toBeInTheDocument();
      expect(screen.getByText('Haldi')).toBeInTheDocument();
      expect(screen.getByText('Musical Night')).toBeInTheDocument();
      expect(screen.getByText('Varmala & Reception')).toBeInTheDocument();
      expect(screen.getByText('Wedding Ceremony & Pheras')).toBeInTheDocument();
    });
  });

  it('hides mehendi when hidden_events includes mehendi', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: {
        kolkata_venue: 'New Town, Kolkata',
        kolkata_map_url: '',
        kerala_venue: 'Pala, Kerala',
        kerala_map_url: '',
        hidden_events: ['mehendi'],
      },
      error: null,
    });

    render(<EventsSection />);

    await vi.waitFor(() => {
      expect(screen.queryByText('Mehendi')).not.toBeInTheDocument();
      expect(screen.getByText('Haldi')).toBeInTheDocument();
    });
  });

  it('updates date range heading when events are hidden', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: {
        kolkata_venue: 'New Town, Kolkata',
        kolkata_map_url: '',
        kerala_venue: 'Pala, Kerala',
        kerala_map_url: '',
        hidden_events: ['mehendi'],
      },
      error: null,
    });

    render(<EventsSection />);

    await vi.waitFor(() => {
      expect(screen.getByText(/July 7 – 8, 2026/i)).toBeInTheDocument();
    });
  });

  it('renders Kerala event regardless of hidden_events', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: {
        kolkata_venue: 'New Town, Kolkata',
        kolkata_map_url: '',
        kerala_venue: 'Pala, Kerala',
        kerala_map_url: '',
        hidden_events: ['mehendi'],
      },
      error: null,
    });

    render(<EventsSection />);

    await vi.waitFor(() => {
      expect(screen.getByText('Pala Reception')).toBeInTheDocument();
    });
  });
});
