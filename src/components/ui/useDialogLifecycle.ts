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
const dialogElements = new Map<string, HTMLElement>();

const setElementInert = (element: HTMLElement, inert: boolean) => {
  (element as HTMLElement & { inert: boolean }).inert = inert;
};

const syncDialogInertState = () => {
  const topDialogId = dialogStack[dialogStack.length - 1];

  for (const [dialogId, element] of dialogElements.entries()) {
    setElementInert(element, dialogId !== topDialogId);
  }

  const appRoot = document.getElementById('root');
  if (appRoot) {
    setElementInert(appRoot, dialogStack.length > 0);
  }
};

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
  dialogRef?: RefObject<HTMLElement | null>;
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
  dialogRef,
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

    const dialogElement = dialogRef?.current || containerRef.current;
    if (dialogElement) {
      dialogElements.set(instanceIdRef.current, dialogElement);
    }
    dialogStack.push(instanceIdRef.current);
    syncDialogInertState();

    const focusTimer = window.setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;

      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement && container.contains(activeElement)) {
        return;
      }

      const preferredTarget = initialFocusRef?.current;
      if (preferredTarget && container.contains(preferredTarget)) {
        preferredTarget.focus({ preventScroll: true });
        return;
      }

      container.focus({ preventScroll: true });
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
      const wasTopDialog = stackIndex === dialogStack.length - 1;

      if (stackIndex !== -1) {
        dialogStack.splice(stackIndex, 1);
      }

      const registeredDialog = dialogElements.get(instanceIdRef.current);
      if (registeredDialog) {
        setElementInert(registeredDialog, false);
        dialogElements.delete(instanceIdRef.current);
      }
      syncDialogInertState();

      if (lockBodyScroll) {
        openScrollLocks = Math.max(0, openScrollLocks - 1);
        if (openScrollLocks === 0) {
          document.body.style.overflow = savedBodyOverflow || '';
          savedBodyOverflow = null;
        }
      }

      if (!wasTopDialog) return;

      const previous = previouslyFocusedElementRef.current;
      if (previous && typeof previous.focus === 'function') {
        previous.focus({ preventScroll: true });
      }
    };
  }, [containerRef, dialogRef, initialFocusRef, isOpen, lockBodyScroll, trapFocus]);
};
