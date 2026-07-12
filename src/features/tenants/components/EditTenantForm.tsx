import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../../../lib/api';
import { useToastStore } from '../../../store/toast-store';
import type { Tenant } from '../api/tenants-api';
import { useUpdateTenant } from '../hooks/use-tenants';
import { createTenantSchema, HEX_COLOR_REGEX, type CreateTenantValues } from '../schema';
import { DEFAULT_BRAND_COLOR } from '../theme';

interface EditTenantFormProps {
  tenant: Tenant | null;
  onClose: () => void;
}

const DIALOG_TITLE_ID = 'edit-tenant-title';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const FIELD_CLASSNAME =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15';

const FILE_FIELD_CLASSNAME =
  'w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-900 shadow-sm file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200';

const HELPER_TEXT_CLASSNAME = 'text-xs text-muted-foreground';

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
  const tenantLogoUrl = tenant?.logoUrl ?? null;
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(tenantLogoUrl);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<CreateTenantValues>({
    resolver: zodResolver(createTenantSchema),
    // `values` (not `defaultValues`) keeps the form in sync whenever a different
    // tenant is opened for editing, re-computing dirtyFields against the new entity.
    values: tenant
      ? { name: tenant.name, slug: tenant.slug, primaryColor: tenant.primaryColor ?? DEFAULT_BRAND_COLOR }
      : undefined,
  });

  const primaryColor = watch('primaryColor');
  const primaryColorSwatchValue = primaryColor && HEX_COLOR_REGEX.test(primaryColor) ? primaryColor : DEFAULT_BRAND_COLOR;

  // Resets the locally-selected file and preview whenever a different tenant is opened.
  useEffect(() => {
    setLogoFile(null);
    setLogoPreviewUrl(tenantLogoUrl);
  }, [tenant?.id, tenantLogoUrl]);

  // Revokes object URLs created for a locally-selected file; never revokes a remote logoUrl.
  useEffect(() => {
    return () => {
      if (logoPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const handleClose = () => {
    reset();
    setLogoFile(null);
    setLogoPreviewUrl(tenantLogoUrl);
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
    const changedFields: { name?: string; slug?: string; primaryColor?: string; logo?: File } = {};
    if (dirtyFields.name) changedFields.name = values.name;
    if (dirtyFields.slug) changedFields.slug = values.slug;
    if (dirtyFields.primaryColor) changedFields.primaryColor = values.primaryColor || undefined;
    if (logoFile) changedFields.logo = logoFile;

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
          setLogoFile(null);
          onClose();
        },
      },
    );
  });

  const errorMessage = updateTenantMutation.isError
    ? t(getEditTenantErrorKey(getApiErrorMessage(updateTenantMutation.error)))
    : '';

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
            {t('tenants.form.editTitle')}
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
            <label htmlFor="name" className="text-sm font-medium text-foreground">
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
            <p id="name-error" aria-live="polite" className="text-sm text-destructive">
              {errors.name?.message ? t(errors.name.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slug" className="text-sm font-medium text-foreground">
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
            <p id="slug-error" aria-live="polite" className="text-sm text-destructive">
              {errors.slug?.message ? t(errors.slug.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="primaryColor" className="text-sm font-medium text-foreground">
              {t('tenants.fields.primaryColor')}
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                aria-label={t('tenants.form.primaryColorPickerLabel')}
                value={primaryColorSwatchValue}
                onChange={(event) =>
                  setValue('primaryColor', event.target.value, { shouldValidate: true, shouldDirty: true })
                }
                className="h-11 w-11 shrink-0 cursor-pointer rounded-md border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-800"
              />
              <input
                id="primaryColor"
                type="text"
                placeholder="#4f46e5"
                aria-invalid={Boolean(errors.primaryColor)}
                aria-describedby={
                  errors.primaryColor ? 'primaryColor-helper primaryColor-error' : 'primaryColor-helper'
                }
                className={`${FIELD_CLASSNAME} flex-1`}
                {...register('primaryColor')}
              />
            </div>
            <p id="primaryColor-helper" className={HELPER_TEXT_CLASSNAME}>
              {t('tenants.form.primaryColorHelper')}
            </p>
            <p id="primaryColor-error" aria-live="polite" className="text-sm text-destructive">
              {errors.primaryColor?.message ? t(errors.primaryColor.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="logo" className="text-sm font-medium text-foreground">
              {t('tenants.fields.logo')}
            </label>
            <input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className={FILE_FIELD_CLASSNAME}
            />
            <p className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.logoHelper')}</p>
            {logoPreviewUrl ? (
              <img
                src={logoPreviewUrl}
                alt={t('tenants.form.logoPreviewAlt')}
                className="mt-1 h-16 w-16 rounded-md border border-slate-200 object-contain dark:border-slate-700"
              />
            ) : null}
          </div>

          <p aria-live="polite" className="text-sm text-destructive">
            {errorMessage}
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
              disabled={updateTenantMutation.isPending}
              className="min-h-11 cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateTenantMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
