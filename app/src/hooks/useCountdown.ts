import { useState, useEffect, useMemo } from 'react';

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function useCountdown(targetDate: Date): CountdownResult {
  const targetTime = useMemo(() => targetDate.getTime(), [targetDate]);

  const calculateRemaining = (): CountdownResult => {
    const now = Date.now();
    const diff = targetTime - now;

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: false,
    };
  };

  const [countdown, setCountdown] = useState<CountdownResult>(calculateRemaining);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  return countdown;
}
