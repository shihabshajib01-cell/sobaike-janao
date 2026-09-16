import React from 'react';
import { Search, Menu, PlusCircle, Home, Compass, PhoneCall, Globe } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Drawer } from '../ui/Drawer';
import { ThemeSelector } from '../ui/ThemeSelector';
import { BrandLogo } from '../branding/BrandLogo';
import { CategoryIcon } from '../branding/CategoryIcon';

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
  }> = [
    {
      path: '/',
      nameBn: 'মূলপাতা',
      nameEn: 'Home',
      icon: <Home className="w-4 h-4" aria-hidden="true" />,
    },
    ...(
      [
        'harassment',
        'extortion',
        'public_safety',
        'road_transport',
        'load_shedding',
        'illegal_occupation',
        'rickshaw',
      ] as SectionKey[]
    ).map((sectionKey) => ({
      path: SECTIONS[sectionKey].slug,
      nameBn: SECTIONS[sectionKey].shortNameBn,
      nameEn: SECTIONS[sectionKey].shortNameEn,
      sectionKey,
      icon: <CategoryIcon section={sectionKey} size="md" />,
    })),
    {
      path: '/explore',
      nameBn: 'এক্সপ্লোর',
      nameEn: 'Explore',
      icon: <Compass className="w-4 h-4" aria-hidden="true" />,
    },
  ];

  const getSectionActiveStyles = (sectionKey?: SectionKey) => {
    if (!sectionKey) {
      return 'bg-ui-surface-subtle text-ui-content-primary font-bold border border-ui-stroke-subtle';
    }
    return 'font-bold border';
  };

  return (
    <>
      <header
        id="tablet-compact-header"
        className="hidden md:block min-[1440px]:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle"
      >
        <div className="w-full max-w-[900px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <BrandLogo
              id="tablet-brand-logo"
              size="sm"
              onClick={() => navigateTo('/')}
              englishClassName="hidden min-[900px]:block text-[14px] leading-tight text-ui-content-secondary font-medium"
            />

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Button
                id="tablet-report-cta"
                variant="primary"
                size="md"
                leftIcon={<PlusCircle className="w-4 h-4 text-ui-content-inverse" />}
                onClick={() => openReportComposer()}
                className="shadow-2xs font-semibold text-[16px] min-h-[44px]"
              >
                {language === 'bn' ? 'ঘটনা জানান' : 'Report incident'}
              </Button>

              <IconButton
                id="tablet-menu-button"
                icon={<Menu className="w-5 h-5 text-ui-content-primary" />}
                aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
                size="md"
                onClick={() => setIsTabletMenuOpen(true)}
                className="border border-ui-stroke-subtle rounded-xl bg-ui-surface-subtle min-h-[44px] min-w-[44px]"
              />
            </div>
          </div>
        </div>
      </header>

      <Drawer
        id="tablet-drawer"
        isOpen={isTabletMenuOpen}
        onClose={() => setIsTabletMenuOpen(false)}
        position="right"
        language={language}
        title={language === 'bn' ? 'সবাইকে জানাও' : 'Sobaike Janao'}
        description={
          language === 'bn'
            ? 'নাগরিক তথ্য ও অভিযোগ প্ল্যাটফর্ম'
            : 'Citizen reporting platform'
        }
      >
        <div className="space-y-4">
          <nav className="space-y-1" aria-label={language === 'bn' ? 'মেনু নেভিগেশন' : 'Menu navigation'}>
            <p className="text-[14px] font-semibold text-ui-content-muted uppercase tracking-wide px-3 mb-2">
              {language === 'bn' ? 'বিভাগ ও পাতা' : 'Sections & pages'}
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
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-[16px] font-medium transition-colors text-left cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
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
                  <div className="flex items-center gap-3">
                    <span className={isActive && !secConfig ? 'text-ui-content-primary' : 'text-ui-content-muted'}>
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
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-ui-stroke-subtle space-y-1">
            <button
              onClick={() => {
                setIsTabletMenuOpen(false);
                navigateTo('/search');
              }}
              aria-current={currentRoute === '/search' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[16px] font-medium text-left min-h-[44px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                currentRoute === '/search'
                  ? 'bg-ui-surface-subtle text-ui-content-primary font-bold border border-ui-stroke-subtle'
                  : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle'
              }`}
            >
              <Search className="w-5 h-5 text-ui-content-muted" aria-hidden="true" />
              <span>{language === 'bn' ? 'অনুসন্ধান' : 'Search'}</span>
            </button>

            <button
              onClick={() => {
                setIsTabletMenuOpen(false);
                navigateTo('/more');
              }}
              aria-current={currentRoute === '/more' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-[16px] font-medium text-left min-h-[44px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                currentRoute === '/more'
                  ? 'bg-ui-surface-subtle text-ui-content-primary font-bold border border-ui-stroke-subtle'
                  : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle'
              }`}
            >
              <PhoneCall className="w-5 h-5 text-ui-content-muted" aria-hidden="true" />
              <span>{language === 'bn' ? 'তথ্য ও সহায়তা' : 'Info & support'}</span>
            </button>
          </div>

          <div className="pt-3 border-t border-ui-stroke-subtle space-y-3">
            <p className="text-[14px] font-semibold text-ui-content-muted uppercase tracking-wide px-1">
              {language === 'bn' ? 'সেটিংস' : 'Settings'}
            </p>

            <div className="space-y-1.5">
              <span className="text-[14px] text-ui-content-secondary font-medium px-1">
                {language === 'bn' ? 'প্রদর্শন' : 'Appearance'}
              </span>
              <ThemeSelector variant="segmented" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[14px] text-ui-content-secondary font-medium px-1">
                {language === 'bn' ? 'ভাষা' : 'Language'}
              </span>
              <button
                id="drawer-lang-toggle"
                onClick={toggleLanguage}
                aria-label={
                  language === 'bn'
                    ? 'ইংরেজিতে পরিবর্তন করুন'
                    : 'Switch to Bangla'
                }
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] rounded-xl border border-ui-stroke-subtle transition-colors cursor-pointer text-ui-content-secondary hover:text-ui-content-primary min-h-[44px] bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-ui-content-muted" aria-hidden="true" />
                  <span className="font-medium">{language === 'bn' ? 'বাংলা / English' : 'English / বাংলা'}</span>
                </div>
                <div className="flex items-center font-semibold text-[14px]">
                  <span className={language === 'bn' ? 'text-ui-content-primary font-bold' : 'text-ui-content-muted'}>
                    বাং
                  </span>
                  <span className="mx-1 text-ui-content-muted">/</span>
                  <span className={language === 'en' ? 'text-ui-content-primary font-bold' : 'text-ui-content-muted'}>
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
