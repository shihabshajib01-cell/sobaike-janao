import React, { useEffect, useState } from 'react';
import { useApp, RoutePath } from '../../context/AppContext';
import { CategoryPopularityService } from '../../services/categoryPopularityService';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';
import { Button } from '../ui/Button';
import { ThemeSelector } from '../ui/ThemeSelector';
import { BrandLogo } from '../branding/BrandLogo';
import { AppIcon, AppIconName } from '../ui/AppIcon';
import { CategoryIcon } from '../branding/CategoryIcon';

export const DesktopLeftRail: React.FC = () => {
  const { currentRoute, navigateTo, language, toggleLanguage, openReportComposer } = useApp();
  const { segments, getSegment } = useTaxonomy();
  const [categoryOrder, setCategoryOrder] = useState<string[]>(() =>
    Object.values(segments)
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
      .map((segment) => segment.id)
  );

  useEffect(() => {
    let active = true;
    CategoryPopularityService.clearCache();
    CategoryPopularityService.getOrderedCategoryKeys().then((keys) => {
      if (active) setCategoryOrder(keys);
    });
    return () => {
      active = false;
    };
  }, [segments]);

  const navItems: Array<{
    id: string;
    path: RoutePath;
    nameBn: string;
    nameEn: string;
    iconName?: AppIconName;
    sectionKey?: string;
  }> = [
    {
      id: 'rail-home',
      path: '/',
      nameBn: 'মূলপাতা',
      nameEn: 'Home',
      iconName: 'home',
    },
    ...categoryOrder.map((sectionKey) => {
      const config = getSegment(sectionKey);
      return {
        id: `rail-${sectionKey.replaceAll('_', '-')}`,
        path: config.slug as RoutePath,
        nameBn: config.shortNameBn,
        nameEn: config.shortNameEn,
        sectionKey,
      };
    }),
    {
      id: 'rail-explore',
      path: '/explore',
      nameBn: 'এক্সপ্লোর',
      nameEn: 'Explore',
      iconName: 'compass',
    },
    {
      id: 'rail-search',
      path: '/search',
      nameBn: 'অনুসন্ধান',
      nameEn: 'Search',
      iconName: 'search',
    },
    {
      id: 'rail-more',
      path: '/more',
      nameBn: 'তথ্য ও নীতিমালা',
      nameEn: 'Info & guidelines',
      iconName: 'info',
    },
  ];

  const getSectionActiveStyles = (sectionKey?: string) => {
    if (!sectionKey) {
      return 'bg-ui-surface-elevated text-ui-content-primary font-[var(--font-weight-semibold)] border border-ui-stroke-default';
    }
    return 'font-[var(--font-weight-semibold)] border';
  };

  return (
    <aside
      id="desktop-left-navigation-rail"
      aria-label={language === 'bn' ? 'ডেস্কটপ নেভিগেশন' : 'Desktop navigation'}
      className="hidden min-[1440px]:flex flex-col fixed top-0 bottom-0 left-0 h-[100dvh] overflow-y-auto w-[var(--layout-rail-desktop)] min-[1536px]:w-[var(--layout-rail-large)] min-[1920px]:w-[var(--layout-rail-xl)] px-4 min-[1920px]:px-5 py-5 bg-ui-surface border-r border-ui-stroke-subtle justify-between select-none z-30"
    >
      <div className="space-y-5">
        <BrandLogo
          id="rail-brand-logo"
          size="md"
          onClick={() => navigateTo('/')}
          className="transition-colors ui-radius-control px-1 py-1 w-full"
        />

        <div>
          <Button
            id="rail-primary-report-cta"
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<AppIcon name="plus-circle" size="lg" className="text-ui-content-inverse" />}
            onClick={() => openReportComposer()}
            className="font-[var(--font-weight-semibold)] py-2.5 min-h-[44px]"
          >
            {language === 'bn' ? 'ঘটনা জানান' : 'Report incident'}
          </Button>
        </div>

        <nav className="space-y-1" aria-label={language === 'bn' ? 'প্রধান বিভাগ' : 'Main sections'}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.path;
            const secConfig = item.sectionKey ? getSegment(item.sectionKey) : null;

            return (
              <button
                key={item.id}
                id={item.id}
                onClick={() => navigateTo(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 ui-radius-control type-action transition-all duration-150 text-left cursor-pointer group min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  isActive ? getSectionActiveStyles(item.sectionKey) : 'text-ui-content-secondary'
                }`}
                style={
                  isActive && item.sectionKey
                    ? {
                        backgroundColor: secConfig?.bgColor,
                        color: secConfig?.textColor,
                        borderColor: secConfig?.borderColor,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3 truncate">
                  {item.sectionKey ? (
                    <CategoryIcon
                      section={item.sectionKey as SectionKey}
                      size="lg"
                      ariaLabel={language === 'bn' ? item.nameBn : item.nameEn}
                    />
                  ) : (
                    <AppIcon
                      name={item.iconName as AppIconName}
                      size="lg"
                      className={`transition-colors ${
                        isActive && !secConfig
                          ? 'text-ui-content-primary'
                          : !isActive
                            ? 'text-ui-content-muted'
                            : ''
                      }`}
                    />
                  )}
                  <span className="truncate">{language === 'bn' ? item.nameBn : item.nameEn}</span>
                </div>

                {item.sectionKey && (
                  <span
                    className={`w-2.5 h-2.5 ui-radius-pill shrink-0 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'
                    }`}
                    style={{ backgroundColor: secConfig?.primaryColor || 'var(--ui-accent)' }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-ui-stroke-subtle space-y-2.5">
        <ThemeSelector variant="compact" />

        <button
          id="rail-lang-toggle"
          onClick={toggleLanguage}
          aria-label={language === 'bn' ? 'ইংরেজিতে পরিবর্তন করুন' : 'Switch to Bangla'}
          className="w-full flex items-center justify-between px-3.5 py-2.5 type-compact ui-radius-control border border-ui-stroke-subtle transition-colors cursor-pointer text-ui-content-secondary min-h-[44px] bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <span className="font-[var(--font-weight-medium)]">{language === 'bn' ? 'ভাষা' : 'Language'}</span>
          <span className="font-[var(--font-weight-semibold)] text-ui-content-primary px-2.5 py-1 bg-ui-surface-subtle border border-ui-stroke-subtle ui-radius-badge-md type-helper">
            {language === 'bn' ? 'English' : 'বাংলা'}
          </span>
        </button>

        <div className="px-2 pt-1 type-meta text-ui-content-muted leading-tight">
          <p className="font-[var(--font-weight-medium)] text-ui-content-secondary">
            {language === 'bn' ? 'নাগরিক প্ল্যাটফর্ম' : 'Citizen platform'}
          </p>
          <small className="opacity-80">
            {language === 'bn' ? 'বাংলাদেশ ২০২৬' : 'Bangladesh 2026'}
          </small>
        </div>
      </div>
    </aside>
  );
};
