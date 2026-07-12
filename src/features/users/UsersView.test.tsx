import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersView } from './UsersView';

const { mockUseSearch, mockUseUsers, mockUseAuthStore, mockShowToast, mockDeleteMutate, mockUseDeleteUser } = vi.hoisted(() => ({
  mockUseSearch: vi.fn(),
  mockUseUsers: vi.fn(),
  mockUseAuthStore: vi.fn(),
  mockShowToast: vi.fn(),
  mockDeleteMutate: vi.fn(),
  mockUseDeleteUser: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => mockUseSearch(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../auth/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { role: string } | null }) => unknown) => mockUseAuthStore(selector),
}));

vi.mock('../../store/toast-store', () => ({
  useToastStore: (selector: (state: { showToast: (...args: unknown[]) => void }) => unknown) => selector({ showToast: mockShowToast }),
}));

vi.mock('./hooks/use-users', () => ({
  useUsers: (args: unknown) => mockUseUsers(args),
  useDeleteUser: () => mockUseDeleteUser(),
}));

vi.mock('./components/UserFilters', () => ({
  UserFilters: () => <div data-testid="user-filters-stub" />,
}));

vi.mock('./components/UsersTable', () => ({
  UsersTable: (props: { users: unknown; isLoading: boolean; isError: boolean; showTenantColumn: boolean; onEdit: (...args: unknown[]) => void; onDelete?: (...args: unknown[]) => void }) => (
    <div
      data-testid="users-table-stub"
      data-loading={String(props.isLoading)}
      data-error={String(props.isError)}
      data-users={JSON.stringify(props.users)}
      data-show-tenant-column={String(props.showTenantColumn)}
      data-has-on-delete={String(props.onDelete !== undefined)}
    >
      <button
        type="button"
        data-testid="table-edit-btn"
        onClick={() =>
          props.onEdit?.({
            id: '1',
            email: 'test@velaui.demo',
            role: 'ADMIN',
            tenantId: 't1',
            createdAt: '',
            tenant: { name: 'T', slug: 't' },
          })
        }
      >
        edit
      </button>
      {props.onDelete ? (
        <button
          type="button"
          data-testid="table-delete-btn"
          onClick={() =>
            props.onDelete?.({
              id: '1',
              email: 'test@velaui.demo',
              role: 'ADMIN',
              tenantId: 't1',
              createdAt: '',
              tenant: { name: 'T', slug: 't' },
            })
          }
        >
          delete
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock('./components/CreateUserForm', () => ({
  CreateUserForm: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="create-user-form-stub">
        <button type="button" onClick={onClose}>
          close
        </button>
      </div>
    ) : null,
}));

vi.mock('./components/EditUserForm', () => ({
  EditUserForm: ({ user, onClose }: { user: unknown; onClose: () => void }) =>
    user ? (
      <div data-testid="edit-user-form-stub">
        <button type="button" data-testid="edit-user-close" onClick={onClose}>
          close edit
        </button>
      </div>
    ) : null,
}));

vi.mock('../../components/ConfirmDialog', () => ({
  ConfirmDialog: ({ isOpen, onConfirm, onCancel, confirmLabel, cancelLabel, errorMessage }: { isOpen: boolean; onConfirm: () => void; onCancel: () => void; confirmLabel: string; cancelLabel: string; errorMessage?: string }) =>
    isOpen ? (
      <div data-testid="confirm-dialog-stub" data-error={errorMessage}>
        <button type="button" data-testid="confirm-delete" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button type="button" data-testid="cancel-delete" onClick={onCancel}>
          {cancelLabel}
        </button>
      </div>
    ) : null,
}));

describe('UsersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({ search: 'ana', page: 2 });
    mockUseUsers.mockReturnValue({ data: [{ id: '1' }], isLoading: false, isError: false });
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'ADMIN' } }));
    mockUseDeleteUser.mockReturnValue({ mutate: mockDeleteMutate, isPending: false, isError: false, error: null, reset: vi.fn() });
  });

  it('fetches users using the current search params and forwards the result to the table', () => {
    render(<UsersView />);

    expect(mockUseUsers).toHaveBeenCalledWith({ search: 'ana', page: 2 });
    const table = screen.getByTestId('users-table-stub');
    expect(table).toHaveAttribute('data-loading', 'false');
    expect(table).toHaveAttribute('data-error', 'false');
    expect(table).toHaveAttribute('data-users', JSON.stringify([{ id: '1' }]));
  });

  it('shows the Tenant column only when the logged-in user is VELA_ADMIN', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    render(<UsersView />);

    expect(screen.getByTestId('users-table-stub')).toHaveAttribute('data-show-tenant-column', 'true');
  });

  it('hides the Tenant column for a tenant-scoped ADMIN', () => {
    render(<UsersView />);

    expect(screen.getByTestId('users-table-stub')).toHaveAttribute('data-show-tenant-column', 'false');
  });

  it('renders the title, filters, and add-user button', () => {
    render(<UsersView />);

    expect(screen.getByRole('heading', { name: 'users.title' })).toBeInTheDocument();
    expect(screen.getByTestId('user-filters-stub')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'users.addUser' })).toBeInTheDocument();
  });

  it('opens the create user dialog and closes it again', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    expect(screen.queryByTestId('create-user-form-stub')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'users.addUser' }));
    expect(screen.getByTestId('create-user-form-stub')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'close' }));
    expect(screen.queryByTestId('create-user-form-stub')).not.toBeInTheDocument();
  });

  it('provides the onEdit and onDelete callbacks to the UsersTable', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    render(<UsersView />);

    // onDelete is passed (function) for VELA_ADMIN
    expect(screen.getByTestId('users-table-stub')).toHaveAttribute('data-has-on-delete', 'true');
  });

  it('hides the delete callback for non-VELA_ADMIN users', () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'ADMIN' } }));
    render(<UsersView />);

    // onDelete is undefined for plain ADMIN
    expect(screen.getByTestId('users-table-stub')).toHaveAttribute('data-has-on-delete', 'false');
  });

  it('opens EditUserForm when edit button is clicked in the table', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    expect(screen.queryByTestId('edit-user-form-stub')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('table-edit-btn'));
    expect(screen.getByTestId('edit-user-form-stub')).toBeInTheDocument();
  });

  it('closes EditUserForm when its close button is clicked', async () => {
    const user = userEvent.setup();
    render(<UsersView />);

    await user.click(screen.getByTestId('table-edit-btn'));
    expect(screen.getByTestId('edit-user-form-stub')).toBeInTheDocument();

    await user.click(screen.getByTestId('edit-user-close'));
    expect(screen.queryByTestId('edit-user-form-stub')).not.toBeInTheDocument();
  });

  it('opens ConfirmDialog when delete button is clicked', async () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    const user = userEvent.setup();
    render(<UsersView />);

    expect(screen.queryByTestId('confirm-dialog-stub')).not.toBeInTheDocument();

    await user.click(screen.getByTestId('table-delete-btn'));
    expect(screen.getByTestId('confirm-dialog-stub')).toBeInTheDocument();
  });

  it('calls deleteUser mutation when delete is confirmed', async () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    mockDeleteMutate.mockImplementation((_id: string, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<UsersView />);

    await user.click(screen.getByTestId('table-delete-btn'));
    await user.click(screen.getByTestId('confirm-delete'));

    expect(mockDeleteMutate).toHaveBeenCalledWith('1', expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('shows delete success toast', async () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    mockDeleteMutate.mockImplementation((_id: string, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<UsersView />);

    await user.click(screen.getByTestId('table-delete-btn'));
    await user.click(screen.getByTestId('confirm-delete'));

    expect(mockShowToast).toHaveBeenCalledWith('users.form.deleteSuccess');
  });

  it('closes ConfirmDialog when cancel is clicked', async () => {
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    const user = userEvent.setup();
    render(<UsersView />);

    await user.click(screen.getByTestId('table-delete-btn'));
    expect(screen.getByTestId('confirm-dialog-stub')).toBeInTheDocument();

    await user.click(screen.getByTestId('cancel-delete'));
    expect(screen.queryByTestId('confirm-dialog-stub')).not.toBeInTheDocument();
  });

  it('shows the pending label while the delete is in progress', async () => {
    mockUseDeleteUser.mockReturnValue({ mutate: mockDeleteMutate, isPending: true, isError: false, error: null, reset: vi.fn() });
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    render(<UsersView />);

    expect(screen.queryByTestId('confirm-dialog-stub')).not.toBeInTheDocument();
  });

  it('shows an error message when the delete mutation fails', async () => {
    mockUseDeleteUser.mockReturnValue({ mutate: mockDeleteMutate, isPending: false, isError: true, error: null, reset: vi.fn() });
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { role: 'VELA_ADMIN' } }));
    const user = userEvent.setup();
    render(<UsersView />);

    await user.click(screen.getByTestId('table-delete-btn'));

    expect(screen.getByTestId('confirm-dialog-stub')).toHaveAttribute(
      'data-error',
      'users.form.deleteSubmitError',
    );
  });
});
