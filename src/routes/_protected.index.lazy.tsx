import { createLazyFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

export const Route = createLazyFileRoute('/_protected/')({
  component: IndexComponent,
});

function IndexComponent() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        {t('dashboard.welcome', { appName: t('common.appName') })}
      </h1>
      <p className="text-slate-500 dark:text-gray-400">{t('dashboard.subtitle')}</p>
    </div>
  );
}
