import { Link, useNavigate } from '@tanstack/react-router';
import { ShieldCheck, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageToggle } from '../../../components/LanguageToggle';
import { useAuthStore, type LoginCredentials } from '../store/auth-store';

const DEMO_ADMIN: LoginCredentials = {
  email: 'admin@vela.com',
  password: 'admin123',
};

const DEMO_USER: LoginCredentials = {
  email: 'guest@vela.com',
  password: 'guest123',
};

const DEMO_BUTTON_CLASSNAME =
  'flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

export const LoginForm = () => {
  const { t } = useTranslation();
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = async (credentials: LoginCredentials) => {
    setError(null);

    try {
      await login(credentials);
      navigate({ to: '/' });
    } catch (err) {
      console.error('Demo login failed', err);
      setError(t('auth.demoLoginError'));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="fixed right-4 top-4 rounded-md border border-slate-200 bg-white shadow-sm">
        <LanguageToggle />
      </div>

      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">{t('common.appName')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('auth.portfolioNotice')}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleDemoLogin(DEMO_ADMIN)}
            className={`${DEMO_BUTTON_CLASSNAME} bg-slate-900 text-white hover:bg-slate-700`}
          >
            <ShieldCheck size={18} aria-hidden="true" />
            {t('auth.accessAsAdmin')}
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin(DEMO_USER)}
            className={`${DEMO_BUTTON_CLASSNAME} border border-slate-300 text-slate-700 hover:bg-slate-100`}
          >
            <UserRound size={18} aria-hidden="true" />
            {t('auth.accessAsUser')}
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-4 text-center text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <p className="mt-4 text-center text-sm text-slate-500">
          <Link to="/register" className="font-medium text-brand hover:underline">
            {t('auth.signUpLink')}
          </Link>
        </p>
      </div>
    </main>
  );
};
