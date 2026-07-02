import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  isLoading?: boolean;
  isDestructive?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DIALOG_TITLE_ID = 'confirm-dialog-title';
const DIALOG_DESCRIPTION_ID = 'confirm-dialog-description';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const CONFIRM_BUTTON_BASE_CLASSNAME =
  'min-h-11 cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:outline-white';

export const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel,
  isLoading = false,
  isDestructive = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
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

  // Focus trap + Escape-to-cancel + focus restoration on close.
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    // The dialog panel is always mounted while this effect is active, so the ref is always attached.
    const getFocusableElements = () =>
      Array.from(dialogRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Focuses Cancel first, not Confirm, so a destructive action is never triggered by a stray Enter press.
    getFocusableElements()[0]?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
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
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
        aria-describedby={DIALOG_DESCRIPTION_ID}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900"
      >
        <h2 id={DIALOG_TITLE_ID} className="text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p id={DIALOG_DESCRIPTION_ID} className="mt-2 text-sm text-slate-600 dark:text-gray-300">
          {description}
        </p>

        <p aria-live="polite" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-11 cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:text-gray-300 dark:hover:bg-slate-800 dark:focus-visible:outline-white"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`${CONFIRM_BUTTON_BASE_CLASSNAME} ${
              isDestructive ? 'bg-red-600 focus-visible:outline-red-600' : 'bg-brand focus-visible:outline-brand'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
