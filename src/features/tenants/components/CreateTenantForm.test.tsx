import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateTenantForm } from './CreateTenantForm';

const { mockMutate, mockUseCreateTenant } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseCreateTenant: vi.fn(),
}));

vi.mock('../hooks/use-tenants', () => ({
  useCreateTenant: () => mockUseCreateTenant(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('CreateTenantForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    mockUseCreateTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
  });

  it('renders nothing when closed', () => {
    const { container } = render(<CreateTenantForm isOpen={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog and focuses the name field when opened', async () => {
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'tenants.form.title' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('tenants.fields.name')).toHaveFocus());
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(<CreateTenantForm isOpen onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<CreateTenantForm isOpen={false} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores focus to the previously focused element on close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<CreateTenantForm isOpen onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText('tenants.fields.name')).toHaveFocus());

    rerender(<CreateTenantForm isOpen={false} onClose={vi.fn()} />);
    expect(trigger).toHaveFocus();

    trigger.remove();
  });

  it('does not close when clicking inside the dialog panel', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateTenantForm isOpen onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps Tab focus, wrapping from the last to the first focusable element and back', async () => {
    const user = userEvent.setup();
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

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
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    await expect(user.tab()).resolves.toBeUndefined();

    querySelectorAllSpy.mockRestore();
  });

  it('closes via the close button, the cancel button, and the backdrop', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<CreateTenantForm isOpen onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'common.close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<CreateTenantForm isOpen onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<CreateTenantForm isOpen onClose={onClose} />);
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateTenantForm isOpen onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('auto-fills the slug from the name until the user edits it directly', async () => {
    const user = userEvent.setup();
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    const nameInput = screen.getByLabelText('tenants.fields.name');
    const slugInput = screen.getByLabelText('tenants.fields.slug') as HTMLInputElement;

    await user.type(nameInput, 'Sicredi Corp');
    await waitFor(() => expect(slugInput.value).toBe('sicredi-corp'));

    await user.clear(slugInput);
    await user.type(slugInput, 'custom-slug');
    await user.type(nameInput, ' Ltda');

    expect(slugInput.value).toBe('custom-slug');
  });

  it('shows validation errors when submitting an empty form', async () => {
    const user = userEvent.setup();
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText('tenants.validation.nameTooShort')).toBeInTheDocument();
    expect(screen.getByText('tenants.validation.slugTooShort')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('rejects an invalid primaryColor and logoUrl when provided', async () => {
    const user = userEvent.setup();
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('tenants.fields.name'), 'Sicredi');
    await user.type(screen.getByLabelText('tenants.fields.primaryColor'), 'blue');
    await user.type(screen.getByLabelText('tenants.fields.logoUrl'), 'not-a-url');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText('tenants.validation.primaryColorInvalid')).toBeInTheDocument();
    expect(screen.getByText('tenants.validation.logoUrlInvalid')).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits valid values, converting blank optional fields to undefined, and resets on success', async () => {
    mockMutate.mockImplementation((_values, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<CreateTenantForm isOpen onClose={onClose} />);

    await user.type(screen.getByLabelText('tenants.fields.name'), 'Sicredi');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { name: 'Sicredi', slug: 'sicredi', primaryColor: undefined, logoUrl: undefined },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits the optional fields when provided', async () => {
    mockMutate.mockImplementation((_values, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    await user.type(screen.getByLabelText('tenants.fields.name'), 'Sicredi');
    await user.type(screen.getByLabelText('tenants.fields.primaryColor'), '#32a852');
    await user.type(screen.getByLabelText('tenants.fields.logoUrl'), 'https://example.com/logo.png');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { name: 'Sicredi', slug: 'sicredi', primaryColor: '#32a852', logoUrl: 'https://example.com/logo.png' },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('shows a translated message when the slug is already taken', () => {
    const apiError = new axios.AxiosError('Request failed', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { error: 'A tenant with this slug already exists' },
    });
    mockUseCreateTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: true, error: apiError });
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    expect(screen.getByText('tenants.errors.slugTaken')).toBeInTheDocument();
  });

  it('falls back to a generic error message for an unrecognized failure', () => {
    mockUseCreateTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('network down'),
    });
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    expect(screen.getByText('tenants.form.submitError')).toBeInTheDocument();
  });

  it('disables the submit button and shows the saving label while pending', () => {
    mockUseCreateTenant.mockReturnValue({ mutate: mockMutate, isPending: true, isError: false, error: null });
    render(<CreateTenantForm isOpen onClose={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: 'common.saving' });
    expect(saveButton).toBeDisabled();
  });
});
