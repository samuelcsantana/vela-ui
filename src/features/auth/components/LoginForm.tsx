import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from '@tanstack/react-router';
import { Layers, LogIn, Palette, Sailboat, ShieldCheck, UserPlus } from 'lucide-react';
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
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15';

const HERO_FEATURES = [
  { icon: ShieldCheck, labelKey: 'auth.hero.features.rbac' },
  { icon: Layers, labelKey: 'auth.hero.features.isolation' },
  { icon: Palette, labelKey: 'auth.hero.features.whiteLabel' },
];

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
    <main className="flex min-h-screen bg-slate-50">
      <section className="relative hidden w-[44%] flex-col justify-between overflow-hidden bg-slate-950 p-10 lg:flex">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_color-mix(in_srgb,var(--tenant-brand)_35%,transparent),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_color-mix(in_srgb,var(--tenant-brand)_25%,transparent),_transparent_60%)]"
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/40">
            <Sailboat size={19} aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">{t('common.appName')}</span>
        </div>

        <div className="relative">
          <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight text-white">
            {t('auth.hero.title')}
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-slate-300">{t('auth.hero.subtitle')}</p>

          <ul className="mt-10 flex flex-col gap-4">
            {HERO_FEATURES.map(({ icon: Icon, labelKey }) => (
              <li key={labelKey} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white ring-1 ring-inset ring-white/15">
                  <Icon size={16} aria-hidden="true" />
                </span>
                {t(labelKey)}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">Vela — multi-tenant SaaS portfolio demo</p>
      </section>

      <div className="relative flex flex-1 items-center justify-center p-6">
        <div className="absolute right-4 top-4 rounded-lg border border-slate-200 bg-white shadow-sm">
          <LanguageToggle className={LIGHT_TOGGLE_CLASSNAME} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <span className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-brand text-white shadow-lg shadow-brand/30 lg:hidden">
              <Sailboat size={22} aria-hidden="true" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{t('common.appName')}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{t('auth.adminPortalNotice')}</p>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
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

            <div className="flex flex-col gap-1.5">
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
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={18} aria-hidden="true" />
              {isPending ? t('auth.loginSubmitting') : t('auth.loginSubmit')}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={() => attemptLogin(DEMO_ADMIN)}
              className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
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

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <Link
            to="/register"
            className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:border-slate-400 hover:bg-slate-100"
          >
            <UserPlus size={18} aria-hidden="true" />
            {t('auth.createUserForTenantLink')}
          </Link>
        </div>
      </div>
    </main>
  );
};
