import { useRef, useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  distance?: number;
  stagger?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  className = '',
  direction = 'up',
  delay = 0,
  duration = 0.8,
  distance = 40,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const getFrom = () => {
      switch (direction) {
        case 'up': return { y: distance, opacity: 0 };
        case 'down': return { y: -distance, opacity: 0 };
        case 'left': return { x: distance, opacity: 0 };
        case 'right': return { x: -distance, opacity: 0 };
        default: return { y: distance, opacity: 0 };
      }
    };

    const from = getFrom();

    gsap.set(el, from);

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once,
      onEnter: () => {
        gsap.to(el, {
          x: 0,
          y: 0,
          opacity: 1,
          duration,
          delay,
          ease: 'power2.out',
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [direction, delay, duration, distance, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
