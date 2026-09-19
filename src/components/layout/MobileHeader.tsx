import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PublicEngagementService } from '../../services/publicEngagementService';
import { useTaxonomy } from '../../services/taxonomyService';
import { BrandLogo } from '../branding/BrandLogo';
import { IconButton } from '../ui/IconButton';
import { AppIcon } from '../ui/AppIcon';
import { SECTIONS } from '../../theme/tokens';

const REPORT_DETAIL_PREFIX = '/report-detail/';
const MOBILE_HEADER_HIDE_SCROLL_Y = 96;
const MOBILE_HEADER_DIRECTION_THRESHOLD = 32;
const MOBILE_HEADER_SCROLL_EPSILON = 2;
const MOBILE_HEADER_TOP_RESET_Y = 24;
const MOBILE_CHROME_TRANSITION_LOCK_MS = 560;

const hasTextInputFocus = () => {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return false;

  return (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.tagName === 'SELECT' ||
    activeElement.isContentEditable
  );
};

const isPrimaryUnmodifiedNavigation = (event: React.MouseEvent<HTMLAnchorElement>) =>
  !event.defaultPrevented &&
  event.button === 0 &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.shiftKey &&
  !event.altKey;

const goBackWithFallback = (fallback: () => void) => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  fallback();
};

