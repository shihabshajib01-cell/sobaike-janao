import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useApp } from '../../context/AppContext';

export interface ModalProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'composer' | 'full';
  showHeader?: boolean;
  keepMounted?: boolean;
  containerClassName?: string;
  zIndexClass?: string;
  language?: 'bn' | 'en';
  ariaLabel?: string;
}

// Global reference counter and stack for nested modal scroll locks & keyboard focus handling
let openModalsCount = 0;
let savedBodyOverflow: string | null = null;
let modalInstanceCounter = 0;
const modalStack: string[] = [];

export const Modal: React.FC<ModalProps> = ({
  id = 'app-modal',
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
  showHeader = true,
  keepMounted = false,
  containerClassName = '',
  zIndexClass = 'z-50',
  language: customLanguage,
  ariaLabel,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const instanceIdRef = useRef<string>('');
  if (!instanceIdRef.current) {
    instanceIdRef.current = `${id}-${++modalInstanceCounter}`;
  }
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  let appLanguage: 'bn' | 'en' = 'bn';
  try {
    const app = useApp();
    if (app?.language) {
      appLanguage = app.language;
    }
  } catch {
    if (typeof document !== 'undefined' && document.documentElement.lang === 'en') {
      appLanguage = 'en';
    }
  }
  const activeLang = customLanguage || appLanguage;
  const closeLabel = activeLang === 'bn' ? 'বন্ধ করুন' : 'Close dialog';

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    if (openModalsCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openModalsCount++;
    modalStack.push(instanceIdRef.current);

    // Focus modal or first focusable element asynchronously without triggering synchronous loop
    const timeoutId = setTimeout(() => {
      if (modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          modalRef.current.focus();
        }
      }
    }, 30);

    const handleKeyDown = (e: KeyboardEvent) => {
      // ONLY the topmost currently open Modal handles Escape and traps Tab
      if (modalStack[modalStack.length - 1] !== instanceIdRef.current) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      const stackIdx = modalStack.lastIndexOf(instanceIdRef.current);
      if (stackIdx !== -1) {
        modalStack.splice(stackIdx, 1);
      }
      openModalsCount = Math.max(0, openModalsCount - 1);
      if (openModalsCount === 0) {
        document.body.style.overflow = savedBodyOverflow || '';
        savedBodyOverflow = null;
      }
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen && !keepMounted) return null;

  const maxWidthClasses: Record<string, string> = {
    sm: 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-sm max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    md: 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-lg max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    lg: 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-2xl max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    xl: 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-3xl max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    '2xl': 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-5xl max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    composer: 'w-full max-w-full h-[100dvh] max-h-[100dvh] rounded-none md:w-[calc(100vw-48px)] md:max-w-[1040px] md:h-auto md:max-h-[90vh] md:rounded-3xl',
    full: 'w-full max-w-full h-full',
  };

  const isHidden = !isOpen && keepMounted;

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id}-title` : undefined}
      aria-label={!title && ariaLabel ? ariaLabel : undefined}
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-0 md:p-6 overflow-y-auto transition-opacity duration-200 ${
        isHidden ? 'opacity-0 pointer-events-none invisible' : 'opacity-100 visible'
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-xs transition-opacity"
        style={{ backgroundColor: 'var(--ui-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative ${maxWidthClasses[maxWidth] || maxWidthClasses.md} ${
          maxWidth === 'composer' ? 'rounded-none md:rounded-3xl border-0 md:border' : 'rounded-2xl border'
        } bg-ui-surface border-ui-stroke-subtle shadow-2xl flex flex-col overflow-hidden z-10 text-left outline-none ${containerClassName}`}
      >
        {/* Default Header if requested and title provided */}
        {showHeader && (title || description) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-ui-stroke-subtle bg-ui-surface shrink-0">
            <div>
              {title && (
                <h2 id={`${id}-title`} className="text-[20px] sm:text-[22px] font-bold text-ui-content-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-[14px] text-ui-content-muted mt-0.5">{description}</p>
              )}
            </div>
            <IconButton
              id={`${id}-close`}
              icon={<X className="w-4 h-4" />}
              aria-label={closeLabel}
              size="md"
              onClick={onClose}
              className="text-ui-content-muted hover:text-ui-content-primary ml-3"
            />
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 min-h-0 ${maxWidth === 'composer' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'} text-ui-content-primary ${showHeader && (title || description) ? 'px-6 py-5' : ''}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-ui-surface-subtle border-t border-ui-stroke-subtle shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
