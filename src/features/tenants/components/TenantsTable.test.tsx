import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Tenant } from '../api/tenants-api';
import { TenantsTable } from './TenantsTable';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MOCK_TENANTS: Tenant[] = [
  { id: '1', slug: 'vela', name: 'Vela Corp', primaryColor: '#0052cc', logoUrl: null, createdAt: '2026-01-15T00:00:00.000Z' },
  { id: '2', slug: 'sicredi', name: 'Sicredi', primaryColor: null, logoUrl: null, createdAt: '2026-02-20T00:00:00.000Z' },
];

describe('TenantsTable', () => {
  it('shows a loading status while fetching', () => {
    render(<TenantsTable tenants={undefined} isLoading isError={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('tenants.table.loading');
  });

  it('shows an alert when the fetch fails', () => {
    render(<TenantsTable tenants={undefined} isLoading={false} isError onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('tenants.table.error');
  });

  it('shows an empty state when tenants is undefined', () => {
    render(<TenantsTable tenants={undefined} isLoading={false} isError={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('tenants.table.empty');
  });

  it('shows an empty state when the tenants list is empty', () => {
    render(<TenantsTable tenants={[]} isLoading={false} isError={false} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('tenants.table.empty');
  });

  it('renders every tenant with name, slug, color swatch, formatted creation date, and edit/delete actions', () => {
    render(<TenantsTable tenants={MOCK_TENANTS} isLoading={false} isError={false} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 tenants

    expect(screen.getByRole('rowheader', { name: /Vela Corp/ })).toBeInTheDocument();
    expect(screen.getByText('sicredi')).toBeInTheDocument();
    expect(screen.getByText('#0052cc')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 20, 2026')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'tenants.editTenant' })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'tenants.deleteTenant' })).toHaveLength(2);
  });

  it('shows a placeholder dash when the tenant has no primaryColor', () => {
    render(<TenantsTable tenants={MOCK_TENANTS} isLoading={false} isError={false} onEdit={vi.fn()} onDelete={vi.fn()} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('calls onEdit with the clicked tenant', async () => {
    const onEdit = vi.fn();
    const user = userEvent.setup();
    render(<TenantsTable tenants={MOCK_TENANTS} isLoading={false} isError={false} onEdit={onEdit} onDelete={vi.fn()} />);

    const editButtons = screen.getAllByRole('button', { name: 'tenants.editTenant' });
    await user.click(editButtons[1]);

    expect(onEdit).toHaveBeenCalledWith(MOCK_TENANTS[1]);
  });

  it('calls onDelete with the clicked tenant', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    render(<TenantsTable tenants={MOCK_TENANTS} isLoading={false} isError={false} onEdit={vi.fn()} onDelete={onDelete} />);

    const deleteButtons = screen.getAllByRole('button', { name: 'tenants.deleteTenant' });
    await user.click(deleteButtons[1]);

    expect(onDelete).toHaveBeenCalledWith(MOCK_TENANTS[1]);
  });
});
