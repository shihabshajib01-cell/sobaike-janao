import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from './IconButton';

export interface HorizontalScrollRailProps {
  children: React.ReactNode;
  ariaLabel: string;
  previousLabel: string;
  nextLabel: string;
  className?: string;
  id?: string;
}

export const HorizontalScrollRail: React.FC<HorizontalScrollRailProps> = ({
  children,
  ariaLabel,
  previousLabel,
  nextLabel,
  className = '',
  id,
}) => {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateControls = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setCanScrollLeft(rail.scrollLeft > 2);
    setCanScrollRight(maxScrollLeft - rail.scrollLeft > 2);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    updateControls();
    rail.addEventListener('scroll', updateControls, { passive: true });

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateControls) : null;
    resizeObserver?.observe(rail);
    window.addEventListener('resize', updateControls);

    return () => {
      rail.removeEventListener('scroll', updateControls);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', updateControls);
    };
  }, [updateControls]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(updateControls);
    return () => window.cancelAnimationFrame(frame);
  }, [children, updateControls]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const rail = railRef.current;
    if (!rail) return;

    const distance = Math.max(280, Math.round(rail.clientWidth * 0.72));
    rail.scrollBy({
      left: direction === 'left' ? -distance : distance,
      behavior: 'smooth',
    });
  }, []);

  return (
    <div id={id} className="relative" aria-label={ariaLabel}>
      {canScrollLeft && (
        <div className="absolute inset-y-0 left-0 z-20 hidden lg:flex items-center pr-5 bg-gradient-to-r from-ui-page via-ui-page to-transparent pointer-events-none">
          <IconButton
            type="button"
            variant="outline"
            size="sm"
            aria-label={previousLabel}
            onClick={() => scroll('left')}
            icon={<ChevronLeft className="h-5 w-5" aria-hidden="true" />}
            className="pointer-events-auto rounded-[var(--radius-pill)]"
          />
        </div>
      )}

      <div
        ref={railRef}
        role="group"
        aria-label={ariaLabel}
        className={`flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden ${className}`}
      >
        {children}
      </div>

      {canScrollRight && (
        <div className="absolute inset-y-0 right-0 z-20 hidden lg:flex items-center pl-5 bg-gradient-to-l from-ui-page via-ui-page to-transparent pointer-events-none">
          <IconButton
            type="button"
            variant="outline"
            size="sm"
            aria-label={nextLabel}
            onClick={() => scroll('right')}
            icon={<ChevronRight className="h-5 w-5" aria-hidden="true" />}
            className="pointer-events-auto rounded-[var(--radius-pill)]"
          />
        </div>
      )}
    </div>
  );
};
