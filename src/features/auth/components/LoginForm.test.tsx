import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import { useAuthStore } from '../store/auth-store';
import { LoginForm } from './LoginForm';

const { mockNavigate, mockChangeLanguage, mockI18n } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockChangeLanguage: vi.fn(),
  mockI18n: { language: 'en' },
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { ...mockI18n, changeLanguage: mockChangeLanguage },
  }),
}));

vi.mock('../../../lib/api', () => ({
  api: { post: vi.fn() },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockI18n.language = 'en';
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('renders the app name and admin portal notice', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: 'common.appName' })).toBeInTheDocument();
    expect(screen.getByText('auth.adminPortalNotice')).toBeInTheDocument();
  });

  it('renders the email and password fields with a submit button', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('users.fields.email')).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.loginSubmit' })).toBeInTheDocument();
  });

  it('renders a language toggle', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const langButton = screen.getByRole('button', { name: 'Português' });
    await user.click(langButton);

    expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
  });

  it('links to the register page to create a user for an existing tenant', () => {
    render(<LoginForm />);

    expect(screen.getByRole('link', { name: 'auth.createUserForTenantLink' })).toHaveAttribute('href', '/register');
  });

  it('renders only the Access Demo as Admin shortcut, no other demo buttons', () => {
    render(<LoginForm />);

    expect(screen.getByRole('button', { name: 'auth.accessAsAdmin' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'auth.accessAsUser' })).not.toBeInTheDocument();
  });

  it('shows validation errors when submitting the real form empty', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.loginSubmit' }));

    expect(await screen.findByText('users.validation.invalidEmail')).toBeInTheDocument();
    expect(screen.getByText('auth.validation.passwordRequired')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits the typed credentials and navigates home on success', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: 'user-1', email: 'someone@vela.com', role: 'MEMBER', tenantId: 'tenant-demo' },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('users.fields.email'), 'someone@vela.com');
    await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'auth.loginSubmit' }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'someone@vela.com',
      password: 'secret123',
    });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: '/' }));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('shows an error message when the typed credentials are rejected', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Request failed with status code 401'));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('users.fields.email'), 'someone@vela.com');
    await user.type(screen.getByLabelText('users.fields.password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'auth.loginSubmit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('auth.loginError');
    expect(console.error).toHaveBeenCalledWith('Login failed', expect.any(Error));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
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

  it('shows an error message and logs to the console when the demo login fails', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Request failed with status code 401'));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.accessAsAdmin' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('auth.loginError');
    expect(console.error).toHaveBeenCalledWith('Login failed', expect.any(Error));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables the submit and demo buttons while a login attempt is pending', async () => {
    let resolveLogin: (value: { data: unknown }) => void = () => {};
    vi.mocked(api.post).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('users.fields.email'), 'someone@vela.com');
    await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'auth.loginSubmit' }));

    expect(await screen.findByRole('button', { name: 'auth.loginSubmitting' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'auth.accessAsAdmin' })).toBeDisabled();

    resolveLogin({ data: { id: 'user-1', email: 'someone@vela.com', role: 'MEMBER', tenantId: 'tenant-demo' } });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: '/' }));
  });
});
