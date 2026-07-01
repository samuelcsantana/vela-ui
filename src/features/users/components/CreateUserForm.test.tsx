import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateUserForm } from './CreateUserForm';

const { mockMutate, mockUseCreateUser } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseCreateUser: vi.fn(),
}));

vi.mock('../hooks/use-users', () => ({
  useCreateUser: () => mockUseCreateUser(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('CreateUserForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    mockUseCreateUser.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false });
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CreateUserForm isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog and focuses the name field when opened', async () => {
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'users.form.title' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('users.fields.name')).toHaveFocus());
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
    await waitFor(() => expect(screen.getByLabelText('users.fields.name')).toHaveFocus());

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

    expect(await screen.findByText('users.validation.nameTooShort')).toBeInTheDocument();
    expect(screen.getByText('users.validation.invalidEmail')).toBeInTheDocument();
    expect(screen.getByLabelText('users.fields.name')).toHaveAttribute('aria-invalid', 'true');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows a validation error when the role is not one of the allowed values', async () => {
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('users.fields.name'), 'Ana Silva');
    await user.type(screen.getByLabelText('users.fields.email'), 'ana@velaui.demo');
    fireEvent.change(screen.getByLabelText('users.fields.role'), { target: { value: 'not-a-role' } });

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    const roleSelect = screen.getByLabelText('users.fields.role');
    await waitFor(() => expect(roleSelect).toHaveAttribute('aria-invalid', 'true'));
    expect(roleSelect).toHaveAttribute('aria-describedby', 'role-error');
    expect(screen.getByText('users.validation.roleRequired')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits valid values and resets the form on success', async () => {
    mockMutate.mockImplementation((_values, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateUserForm isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText('users.fields.name'), 'Ana Silva');
    await user.type(screen.getByLabelText('users.fields.email'), 'ana@velaui.demo');
    await user.selectOptions(screen.getByLabelText('users.fields.role'), 'admin');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { name: 'Ana Silva', email: 'ana@velaui.demo', role: 'admin' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
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
