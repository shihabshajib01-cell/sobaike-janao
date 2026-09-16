import React, { useMemo } from 'react';
import { useApp, RoutePath } from '../../context/AppContext';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';
import { Button } from '../ui/Button';
import { ThemeSelector } from '../ui/ThemeSelector';
import { BrandLogo } from '../branding/BrandLogo';
import { AppIcon, AppIconName } from '../ui/AppIcon';

const SECTION_ICON_MAP: Record<SectionKey, AppIconName> = {
  harassment: 'harassment',
  extortion: 'extortion',
  public_safety: 'public-safety',
  road_transport: 'road-transport',
  load_shedding: 'load-shedding',
  illegal_occupation: 'illegal-occupation',
  rickshaw: 'rickshaw',
};

export const DesktopLeftRail: React.FC = () => {
  const { currentRoute, navigateTo, language, toggleLanguage, openReportComposer } = useApp();
  const { segments } = useTaxonomy();

  const navItems = useMemo(() => {
    const categoryItems = (Object.keys(SECTIONS) as SectionKey[])
      .filter((key) => Boolean(segments[key]))
      .map((key) => ({
        id: `rail-${key.replace(/_/g, '-')}`,
        path: SECTIONS[key].slug as RoutePath,
        nameBn: segments[key]?.shortNameBn || SECTIONS[key].shortNameBn,
        nameEn: segments[key]?.shortNameEn || SECTIONS[key].shortNameEn,
        iconName: SECTION_ICON_MAP[key],
        sectionKey: key,
        sortOrder: segments[key]?.sortOrder,
      }))
      .sort((a, b) => {
        if (typeof a.sortOrder === 'number' && typeof b.sortOrder === 'number') {
          return a.sortOrder - b.sortOrder;
        }
        return (Object.keys(SECTIONS) as SectionKey[]).indexOf(a.sectionKey) -
          (Object.keys(SECTIONS) as SectionKey[]).indexOf(b.sectionKey);
      });

    return [
      {
        id: 'rail-home',
        path: '/' as RoutePath,
        nameBn: 'মূলপাতা',
        nameEn: 'Home',
        iconName: 'home' as AppIconName,
      },
      ...categoryItems,
      {
        id: 'rail-explore',
        path: '/explore' as RoutePath,
        nameBn: 'এক্সপ্লোর',
        nameEn: 'Explore',
        iconName: 'compass' as AppIconName,
      },
      {
        id: 'rail-search',
        path: '/search' as RoutePath,
        nameBn: 'অনুসন্ধান',
        nameEn: 'Search',
        iconName: 'search' as AppIconName,
      },
      {
        id: 'rail-more',
        path: '/more' as RoutePath,
        nameBn: 'তথ্য ও নীতিমালা',
        nameEn: 'Info & guidelines',
        iconName: 'info' as AppIconName,
      },
    ];
  }, [segments]);

  return (
    <aside
      id="desktop-left-navigation-rail"
      aria-label={language === 'bn' ? 'ডেস্কটপ নেভিগেশন' : 'Desktop navigation'}
      className="hidden min-[1440px]:flex flex-col fixed top-0 bottom-0 left-0 h-[100dvh] overflow-y-auto w-[240px] min-[1536px]:w-[250px] min-[1920px]:w-[260px] px-4 min-[1920px]:px-5 py-5 bg-ui-surface border-r border-ui-stroke-subtle justify-between select-none z-30"
    >
      <div className="space-y-5">
        <BrandLogo
          id="rail-brand-logo"
          size="md"
          onClick={() => navigateTo('/')}
          className="transition-colors rounded-xl px-1 py-1 w-full"
        />

        <div>
          <Button
            id="rail-primary-report-cta"
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<AppIcon name="plus-circle" size="lg" className="text-ui-content-inverse" />}
            onClick={() => openReportComposer()}
            className="shadow-2xs font-semibold py-2.5 min-h-[44px] text-[16px]"
          >
            {language === 'bn' ? 'ঘটনা জানান' : 'Report incident'}
          </Button>
        </div>

        <nav className="space-y-1" aria-label={language === 'bn' ? 'প্রধান বিভাগ' : 'Main sections'}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.path;
            const sectionKey = 'sectionKey' in item ? item.sectionKey : undefined;
            const secConfig = sectionKey ? SECTIONS[sectionKey] : null;

            return (
              <button
                key={item.id}
                id={item.id}
                onClick={() => navigateTo(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[16px] font-medium transition-all duration-150 text-left cursor-pointer group min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  isActive
                    ? 'bg-ui-surface-elevated text-ui-content-primary font-semibold border border-ui-stroke-default'
                    : 'text-ui-content-secondary'
                }`}
                style={
                  isActive && secConfig
                    ? {
                        backgroundColor: secConfig.bgColor,
                        color: secConfig.textColor,
                        borderColor: secConfig.borderColor,
                      }
                    : undefined
                }
              >
                <div className="flex items-center gap-3 truncate">
                  <AppIcon
                    name={item.iconName}
                    size="lg"
                    className={`transition-colors ${
                      isActive && !secConfig
                        ? 'text-ui-content-primary'
                        : !isActive
                        ? 'text-ui-content-muted'
                        : ''
                    }`}
                  />
                  <span className="truncate">{language === 'bn' ? item.nameBn : item.nameEn}</span>
                </div>

                {sectionKey && secConfig && (
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'
                    }`}
                    style={{ backgroundColor: secConfig.primaryColor }}
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
          aria-label={
            language === 'bn'
              ? 'ইংরেজিতে পরিবর্তন করুন'
              : 'Switch to Bangla'
          }
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] rounded-xl border border-ui-stroke-subtle transition-colors cursor-pointer text-ui-content-secondary min-h-[44px] bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <span className="font-medium">{language === 'bn' ? 'ভাষা' : 'Language'}</span>
          <span className="font-semibold text-ui-content-primary px-2.5 py-1 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-lg text-[13px]">
            {language === 'bn' ? 'English' : 'বাংলা'}
          </span>
        </button>

        <div className="px-2 pt-1 text-[13px] text-ui-content-muted leading-tight">
          <p className="font-medium text-ui-content-secondary">
            {language === 'bn' ? 'নাগরিক প্ল্যাটফর্ম' : 'Citizen platform'}
          </p>
          <p className="text-[12px] opacity-80">
            {language === 'bn' ? 'বাংলাদেশ ২০২৬' : 'Bangladesh 2026'}
          </p>
        </div>
      </div>
    </aside>
  );
};
