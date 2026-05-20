import { useCountdown } from '@/hooks/useCountdown';

interface CountdownTimerProps {
  targetDate?: Date;
  title: string;
  message?: string;
  scale?: 'normal' | 'small';
}

export default function CountdownTimer({
  targetDate,
  title,
  message,
  scale = 'normal',
}: CountdownTimerProps) {
  const { days, hours, minutes, seconds, expired } = useCountdown(
    targetDate ?? new Date()
  );

  const isSmall = scale === 'small';

  if (message || expired) {
    return (
      <div className={`text-center ${isSmall ? 'mt-3' : 'mt-5'}`}>
        <p
          className={`font-sans-body font-semibold uppercase tracking-[0.12em] ${
            isSmall ? 'text-[10px] text-white/60' : 'text-[11px] text-white/70'
          }`}
        >
          {title}
        </p>
        <p
          className={`font-serif-display text-[#C4A055] mt-1 ${
            isSmall ? 'text-lg' : 'text-xl md:text-2xl'
          }`}
        >
          {message || 'Today is the day!'}
        </p>
      </div>
    );
  }

  const timeBlocks = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hrs' },
    { value: minutes, label: 'Min' },
    { value: seconds, label: 'Sec' },
  ];

  return (
    <div className={`text-center ${isSmall ? 'mt-3' : 'mt-5'}`}>
      <p
        className={`font-sans-body font-semibold uppercase tracking-[0.12em] mb-2 md:mb-3 ${
          isSmall ? 'text-[10px] text-white/60' : 'text-[11px] text-white/70'
        }`}
      >
        {title}
      </p>
      <div
        className={`inline-flex items-center gap-2 md:gap-4 ${
          isSmall
            ? 'bg-white/10 px-4 py-2 rounded'
            : 'bg-white/[0.12] px-6 py-3 md:px-8 md:py-4 rounded-[4px]'
        }`}
      >
        {timeBlocks.map((block, i) => (
          <div key={block.label} className="flex items-center">
            <div className="text-center">
              <div
                className={`font-serif-display text-white leading-none ${
                  isSmall ? 'text-xl md:text-2xl' : 'text-[28px] md:text-[36px]'
                }`}
              >
                {String(block.value).padStart(2, '0')}
              </div>
              <div
                className={`font-sans-body font-semibold uppercase tracking-[0.15em] mt-1 ${
                  isSmall
                    ? 'text-[10px] text-black'
                    : 'text-[11px] text-black'
                }`}
              >
                {block.label}
              </div>
            </div>
            {i < timeBlocks.length - 1 && (
              <div
                className={`rounded-full bg-[#C4A055] mx-1 md:mx-2 self-start mt-1 ${
                  isSmall ? 'w-1 h-1' : 'w-1 h-1 md:w-1.5 md:h-1.5'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
