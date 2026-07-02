import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import { useAuthStore } from '../store/auth-store';
import { LoginForm } from './LoginForm';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../../../lib/api', () => ({
  api: { post: vi.fn() },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('renders the app name and portfolio notice', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'common.appName' })).toBeInTheDocument();
    expect(screen.getByText('auth.portfolioNotice')).toBeInTheDocument();
  });

  it('logs in as admin and navigates home', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        user: { id: 'demo-admin', name: 'Ana Souza', email: 'admin@velaui.demo', role: 'admin', tenantId: 'tenant-demo' },
      },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.accessAsAdmin' }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@velaui.demo',
      password: 'demo-admin',
    });
    expect(useAuthStore.getState().user).toMatchObject({ id: 'demo-admin', role: 'admin' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('logs in as a regular user and navigates home', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        user: { id: 'demo-user', name: 'Carlos Lima', email: 'user@velaui.demo', role: 'user', tenantId: 'tenant-demo' },
      },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.accessAsUser' }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'user@velaui.demo',
      password: 'demo-user',
    });
    expect(useAuthStore.getState().user).toMatchObject({ id: 'demo-user', role: 'user' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });
});
