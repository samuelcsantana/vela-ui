import { useEffect, useRef, type RefObject } from 'react';

interface UseDialogOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusSelector?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface UseDialogReturn {
  dialogRef: RefObject<HTMLDivElement | null>;
  overlayProps: {
    role: 'presentation';
    className: string;
    onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  };
}

export function useDialog({ isOpen, onClose, initialFocusSelector }: UseDialogOptions): UseDialogReturn {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Stable refs so the focus/keyboard effect does not re-run when onClose or
  // initialFocusSelector change (avoids steal-focus bugs when the parent
  // re-renders during form interaction). Ref-writes during render are the
  // canonical "refs as instance variables" pattern.
  const onCloseRef = useRef(onClose);
  // eslint-disable-next-line react-hooks/refs
  onCloseRef.current = onClose;
  const initialFocusSelectorRef = useRef(initialFocusSelector);
  // eslint-disable-next-line react-hooks/refs
  initialFocusSelectorRef.current = initialFocusSelector;

  // Body scroll lock while the dialog is open.
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Focus trap + Escape-to-close + focus restoration on close.
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const selector = initialFocusSelectorRef.current;

    const getFocusableElements = (): HTMLElement[] =>
      dialogRef.current
        ? Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        : [];

    const elements = getFocusableElements();
    const initialTarget = selector
      ? (dialogRef.current?.querySelector<HTMLElement>(selector) ?? elements[0])
      : elements[0];
    initialTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = getFocusableElements();
      if (elements.length === 0) return;

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
  }, [isOpen]);

  const overlayProps = {
    role: 'presentation' as const,
    className: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4',
    onClick: (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
  };

  return { dialogRef, overlayProps };
}
