import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditUserForm } from './EditUserForm';
import type { User } from '../api/users-api';

const { mockMutate, mockUseUpdateUser, mockUseAuthStore, mockUseTenants, mockShowToast } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseUpdateUser: vi.fn(),
  mockUseAuthStore: vi.fn(),
  mockUseTenants: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('../hooks/use-users', () => ({
  useUpdateUser: () => mockUseUpdateUser(),
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

const MOCK_USER: User = {
  id: '1',
  email: 'ana@velaui.demo',
  role: 'ADMIN',
  tenantId: 'tenant-alpha',
  createdAt: '2026-01-15T00:00:00.000Z',
  tenant: { name: 'Vela Corp', slug: 'vela' },
};

const MOCK_TENANTS = [
  { id: 'tenant-alpha', name: 'Vela Corp' },
  { id: 'tenant-beta', name: 'Sicredi' },
];

async function selectOption(user: ReturnType<typeof userEvent.setup>, trigger: HTMLElement, optionName: string) {
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: optionName }));
}

describe('EditUserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    mockUseUpdateUser.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
    mockUseAuthStore.mockImplementation((selector) => selector({ user: { tenantId: 'tenant-alpha', role: 'ADMIN' } }));
    mockUseTenants.mockReturnValue({ data: MOCK_TENANTS, isLoading: false, isError: false });
  });

  it('renders nothing when user is null', () => {
    const { container } = render(<EditUserForm user={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog and pre-fills email, role fields from the user prop', () => {
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'users.form.editTitle' })).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.email')).toHaveValue('ana@velaui.demo');
    expect(screen.getByLabelText('users.fields.role')).toHaveTextContent('ADMIN');
  });

  it('shows tenant select for VELA_ADMIN', async () => {
    mockUseAuthStore.mockImplementation((selector) =>
      selector({ user: { tenantId: 'tenant-alpha', role: 'VELA_ADMIN' } }),
    );
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    expect(mockUseTenants).toHaveBeenCalledWith({ enabled: true });
    expect(screen.getByLabelText('users.fields.tenant')).toBeInTheDocument();

    // Open the select to verify options are present (using role query to avoid
    // matching both the trigger displayed value and the listbox option).
    await user.click(screen.getByLabelText('users.fields.tenant'));
    expect(screen.getByRole('option', { name: 'Vela Corp' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Sicredi' })).toBeInTheDocument();
  });

  it('hides tenant select for non-VELA_ADMIN', () => {
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    expect(screen.queryByLabelText('users.fields.tenant')).not.toBeInTheDocument();
  });

  it('focuses the email field on open', async () => {
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    await waitFor(() => expect(screen.getByLabelText('users.fields.email')).toHaveFocus());
  });

  it('locks body scroll while open and restores on close', () => {
    const { rerender } = render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<EditUserForm user={null} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores focus to the previously focused element on close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText('users.fields.email')).toHaveFocus());

    rerender(<EditUserForm user={null} onClose={vi.fn()} />);
    expect(trigger).toHaveFocus();

    trigger.remove();
  });

  it('closes via the close button, the cancel button, and the backdrop', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<EditUserForm user={MOCK_USER} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'common.close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<EditUserForm user={MOCK_USER} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<EditUserForm user={MOCK_USER} onClose={onClose} />);
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close when clicking inside the dialog panel', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape key', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus, wrapping from the last to the first focusable element and back', async () => {
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

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
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    await expect(user.tab()).resolves.toBeUndefined();

    querySelectorAllSpy.mockRestore();
  });

  it('submits only dirty fields when email is changed', async () => {
    mockMutate.mockImplementation(
      (_variables: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      },
    );
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={onClose} />);

    const emailInput = screen.getByLabelText('users.fields.email');
    await user.clear(emailInput);
    await user.type(emailInput, 'new@velaui.demo');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { id: '1', input: { email: 'new@velaui.demo' } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    expect(mockShowToast).toHaveBeenCalledWith('users.form.editSuccess');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits with password when the password field is changed to a non-empty value', async () => {
    mockMutate.mockImplementation(
      (_variables: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      },
    );
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    // Change email so there's at least one dirty field to trigger submission.
    const emailInput = screen.getByLabelText('users.fields.email');
    await user.clear(emailInput);
    await user.type(emailInput, 'new@velaui.demo');

    // Type a new password.
    await user.type(screen.getByLabelText('users.fields.password'), 'newpass123');

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { id: '1', input: { email: 'new@velaui.demo', password: 'newpass123' } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('does NOT submit password when the field is left empty', async () => {
    mockMutate.mockImplementation(
      (_variables: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      },
    );
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    // Change email so there's at least one dirty field to trigger submission.
    const emailInput = screen.getByLabelText('users.fields.email');
    await user.clear(emailInput);
    await user.type(emailInput, 'new@velaui.demo');

    // Type in password then clear it — field is dirty but value is empty.
    const passwordInput = screen.getByLabelText('users.fields.password');
    await user.type(passwordInput, 'abc');
    await user.clear(passwordInput);

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { id: '1', input: { email: 'new@velaui.demo' } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('shows a success toast on submit', async () => {
    mockMutate.mockImplementation(
      (_variables: unknown, { onSuccess }: { onSuccess: () => void }) => {
        onSuccess();
      },
    );
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    const emailInput = screen.getByLabelText('users.fields.email');
    await user.clear(emailInput);
    await user.type(emailInput, 'edited@velaui.demo');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(mockShowToast).toHaveBeenCalledWith('users.form.editSuccess'));
  });

  it('shows error message when the mutation fails', () => {
    mockUseUpdateUser.mockReturnValue({ mutate: mockMutate, isPending: false, isError: true });
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    expect(screen.getByText('users.form.editSubmitError')).toBeInTheDocument();
  });

  it('disables the submit button and shows the saving label while pending', () => {
    mockUseUpdateUser.mockReturnValue({ mutate: mockMutate, isPending: true, isError: false });
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: 'common.saving' });
    expect(saveButton).toBeDisabled();
  });

  it('does not submit when no fields have been changed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditUserForm user={MOCK_USER} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the password helper text', () => {
    render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

    expect(screen.getByText('users.form.passwordHelper')).toBeInTheDocument();
  });

  describe('as a VELA_ADMIN', () => {
    beforeEach(() => {
      mockUseAuthStore.mockImplementation((selector) =>
        selector({ user: { tenantId: 'tenant-alpha', role: 'VELA_ADMIN' } }),
      );
    });

    it('fetches the tenant list and shows the tenant select', async () => {
      const user = userEvent.setup();
      render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

      expect(mockUseTenants).toHaveBeenCalledWith({ enabled: true });
      expect(screen.getByLabelText('users.fields.tenant')).toBeInTheDocument();

      // Open the select to verify options are present (using role query to avoid
      // matching both the trigger displayed value and the listbox option).
      await user.click(screen.getByLabelText('users.fields.tenant'));
      expect(screen.getByRole('option', { name: 'Vela Corp' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Sicredi' })).toBeInTheDocument();
    });

    it('shows a loading message and disables the select while tenants are loading', () => {
      mockUseTenants.mockReturnValue({ data: undefined, isLoading: true, isError: false });
      render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

      expect(screen.getByText('users.form.tenantLoading')).toBeInTheDocument();
      expect(screen.getByLabelText('users.fields.tenant')).toBeDisabled();
    });

    it('shows an error message when the tenant list fails to load', () => {
      mockUseTenants.mockReturnValue({ data: undefined, isLoading: false, isError: true });
      render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

      expect(screen.getByRole('alert')).toHaveTextContent('users.form.tenantError');
    });

    it('submits the selected tenantId and role when changed', async () => {
      mockMutate.mockImplementation(
        (_variables: unknown, { onSuccess }: { onSuccess: () => void }) => {
          onSuccess();
        },
      );
      const user = userEvent.setup();
      render(<EditUserForm user={MOCK_USER} onClose={vi.fn()} />);

      await selectOption(user, screen.getByLabelText('users.fields.role'), 'MEMBER');
      await selectOption(user, screen.getByLabelText('users.fields.tenant'), 'Sicredi');
      await user.click(screen.getByRole('button', { name: 'common.save' }));

      await waitFor(() =>
        expect(mockMutate).toHaveBeenCalledWith(
          { id: '1', input: { role: 'MEMBER', tenantId: 'tenant-beta' } },
          expect.objectContaining({ onSuccess: expect.any(Function) }),
        ),
      );
    });
  });
});
