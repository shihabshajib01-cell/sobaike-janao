import React from 'react';
import { useApp, RoutePath } from '../../context/AppContext';
import { SECTIONS, SectionKey, COMING_SOON_SERVICES } from '../../theme/tokens';
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
    isComingSoon?: boolean;
    badgeBn?: string;
    badgeEn?: string;
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
      path: '/harassment',
      nameBn: SECTIONS.harassment.shortNameBn,
      nameEn: SECTIONS.harassment.shortNameEn,
      iconName: 'harassment',
      sectionKey: 'harassment',
    },
    {
      id: 'rail-rickshaw',
      path: '/rickshaw',
      nameBn: SECTIONS.rickshaw.shortNameBn,
      nameEn: SECTIONS.rickshaw.shortNameEn,
      iconName: 'rickshaw',
      sectionKey: 'rickshaw',
    },
    {
      id: 'rail-extortion',
      path: '/extortion',
      nameBn: SECTIONS.extortion.shortNameBn,
      nameEn: SECTIONS.extortion.shortNameEn,
      iconName: 'extortion',
      sectionKey: 'extortion',
    },
    {
      id: 'rail-load-shedding',
      path: '/load-shedding',
      nameBn: COMING_SOON_SERVICES.load_shedding.shortNameBn,
      nameEn: COMING_SOON_SERVICES.load_shedding.shortNameEn,
      iconName: 'zap-off',
      isComingSoon: true,
      badgeBn: COMING_SOON_SERVICES.load_shedding.badgeBn,
      badgeEn: COMING_SOON_SERVICES.load_shedding.badgeEn,
    },
    {
      id: 'rail-illegal-occupation',
      path: '/illegal-occupation',
      nameBn: COMING_SOON_SERVICES.illegal_occupation.shortNameBn,
      nameEn: COMING_SOON_SERVICES.illegal_occupation.shortNameEn,
      iconName: 'building',
      isComingSoon: true,
      badgeBn: COMING_SOON_SERVICES.illegal_occupation.badgeBn,
      badgeEn: COMING_SOON_SERVICES.illegal_occupation.badgeEn,
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
      nameEn: 'Info & Guidelines',
      iconName: 'info',
    },
  ];

  const getSectionActiveStyles = (sectionKey?: SectionKey) => {
    if (!sectionKey) return 'bg-surface-elevated text-primary font-semibold border border-theme';
    if (sectionKey === 'harassment') {
      return 'bg-[var(--sec-harassment-bg)] text-[var(--sec-harassment-text)] border border-[var(--sec-harassment-border)] font-semibold';
    }
    if (sectionKey === 'rickshaw') {
      return 'bg-[var(--sec-rickshaw-bg)] text-[var(--sec-rickshaw-text)] border border-[var(--sec-rickshaw-border)] font-semibold';
    }
    if (sectionKey === 'extortion') {
      return 'bg-[var(--sec-extortion-bg)] text-[var(--sec-extortion-text)] border border-[var(--sec-extortion-border)] font-semibold';
    }
    return 'bg-surface-elevated text-primary font-semibold border border-theme';
  };

  return (
    <aside
      id="desktop-left-navigation-rail"
      aria-label="Desktop Navigation"
      className="hidden min-[1440px]:flex flex-col fixed top-0 bottom-0 left-0 h-[100dvh] overflow-y-auto w-[240px] min-[1536px]:w-[250px] min-[1920px]:w-[260px] px-4 min-[1920px]:px-5 py-5 bg-surface border-r border-subtle justify-between select-none z-30"
    >
      {/* Top: Brand Header & Primary Nav items */}
      <div className="space-y-5">
        {/* Brand Logo & Wordmark */}
        <BrandLogo
          id="rail-brand-logo"
          size="md"
          onClick={() => navigateTo('/')}
          className="hover:bg-surface-subtle transition-colors rounded-xl px-1 py-1 w-full"
        />

        {/* Primary Action Button: Contextual Report CTA */}
        <div>
          <Button
            id="rail-primary-report-cta"
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<AppIcon name="plus-circle" size="lg" className="text-inverse" />}
            onClick={() => openReportComposer()}
            className="shadow-2xs font-semibold py-2.5 min-h-[44px] text-[16px]"
          >
            {language === 'bn' ? 'ঘটনা জানান' : 'Report Incident'}
          </Button>
        </div>

        {/* Nav Links List */}
        <nav className="space-y-1" aria-label="Main Sections">
          {navItems.map((item) => {
            const isActive = currentRoute === item.path;
            const secConfig = item.sectionKey ? SECTIONS[item.sectionKey] : null;

            return (
              <button
                key={item.id}
                id={item.id}
                onClick={() => navigateTo(item.path)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[16px] font-medium transition-all duration-150 text-left cursor-pointer group min-h-[44px] ${
                  isActive
                    ? getSectionActiveStyles(item.sectionKey)
                    : 'text-secondary hover:text-primary hover:bg-surface-subtle'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <AppIcon
                    name={item.iconName}
                    size="lg"
                    className={`transition-colors ${
                      isActive && !secConfig
                        ? 'text-primary'
                        : !isActive
                        ? 'text-muted group-hover:text-primary'
                        : ''
                    }`}
                  />
                  <span className="truncate">{language === 'bn' ? item.nameBn : item.nameEn}</span>
                </div>

                {item.sectionKey && (
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'
                    }`}
                    style={{ backgroundColor: `var(--sec-${item.sectionKey}-primary)` }}
                  />
                )}

                {item.isComingSoon && (
                  <span
                    id={`${item.id}-badge`}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-subtle border border-subtle text-muted shrink-0 leading-tight"
                  >
                    {language === 'bn' ? item.badgeBn : item.badgeEn}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Appearance / Theme, Language toggle & Platform Note */}
      <div className="pt-4 border-t border-subtle space-y-2.5">
        {/* Desktop Theme Control */}
        <ThemeSelector variant="compact" />

        {/* Language Switcher Pill */}
        <button
          id="rail-lang-toggle"
          onClick={toggleLanguage}
          aria-label={language === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] rounded-xl border border-subtle hover:bg-surface-subtle transition-colors cursor-pointer text-secondary hover:text-primary min-h-[44px] bg-surface"
        >
          <span className="font-medium">{language === 'bn' ? 'ভাষা' : 'Language'}</span>
          <span className="font-semibold text-primary px-2.5 py-1 bg-surface-subtle border border-subtle rounded-lg text-[13px]">
            {language === 'bn' ? 'English' : 'বাংলা'}
          </span>
        </button>

        {/* Minimal Platform Signature */}
        <div className="px-2 pt-1 text-[13px] text-muted leading-tight">
          <p className="font-medium text-secondary">নাগরিক সেবা প্ল্যাটফর্ম</p>
          <p className="text-[12px] opacity-80">বাংলাদেশ ২০২৬</p>
        </div>
      </div>
    </aside>
  );
};
