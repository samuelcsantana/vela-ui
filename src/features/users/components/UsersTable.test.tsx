import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '../api/users-api';
import { UsersTable } from './UsersTable';

const { mockUseTranslation } = vi.hoisted(() => ({
  mockUseTranslation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
}));

const MOCK_USERS: User[] = [
  {
    id: '1',
    email: 'ana@velaui.demo',
    role: 'ADMIN',
    tenantId: 'tenant-alpha',
    createdAt: '2026-01-15T00:00:00.000Z',
    tenant: { name: 'Vela Corp', slug: 'vela' },
  },
  {
    id: '2',
    email: 'bruno@velaui.demo',
    role: 'MEMBER',
    tenantId: 'tenant-beta',
    createdAt: '2026-02-20T00:00:00.000Z',
    tenant: { name: 'Sicredi', slug: 'sicredi' },
  },
];

describe('UsersTable', () => {
  beforeEach(() => {
    mockUseTranslation.mockReturnValue({ t: (key: string) => key, i18n: { language: 'en' } });
  });

  it('shows a loading status while fetching', () => {
    const onEdit = vi.fn();
    render(<UsersTable users={undefined} isLoading isError={false} showTenantColumn={false} onEdit={onEdit} />);
    expect(screen.getByRole('status')).toHaveTextContent('users.table.loading');
  });

  it('shows an alert when the fetch fails', () => {
    render(<UsersTable users={undefined} isLoading={false} isError showTenantColumn={false} onEdit={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('users.table.error');
  });

  it('shows an empty state when users is undefined', () => {
    render(<UsersTable users={undefined} isLoading={false} isError={false} showTenantColumn={false} onEdit={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('users.table.empty');
  });

  it('shows an empty state when the users list is empty', () => {
    render(<UsersTable users={[]} isLoading={false} isError={false} showTenantColumn={false} onEdit={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('users.table.empty');
  });

  it('renders every user with email, role badge, and formatted join date', () => {
    render(<UsersTable users={MOCK_USERS} isLoading={false} isError={false} showTenantColumn={false} onEdit={vi.fn()} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 users

    expect(screen.getByRole('rowheader', { name: /ana@velaui\.demo/ })).toBeInTheDocument();
    expect(screen.getByText('bruno@velaui.demo')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('MEMBER')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 20, 2026')).toBeInTheDocument();
  });

  it('formats the join date using the active i18n language', () => {
    mockUseTranslation.mockReturnValue({ t: (key: string) => key, i18n: { language: 'pt' } });
    render(<UsersTable users={MOCK_USERS} isLoading={false} isError={false} showTenantColumn={false} onEdit={vi.fn()} />);

    expect(screen.getByText('15 de jan. de 2026')).toBeInTheDocument();
  });

  it('hides the Tenant column and cells when showTenantColumn is false', () => {
    render(<UsersTable users={MOCK_USERS} isLoading={false} isError={false} showTenantColumn={false} onEdit={vi.fn()} />);

    expect(screen.queryByRole('columnheader', { name: 'users.fields.tenant' })).not.toBeInTheDocument();
    expect(screen.queryByText('Vela Corp')).not.toBeInTheDocument();
  });

  it('shows the Tenant column with each user tenant name when showTenantColumn is true', () => {
    render(<UsersTable users={MOCK_USERS} isLoading={false} isError={false} showTenantColumn onEdit={vi.fn()} />);

    expect(screen.getByRole('columnheader', { name: 'users.fields.tenant' })).toBeInTheDocument();
    expect(screen.getByText('Vela Corp')).toBeInTheDocument();
    expect(screen.getByText('Sicredi')).toBeInTheDocument();
  });

  it('shows a distinct badge style for the VELA_ADMIN role', () => {
    const velaAdminUser: User[] = [
      {
        id: '3',
        email: 'root@velaui.demo',
        role: 'VELA_ADMIN',
        tenantId: 'tenant-alpha',
        createdAt: '2026-03-01T00:00:00.000Z',
        tenant: { name: 'Vela Corp', slug: 'vela' },
      },
    ];
    render(<UsersTable users={velaAdminUser} isLoading={false} isError={false} showTenantColumn={false} onEdit={vi.fn()} />);

    expect(screen.getByText('VELA_ADMIN')).toHaveClass('bg-amber-100');
  });

  it('falls back to the default badge style for an unrecognized role', () => {
    // Defensive: casts an out-of-union role to simulate the backend introducing a role
    // this build doesn't know about yet.
    const unknownRoleUser = [
      {
        id: '4',
        email: 'carla@velaui.demo',
        role: 'OWNER',
        tenantId: 'tenant-gamma',
        createdAt: '2026-03-01T00:00:00.000Z',
        tenant: { name: 'Vela Corp', slug: 'vela' },
      },
    ] as unknown as User[];
    render(<UsersTable users={unknownRoleUser} isLoading={false} isError={false} showTenantColumn={false} onEdit={vi.fn()} />);

    expect(screen.getByText('OWNER')).toHaveClass('bg-gray-100');
  });
});
