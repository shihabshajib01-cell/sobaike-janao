import { useEffect } from 'react';
import { RoutePath } from '../context/AppContext';

export interface UseGlobalKeyboardShortcutsOptions {
  navigateTo: (path: RoutePath) => void;
  openReportComposer: () => void;
  isReportComposerOpen: boolean;
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  isTabletMenuOpen: boolean;
  setIsTabletMenuOpen: (open: boolean) => void;
  toggleLanguage: () => void;
}

export const useGlobalKeyboardShortcuts = ({
  navigateTo,
  openReportComposer,
  isReportComposerOpen,
  isSearchModalOpen,
  setIsSearchModalOpen,
  isShortcutsModalOpen,
  setIsShortcutsModalOpen,
  isTabletMenuOpen,
  setIsTabletMenuOpen,
  toggleLanguage,
}: UseGlobalKeyboardShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Always allow Cmd+K / Ctrl+K to toggle Search from anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(!isSearchModalOpen);
        return;
      }

      // 2. If user is currently typing in an input, textarea, contenteditable, or select element, ignore single-key shortcuts
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox')
      ) {
        return;
      }

      // 3. Do not trigger navigation if modifier keys (Ctrl, Alt, Meta) are held down
      if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
      }

      // 4. If report composer is open, don't execute single-letter navigation to prevent accidental loss
      if (isReportComposerOpen) {
        return;
      }

      const key = e.key.toLowerCase();

      // Help Modal toggle ('?' / Shift+'/')
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen(!isShortcutsModalOpen);
        return;
      }

      // Handle single-letter shortcuts
      switch (key) {
        case 'h':
          e.preventDefault();
          navigateTo('/');
          break;

        case 'c':
          e.preventDefault();
          openReportComposer();
          break;

        case 't':
          e.preventDefault();
          navigateTo('/track-report');
          break;

        case 'e':
          e.preventDefault();
          navigateTo('/explore');
          break;

        case 's':
        case '/':
          e.preventDefault();
          setIsSearchModalOpen(true);
          break;

        case 'm':
          e.preventDefault();
          navigateTo('/more');
          break;

        case '1':
          e.preventDefault();
          navigateTo('/harassment');
          break;

        case '2':
          e.preventDefault();
          navigateTo('/rickshaw');
          break;

        case '3':
          e.preventDefault();
          navigateTo('/extortion');
          break;

        case 'l':
          e.preventDefault();
          toggleLanguage();
          break;

        case 'escape':
          if (isShortcutsModalOpen) {
            setIsShortcutsModalOpen(false);
          } else if (isSearchModalOpen) {
            setIsSearchModalOpen(false);
          } else if (isTabletMenuOpen) {
            setIsTabletMenuOpen(false);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    navigateTo,
    openReportComposer,
    isReportComposerOpen,
    isSearchModalOpen,
    setIsSearchModalOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isTabletMenuOpen,
    setIsTabletMenuOpen,
    toggleLanguage,
  ]);
};
