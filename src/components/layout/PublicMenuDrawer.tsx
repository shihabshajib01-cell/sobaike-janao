import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, PhoneCall, Search } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { CATEGORY_ORDER } from '../../data/categoryOrder';
import { CategoryPopularityService } from '../../services/categoryPopularityService';
import { useTaxonomy } from '../../services/taxonomyService';
import { SectionKey } from '../../theme/tokens';
import { CategoryIcon } from '../branding/CategoryIcon';
import { Drawer } from '../ui/Drawer';
import { LanguageSelector } from '../ui/LanguageSelector';
import { TextSizeSelector } from '../ui/TextSizeSelector';
import { ThemeSelector } from '../ui/ThemeSelector';

export const PublicMenuDrawer: React.FC = () => {
  const {
    currentRoute,
    language,
    isTabletMenuOpen,
    setIsTabletMenuOpen,
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
      return 'bg-ui-selected-bg text-ui-selected-text font-[var(--font-weight-bold)] border border-ui-selected-border';
    }
    return 'font-[var(--font-weight-bold)] border';
  };

  return (
    <Drawer
      id="public-menu-drawer"
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
      <div>
        <nav
          className="space-y-1"
          aria-label={language === 'bn' ? 'মেনু নেভিগেশন' : 'Menu navigation'}
        >
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
                  isActive
                    ? getSectionActiveStyles(item.sectionKey)
                    : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle'
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
                  <span
                    className={
                      isActive && !secConfig
                        ? 'text-ui-content-primary'
                        : 'text-ui-content-muted'
                    }
                  >
                    {item.icon}
                  </span>
                  <span className="truncate">
                    {language === 'bn' ? item.nameBn : item.nameEn}
                  </span>
                </span>
                {item.sectionKey && (
                  <span
                    className="w-2.5 h-2.5 ui-radius-pill shrink-0"
                    style={{
                      backgroundColor:
                        secConfig?.primaryColor || 'var(--ui-action-bg)',
                    }}
                    aria-hidden="true"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 mt-4 pt-3 border-t border-ui-stroke-subtle">
          <Link
            to={localizePath('/search')}
            onClick={() => setIsTabletMenuOpen(false)}
            aria-current={currentRoute === '/search' ? 'page' : undefined}
            className={`flex w-full items-center gap-3 px-3.5 py-3 ui-radius-control type-action font-[var(--font-weight-medium)] text-left min-h-[44px] cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              currentRoute === '/search'
                ? 'bg-ui-selected-bg text-ui-selected-text font-[var(--font-weight-bold)] border border-ui-selected-border'
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
                ? 'bg-ui-selected-bg text-ui-selected-text font-[var(--font-weight-bold)] border border-ui-selected-border'
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
  );
};
