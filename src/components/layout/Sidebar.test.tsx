import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLayoutStore } from '../../store/layout-store';
import { Sidebar } from './Sidebar';

const { mockUseMediaQuery } = vi.hoisted(() => ({
  mockUseMediaQuery: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    to,
    onClick,
    className,
  }: {
    children: React.ReactNode;
    to: string;
    onClick?: () => void;
    className?: string;
  }) => (
    <a href={to} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../hooks/use-media-query', () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

describe('Sidebar', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false);
    useLayoutStore.setState({ isSidebarOpen: false });
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('renders navigable items as links and the settings item as a disabled button', () => {
    render(<Sidebar />);

    const dashboardLink = screen.getByRole('link', { name: 'sidebar.dashboard' });
    expect(dashboardLink).toHaveAttribute('href', '/');

    const usersLink = screen.getByRole('link', { name: 'sidebar.users' });
    expect(usersLink).toHaveAttribute('href', '/users');

    const tenantsLink = screen.getByRole('link', { name: 'sidebar.tenants' });
    expect(tenantsLink).toHaveAttribute('href', '/tenants');

    const settingsButton = screen.getByRole('button', { name: 'sidebar.settings' });
    expect(settingsButton).toBeDisabled();
  });

  it('shows the collapsed "V" mark when closed and the full brand when open', () => {
    useLayoutStore.setState({ isSidebarOpen: false });
    const { rerender } = render(<Sidebar />);
    expect(screen.getByText('V')).toBeInTheDocument();

    useLayoutStore.setState({ isSidebarOpen: true });
    rerender(<Sidebar />);
    expect(screen.getByText('sidebar.brand')).toBeInTheDocument();
  });

  it('does not render a backdrop while closed, and renders one that closes the sidebar while open', async () => {
    useLayoutStore.setState({ isSidebarOpen: false });
    const { rerender, container } = render(<Sidebar />);
    expect(container.querySelector('div[aria-hidden="true"]')).not.toBeInTheDocument();

    useLayoutStore.setState({ isSidebarOpen: true });
    rerender(<Sidebar />);
    const backdrop = container.querySelector('div[aria-hidden="true"]') as HTMLElement;
    expect(backdrop).toBeInTheDocument();

    await userEvent.setup().click(backdrop);
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
  });

  it('closes the sidebar when Escape is pressed while it is open', async () => {
    useLayoutStore.setState({ isSidebarOpen: true });
    render(<Sidebar />);
    const user = userEvent.setup();

    await user.keyboard('{Escape}');
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
  });

  it('ignores Escape while the sidebar is already closed', async () => {
    useLayoutStore.setState({ isSidebarOpen: false });
    render(<Sidebar />);
    const user = userEvent.setup();

    await user.keyboard('{Escape}');
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
  });

  it('closes the sidebar on nav link click only on mobile viewports', async () => {
    useLayoutStore.setState({ isSidebarOpen: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });
    render(<Sidebar />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('link', { name: 'sidebar.users' }));
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
  });

  it('keeps the sidebar open on nav link click on desktop viewports', async () => {
    useLayoutStore.setState({ isSidebarOpen: true });
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });
    render(<Sidebar />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('link', { name: 'sidebar.users' }));
    expect(useLayoutStore.getState().isSidebarOpen).toBe(true);
  });

  it('marks the nav inert when off-canvas on mobile and closed', () => {
    mockUseMediaQuery.mockReturnValue(true);
    useLayoutStore.setState({ isSidebarOpen: false });
    render(<Sidebar />);

    expect(document.getElementById('app-sidebar')).toHaveAttribute('inert');
  });

  it('does not mark the nav inert when open, even on mobile', () => {
    mockUseMediaQuery.mockReturnValue(true);
    useLayoutStore.setState({ isSidebarOpen: true });
    render(<Sidebar />);

    expect(document.getElementById('app-sidebar')).not.toHaveAttribute('inert');
  });
});
