import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppLayout } from './AppLayout';

const { mockUseTenantBranding } = vi.hoisted(() => ({
  mockUseTenantBranding: vi.fn(),
}));

vi.mock('./Header', () => ({ Header: () => <div data-testid="header-stub" /> }));
vi.mock('./Sidebar', () => ({ Sidebar: () => <div data-testid="sidebar-stub" /> }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('../../features/tenants/hooks/use-tenant-branding', () => ({
  useTenantBranding: () => mockUseTenantBranding(),
}));

describe('AppLayout', () => {
  it('renders the skip link, sidebar, header, and children inside main', () => {
    render(
      <AppLayout>
        <p>Page content</p>
      </AppLayout>,
    );

    const skipLink = screen.getByRole('link', { name: 'common.skipToContent' });
    expect(skipLink).toHaveAttribute('href', '#main-content');

    expect(screen.getByTestId('sidebar-stub')).toBeInTheDocument();
    expect(screen.getByTestId('header-stub')).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    expect(main).toHaveTextContent('Page content');

    expect(mockUseTenantBranding).toHaveBeenCalled();
  });
});
