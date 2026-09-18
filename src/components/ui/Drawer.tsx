import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';
import { useApp } from '../../context/AppContext';
import { useDialogLifecycle } from './useDialogLifecycle';

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
  const drawerRootRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  useDialogLifecycle({
    id,
    isOpen,
    onClose,
    containerRef: drawerRef,
    dialogRef: drawerRootRef,
  });

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



  if (!isOpen) return null;

  const positionClasses = {
    bottom:
      'absolute inset-x-0 bottom-0 max-h-[85dvh] rounded-t-[var(--radius-modal)] border-t border-role-outline pb-safe',
    right:
      'absolute inset-y-0 right-0 w-full max-w-md border-l border-role-outline',
    left:
      'absolute inset-y-0 left-0 w-full max-w-md border-r border-role-outline',
  };

  const drawerNode = (
    <div
      ref={drawerRootRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? `${id}-title` : undefined}
      className="fixed inset-0 h-[100dvh] z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-xs transition-opacity bg-role-overlay"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={`bg-role-surface shadow-[var(--elevation-2xl)] z-10 flex flex-col outline-none ${positionClasses[position]}`}
      >
        {/* Bottom sheet pull indicator on mobile */}
        {position === 'bottom' && (
          <div className="w-full flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 rounded-[var(--radius-pill)] bg-role-surface-hover" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-role-outline-subtle shrink-0">
          <div>
            {title && (
              <h2 id={`${id}-title`} className="type-h3 font-[var(--font-weight-bold)] text-role-on-surface leading-snug">
                {title}
              </h2>
            )}
            {description && (
              <p className="type-compact leading-[var(--type-line-20)] text-role-on-surface-muted mt-1">{description}</p>
            )}
          </div>
          <IconButton
            id={`${id}-close`}
            icon={<X className="w-4 h-4" />}
            aria-label={closeLabel}
            size="md"
            onClick={onClose}
            className="text-role-on-surface-muted hover:text-role-on-surface"
          />
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-role-on-surface type-label leading-[var(--type-line-24)]">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-5 border-t border-role-outline-subtle bg-role-surface-subtle shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(drawerNode, document.body) : drawerNode;
};
