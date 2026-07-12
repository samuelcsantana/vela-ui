import { useEffect, useRef } from 'react';
import type { MouseEvent } from 'react';

interface UseDialogOptions {
  isOpen: boolean;
  onClose: () => void;
  /** CSS selector for the element to focus on open; falls back to the first focusable element. */
  initialFocus?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog behavior: body scroll lock, focus trap, Escape-to-close,
 * focus restoration, and backdrop-click dismissal via the returned overlay props.
 */
export const useDialog = ({ isOpen, onClose, initialFocus }: UseDialogOptions) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Body scroll lock while the dialog is open.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Focus trap + Escape-to-close + focus restoration on close.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    // The dialog panel is always mounted while this effect is active, so the ref is always attached.
    const getFocusableElements = () =>
      Array.from(dialogRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Without an initialFocus selector, the first element gets focus (Cancel before
    // Confirm in ConfirmDialog), so a destructive action is never triggered by a
    // stray Enter press. Forms pass their first field instead.
    const initialFocusTarget = initialFocus
      ? dialogRef.current!.querySelector<HTMLElement>(initialFocus)
      : null;
    (initialFocusTarget ?? getFocusableElements()[0])?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const elements = getFocusableElements();
      if (elements.length === 0) {
        return;
      }

      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [isOpen, onClose, initialFocus]);

  const overlayProps = {
    role: 'presentation',
    className: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4',
    // Only a click on the backdrop itself dismisses - checking currentTarget
    // replaces the stopPropagation handler the dialog panel used to need.
    onClick: (event: MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
  } as const;

  return { dialogRef, overlayProps };
};
