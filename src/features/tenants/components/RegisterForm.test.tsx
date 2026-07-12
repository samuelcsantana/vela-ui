import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

const {
  mockNavigate,
  mockMutate,
  mockUseJoinTenant,
  mockUsePublicTenants,
  mockShowToast,
  mockChangeLanguage,
  mockI18n,
} = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockMutate: vi.fn(),
  mockUseJoinTenant: vi.fn(),
  mockUsePublicTenants: vi.fn(),
  mockShowToast: vi.fn(),
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

vi.mock('../hooks/use-join-tenant', () => ({
  useJoinTenant: () => mockUseJoinTenant(),
}));

vi.mock('../hooks/use-public-tenants', () => ({
  usePublicTenants: () => mockUsePublicTenants(),
}));

vi.mock('../../../store/toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mockShowToast }) => unknown) =>
    selector({ showToast: mockShowToast }),
}));

const MOCK_PUBLIC_TENANTS = [
  { id: 'tenant-1', name: 'Vela Corp', slug: 'vela' },
  { id: 'tenant-2', name: 'Sicredi', slug: 'sicredi' },
];

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n.language = 'en';
    mockUseJoinTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
    mockUsePublicTenants.mockReturnValue({
      data: MOCK_PUBLIC_TENANTS,
      isLoading: false,
      isError: false,
      isSuccess: true,
    });
  });

  it('renders the sandbox disclaimer and a language toggle', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    expect(screen.getByRole('note')).toHaveTextContent('auth.register.sandboxNotice');

    await user.click(screen.getByRole('button', { name: 'Português' }));
    expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
  });

  it('populates the tenant select from the public tenants list', () => {
    render(<RegisterForm />);

    const select = screen.getByLabelText('auth.register.tenantLabel');
    expect(screen.getByRole('option', { name: 'Vela Corp' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sicredi' })).toBeInTheDocument();
    expect(select).not.toBeDisabled();
  });

  it('disables the tenant select and shows a loading hint while fetching', () => {
    mockUsePublicTenants.mockReturnValue({ data: undefined, isLoading: true, isError: false, isSuccess: false });
    render(<RegisterForm />);

    expect(screen.getByLabelText('auth.register.tenantLabel')).toBeDisabled();
    expect(screen.getByText('auth.register.tenantLoading')).toBeInTheDocument();
  });

  it('shows an alert when the public tenants request fails', () => {
    mockUsePublicTenants.mockReturnValue({ data: undefined, isLoading: false, isError: true, isSuccess: false });
    render(<RegisterForm />);

    expect(screen.getByRole('alert')).toHaveTextContent('auth.register.tenantError');
  });

  it('shows an empty hint when there are no tenants to join', () => {
    mockUsePublicTenants.mockReturnValue({ data: [], isLoading: false, isError: false, isSuccess: true });
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.tenantEmpty')).toBeInTheDocument();
  });

  it('renders the role select defaulting to MEMBER, with an explanatory helper', () => {
    render(<RegisterForm />);

    const roleSelect = screen.getByLabelText<HTMLSelectElement>('auth.register.roleLabel');
    expect(roleSelect.value).toBe('MEMBER');
    expect(screen.getByRole('option', { name: 'ADMIN' })).toBeInTheDocument();
    expect(screen.getByText('auth.register.roleHelper')).toBeInTheDocument();
  });

  it('links back to the login page', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('link', { name: 'auth.register.backToLogin' })).toHaveAttribute('href', '/login');
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: 'auth.register.submit' }));

    expect(await screen.findByText('auth.validation.tenantRequired')).toBeInTheDocument();
    expect(screen.getByText('users.validation.invalidEmail')).toBeInTheDocument();
    expect(screen.getByText('users.validation.passwordTooShort')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits the selected tenant, role, and credentials, then navigates to the tenant login page on success', async () => {
    mockMutate.mockImplementation((_values, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.selectOptions(screen.getByLabelText('auth.register.tenantLabel'), 'tenant-2');
    await user.selectOptions(screen.getByLabelText('auth.register.roleLabel'), 'ADMIN');
    await user.type(screen.getByLabelText('users.fields.email'), 'new@sicredi.com');
    await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'auth.register.submit' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { tenantId: 'tenant-2', role: 'ADMIN', email: 'new@sicredi.com', password: 'secret123' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    expect(mockShowToast).toHaveBeenCalledWith('auth.register.success');
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/$slug/login', params: { slug: 'sicredi' } });
  });

  it('shows a translated message when the email is already registered', () => {
    const apiError = new axios.AxiosError('Request failed', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { error: 'A user with this email already exists' },
    });
    mockUseJoinTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: true, error: apiError });
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.errors.emailTaken')).toBeInTheDocument();
  });

  it('falls back to a generic translated message for an unrecognized failure', () => {
    mockUseJoinTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('network down'),
    });
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.submitError')).toBeInTheDocument();
  });

  it('disables the submit button and shows the submitting label while pending', () => {
    mockUseJoinTenant.mockReturnValue({ mutate: mockMutate, isPending: true, isError: false, error: null });
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: 'auth.register.submitting' });
    expect(submitButton).toBeDisabled();
  });
});
