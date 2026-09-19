import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, RoutePath } from '../../context/AppContext';
import { CATEGORY_ORDER } from '../../data/categoryOrder';
import { CategoryPopularityService } from '../../services/categoryPopularityService';
import { SECTIONS, SectionKey } from '../../theme/tokens';
import { Button } from '../ui/Button';
import { ThemeSelector } from '../ui/ThemeSelector';
import { TextSizeSelector } from '../ui/TextSizeSelector';
import { LanguageSelector } from '../ui/LanguageSelector';
import { BrandLogo } from '../branding/BrandLogo';
import { AppIcon, AppIconName } from '../ui/AppIcon';

const SECTION_ICON_NAMES: Record<SectionKey, AppIconName> = {
  harassment: 'harassment',
  extortion: 'extortion',
  public_safety: 'public-safety',
  road_transport: 'road-transport',
  load_shedding: 'zap-off',
  illegal_occupation: 'illegal-occupation',
  rickshaw: 'rickshaw',
};

export const DesktopLeftRail: React.FC = () => {
  const { currentRoute, language, openReportComposer } = useApp();
  const [categoryOrder, setCategoryOrder] = useState<SectionKey[]>(CATEGORY_ORDER);
  const localizePath = (path: RoutePath) =>
    language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

  useEffect(() => {
    let active = true;
    CategoryPopularityService.getOrderedCategoryKeys().then((keys) => {
      if (active) setCategoryOrder(keys);
    });
    return () => {
      active = false;
    };
  }, []);

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
    ...categoryOrder.map((sectionKey) => ({
      id: `rail-${sectionKey.replaceAll('_', '-')}`,
      path: SECTIONS[sectionKey].slug,
      nameBn: SECTIONS[sectionKey].shortNameBn,
      nameEn: SECTIONS[sectionKey].shortNameEn,
      iconName: SECTION_ICON_NAMES[sectionKey],
      sectionKey,
    })),
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
        <Link
          to={localizePath('/')}
          aria-label={language === 'bn' ? 'সবাইকে জানাও — মূলপাতা' : 'Sobaike Janao — Home'}
          className="block rounded-[var(--radius-control)] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <BrandLogo
            id="rail-brand-logo"
            size="lg"
            className="transition-colors ui-radius-control w-full [&_img]:scale-[1.2] [&_img]:origin-left"
          />
        </Link>

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
            const secConfig = item.sectionKey ? SECTIONS[item.sectionKey] : null;

            return (
              <Link
                key={item.id}
                id={item.id}
                to={localizePath(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center justify-between px-3 py-2.5 ui-radius-control type-action transition-all duration-150 text-left cursor-pointer group min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                  isActive ? getSectionActiveStyles(item.sectionKey) : 'text-ui-content-primary/85 hover:text-ui-content-primary hover:bg-ui-surface-subtle'
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
                        ? 'text-ui-content-secondary group-hover:text-ui-content-primary'
                        : ''
                    }`}
                  />
                  <span className="truncate">{language === 'bn' ? item.nameBn : item.nameEn}</span>
                </div>

                {item.sectionKey && (
                  <span
                    className={`w-2.5 h-2.5 ui-radius-pill shrink-0 transition-opacity ${
                      isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-60'
                    }`}
                    style={{ backgroundColor: `var(--sec-${item.sectionKey}-primary)` }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 border-t border-ui-stroke-subtle space-y-2.5">
        <ThemeSelector variant="compact" />
        <TextSizeSelector variant="compact" idPrefix="rail-text-size" />

        <LanguageSelector variant="compact" idPrefix="rail-language" />

        <div className="px-2 pt-1 type-meta text-ui-content-secondary leading-tight">
          <p className="font-[var(--font-weight-medium)] text-ui-content-secondary">
            {language === 'bn' ? 'নাগরিক প্ল্যাটফর্ম' : 'Citizen platform'}
          </p>
          <small className="text-ui-content-secondary">
            {language === 'bn' ? 'বাংলাদেশ ২০২৬' : 'Bangladesh 2026'}
          </small>
        </div>
      </div>
    </aside>
  );
};
