import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantsView } from './TenantsView';

const { mockUseTenants } = vi.hoisted(() => ({
  mockUseTenants: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./hooks/use-tenants', () => ({
  useTenants: () => mockUseTenants(),
}));

const MOCK_TENANT = { id: '1', name: 'Vela Corp' };

vi.mock('./components/TenantsTable', () => ({
  TenantsTable: (props: {
    tenants: unknown;
    isLoading: boolean;
    isError: boolean;
    onEdit: (tenant: typeof MOCK_TENANT) => void;
  }) => (
    <div
      data-testid="tenants-table-stub"
      data-loading={String(props.isLoading)}
      data-error={String(props.isError)}
      data-tenants={JSON.stringify(props.tenants)}
    >
      <button type="button" onClick={() => props.onEdit(MOCK_TENANT)}>
        edit-first
      </button>
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

describe('TenantsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTenants.mockReturnValue({ data: [{ id: '1' }], isLoading: false, isError: false });
  });

  it('fetches tenants and forwards the result to the table', () => {
    render(<TenantsView />);

    const table = screen.getByTestId('tenants-table-stub');
    expect(table).toHaveAttribute('data-loading', 'false');
    expect(table).toHaveAttribute('data-error', 'false');
    expect(table).toHaveAttribute('data-tenants', JSON.stringify([{ id: '1' }]));
  });

  it('renders the title and add-tenant button', () => {
    render(<TenantsView />);

    expect(screen.getByRole('heading', { name: 'tenants.title' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'tenants.addTenant' })).toBeInTheDocument();
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
});
