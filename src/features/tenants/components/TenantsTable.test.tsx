import { render, screen } from '@testing-library/react';
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
    render(<TenantsTable tenants={undefined} isLoading isError={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('tenants.table.loading');
  });

  it('shows an alert when the fetch fails', () => {
    render(<TenantsTable tenants={undefined} isLoading={false} isError />);
    expect(screen.getByRole('alert')).toHaveTextContent('tenants.table.error');
  });

  it('shows an empty state when tenants is undefined', () => {
    render(<TenantsTable tenants={undefined} isLoading={false} isError={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('tenants.table.empty');
  });

  it('shows an empty state when the tenants list is empty', () => {
    render(<TenantsTable tenants={[]} isLoading={false} isError={false} />);
    expect(screen.getByRole('status')).toHaveTextContent('tenants.table.empty');
  });

  it('renders every tenant with name, slug, color swatch, and formatted creation date', () => {
    render(<TenantsTable tenants={MOCK_TENANTS} isLoading={false} isError={false} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(3); // header + 2 tenants

    expect(screen.getByRole('rowheader', { name: /Vela Corp/ })).toBeInTheDocument();
    expect(screen.getByText('sicredi')).toBeInTheDocument();
    expect(screen.getByText('#0052cc')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 20, 2026')).toBeInTheDocument();
  });

  it('shows a placeholder dash when the tenant has no primaryColor', () => {
    render(<TenantsTable tenants={MOCK_TENANTS} isLoading={false} isError={false} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
