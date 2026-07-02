import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../../../lib/api';
import { useToastStore } from '../../../store/toast-store';
import type { Tenant } from '../api/tenants-api';
import { useUpdateTenant } from '../hooks/use-tenants';
import { createTenantSchema, type CreateTenantValues } from '../schema';
import { DEFAULT_BRAND_COLOR } from '../theme';

interface EditTenantFormProps {
  tenant: Tenant | null;
  onClose: () => void;
}

const DIALOG_TITLE_ID = 'edit-tenant-title';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const FIELD_CLASSNAME =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus-visible:outline-white';

const HELPER_TEXT_CLASSNAME = 'text-xs text-slate-500 dark:text-gray-400';

const KNOWN_ERROR_KEYS: Record<string, string> = {
  'Another tenant already uses this slug': 'tenants.errors.slugTaken',
};

const getEditTenantErrorKey = (apiMessage: string | undefined): string =>
  (apiMessage && KNOWN_ERROR_KEYS[apiMessage]) || 'tenants.form.editSubmitError';

export const EditTenantForm = ({ tenant, onClose }: EditTenantFormProps) => {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);
  const updateTenantMutation = useUpdateTenant();
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<CreateTenantValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      name: tenant?.name ?? '',
      slug: tenant?.slug ?? '',
      primaryColor: tenant?.primaryColor ?? DEFAULT_BRAND_COLOR,
      logoUrl: tenant?.logoUrl ?? '',
    },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  // Body scroll lock while the dialog is open.
  useEffect(() => {
    if (!tenant) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [tenant]);

  // Focus trap + Escape-to-close + focus restoration on close.
  useEffect(() => {
    if (!tenant) {
      return;
    }

    const previouslyFocusedElement = document.activeElement as HTMLElement | null;

    // The dialog panel is always mounted while this effect is active, so the ref is always attached.
    const getFocusableElements = () =>
      Array.from(dialogRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    // Falls back to the first focusable element if the form structure ever changes and #name is removed.
    /* v8 ignore next */
    const initialFocusTarget = dialogRef.current?.querySelector<HTMLElement>('#name') ?? getFocusableElements()[0];
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
  }, [tenant]);

  if (!tenant) {
    return null;
  }

  const onSubmit = handleSubmit((values) => {
    const changedFields: { name?: string; slug?: string; primaryColor?: string; logoUrl?: string } = {};
    if (dirtyFields.name) changedFields.name = values.name;
    if (dirtyFields.slug) changedFields.slug = values.slug;
    // A native color input can never be cleared to a falsy value, unlike the plain-text logoUrl field.
    if (dirtyFields.primaryColor) changedFields.primaryColor = values.primaryColor;
    if (dirtyFields.logoUrl) changedFields.logoUrl = values.logoUrl || undefined;

    if (Object.keys(changedFields).length === 0) {
      handleClose();
      return;
    }

    updateTenantMutation.mutate(
      { id: tenant.id, input: changedFields },
      {
        onSuccess: () => {
          showToast(t('tenants.form.editSuccess'));
          reset();
          onClose();
        },
      },
    );
  });

  const errorMessage = updateTenantMutation.isError
    ? t(getEditTenantErrorKey(getApiErrorMessage(updateTenantMutation.error)))
    : '';

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
            {t('tenants.form.editTitle')}
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
            <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('tenants.fields.name')}
            </label>
            <input
              id="name"
              type="text"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'name-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('name')}
            />
            <p id="name-error" aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
              {errors.name?.message ? t(errors.name.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slug" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('tenants.fields.slug')}
            </label>
            <input
              id="slug"
              type="text"
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? 'slug-helper slug-error' : 'slug-helper'}
              className={FIELD_CLASSNAME}
              {...register('slug')}
            />
            <p id="slug-helper" className={HELPER_TEXT_CLASSNAME}>
              {t('tenants.form.slugHelper')}
            </p>
            <p id="slug-error" aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
              {errors.slug?.message ? t(errors.slug.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="primaryColor" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('tenants.fields.primaryColor')}
            </label>
            {/* A native color input always yields a valid #rrggbb value, so this field can never fail validation. */}
            <input
              id="primaryColor"
              type="color"
              aria-describedby="primaryColor-helper"
              className="h-11 w-full cursor-pointer rounded-md border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
              {...register('primaryColor')}
            />
            <p id="primaryColor-helper" className={HELPER_TEXT_CLASSNAME}>
              {t('tenants.form.primaryColorHelper')}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="logoUrl" className="text-sm font-medium text-slate-700 dark:text-gray-300">
              {t('tenants.fields.logoUrl')}
            </label>
            <input
              id="logoUrl"
              type="text"
              placeholder="https://..."
              aria-invalid={Boolean(errors.logoUrl)}
              aria-describedby={errors.logoUrl ? 'logoUrl-helper logoUrl-error' : 'logoUrl-helper'}
              className={FIELD_CLASSNAME}
              {...register('logoUrl')}
            />
            <p id="logoUrl-helper" className={HELPER_TEXT_CLASSNAME}>
              {t('tenants.form.logoUrlHelper')}
            </p>
            <p id="logoUrl-error" aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
              {errors.logoUrl?.message ? t(errors.logoUrl.message) : ''}
            </p>
          </div>

          <p aria-live="polite" className="text-sm text-red-600 dark:text-red-400">
            {errorMessage}
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
              disabled={updateTenantMutation.isPending}
              className="min-h-11 cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:outline-white"
            >
              {updateTenantMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
