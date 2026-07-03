import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const NotFound = () => {
  const { t } = useTranslation();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">{t('notFound.title')}</h1>
      <p className="text-sm text-slate-500">{t('notFound.message')}</p>
      <Link to="/login" className="mt-2 font-medium text-brand hover:underline">
        {t('notFound.backToLogin')}
      </Link>
    </main>
  );
};
