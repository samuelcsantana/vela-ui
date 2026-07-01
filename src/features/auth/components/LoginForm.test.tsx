import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.accessAsAdmin' }));

    expect(useAuthStore.getState().user).toMatchObject({ id: 'demo-admin', role: 'admin' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('logs in as a regular user and navigates home', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.accessAsUser' }));

    expect(useAuthStore.getState().user).toMatchObject({ id: 'demo-user', role: 'user' });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });
});
