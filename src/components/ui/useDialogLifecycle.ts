import { RefObject, useEffect, useRef } from 'react';

export const DIALOG_FOCUSABLE_SELECTOR = [
  'button:not([disabled]):not([aria-disabled="true"])',
  '[href]:not([aria-disabled="true"])',
  'input:not([disabled]):not([type="hidden"]):not([aria-disabled="true"])',
  'select:not([disabled]):not([aria-disabled="true"])',
  'textarea:not([disabled]):not([aria-disabled="true"])',
  '[tabindex]:not([tabindex="-1"]):not([aria-disabled="true"])',
].join(', ');

let openScrollLocks = 0;
let savedBodyOverflow: string | null = null;
let dialogInstanceCounter = 0;
const dialogStack: string[] = [];

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hidden &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.getClientRects().length > 0
  );
};

interface UseDialogLifecycleOptions {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
  lockBodyScroll?: boolean;
  trapFocus?: boolean;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}

export const useDialogLifecycle = ({
  id,
  isOpen,
  onClose,
  containerRef,
  initialFocusRef,
  closeOnEscape = true,
  lockBodyScroll = true,
  trapFocus = true,
  onArrowLeft,
  onArrowRight,
}: UseDialogLifecycleOptions) => {
  const instanceIdRef = useRef('');
  if (!instanceIdRef.current) {
    instanceIdRef.current = `${id}-${++dialogInstanceCounter}`;
  }

  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const closeOnEscapeRef = useRef(closeOnEscape);
  const onArrowLeftRef = useRef(onArrowLeft);
  const onArrowRightRef = useRef(onArrowRight);

  onCloseRef.current = onClose;
  closeOnEscapeRef.current = closeOnEscape;
  onArrowLeftRef.current = onArrowLeft;
  onArrowRightRef.current = onArrowRight;

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    if (lockBodyScroll) {
      if (openScrollLocks === 0) {
        savedBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
      }
      openScrollLocks += 1;
    }

    dialogStack.push(instanceIdRef.current);

    const focusTimer = window.setTimeout(() => {
      const preferredTarget = initialFocusRef?.current || containerRef.current;
      preferredTarget?.focus({ preventScroll: true });
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== instanceIdRef.current) return;

      if (event.key === 'Escape' && closeOnEscapeRef.current) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key === 'ArrowLeft' && onArrowLeftRef.current) {
        event.preventDefault();
        onArrowLeftRef.current();
        return;
      }

      if (event.key === 'ArrowRight' && onArrowRightRef.current) {
        event.preventDefault();
        onArrowRightRef.current();
        return;
      }

      if (event.key !== 'Tab' || !trapFocus) return;

      const focusable = getFocusableElements(containerRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        containerRef.current?.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === first || activeElement === containerRef.current) {
          event.preventDefault();
          last.focus({ preventScroll: true });
        }
        return;
      }

      if (activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      } else if (activeElement === containerRef.current) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);

      const stackIndex = dialogStack.lastIndexOf(instanceIdRef.current);
      if (stackIndex !== -1) dialogStack.splice(stackIndex, 1);

      if (lockBodyScroll) {
        openScrollLocks = Math.max(0, openScrollLocks - 1);
        if (openScrollLocks === 0) {
          document.body.style.overflow = savedBodyOverflow || '';
          savedBodyOverflow = null;
        }
      }

      const previous = previouslyFocusedElementRef.current;
      if (previous && typeof previous.focus === 'function') {
        previous.focus({ preventScroll: true });
      }
    };
  }, [containerRef, initialFocusRef, isOpen, lockBodyScroll, trapFocus]);
};
