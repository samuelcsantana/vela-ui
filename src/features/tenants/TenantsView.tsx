import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getApiErrorMessage } from '../../lib/api';
import { useToastStore } from '../../store/toast-store';
import { useAuthStore } from '../auth/store/auth-store';
import { CreateTenantForm } from './components/CreateTenantForm';
import { EditTenantForm } from './components/EditTenantForm';
import { TenantsTable } from './components/TenantsTable';
import { useDeleteTenant, useTenants } from './hooks/use-tenants';
import type { Tenant } from './api/tenants-api';

const KNOWN_DELETE_ERROR_KEYS: Record<string, string> = {
  'Tenant still has users and cannot be deleted': 'tenants.errors.hasUsers',
};

const getDeleteTenantErrorKey = (apiMessage: string | undefined): string =>
  (apiMessage && KNOWN_DELETE_ERROR_KEYS[apiMessage]) || 'tenants.form.deleteSubmitError';

export const TenantsView = () => {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);
  const role = useAuthStore((state) => state.user?.role);
  const isVelaAdmin = role === 'VELA_ADMIN';
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const { data: tenants, isLoading, isError } = useTenants();
  const deleteTenantMutation = useDeleteTenant();

  const openDeleteDialog = (tenant: Tenant) => {
    deleteTenantMutation.reset();
    setDeletingTenant(tenant);
  };

  const closeDeleteDialog = () => {
    deleteTenantMutation.reset();
    setDeletingTenant(null);
  };

  const handleConfirmDelete = () => {
    // Unreachable in practice: onConfirm is only wired up while ConfirmDialog is open,
    // which itself requires deletingTenant to be set. Guards purely for type-narrowing.
    /* v8 ignore next 3 */
    if (!deletingTenant) {
      return;
    }

    deleteTenantMutation.mutate(deletingTenant.id, {
      onSuccess: () => {
        showToast(t('tenants.form.deleteSuccess'));
        setDeletingTenant(null);
      },
    });
  };

  const deleteErrorMessage = deleteTenantMutation.isError
    ? t(getDeleteTenantErrorKey(getApiErrorMessage(deleteTenantMutation.error)))
    : '';

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
        isOpen={deletingTenant !== null}
        title={t('tenants.deleteDialog.title')}
        description={t('tenants.deleteDialog.description', { name: deletingTenant?.name ?? '' })}
        confirmLabel={deleteTenantMutation.isPending ? t('tenants.deleteDialog.confirmPending') : t('tenants.deleteDialog.confirm')}
        cancelLabel={t('common.cancel')}
        isLoading={deleteTenantMutation.isPending}
        isDestructive
        errorMessage={deleteErrorMessage}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteDialog}
      />
    </div>
  );
};
