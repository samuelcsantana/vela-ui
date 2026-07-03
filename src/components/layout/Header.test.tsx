import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../lib/api';
import { useAuthStore, type AuthUser } from '../../features/auth/store/auth-store';
import { useLayoutStore } from '../../store/layout-store';
import { useThemeStore } from '../../store/theme-store';
import { Header } from './Header';

const { mockRouterNavigate, mockChangeLanguage, mockI18n, mockUseMediaQuery } = vi.hoisted(() => ({
  mockRouterNavigate: vi.fn(),
  mockChangeLanguage: vi.fn(),
  mockI18n: { language: 'en' },
  mockUseMediaQuery: vi.fn(),
}));

vi.mock('../../lib/api', () => ({
  api: { post: vi.fn() },
}));

vi.mock('../../router', () => ({
  router: { navigate: mockRouterNavigate },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { ...mockI18n, changeLanguage: mockChangeLanguage },
  }),
}));

vi.mock('../../hooks/use-media-query', () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

vi.mock('./Sidebar', () => ({ SIDEBAR_ID: 'app-sidebar' }));

const MOCK_ADMIN: AuthUser = {
  id: 'user-1',
  email: 'ana@velaui.demo',
  role: 'ADMIN',
  tenantId: 'tenant-demo',
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n.language = 'en';
    mockUseMediaQuery.mockReturnValue(false);
    useLayoutStore.setState({ isSidebarOpen: false });
    useThemeStore.setState({ theme: 'system' });
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('toggles the sidebar and exposes its expanded state', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const menuButton = screen.getByRole('button', { name: 'header.toggleSidebar' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-controls', 'app-sidebar');

    await user.click(menuButton);
    expect(useLayoutStore.getState().isSidebarOpen).toBe(true);
  });

  it('shows the target language and switches from English to Portuguese', async () => {
    mockI18n.language = 'en';
    const user = userEvent.setup();
    render(<Header />);

    const langButton = screen.getByRole('button', { name: 'Português' });
    expect(langButton).toHaveTextContent('EN');

    await user.click(langButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
  });

  it('shows the target language and switches from Portuguese to English', async () => {
    mockI18n.language = 'pt';
    const user = userEvent.setup();
    render(<Header />);

    const langButton = screen.getByRole('button', { name: 'English' });
    expect(langButton).toHaveTextContent('PT');

    await user.click(langButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it.each([
    { theme: 'dark' as const, prefersDark: false, expectedDark: true },
    { theme: 'light' as const, prefersDark: true, expectedDark: false },
    { theme: 'system' as const, prefersDark: true, expectedDark: true },
    { theme: 'system' as const, prefersDark: false, expectedDark: false },
  ])(
    'resolves isDark correctly for theme=$theme prefersDark=$prefersDark',
    async ({ theme, prefersDark, expectedDark }) => {
      useThemeStore.setState({ theme });
      mockUseMediaQuery.mockReturnValue(prefersDark);
      const user = userEvent.setup();
      render(<Header />);

      const expectedLabel = expectedDark ? 'header.toggleThemeToLight' : 'header.toggleThemeToDark';
      const themeButton = screen.getByRole('button', { name: expectedLabel });

      await user.click(themeButton);
      expect(useThemeStore.getState().theme).toBe(expectedDark ? 'light' : 'dark');
    },
  );

  it('renders nothing in the user section when logged out', () => {
    render(<Header />);
    expect(screen.queryByRole('button', { name: 'header.logout' })).not.toBeInTheDocument();
  });

  it('shows the user name, role, and logs out on click', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: {} });
    useAuthStore.setState({ user: MOCK_ADMIN, isAuthenticated: true });
    const user = userEvent.setup();
    render(<Header />);

    expect(screen.getByText('ana')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'header.logout' }));

    expect(api.post).toHaveBeenCalledWith('/auth/logout');
    await vi.waitFor(() => expect(mockRouterNavigate).toHaveBeenCalledWith({ to: '/login' }));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
