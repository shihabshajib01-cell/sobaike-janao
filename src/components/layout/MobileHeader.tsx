import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { BrandLogo } from '../branding/BrandLogo';

export const MobileHeader: React.FC = () => {
  const { navigateTo, language, toggleLanguage, openReportComposer } = useApp();
  const { resolvedTheme, setThemePreference } = useTheme();

  const handleToggleTheme = () => {
    setThemePreference(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header
      id="mobile-header"
      className="md:hidden sticky top-0 z-40 w-full bg-surface border-b border-subtle pt-safe"
    >
      <div className="flex items-center justify-between h-14 px-2.5 sm:px-4 max-w-full">
        {/* Brand Logo & Wordmark */}
        <div className="min-w-0 shrink">
          <BrandLogo
            id="mobile-brand-logo"
            size="sm"
            onClick={() => navigateTo('/')}
          />
        </div>

        {/* Right utility actions: EN | Theme Toggle | + অভিযোগ */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* 1. Language Toggle */}
          <button
            id="mobile-header-lang-btn"
            onClick={toggleLanguage}
            aria-label={`Switch language to ${language === 'bn' ? 'English' : 'Bengali'}`}
            className="h-9 sm:h-10 px-2 sm:px-3 text-[13px] sm:text-[14px] font-semibold rounded-xl border border-subtle bg-surface text-primary hover:bg-surface-subtle min-w-[34px] sm:min-w-[38px] flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          >
            {language === 'bn' ? 'EN' : 'বাং'}
          </button>

          {/* 2. Theme Toggle (Moon in light mode, Sun in dark mode) */}
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
            className="h-9 sm:h-10 px-2 sm:px-3 rounded-xl border border-subtle bg-surface text-secondary hover:text-primary hover:bg-surface-subtle min-w-[34px] sm:min-w-[38px] flex items-center justify-center cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* 3. Primary Complaint Button */}
          <button
            id="mobile-header-add-report-btn"
            onClick={() => openReportComposer()}
            aria-label={language === 'bn' ? 'অভিযোগ জানান' : 'Report Incident'}
            className="btn-primary-action h-9 sm:h-10 px-2.5 sm:px-3.5 text-[13px] sm:text-[14px] font-bold rounded-xl flex items-center justify-center cursor-pointer transition-transform active:scale-95 shadow-xs whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ui-focus)]"
          >
            {language === 'bn' ? '+ অভিযোগ' : '+ Report'}
          </button>
        </div>
      </div>
    </header>
  );
};
