import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useApp } from '../../context/AppContext';

export interface DrawerProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  position?: 'bottom' | 'right' | 'left';
  children: React.ReactNode;
  footer?: React.ReactNode;
  language?: 'bn' | 'en';
}

export const Drawer: React.FC<DrawerProps> = ({
  id = 'app-drawer',
  isOpen,
  onClose,
  title,
  description,
  position = 'bottom',
  children,
  footer,
  language: customLanguage,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
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
  const closeLabel = activeLang === 'bn' ? 'প্যানেল বন্ধ করুন' : 'Close panel';

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timeoutId = window.setTimeout(() => {
      drawerRef.current?.focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      // Focus trap
      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === drawerRef.current) {
            e.preventDefault();
            lastElement.focus({ preventScroll: true });
          }
        } else if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus({ preventScroll: true });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timeoutId);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionClasses = {
    bottom:
      'absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl border-t border-ui-stroke-default pb-safe',
    right:
      'absolute inset-y-0 right-0 w-full max-w-md border-l border-ui-stroke-default',
    left:
      'absolute inset-y-0 left-0 w-full max-w-md border-r border-ui-stroke-default',
  };

  const drawerNode = (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id}-title` : undefined}
      className="fixed inset-0 h-[100dvh] z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-xs transition-opacity"
        style={{ backgroundColor: 'var(--ui-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`bg-ui-surface shadow-[var(--elevation-2xl)] z-10 flex flex-col outline-none ${positionClasses[position]}`}
      >
        {/* Bottom sheet pull indicator on mobile */}
        {position === 'bottom' && (
          <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-[var(--radius-pill)] bg-ui-surface-hover" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ui-stroke-subtle shrink-0">
          <div>
            {title && (
              <h2 id={`${id}-title`} className="text-[var(--type-fixed-20)] font-[var(--font-weight-bold)] text-ui-content-primary leading-snug">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[var(--type-fixed-14)] leading-[var(--type-line-20)] text-ui-content-muted mt-1">{description}</p>
            )}
          </div>
          <IconButton
            id={`${id}-close`}
            icon={<X className="w-4 h-4" />}
            aria-label={closeLabel}
            size="md"
            onClick={onClose}
            className="text-ui-content-muted hover:text-ui-content-primary"
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-ui-content-primary text-[var(--type-fixed-16)] leading-[var(--type-line-24)]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-5 border-t border-ui-stroke-subtle bg-ui-surface-subtle shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerNode, document.body) : drawerNode;
};
