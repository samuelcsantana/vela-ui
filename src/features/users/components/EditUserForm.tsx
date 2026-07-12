import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { useAuthStore } from '../../auth/store/auth-store';
import { useTenants } from '../../tenants/hooks/use-tenants';
import { useToastStore } from '../../../store/toast-store';
import { useUpdateUser } from '../hooks/use-users';
import type { User } from '../api/users-api';

const editUserSchema = z.object({
  email: z.string().email('users.validation.invalidEmail'),
  // Password is optional on edit: an empty string means "keep current".
  // When the user types something it must be at least 6 characters.
  password: z.string().min(6, 'users.validation.passwordTooShort').or(z.literal('')),
  role: z.enum(['ADMIN', 'MEMBER']),
  tenantId: z.string().min(1, 'users.validation.tenantRequired'),
});

type EditUserValues = z.infer<typeof editUserSchema>;

interface EditUserFormProps {
  user: User | null;
  onClose: () => void;
}

const DIALOG_TITLE_ID = 'edit-user-title';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const FIELD_CLASSNAME =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15';

const HELPER_TEXT_CLASSNAME = 'text-xs text-muted-foreground';

export const EditUserForm = ({ user, onClose }: EditUserFormProps) => {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);
  const isVelaAdmin = useAuthStore((state) => state.user?.role) === 'VELA_ADMIN';
  const updateUserMutation = useUpdateUser();
  const tenantsQuery = useTenants({ enabled: isVelaAdmin });
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    // `values` (not `defaultValues`) keeps the form in sync whenever a different
    // user is opened for editing, re-computing dirtyFields against the new entity.
    values: user
      ? { email: user.email, password: '', role: user.role as 'ADMIN' | 'MEMBER', tenantId: user.tenantId }
      : undefined,
  });

  const roleValue = watch('role');
  const tenantIdValue = watch('tenantId');

  const handleClose = () => {
    reset();
    onClose();
  };

  // Body scroll lock while the dialog is open.
  useEffect(() => {
    if (!user) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [user]);

  // Focus trap + Escape-to-close + focus restoration on close.
  useEffect(() => {
    if (!user) {
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
  }, [user]);

  if (!user) {
    return null;
  }

  const onSubmit = handleSubmit((values) => {
    const changedFields: { email?: string; password?: string; role?: 'ADMIN' | 'MEMBER'; tenantId?: string } = {};
    if (dirtyFields.email) changedFields.email = values.email;
    // Only include password when the user actually typed something; an empty dirty
    // password field means "keep current" and is intentionally omitted.
    if (dirtyFields.password && values.password) changedFields.password = values.password;
    if (dirtyFields.role) changedFields.role = values.role;
    if (dirtyFields.tenantId) changedFields.tenantId = values.tenantId;

    if (Object.keys(changedFields).length === 0) {
      handleClose();
      return;
    }

    updateUserMutation.mutate(
      { id: user.id, input: changedFields },
      {
        onSuccess: () => {
          showToast(t('users.form.editSuccess'));
          reset();
          onClose();
        },
      },
    );
  });

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      // Only a click on the backdrop itself dismisses - checking currentTarget
      // replaces the stopPropagation handler the dialog panel used to need.
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id={DIALOG_TITLE_ID} className="text-lg font-semibold text-foreground">
            {t('users.form.editTitle')}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('common.close')}
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
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
            <p id="email-error" aria-live="polite" className="text-sm text-destructive">
              {errors.email?.message ? t(errors.email.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {t('users.fields.password')}
            </label>
            <input
              id="password"
              type="password"
              placeholder={t('users.form.passwordPlaceholder')}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : 'password-helper'}
              className={FIELD_CLASSNAME}
              {...register('password')}
            />
            <p id="password-helper" className={HELPER_TEXT_CLASSNAME}>
              {t('users.form.passwordHelper')}
            </p>
            <p id="password-error" aria-live="polite" className="text-sm text-destructive">
              {errors.password?.message ? t(errors.password.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-foreground">
              {t('users.fields.role')}
            </label>
            <Select
              value={roleValue}
              onValueChange={(value) =>
                setValue('role', value as EditUserValues['role'], { shouldValidate: true, shouldDirty: true })
              }
            >
              <SelectTrigger id="role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">MEMBER</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isVelaAdmin ? (
            <div className="flex flex-col gap-1">
              <label htmlFor="tenantId" className="text-sm font-medium text-foreground">
                {t('users.fields.tenant')}
              </label>
              <Select
                value={tenantIdValue}
                onValueChange={(value) => setValue('tenantId', value, { shouldValidate: true, shouldDirty: true })}
                disabled={tenantsQuery.isLoading}
              >
                <SelectTrigger
                  id="tenantId"
                  aria-invalid={Boolean(errors.tenantId)}
                  aria-describedby={errors.tenantId ? 'tenantId-error' : undefined}
                  className="w-full"
                >
                  <SelectValue placeholder={t('users.form.tenantPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {tenantsQuery.data?.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tenantsQuery.isLoading ? <p className={HELPER_TEXT_CLASSNAME}>{t('users.form.tenantLoading')}</p> : null}
              {tenantsQuery.isError ? (
                <p role="alert" className="text-sm text-destructive">
                  {t('users.form.tenantError')}
                </p>
              ) : null}
              <p id="tenantId-error" aria-live="polite" className="text-sm text-destructive">
                {errors.tenantId?.message ? t(errors.tenantId.message) : ''}
              </p>
            </div>
          ) : null}

          <p aria-live="polite" className="text-sm text-destructive">
            {updateUserMutation.isError ? t('users.form.editSubmitError') : ''}
          </p>

          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-11 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isPending}
              className="min-h-11 cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateUserMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
