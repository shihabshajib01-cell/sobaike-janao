import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  contentClassName?: string;
  zIndexClass?: string;
  language?: 'bn' | 'en';
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
  mobilePresentation?: 'sheet' | 'fullscreen' | 'center';
  closeOnBackdrop?: boolean;
  headerIcon?: React.ReactNode;
  showCloseButton?: boolean;
  headerClassName?: string;
  footerClassName?: string;
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
  ariaLabelledBy,
  ariaDescribedBy,
  contentClassName,
  mobilePresentation,
  closeOnBackdrop = true,
  headerIcon,
  showCloseButton = true,
  headerClassName = '',
  footerClassName = '',
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const instanceIdRef = useRef<string>('');
  if (!instanceIdRef.current) {
    instanceIdRef.current = `${id}-${++modalInstanceCounter}`;
  }
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { language: appLanguage } = useApp();
  const activeLang = customLanguage || appLanguage;
  const closeLabel = activeLang === 'bn' ? 'ডায়ালগ বন্ধ করুন' : 'Close dialog';

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    if (openModalsCount === 0) {
      savedBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    openModalsCount++;
    modalStack.push(instanceIdRef.current);

    // Keep initial focus inside the dialog without asking mobile Safari to scroll
    // a button/input into view. Auto-focusing actionable controls was causing the
    // visual viewport to jump on first open, leaving bottom sheets at a stale Y offset.
    const timeoutId = window.setTimeout(() => {
      modalRef.current?.focus({ preventScroll: true });
    }, 0);

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
          if (document.activeElement === firstElement || document.activeElement === modalRef.current) {
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
        previouslyFocusedElementRef.current.focus({ preventScroll: true });
      }
    };
  }, [isOpen]);

  if (!isOpen && !keepMounted) return null;

  const effectiveMobilePresentation: 'sheet' | 'fullscreen' | 'center' =
    mobilePresentation ||
    (maxWidth === 'composer' || maxWidth === 'full' ? 'fullscreen' : 'sheet');

  const defaultMaxWidthClasses: Record<string, string> = {
    sm: 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-sm max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    md: 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-lg max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    lg: 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-2xl max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    xl: 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-3xl max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    '2xl': 'w-[calc(100%-24px)] sm:w-[calc(100%-32px)] max-w-5xl max-h-[calc(100dvh-24px)] sm:max-h-[calc(100dvh-32px)] md:max-h-[90vh] my-auto',
    composer: 'w-full max-w-full h-[100dvh] max-h-[100dvh] rounded-none md:w-[calc(100vw-48px)] md:max-w-[1040px] md:h-auto md:max-h-[90vh] md:rounded-[var(--radius-modal)] md:my-auto',
    full: 'w-full max-w-full h-full',
  };

  const sheetMaxWidthClasses: Record<string, string> = {
    sm: 'w-full max-w-none md:w-[calc(100%-32px)] md:max-w-sm max-h-[92dvh] md:max-h-[90vh] my-0 md:my-auto',
    md: 'w-full max-w-none md:w-[calc(100%-32px)] md:max-w-lg max-h-[92dvh] md:max-h-[90vh] my-0 md:my-auto',
    lg: 'w-full max-w-none md:w-[calc(100%-32px)] md:max-w-2xl max-h-[92dvh] md:max-h-[90vh] my-0 md:my-auto',
    xl: 'w-full max-w-none md:w-[calc(100%-32px)] md:max-w-3xl max-h-[92dvh] md:max-h-[90vh] my-0 md:my-auto',
    '2xl': 'w-full max-w-none md:w-[calc(100%-32px)] md:max-w-5xl max-h-[92dvh] md:max-h-[90vh] my-0 md:my-auto',
    composer: defaultMaxWidthClasses.composer,
    full: defaultMaxWidthClasses.full,
  };

  // The report-draft confirmation has three actions with longer Bengali labels.
  // Give only this dialog one wider responsive size so actions never clip horizontally.
  const resolvedMaxWidth = id === 'draft-confirm-close-modal' && maxWidth === 'md' ? 'lg' : maxWidth;

  const maxWidthClass =
    effectiveMobilePresentation === 'sheet'
      ? sheetMaxWidthClasses[resolvedMaxWidth] || sheetMaxWidthClasses.md
      : defaultMaxWidthClasses[resolvedMaxWidth] || defaultMaxWidthClasses.md;

  const rootPositionClasses =
    effectiveMobilePresentation === 'sheet'
      ? 'flex items-end justify-center p-0 md:p-6 md:items-center overflow-hidden md:overflow-y-auto'
      : effectiveMobilePresentation === 'fullscreen'
      ? 'flex items-stretch md:items-center justify-center p-0 md:p-6 overflow-hidden md:overflow-y-auto'
      : 'flex items-center justify-center p-0 md:p-6 overflow-y-auto';

  const cardShapeClasses =
    effectiveMobilePresentation === 'sheet'
      ? 'rounded-t-[var(--radius-modal)] rounded-b-none md:rounded-[var(--radius-modal)] border-t border-x-0 border-b-0 md:border animate-sheet-slide-up'
      : maxWidth === 'composer' || maxWidth === 'full'
      ? 'rounded-none md:rounded-[var(--radius-modal)] border-0 md:border'
      : 'rounded-[var(--radius-modal)] border';

  const isHidden = !isOpen && keepMounted;

  const effectiveLabelledBy = ariaLabelledBy || (title ? `${id}-title` : undefined);
  const effectiveDescribedBy = ariaDescribedBy || (description ? `${id}-desc` : undefined);
  const effectiveAriaLabel = !effectiveLabelledBy && ariaLabel ? ariaLabel : undefined;

  const modalNode = (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={effectiveLabelledBy}
      aria-describedby={effectiveDescribedBy}
      aria-label={effectiveAriaLabel}
      className={`fixed inset-0 h-[100dvh] ${zIndexClass} ${rootPositionClasses} transition-opacity duration-200 ${
        isHidden ? 'opacity-0 pointer-events-none invisible' : 'opacity-100 visible'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-xs transition-opacity bg-ui-overlay"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={`relative ${maxWidthClass} ${cardShapeClasses} bg-ui-surface border-ui-stroke-subtle shadow-[var(--elevation-2xl)] flex flex-col overflow-hidden z-10 text-left outline-none ${containerClassName}`}
      >
        {/* Grab handle for bottom sheet on mobile */}
        {effectiveMobilePresentation === 'sheet' && (
          <div className="w-full flex justify-center pt-3 pb-1 md:hidden shrink-0" aria-hidden="true">
            <div className="w-10 h-1.5 rounded-[var(--radius-pill)] bg-ui-surface-hover" />
          </div>
        )}

        {/* Unified modal header */}
        {showHeader && (title || description || headerIcon) && (
          <div className={`flex items-start justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-ui-stroke-subtle bg-ui-surface shrink-0 gap-3 ${headerClassName}`}>
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              {headerIcon && (
                <div className="w-11 h-11 ui-radius-control bg-ui-surface-subtle text-ui-content-secondary ui-border-default border-ui-stroke-subtle flex items-center justify-center shrink-0">
                  {headerIcon}
                </div>
              )}
              <div className="min-w-0 flex-1 pt-0.5">
                {title && (
                  <h2 id={`${id}-title`} className="type-h3 font-[var(--font-weight-semibold)] text-ui-content-primary leading-snug">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={`${id}-desc`} className="type-helper text-ui-content-secondary mt-1 leading-normal">
                    {description}
                  </p>
                )}
              </div>
            </div>
            {showCloseButton && (
              <IconButton
                id={`${id}-close`}
                icon={<X className="w-5 h-5" aria-hidden="true" />}
                aria-label={closeLabel}
                size="md"
                onClick={onClose}
                className="text-ui-content-secondary -mt-1"
              />
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={`flex-1 min-h-0 ${
            contentClassName
              ? contentClassName
              : maxWidth === 'composer'
              ? 'flex flex-col overflow-hidden'
              : 'overflow-y-auto overscroll-contain'
          } text-ui-content-primary ${
            showHeader && (title || description || headerIcon)
              ? !footer && effectiveMobilePresentation === 'sheet'
                ? 'px-5 sm:px-6 pt-5 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-6'
                : 'p-5 sm:p-6'
              : !footer && effectiveMobilePresentation === 'sheet' && !contentClassName
              ? 'pb-[calc(1rem+env(safe-area-inset-bottom,0px))] md:pb-0'
              : ''
          }`}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={`flex items-center justify-end gap-2.5 px-5 sm:px-6 py-3.5 sm:py-4 bg-ui-surface border-t border-ui-stroke-subtle shrink-0 ${
              effectiveMobilePresentation === 'sheet'
                ? 'pb-[calc(0.875rem+env(safe-area-inset-bottom,0px))] md:pb-4'
                : ''
            } ${footerClassName}`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalNode, document.body) : modalNode;
};
