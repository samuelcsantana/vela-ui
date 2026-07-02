import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreateTenantForm } from './components/CreateTenantForm';
import { TenantsTable } from './components/TenantsTable';
import { useTenants } from './hooks/use-tenants';

export const TenantsView = () => {
  const { t } = useTranslation();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const { data: tenants, isLoading, isError } = useTenants();

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('tenants.title')}</h1>
        <button
          type="button"
          onClick={() => setIsCreateFormOpen(true)}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:focus-visible:outline-white"
        >
          <Plus size={16} aria-hidden="true" />
          {t('tenants.addTenant')}
        </button>
      </div>

      <TenantsTable tenants={tenants} isLoading={isLoading} isError={isError} />

      <CreateTenantForm isOpen={isCreateFormOpen} onClose={() => setIsCreateFormOpen(false)} />
    </div>
  );
};
