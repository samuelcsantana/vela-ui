import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LanguageToggle, LIGHT_TOGGLE_CLASSNAME } from '../../../components/LanguageToggle';
import { getApiErrorMessage } from '../../../lib/api';
import { useToastStore } from '../../../store/toast-store';
import { usePublicTenants } from '../hooks/use-public-tenants';
import { useJoinTenant } from '../hooks/use-join-tenant';
import { joinTenantSchema, type JoinTenantValues } from '../schema';

const FIELD_CLASSNAME =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15';

const HELPER_TEXT_CLASSNAME = 'text-xs text-muted-foreground';

// The API returns plain-English error strings (see swagger.json), which can't be
// rendered as-is in a localized UI. Known conflicts are mapped to translated
// copy; anything unrecognized falls back to a generic translated message.
const KNOWN_ERROR_KEYS: Record<string, string> = {
  'A user with this email already exists': 'auth.register.errors.emailTaken',
};

const getRegisterErrorKey = (apiMessage: string | undefined): string =>
  (apiMessage && KNOWN_ERROR_KEYS[apiMessage]) || 'auth.register.submitError';

export const RegisterForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const showToast = useToastStore((state) => state.showToast);
  const publicTenantsQuery = usePublicTenants();
  const joinTenantMutation = useJoinTenant();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, dirtyFields, isSubmitted },
  } = useForm<JoinTenantValues>({
    resolver: zodResolver(joinTenantSchema),
    mode: 'onChange',
    defaultValues: { tenantId: '', role: 'MEMBER', email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    // tenantId always comes from an <option> rendered off this same query's cached
    // data, so the matching tenant is always found here.
    const tenant = publicTenantsQuery.data?.find((item) => item.id === values.tenantId);

    joinTenantMutation.mutate(values, {
      onSuccess: () => {
        reset();
        showToast(t('auth.register.success'));
        navigate({ to: '/$slug/login', params: { slug: tenant!.slug } });
      },
    });
  });

  const errorMessage = joinTenantMutation.isError
    ? t(getRegisterErrorKey(getApiErrorMessage(joinTenantMutation.error)))
    : '';

  // A field only shows its error once the user has actually edited it, or after a
  // submit attempt (which must surface every remaining problem regardless of what
  // was touched) — never merely because the resolver validated the whole schema.
  const shouldShowFieldError = (field: keyof JoinTenantValues) => Boolean(dirtyFields[field]) || isSubmitted;

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed right-4 top-4 rounded-lg border border-border bg-card shadow-sm">
        <LanguageToggle className={LIGHT_TOGGLE_CLASSNAME} />
      </div>

      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-foreground">{t('auth.register.title')}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.register.subtitle')}</p>
        </div>

        <div role="note" className="mb-6 flex gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          <Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{t('auth.register.sandboxNotice')}</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label htmlFor="tenantId" className="text-sm font-medium text-foreground">
              {t('auth.register.tenantLabel')}
            </label>
            <select
              id="tenantId"
              aria-invalid={shouldShowFieldError('tenantId') && Boolean(errors.tenantId)}
              aria-describedby={shouldShowFieldError('tenantId') && errors.tenantId ? 'tenantId-error' : undefined}
              className={FIELD_CLASSNAME}
              disabled={publicTenantsQuery.isLoading}
              {...register('tenantId')}
            >
              <option value="">{t('auth.register.tenantPlaceholder')}</option>
              {publicTenantsQuery.data?.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
            {publicTenantsQuery.isLoading ? (
              <p className={HELPER_TEXT_CLASSNAME}>{t('auth.register.tenantLoading')}</p>
            ) : null}
            {publicTenantsQuery.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t('auth.register.tenantError')}
              </p>
            ) : null}
            {publicTenantsQuery.isSuccess && publicTenantsQuery.data.length === 0 ? (
              <p className={HELPER_TEXT_CLASSNAME}>{t('auth.register.tenantEmpty')}</p>
            ) : null}
            <p id="tenantId-error" aria-live="polite" className="text-sm text-destructive">
              {shouldShowFieldError('tenantId') && errors.tenantId?.message ? t(errors.tenantId.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-foreground">
              {t('auth.register.roleLabel')}
            </label>
            <select id="role" className={FIELD_CLASSNAME} {...register('role')}>
              <option value="MEMBER">MEMBER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            <p className={HELPER_TEXT_CLASSNAME}>{t('auth.register.roleHelper')}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {t('users.fields.email')}
            </label>
            <input
              id="email"
              type="email"
              aria-invalid={shouldShowFieldError('email') && Boolean(errors.email)}
              aria-describedby={shouldShowFieldError('email') && errors.email ? 'email-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('email')}
            />
            <p id="email-error" aria-live="polite" className="text-sm text-destructive">
              {shouldShowFieldError('email') && errors.email?.message ? t(errors.email.message) : ''}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {t('users.fields.password')}
            </label>
            <input
              id="password"
              type="password"
              aria-invalid={shouldShowFieldError('password') && Boolean(errors.password)}
              aria-describedby={
                shouldShowFieldError('password') && errors.password ? 'password-helper password-error' : 'password-helper'
              }
              className={FIELD_CLASSNAME}
              {...register('password')}
            />
            <p id="password-helper" className={HELPER_TEXT_CLASSNAME}>
              {t('auth.register.passwordHelper')}
            </p>
            <p id="password-error" aria-live="polite" className="text-sm text-destructive">
              {shouldShowFieldError('password') && errors.password?.message ? t(errors.password.message) : ''}
            </p>
          </div>

          <p aria-live="polite" className="text-sm text-destructive">
            {errorMessage}
          </p>

          <button
            type="submit"
            disabled={joinTenantMutation.isPending}
            className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            {joinTenantMutation.isPending ? t('auth.register.submitting') : t('auth.register.submit')}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-brand hover:underline">
            {t('auth.register.backToLogin')}
          </Link>
        </p>
      </div>
    </main>
  );
};
