'use client';

import { useLayoutEffect, useState, type RefObject } from 'react';

const MOBILE_BREAKPOINT = 768;

/**
 * Scroll-linked parallax: background moves slower as you scroll through a section.
 * Disabled on mobile and when the user prefers reduced motion.
 */
export function useParallax(
  ref: RefObject<HTMLElement | null>,
  speed = 0.45
): number {
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    let frame = 0;

    const update = () => {
      const element = ref.current;
      if (!element) {
        setOffset(0);
        return;
      }

      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

      if (prefersReduced || isMobile) {
        setOffset(0);
        return;
      }

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      if (rect.bottom <= 0 || rect.top >= viewportHeight) {
        setOffset(0);
        return;
      }

      const scrollIntoSection = Math.max(0, window.scrollY - element.offsetTop);
      const maxTravel = element.offsetHeight * 0.4;
      const travel = Math.min(scrollIntoSection, maxTravel);
      setOffset(travel * speed);
    };

    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', onScroll);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      motionQuery.removeEventListener('change', onScroll);
    };
  }, [ref, speed]);

  return offset;
}
