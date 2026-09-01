import React from 'react';
import { Keyboard } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { ThemeSelector } from '../ui/ThemeSelector';
import { BrandLogo } from '../branding/BrandLogo';
import { AppIcon, AppIconName } from '../ui/AppIcon';

export const DesktopLeftRail: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    language,
    toggleLanguage,
    openReportComposer,
    setIsShortcutsModalOpen,
  } = useApp();

  const navItems: Array<{
    id: string;
    path: RoutePath;
    nameBn: string;
    nameEn: string;
    iconName: AppIconName;
    shortcutKey?: string;
    sectionKey?: SectionKey;
  }> = [
    {
      id: 'rail-home',
      path: '/',
      nameBn: 'মূলপাতা',
      nameEn: 'Home',
      iconName: 'home',
      shortcutKey: 'H',
    },
    {
      id: 'rail-harassment',
      path: '/harassment',
      nameBn: SECTIONS.harassment.shortNameBn,
      nameEn: SECTIONS.harassment.shortNameEn,
      iconName: 'harassment',
      shortcutKey: '1',
      sectionKey: 'harassment',
    },
    {
      id: 'rail-rickshaw',
      path: '/rickshaw',
      nameBn: SECTIONS.rickshaw.shortNameBn,
      nameEn: SECTIONS.rickshaw.shortNameEn,
      iconName: 'rickshaw',
      shortcutKey: '2',
      sectionKey: 'rickshaw',
    },
    {
      id: 'rail-extortion',
      path: '/extortion',
      nameBn: SECTIONS.extortion.shortNameBn,
      nameEn: SECTIONS.extortion.shortNameEn,
      iconName: 'extortion',
      shortcutKey: '3',
      sectionKey: 'extortion',
    },
    {
      id: 'rail-explore',
      path: '/explore',
      nameBn: 'এক্সপ্লোর',
      nameEn: 'Explore',
      iconName: 'compass',
      shortcutKey: 'E',
    },
    {
      id: 'rail-search',
      path: '/search',
      nameBn: 'অনুসন্ধান',
      nameEn: 'Search',
      iconName: 'search',
      shortcutKey: 'S',
    },
    {
      id: 'rail-more',
      path: '/more',
      nameBn: 'তথ্য ও নীতিমালা',
      nameEn: 'Info & Guidelines',
      iconName: 'info',
      shortcutKey: 'M',
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
            className="shadow-2xs font-semibold py-2.5 min-h-[44px] text-[16px] relative"
          >
            <span className="flex-1 text-left">{language === 'bn' ? 'ঘটনা জানান' : 'Report Incident'}</span>
            <kbd className="hidden min-[1536px]:inline-block px-1.5 py-0.5 text-[11px] font-mono font-bold bg-white/20 text-inverse rounded">
              C
            </kbd>
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

                <div className="flex items-center gap-2">
                  {item.shortcutKey && (
                    <kbd className="hidden min-[1536px]:inline-block px-1.5 py-0.5 text-[11px] font-mono font-medium text-muted bg-surface-subtle border border-subtle rounded group-hover:text-secondary group-hover:border-theme transition-colors">
                      {item.shortcutKey}
                    </kbd>
                  )}
                  {item.sectionKey && (
                    <span
                      className={`w-2.5 h-2.5 rounded-full shrink-0 transition-opacity ${
                        isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'
                      }`}
                      style={{ backgroundColor: `var(--sec-${item.sectionKey}-primary)` }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Appearance / Theme, Language toggle & Platform Note */}
      <div className="pt-4 border-t border-subtle space-y-2.5">
        {/* Desktop Theme Control */}
        <ThemeSelector variant="compact" />

        {/* Shortcuts Guide Button */}
        <button
          id="rail-shortcuts-toggle"
          onClick={() => setIsShortcutsModalOpen(true)}
          aria-label={language === 'bn' ? 'কীবোর্ড শর্টকাট দেখুন' : 'View Keyboard Shortcuts'}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] rounded-xl border border-subtle hover:bg-surface-subtle transition-colors cursor-pointer text-secondary hover:text-primary min-h-[44px] bg-surface"
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-muted" />
            <span className="font-medium">{language === 'bn' ? 'কীবোর্ড শর্টকাট' : 'Shortcuts'}</span>
          </div>
          <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-bold bg-surface-subtle border border-subtle rounded shadow-2xs">
            ?
          </kbd>
        </button>

        {/* Language Switcher Pill */}
        <button
          id="rail-lang-toggle"
          onClick={toggleLanguage}
          aria-label={`Switch language to ${language === 'bn' ? 'English' : 'Bengali'}`}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] rounded-xl border border-subtle hover:bg-surface-subtle transition-colors cursor-pointer text-secondary hover:text-primary min-h-[44px] bg-surface"
        >
          <div className="flex items-center gap-2">
            <AppIcon name="globe" size="md" className="text-muted" />
            <span className="font-medium">{language === 'bn' ? 'ভাষা' : 'Language'}</span>
          </div>
          <div className="flex items-center font-semibold text-[14px]">
            <span className={language === 'bn' ? 'text-primary font-bold' : 'text-muted'}>
              বাং
            </span>
            <span className="mx-1 text-muted">/</span>
            <span className={language === 'en' ? 'text-primary font-bold' : 'text-muted'}>
              EN
            </span>
          </div>
        </button>

        {/* Small Footer Notice */}
        <div className="px-2 text-[14px] text-muted leading-normal">
          <p className="font-medium text-secondary">
            {language === 'bn' ? 'মডারেটেড নাগরিক তথ্য' : 'Moderated Citizen Feed'}
          </p>
        </div>
      </div>
    </aside>
  );
};
