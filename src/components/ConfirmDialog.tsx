import { useDialog } from '../hooks/use-dialog';

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

const CONFIRM_BUTTON_BASE_CLASSNAME =
  'min-h-11 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

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
  const { dialogRef, overlayProps } = useDialog({ isOpen, onClose: onCancel });

  if (!isOpen) return null;

  return (
    <div {...overlayProps}>
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
        aria-describedby={DIALOG_DESCRIPTION_ID}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
      >
        <h2 id={DIALOG_TITLE_ID} className="text-lg font-semibold text-foreground">{title}</h2>
        <p id={DIALOG_DESCRIPTION_ID} className="mt-2 text-sm text-muted-foreground">{description}</p>
        <p aria-live="polite" className="mt-2 text-sm text-destructive">{errorMessage}</p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-11 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
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
