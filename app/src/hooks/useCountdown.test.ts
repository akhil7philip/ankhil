import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCountdown } from './useCountdown';

describe('useCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns correct initial remaining time', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(now);

    const target = new Date('2026-01-02T00:00:00Z'); // 24 hours later
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.days).toBe(1);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
    expect(result.current.expired).toBe(false);
  });

  it('ticks down every second', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    vi.setSystemTime(now);

    const target = new Date('2026-01-02T00:00:00Z');
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.seconds).toBe(0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBe(23);
    expect(result.current.minutes).toBe(59);
    expect(result.current.seconds).toBe(59);
  });

  it('returns expired when target date is in the past', () => {
    const now = new Date('2026-01-02T00:00:00Z');
    vi.setSystemTime(now);

    const target = new Date('2026-01-01T00:00:00Z');
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.expired).toBe(true);
    expect(result.current.days).toBe(0);
    expect(result.current.hours).toBe(0);
    expect(result.current.minutes).toBe(0);
    expect(result.current.seconds).toBe(0);
  });

  it('calculates mixed units correctly', () => {
    const now = new Date('2026-01-01T12:30:45Z');
    vi.setSystemTime(now);

    const target = new Date('2026-01-03T14:35:50Z');
    const { result } = renderHook(() => useCountdown(target));

    expect(result.current.days).toBe(2);
    expect(result.current.hours).toBe(2);
    expect(result.current.minutes).toBe(5);
    expect(result.current.seconds).toBe(5);
  });
});
