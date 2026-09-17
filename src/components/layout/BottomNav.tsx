import React from 'react';
import { Plus } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { SECTIONS } from '../../theme/tokens';
import { AppIcon, AppIconName } from '../ui/AppIcon';

const CATEGORY_ROUTES = Object.values(SECTIONS).map((section) => section.slug);
const BACK_NAV_ROUTE_PREFIXES = ['/report-detail/', '/location/', '/subject/'];

export const shouldHideBottomNav = (currentRoute: string): boolean =>
  CATEGORY_ROUTES.includes(currentRoute) ||
  BACK_NAV_ROUTE_PREFIXES.some((prefix) => currentRoute.startsWith(prefix));

export const BottomNav: React.FC = () => {
  const { currentRoute, navigateTo, language, openReportComposer } = useApp();

  if (shouldHideBottomNav(currentRoute)) return null;

  const navItems: Array<{
    id: string;
    path: RoutePath;
    nameBn: string;
    nameEn: string;
    iconName: AppIconName;
    isActive: boolean;
  }> = [
    {
      id: 'bottom-nav-home',
      path: '/',
      nameBn: 'মূলপাতা',
      nameEn: 'Home',
      iconName: 'home',
      isActive: currentRoute === '/',
    },
    {
      id: 'bottom-nav-issues',
      path: '/issues',
      nameBn: 'বিষয়সমূহ',
      nameEn: 'Issues',
      iconName: 'layers',
      isActive: currentRoute === '/issues',
    },
    {
      id: 'bottom-nav-explore',
      path: '/explore',
      nameBn: 'এক্সপ্লোর',
      nameEn: 'Explore',
      iconName: 'compass',
      isActive: currentRoute === '/explore',
    },
  ];

  return (
    <nav
      id="bottom-nav"
      aria-label={language === 'bn' ? 'মোবাইল নেভিগেশন' : 'Mobile navigation'}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none px-3 pb-[calc(env(safe-area-inset-bottom,0px)+8px)]"
    >
      <div className="pointer-events-auto mx-auto grid max-w-[420px] grid-cols-[1fr_1fr_1fr_auto] items-center gap-1 rounded-[var(--radius-card)] border border-ui-stroke-subtle bg-ui-surface/95 p-1.5 shadow-[var(--elevation-lg)] backdrop-blur-md">
        {navItems.map((item) => (
          <button
            key={item.id}
            id={item.id}
            type="button"
            onClick={() => navigateTo(item.path)}
            aria-current={item.isActive ? 'page' : undefined}
            className={`flex min-h-[52px] min-w-0 flex-col items-center justify-center rounded-[var(--radius-control)] px-1.5 py-1.5 transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              item.isActive
                ? 'bg-ui-surface-subtle text-ui-content-primary dark:bg-ui-accent-soft dark:ring-1 dark:ring-ui-accent-border'
                : 'text-ui-content-muted hover:bg-ui-surface-hover hover:text-ui-content-primary'
            }`}
          >
            <AppIcon name={item.iconName} size="lg" strokeWidth={item.isActive ? 2.4 : 2} />
            <span
              className={`mt-1 w-full truncate text-center text-[var(--type-fixed-105)] min-[390px]:text-[var(--type-fixed-115)] leading-tight ${
                item.isActive ? 'font-[var(--font-weight-bold)]' : 'font-[var(--font-weight-medium)]'
              }`}
            >
              {language === 'bn' ? item.nameBn : item.nameEn}
            </span>
          </button>
        ))}

        <button
          id="mobile-nav-report"
          type="button"
          onClick={() => openReportComposer()}
          aria-label={language === 'bn' ? 'প্রতিবেদন জমা দিন' : 'Submit a report'}
          className="ml-1 flex h-12 w-12 min-h-[48px] min-w-[48px] items-center justify-center rounded-[var(--radius-pill)] bg-ui-action-bg text-ui-action-text shadow-[var(--elevation-sm)] transition-all hover:bg-ui-action-hover active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus focus-visible:ring-offset-2"
        >
          <Plus className="h-6 w-6 stroke-[2.5]" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
