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
      nameBn: SECTIONS.load_shedding.shortNameBn,
      nameEn: SECTIONS.load_shedding.shortNameEn,
      iconName: 'zap-off',
      sectionKey: 'load_shedding',
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
    if (!sectionKey) return 'bg-ui-surface-elevated text-ui-content-primary font-semibold border border-ui-stroke-default';
    if (sectionKey === 'harassment') {
      return 'bg-[var(--sec-harassment-bg)] text-[var(--sec-harassment-text)] border border-[var(--sec-harassment-border)] font-semibold';
    }
    if (sectionKey === 'rickshaw') {
      return 'bg-[var(--sec-rickshaw-bg)] text-[var(--sec-rickshaw-text)] border border-[var(--sec-rickshaw-border)] font-semibold';
    }
    if (sectionKey === 'extortion') {
      return 'bg-[var(--sec-extortion-bg)] text-[var(--sec-extortion-text)] border border-[var(--sec-extortion-border)] font-semibold';
    }
    if (sectionKey === 'load_shedding') {
      return 'bg-[var(--sec-load_shedding-bg)] text-[var(--sec-load_shedding-text)] border border-[var(--sec-load_shedding-border)] font-semibold';
    }
    return 'bg-ui-surface-elevated text-ui-content-primary font-semibold border border-ui-stroke-default';
  };

  return (
    <aside
      id="desktop-left-navigation-rail"
      style={{
        top: 'var(--connectivity-banner-height, 0px)',
        height: 'calc(100dvh - var(--connectivity-banner-height, 0px))',
      }}
      aria-label={language === 'bn' ? 'ডেস্কটপ নেভিগেশন' : 'Desktop Navigation'}
      className="hidden min-[1440px]:flex flex-col fixed top-0 bottom-0 left-0 overflow-y-auto w-[240px] min-[1536px]:w-[250px] min-[1920px]:w-[260px] px-4 min-[1920px]:px-5 py-5 bg-ui-surface border-r border-ui-stroke-subtle justify-between select-none z-30 transition-[top,height] duration-200"
    >
      {/* Top: Brand Header & Primary Nav items */}
      <div className="space-y-5">
        {/* Brand Logo & Wordmark */}
        <BrandLogo
          id="rail-brand-logo"
          size="md"
          onClick={() => navigateTo('/')}
          className="transition-colors rounded-xl px-1 py-1 w-full"
        />

        {/* Primary Action Button: Contextual Report CTA */}
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
            {language === 'bn' ? 'ঘটনা জানান' : 'Report Incident'}
          </Button>
        </div>

        {/* Nav Links List */}
        <nav className="space-y-1" aria-label={language === 'bn' ? 'প্রধান বিভাগসমূহ' : 'Main Sections'}>
          {navItems.map((item) => {
            const isActive = currentRoute === item.path;
            const secConfig = item.sectionKey ? SECTIONS[item.sectionKey] : null;

            return (
              <button
                key={item.id}
                id={item.id}
                onClick={() => navigateTo(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[16px] font-medium transition-all duration-150 text-left cursor-pointer group min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  isActive
                    ? getSectionActiveStyles(item.sectionKey)
                    : 'text-ui-content-secondary'
                }`}
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
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'
                    }`}
                    style={{ backgroundColor: `var(--sec-${item.sectionKey}-primary)` }}
                  />
                )}

                {item.isComingSoon && (
                  <span
                    id={`${item.id}-badge`}
                    className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-ui-surface-subtle border border-ui-stroke-subtle text-ui-content-muted shrink-0 leading-tight"
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
      <div className="pt-4 border-t border-ui-stroke-subtle space-y-2.5">
        {/* Desktop Theme Control */}
        <ThemeSelector variant="compact" />

        {/* Language Switcher Pill */}
        <button
          id="rail-lang-toggle"
          onClick={toggleLanguage}
          aria-label={
            language === 'bn'
              ? 'ভাষা পরিবর্তন করে ইংরেজিতে নিন'
              : 'Switch language to Bengali'
          }
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] rounded-xl border border-ui-stroke-subtle transition-colors cursor-pointer text-ui-content-secondary min-h-[44px] bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <span className="font-medium">{language === 'bn' ? 'ভাষা' : 'Language'}</span>
          <span className="font-semibold text-ui-content-primary px-2.5 py-1 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-lg text-[13px]">
            {language === 'bn' ? 'English' : 'বাংলা'}
          </span>
        </button>

        {/* Minimal Platform Signature */}
        <div className="px-2 pt-1 text-[13px] text-ui-content-muted leading-tight">
          <p className="font-medium text-ui-content-secondary">
            {language === 'bn' ? 'নাগরিক সেবা প্ল্যাটফর্ম' : 'Citizen Platform'}
          </p>
          <p className="text-[12px] opacity-80">
            {language === 'bn' ? 'বাংলাদেশ ২০২৬' : 'Bangladesh 2026'}
          </p>
        </div>
      </div>
    </aside>
  );
};
