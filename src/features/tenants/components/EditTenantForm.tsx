import { zodResolver } from '@hookform/resolvers/zod';
import { Sailboat, X } from 'lucide-react';
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

  const tenantBackgroundUrl = tenant?.backgroundImageUrl ?? null;
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string | null>(tenantBackgroundUrl);

  const [logoWidthMode, setLogoWidthMode] = useState<'auto' | 'custom'>(
    tenant?.logoWidth != null ? 'custom' : 'auto',
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<CreateTenantValues>({
    resolver: zodResolver(createTenantSchema),
    values: tenant
      ? {
          name: tenant.name,
          slug: tenant.slug,
          primaryColor: tenant.primaryColor ?? DEFAULT_BRAND_COLOR,
          backgroundColor: tenant.backgroundColor ?? '',
          logoWidth: tenant.logoWidth ?? undefined,
        }
      : undefined,
  });

  const primaryColor = watch('primaryColor');
  const primaryColorSwatchValue =
    primaryColor && HEX_COLOR_REGEX.test(primaryColor) ? primaryColor : DEFAULT_BRAND_COLOR;

  const backgroundColor = watch('backgroundColor');
  const backgroundColorSwatchValue =
    backgroundColor && HEX_COLOR_REGEX.test(backgroundColor) ? backgroundColor : DEFAULT_BRAND_COLOR;

  const watchedName = watch('name');
  const watchedLogoWidth = watch('logoWidth');

  useEffect(() => {
    setLogoFile(null);
    setLogoPreviewUrl(tenantLogoUrl);
  }, [tenant?.id, tenantLogoUrl]);

  useEffect(() => {
    setBackgroundFile(null);
    setBackgroundPreviewUrl(tenantBackgroundUrl);
    setLogoWidthMode(tenant?.logoWidth != null ? 'custom' : 'auto');
  }, [tenant?.id, tenantBackgroundUrl, tenant?.logoWidth]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (backgroundPreviewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(backgroundPreviewUrl);
      }
    };
  }, [backgroundPreviewUrl]);

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    /* v8 ignore next 3 */
    if (!file) return;
    setLogoFile(file);
    setLogoPreviewUrl(URL.createObjectURL(file));
  };

  const handleBackgroundChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    /* v8 ignore next 3 */
    if (!file) return;
    setBackgroundFile(file);
    setBackgroundPreviewUrl(URL.createObjectURL(file));
  };

  const handleClose = () => {
    reset();
    setLogoFile(null);
    setLogoPreviewUrl(tenantLogoUrl);
    setBackgroundFile(null);
    setBackgroundPreviewUrl(tenantBackgroundUrl);
    setLogoWidthMode(tenant?.logoWidth != null ? 'custom' : 'auto');
    onClose();
  };

  useEffect(() => {
    if (!tenant) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;
    const previouslyFocusedElement = document.activeElement as HTMLElement | null;
    const getFocusableElements = () =>
      Array.from(dialogRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    /* v8 ignore next */
    const initialFocusTarget =
      dialogRef.current?.querySelector<HTMLElement>('#name') ?? getFocusableElements()[0];
    initialFocusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
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
  }, [tenant]);

  if (!tenant) return null;

  const onSubmit = handleSubmit((values) => {
    const changedFields: {
      name?: string; slug?: string; primaryColor?: string; logo?: File;
      backgroundColor?: string; logoWidth?: number; backgroundImage?: File;
    } = {};
    if (dirtyFields.name) changedFields.name = values.name;
    if (dirtyFields.slug) changedFields.slug = values.slug;
    if (dirtyFields.primaryColor) changedFields.primaryColor = values.primaryColor || undefined;
    if (logoFile) changedFields.logo = logoFile;
    if (dirtyFields.backgroundColor) changedFields.backgroundColor = values.backgroundColor || undefined;
    if (dirtyFields.logoWidth) changedFields.logoWidth = values.logoWidth;
    if (backgroundFile) changedFields.backgroundImage = backgroundFile;

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
          setBackgroundFile(null);
          onClose();
        },
      },
    );
  });

  const errorMessage = updateTenantMutation.isError
    ? t(getEditTenantErrorKey(getApiErrorMessage(updateTenantMutation.error)))
    : '';

  // --- Preview values ---
  const previewBg: React.CSSProperties = {};
  if (backgroundPreviewUrl) {
    previewBg.backgroundImage = `url(${backgroundPreviewUrl})`;
    previewBg.backgroundSize = 'cover';
    previewBg.backgroundPosition = 'center';
  }
  if (backgroundColor && HEX_COLOR_REGEX.test(backgroundColor)) {
    previewBg.backgroundColor = backgroundColor;
  } else if (!backgroundPreviewUrl) {
    previewBg.backgroundColor = '#0f172a';
  }

  const previewLogoWidth =
    watchedLogoWidth && watchedLogoWidth >= 16 ? `${watchedLogoWidth}px` : undefined;

  const previewName = watchedName || tenant.name;
  const previewBrandColor = primaryColorSwatchValue;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/60 backdrop-blur-sm p-4 pt-8 pb-8"
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
        className="flex w-full max-w-5xl flex-col rounded-xl border border-border bg-card shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
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

        {/* Body: form left, preview right */}
        <div className="flex flex-col gap-0 md:flex-row">
          {/* === FORM COLUMN === */}
          <div className="flex-1 overflow-y-auto border-b border-border p-6 md:border-b-0 md:border-r md:max-h-[calc(100vh-12rem)]">
            <form id="edit-tenant-form" onSubmit={onSubmit} className="flex flex-col gap-5">
              {/* Identity section */}
              <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Identity
                </legend>
                <div className="flex flex-col gap-1">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">{t('tenants.fields.name')}</label>
                  <input id="name" type="text" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} className={FIELD_CLASSNAME} {...register('name')} />
                  <p id="name-error" aria-live="polite" className="text-sm text-destructive">{errors.name?.message ? t(errors.name.message) : ''}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor="slug" className="text-sm font-medium text-foreground">{t('tenants.fields.slug')}</label>
                  <input id="slug" type="text" aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? 'slug-helper slug-error' : 'slug-helper'} className={FIELD_CLASSNAME} {...register('slug')} />
                  <p id="slug-helper" className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.slugHelper')}</p>
                  <p id="slug-error" aria-live="polite" className="text-sm text-destructive">{errors.slug?.message ? t(errors.slug.message) : ''}</p>
                </div>
              </fieldset>

              {/* Branding section */}
              <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Branding
                </legend>
                {/* Primary Color */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="primaryColor" className="text-sm font-medium text-foreground">{t('tenants.fields.primaryColor')}</label>
                  <div className="flex gap-2">
                    <input type="color" aria-label={t('tenants.form.primaryColorPickerLabel')} value={primaryColorSwatchValue} onChange={(e) => setValue('primaryColor', e.target.value, { shouldValidate: true, shouldDirty: true })} className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                    <input id="primaryColor" type="text" placeholder="#4f46e5" aria-invalid={Boolean(errors.primaryColor)} aria-describedby={errors.primaryColor ? 'primaryColor-helper primaryColor-error' : 'primaryColor-helper'} className={`${FIELD_CLASSNAME} flex-1`} {...register('primaryColor')} />
                  </div>
                  <p id="primaryColor-helper" className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.primaryColorHelper')}</p>
                  <p id="primaryColor-error" aria-live="polite" className="text-sm text-destructive">{errors.primaryColor?.message ? t(errors.primaryColor.message) : ''}</p>
                </div>

                {/* Background Color */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="backgroundColor" className="text-sm font-medium text-foreground">{t('tenants.fields.backgroundColor')}</label>
                  <div className="flex gap-2">
                    <input type="color" aria-label={t('tenants.form.backgroundColorPickerLabel')} value={backgroundColorSwatchValue} onChange={(e) => setValue('backgroundColor', e.target.value, { shouldValidate: true, shouldDirty: true })} className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1" />
                    <input id="backgroundColor" type="text" placeholder="#0f172a" aria-invalid={Boolean(errors.backgroundColor)} aria-describedby={errors.backgroundColor ? 'backgroundColor-helper backgroundColor-error' : 'backgroundColor-helper'} className={`${FIELD_CLASSNAME} flex-1`} {...register('backgroundColor')} />
                  </div>
                  <p id="backgroundColor-helper" className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.backgroundColorHelper')}</p>
                  <p id="backgroundColor-error" aria-live="polite" className="text-sm text-destructive">{errors.backgroundColor?.message ? t(errors.backgroundColor.message) : ''}</p>
                </div>
              </fieldset>

              {/* Media section */}
              <fieldset className="flex flex-col gap-4 rounded-lg border border-border p-4">
                <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Images
                </legend>
                {/* Logo */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="logo" className="text-sm font-medium text-foreground">{t('tenants.fields.logo')}</label>
                  <input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className={FILE_FIELD_CLASSNAME} />
                  <p className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.logoHelper')}</p>
                  {logoPreviewUrl ? <img src={logoPreviewUrl} alt={t('tenants.form.logoPreviewAlt')} className="mt-1 h-12 rounded-lg border border-slate-200 object-contain" /> : null}
                </div>

                {/* Logo Width */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-foreground">{t('tenants.fields.logoWidth')}</span>
                  <div className="flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name="logoWidthMode" checked={logoWidthMode === 'auto'} onChange={() => { setLogoWidthMode('auto'); setValue('logoWidth', undefined, { shouldDirty: true }); }} className="cursor-pointer" />
                      <span className="text-sm text-foreground">{t('tenants.form.logoWidthAuto')}</span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2">
                      <input type="radio" name="logoWidthMode" checked={logoWidthMode === 'custom'} onChange={() => setLogoWidthMode('custom')} className="cursor-pointer" />
                      <span className="text-sm text-foreground">{t('tenants.form.logoWidthCustom')}</span>
                    </label>
                  </div>
                  {logoWidthMode === 'custom' ? (
                    <input id="logoWidth" type="number" min={16} max={512} placeholder="200" aria-invalid={Boolean(errors.logoWidth)} aria-describedby={errors.logoWidth ? 'logoWidth-error' : undefined} className={FIELD_CLASSNAME} {...register('logoWidth', { valueAsNumber: true })} />
                  ) : null}
                  <p id="logoWidth-error" aria-live="polite" className="text-sm text-destructive">{errors.logoWidth?.message ? t(errors.logoWidth.message) : ''}</p>
                </div>

                {/* Background Image */}
                <div className="flex flex-col gap-1">
                  <label htmlFor="backgroundImage" className="text-sm font-medium text-foreground">{t('tenants.fields.backgroundImage')}</label>
                  <input id="backgroundImage" type="file" accept="image/*" onChange={handleBackgroundChange} className={FILE_FIELD_CLASSNAME} />
                  <p className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.backgroundImageHelper')}</p>
                  {backgroundPreviewUrl ? <img src={backgroundPreviewUrl} alt={t('tenants.form.backgroundImagePreviewAlt')} className="mt-1 h-12 w-20 rounded-lg border border-slate-200 object-cover" /> : null}
                </div>
              </fieldset>
            </form>
          </div>

          {/* === PREVIEW COLUMN === */}
          <div className="flex flex-1 flex-col">
            <div className="border-b border-border bg-muted/30 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('tenants.form.preview')}
              </p>
            </div>
            {/* Login screen preview */}
            <div className="flex min-h-[500px] flex-1 bg-slate-50">
              {/* Hero panel — mirrors the actual LoginForm */}
              <div
                className="relative flex w-[44%] flex-col justify-between overflow-hidden p-6"
                style={previewBg}
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_color-mix(in_srgb,_var(--tenant-brand)_35%,transparent),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_color-mix(in_srgb,_var(--tenant-brand)_25%,transparent),_transparent_60%)]"
                  style={{ '--tenant-brand': previewBrandColor } as React.CSSProperties}
                />
                <div className="relative flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white shadow-lg shadow-brand/40" style={{ backgroundColor: previewBrandColor }}>
                    <Sailboat size={15} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-white">{previewName}</span>
                </div>
                <div className="relative">
                  <h3 className="text-xl font-semibold leading-tight tracking-tight text-white">
                    {t('auth.hero.title')}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">{t('auth.hero.subtitle')}</p>
                </div>
                <p className="relative text-[10px] text-slate-500">Vela — multi-tenant SaaS portfolio demo</p>
              </div>

              {/* Form panel */}
              <div className="flex flex-1 items-center justify-center p-4">
                <div className="w-full max-w-[240px]">
                  {logoPreviewUrl ? (
                    <div className="mb-4 flex justify-center">
                      <img
                        src={logoPreviewUrl}
                        alt=""
                        className="max-w-full object-contain"
                        style={{
                          width: previewLogoWidth ?? 'auto',
                          maxWidth: previewLogoWidth ? previewLogoWidth : '60%',
                          height: 'auto',
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mb-5 flex justify-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shadow-brand/30" style={{ backgroundColor: previewBrandColor }}>
                        <Sailboat size={20} aria-hidden="true" />
                      </span>
                    </div>
                  )}
                  <h4 className="mb-1 text-center text-base font-semibold tracking-tight text-slate-900">
                    {previewName}
                  </h4>
                  <p className="mb-5 text-center text-[11px] leading-relaxed text-slate-500">
                    {t('auth.tenantLoginSubtitle')}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-400 leading-9">
                      {t('users.fields.email')}
                    </div>
                    <div className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-400 leading-9">
                      {t('users.fields.password')}
                    </div>
                    <div
                      className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white shadow-lg"
                      style={{ backgroundColor: previewBrandColor }}
                    >
                      {t('auth.loginSubmit')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <p aria-live="polite" className="text-sm text-destructive">
            {errorMessage}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-11 cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="edit-tenant-form"
              disabled={updateTenantMutation.isPending}
              className="min-h-11 cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updateTenantMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
