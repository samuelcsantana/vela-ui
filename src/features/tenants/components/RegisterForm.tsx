import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../../../lib/api';
import { slugify } from '../../../lib/format';
import { useToastStore } from '../../../store/toast-store';
import { useRegisterTenant } from '../hooks/use-register-tenant';
import { registerSchema, type RegisterValues } from '../schema';

const FIELD_CLASSNAME =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500';

// The API returns plain-English error strings (see swagger.json), which can't be
// rendered as-is in a localized UI. Known conflicts are mapped to translated
// copy; anything unrecognized falls back to a generic translated message.
const KNOWN_ERROR_KEYS: Record<string, string> = {
  'A tenant with this slug already exists': 'auth.register.errors.slugTaken',
  'A user with this email already exists': 'auth.register.errors.emailTaken',
};

const getRegisterErrorKey = (apiMessage: string | undefined): string =>
  (apiMessage && KNOWN_ERROR_KEYS[apiMessage]) || 'auth.register.submitError';

export const RegisterForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const registerTenantMutation = useRegisterTenant();
  const isSlugEdited = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { companyName: '', slug: '', email: '', password: '' },
  });

  const companyName = watch('companyName');

  useEffect(() => {
    if (isSlugEdited.current) {
      return;
    }

    setValue('slug', slugify(companyName), { shouldValidate: true });
  }, [companyName, setValue]);

  const onSubmit = handleSubmit((values) => {
    registerTenantMutation.mutate(values, {
      onSuccess: () => {
        reset();
        isSlugEdited.current = false;
        showToast(t('auth.register.success'));
        navigate({ to: '/login' });
      },
    });
  });

  const errorMessage = registerTenantMutation.isError
    ? t(getRegisterErrorKey(getApiErrorMessage(registerTenantMutation.error)))
    : '';

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{t('auth.register.title')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('auth.register.subtitle')}</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="companyName" className="text-sm font-medium text-slate-700">
              {t('auth.register.companyName')}
            </label>
            <input
              id="companyName"
              type="text"
              aria-invalid={Boolean(errors.companyName)}
              aria-describedby={errors.companyName ? 'companyName-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('companyName')}
            />
            <p id="companyName-error" aria-live="polite" className="text-sm text-red-600">
              {errors.companyName?.message ? t(errors.companyName.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="slug" className="text-sm font-medium text-slate-700">
              {t('auth.register.slug')}
            </label>
            <input
              id="slug"
              type="text"
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={errors.slug ? 'slug-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('slug', {
                onChange: () => {
                  isSlugEdited.current = true;
                },
              })}
            />
            <p id="slug-error" aria-live="polite" className="text-sm text-red-600">
              {errors.slug?.message ? t(errors.slug.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
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
            <p id="email-error" aria-live="polite" className="text-sm text-red-600">
              {errors.email?.message ? t(errors.email.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
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
            <p id="password-error" aria-live="polite" className="text-sm text-red-600">
              {errors.password?.message ? t(errors.password.message) : ''}
            </p>
          </div>

          <p aria-live="polite" className="text-sm text-red-600">
            {errorMessage}
          </p>

          <button
            type="submit"
            disabled={registerTenantMutation.isPending}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-md bg-brand px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {registerTenantMutation.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/login" className="font-medium text-brand hover:underline">
            {t('auth.register.backToLogin')}
          </Link>
        </p>
      </div>
    </main>
  );
};
