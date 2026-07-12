import { zodResolver } from '@hookform/resolvers/zod';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LanguageToggle, LIGHT_TOGGLE_CLASSNAME } from '../../../components/LanguageToggle';
import { TENANT_BRAND_CSS_VAR } from '../../tenants/hooks/use-tenant-branding';
import { DEFAULT_BRAND_COLOR, TENANT_THEME_FALLBACK } from '../../tenants/theme';
import { loginSchema, type LoginValues } from '../schema';
import { useAuthStore } from '../store/auth-store';

const routeApi = getRouteApi('/$slug/login');

const FIELD_CLASSNAME =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15';

export const TenantLoginForm = () => {
  const { tenant } = routeApi.useLoaderData();
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Injects the tenant's brand color before the user ever interacts with the form,
  // so this specific login screen renders white-labeled from first paint.
  useEffect(() => {
    const color = tenant.primaryColor ?? TENANT_THEME_FALLBACK[tenant.slug] ?? DEFAULT_BRAND_COLOR;
    document.documentElement.style.setProperty(TENANT_BRAND_CSS_VAR, color);
  }, [tenant.primaryColor, tenant.slug]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    setIsPending(true);

    try {
      await login(values);
      navigate({ to: '/' });
    } catch (err) {
      console.error('Login failed', err);
      setError(t('auth.loginError'));
    } finally {
      setIsPending(false);
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="fixed right-4 top-4 rounded-lg border border-border bg-card shadow-sm">
        <LanguageToggle className={LIGHT_TOGGLE_CLASSNAME} />
      </div>

      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="mx-auto mb-3 h-10 max-w-full object-contain" />
          ) : (
            <h1 className="text-2xl font-semibold text-foreground">{tenant.name}</h1>
          )}
          <p className="mt-2 text-sm text-muted-foreground">{t('auth.tenantLoginSubtitle')}</p>
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
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
              className={FIELD_CLASSNAME}
              {...register('password')}
            />
            <p id="password-error" aria-live="polite" className="text-sm text-destructive">
              {errors.password?.message ? t(errors.password.message) : ''}
            </p>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} aria-hidden="true" />
            {isPending ? t('auth.loginSubmitting') : t('auth.loginSubmit')}
          </button>
        </form>

        {error ? (
          <p role="alert" className="mt-4 text-center text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
};
