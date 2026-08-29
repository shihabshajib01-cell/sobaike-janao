import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

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
}

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
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

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
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isOpen && !keepMounted) return null;

  const maxWidthClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
    '2xl': 'max-w-5xl',
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 overflow-y-auto transition-opacity duration-200 ${
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
        } bg-surface border-subtle shadow-2xl flex flex-col overflow-hidden z-10 text-left outline-none ${containerClassName}`}
      >
        {/* Default Header if requested and title provided */}
        {showHeader && (title || description) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-subtle bg-surface shrink-0">
            <div>
              {title && (
                <h2 id={`${id}-title`} className="text-[20px] sm:text-[22px] font-bold text-primary">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-[14px] text-muted mt-0.5">{description}</p>
              )}
            </div>
            <IconButton
              id={`${id}-close`}
              icon={<X className="w-4 h-4" />}
              aria-label="বন্ধ করুন (Close dialog)"
              size="md"
              onClick={onClose}
              className="text-muted hover:text-primary ml-3"
            />
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 min-h-0 ${maxWidth === 'composer' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'} text-primary ${showHeader && (title || description) ? 'px-6 py-5' : ''}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-surface-subtle border-t border-subtle shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
