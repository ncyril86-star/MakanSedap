'use client';

import { useEffect, useState, type RefObject } from 'react';

const MOBILE_BREAKPOINT = 768;
const MAX_OFFSET_PX = 64;

/**
 * Subtle scroll parallax for a section. Disabled on mobile and when user prefers reduced motion.
 */
export function useParallax(
  ref: RefObject<HTMLElement | null>,
  speed = 0.35
): number {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;

    const update = () => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

      if (prefersReduced || isMobile) {
        setOffset(0);
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.bottom < 0 || rect.top > viewportHeight) {
        setOffset(0);
        return;
      }

      const progress = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));
      const centered = (clamped - 0.5) * 2;
      setOffset(centered * speed * MAX_OFFSET_PX);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref, speed]);

  return offset;
}
