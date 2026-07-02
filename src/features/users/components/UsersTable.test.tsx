import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { User } from '../api/users-api';
import { UsersTable } from './UsersTable';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MOCK_USERS: User[] = [
  { id: '1', email: 'ana@velaui.demo', role: 'ADMIN', tenantId: 'tenant-alpha', createdAt: '2026-01-15T00:00:00.000Z' },
  { id: '2', email: 'bruno@velaui.demo', role: 'MEMBER', tenantId: 'tenant-beta', createdAt: '2026-02-20T00:00:00.000Z' },
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

  it('renders every user with email, role badge, and formatted join date', () => {
    render(<UsersTable users={MOCK_USERS} isLoading={false} isError={false} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 users

    expect(screen.getByRole('rowheader', { name: /ana@velaui\.demo/ })).toBeInTheDocument();
    expect(screen.getByText('bruno@velaui.demo')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 20, 2026')).toBeInTheDocument();
  });

  it('falls back to the default badge style for an unrecognized role', () => {
    const unknownRoleUser: User[] = [
      { id: '3', email: 'carla@velaui.demo', role: 'OWNER', tenantId: 'tenant-gamma', createdAt: '2026-03-01T00:00:00.000Z' },
    ];
    render(<UsersTable users={unknownRoleUser} isLoading={false} isError={false} />);

    expect(screen.getByText('OWNER')).toHaveClass('bg-gray-100');
  });
});
