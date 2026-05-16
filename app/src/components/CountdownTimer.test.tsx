import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import CountdownTimer from './CountdownTimer';

describe('CountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the title', () => {
    const target = new Date('2026-01-02T00:00:00Z');
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    render(<CountdownTimer targetDate={target} title="Countdown to Test" />);
    expect(screen.getByText('Countdown to Test')).toBeInTheDocument();
  });

  it('renders time blocks with padded values', () => {
    const target = new Date('2026-01-01T00:00:05Z');
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    render(<CountdownTimer targetDate={target} title="Test" />);

    const zeros = screen.getAllByText('00');
    expect(zeros.length).toBe(3); // days, hours, minutes
    expect(screen.getByText('05')).toBeInTheDocument(); // seconds
  });

  it('shows expired message when target is reached', () => {
    const target = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(new Date('2026-01-01T00:00:01Z'));

    render(<CountdownTimer targetDate={target} title="Test" />);

    expect(screen.getByText('Today is the day!')).toBeInTheDocument();
    expect(screen.queryByText('Days')).not.toBeInTheDocument();
  });

  it('renders small scale variant', () => {
    const target = new Date('2026-01-02T00:00:00Z');
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    render(<CountdownTimer targetDate={target} title="Test" scale="small" />);

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument(); // days
  });

  it('shows message prop immediately instead of countdown', () => {
    const target = new Date('2026-01-02T00:00:00Z');
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    render(
      <CountdownTimer
        targetDate={target}
        title="Now Happening"
        message="Kolkata celebrations are underway!"
      />
    );

    expect(screen.getByText('Now Happening')).toBeInTheDocument();
    expect(screen.getByText('Kolkata celebrations are underway!')).toBeInTheDocument();
    expect(screen.queryByText('Days')).not.toBeInTheDocument();
    expect(screen.queryByText('01')).not.toBeInTheDocument();
  });
});
