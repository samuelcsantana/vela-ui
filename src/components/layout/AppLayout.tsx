import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenantBranding } from '../../features/tenants/hooks/use-tenant-branding';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { t } = useTranslation();
  useTenantBranding();

  return (
    <div className="min-h-screen flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-slate-900 focus:shadow-md focus:outline focus:outline-2 focus:outline-slate-900 dark:focus:bg-slate-800 dark:focus:text-white dark:focus:outline-white"
      >
        {t('common.skipToContent')}
      </a>

      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-1 justify-center bg-background focus:outline-none"
        >
          {children}
        </main>
      </div>
    </div>
  );
};
