import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Menu, PlusCircle, Home, Compass, PhoneCall } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { CATEGORY_ORDER } from '../../data/categoryOrder';
import { CategoryPopularityService } from '../../services/categoryPopularityService';
import { SectionKey } from '../../theme/tokens';
import { useTaxonomy } from '../../services/taxonomyService';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { Drawer } from '../ui/Drawer';
import { ThemeSelector } from '../ui/ThemeSelector';
import { TextSizeSelector } from '../ui/TextSizeSelector';
import { LanguageSelector } from '../ui/LanguageSelector';
import { BrandLogo } from '../branding/BrandLogo';
import { CategoryIcon } from '../branding/CategoryIcon';

export const Header: React.FC = () => {
  const {
    currentRoute,
    language,
    isTabletMenuOpen,
    setIsTabletMenuOpen,
    openReportComposer,
  } = useApp();
  const { segments, getSegment } = useTaxonomy();
  const [categoryOrder, setCategoryOrder] = useState<SectionKey[]>(CATEGORY_ORDER);
  const localizePath = (path: RoutePath) =>
    language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

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
    ...categoryOrder
      .map((sectionKey) => getSegment(sectionKey))
      .filter(Boolean)
      .map((segment) => ({
        path: segment.slug as RoutePath,
        nameBn: segment.shortNameBn,
        nameEn: segment.shortNameEn,
        sectionKey: segment.id as SectionKey,
        icon: <CategoryIcon section={segment.id as SectionKey} size="md" />,
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
      return 'bg-ui-surface-subtle text-ui-content-primary font-[var(--font-weight-bold)] border border-ui-stroke-subtle';
    }
    return 'font-[var(--font-weight-bold)] border';
  };

  return (
    <>
      <header
        id="tablet-compact-header"
        className="hidden md:block min-[1440px]:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle"
      >
        <div className="w-full max-w-[900px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            <Link
              to={localizePath('/')}
              aria-label={language === 'bn' ? 'সবাইকে জানাও — মূলপাতা' : 'Sobaike Janao — Home'}
              className="rounded-[var(--radius-control)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            >
              <BrandLogo
                id="tablet-brand-logo"
                size="sm"
                englishClassName="hidden min-[900px]:block type-meta leading-tight text-ui-content-secondary font-[var(--font-weight-medium)]"
              />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Button
                id="tablet-report-cta"
                variant="primary"
                size="md"
                leftIcon={<PlusCircle className="w-4 h-4 text-ui-content-inverse" aria-hidden="true" />}
                onClick={() => openReportComposer()}
                className="font-[var(--font-weight-semibold)]"
              >
                {language === 'bn' ? 'ঘটনা জানান' : 'Report incident'}
              </Button>

              <IconButton
                id="tablet-menu-button"
                icon={<Menu className="w-5 h-5 text-ui-content-primary" aria-hidden="true" />}
                aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open menu'}
                size="md"
                onClick={() => setIsTabletMenuOpen(true)}
                className="border border-ui-stroke-subtle ui-radius-control bg-ui-surface-subtle"
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
        description={language === 'bn' ? 'নাগরিক তথ্য ও অভিযোগ প্ল্যাটফর্ম' : 'Citizen reporting platform'}
      >
        <div>
          <nav className="hidden md:block space-y-1" aria-label={language === 'bn' ? 'মেনু নেভিগেশন' : 'Menu navigation'}>
            <p className="type-label font-[var(--font-weight-semibold)] text-ui-content-muted uppercase tracking-wide px-3 mb-2">
              {language === 'bn' ? 'বিভাগ ও পাতা' : 'Sections & pages'}
            </p>
            {navItems.map((item) => {
              const isActive = currentRoute === item.path;
              const secConfig = item.sectionKey ? getSegment(item.sectionKey) : null;

              return (
                <Link
                  key={item.path}
                  to={localizePath(item.path)}
                  onClick={() => setIsTabletMenuOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center justify-between px-3.5 py-3 ui-radius-control type-action font-[var(--font-weight-medium)] transition-colors text-left cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
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
                  <span className="flex items-center gap-3 min-w-0">
                    <span className={isActive && !secConfig ? 'text-ui-content-primary' : 'text-ui-content-muted'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{language === 'bn' ? item.nameBn : item.nameEn}</span>
                  </span>
                  {item.sectionKey && (
                    <span
                      className="w-2.5 h-2.5 ui-radius-pill shrink-0"
                      style={{ backgroundColor: secConfig?.primaryColor || 'var(--ui-action-bg)' }}
                      aria-hidden="true"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-1 md:mt-4 md:pt-3 md:border-t md:border-ui-stroke-subtle">
            <Link
              to={localizePath('/search')}
              onClick={() => setIsTabletMenuOpen(false)}
              aria-current={currentRoute === '/search' ? 'page' : undefined}
              className={`hidden md:flex w-full items-center gap-3 px-3.5 py-3 ui-radius-control type-action font-[var(--font-weight-medium)] text-left min-h-[44px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                currentRoute === '/search'
                  ? 'bg-ui-surface-subtle text-ui-content-primary font-[var(--font-weight-bold)] border border-ui-stroke-subtle'
                  : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle'
              }`}
            >
              <Search className="w-5 h-5 text-ui-content-muted" aria-hidden="true" />
              <span>{language === 'bn' ? 'অনুসন্ধান' : 'Search'}</span>
            </Link>

            <Link
              to={localizePath('/more')}
              onClick={() => setIsTabletMenuOpen(false)}
              aria-current={currentRoute === '/more' ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3.5 py-3 ui-radius-control type-action font-[var(--font-weight-medium)] text-left min-h-[44px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                currentRoute === '/more'
                  ? 'bg-ui-surface-subtle text-ui-content-primary font-[var(--font-weight-bold)] border border-ui-stroke-subtle'
                  : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle'
              }`}
            >
              <PhoneCall className="w-5 h-5 text-ui-content-muted" aria-hidden="true" />
              <span>{language === 'bn' ? 'তথ্য ও সহায়তা' : 'Info & support'}</span>
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-ui-stroke-subtle space-y-3">
            <p className="type-label font-[var(--font-weight-semibold)] text-ui-content-muted uppercase tracking-wide px-1">
              {language === 'bn' ? 'সেটিংস' : 'Settings'}
            </p>

            <div className="space-y-1.5">
              <p className="type-meta text-ui-content-secondary font-[var(--font-weight-medium)] px-1">
                {language === 'bn' ? 'প্রদর্শন' : 'Appearance'}
              </p>
              <ThemeSelector variant="segmented" />
            </div>

            <div className="space-y-1.5">
              <p className="type-meta text-ui-content-secondary font-[var(--font-weight-medium)] px-1">
                {language === 'bn' ? 'লেখার আকার' : 'Text size'}
              </p>
              <TextSizeSelector variant="segmented" idPrefix="drawer-text-size" />
            </div>

            <div className="space-y-1.5">
              <p className="type-meta text-ui-content-secondary font-[var(--font-weight-medium)] px-1">
                {language === 'bn' ? 'ভাষা' : 'Language'}
              </p>
              <LanguageSelector variant="segmented" idPrefix="drawer-language" />
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};
