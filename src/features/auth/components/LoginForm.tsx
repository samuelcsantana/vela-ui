import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { LogIn, ShieldCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LanguageToggle, LIGHT_TOGGLE_CLASSNAME } from '../../../components/LanguageToggle';
import { loginSchema, type LoginValues } from '../schema';
import { useAuthStore, type LoginCredentials } from '../store/auth-store';

const DEMO_ADMIN: LoginCredentials = {
  email: 'admin@vela.com',
  password: 'admin123',
};

const FIELD_CLASSNAME =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500';

export const LoginForm = () => {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const attemptLogin = async (credentials: LoginCredentials) => {
    setError(null);
    setIsPending(true);

    try {
      await login(credentials);
      navigate({ to: '/' });
    } catch (err) {
      console.error('Login failed', err);
      setError(t('auth.loginError'));
    } finally {
      setIsPending(false);
    }
  };

  const onSubmit = handleSubmit((values) => attemptLogin(values));

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="fixed right-4 top-4 rounded-md border border-slate-200 bg-white shadow-sm">
        <LanguageToggle className={LIGHT_TOGGLE_CLASSNAME} />
      </div>

      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{t('common.appName')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('auth.adminPortalNotice')}</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
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

          <button
            type="submit"
            disabled={isPending}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={18} aria-hidden="true" />
            {isPending ? t('auth.loginSubmitting') : t('auth.loginSubmit')}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => attemptLogin(DEMO_ADMIN)}
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ShieldCheck size={18} aria-hidden="true" />
            {t('auth.accessAsAdmin')}
          </button>
        </form>

        {error ? (
          <p role="alert" className="mt-4 text-center text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <Link
          to="/register"
          className="mt-4 flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
        >
          <UserPlus size={18} aria-hidden="true" />
          {t('auth.createUserForTenantLink')}
        </Link>
      </div>
    </main>
  );
};
