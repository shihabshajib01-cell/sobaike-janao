import React from 'react';
import { useApp, RoutePath } from '../../context/AppContext';
import { AppIcon, AppIconName } from '../ui/AppIcon';

export const BottomNav: React.FC = () => {
  const { currentRoute, navigateTo, language } = useApp();

  const navItems: Array<{
    id: string;
    path: RoutePath;
    nameBn: string;
    nameEn: string;
    iconName: AppIconName;
    activeColor: string;
  }> = [
    {
      id: 'bottom-nav-home',
      path: '/' as RoutePath,
      nameBn: 'মূলপাতা',
      nameEn: 'Home',
      iconName: 'home',
      activeColor: 'var(--ui-text-primary)',
    },
    {
      id: 'bottom-nav-harassment',
      path: '/harassment' as RoutePath,
      nameBn: 'হয়রানি',
      nameEn: 'Harassment',
      iconName: 'harassment',
      activeColor: 'var(--sec-harassment-primary)',
    },
    {
      id: 'bottom-nav-charging',
      path: '/rickshaw' as RoutePath,
      nameBn: 'চার্জিং',
      nameEn: 'Charging',
      iconName: 'rickshaw',
      activeColor: 'var(--sec-rickshaw-primary)',
    },
    {
      id: 'bottom-nav-extortion',
      path: '/extortion' as RoutePath,
      nameBn: 'চাঁদাবাজি',
      nameEn: 'Extortion',
      iconName: 'extortion',
      activeColor: 'var(--sec-extortion-primary)',
    },
    {
      id: 'bottom-nav-search',
      path: '/search' as RoutePath,
      nameBn: 'খুঁজুন',
      nameEn: 'Search',
      iconName: 'search',
      activeColor: 'var(--ui-text-primary)',
    },
  ];

  return (
    <nav
      id="bottom-nav"
      aria-label={language === 'bn' ? 'মোবাইল নেভিগেশন' : 'Mobile navigation'}
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-subtle pb-safe"
    >
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = currentRoute === item.path;

          return (
            <button
              key={item.id}
              id={item.id}
              onClick={() => navigateTo(item.path)}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center flex-1 min-h-[48px] py-1 px-1 transition-colors cursor-pointer select-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
              style={{
                color: isActive ? item.activeColor : 'var(--ui-text-muted)',
              }}
            >
              <div className="relative">
                <AppIcon name={item.iconName} size="lg" />
                {isActive && (
                  <span
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: item.activeColor }}
                  />
                )}
              </div>
              <span
                className={`text-[12px] mt-1 leading-tight tracking-tight ${
                  isActive ? 'font-bold' : 'font-normal'
                }`}
              >
                {language === 'bn' ? item.nameBn : item.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

