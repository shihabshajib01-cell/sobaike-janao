import React from 'react';
import { useApp, RoutePath } from '../../context/AppContext';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { ThemeSelector } from '../ui/ThemeSelector';
import { BrandLogo } from '../branding/BrandLogo';
import { AppIcon, AppIconName } from '../ui/AppIcon';

export const DesktopLeftRail: React.FC = () => {
  const { currentRoute, navigateTo, language, toggleLanguage, openReportComposer } = useApp();

  const navItems: Array<{
    id: string;
    path: RoutePath;
    nameBn: string;
    nameEn: string;
    iconName: AppIconName;
    sectionKey?: SectionKey;
  }> = [
    {
      id: 'rail-home',
      path: '/',
      nameBn: 'মূলপাতা',
      nameEn: 'Home',
      iconName: 'home',
    },
    {
      id: 'rail-harassment',
      path: SECTIONS.harassment.slug,
      nameBn: SECTIONS.harassment.shortNameBn,
      nameEn: SECTIONS.harassment.shortNameEn,
      iconName: 'harassment',
      sectionKey: 'harassment',
    },
    {
      id: 'rail-extortion',
      path: SECTIONS.extortion.slug,
      nameBn: SECTIONS.extortion.shortNameBn,
      nameEn: SECTIONS.extortion.shortNameEn,
      iconName: 'extortion',
      sectionKey: 'extortion',
    },
    {
      id: 'rail-public-safety',
      path: SECTIONS.public_safety.slug,
      nameBn: SECTIONS.public_safety.shortNameBn,
      nameEn: SECTIONS.public_safety.shortNameEn,
      iconName: 'public-safety',
      sectionKey: 'public_safety',
    },
    {
      id: 'rail-road-transport',
      path: SECTIONS.road_transport.slug,
      nameBn: SECTIONS.road_transport.shortNameBn,
      nameEn: SECTIONS.road_transport.shortNameEn,
      iconName: 'road-transport',
      sectionKey: 'road_transport',
    },
    {
      id: 'rail-load-shedding',
      path: SECTIONS.load_shedding.slug,
      nameBn: SECTIONS.load_shedding.shortNameBn,
      nameEn: SECTIONS.load_shedding.shortNameEn,
      iconName: 'zap-off',
      sectionKey: 'load_shedding',
    },
    {
      id: 'rail-illegal-occupation',
      path: SECTIONS.illegal_occupation.slug,
      nameBn: SECTIONS.illegal_occupation.shortNameBn,
      nameEn: SECTIONS.illegal_occupation.shortNameEn,
      iconName: 'illegal-occupation',
      sectionKey: 'illegal_occupation',
    },
    {
      id: 'rail-rickshaw',
      path: SECTIONS.rickshaw.slug,
      nameBn: SECTIONS.rickshaw.shortNameBn,
      nameEn: SECTIONS.rickshaw.shortNameEn,
      iconName: 'rickshaw',
      sectionKey: 'rickshaw',
    },
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

  const getSectionActiveStyles = (sectionKey?: SectionKey) => {
    if (!sectionKey) {
      return 'bg-ui-surface-elevated text-ui-content-primary font-semibold border border-ui-stroke-default';
    }
    return 'font-semibold border';
  };

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
          className="transition-colors rounded-[var(--radius-control)] px-1 py-1 w-full"
        />

        <div>
          <Button
            id="rail-primary-report-cta"
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<AppIcon name="plus-circle" size="lg" className="text-ui-content-inverse" />}
            onClick={() => openReportComposer()}
            className="shadow-[var(--elevation-2xs)] font-semibold py-2.5 min-h-[44px] text-[var(--type-fixed-16)]"
          >
            {language === 'bn' ? 'ঘটনা জানান' : 'Report incident'}
          </Button>
        </div>

        <nav className="space-y-1" aria-label={language === 'bn' ? 'প্রধান বিভাগ' : 'Main sections'}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.path;
            const secConfig = item.sectionKey ? SECTIONS[item.sectionKey] : null;

            return (
              <button
                key={item.id}
                id={item.id}
                onClick={() => navigateTo(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[var(--radius-control)] text-[var(--type-fixed-16)] font-medium transition-all duration-150 text-left cursor-pointer group min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  isActive
                    ? getSectionActiveStyles(item.sectionKey)
                    : 'text-ui-content-secondary'
                }`}
                style={
                  isActive && item.sectionKey
                    ? {
                        backgroundColor: `var(--sec-${item.sectionKey}-bg)`,
                        color: `var(--sec-${item.sectionKey}-text)`,
                        borderColor: `var(--sec-${item.sectionKey}-border)`,
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

                {item.sectionKey && (
                  <span
                    className={`w-2.5 h-2.5 rounded-[var(--radius-pill)] shrink-0 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'
                    }`}
                    style={{ backgroundColor: `var(--sec-${item.sectionKey}-primary)` }}
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
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[var(--type-fixed-14)] rounded-[var(--radius-control)] border border-ui-stroke-subtle transition-colors cursor-pointer text-ui-content-secondary min-h-[44px] bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <span className="font-medium">{language === 'bn' ? 'ভাষা' : 'Language'}</span>
          <span className="font-semibold text-ui-content-primary px-2.5 py-1 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-[var(--radius-badge-md)] text-[var(--type-fixed-13)]">
            {language === 'bn' ? 'English' : 'বাংলা'}
          </span>
        </button>

        <div className="px-2 pt-1 text-[var(--type-fixed-13)] text-ui-content-muted leading-tight">
          <p className="font-medium text-ui-content-secondary">
            {language === 'bn' ? 'নাগরিক প্ল্যাটফর্ম' : 'Citizen platform'}
          </p>
          <p className="text-[var(--type-fixed-12)] opacity-80">
            {language === 'bn' ? 'বাংলাদেশ ২০২৬' : 'Bangladesh 2026'}
          </p>
        </div>
      </div>
    </aside>
  );
};
