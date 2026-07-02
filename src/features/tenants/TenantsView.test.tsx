import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantsView } from './TenantsView';

const { mockUseTenants, mockUseDeleteTenant, mockDeleteMutate, mockDeleteReset, mockShowToast, mockUseAuthStore } =
  vi.hoisted(() => ({
    mockUseTenants: vi.fn(),
    mockUseDeleteTenant: vi.fn(),
    mockDeleteMutate: vi.fn(),
    mockDeleteReset: vi.fn(),
    mockShowToast: vi.fn(),
    mockUseAuthStore: vi.fn(),
  }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, options?: Record<string, unknown>) => (options ? `${key}:${JSON.stringify(options)}` : key) }),
}));

vi.mock('./hooks/use-tenants', () => ({
  useTenants: () => mockUseTenants(),
  useDeleteTenant: () => mockUseDeleteTenant(),
}));

vi.mock('../../store/toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mockShowToast }) => unknown) =>
    selector({ showToast: mockShowToast }),
}));

vi.mock('../auth/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { role: string } | null }) => unknown) => mockUseAuthStore(selector),
}));

const MOCK_TENANT = { id: '1', name: 'Vela Corp' };

vi.mock('./components/TenantsTable', () => ({
  TenantsTable: (props: {
    tenants: unknown;
    isLoading: boolean;
    isError: boolean;
    onEdit: (tenant: typeof MOCK_TENANT) => void;
    onDelete?: (tenant: typeof MOCK_TENANT) => void;
  }) => (
    <div
      data-testid="tenants-table-stub"
      data-loading={String(props.isLoading)}
      data-error={String(props.isError)}
      data-tenants={JSON.stringify(props.tenants)}
      data-can-delete={String(Boolean(props.onDelete))}
    >
      <button type="button" onClick={() => props.onEdit(MOCK_TENANT)}>
        edit-first
      </button>
      {props.onDelete ? (
        <button type="button" onClick={() => props.onDelete?.(MOCK_TENANT)}>
          delete-first
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock('./components/CreateTenantForm', () => ({
  CreateTenantForm: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="create-tenant-form-stub">
        <button type="button" onClick={onClose}>
          close
        </button>
      </div>
    ) : null,
}));

vi.mock('./components/EditTenantForm', () => ({
  EditTenantForm: ({ tenant, onClose }: { tenant: typeof MOCK_TENANT | null; onClose: () => void }) =>
    tenant ? (
      <div data-testid="edit-tenant-form-stub" data-tenant={JSON.stringify(tenant)}>
        <button type="button" onClick={onClose}>
          close-edit
        </button>
      </div>
    ) : null,
}));

vi.mock('../../components/ConfirmDialog', () => ({
  ConfirmDialog: (props: {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    errorMessage?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    props.isOpen ? (
      <div
        data-testid="confirm-dialog-stub"
        data-title={props.title}
        data-description={props.description}
        data-confirm-label={props.confirmLabel}
        data-loading={String(props.isLoading)}
        data-error={props.errorMessage ?? ''}
      >
        <button type="button" onClick={props.onConfirm}>
          confirm-delete
        </button>
        <button type="button" onClick={props.onCancel}>
          cancel-delete
        </button>
      </div>
    ) : null,
}));

describe('TenantsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenants.mockReturnValue({ data: [{ id: '1' }], isLoading: false, isError: false });
    mockUseDeleteTenant.mockReturnValue({
      mutate: mockDeleteMutate,
      reset: mockDeleteReset,
      isPending: false,
      isError: false,
      error: null,
    });
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
  });

  it('fetches tenants and forwards the result to the table', () => {
    render(<TenantsView />);

    const table = screen.getByTestId('tenants-table-stub');
    expect(table).toHaveAttribute('data-loading', 'false');
    expect(table).toHaveAttribute('data-error', 'false');
    expect(table).toHaveAttribute('data-tenants', JSON.stringify([{ id: '1' }]));
  });

  it('renders the title and add-tenant button for a VELA_ADMIN', () => {
    render(<TenantsView />);

    expect(screen.getByRole('heading', { name: 'tenants.title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tenants.addTenant' })).toBeInTheDocument();
    expect(screen.getByTestId('tenants-table-stub')).toHaveAttribute('data-can-delete', 'true');
  });

  it('hides the add-tenant button and delete action for a tenant-scoped ADMIN', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'ADMIN' } }));
    render(<TenantsView />);

    expect(screen.queryByRole('button', { name: 'tenants.addTenant' })).not.toBeInTheDocument();
    expect(screen.getByTestId('tenants-table-stub')).toHaveAttribute('data-can-delete', 'false');
  });

  it('opens the create tenant dialog and closes it again', async () => {
    const user = userEvent.setup();
    render(<TenantsView />);

    expect(screen.queryByTestId('create-tenant-form-stub')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'tenants.addTenant' }));
    expect(screen.getByTestId('create-tenant-form-stub')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.queryByTestId('create-tenant-form-stub')).not.toBeInTheDocument();
  });

  it('opens the edit tenant dialog with the selected tenant and closes it again', async () => {
    const user = userEvent.setup();
    render(<TenantsView />);

    expect(screen.queryByTestId('edit-tenant-form-stub')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'edit-first' }));
    const editForm = screen.getByTestId('edit-tenant-form-stub');
    expect(editForm).toHaveAttribute('data-tenant', JSON.stringify(MOCK_TENANT));

    await user.click(screen.getByRole('button', { name: 'close-edit' }));
    expect(screen.queryByTestId('edit-tenant-form-stub')).not.toBeInTheDocument();
  });

  it('opens the delete confirmation dialog for the selected tenant, resetting any previous mutation state', async () => {
    const user = userEvent.setup();
    render(<TenantsView />);

    expect(screen.queryByTestId('confirm-dialog-stub')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'delete-first' }));

    expect(mockDeleteReset).toHaveBeenCalledTimes(1);
    const dialog = screen.getByTestId('confirm-dialog-stub');
    expect(dialog).toHaveAttribute('data-description', `tenants.deleteDialog.description:${JSON.stringify({ name: 'Vela Corp' })}`);
  });

  it('closes the delete dialog without deleting when cancelled, resetting mutation state', async () => {
    const user = userEvent.setup();
    render(<TenantsView />);

    await user.click(screen.getByRole('button', { name: 'delete-first' }));
    mockDeleteReset.mockClear();

    await user.click(screen.getByRole('button', { name: 'cancel-delete' }));

    expect(screen.queryByTestId('confirm-dialog-stub')).not.toBeInTheDocument();
    expect(mockDeleteReset).toHaveBeenCalledTimes(1);
    expect(mockDeleteMutate).not.toHaveBeenCalled();
  });

  it('deletes the tenant, shows a success toast, and closes the dialog on confirm', async () => {
    mockDeleteMutate.mockImplementation((_id, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<TenantsView />);

    await user.click(screen.getByRole('button', { name: 'delete-first' }));
    await user.click(screen.getByRole('button', { name: 'confirm-delete' }));

    expect(mockDeleteMutate).toHaveBeenCalledWith('1', expect.objectContaining({ onSuccess: expect.any(Function) }));
    expect(mockShowToast).toHaveBeenCalledWith('tenants.form.deleteSuccess');
    expect(screen.queryByTestId('confirm-dialog-stub')).not.toBeInTheDocument();
  });

  it('shows the pending state and disables the dialog while deleting', async () => {
    mockUseDeleteTenant.mockReturnValue({
      mutate: mockDeleteMutate,
      reset: mockDeleteReset,
      isPending: true,
      isError: false,
      error: null,
    });
    const user = userEvent.setup();
    render(<TenantsView />);

    await user.click(screen.getByRole('button', { name: 'delete-first' }));

    const dialog = screen.getByTestId('confirm-dialog-stub');
    expect(dialog).toHaveAttribute('data-loading', 'true');
    expect(dialog).toHaveAttribute('data-confirm-label', 'tenants.deleteDialog.confirmPending');
  });

  it('shows a translated error message when the tenant still has users', async () => {
    const apiError = new axios.AxiosError('Request failed', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { error: 'Tenant still has users and cannot be deleted' },
    });
    mockUseDeleteTenant.mockReturnValue({
      mutate: mockDeleteMutate,
      reset: mockDeleteReset,
      isPending: false,
      isError: true,
      error: apiError,
    });
    const user = userEvent.setup();
    render(<TenantsView />);

    await user.click(screen.getByRole('button', { name: 'delete-first' }));

    expect(screen.getByTestId('confirm-dialog-stub')).toHaveAttribute('data-error', 'tenants.errors.hasUsers');
  });

  it('falls back to a generic error message for an unrecognized delete failure', async () => {
    mockUseDeleteTenant.mockReturnValue({
      mutate: mockDeleteMutate,
      reset: mockDeleteReset,
      isPending: false,
      isError: true,
      error: new Error('network down'),
    });
    const user = userEvent.setup();
    render(<TenantsView />);

    await user.click(screen.getByRole('button', { name: 'delete-first' }));

    expect(screen.getByTestId('confirm-dialog-stub')).toHaveAttribute('data-error', 'tenants.form.deleteSubmitError');
  });
});
