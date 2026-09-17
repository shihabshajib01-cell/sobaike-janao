import React, { useState } from 'react';
import { ArrowLeft, Check, Filter, Menu, Search, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { BrandLogo } from '../branding/BrandLogo';

const CATEGORY_BY_ROUTE: Record<string, SectionKey> = {
  '/harassment': 'harassment',
  '/extortion': 'extortion',
  '/public-safety': 'public_safety',
  '/road-transport': 'road_transport',
  '/load-shedding': 'load_shedding',
  '/illegal-occupation': 'illegal_occupation',
  '/rickshaw': 'rickshaw',
};

const goBackWithFallback = (fallback: () => void) => {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  fallback();
};

export const MobileHeader: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    language,
    setIsTabletMenuOpen,
    setIsHarassmentFilterOpen,
  } = useApp();
  const [isShareConfirmed, setIsShareConfirmed] = useState(false);

  const activeCategoryKey = CATEGORY_BY_ROUTE[currentRoute];
  const activeCategory = activeCategoryKey ? SECTIONS[activeCategoryKey] : null;
  const isHarassmentCategory = activeCategoryKey === 'harassment';
  const isReportDetailRoute = currentRoute.startsWith('/report-detail/');

  const handleReportShare = async () => {
    const shareData = {
      title: document.title,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        setIsShareConfirmed(true);
        window.setTimeout(() => setIsShareConfirmed(false), 2000);
      }
    } catch (error) {
      // Native share cancellation is an expected user action; do not surface it as an error.
      if ((error as DOMException)?.name !== 'AbortError') {
        console.warn('[MobileHeader share error]', error);
      }
    }
  };

  if (isReportDetailRoute) {
    return (
      <header
        id="mobile-report-detail-header"
        className="md:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle pt-safe"
      >
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <button
            id="mobile-report-detail-back-btn"
            type="button"
            onClick={() => goBackWithFallback(() => navigateTo('/'))}
            aria-label={language === 'bn' ? 'পেছনে ফিরে যান' : 'Go back'}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-ui-content-primary transition-colors hover:bg-ui-surface-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <p
            id="mobile-report-detail-title"
            className="min-w-0 flex-1 truncate type-h3 text-ui-content-primary"
          >
            {language === 'bn' ? 'প্রতিবেদন' : 'Report'}
          </p>

          <button
            id="mobile-report-detail-share-btn"
            type="button"
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
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary transition-colors hover:bg-ui-surface-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            {isShareConfirmed ? (
              <Check className="h-5 w-5 text-ui-success-text" aria-hidden="true" />
            ) : (
              <Share2 className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </header>
    );
  }

  if (activeCategory) {
    return (
      <header
        id="mobile-category-header"
        className="md:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle pt-safe"
      >
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <button
            id="mobile-category-back-btn"
            type="button"
            onClick={() => navigateTo('/issues')}
            aria-label={language === 'bn' ? 'বিষয়সমূহে ফিরে যান' : 'Back to issues'}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl text-ui-content-primary transition-colors hover:bg-ui-surface-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <p
            id="mobile-category-title"
            className="min-w-0 flex-1 truncate type-h3 text-ui-content-primary"
          >
            {language === 'bn' ? activeCategory.nameBn : activeCategory.nameEn}
          </p>

          {isHarassmentCategory ? (
            <button
              id="mobile-category-filter-btn"
              type="button"
              onClick={() => setIsHarassmentFilterOpen(true)}
              aria-label={language === 'bn' ? 'ফিল্টার খুলুন' : 'Open filters'}
              aria-haspopup="dialog"
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary transition-colors hover:bg-ui-surface-hover cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              <Filter className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : (
            <div
              id="mobile-category-location-slot"
              className="shrink-0"
              aria-label={language === 'bn' ? 'এলাকা ফিল্টার' : 'Location filter'}
            />
          )}
        </div>
      </header>
    );
  }

  return (
    <header
      id="mobile-header"
      className="md:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle pt-safe"
    >
      <div className="flex items-center justify-between h-14 px-3 sm:px-4 max-w-full gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            id="mobile-header-menu-btn"
            type="button"
            onClick={() => setIsTabletMenuOpen(true)}
            aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
            className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary flex items-center justify-center cursor-pointer transition-colors hover:bg-ui-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shrink-0"
          >
            <Menu className="w-5 h-5 text-ui-content-primary" aria-hidden="true" />
          </button>

          <BrandLogo
            id="mobile-header-brand-logo"
            size="sm"
            showEnglish={false}
            onClick={() => navigateTo('/')}
          />
        </div>

        <button
          id="mobile-header-search-btn"
          type="button"
          onClick={() => navigateTo('/search')}
          aria-label={language === 'bn' ? 'প্রতিবেদন খুঁজুন' : 'Search reports'}
          className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary flex items-center justify-center cursor-pointer transition-colors hover:bg-ui-surface-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shrink-0"
        >
          <Search className="w-5 h-5 text-ui-content-primary" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
};
