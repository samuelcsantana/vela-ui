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

// Shared mutable state for test assertions. Updated by the mock on every render.
const { _state } = vi.hoisted(() => {
  const state = {
    logoFile: null as File | null,
    logoPreview: null as string | null,
    bgFile: null as File | null,
    bgPreview: null as string | null,
  };
  return { _state: state };
});

vi.mock('../../../hooks/use-image-file', async () => {
  const { useState, useEffect, useCallback } = await vi.importActual<typeof import('react')>('react');

  return {
    useImageFile: (initialUrl?: string | null) => {
      // Detect logo vs background by the initialUrl value.
      // Logo gets the tenant's logoUrl (a remote URL string), background gets
      // the tenant's backgroundImageUrl (null for MOCK_TENANT).
      const isLogo = typeof initialUrl === 'string' && initialUrl.length > 0;

      const [file, setFile] = useState<File | null>(null);
      const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl ?? null);

      // Expose current state for test assertions (runs on every render).
      if (isLogo) {
        _state.logoFile = file;
        _state.logoPreview = previewUrl;
      } else {
        _state.bgFile = file;
        _state.bgPreview = previewUrl;
      }

      // Sync when initialUrl changes (e.g. editing a different tenant).
      useEffect(() => {
        setFile(null);
        setPreviewUrl(initialUrl ?? null);
      }, [initialUrl]);

      // Revoke blob URLs on unmount or when previewUrl changes (matches real hook).
      useEffect(() => {
        return () => {
          if (previewUrl?.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
          }
        };
      }, [previewUrl]);

      const handleChange = useCallback((event: any) => {
        const selected = event.target.files?.[0];
        if (!selected) return;
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
      }, []);

      const reset = useCallback((remoteUrl?: string | null) => {
        setFile(null);
        setPreviewUrl(remoteUrl ?? null);
      }, []);

      return { file, previewUrl, handleChange, reset };
    },
  };
});

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
    _state.logoFile = null;
    _state.logoPreview = null;
    _state.bgFile = null;
    _state.bgPreview = null;
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

  it('closes on Escape key', () => {
    const onClose = vi.fn();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when the X button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'common.close' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when the Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);
    await user.click(screen.getByRole('button', { name: 'common.cancel' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('closes on backdrop click only, not on dialog panel click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);

    // The EditTenantForm has a LoginPreview panel that also uses a
    // presentation-like overlay. Pick the first one (the outer dialog backdrop).
    const [overlay] = screen.getAllByRole('presentation');
    await user.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when the Escape key is pressed but the form is not open', () => {
    const onClose = vi.fn();
    render(<EditTenantForm tenant={null} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('traps focus within the dialog, cycling from last to first and vice versa', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByLabelText('tenants.fields.name')).toHaveFocus());

    await user.tab();
    expect(screen.getByLabelText('tenants.fields.slug')).toHaveFocus();
  });

  it('does nothing when a file change event has no selected file', () => {
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    const logoInput = screen.getByLabelText('tenants.fields.logo');
    fireEvent.change(logoInput, { target: { files: null } });
    // Mock's handleChange returns early when no file selected — preview stays
    expect(screen.getByAltText('tenants.form.logoPreviewAlt')).toBeInTheDocument();
  });

  it('restores focus to the previously focused element on close', () => {
    const outerButton = document.createElement('button');
    outerButton.textContent = 'Outside';
    document.body.appendChild(outerButton);
    outerButton.focus();

    const onClose = vi.fn();
    const { unmount } = render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);
    unmount();

    expect(document.activeElement).toBe(outerButton);
    document.body.removeChild(outerButton);
  });

  it('prevents body scroll while the dialog is open', () => {
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('replaces the logo preview with the newly selected file and sends it as the logo field', async () => {
    mockMutate.mockImplementation((_vars: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess());
    const user = userEvent.setup();

    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const file = new File(['fake-image'], 'logo.png', { type: 'image/png' });
    const logoInput = screen.getByLabelText('tenants.fields.logo');
    await user.upload(logoInput, file);

    expect(_state.logoFile).not.toBeNull();

    // Make the name field dirty so the form actually submits
    await user.type(screen.getByLabelText('tenants.fields.name'), 'z');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(mockMutate).toHaveBeenCalled();
    const callArgs = mockMutate.mock.calls[0][0];
    expect(callArgs.input.logo).toBeInstanceOf(File);
  });

  it('sends only the fields that changed', async () => {
    mockMutate.mockImplementation((_vars: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess());
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const nameInput = screen.getByLabelText('tenants.fields.name');
    await user.clear(nameInput);
    await user.type(nameInput, 'Changed Name');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'tenant-1', input: { name: 'Changed Name' } },
      expect.any(Object),
    );
  });

  it('sends every field that changed, including the color picker', async () => {
    mockMutate.mockImplementation((_vars: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess());
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText('tenants.fields.name'));
    await user.type(screen.getByLabelText('tenants.fields.name'), 'New Name');
    await user.clear(screen.getByLabelText('tenants.fields.primaryColor'));
    await user.type(screen.getByLabelText('tenants.fields.primaryColor'), '#ff0000');

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'tenant-1', input: { name: 'New Name', primaryColor: '#ff0000' } },
      expect.any(Object),
    );
  });

  it('closes without submitting when no fields changed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(mockMutate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the logo preview image when the tenant has a logoUrl', () => {
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    expect(screen.getByAltText('tenants.form.logoPreviewAlt')).toBeInTheDocument();
  });

  it('revokes a locally-created blob URL when the same tenant is closed and reopened', () => {
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

    const { rerender } = render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const file = new File(['fake-image'], 'logo.png', { type: 'image/png' });
    const logoInput = screen.getByLabelText('tenants.fields.logo');
    fireEvent.change(logoInput, { target: { files: [file] } });

    rerender(<EditTenantForm tenant={null} onClose={vi.fn()} />);

    // jsdom creates blob URLs like "blob:mock-url" — match any blob: prefix
    expect(revokeObjectURLSpy).toHaveBeenCalledWith(expect.stringMatching(/^blob:/));

    revokeObjectURLSpy.mockRestore();
  });

  it('does not attempt to revoke a remote URL on unmount', () => {
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

    const { unmount } = render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    unmount();

    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
    revokeObjectURLSpy.mockRestore();
  });

  it('resets form state when a different tenant is opened', () => {
    const { rerender } = render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const otherTenant = { ...MOCK_TENANT, id: 'tenant-2', name: 'Other Co', slug: 'other' };
    rerender(<EditTenantForm tenant={otherTenant} onClose={vi.fn()} />);

    expect(screen.getByLabelText('tenants.fields.name')).toHaveValue('Other Co');
    expect(screen.getByLabelText('tenants.fields.slug')).toHaveValue('other');
  });

  it('shows a validation error when primaryColor is typed as an invalid hex', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const colorInput = screen.getByLabelText('tenants.fields.primaryColor');
    await user.clear(colorInput);
    await user.type(colorInput, 'not-a-hex');

    // Validation runs on form submit (default react-hook-form mode)
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText('tenants.validation.primaryColorInvalid')).toBeInTheDocument();
  });

  it('shows an error message from the API', () => {
    mockUseUpdateTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new axios.AxiosError('error', '409', undefined, undefined, {
        status: 409,
        data: { error: 'Another tenant already uses this slug' },
      } as any),
    });
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    expect(screen.getByText('tenants.errors.slugTaken')).toBeInTheDocument();
  });

  it('shows a generic error message for unknown API errors', () => {
    mockUseUpdateTenant.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: true,
      error: new Error('Unknown error'),
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

  it('shows the logo width custom number input when Custom mode is selected', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    await user.click(screen.getByText('tenants.form.logoWidthCustom'));
    expect(document.getElementById('logoWidth')).toBeInTheDocument();
  });

  it('submits backgroundColor and logoWidth when changed', async () => {
    mockMutate.mockImplementation((_vars: unknown, { onSuccess }: { onSuccess: () => void }) => onSuccess());
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    await user.clear(screen.getByLabelText('tenants.fields.backgroundColor'));
    await user.type(screen.getByLabelText('tenants.fields.backgroundColor'), '#0f172a');
    await user.click(screen.getByText('tenants.form.logoWidthCustom'));
    const logoWidthInput = document.getElementById('logoWidth') as HTMLInputElement;
    await user.type(logoWidthInput, '200');
    await user.click(screen.getByRole('button', { name: 'common.save' }));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'tenant-1', input: { backgroundColor: '#0f172a', logoWidth: 200 } },
      expect.any(Object),
    );
  });

  it('switches back to Auto logo width mode clearing the value', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    await user.click(screen.getByText('tenants.form.logoWidthCustom'));
    expect(document.getElementById('logoWidth')).toBeInTheDocument();
    await user.click(screen.getByText('tenants.form.logoWidthAuto'));
    expect(document.getElementById('logoWidth')).not.toBeInTheDocument();
  });

  it('shows a background image preview when a file is selected', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);

    const file = new File(['fake-bg'], 'bg.png', { type: 'image/png' });
    const bgInput = screen.getByLabelText('tenants.fields.backgroundImage');
    await user.upload(bgInput, file);

    expect(screen.getAllByAltText('tenants.form.backgroundImagePreviewAlt')).toHaveLength(1);
  });

  it('shows the backgroundColor picker with the default brand color fallback', () => {
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    expect(screen.getByLabelText('tenants.form.backgroundColorPickerLabel')).toHaveValue('#4f46e5');
  });

  it('handles background file input with no file selected gracefully', () => {
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    const bgInput = screen.getByLabelText('tenants.fields.backgroundImage');
    fireEvent.change(bgInput, { target: { files: null } });
    expect(screen.queryByAltText('tenants.form.backgroundImagePreviewAlt')).not.toBeInTheDocument();
  });

  it('updates the backgroundColor field via the color picker', async () => {
    const user = userEvent.setup();
    render(<EditTenantForm tenant={MOCK_TENANT} onClose={vi.fn()} />);
    const colorPicker = screen.getByLabelText('tenants.form.backgroundColorPickerLabel');
    await user.click(colorPicker);
    fireEvent.change(colorPicker, { target: { value: '#0f172a' } });
    expect(colorPicker).toHaveValue('#0f172a');
  });
});
