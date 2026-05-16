import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeroSection from './HeroSection';

const configMaybeSingleFn = vi.fn();
const configSelectFn = vi.fn(() => ({ maybeSingle: configMaybeSingleFn }));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: configSelectFn }),
  },
}));

vi.mock('@/components/CountdownTimer', () => ({
  default: ({ title, message }: { title: string; message?: string }) => (
    <div data-testid="countdown">
      <span data-testid="countdown-title">{title}</span>
      {message && <span data-testid="countdown-message">{message}</span>}
    </div>
  ),
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('HeroSection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    configMaybeSingleFn.mockReset();
    configSelectFn.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows countdown to Kolkata before the earliest visible event', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: { hidden_events: [] },
      error: null,
    });
    vi.setSystemTime(new Date('2026-07-05T00:00:00+05:30'));

    render(<HeroSection lenis={null} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('countdown-title')).toHaveTextContent('Countdown to Kolkata');
    });
  });

  it('shows live message during Kolkata events', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: { hidden_events: [] },
      error: null,
    });
    vi.setSystemTime(new Date('2026-07-07T12:00:00+05:30'));

    render(<HeroSection lenis={null} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('countdown-title')).toHaveTextContent('Now Happening');
      expect(screen.getByTestId('countdown-message')).toHaveTextContent('Kolkata celebrations are underway!');
    });
  });

  it('shows countdown to Kerala after Kolkata ends', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: { hidden_events: [] },
      error: null,
    });
    vi.setSystemTime(new Date('2026-07-10T00:00:00+05:30'));

    render(<HeroSection lenis={null} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('countdown-title')).toHaveTextContent('Countdown to Kerala');
    });
  });

  it('shows Kerala live message on reception day', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: { hidden_events: [] },
      error: null,
    });
    vi.setSystemTime(new Date('2026-07-25T19:00:00+05:30'));

    render(<HeroSection lenis={null} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('countdown-title')).toHaveTextContent('Now Happening');
      expect(screen.getByTestId('countdown-message')).toHaveTextContent('The Pala Reception is tonight!');
    });
  });

  it('shows thank you message after all events', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: { hidden_events: [] },
      error: null,
    });
    vi.setSystemTime(new Date('2026-07-26T00:00:00+05:30'));

    render(<HeroSection lenis={null} />);

    await vi.waitFor(() => {
      expect(screen.getByTestId('countdown-title')).toHaveTextContent('Ankita & Akhil');
      expect(screen.getByTestId('countdown-message')).toHaveTextContent('Thank you for celebrating with us!');
    });
  });

  it('shifts countdown start when mehendi is hidden', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: { hidden_events: ['mehendi'] },
      error: null,
    });
    vi.setSystemTime(new Date('2026-07-06T00:00:00+05:30'));

    render(<HeroSection lenis={null} />);

    await vi.waitFor(() => {
      // July 6 with mehendi hidden → earliest event is July 7, so still counting down
      expect(screen.getByTestId('countdown-title')).toHaveTextContent('Countdown to Kolkata');
    });
  });

  it('displays correct date range when mehendi is hidden', async () => {
    configMaybeSingleFn.mockResolvedValue({
      data: { hidden_events: ['mehendi'] },
      error: null,
    });

    render(<HeroSection lenis={null} />);

    await vi.waitFor(() => {
      expect(screen.getByText(/July 7 – 8, 2026/i)).toBeInTheDocument();
    });
  });
});
