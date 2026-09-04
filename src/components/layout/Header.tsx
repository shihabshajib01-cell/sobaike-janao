import React from 'react';
import { Search, Menu, PlusCircle, Home, HeartHandshake, Zap, ZapOff, Building, ShieldAlert, Compass, PhoneCall, Globe } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { SECTIONS, SectionKey, COMING_SOON_SERVICES } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Drawer } from '../ui/Drawer';
import { ThemeSelector } from '../ui/ThemeSelector';
import { getContextualReportRoute } from '../../utils/reportRoutes';
import { BrandLogo } from '../branding/BrandLogo';

export const Header: React.FC = () => {
  const {
    currentRoute,
    navigateTo,
    language,
    toggleLanguage,
    isTabletMenuOpen,
    setIsTabletMenuOpen,
    openReportComposer,
  } = useApp();

  const navItems: Array<{
    path: RoutePath;
    nameBn: string;
    nameEn: string;
    sectionKey?: SectionKey;
    icon: React.ReactNode;
    isComingSoon?: boolean;
    badgeBn?: string;
    badgeEn?: string;
  }> = [
    {
      path: '/',
      nameBn: 'মূলপাতা',
      nameEn: 'Home',
      icon: <Home className="w-4 h-4" />,
    },
    {
      path: '/harassment',
      nameBn: SECTIONS.harassment.shortNameBn,
      nameEn: SECTIONS.harassment.shortNameEn,
      sectionKey: 'harassment',
      icon: <HeartHandshake className="w-4 h-4" />,
    },
    {
      path: '/rickshaw',
      nameBn: SECTIONS.rickshaw.shortNameBn,
      nameEn: SECTIONS.rickshaw.shortNameEn,
      sectionKey: 'rickshaw',
      icon: <Zap className="w-4 h-4" />,
    },
    {
      path: '/extortion',
      nameBn: SECTIONS.extortion.shortNameBn,
      nameEn: SECTIONS.extortion.shortNameEn,
      sectionKey: 'extortion',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
    {
      path: '/load-shedding',
      nameBn: COMING_SOON_SERVICES.load_shedding.shortNameBn,
      nameEn: COMING_SOON_SERVICES.load_shedding.shortNameEn,
      icon: <ZapOff className="w-4 h-4" />,
      isComingSoon: true,
      badgeBn: COMING_SOON_SERVICES.load_shedding.badgeBn,
      badgeEn: COMING_SOON_SERVICES.load_shedding.badgeEn,
    },
    {
      path: '/illegal-occupation',
      nameBn: COMING_SOON_SERVICES.illegal_occupation.shortNameBn,
      nameEn: COMING_SOON_SERVICES.illegal_occupation.shortNameEn,
      icon: <Building className="w-4 h-4" />,
      isComingSoon: true,
      badgeBn: COMING_SOON_SERVICES.illegal_occupation.badgeBn,
      badgeEn: COMING_SOON_SERVICES.illegal_occupation.badgeEn,
    },
    {
      path: '/explore',
      nameBn: 'এক্সপ্লোর',
      nameEn: 'Explore',
      icon: <Compass className="w-4 h-4" />,
    },
  ];

  const getSectionActiveStyles = (sectionKey?: SectionKey) => {
    if (!sectionKey) return 'bg-surface-subtle text-primary font-bold border border-subtle';
    if (sectionKey === 'harassment') {
      return 'bg-[var(--sec-harassment-bg)] text-[var(--sec-harassment-text)] border border-[var(--sec-harassment-border)] font-bold';
    }
    if (sectionKey === 'rickshaw') {
      return 'bg-[var(--sec-rickshaw-bg)] text-[var(--sec-rickshaw-text)] border border-[var(--sec-rickshaw-border)] font-bold';
    }
    if (sectionKey === 'extortion') {
      return 'bg-[var(--sec-extortion-bg)] text-[var(--sec-extortion-text)] border border-[var(--sec-extortion-border)] font-bold';
    }
    return 'bg-surface-subtle text-primary font-bold border border-subtle';
  };

  return (
    <>
      <header
        id="tablet-compact-header"
        className="hidden md:block min-[1440px]:hidden sticky top-0 z-40 w-full bg-surface border-b border-subtle"
      >
        <div className="w-full max-w-[900px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo */}
            <BrandLogo
              id="tablet-brand-logo"
              size="sm"
              onClick={() => navigateTo('/')}
              englishClassName="hidden min-[900px]:block text-[14px] leading-tight text-secondary font-medium"
            />

            {/* Right Action Cluster for Tablet: ONLY Report CTA + Menu */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Primary Action Button: Contextual Report CTA */}
              <Button
                id="tablet-report-cta"
                variant="primary"
                size="md"
                leftIcon={<PlusCircle className="w-4 h-4 text-inverse" />}
                onClick={() => openReportComposer()}
                className="shadow-2xs font-semibold text-[16px] min-h-[44px]"
              >
                {language === 'bn' ? 'ঘটনা জানান' : 'Report Incident'}
              </Button>

              {/* Menu Drawer Button */}
              <IconButton
                id="tablet-menu-button"
                icon={<Menu className="w-5 h-5 text-primary" />}
                aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open navigation menu'}
                size="md"
                onClick={() => setIsTabletMenuOpen(true)}
                className="border border-subtle rounded-xl bg-surface-subtle hover:bg-surface min-h-[44px] min-w-[44px]"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Slide-over Drawer for Tablet and Mobile Menu */}
      <Drawer
        id="tablet-drawer"
        isOpen={isTabletMenuOpen}
        onClose={() => setIsTabletMenuOpen(false)}
        position="right"
        title={language === 'bn' ? 'সবাইকে জানাও' : 'Sobaike Janao'}
        description={
          language === 'bn'
            ? 'পাবলিক রিপোর্টিং ও জনসচেতনতা প্ল্যাটফর্ম'
            : 'Public citizen reporting platform'
        }
      >
        <div className="space-y-4">
          {/* Navigation Section */}
          <div className="space-y-1">
            <p className="text-[14px] font-semibold text-muted uppercase tracking-wide px-3 mb-2">
              {language === 'bn' ? 'বিভাগ ও পাতা' : 'Sections & Pages'}
            </p>
            {navItems.map((item) => {
              const isActive = currentRoute === item.path;
              const secConfig = item.sectionKey ? SECTIONS[item.sectionKey] : null;

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setIsTabletMenuOpen(false);
                    navigateTo(item.path);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[16px] font-medium transition-colors text-left cursor-pointer min-h-[44px] ${
                    isActive
                      ? getSectionActiveStyles(item.sectionKey)
                      : 'text-secondary hover:text-primary hover:bg-surface-subtle'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      style={{
                        color: isActive && secConfig ? `var(--sec-${item.sectionKey}-primary)` : undefined,
                      }}
                      className={isActive && !secConfig ? 'text-primary' : 'text-muted'}
                    >
                      {item.icon}
                    </span>
                    <span>{language === 'bn' ? item.nameBn : item.nameEn}</span>
                  </div>
                  {item.sectionKey && (
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: `var(--sec-${item.sectionKey}-primary)` }}
                    />
                  )}
                  {item.isComingSoon && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-surface-subtle border border-subtle text-muted shrink-0 leading-tight">
                      {language === 'bn' ? item.badgeBn : item.badgeEn}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary Utilities */}
          <div className="pt-3 border-t border-subtle space-y-1">
            <button
              onClick={() => {
                setIsTabletMenuOpen(false);
                navigateTo('/search');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[16px] font-medium text-left min-h-[44px] cursor-pointer transition-colors ${
                currentRoute === '/search'
                  ? 'bg-surface-subtle text-primary font-bold border border-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface-subtle'
              }`}
            >
              <Search className="w-5 h-5 text-muted" />
              <span>{language === 'bn' ? 'অনুসন্ধান' : 'Search Reports'}</span>
            </button>

            <button
              onClick={() => {
                setIsTabletMenuOpen(false);
                navigateTo('/more');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[16px] font-medium text-left min-h-[44px] cursor-pointer transition-colors ${
                currentRoute === '/more'
                  ? 'bg-surface-subtle text-primary font-bold border border-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface-subtle'
              }`}
            >
              <PhoneCall className="w-5 h-5 text-muted" />
              <span>{language === 'bn' ? 'জরুরি সহায়তা ও তথ্য' : 'Support & Info'}</span>
            </button>
          </div>

          {/* Settings Section: Appearance / Theme & Language Switcher */}
          <div className="pt-3 border-t border-subtle space-y-3">
            <p className="text-[14px] font-semibold text-muted uppercase tracking-wide px-1">
              {language === 'bn' ? 'সেটিংস' : 'Settings'}
            </p>

            {/* Appearance / Theme Selector */}
            <div className="space-y-1.5">
              <span className="text-[14px] text-secondary font-medium px-1">
                {language === 'bn' ? 'প্রদর্শন (থিম)' : 'Appearance'}
              </span>
              <ThemeSelector variant="segmented" />
            </div>

            {/* Language Switcher in Drawer */}
            <div className="space-y-1.5">
              <span className="text-[14px] text-secondary font-medium px-1">
                {language === 'bn' ? 'ভাষা' : 'Language'}
              </span>
              <button
                id="drawer-lang-toggle"
                onClick={toggleLanguage}
                aria-label={`Switch language to ${language === 'bn' ? 'English' : 'Bengali'}`}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] rounded-xl border border-subtle hover:bg-surface-subtle transition-colors cursor-pointer text-secondary hover:text-primary min-h-[44px] bg-surface"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted" />
                  <span className="font-medium">{language === 'bn' ? 'বাংলা / English' : 'English / বাংলা'}</span>
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
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};
