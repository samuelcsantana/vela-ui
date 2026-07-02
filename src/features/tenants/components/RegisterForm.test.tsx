import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegisterForm } from './RegisterForm';

const { mockNavigate, mockMutate, mockUseRegisterTenant, mockShowToast, mockChangeLanguage, mockI18n } = vi.hoisted(
  () => ({
    mockNavigate: vi.fn(),
    mockMutate: vi.fn(),
    mockUseRegisterTenant: vi.fn(),
    mockShowToast: vi.fn(),
    mockChangeLanguage: vi.fn(),
    mockI18n: { language: 'en' },
  }),
);

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
    mockI18n.language = 'en';
    mockUseRegisterTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
  });

  it('renders every field', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText('auth.register.companyName')).toBeInTheDocument();
    expect(screen.getByLabelText('auth.register.slug')).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.email')).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.password')).toBeInTheDocument();
  });

  it('renders a language toggle', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    const langButton = screen.getByRole('button', { name: 'Português' });
    await user.click(langButton);

    expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
  });

  it('shows the sandbox portfolio disclaimer', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('note')).toHaveTextContent('auth.register.sandboxNotice');
  });

  it('shows helper text under the company name, slug, and password fields', () => {
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.companyNameHelper')).toBeInTheDocument();
    expect(screen.getByText('auth.register.slugHelper')).toBeInTheDocument();
    expect(screen.getByText('auth.register.passwordHelper')).toBeInTheDocument();
  });

  it('shows no validation errors on initial render, before any interaction', () => {
    render(<RegisterForm />);

    expect(screen.queryByText('auth.validation.companyNameTooShort')).not.toBeInTheDocument();
    expect(screen.queryByText('auth.validation.slugTooShort')).not.toBeInTheDocument();
    expect(screen.queryByText('users.validation.invalidEmail')).not.toBeInTheDocument();
    expect(screen.queryByText('users.validation.passwordTooShort')).not.toBeInTheDocument();
  });

  it('shows the email format error live while typing, without submitting', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('users.fields.email'), 'not-an-email');

    expect(await screen.findByText('users.validation.invalidEmail')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('users.fields.email'), '@vela.com');

    await waitFor(() => expect(screen.queryByText('users.validation.invalidEmail')).not.toBeInTheDocument());
  });

  it('does not leak the company name error onto the untouched slug field while typing', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('auth.register.companyName'), 'A');

    expect(await screen.findByText('auth.validation.companyNameTooShort')).toBeInTheDocument();
    expect(screen.queryByText('auth.validation.slugTooShort')).not.toBeInTheDocument();
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

  const buildApiError = (message: string) =>
    new axios.AxiosError('Request failed', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { error: message },
    });

  it('shows a translated message when the slug is already taken', () => {
    mockUseRegisterTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: buildApiError('A tenant with this slug already exists'),
    });
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.errors.slugTaken')).toBeInTheDocument();
  });

  it('shows a translated message when the email is already registered', () => {
    mockUseRegisterTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: buildApiError('A user with this email already exists'),
    });
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.errors.emailTaken')).toBeInTheDocument();
  });

  it('falls back to a generic translated message for an unrecognized API error', () => {
    mockUseRegisterTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: buildApiError('Something unexpected happened'),
    });
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.submitError')).toBeInTheDocument();
  });

  it('falls back to a generic translated message when the failure has no API error body', () => {
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
