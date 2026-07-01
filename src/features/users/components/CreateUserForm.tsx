import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useCreateUser } from '../hooks/use-users';
import { createUserSchema, type CreateUserValues } from '../schema';

interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: Array<{ value: CreateUserValues['role']; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

const DIALOG_TITLE_ID = 'create-user-title';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const FIELD_CLASSNAME =
  'w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500';

export const CreateUserForm = ({ isOpen, onClose }: CreateUserFormProps) => {
  const createUserMutation = useCreateUser();
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', role: 'viewer' },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

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

    const getFocusableElements = () =>
      dialogRef.current ? Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];

    const initialFocusTarget = dialogRef.current?.querySelector<HTMLElement>('#name');
    (initialFocusTarget ?? getFocusableElements()[0])?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
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
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const onSubmit = handleSubmit((values) => {
    createUserMutation.mutate(values, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={DIALOG_TITLE_ID} className="text-lg font-semibold text-slate-900">
            Add user
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('name')}
            />
            <p id="name-error" aria-live="polite" className="text-sm text-red-600">
              {errors.name?.message}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('email')}
            />
            <p id="email-error" aria-live="polite" className="text-sm text-red-600">
              {errors.email?.message}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              aria-invalid={Boolean(errors.role)}
              aria-describedby={errors.role ? 'role-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('role')}
            >
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p id="role-error" aria-live="polite" className="text-sm text-red-600">
              {errors.role?.message}
            </p>
          </div>

          <p aria-live="polite" className="text-sm text-red-600">
            {createUserMutation.isError ? 'Unable to create user. Please try again.' : ''}
          </p>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-11 rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="min-h-11 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createUserMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
