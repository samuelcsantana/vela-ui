import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Tenant } from '../api/tenants-api';
import { EditTenantForm } from './EditTenantForm';

const { mockMutate, mockUseUpdateTenant, mockShowToast } = vi.hoisted(() => ({
  mockMutate: vi.fn(),
  mockUseUpdateTenant: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock('../hooks/use-tenants', () => ({
  useUpdateTenant: () => mockUseUpdateTenant(),
}));

vi.mock('../../../store/toast-store', () => ({
  useToastStore: (selector: (state: { showToast: typeof mockShowToast }) => unknown) =>
    selector({ showToast: mockShowToast }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const MOCK_TENANT: Tenant = {
  id: 'tenant-1',
  slug: 'vela',
  name: 'Vela Corp',
  primaryColor: '#0052cc',
  logoUrl: 'https://example.com/logo.png',
  backgroundColor: null,
  backgroundImageUrl: null,
  logoWidth: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('EditTenantForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = '';
    mockUseUpdateTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: false, error: null });
  });

  it('renders nothing when there is no tenant', () => {
    const { container } = render(<EditTenantForm tenant={null} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog, focuses the name field, and pre-fills every field with the tenant data', async () => {
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog', { name: 'tenants.form.editTitle' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('tenants.fields.name')).toHaveFocus());

    expect(screen.getByLabelText('tenants.fields.name')).toHaveValue('Vela Corp');
    expect(screen.getByLabelText('tenants.fields.slug')).toHaveValue('vela');
    expect(screen.getByLabelText('tenants.fields.primaryColor')).toHaveValue('#0052cc');
    expect(screen.getByAltText('tenants.form.logoPreviewAlt')).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('shows no logo preview when the tenant has no logo', () => {
    render(<EditTenantForm tenant={{ ...MOCK_TENANT, logoUrl: null }} onClose={vi.fn()} />);

    expect(screen.queryByAltText('tenants.form.logoPreviewAlt')).not.toBeInTheDocument();
  });

  it('pre-fills the color input with the default brand color when the tenant has none set', () => {
    render(<EditTenantForm tenant={{ ...MOCK_TENANT, primaryColor: null }} onClose={vi.fn()} />);

    expect(screen.getByLabelText('tenants.fields.primaryColor')).toHaveValue('#4f46e5');
  });

  it('locks body scroll while open and restores it on close', () => {
    const { rerender } = render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<EditTenantForm tenant={null} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores focus to the previously focused element on close', async () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();

    const { rerender } = render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText('tenants.fields.name')).toHaveFocus());

    rerender(<EditTenantForm tenant={null} onClose={vi.fn()} />);
    expect(trigger).toHaveFocus();

    trigger.remove();
  });

  it('closes via the close button, the cancel button, and the backdrop', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'common.close' }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);
    await user.click(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close when clicking inside the dialog panel', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);

    await user.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus, wrapping from the last to the first focusable element and back', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

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
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    await expect(user.tab()).resolves.toBeUndefined();

    querySelectorAllSpy.mockRestore();
  });

  it('shows validation errors when name and slug are cleared', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText('tenants.fields.name'));
    await user.clear(screen.getByLabelText('tenants.fields.slug'));
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText('tenants.validation.nameTooShort')).toBeInTheDocument();
    expect(screen.getByText('tenants.validation.slugTooShort')).toBeInTheDocument();
    expect(screen.getByLabelText('tenants.fields.name')).toHaveAttribute('aria-invalid', 'true');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('replaces the logo preview with the newly selected file and sends it as the logo field', async () => {
    mockMutate.mockImplementation((_variables, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const logoFile = new File(['fake-image-content'], 'logo.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('tenants.fields.logo'), logoFile);

    expect(await screen.findByAltText('tenants.form.logoPreviewAlt')).toHaveAttribute('src', 'blob:mock-url');

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'tenant-1', input: { logo: logoFile } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('closes without calling the API when nothing was changed', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends only the fields that changed', async () => {
    mockMutate.mockImplementation((_variables, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);

    const nameInput = screen.getByLabelText('tenants.fields.name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Vela Renamed');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'tenant-1', input: { name: 'Vela Renamed' } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
    expect(mockShowToast).toHaveBeenCalledWith('tenants.form.editSuccess');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('sends every field that changed, including the color picker', async () => {
    mockMutate.mockImplementation((_variables, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const slugInput = screen.getByLabelText('tenants.fields.slug');
    await user.clear(slugInput);
    await user.type(slugInput, 'vela-renamed');
    fireEvent.change(screen.getByLabelText('tenants.fields.primaryColor'), { target: { value: '#ff0000' } });
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'tenant-1', input: { slug: 'vela-renamed', primaryColor: '#ff0000' } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('updates the primary color text field when a color is picked from the swatch', async () => {
    mockMutate.mockImplementation((_variables, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('tenants.form.primaryColorPickerLabel'), { target: { value: '#123456' } });

    expect(screen.getByLabelText('tenants.fields.primaryColor')).toHaveValue('#123456');

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'tenant-1', input: { primaryColor: '#123456' } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('falls back to the default brand color for the swatch preview when the text field holds an invalid hex', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const primaryColorInput = screen.getByLabelText('tenants.fields.primaryColor');
    await user.clear(primaryColorInput);
    await user.type(primaryColorInput, 'not-a-hex');

    expect(screen.getByLabelText('tenants.form.primaryColorPickerLabel')).toHaveValue('#4f46e5');
  });

  it('shows a validation error when primaryColor is typed as an invalid hex', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const primaryColorInput = screen.getByLabelText('tenants.fields.primaryColor');
    await user.clear(primaryColorInput);
    await user.type(primaryColorInput, 'not-a-hex');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText('tenants.validation.primaryColorInvalid')).toBeInTheDocument();
    expect(primaryColorInput).toHaveAttribute('aria-invalid', 'true');
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('sends undefined for primaryColor when it is dirtied and cleared to empty', async () => {
    mockMutate.mockImplementation((_variables, { onSuccess }: { onSuccess: () => void }) => {
      onSuccess();
    });
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText('tenants.fields.primaryColor'));
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() =>
      expect(mockMutate).toHaveBeenCalledWith(
        { id: 'tenant-1', input: { primaryColor: undefined } },
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      ),
    );
  });

  it('does not revoke a remote logo URL on unmount', () => {
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');
    const { unmount } = render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    unmount();

    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
  });

  it('ignores a file input change with no selected file', () => {
    render(<EditTenantForm tenant={{ ...MOCK_TENANT, logoUrl: null }} onClose={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('tenants.fields.logo'), { target: { files: [] } });

    expect(screen.queryByAltText('tenants.form.logoPreviewAlt')).not.toBeInTheDocument();
  });

  it('shows a translated message when the new slug is already taken by another tenant', () => {
    const apiError = new axios.AxiosError('Request failed', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { error: 'Another tenant already uses this slug' },
    });
    mockUseUpdateTenant.mockReturnValue({ mutate: mockMutate, isPending: false, isError: true, error: apiError });
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    expect(screen.getByText('tenants.errors.slugTaken')).toBeInTheDocument();
  });

  it('falls back to a generic translated message for an unrecognized failure', () => {
    mockUseUpdateTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('network down'),
    });
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    expect(screen.getByText('tenants.form.editSubmitError')).toBeInTheDocument();
  });

  it('disables the submit button and shows the saving label while pending', () => {
    mockUseUpdateTenant.mockReturnValue({ mutate: mockMutate, isPending: true, isError: false, error: null });
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const saveButton = screen.getByRole('button', { name: 'common.saving' });
    expect(saveButton).toBeDisabled();
  });
});
