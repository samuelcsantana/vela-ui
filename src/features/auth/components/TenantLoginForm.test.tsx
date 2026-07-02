import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import { TENANT_BRAND_CSS_VAR } from '../../tenants/hooks/use-tenant-branding';
import { DEFAULT_BRAND_COLOR } from '../../tenants/theme';
import { useAuthStore } from '../store/auth-store';
import { TenantLoginForm } from './TenantLoginForm';

const { mockUseLoaderData, mockNavigate, mockChangeLanguage, mockI18n } = vi.hoisted(() => ({
  mockUseLoaderData: vi.fn(),
  mockNavigate: vi.fn(),
  mockChangeLanguage: vi.fn(),
  mockI18n: { language: 'en' },
}));

vi.mock('@tanstack/react-router', () => ({
  getRouteApi: () => ({ useLoaderData: mockUseLoaderData }),
  useNavigate: () => mockNavigate,
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

const MOCK_TENANT = {
  id: 'tenant-1',
  slug: 'sicredi',
  name: 'Sicredi',
  primaryColor: '#32a852',
  logoUrl: null as string | null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('TenantLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mockI18n.language = 'en';
    document.documentElement.style.removeProperty(TENANT_BRAND_CSS_VAR);
    mockUseLoaderData.mockReturnValue({ tenant: MOCK_TENANT });
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it("injects the tenant's primaryColor into the brand CSS variable", () => {
    render(<TenantLoginForm />);

    expect(document.documentElement.style.getPropertyValue(TENANT_BRAND_CSS_VAR)).toBe('#32a852');
  });

  it('falls back to the known fallback color by slug when primaryColor is null', () => {
    mockUseLoaderData.mockReturnValue({ tenant: { ...MOCK_TENANT, slug: 'vela', primaryColor: null } });
    render(<TenantLoginForm />);

    expect(document.documentElement.style.getPropertyValue(TENANT_BRAND_CSS_VAR)).toBe('#0052cc');
  });

  it('falls back to the default brand color when primaryColor is null and the slug is unknown', () => {
    mockUseLoaderData.mockReturnValue({ tenant: { ...MOCK_TENANT, slug: 'unknown-co', primaryColor: null } });
    render(<TenantLoginForm />);

    expect(document.documentElement.style.getPropertyValue(TENANT_BRAND_CSS_VAR)).toBe(DEFAULT_BRAND_COLOR);
  });

  it("renders the tenant's name as a heading when there is no logoUrl", () => {
    render(<TenantLoginForm />);

    expect(screen.getByRole('heading', { name: 'Sicredi' })).toBeInTheDocument();
  });

  it('renders the logo image with the tenant name as alt text when logoUrl is present', () => {
    mockUseLoaderData.mockReturnValue({ tenant: { ...MOCK_TENANT, logoUrl: 'https://example.com/logo.png' } });
    render(<TenantLoginForm />);

    expect(screen.queryByRole('heading', { name: 'Sicredi' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Sicredi' })).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('renders the email and password fields with a submit button', () => {
    render(<TenantLoginForm />);

    expect(screen.getByLabelText('users.fields.email')).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'auth.loginSubmit' })).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty', async () => {
    const user = userEvent.setup();
    render(<TenantLoginForm />);

    await user.click(screen.getByRole('button', { name: 'auth.loginSubmit' }));

    expect(await screen.findByText('users.validation.invalidEmail')).toBeInTheDocument();
    expect(screen.getByText('auth.validation.passwordRequired')).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('submits credentials via the standard login action and navigates home on success', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { id: 'user-1', email: 'member@sicredi.com', role: 'MEMBER', tenantId: 'tenant-1' },
    });
    const user = userEvent.setup();
    render(<TenantLoginForm />);

    await user.type(screen.getByLabelText('users.fields.email'), 'member@sicredi.com');
    await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'auth.loginSubmit' }));

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'member@sicredi.com', password: 'secret123' });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: '/' }));
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('shows an error message when the credentials are rejected', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Request failed with status code 401'));
    const user = userEvent.setup();
    render(<TenantLoginForm />);

    await user.type(screen.getByLabelText('users.fields.email'), 'member@sicredi.com');
    await user.type(screen.getByLabelText('users.fields.password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'auth.loginSubmit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('auth.loginError');
    expect(console.error).toHaveBeenCalledWith('Login failed', expect.any(Error));
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('disables the submit button and shows the submitting label while pending', async () => {
    let resolveLogin: (value: { data: unknown }) => void = () => {};
    vi.mocked(api.post).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<TenantLoginForm />);

    await user.type(screen.getByLabelText('users.fields.email'), 'member@sicredi.com');
    await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'auth.loginSubmit' }));

    expect(await screen.findByRole('button', { name: 'auth.loginSubmitting' })).toBeDisabled();

    resolveLogin({ data: { id: 'user-1', email: 'member@sicredi.com', role: 'MEMBER', tenantId: 'tenant-1' } });
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith({ to: '/' }));
  });
});
