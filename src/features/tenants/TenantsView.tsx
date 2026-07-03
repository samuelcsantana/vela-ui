import axios from 'axios';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToastStore } from '../../store/toast-store';
import { useAuthStore } from '../auth/store/auth-store';
import { CreateTenantForm } from './components/CreateTenantForm';
import { EditTenantForm } from './components/EditTenantForm';
import { TenantsTable } from './components/TenantsTable';
import { useDeleteTenant, useTenants } from './hooks/use-tenants';
import type { Tenant } from './api/tenants-api';

// Returns the reported user count when the API refuses to delete a tenant that still
// has users (409 { error: 'TENANT_HAS_USERS', userCount }), or null for any other error.
function getTenantHasUsersCount(error: unknown): number | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) {
    return null;
  }

  const data = error.response.data as { error?: string; userCount?: number };
  return data.error === 'TENANT_HAS_USERS' ? (data.userCount ?? 0) : null;
}

export const TenantsView = () => {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);
  const role = useAuthStore((state) => state.user?.role);
  const isVelaAdmin = role === 'VELA_ADMIN';
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [isForceDeleteModalOpen, setIsForceDeleteModalOpen] = useState(false);
  const [usersToDeleteCount, setUsersToDeleteCount] = useState(0);
  const { data: tenants, isLoading, isError } = useTenants();
  const deleteTenantMutation = useDeleteTenant();

  const openDeleteDialog = (tenant: Tenant) => {
    deleteTenantMutation.reset();
    setDeletingTenant(tenant);
    setIsForceDeleteModalOpen(false);
  };

  const closeDeleteDialogs = () => {
    deleteTenantMutation.reset();
    setDeletingTenant(null);
    setIsForceDeleteModalOpen(false);
  };

  const handleConfirmDelete = () => {
    // Unreachable in practice: onConfirm is only wired up while ConfirmDialog is open,
    // which itself requires deletingTenant to be set. Guards purely for type-narrowing.
    /* v8 ignore next 3 */
    if (!deletingTenant) {
      return;
    }

    deleteTenantMutation.mutate(
      { id: deletingTenant.id },
      {
        onSuccess: () => {
          showToast(t('tenants.form.deleteSuccess'));
          closeDeleteDialogs();
        },
        onError: (error) => {
          const userCount = getTenantHasUsersCount(error);
          if (userCount === null) {
            return;
          }

          // The tenant still has users: skip the generic error toast and escalate to the
          // cascade-delete confirmation instead.
          deleteTenantMutation.reset();
          setUsersToDeleteCount(userCount);
          setIsForceDeleteModalOpen(true);
        },
      },
    );
  };

  const handleConfirmForceDelete = () => {
    /* v8 ignore next 3 */
    if (!deletingTenant) {
      return;
    }

    deleteTenantMutation.mutate(
      { id: deletingTenant.id, force: true },
      {
        onSuccess: () => {
          showToast(t('tenants.form.deleteSuccess'));
          closeDeleteDialogs();
        },
      },
    );
  };

  const deleteErrorMessage = deleteTenantMutation.isError ? t('tenants.form.deleteSubmitError') : '';

  return (
    <div className="flex w-full max-w-4xl flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{t('tenants.title')}</h1>
        {isVelaAdmin ? (
          <button
            type="button"
            onClick={() => setIsCreateFormOpen(true)}
            className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:focus-visible:outline-white"
          >
            <Plus size={16} aria-hidden="true" />
            {t('tenants.addTenant')}
          </button>
        ) : null}
      </div>

      <TenantsTable
        tenants={tenants}
        isLoading={isLoading}
        isError={isError}
        onEdit={setEditingTenant}
        onDelete={isVelaAdmin ? openDeleteDialog : undefined}
      />

      <CreateTenantForm isOpen={isCreateFormOpen} onClose={() => setIsCreateFormOpen(false)} />
      <EditTenantForm tenant={editingTenant} onClose={() => setEditingTenant(null)} />
      <ConfirmDialog
        isOpen={deletingTenant !== null && !isForceDeleteModalOpen}
        title={t('tenants.deleteDialog.title')}
        description={t('tenants.deleteDialog.description', { name: deletingTenant?.name ?? '' })}
        confirmLabel={deleteTenantMutation.isPending ? t('tenants.deleteDialog.confirmPending') : t('tenants.deleteDialog.confirm')}
        cancelLabel={t('common.cancel')}
        isLoading={deleteTenantMutation.isPending}
        isDestructive
        errorMessage={deleteErrorMessage}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialogs}
      />
      <ConfirmDialog
        isOpen={deletingTenant !== null && isForceDeleteModalOpen}
        title={t('tenants.forceDeleteDialog.title')}
        description={t('tenants.forceDeleteDialog.description', { count: usersToDeleteCount })}
        confirmLabel={
          deleteTenantMutation.isPending ? t('tenants.deleteDialog.confirmPending') : t('tenants.forceDeleteDialog.confirm')
        }
        cancelLabel={t('common.cancel')}
        isLoading={deleteTenantMutation.isPending}
        isDestructive
        errorMessage={deleteErrorMessage}
        onConfirm={handleConfirmForceDelete}
        onCancel={closeDeleteDialogs}
      />
    </div>
  );
};
