import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Image as ImageIcon, Palette, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useDialog } from '../../../hooks/use-dialog';
import { getApiErrorMessage } from '../../../lib/api';
import { slugify } from '../../../lib/format';
import { useCreateTenant } from '../hooks/use-tenants';
import { createTenantSchema, HEX_COLOR_REGEX, type CreateTenantValues } from '../schema';
import { DEFAULT_BRAND_COLOR } from '../theme';
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
  SUBMIT_BUTTON_CLASSNAME,
  UPLOAD_CARD_CLASSNAME,
  UPLOAD_INPUT_CLASSNAME,
  UPLOAD_THUMB_CLASSNAME,
} from './tenant-form-styles';

interface CreateTenantFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const DIALOG_TITLE_ID = 'create-tenant-title';

const KNOWN_ERROR_KEYS: Record<string, string> = {
  'A tenant with this slug already exists': 'tenants.errors.slugTaken',
};

const getCreateTenantErrorKey = (apiMessage: string | undefined): string =>
  (apiMessage && KNOWN_ERROR_KEYS[apiMessage]) || 'tenants.form.submitError';

export const CreateTenantForm = ({ isOpen, onClose }: CreateTenantFormProps) => {
  const { t } = useTranslation();
  const createTenantMutation = useCreateTenant();
  const isSlugEdited = useRef(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateTenantValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: { name: '', slug: '', primaryColor: '' },
  });

  const name = watch('name');
  const primaryColor = watch('primaryColor');
  const primaryColorSwatchValue = primaryColor && HEX_COLOR_REGEX.test(primaryColor) ? primaryColor : DEFAULT_BRAND_COLOR;

  useEffect(() => {
    if (isSlugEdited.current) {
      return;
    }

    setValue('slug', slugify(name));
  }, [name, setValue]);

  // Revokes the previous preview URL whenever it changes or the component unmounts.
  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
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

  // Stable identity matters: useDialog re-runs its focus effect when onClose changes,
  // and this component re-renders on every watched keystroke.
  const handleClose = useCallback(() => {
    reset();
    isSlugEdited.current = false;
    setLogoFile(null);
    setLogoPreviewUrl(null);
    onClose();
  }, [reset, onClose]);

  const { dialogRef, overlayProps } = useDialog({
    isOpen,
    onClose: handleClose,
    initialFocus: '#name',
  });

  if (!isOpen) {
    return null;
  }

  const onSubmit = handleSubmit((values) => {
    createTenantMutation.mutate(
      {
        name: values.name,
        slug: values.slug,
        primaryColor: values.primaryColor || undefined,
        logo: logoFile ?? undefined,
      },
      {
        onSuccess: () => {
          reset();
          isSlugEdited.current = false;
          setLogoFile(null);
          setLogoPreviewUrl(null);
          onClose();
        },
      },
    );
  });

  const errorMessage = createTenantMutation.isError
    ? t(getCreateTenantErrorKey(getApiErrorMessage(createTenantMutation.error)))
    : '';

  return (
    <div {...overlayProps} className={DIALOG_OVERLAY_CLASSNAME}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={DIALOG_TITLE_ID}
        className={`${DIALOG_PANEL_CLASSNAME} max-w-lg`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 id={DIALOG_TITLE_ID} className="text-lg font-semibold tracking-tight text-foreground">
              {t('tenants.form.title')}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t('tenants.form.createSubtitle')}</p>
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

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {/* noValidate: zod owns validation, so the translated messages render instead
              of the browser's native constraint bubbles. */}
          <form id="create-tenant-form" onSubmit={onSubmit} noValidate className="flex flex-col divide-y divide-border">
            {/* Identity */}
            <fieldset className={SECTION_CLASSNAME}>
              <legend className={SECTION_LEGEND_CLASSNAME}>
                <span className={SECTION_ICON_CLASSNAME}>
                  <Building2 size={14} aria-hidden="true" />
                </span>
                {t('tenants.form.sections.identity')}
              </legend>
              <div className="flex flex-col gap-1.5">
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

              <div className="flex flex-col gap-1.5">
                <label htmlFor="slug" className="text-sm font-medium text-foreground">
                  {t('tenants.fields.slug')}
                </label>
                <input
                  id="slug"
                  type="text"
                  aria-invalid={Boolean(errors.slug)}
                  aria-describedby={errors.slug ? 'slug-helper slug-error' : 'slug-helper'}
                  className={FIELD_CLASSNAME}
                  {...register('slug', {
                    onChange: () => {
                      isSlugEdited.current = true;
                    },
                  })}
                />
                <p id="slug-helper" className={HELPER_TEXT_CLASSNAME}>
                  {t('tenants.form.slugHelper')}
                </p>
                <p id="slug-error" aria-live="polite" className="text-sm text-destructive">
                  {errors.slug?.message ? t(errors.slug.message) : ''}
                </p>
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
              <div className="flex flex-col gap-1.5">
                <label htmlFor="primaryColor" className="text-sm font-medium text-foreground">
                  {t('tenants.fields.primaryColor')}
                </label>
                <div className={COLOR_CONTROL_CLASSNAME}>
                  <input
                    type="color"
                    aria-label={t('tenants.form.primaryColorPickerLabel')}
                    value={primaryColorSwatchValue}
                    onChange={(event) =>
                      setValue('primaryColor', event.target.value, { shouldValidate: true, shouldDirty: true })
                    }
                    className={COLOR_SWATCH_CLASSNAME}
                  />
                  <input
                    id="primaryColor"
                    type="text"
                    placeholder="#4f46e5"
                    aria-invalid={Boolean(errors.primaryColor)}
                    aria-describedby={
                      errors.primaryColor ? 'primaryColor-helper primaryColor-error' : 'primaryColor-helper'
                    }
                    className={COLOR_TEXT_INPUT_CLASSNAME}
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
            </fieldset>

            {/* Images */}
            <fieldset className={SECTION_CLASSNAME}>
              <legend className={SECTION_LEGEND_CLASSNAME}>
                <span className={SECTION_ICON_CLASSNAME}>
                  <ImageIcon size={14} aria-hidden="true" />
                </span>
                {t('tenants.form.sections.images')}
              </legend>
              <div className="flex flex-col gap-1.5">
                <label htmlFor="logo" className="text-sm font-medium text-foreground">
                  {t('tenants.fields.logo')}
                </label>
                <div className={UPLOAD_CARD_CLASSNAME}>
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className={UPLOAD_INPUT_CLASSNAME}
                  />
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt={t('tenants.form.logoPreviewAlt')}
                      className={`${UPLOAD_THUMB_CLASSNAME} object-contain p-1`}
                    />
                  ) : (
                    <span className={`${UPLOAD_THUMB_CLASSNAME} text-slate-400`}>
                      <ImageIcon size={16} aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t('tenants.form.uploadCta')}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {logoFile?.name ?? t('tenants.form.logoHelper')}
                    </p>
                  </div>
                </div>
              </div>
            </fieldset>
          </form>
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
              form="create-tenant-form"
              disabled={createTenantMutation.isPending}
              className={SUBMIT_BUTTON_CLASSNAME}
            >
              {createTenantMutation.isPending ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
