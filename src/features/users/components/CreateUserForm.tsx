import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../auth/store/auth-store';
import { useTenants } from '../../tenants/hooks/use-tenants';
import { useToastStore } from '../../../store/toast-store';
import { useCreateUser } from '../hooks/use-users';
import { createUserSchema, type CreateUserValues } from '../schema';

interface CreateUserFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIALOG_TITLE_ID = 'create-user-title';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const FIELD_CLASSNAME =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus-visible:outline-white';

const HELPER_TEXT_CLASSNAME = 'text-xs text-slate-500 dark:text-gray-400';

export const CreateUserForm = ({ isOpen, onClose }: CreateUserFormProps) => {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);
  const authTenantId = useAuthStore((state) => state.user?.tenantId);
  const isVelaAdmin = useAuthStore((state) => state.user?.role) === 'VELA_ADMIN';
  const createUserMutation = useCreateUser();
  const tenantsQuery = useTenants({ enabled: isVelaAdmin });
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    // A plain ADMIN never sees the tenant <select>, so its tenantId is silently
    // pre-filled with their own; VELA_ADMIN must actively pick one.
    defaultValues: { email: '', password: '', role: 'MEMBER', tenantId: isVelaAdmin ? '' : (authTenantId ?? '') },
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

    // The dialog panel is always mounted while this effect is active, so the ref is always attached.
    const getFocusableElements = () =>
      Array.from(dialogRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Falls back to the first focusable element if the form structure ever changes and #email is removed.
    /* v8 ignore next */
    const initialFocusTarget = dialogRef.current?.querySelector<HTMLElement>('#email') ?? getFocusableElements()[0];
    initialFocusTarget?.focus();

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
        showToast(t('users.form.createSuccess'));
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
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-slate-900"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={DIALOG_TITLE_ID} className="text-lg font-semibold text-slate-900 dark:text-white">
            {t('users.form.title')}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('common.close')}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('users.fields.email')}
            </label>
            <input
              id="email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'email-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('email')}
            />
            <p id="email-error" aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
              {errors.email?.message ? t(errors.email.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('users.fields.password')}
            </label>
            <input
              id="password"
              type="password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('password')}
            />
            <p id="password-error" aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
              {errors.password?.message ? t(errors.password.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('users.fields.role')}
            </label>
            <select id="role" className={FIELD_CLASSNAME} {...register('role')}>
              <option value="MEMBER">MEMBER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>

          {isVelaAdmin ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="tenantId" className="text-sm font-medium text-slate-700 dark:text-gray-300">
                {t('users.fields.tenant')}
              </label>
              <select
                id="tenantId"
                aria-invalid={Boolean(errors.tenantId)}
                aria-describedby={errors.tenantId ? 'tenantId-error' : undefined}
                className={FIELD_CLASSNAME}
                disabled={tenantsQuery.isLoading}
                {...register('tenantId')}
              >
                <option value="">{t('users.form.tenantPlaceholder')}</option>
                {tenantsQuery.data?.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              {tenantsQuery.isLoading ? <p className={HELPER_TEXT_CLASSNAME}>{t('users.form.tenantLoading')}</p> : null}
              {tenantsQuery.isError ? (
                <p role="alert" className="text-sm text-red-600 dark:text-red-400">
                  {t('users.form.tenantError')}
                </p>
              ) : null}
              <p id="tenantId-error" aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
                {errors.tenantId?.message ? t(errors.tenantId.message) : ''}
              </p>
            </div>
          ) : null}

          <p aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
            {createUserMutation.isError ? t('users.form.submitError') : ''}
          </p>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-11 cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-300 dark:hover:bg-slate-800 dark:focus-visible:outline-white"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending}
              className="min-h-11 cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:outline-white"
            >
              {createUserMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
