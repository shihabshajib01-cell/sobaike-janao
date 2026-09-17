import React, { useState } from 'react';
import { ArrowLeft, Check, Filter, Menu, Search, Share2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PublicEngagementService } from '../../services/publicEngagementService';
import { SectionKey, SECTIONS } from '../../theme/tokens';
import { BrandLogo } from '../branding/BrandLogo';
import { IconButton } from '../ui/IconButton';

const CATEGORY_BY_ROUTE: Record<string, SectionKey> = {
  '/harassment': 'harassment',
  '/extortion': 'extortion',
  '/public-safety': 'public_safety',
  '/road-transport': 'road_transport',
  '/load-shedding': 'load_shedding',
  '/illegal-occupation': 'illegal_occupation',
  '/rickshaw': 'rickshaw',
};

const REPORT_DETAIL_PREFIX = '/report-detail/';

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
  const isReportDetailRoute = currentRoute.startsWith(REPORT_DETAIL_PREFIX);
  const reportDetailId = isReportDetailRoute
    ? decodeURIComponent(currentRoute.slice(REPORT_DETAIL_PREFIX.length))
    : '';

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
      <header
        id="mobile-report-detail-header"
        className="md:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle pt-safe"
      >
        <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
          <IconButton
            id="mobile-report-detail-back-btn"
            variant="ghost"
            size="md"
            onClick={() => goBackWithFallback(() => navigateTo('/'))}
            aria-label={language === 'bn' ? 'পেছনে ফিরে যান' : 'Go back'}
            icon={<ArrowLeft className="h-5 w-5" aria-hidden="true" />}
          />

          <p
            id="mobile-report-detail-title"
            className="min-w-0 flex-1 truncate type-h3 text-ui-content-primary"
          >
            {language === 'bn' ? 'প্রতিবেদন' : 'Report'}
          </p>

          <IconButton
            id="mobile-report-detail-share-btn"
            variant="outline"
            size="md"
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
            icon={
              isShareConfirmed ? (
                <Check className="h-5 w-5 text-ui-success-text" aria-hidden="true" />
              ) : (
                <Share2 className="h-5 w-5" aria-hidden="true" />
              )
            }
          />
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
          <IconButton
            id="mobile-category-back-btn"
            variant="ghost"
            size="md"
            onClick={() => navigateTo('/issues')}
            aria-label={language === 'bn' ? 'বিষয়সমূহে ফিরে যান' : 'Back to issues'}
            icon={<ArrowLeft className="h-5 w-5" aria-hidden="true" />}
          />

          <p
            id="mobile-category-title"
            className="min-w-0 flex-1 truncate type-h3 text-ui-content-primary"
          >
            {language === 'bn' ? activeCategory.nameBn : activeCategory.nameEn}
          </p>

          {isHarassmentCategory ? (
            <IconButton
              id="mobile-category-filter-btn"
              variant="outline"
              size="md"
              onClick={() => setIsHarassmentFilterOpen(true)}
              aria-label={language === 'bn' ? 'ফিল্টার খুলুন' : 'Open filters'}
              aria-haspopup="dialog"
              icon={<Filter className="h-5 w-5" aria-hidden="true" />}
            />
          ) : (
            <div
              id="mobile-category-location-slot"
              className="shrink-0"
              aria-label={language === 'bn' ? 'ফিল্টার' : 'Filters'}
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
          <IconButton
            id="mobile-header-menu-btn"
            variant="outline"
            size="md"
            onClick={() => setIsTabletMenuOpen(true)}
            aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
            icon={<Menu className="w-5 h-5" aria-hidden="true" />}
          />

          <BrandLogo
            id="mobile-header-brand-logo"
            size="sm"
            showEnglish={false}
            onClick={() => navigateTo('/')}
          />
        </div>

        <IconButton
          id="mobile-header-search-btn"
          variant="outline"
          size="md"
          onClick={() => navigateTo('/search')}
          aria-label={language === 'bn' ? 'প্রতিবেদন খুঁজুন' : 'Search reports'}
          icon={<Search className="w-5 h-5" aria-hidden="true" />}
        />
      </div>
    </header>
  );
};
