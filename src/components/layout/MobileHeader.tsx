import React from 'react';
import { Moon, Sun, Menu } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from '../branding/BrandLogo';

export const MobileHeader: React.FC = () => {
  const { navigateTo, language, toggleLanguage, openReportComposer, setIsTabletMenuOpen } = useApp();
  const { resolvedTheme, setThemePreference } = useTheme();

  const handleToggleTheme = () => {
    setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      id="mobile-header"
      className="md:hidden sticky top-0 z-40 w-full bg-ui-surface border-b border-ui-stroke-subtle pt-safe"
    >
      <div className="flex items-center justify-between h-14 px-2 sm:px-4 max-w-full">
        {/* Brand Logo & Wordmark */}
        <div className="min-w-0 shrink mr-1">
          <BrandLogo
            id="mobile-brand-logo"
            size="sm"
            onClick={() => navigateTo('/')}
          />
        </div>

        {/* Right utility actions: Menu | EN | Theme Toggle | + অভিযোগ */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 1. Menu Button to open navigation drawer */}
          <button
            id="mobile-header-menu-btn"
            type="button"
            onClick={() => setIsTabletMenuOpen(true)}
            aria-label={language === 'bn' ? 'মেনু খুলুন' : 'Open navigation menu'}
            className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-secondary flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shrink-0"
          >
            <Menu className="w-4 h-4 text-ui-content-secondary" aria-hidden="true" />
          </button>

          {/* 2. Language Toggle */}
          <button
            id="mobile-header-lang-btn"
            onClick={toggleLanguage}
            aria-label={
              language === 'bn'
                ? 'ভাষা পরিবর্তন করে ইংরেজিতে নিন'
                : 'Switch language to Bengali'
            }
            className="min-h-[44px] min-w-[44px] w-11 h-11 text-[13px] sm:text-[14px] font-semibold rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-primary flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shrink-0"
          >
            {language === 'bn' ? 'EN' : 'বাং'}
          </button>

          {/* 3. Theme Toggle (Moon in light mode, Sun in dark mode) */}
          <button
            id="mobile-header-theme-toggle"
            type="button"
            onClick={handleToggleTheme}
            aria-label={
              language === 'bn'
                ? resolvedTheme === 'dark'
                  ? 'লাইট মোডে পরিবর্তন করুন'
                  : 'ডার্ক মোডে পরিবর্তন করুন'
                : resolvedTheme === 'dark'
                ? 'Switch to Light theme'
                : 'Switch to Dark theme'
            }
            className="min-h-[44px] min-w-[44px] w-11 h-11 rounded-xl border border-ui-stroke-subtle bg-ui-surface text-ui-content-secondary flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shrink-0"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-4 h-4 text-ui-content-primary" aria-hidden="true" />
            )}
          </button>

          {/* 4. Primary Complaint Button */}
          <button
            id="mobile-header-add-report-btn"
            onClick={() => openReportComposer()}
            aria-label={language === 'bn' ? 'অভিযোগ জানান' : 'Report Incident'}
            className="btn-primary-action min-h-[44px] px-2 sm:px-3 text-[12.5px] sm:text-[14px] font-bold rounded-xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-xs whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus shrink-0"
          >
            {language === 'bn' ? '+ অভিযোগ' : '+ Report'}
          </button>
        </div>
      </div>
    </header>
  );
};
