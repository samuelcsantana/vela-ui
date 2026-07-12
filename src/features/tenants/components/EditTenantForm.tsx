import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ChevronDown, Image as ImageIcon, Palette, X } from 'lucide-react';
import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../../../hooks/use-dialog';
import { getApiErrorMessage } from '../../../lib/api';
import { useToastStore } from '../../../store/toast-store';
import type { Tenant } from '../api/tenants-api';
import { useUpdateTenant } from '../hooks/use-tenants';
import { createTenantSchema, HEX_COLOR_REGEX, type CreateTenantValues } from '../schema';
import { buildLoginBackgroundStyle, DEFAULT_BRAND_COLOR } from '../theme';
import {
  CANCEL_BUTTON_CLASSNAME,
  COLOR_CONTROL_CLASSNAME,
  COLOR_SWATCH_CLASSNAME,
  COLOR_TEXT_INPUT_CLASSNAME,
  DIALOG_CLOSE_BUTTON_CLASSNAME,
  DIALOG_OVERLAY_CLASSNAME,
  DIALOG_PANEL_CLASSNAME,
  FIELD_CLASSNAME,
  HELPER_TEXT_CLASSNAME,
  SECTION_CLASSNAME,
  SECTION_ICON_CLASSNAME,
  SECTION_LEGEND_CLASSNAME,
  SEGMENT_LABEL_CLASSNAME,
  SUBMIT_BUTTON_CLASSNAME,
  UPLOAD_CARD_CLASSNAME,
  UPLOAD_INPUT_CLASSNAME,
  UPLOAD_THUMB_CLASSNAME,
} from './tenant-form-styles';

interface EditTenantFormProps {
  tenant: Tenant | null;
  onClose: () => void;
}

const DIALOG_TITLE_ID = 'edit-tenant-title';

// Mirrors TenantLoginForm's light page background (bg-background) when the tenant
// has no background color or image of its own.
const PREVIEW_DEFAULT_PAGE_BG = '#f1f5f9';

const KNOWN_ERROR_KEYS: Record<string, string> = {
  'Another tenant already uses this slug': 'tenants.errors.slugTaken',
};

const getEditTenantErrorKey = (apiMessage: string | undefined): string =>
  (apiMessage && KNOWN_ERROR_KEYS[apiMessage]) || 'tenants.form.editSubmitError';

