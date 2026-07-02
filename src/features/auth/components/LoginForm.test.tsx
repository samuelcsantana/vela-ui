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
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('renders the app name and portfolio notice', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'common.appName' })).toBeInTheDocument();
    expect(screen.getByText('auth.portfolioNotice')).toBeInTheDocument();
  });

  it('logs in as admin and navigates home', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: 'demo-admin', email: 'admin@vela.com', role: 'ADMIN', tenantId: 'tenant-demo' },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.accessAsAdmin' }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@vela.com',
      password: 'admin123',
    });
    expect(useAuthStore.getState().user).toMatchObject({ id: 'demo-admin', role: 'ADMIN' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('logs in as a regular user and navigates home', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: 'demo-user', email: 'guest@vela.com', role: 'MEMBER', tenantId: 'tenant-demo' },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.accessAsUser' }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'guest@vela.com',
      password: 'guest123',
    });
    expect(useAuthStore.getState().user).toMatchObject({ id: 'demo-user', role: 'MEMBER' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('shows an error message and logs to the console when the API call fails', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Request failed with status code 401'));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.accessAsAdmin' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('auth.demoLoginError');
    expect(console.error).toHaveBeenCalledWith('Demo login failed', expect.any(Error));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
