import { useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../auth/store/auth-store';
import { CreateUserForm } from './components/CreateUserForm';
import { UserFilters } from './components/UserFilters';
import { UsersTable } from './components/UsersTable';
import { useUsers } from './hooks/use-users';

export const UsersView = () => {
  const { t } = useTranslation();
  const { search, page } = useSearch({ from: '/_protected/users' });
  const role = useAuthStore((state) => state.user?.role);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const { data: users, isLoading, isError } = useUsers({ search, page });

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('users.title')}</h1>
        <button
          type="button"
          onClick={() => setIsCreateFormOpen(true)}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:focus-visible:outline-white"
        >
          <Plus size={16} aria-hidden="true" />
          {t('users.addUser')}
        </button>
      </div>

      <UserFilters />
      <UsersTable users={users} isLoading={isLoading} isError={isError} showTenantColumn={role === 'VELA_ADMIN'} />

      <CreateUserForm isOpen={isCreateFormOpen} onClose={() => setIsCreateFormOpen(false)} />
    </div>
  );
};