export const EditTenantForm = ({ tenant, onClose }: EditTenantFormProps) => {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);
  const updateTenantMutation = useUpdateTenant();
  const tenantLogoUrl = tenant?.logoUrl ?? null;
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(tenantLogoUrl);

  const tenantBackgroundUrl = tenant?.backgroundImageUrl ?? null;
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [backgroundPreviewUrl, setBackgroundPreviewUrl] = useState<string | null>(tenantBackgroundUrl);

  const [logoWidthMode, setLogoWidthMode] = useState<'auto' | 'custom'>(
    tenant?.logoWidth != null ? 'custom' : 'auto',
  );

  // Mobile-only: the login mock starts collapsed so the form fields get the screen;
  // on lg the preview column is always visible and this state is ignored (lg:flex).
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
  const watchedSlug = watch('slug');
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

  // Stable identity matters: useDialog re-runs its focus effect when onClose changes,
  // and this component re-renders on every watched keystroke.
  const handleClose = useCallback(() => {
    reset();
    setLogoFile(null);
    setLogoPreviewUrl(tenantLogoUrl);
    setBackgroundFile(null);
    setBackgroundPreviewUrl(tenantBackgroundUrl);
    setLogoWidthMode(tenant?.logoWidth != null ? 'custom' : 'auto');
    onClose();
  }, [reset, tenantLogoUrl, tenantBackgroundUrl, tenant?.logoWidth, onClose]);

  const { dialogRef, overlayProps } = useDialog({
    isOpen: Boolean(tenant),
    onClose: handleClose,
    initialFocus: '#name',
  });

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
  // Same function the real /$slug/login page uses, so the preview cannot drift.
  const previewBg = buildLoginBackgroundStyle(backgroundColor, backgroundPreviewUrl);
  if (!previewBg.backgroundColor && !backgroundPreviewUrl) {
    previewBg.backgroundColor = PREVIEW_DEFAULT_PAGE_BG;
  }

  const previewLogoWidth =
    watchedLogoWidth && watchedLogoWidth >= 16 ? `${watchedLogoWidth}px` : undefined;

  const previewName = watchedName || tenant.name;
  const previewSlug = watchedSlug || tenant.slug;
  const previewBrandColor = primaryColorSwatchValue;

  return (
    <div {...overlayProps} className={DIALOG_OVERLAY_CLASSNAME}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
        className={`${DIALOG_PANEL_CLASSNAME} max-w-5xl`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 id={DIALOG_TITLE_ID} className="text-lg font-semibold tracking-tight text-foreground">
              {t('tenants.form.editTitle')}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('tenants.form.editSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t('common.close')}
            className={DIALOG_CLOSE_BUTTON_CLASSNAME}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Body: one scroll container on mobile (the preview collapses to a slim sticky
            bar so the fields keep the screen); side-by-side columns with independent
            scroll on lg. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,10fr)_minmax(0,9fr)] lg:overflow-hidden">
          {/* === PREVIEW === */}
          <div className="sticky top-0 z-10 border-b border-border bg-muted/95 backdrop-blur-sm lg:static lg:order-2 lg:flex lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-l lg:bg-muted/40 lg:backdrop-blur-none">
            <div className="flex items-center justify-between gap-3 px-5 py-1.5 sm:px-6 lg:py-0 lg:pt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('tenants.form.preview')}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 motion-safe:animate-ping" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </span>
                  {t('tenants.form.previewLive')}
                </span>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen((open) => !open)}
                  aria-expanded={isPreviewOpen}
                  aria-label={t('tenants.form.previewToggle')}
                  className={`${DIALOG_CLOSE_BUTTON_CLASSNAME} lg:hidden`}
                >
                  <ChevronDown
                    size={16}
                    aria-hidden="true"
                    className={`transition-transform ${isPreviewOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Browser-framed mock of the tenant login page (a visual duplicate of the
                form values, so it is hidden from assistive tech). `hidden` only applies
                below lg while the mock is collapsed; lg:flex always wins on desktop. */}
            <div
              aria-hidden="true"
              className={`${isPreviewOpen ? '' : 'hidden'} p-4 pt-2 sm:p-6 sm:pt-2 lg:flex lg:flex-1 lg:items-center lg:p-8 lg:[background-image:radial-gradient(hsl(var(--border))_1px,transparent_1px)] lg:[background-size:14px_14px]`}
            >
              <div className="w-full overflow-hidden rounded-xl border border-border bg-white shadow-xl shadow-slate-900/10">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="ml-2 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[10px] leading-none text-slate-500 ring-1 ring-slate-200">
                    /{previewSlug}/login
                  </span>
                </div>

                {/* Tenant login page */}
                <div
                  className="flex items-center justify-center px-4 py-6 transition-colors duration-300 sm:py-8 lg:py-12"
                  style={previewBg}
                >
                  <div className="w-full max-w-[16rem] rounded-xl border border-slate-200 bg-white p-4 shadow-lg sm:p-5">
                    {logoPreviewUrl ? (
                      <div className="mb-2 flex justify-center overflow-hidden">
                        <img
                          src={logoPreviewUrl}
                          alt=""
                          className="max-h-12 object-contain"
                          style={{
                            width: previewLogoWidth ?? 'auto',
                            maxWidth: previewLogoWidth ? '100%' : '70%',
                          }}
                        />
                      </div>
                    ) : (
                      <h3 className="text-center text-base font-semibold tracking-tight text-slate-900">
                        {previewName}
                      </h3>
                    )}
                    <p className="mt-1 hidden text-center text-[11px] leading-relaxed text-slate-500 sm:block">
                      {t('auth.tenantLoginSubtitle')}
                    </p>
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-[10px] leading-8 text-slate-400">
                        {t('users.fields.email')}
                      </div>
                      <div className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-[10px] leading-8 text-slate-400">
                        {t('users.fields.password')}
                      </div>
                      <div
                        className="flex h-8 items-center justify-center rounded-lg text-[11px] font-semibold text-white shadow-md transition-colors duration-300"
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

          {/* === FORM === */}
          <div className="min-w-0 p-5 sm:p-6 lg:order-1 lg:overflow-y-auto">
            {/* noValidate: zod owns validation, so the translated messages render instead
                of the browser's native constraint bubbles (e.g. the number input's min). */}
            <form id="edit-tenant-form" onSubmit={onSubmit} noValidate className="flex flex-col divide-y divide-border">
              {/* Identity */}
              <fieldset className={SECTION_CLASSNAME}>
                <legend className={SECTION_LEGEND_CLASSNAME}>
                  <span className={SECTION_ICON_CLASSNAME}>
                    <Building2 size={14} aria-hidden="true" />
                  </span>
                  {t('tenants.form.sections.identity')}
                </legend>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-foreground">{t('tenants.fields.name')}</label>
                  <input id="name" type="text" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} className={FIELD_CLASSNAME} {...register('name')} />
                  <p id="name-error" aria-live="polite" className="text-sm text-destructive">{errors.name?.message ? t(errors.name.message) : ''}</p>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="slug" className="text-sm font-medium text-foreground">{t('tenants.fields.slug')}</label>
                  <input id="slug" type="text" aria-invalid={Boolean(errors.slug)} aria-describedby={errors.slug ? 'slug-helper slug-error' : 'slug-helper'} className={FIELD_CLASSNAME} {...register('slug')} />
                  <p id="slug-helper" className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.slugHelper')}</p>
                  <p id="slug-error" aria-live="polite" className="text-sm text-destructive">{errors.slug?.message ? t(errors.slug.message) : ''}</p>
                </div>
              </fieldset>

              {/* Branding */}
              <fieldset className={SECTION_CLASSNAME}>
                <legend className={SECTION_LEGEND_CLASSNAME}>
                  <span className={SECTION_ICON_CLASSNAME}>
                    <Palette size={14} aria-hidden="true" />
                  </span>
                  {t('tenants.form.sections.branding')}
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label htmlFor="primaryColor" className="text-sm font-medium text-foreground">{t('tenants.fields.primaryColor')}</label>
                    <div className={COLOR_CONTROL_CLASSNAME}>
                      <input type="color" aria-label={t('tenants.form.primaryColorPickerLabel')} value={primaryColorSwatchValue} onChange={(e) => setValue('primaryColor', e.target.value, { shouldValidate: true, shouldDirty: true })} className={COLOR_SWATCH_CLASSNAME} />
                      <input id="primaryColor" type="text" placeholder="#4f46e5" aria-invalid={Boolean(errors.primaryColor)} aria-describedby={errors.primaryColor ? 'primaryColor-helper primaryColor-error' : 'primaryColor-helper'} className={COLOR_TEXT_INPUT_CLASSNAME} {...register('primaryColor')} />
                    </div>
                    <p id="primaryColor-helper" className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.primaryColorHelper')}</p>
                    <p id="primaryColor-error" aria-live="polite" className="text-sm text-destructive">{errors.primaryColor?.message ? t(errors.primaryColor.message) : ''}</p>
                  </div>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <label htmlFor="backgroundColor" className="text-sm font-medium text-foreground">{t('tenants.fields.backgroundColor')}</label>
                    <div className={COLOR_CONTROL_CLASSNAME}>
                      <input type="color" aria-label={t('tenants.form.backgroundColorPickerLabel')} value={backgroundColorSwatchValue} onChange={(e) => setValue('backgroundColor', e.target.value, { shouldValidate: true, shouldDirty: true })} className={COLOR_SWATCH_CLASSNAME} />
                      <input id="backgroundColor" type="text" placeholder="#0f172a" aria-invalid={Boolean(errors.backgroundColor)} aria-describedby={errors.backgroundColor ? 'backgroundColor-helper backgroundColor-error' : 'backgroundColor-helper'} className={COLOR_TEXT_INPUT_CLASSNAME} {...register('backgroundColor')} />
                    </div>
                    <p id="backgroundColor-helper" className={HELPER_TEXT_CLASSNAME}>{t('tenants.form.backgroundColorHelper')}</p>
                    <p id="backgroundColor-error" aria-live="polite" className="text-sm text-destructive">{errors.backgroundColor?.message ? t(errors.backgroundColor.message) : ''}</p>
                  </div>
                </div>
              </fieldset>

              {/* Images */}
              <fieldset className={SECTION_CLASSNAME}>
                <legend className={SECTION_LEGEND_CLASSNAME}>
                  <span className={SECTION_ICON_CLASSNAME}>
                    <ImageIcon size={14} aria-hidden="true" />
                  </span>
                  {t('tenants.form.sections.images')}
                </legend>

                {/* Logo */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="logo" className="text-sm font-medium text-foreground">{t('tenants.fields.logo')}</label>
                  <div className={UPLOAD_CARD_CLASSNAME}>
                    <input id="logo" type="file" accept="image/*" onChange={handleLogoChange} className={UPLOAD_INPUT_CLASSNAME} />
                    {logoPreviewUrl ? (
                      <img src={logoPreviewUrl} alt={t('tenants.form.logoPreviewAlt')} className={`${UPLOAD_THUMB_CLASSNAME} object-contain p-1`} />
                    ) : (
                      <span className={`${UPLOAD_THUMB_CLASSNAME} text-slate-400`}>
                        <ImageIcon size={16} aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{t('tenants.form.uploadCta')}</p>
                      <p className="truncate text-xs text-muted-foreground">{logoFile?.name ?? t('tenants.form.logoHelper')}</p>
                    </div>
                  </div>
                </div>

                {/* Logo width */}
                <div className="flex flex-col gap-2">
                  <span id="logoWidth-label" className="text-sm font-medium text-foreground">{t('tenants.fields.logoWidth')}</span>
                  <div role="radiogroup" aria-labelledby="logoWidth-label" className="inline-flex w-fit rounded-lg border border-slate-300 bg-slate-100 p-1">
                    <label className={SEGMENT_LABEL_CLASSNAME}>
                      <input type="radio" name="logoWidthMode" checked={logoWidthMode === 'auto'} onChange={() => { setLogoWidthMode('auto'); setValue('logoWidth', undefined, { shouldDirty: true }); }} className="sr-only" />
                      {t('tenants.form.logoWidthAuto')}
                    </label>
                    <label className={SEGMENT_LABEL_CLASSNAME}>
                      <input type="radio" name="logoWidthMode" checked={logoWidthMode === 'custom'} onChange={() => setLogoWidthMode('custom')} className="sr-only" />
                      {t('tenants.form.logoWidthCustom')}
                    </label>
                  </div>
                  {logoWidthMode === 'custom' ? (
                    <div className="relative">
                      <input id="logoWidth" type="number" min={16} max={512} placeholder="200" aria-invalid={Boolean(errors.logoWidth)} aria-describedby={errors.logoWidth ? 'logoWidth-error' : undefined} className={`${FIELD_CLASSNAME} pr-10`} {...register('logoWidth', { valueAsNumber: true })} />
                      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs text-slate-400">px</span>
                    </div>
                  ) : null}
                  <p id="logoWidth-error" aria-live="polite" className="text-sm text-destructive">{errors.logoWidth?.message ? t(errors.logoWidth.message) : ''}</p>
                </div>

                {/* Background image */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="backgroundImage" className="text-sm font-medium text-foreground">{t('tenants.fields.backgroundImage')}</label>
                  <div className={UPLOAD_CARD_CLASSNAME}>
                    <input id="backgroundImage" type="file" accept="image/*" onChange={handleBackgroundChange} className={UPLOAD_INPUT_CLASSNAME} />
                    {backgroundPreviewUrl ? (
                      <img src={backgroundPreviewUrl} alt={t('tenants.form.backgroundImagePreviewAlt')} className={`${UPLOAD_THUMB_CLASSNAME} object-cover`} />
                    ) : (
                      <span className={`${UPLOAD_THUMB_CLASSNAME} text-slate-400`}>
                        <ImageIcon size={16} aria-hidden="true" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{t('tenants.form.uploadCta')}</p>
                      <p className="truncate text-xs text-muted-foreground">{backgroundFile?.name ?? t('tenants.form.backgroundImageHelper')}</p>
                    </div>
                  </div>
                </div>
              </fieldset>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-border px-5 py-4 sm:px-6">
          <p aria-live="polite" className="text-sm text-destructive">
            {errorMessage}
          </p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={handleClose} className={CANCEL_BUTTON_CLASSNAME}>
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="edit-tenant-form"
              disabled={updateTenantMutation.isPending}
              className={SUBMIT_BUTTON_CLASSNAME}
            >
              {updateTenantMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