interface MobileHeaderProps {
  isCompact: boolean;
  onCompactChange: (compact: boolean) => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  isCompact,
  onCompactChange,
}) => {
  const {
    currentRoute,
    navigateTo,
    language,
    isSearchModalOpen,
    isTabletMenuOpen,
    setIsTabletMenuOpen,
    isHarassmentFilterOpen,
    setIsHarassmentFilterOpen,
    isReportComposerOpen,
    isLocationModalOpen,
  } = useApp();
  const [isShareConfirmed, setIsShareConfirmed] = useState(false);
  const lastScrollYRef = useRef(0);
  const directionRef = useRef<'up' | 'down' | null>(null);
  const directionDistanceRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const transitionLockUntilRef = useRef(0);
  const isCompactRef = useRef(isCompact);
  const interactionBlockedRef = useRef(false);
  const { segments } = useTaxonomy();
  const localizePath = (path: string) =>
    language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

  const runtimeCategory =
    Object.values(segments).find((segment) => segment.slug === currentRoute) || null;
  const staticCategoryEntry =
    Object.entries(SECTIONS).find(([, segment]) => segment.slug === currentRoute) || null;
  const activeCategory =
    runtimeCategory ||
    (staticCategoryEntry
      ? { ...staticCategoryEntry[1], id: staticCategoryEntry[0] }
      : null);
  const activeCategoryKey = activeCategory?.id;
  const isHarassmentCategory = activeCategoryKey === 'harassment';
  const isReportDetailRoute = currentRoute.startsWith(REPORT_DETAIL_PREFIX);
  const reportDetailId = isReportDetailRoute
    ? decodeURIComponent(currentRoute.slice(REPORT_DETAIL_PREFIX.length))
    : '';
  const shouldUseAdaptiveHeader = true;
  const isHeaderInteractionBlocked =
    isSearchModalOpen ||
    isTabletMenuOpen ||
    isHarassmentFilterOpen ||
    isReportComposerOpen ||
    isLocationModalOpen;

  const updateCompactState = useCallback(
    (nextCompact: boolean) => {
      if (isCompactRef.current === nextCompact) return;
      isCompactRef.current = nextCompact;
      onCompactChange(nextCompact);
    },
    [onCompactChange]
  );

  useEffect(() => {
    isCompactRef.current = isCompact;
  }, [isCompact]);

  useEffect(() => {
    interactionBlockedRef.current = isHeaderInteractionBlocked;
    transitionLockUntilRef.current = 0;

    if (!shouldUseAdaptiveHeader || isHeaderInteractionBlocked) {
      updateCompactState(false);
    }

    lastScrollYRef.current = window.scrollY;
    directionRef.current = null;
    directionDistanceRef.current = 0;
  }, [
    currentRoute,
    isHeaderInteractionBlocked,
    shouldUseAdaptiveHeader,
    updateCompactState,
  ]);

  useEffect(() => {
    if (!shouldUseAdaptiveHeader) return;

    const mobileMedia = window.matchMedia('(max-width: 767px)');
    const reducedMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resetScrollTracking = () => {
      lastScrollYRef.current = window.scrollY;
      directionRef.current = null;
      directionDistanceRef.current = 0;
    };

    const transitionLockMs = () =>
      reducedMotionMedia.matches ? 0 : MOBILE_CHROME_TRANSITION_LOCK_MS;

    if (!mobileMedia.matches) {
      transitionLockUntilRef.current = 0;
      updateCompactState(false);
    }
    resetScrollTracking();

    const evaluateScroll = () => {
      frameRef.current = null;

      if (!mobileMedia.matches) {
        resetScrollTracking();
        updateCompactState(false);
        return;
      }

      const currentScrollY = Math.max(0, window.scrollY);
      const delta = currentScrollY - lastScrollYRef.current;
      lastScrollYRef.current = currentScrollY;

      if (interactionBlockedRef.current || hasTextInputFocus()) {
        transitionLockUntilRef.current = 0;
        directionRef.current = null;
        directionDistanceRef.current = 0;
        updateCompactState(false);
        return;
      }

      const now = performance.now();

      if (now < transitionLockUntilRef.current) {
        directionRef.current = null;
        directionDistanceRef.current = 0;
        return;
      }

      if (currentScrollY <= MOBILE_HEADER_TOP_RESET_Y) {
        directionRef.current = null;
        directionDistanceRef.current = 0;

        if (isCompactRef.current || delta < -MOBILE_HEADER_SCROLL_EPSILON) {
          updateCompactState(false);
        }
        return;
      }

      if (Math.abs(delta) < MOBILE_HEADER_SCROLL_EPSILON) return;

      const nextDirection: 'up' | 'down' = delta > 0 ? 'down' : 'up';
      if (directionRef.current !== nextDirection) {
        directionRef.current = nextDirection;
        directionDistanceRef.current = 0;
      }

      directionDistanceRef.current += Math.abs(delta);

      if (
        nextDirection === 'down' &&
        currentScrollY >= MOBILE_HEADER_HIDE_SCROLL_Y &&
        directionDistanceRef.current >= MOBILE_HEADER_DIRECTION_THRESHOLD
      ) {
        if (!isCompactRef.current) {
          transitionLockUntilRef.current = now + transitionLockMs();
          updateCompactState(true);
        }
        directionDistanceRef.current = 0;
      } else if (
        nextDirection === 'up' &&
        directionDistanceRef.current >= MOBILE_HEADER_DIRECTION_THRESHOLD
      ) {
        if (isCompactRef.current) {
          transitionLockUntilRef.current = now + transitionLockMs();
          updateCompactState(false);
        }
        directionDistanceRef.current = 0;
      }
    };

    const handleScroll = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(evaluateScroll);
    };

    const handleMediaChange = () => {
      transitionLockUntilRef.current = 0;
      resetScrollTracking();
      if (!mobileMedia.matches) {
        updateCompactState(false);
      }
    };

    const handleReducedMotionChange = () => {
      transitionLockUntilRef.current = 0;
      resetScrollTracking();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    mobileMedia.addEventListener('change', handleMediaChange);
    reducedMotionMedia.addEventListener('change', handleReducedMotionChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      mobileMedia.removeEventListener('change', handleMediaChange);
      reducedMotionMedia.removeEventListener('change', handleReducedMotionChange);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [shouldUseAdaptiveHeader, updateCompactState]);

  const handleAdaptiveNavigation = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isPrimaryUnmodifiedNavigation(event)) return;
    updateCompactState(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const registerSuccessfulShare = () => {
    if (reportDetailId) {
      void PublicEngagementService.trackShare(reportDetailId);
    }
  };

  const handleReportShare = async () => {
    const shareData = {
      title: document.title,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        registerSuccessfulShare();
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        registerSuccessfulShare();
        setIsShareConfirmed(true);
        window.setTimeout(() => setIsShareConfirmed(false), 2000);
      }
    } catch (error) {
      if ((error as DOMException)?.name !== 'AbortError') {
        console.warn('[MobileHeader share error]', error);
      }
    }
  };

  if (isReportDetailRoute) {
    return (
      <div
        className={`md:hidden sticky top-0 z-40 w-full overflow-visible transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          isCompact
            ? 'h-0'
            : 'h-[calc(3.5rem+env(safe-area-inset-top,0px))]'
        }`}
      >
        <header
          id="mobile-report-detail-header"
          data-compact={isCompact ? 'true' : 'false'}
          className={`absolute inset-x-0 top-0 w-full pt-safe transition-[background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            isCompact
              ? 'pointer-events-none bg-transparent border-b border-transparent'
              : 'bg-ui-surface border-b border-ui-divider'
          }`}
        >
          <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
            <IconButton
              id="mobile-report-detail-back-btn"
              variant="outline"
              size="lg"
              onClick={() => goBackWithFallback(() => navigateTo('/'))}
              aria-label={language === 'bn' ? 'পেছনে ফিরে যান' : 'Go back'}
              data-mobile-floating-control={isCompact ? 'true' : undefined}
              className={`${isCompact ? 'pointer-events-auto !bg-ui-surface ui-elevation-control backdrop-blur-md' : '!bg-ui-surface !shadow-none'} !border-ui-stroke-subtle !text-ui-content-primary transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none`}
              icon={<AppIcon name="arrow-left" size="xl" strokeWidth={2} />}
            />

            <p
              id="mobile-report-detail-title"
              className={`min-w-0 flex-1 truncate type-h3 text-ui-content-primary transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
                isCompact ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
              }`}
            >
              {language === 'bn' ? 'প্রতিবেদন' : 'Report'}
            </p>

            <IconButton
              id="mobile-report-detail-share-btn"
              variant="outline"
              size="lg"
              onClick={handleReportShare}
              aria-label={
                isShareConfirmed
                  ? language === 'bn'
                    ? 'লিংক কপি হয়েছে'
                    : 'Link copied'
                  : language === 'bn'
                  ? 'প্রতিবেদন শেয়ার করুন'
                  : 'Share report'
              }
              data-mobile-floating-control={isCompact ? 'true' : undefined}
              className={`${isCompact ? 'pointer-events-auto !bg-ui-surface ui-elevation-control backdrop-blur-md' : '!bg-ui-surface !shadow-none'} !border-ui-stroke-subtle !text-ui-content-primary transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none`}
              icon={
                isShareConfirmed ? (
                  <AppIcon name="check" size="xl" strokeWidth={2} className="text-ui-success-text" />
                ) : (
                  <AppIcon name="share" size="xl" strokeWidth={2} />
                )
              }
            />
          </div>
        </header>
      </div>
    );
  }

  if (activeCategory) {
    return (
      <div
        className={`md:hidden sticky top-0 z-40 w-full overflow-visible transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          isCompact
            ? 'h-0'
            : 'h-[calc(3.5rem+env(safe-area-inset-top,0px))]'
        }`}
      >
        <header
          id="mobile-category-header"
          data-compact={isCompact ? 'true' : 'false'}
          className={`absolute inset-x-0 top-0 w-full pt-safe transition-[background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
            isCompact
              ? 'pointer-events-none bg-transparent border-b border-transparent'
              : 'bg-ui-surface border-b border-ui-divider'
          }`}
        >
          <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
            <IconButton
              id="mobile-category-back-btn"
              variant="outline"
              size="lg"
              onClick={() => navigateTo('/issues')}
              aria-label={language === 'bn' ? 'বিষয়সমূহে ফিরে যান' : 'Back to issues'}
              data-mobile-floating-control={isCompact ? 'true' : undefined}
              className={`${isCompact ? 'pointer-events-auto !bg-ui-surface ui-elevation-control backdrop-blur-md' : '!bg-ui-surface !shadow-none'} !border-ui-stroke-subtle !text-ui-content-primary transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none`}
              icon={<AppIcon name="arrow-left" size="xl" strokeWidth={2} />}
            />

            <p
              id="mobile-category-title"
              className={`min-w-0 flex-1 truncate type-h3 text-ui-content-primary transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
                isCompact ? '-translate-y-2 opacity-0' : 'translate-y-0 opacity-100'
              }`}
            >
              {language === 'bn' ? activeCategory.nameBn : activeCategory.nameEn}
            </p>

            {isHarassmentCategory ? (
              <IconButton
                id="mobile-category-filter-btn"
                variant="outline"
                size="lg"
                onClick={() => setIsHarassmentFilterOpen(true)}
                aria-label={language === 'bn' ? 'ফিল্টার খুলুন' : 'Open filters'}
                aria-haspopup="dialog"
                data-mobile-floating-control={isCompact ? 'true' : undefined}
                className={`${isCompact ? 'pointer-events-auto !bg-ui-surface ui-elevation-control backdrop-blur-md' : '!bg-ui-surface !shadow-none'} !border-ui-stroke-subtle !text-ui-content-primary transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none`}
                icon={<AppIcon name="filter" size="xl" strokeWidth={2} />}
              />
            ) : (
              <div
                id="mobile-category-location-slot"
                className={`shrink-0 ${isCompact ? 'pointer-events-auto ui-elevation-control' : ''}`}
                aria-label={language === 'bn' ? 'ফিল্টার' : 'Filters'}
              />
            )}
          </div>
        </header>
      </div>
    );
  }

  return (
    <>
      <div
        className={`md:hidden sticky top-0 z-40 w-full overflow-visible transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
          isCompact
            ? 'h-0'
            : 'h-[calc(3.5rem+env(safe-area-inset-top,0px))]'
        }`}
      >
        <header
          id="mobile-header"
          aria-hidden={isCompact || undefined}
          inert={isCompact ? true : undefined}
          className={`absolute inset-x-0 top-0 w-full bg-ui-surface border-b border-ui-divider pt-safe transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-[transform,opacity] ${
            isCompact
              ? '-translate-y-[calc(100%+8px)] opacity-0 pointer-events-none mobile-chrome-hide-after-transition'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="flex items-center justify-between h-14 px-3 sm:px-4 max-w-full gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <IconButton
                id="mobile-header-menu-btn"
                variant="outline"
                size="lg"
                onClick={() => setIsTabletMenuOpen(true)}
                tabIndex={isCompact ? -1 : undefined}
                aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
                className="!border-ui-stroke-subtle !bg-ui-surface !shadow-none"
                icon={<AppIcon name="menu" size="xl" strokeWidth={2} />}
              />

              <Link
                to={localizePath('/')}
                onClick={handleAdaptiveNavigation}
                tabIndex={isCompact ? -1 : undefined}
                aria-label={language === 'bn' ? 'সবাইকে জানাও — মূলপাতা' : 'Sobaike Janao — Home'}
                className="rounded-[var(--radius-control)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <BrandLogo
                  id="mobile-header-brand-logo"
                  size="sm"
                  showEnglish={false}
                />
              </Link>
            </div>

            <Link
              id="mobile-header-search-btn"
              to={localizePath('/search')}
              onClick={handleAdaptiveNavigation}
              tabIndex={isCompact ? -1 : undefined}
              aria-label={language === 'bn' ? 'প্রতিবেদন খুঁজুন' : 'Search reports'}
              className="inline-flex w-12 h-12 min-w-[48px] min-h-[48px] items-center justify-center ui-radius-control bg-ui-surface text-ui-content-primary border border-ui-stroke-subtle transition-colors hover:bg-ui-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              <AppIcon name="search" size="xl" strokeWidth={2} />
            </Link>
          </div>
        </header>
      </div>

      <nav
        id="mobile-compact-header"
        aria-label={language === 'bn' ? 'দ্রুত নেভিগেশন' : 'Quick navigation'}
        aria-hidden={!isCompact || undefined}
        inert={!isCompact ? true : undefined}
        className={`md:hidden fixed inset-x-0 top-[calc(env(safe-area-inset-top,0px)+8px)] z-50 pointer-events-none px-3 sm:px-4 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none will-change-[transform,opacity] ${
          isCompact
            ? 'translate-y-0 opacity-100 delay-[60ms] motion-reduce:delay-0'
            : '-translate-y-6 opacity-0 delay-0 mobile-chrome-hide-after-transition'
        }`}
      >
        <div className="flex w-full items-center justify-between">
          <IconButton
            id="mobile-compact-menu-btn"
            variant="outline"
            size="lg"
            onClick={() => setIsTabletMenuOpen(true)}
            tabIndex={isCompact ? undefined : -1}
            aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
            data-mobile-floating-control="true"
            className={`${isCompact ? 'pointer-events-auto' : 'pointer-events-none'} !border-ui-stroke-subtle !bg-ui-surface ui-elevation-control backdrop-blur-md transition-[transform,background-color,color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
              isCompact ? 'scale-100 delay-[60ms] motion-reduce:delay-0' : 'scale-90 delay-0 motion-reduce:delay-0'
            }`}
            icon={<AppIcon name="menu" size="xl" strokeWidth={2} />}
          />

          <Link
            id="mobile-compact-search-btn"
            to={localizePath('/search')}
            onClick={handleAdaptiveNavigation}
            tabIndex={isCompact ? undefined : -1}
            aria-label={language === 'bn' ? 'প্রতিবেদন খুঁজুন' : 'Search reports'}
            data-mobile-floating-control="true"
            className={`${isCompact ? 'pointer-events-auto' : 'pointer-events-none'} inline-flex w-12 h-12 min-w-[48px] min-h-[48px] items-center justify-center ui-radius-control bg-ui-surface text-ui-content-primary border border-ui-stroke-subtle ui-elevation-control backdrop-blur-md transition-[transform,background-color,color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none hover:bg-ui-surface-subtle focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              isCompact ? 'scale-100 delay-[60ms] motion-reduce:delay-0' : 'scale-90 delay-0 motion-reduce:delay-0'
            }`}
          >
            <AppIcon name="search" size="xl" strokeWidth={2} />
          </Link>
        </div>
      </nav>
    </>
  );
};
