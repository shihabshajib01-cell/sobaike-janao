import React from 'react';
import { Link } from 'react-router-dom';
import { PhoneCall } from 'lucide-react';
import { useApp, RoutePath } from '../../context/AppContext';
import { Drawer } from '../ui/Drawer';
import { LanguageSelector } from '../ui/LanguageSelector';
import { TextSizeSelector } from '../ui/TextSizeSelector';
import { ThemeSelector } from '../ui/ThemeSelector';

export const MobilePublicMenuDrawer: React.FC = () => {
  const {
    currentRoute,
    language,
    isTabletMenuOpen,
    setIsTabletMenuOpen,
  } = useApp();

  const localizePath = (path: RoutePath) =>
    language === 'en' ? (path === '/' ? '/en' : `/en${path}`) : path;

  return (
    <Drawer
      id="mobile-menu-drawer"
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
        <div className="space-y-1">
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
            <TextSizeSelector variant="segmented" idPrefix="mobile-drawer-text-size" />
          </div>

          <div className="space-y-1.5">
            <p className="type-meta text-ui-content-secondary font-[var(--font-weight-medium)] px-1">
              {language === 'bn' ? 'ভাষা' : 'Language'}
            </p>
            <LanguageSelector variant="segmented" idPrefix="mobile-drawer-language" />
          </div>
        </div>
      </div>
    </Drawer>
  );
};
