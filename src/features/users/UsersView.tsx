import { useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { CreateUserForm } from './components/CreateUserForm';
import { UserFilters } from './components/UserFilters';
import { UsersTable } from './components/UsersTable';
import { useUsers } from './hooks/use-users';

export const UsersView = () => {
  const { search, page } = useSearch({ from: '/_protected/users' });
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const { data: users, isLoading, isError } = useUsers({ search, page });

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Users</h1>
        <button
          type="button"
          onClick={() => setIsCreateFormOpen(true)}
          className="flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:bg-white dark:text-slate-900 dark:hover:bg-gray-200 dark:focus-visible:outline-white"
        >
          <Plus size={16} aria-hidden="true" />
          Add User
        </button>
      </div>

      <UserFilters />
      <UsersTable users={users} isLoading={isLoading} isError={isError} />

      <CreateUserForm isOpen={isCreateFormOpen} onClose={() => setIsCreateFormOpen(false)} />
    </div>
  );
};
