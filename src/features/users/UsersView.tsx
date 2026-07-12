import { useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToastStore } from '../../store/toast-store';
import { useAuthStore } from '../auth/store/auth-store';
import { CreateUserForm } from './components/CreateUserForm';
import { EditUserForm } from './components/EditUserForm';
import { UserFilters } from './components/UserFilters';
import { UsersTable } from './components/UsersTable';
import { useDeleteUser, useUsers } from './hooks/use-users';
import type { User } from './api/users-api';

export const UsersView = () => {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);
  const { search, page } = useSearch({ from: '/_protected/users' });
  const role = useAuthStore((state) => state.user?.role);
  const isVelaAdmin = role === 'VELA_ADMIN';
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const { data: users, isLoading, isError } = useUsers({ search, page });
  const deleteUserMutation = useDeleteUser();

  const openDeleteDialog = (user: User) => {
    deleteUserMutation.reset();
    setDeletingUser(user);
  };

  const closeDeleteDialog = () => {
    deleteUserMutation.reset();
    setDeletingUser(null);
  };

  const handleConfirmDelete = () => {
    // Unreachable in practice: onConfirm is only wired up while ConfirmDialog is open,
    // which itself requires deletingUser to be set. Guard purely for type-narrowing.
    /* v8 ignore next 3 */
    if (!deletingUser) {
      return;
    }

    deleteUserMutation.mutate(deletingUser.id, {
      onSuccess: () => {
        showToast(t('users.form.deleteSuccess'));
        closeDeleteDialog();
      },
    });
  };

  const deleteErrorMessage = deleteUserMutation.isError ? t('users.form.deleteSubmitError') : '';

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('users.title')}</h1>
        <button
          type="button"
          onClick={() => setIsCreateFormOpen(true)}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:opacity-90 hover:shadow-brand/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Plus size={16} aria-hidden="true" />
          {t('users.addUser')}
        </button>
      </div>

      <UserFilters />
      <UsersTable
        users={users}
        isLoading={isLoading}
        isError={isError}
        showTenantColumn={role === 'VELA_ADMIN'}
        onEdit={setEditingUser}
        onDelete={isVelaAdmin ? openDeleteDialog : undefined}
      />

      <CreateUserForm isOpen={isCreateFormOpen} onClose={() => setIsCreateFormOpen(false)} />
      <EditUserForm user={editingUser} onClose={() => setEditingUser(null)} />
      <ConfirmDialog
        isOpen={deletingUser !== null}
        title={t('users.deleteDialog.title')}
        description={t('users.deleteDialog.description', { email: deletingUser?.email ?? '' })}
        confirmLabel={deleteUserMutation.isPending ? t('users.deleteDialog.confirmPending') : t('users.deleteDialog.confirm')}
        cancelLabel={t('common.cancel')}
        isLoading={deleteUserMutation.isPending}
        isDestructive
        errorMessage={deleteErrorMessage}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
};
