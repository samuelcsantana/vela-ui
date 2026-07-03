import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateUserForm } from './CreateUserForm';

const { mockMutate, mockUseCreateUser, mockUseAuthStore, mockUseTenants, mockShowToast } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseCreateUser: vi.fn(),
  mockUseAuthStore: vi.fn(),
  mockUseTenants: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('../hooks/use-users', () => ({
  useCreateUser: () => mockUseCreateUser(),
}));

vi.mock('../../auth/store/auth-store', () => ({
  useAuthStore: (selector: (state: { user: { tenantId: string; role: string } | undefined }) => unknown) =>
    mockUseAuthStore(selector),
}));

vi.mock('../../tenants/hooks/use-tenants', () => ({
  useTenants: (options: unknown) => mockUseTenants(options),
}));

vi.mock('../../../store/toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mockShowToast }) => unknown) =>
    selector({ showToast: mockShowToast }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MOCK_TENANTS = [
  { id: 'tenant-alpha', name: 'Vela Corp' },
  { id: 'tenant-beta', name: 'Sicredi' },
];

describe('CreateUserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    mockUseCreateUser.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { tenantId: 'tenant-alpha', role: 'ADMIN' } }));
    mockUseTenants.mockReturnValue({ data: MOCK_TENANTS, isLoading: false, isError: false });
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CreateUserForm isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog and focuses the email field when opened', async () => {
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'users.form.title' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('users.fields.email')).toHaveFocus());
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(<CreateUserForm isOpen onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<CreateUserForm isOpen={false} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores focus to the previously focused element on close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<CreateUserForm isOpen onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText('users.fields.email')).toHaveFocus());

    rerender(<CreateUserForm isOpen={false} onClose={vi.fn()} />);
    expect(trigger).toHaveFocus();

    trigger.remove();
  });

  it('closes via the close button, the cancel button, and the backdrop', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<CreateUserForm isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'common.close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<CreateUserForm isOpen onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<CreateUserForm isOpen onClose={onClose} />);
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close when clicking inside the dialog panel', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus, wrapping from the last to the first focusable element and back', async () => {
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: 'common.save' });
    const closeButton = screen.getByRole('button', { name: 'common.close' });

    saveButton.focus();
    await user.tab();
    expect(closeButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(saveButton).toHaveFocus();
  });

  it('does nothing on Tab when the dialog has no focusable elements', async () => {
    const querySelectorAllSpy = vi.spyOn(Element.prototype, 'querySelectorAll').mockReturnValue([] as never);
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    await expect(user.tab()).resolves.toBeUndefined();

    querySelectorAllSpy.mockRestore();
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText('users.validation.invalidEmail')).toBeInTheDocument();
    expect(screen.getByText('users.validation.passwordTooShort')).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.email')).toHaveAttribute('aria-invalid', 'true');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('does not fetch tenants for a plain ADMIN and hides the tenant select', () => {
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    expect(mockUseTenants).toHaveBeenCalledWith({ enabled: false });
    expect(screen.queryByLabelText('users.fields.tenant')).not.toBeInTheDocument();
  });

  it('submits valid values with the role and the caller own tenantId for a plain ADMIN, and shows a success toast', async () => {
    mockMutate.mockImplementation((_values, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText('users.fields.email'), 'ana@velaui.demo');
    await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
    await user.selectOptions(screen.getByLabelText('users.fields.role'), 'ADMIN');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { email: 'ana@velaui.demo', password: 'secret123', role: 'ADMIN', tenantId: 'tenant-alpha' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    expect(mockShowToast).toHaveBeenCalledWith('users.form.createSuccess');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not submit when the caller has no authenticated tenantId', async () => {
    // Defensive: there is no visible tenant field for a plain ADMIN (its tenantId is
    // always silently filled in), so an unauthenticated edge case simply blocks
    // submission via schema validation with no dedicated error UI to assert on.
    mockUseAuthStore.mockImplementation((selector) => selector({ user: undefined }));
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('users.fields.email'), 'ana@velaui.demo');
    await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(mockMutate).not.toHaveBeenCalled();
  });

  describe('as a VELA_ADMIN', () => {
    beforeEach(() => {
      mockUseAuthStore.mockImplementation((selector) => selector({ user: { tenantId: 'tenant-alpha', role: 'VELA_ADMIN' } }));
    });

    it('fetches the tenant list and shows the tenant select', () => {
      render(<CreateUserForm isOpen onClose={vi.fn()} />);

      expect(mockUseTenants).toHaveBeenCalledWith({ enabled: true });
      expect(screen.getByLabelText('users.fields.tenant')).toBeInTheDocument();
      expect(screen.getByText('Vela Corp')).toBeInTheDocument();
      expect(screen.getByText('Sicredi')).toBeInTheDocument();
    });

    it('shows a loading message and disables the select while tenants are loading', () => {
      mockUseTenants.mockReturnValue({ data: undefined, isLoading: true, isError: false });
      render(<CreateUserForm isOpen onClose={vi.fn()} />);

      expect(screen.getByText('users.form.tenantLoading')).toBeInTheDocument();
      expect(screen.getByLabelText('users.fields.tenant')).toBeDisabled();
    });

    it('shows an error message when the tenant list fails to load', () => {
      mockUseTenants.mockReturnValue({ data: undefined, isLoading: false, isError: true });
      render(<CreateUserForm isOpen onClose={vi.fn()} />);

      expect(screen.getByRole('alert')).toHaveTextContent('users.form.tenantError');
    });

    it('requires a tenant to be selected before submitting', async () => {
      const user = userEvent.setup();
      render(<CreateUserForm isOpen onClose={vi.fn()} />);

      await user.type(screen.getByLabelText('users.fields.email'), 'ana@velaui.demo');
      await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
      await user.click(screen.getByRole('button', { name: 'common.save' }));

      expect(await screen.findByText('users.validation.tenantRequired')).toBeInTheDocument();
      expect(screen.getByLabelText('users.fields.tenant')).toHaveAttribute('aria-invalid', 'true');
      expect(mockMutate).not.toHaveBeenCalled();
    });

    it('submits the selected tenantId and role', async () => {
      mockMutate.mockImplementation((_values, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      });
      const user = userEvent.setup();
      render(<CreateUserForm isOpen onClose={vi.fn()} />);

      await user.type(screen.getByLabelText('users.fields.email'), 'bruno@velaui.demo');
      await user.type(screen.getByLabelText('users.fields.password'), 'secret123');
      await user.selectOptions(screen.getByLabelText('users.fields.role'), 'ADMIN');
      await user.selectOptions(screen.getByLabelText('users.fields.tenant'), 'tenant-beta');
      await user.click(screen.getByRole('button', { name: 'common.save' }));

      await waitFor(() =>
        expect(mockMutate).toHaveBeenCalledWith(
          { email: 'bruno@velaui.demo', password: 'secret123', role: 'ADMIN', tenantId: 'tenant-beta' },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        ),
      );
    });
  });

  it('shows the submit error message when the mutation fails', () => {
    mockUseCreateUser.mockReturnValue({ mutate: mockMutate, isPending: false, isError: true });
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    expect(screen.getByText('users.form.submitError')).toBeInTheDocument();
  });

  it('disables the submit button and shows the saving label while pending', () => {
    mockUseCreateUser.mockReturnValue({ mutate: mockMutate, isPending: true, isError: false });
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: 'common.saving' });
    expect(saveButton).toBeDisabled();
  });
});
