import { useState, useRef } from 'react';

type SegmentKey = 'day' | 'month' | 'year' | 'hour' | 'minute' | 'ampm';

const SEGMENTS: SegmentKey[] = ['day', 'month', 'year', 'hour', 'minute', 'ampm'];

interface Segs {
  day: number;
  month: number;
  year: number;
  hour: number;   // 1-12
  minute: number;
  ampm: 'AM' | 'PM';
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parse(value: string): Segs {
  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [h, minute] = timePart.split(':').map(Number);
  return {
    day,
    month,
    year,
    hour: h === 0 ? 12 : h > 12 ? h - 12 : h,
    minute,
    ampm: h >= 12 ? 'PM' : 'AM',
  };
}

function serialize(s: Segs): string {
  const h =
    s.ampm === 'AM'
      ? s.hour === 12 ? 0 : s.hour
      : s.hour === 12 ? 12 : s.hour + 12;
  return `${s.year}-${pad(s.month)}-${pad(s.day)}T${pad(h)}:${pad(s.minute)}`;
}

function wrap(n: number, min: number, max: number): number {
  const range = max - min + 1;
  return ((n - min + range) % range) + min;
}

interface DateTimePickerProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

export default function DateTimePicker({ value, onChange, disabled = false }: DateTimePickerProps) {
  const segs = parse(value);
  const [active, setActive] = useState<SegmentKey | null>(null);
  const [buffer, setBuffer] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  function update(changes: Partial<Segs>) {
    onChange(serialize({ ...segs, ...changes }));
  }

  function activate(seg: SegmentKey) {
    if (disabled) return;
    setActive(seg);
    setBuffer('');
  }

  function deactivate() {
    setActive(null);
    setBuffer('');
  }

  function advance(from: SegmentKey) {
    const idx = SEGMENTS.indexOf(from);
    if (idx < SEGMENTS.length - 1) {
      activate(SEGMENTS[idx + 1]);
    } else {
      deactivate();
    }
  }

  function retreat(from: SegmentKey) {
    const idx = SEGMENTS.indexOf(from);
    if (idx > 0) {
      activate(SEGMENTS[idx - 1]);
    } else {
      deactivate();
    }
  }

  function handleArrow(delta: number) {
    if (!active) return;
    setBuffer('');
    switch (active) {
      case 'day':    return update({ day:    wrap(segs.day    + delta, 1,  31) });
      case 'month':  return update({ month:  wrap(segs.month  + delta, 1,  12) });
      case 'year':   return update({ year:   Math.min(2099, Math.max(2000, segs.year + delta)) });
      case 'hour':   return update({ hour:   wrap(segs.hour   + delta, 1,  12) });
      case 'minute': return update({ minute: wrap(segs.minute + delta, 0,  59) });
      case 'ampm':   return update({ ampm:   segs.ampm === 'AM' ? 'PM' : 'AM' });
    }
  }

  function handleDigit(digit: string) {
    if (!active || active === 'ampm') return;

    const newBuf = buffer + digit;
    const n = parseInt(newBuf, 10);

    if (active === 'year') {
      if (newBuf.length < 4) {
        setBuffer(newBuf);
        return;
      }
      update({ year: Math.min(2099, Math.max(2000, n)) });
      setBuffer('');
      advance(active);
      return;
    }

    const bounds: Record<Exclude<SegmentKey, 'year' | 'ampm'>, [number, number]> = {
      day: [1, 31], month: [1, 12], hour: [1, 12], minute: [0, 59],
    };
    const [min, max] = bounds[active as keyof typeof bounds];
    update({ [active]: Math.min(max, Math.max(min, n)) });

    const full = newBuf.length === 2 || (newBuf.length === 1 && n * 10 > max);
    if (full) {
      setBuffer('');
      advance(active);
    } else {
      setBuffer(newBuf);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;

    if (!active) {
      if (e.key !== 'Tab' && e.key !== 'Shift') activate('day');
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      e.shiftKey ? retreat(active) : advance(active);
      return;
    }
    if (e.key === 'Escape') { deactivate(); return; }
    if (e.key === 'ArrowUp')   { e.preventDefault(); handleArrow(1);  return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); handleArrow(-1); return; }

    if (active === 'ampm') {
      if (e.key === 'a' || e.key === 'A') update({ ampm: 'AM' });
      if (e.key === 'p' || e.key === 'P') update({ ampm: 'PM' });
      return;
    }

    if (/^\d$/.test(e.key)) handleDigit(e.key);
  }

  function display(seg: SegmentKey): string {
    if (active === seg && seg === 'year' && buffer.length > 0) return buffer;
    switch (seg) {
      case 'day':    return pad(segs.day);
      case 'month':  return pad(segs.month);
      case 'year':   return String(segs.year);
      case 'hour':   return String(segs.hour);
      case 'minute': return pad(segs.minute);
      case 'ampm':   return segs.ampm;
    }
  }

  function segCls(seg: SegmentKey, extra = '') {
    const base = `px-1 rounded-[1px] select-none transition-colors duration-150 ${extra}`;
    if (active === seg) return `${base} bg-[#C4A055] text-white`;
    return disabled ? base : `${base} cursor-pointer hover:bg-[rgba(196,160,85,0.12)]`;
  }

  return (
    <>
      {/* Mobile: native input — brings up the OS date/time picker on touch */}
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="md:hidden w-full bg-white/80 border border-[rgba(59,47,47,0.15)] rounded-[2px] px-4 py-3 font-sans-body text-[15px] text-[#3B2F2F] focus:border-[#C4A055] focus:outline-none focus:ring-2 focus:ring-[rgba(196,160,85,0.15)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ colorScheme: 'light' }}
      />

      {/* Desktop: custom segmented picker */}
      <div
        ref={containerRef}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={handleKeyDown}
        onFocus={() => { if (!active && !disabled) activate('day'); }}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) deactivate();
        }}
        className={[
          'hidden md:flex items-center w-full bg-white/80 rounded-[2px] px-4 py-3',
          'font-sans-body text-[15px] text-[#3B2F2F] outline-none',
          'transition-all duration-200',
          active
            ? 'border border-[#C4A055] ring-2 ring-[rgba(196,160,85,0.15)]'
            : 'border border-[rgba(59,47,47,0.15)]',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-text',
        ].filter(Boolean).join(' ')}
      >
        <span className={segCls('day')}    onClick={() => activate('day')}>{display('day')}</span>
        <span className="text-[rgba(59,47,47,0.25)] select-none">/</span>
        <span className={segCls('month')}  onClick={() => activate('month')}>{display('month')}</span>
        <span className="text-[rgba(59,47,47,0.25)] select-none">/</span>
        <span className={segCls('year')}   onClick={() => activate('year')}>{display('year')}</span>
        <span className="text-[rgba(59,47,47,0.12)] select-none mx-3">|</span>
        <span className={segCls('hour')}   onClick={() => activate('hour')}>{display('hour')}</span>
        <span className="text-[rgba(59,47,47,0.25)] select-none">:</span>
        <span className={segCls('minute')} onClick={() => activate('minute')}>{display('minute')}</span>
        <span className={segCls('ampm', 'ml-2')} onClick={() => activate('ampm')}>{display('ampm')}</span>
      </div>
    </>
  );
}
