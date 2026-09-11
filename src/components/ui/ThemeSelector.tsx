import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check } from 'lucide-react';
import { useTheme, ThemePreference } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';

interface ThemeSelectorProps {
  variant?: 'compact' | 'segmented' | 'cards';
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ variant = 'segmented', className = '' }) => {
  const { themePreference, setThemePreference, resolvedTheme } = useTheme();
  const { language } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options: Array<{
    id: ThemePreference;
    nameBn: string;
    nameEn: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'light', nameBn: 'লাইট', nameEn: 'Light', icon: Sun },
    { id: 'dark', nameBn: 'ডার্ক', nameEn: 'Dark', icon: Moon },
    { id: 'system', nameBn: 'সিস্টেম', nameEn: 'System', icon: Monitor },
  ];

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentOption = options.find((opt) => opt.id === themePreference) || options[2];
  const CurrentDisplayIcon = themePreference === 'system' 
    ? (resolvedTheme === 'dark' ? Moon : Sun)
    : currentOption.icon;

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          type="button"
          id="compact-theme-selector-btn"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={language === 'bn' ? 'থিম নির্বাচন' : 'Select theme'}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 text-[14px] rounded-xl border border-ui-stroke-subtle hover:bg-ui-surface-subtle transition-colors cursor-pointer text-ui-content-secondary hover:text-ui-content-primary min-h-[44px] bg-ui-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        >
          <div className="flex items-center gap-2">
            <CurrentDisplayIcon className="w-4 h-4 text-ui-content-muted" />
            <span className="font-medium">{language === 'bn' ? 'প্রদর্শন' : 'Appearance'}</span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-[14px] text-ui-content-primary">
            <span>{language === 'bn' ? currentOption.nameBn : currentOption.nameEn}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-ui-content-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label={language === 'bn' ? 'থিম তালিকা' : 'Theme list'}
            className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-ui-surface-elevated border border-ui-stroke-default rounded-xl shadow-lg p-1.5 space-y-1"
          >
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = themePreference === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    setThemePreference(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[14px] font-medium transition-colors cursor-pointer min-h-[44px] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                    isSelected
                      ? 'bg-ui-surface-subtle text-ui-content-primary font-bold'
                      : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface-subtle'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-ui-content-primary' : 'text-ui-content-muted'}`} />
                    <span>{language === 'bn' ? opt.nameBn : opt.nameEn}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-ui-content-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'cards') {
    return (
      <div
        className={`grid grid-cols-3 gap-2.5 ${className}`}
        role="radiogroup"
        aria-label={language === 'bn' ? 'থিম' : 'Theme'}
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = themePreference === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setThemePreference(opt.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
                isSelected
                  ? 'border-ui-stroke-strong bg-ui-surface-elevated text-ui-content-primary font-bold shadow-2xs'
                  : 'border-ui-stroke-subtle bg-ui-surface-subtle text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-ui-content-primary' : 'text-ui-content-muted'}`} />
              <span className="text-[16px] leading-tight">
                {language === 'bn' ? opt.nameBn : opt.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Segmented control (default)
  return (
    <div
      className={`flex items-center p-1 bg-ui-surface-subtle border border-ui-stroke-subtle rounded-2xl gap-1 ${className}`}
      role="radiogroup"
      aria-label={language === 'bn' ? 'থিম' : 'Theme'}
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const isSelected = themePreference === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => setThemePreference(opt.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-xl text-[16px] font-medium transition-all cursor-pointer min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus ${
              isSelected
                ? 'bg-ui-surface text-ui-content-primary font-bold shadow-2xs border border-ui-stroke-subtle'
                : 'text-ui-content-secondary hover:text-ui-content-primary hover:bg-ui-surface/50'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-ui-content-primary' : 'text-ui-content-muted'}`} />
            <span className="truncate">
              {language === 'bn' ? opt.nameBn : opt.nameEn}
            </span>
          </button>
        );
      })}
    </div>
  );
};
