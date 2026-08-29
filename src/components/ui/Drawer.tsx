import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DrawerProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  position?: 'bottom' | 'right' | 'left';
  children: React.ReactNode;
  footer?: React.ReactNode;
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
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const timeoutId = setTimeout(() => {
      if (drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          drawerRef.current.focus();
        }
      }
    }, 30);

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
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const positionClasses = {
    bottom:
      'fixed inset-x-0 bottom-0 max-h-[85vh] rounded-t-2xl border-t border-theme pb-safe',
    right:
      'fixed inset-y-0 right-0 w-full max-w-md border-l border-theme',
    left:
      'fixed inset-y-0 left-0 w-full max-w-md border-r border-theme',
  };

  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id}-title` : undefined}
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-xs transition-opacity"
        style={{ backgroundColor: 'var(--ui-overlay)' }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`bg-surface shadow-2xl z-10 flex flex-col outline-none ${positionClasses[position]}`}
      >
        {/* Bottom sheet pull indicator on mobile */}
        {position === 'bottom' && (
          <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-surface-hover" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle shrink-0">
          <div>
            {title && (
              <h2 id={`${id}-title`} className="text-[20px] font-bold text-primary leading-snug">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[14px] leading-[20px] text-muted mt-1">{description}</p>
            )}
          </div>
          <IconButton
            id={`${id}-close`}
            icon={<X className="w-4 h-4" />}
            aria-label="প্যানেল বন্ধ করুন (Close panel)"
            size="md"
            onClick={onClose}
            className="text-muted hover:text-primary"
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-primary text-[16px] leading-[24px]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-5 border-t border-subtle bg-surface-subtle shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
