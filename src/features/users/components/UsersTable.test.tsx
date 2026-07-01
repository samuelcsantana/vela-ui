import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../api/mock-api';
import { UsersTable } from './UsersTable';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MOCK_USERS: User[] = [
  { id: '1', name: 'Ana Silva', email: 'ana@velaui.demo', role: 'admin', tenantId: 'tenant-alpha' },
  { id: '2', name: 'Bruno Costa', email: 'bruno@velaui.demo', role: 'editor', tenantId: 'tenant-beta' },
  { id: '3', name: 'Carla Mendes', email: 'carla@velaui.demo', role: 'viewer', tenantId: 'tenant-gamma' },
];

describe('UsersTable', () => {
  it('shows a loading status while fetching', () => {
    render(<UsersTable users={undefined} isLoading isError={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('users.table.loading');
  });

  it('shows an alert when the fetch fails', () => {
    render(<UsersTable users={undefined} isLoading={false} isError />);
    expect(screen.getByRole('alert')).toHaveTextContent('users.table.error');
  });

  it('shows an empty state when users is undefined', () => {
    render(<UsersTable users={undefined} isLoading={false} isError={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('users.table.empty');
  });

  it('shows an empty state when the users list is empty', () => {
    render(<UsersTable users={[]} isLoading={false} isError={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('users.table.empty');
  });

  it('renders every user with the correct role badge', () => {
    render(<UsersTable users={MOCK_USERS} isLoading={false} isError={false} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3 users

    expect(screen.getByRole('rowheader', { name: /Ana Silva/ })).toBeInTheDocument();
    expect(screen.getByText('ana@velaui.demo')).toBeInTheDocument();
    expect(screen.getByText('users.roles.admin')).toBeInTheDocument();
    expect(screen.getByText('users.roles.editor')).toBeInTheDocument();
    expect(screen.getByText('users.roles.viewer')).toBeInTheDocument();
    expect(screen.getByText('tenant-alpha')).toBeInTheDocument();
  });
});
