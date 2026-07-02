import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

const { mockNavigate, mockMutate, mockUseRegisterTenant, mockShowToast } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockMutate: vi.fn(),
  mockUseRegisterTenant: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('../hooks/use-register-tenant', () => ({
  useRegisterTenant: () => mockUseRegisterTenant(),
}));

vi.mock('../../../store/toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mockShowToast }) => unknown) =>
    selector({ showToast: mockShowToast }),
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRegisterTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
  });

  it('renders every field', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText('auth.register.companyName')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.register.slug')).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.email')).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.password')).toBeInTheDocument();
  });

  it('links back to the login page', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('link', { name: 'auth.register.backToLogin' })).toHaveAttribute('href', '/login');
  });

  it('auto-fills the slug from the company name until the user edits it directly', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const companyNameInput = screen.getByLabelText('auth.register.companyName');
    const slugInput = screen.getByLabelText('auth.register.slug') as HTMLInputElement;

    await user.type(companyNameInput, 'Minha Empresa');
    await waitFor(() => expect(slugInput.value).toBe('minha-empresa'));

    await user.clear(slugInput);
    await user.type(slugInput, 'custom-slug');
    await user.type(companyNameInput, ' Ltda');

    expect(slugInput.value).toBe('custom-slug');
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: 'auth.register.submit' }));

    expect(await screen.findByText('auth.validation.companyNameTooShort')).toBeInTheDocument();
    expect(screen.getByText('auth.validation.slugTooShort')).toBeInTheDocument();
    expect(screen.getByText('users.validation.invalidEmail')).toBeInTheDocument();
    expect(screen.getByText('users.validation.passwordTooShort')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits valid values, clears the form, shows a toast, and navigates to /login on success', async () => {
    mockMutate.mockImplementation((_values, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<RegisterForm />);

    const companyNameInput = screen.getByLabelText('auth.register.companyName') as HTMLInputElement;
    const slugInput = screen.getByLabelText('auth.register.slug') as HTMLInputElement;
    const emailInput = screen.getByLabelText('users.fields.email') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('users.fields.password') as HTMLInputElement;

    await user.type(companyNameInput, 'Vela Corp');
    await user.type(emailInput, 'admin@vela.com');
    await user.type(passwordInput, 'secret123');
    await user.click(screen.getByRole('button', { name: 'auth.register.submit' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { companyName: 'Vela Corp', slug: 'vela-corp', email: 'admin@vela.com', password: 'secret123' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );

    await waitFor(() => expect(companyNameInput.value).toBe(''));
    expect(slugInput.value).toBe('');
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    expect(mockShowToast).toHaveBeenCalledWith('auth.register.success');
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  it('disables the submit button and shows the submitting label while pending', () => {
    mockUseRegisterTenant.mockReturnValue({ mutate: mockMutate, isPending: true, isError: false, error: null });
    render(<RegisterForm />);

    const submitButton = screen.getByRole('button', { name: 'auth.register.submitting' });
    expect(submitButton).toBeDisabled();
  });

  it("shows the backend's error message when the mutation fails with an API error", () => {
    const apiError = new axios.AxiosError('Request failed', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { error: 'A tenant with this slug already exists' },
    });
    mockUseRegisterTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: true, error: apiError });
    render(<RegisterForm />);

    expect(screen.getByText('A tenant with this slug already exists')).toBeInTheDocument();
  });

  it('falls back to a generic error message when the failure has no API error body', () => {
    mockUseRegisterTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('network down'),
    });
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.submitError')).toBeInTheDocument();
  });
});
