import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersView } from './UsersView';

const { mockUseSearch, mockUseUsers } = vi.hoisted(() => ({
  mockUseSearch: vi.fn(),
  mockUseUsers: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useSearch: () => mockUseSearch(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./hooks/use-users', () => ({
  useUsers: (args: unknown) => mockUseUsers(args),
}));

vi.mock('./components/UserFilters', () => ({
  UserFilters: () => <div data-testid="user-filters-stub" />,
}));

vi.mock('./components/UsersTable', () => ({
  UsersTable: (props: { users: unknown; isLoading: boolean; isError: boolean }) => (
    <div
      data-testid="users-table-stub"
      data-loading={String(props.isLoading)}
      data-error={String(props.isError)}
      data-users={JSON.stringify(props.users)}
    />
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

describe('UsersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSearch.mockReturnValue({ search: 'ana', page: 2 });
    mockUseUsers.mockReturnValue({ data: [{ id: '1' }], isLoading: false, isError: false });
  });

  it('fetches users using the current search params and forwards the result to the table', () => {
    render(<UsersView />);

    expect(mockUseUsers).toHaveBeenCalledWith({ search: 'ana', page: 2 });
    const table = screen.getByTestId('users-table-stub');
    expect(table).toHaveAttribute('data-loading', 'false');
    expect(table).toHaveAttribute('data-error', 'false');
    expect(table).toHaveAttribute('data-users', JSON.stringify([{ id: '1' }]));
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
});
