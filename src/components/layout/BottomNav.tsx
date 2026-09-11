import React from 'react';
import { Plus } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { AppIcon, AppIconName } from '../ui/AppIcon';

export const BottomNav: React.FC = () => {
  const { currentRoute, navigateTo, language, openReportComposer } = useApp();

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
      id: 'bottom-nav-utility',
      path: '/load-shedding' as RoutePath,
      nameBn: 'ইউটিলিটি',
      nameEn: 'Utility',
      iconName: 'load-shedding',
      activeColor: 'var(--sec-load_shedding-primary)',
    },
  ];

  return (
    <>
      {/* Mobile Floating Action Button (FAB) - Report Incident */}
      <button
        id="mobile-fab-report"
        type="button"
        onClick={() => openReportComposer()}
        aria-label={language === 'bn' ? 'ঘটনা জানান' : 'Report Incident'}
        className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+12px)] z-40 w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-ui-action-bg text-ui-action-text hover:bg-ui-action-hover active:scale-95 shadow-lg flex items-center justify-center cursor-pointer transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus focus-visible:ring-offset-2"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" aria-hidden="true" />
      </button>

      {/* Mobile Fixed Bottom Navigation (< 768px) */}
      <nav
        id="bottom-nav"
        aria-label={language === 'bn' ? 'মোবাইল নেভিগেশন' : 'Mobile navigation'}
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-ui-surface border-t border-ui-stroke-subtle pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 px-1">
          {navItems.map((item) => {
            const isActive = currentRoute === item.path;

            return (
              <button
                key={item.id}
                id={item.id}
                onClick={() => navigateTo(item.path)}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center min-h-[48px] py-1 px-0.5 transition-colors cursor-pointer select-none rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
                style={{
                  color: isActive ? item.activeColor : 'var(--ui-text-muted)',
                }}
              >
                <div className="relative flex items-center justify-center">
                  <AppIcon name={item.iconName} size="lg" />
                  {isActive && (
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: item.activeColor }}
                    />
                  )}
                </div>
                <span
                  className={`text-[10px] min-[360px]:text-[11px] min-[390px]:text-[12px] mt-1 leading-tight tracking-tight text-center truncate w-full px-0.5 ${
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
    </>
  );
};

export default BottomNav;


