import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import {
  createTenant,
  deleteTenant,
  fetchPublicTenants,
  fetchTenantBySlug,
  fetchTenants,
  joinTenant,
  updateTenant,
  type PublicTenant,
  type Tenant,
} from './tenants-api';

vi.mock('../../../lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const MOCK_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    slug: 'vela',
    name: 'Vela Corp',
    primaryColor: '#0052cc',
    logoUrl: null,
    backgroundColor: null,
    backgroundImageUrl: null,
    logoWidth: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

const MOCK_PUBLIC_TENANTS: PublicTenant[] = [{ id: 'tenant-1', name: 'Vela Corp', slug: 'vela' }];

function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const result: Record<string, FormDataEntryValue> = {};
  formData.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('fetchTenants', () => {
  it('gets /tenants and returns the response data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: MOCK_TENANTS });

    const tenants = await fetchTenants();

    expect(api.get).toHaveBeenCalledWith('/tenants');
    expect(tenants).toEqual(MOCK_TENANTS);
  });
});

describe('createTenant', () => {
  it('posts /tenants as multipart form data with the given text fields', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    const input = { name: 'Vela Corp', slug: 'vela', primaryColor: '#0052cc' };
    const result = await createTenant(input);

    expect(api.post).toHaveBeenCalledWith('/tenants', expect.any(FormData));
    const sentFormData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(formDataToObject(sentFormData)).toEqual({ name: 'Vela Corp', slug: 'vela', primaryColor: '#0052cc' });
    expect(result).toEqual(MOCK_TENANTS[0]);
  });

  it('appends the logo file when provided', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });
    const logoFile = new File(['fake-image-content'], 'logo.png', { type: 'image/png' });

    await createTenant({ name: 'Vela Corp', slug: 'vela', logo: logoFile });

    const sentFormData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(sentFormData.get('logo')).toBe(logoFile);
  });

  it('omits primaryColor and logo entirely when not provided', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    await createTenant({ name: 'Vela Corp', slug: 'vela' });

    const sentFormData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(sentFormData.has('primaryColor')).toBe(false);
    expect(sentFormData.has('logo')).toBe(false);
  });

  it('appends backgroundColor and logoWidth when provided', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    await createTenant({ name: 'Vela Corp', slug: 'vela', backgroundColor: '#0f172a', logoWidth: 200 });

    const sentFormData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(formDataToObject(sentFormData)).toEqual({
      name: 'Vela Corp',
      slug: 'vela',
      backgroundColor: '#0f172a',
      logoWidth: '200',
    });
  });

  it('appends the backgroundImage file when provided', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });
    const bgFile = new File(['fake-bg'], 'bg.png', { type: 'image/png' });

    await createTenant({ name: 'Vela Corp', slug: 'vela', backgroundImage: bgFile });

    const sentFormData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(sentFormData.get('backgroundImage')).toBe(bgFile);
  });
});

describe('fetchTenantBySlug', () => {
  it('gets /tenants/{slug} and returns the response data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    const tenant = await fetchTenantBySlug('vela');

    expect(api.get).toHaveBeenCalledWith('/tenants/vela');
    expect(tenant).toEqual(MOCK_TENANTS[0]);
  });
});

describe('updateTenant', () => {
  it('patches /tenants/{id} as multipart form data with only the given fields', async () => {
    const updated = { ...MOCK_TENANTS[0], name: 'Vela Corp Updated' };
    vi.mocked(api.patch).mockResolvedValueOnce({ data: updated });

    const result = await updateTenant('tenant-1', { name: 'Vela Corp Updated' });

    expect(api.patch).toHaveBeenCalledWith('/tenants/tenant-1', expect.any(FormData));
    const sentFormData = vi.mocked(api.patch).mock.calls[0][1] as FormData;
    expect(formDataToObject(sentFormData)).toEqual({ name: 'Vela Corp Updated' });
    expect(result).toEqual(updated);
  });

  it('appends the logo file when provided', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });
    const logoFile = new File(['fake-image-content'], 'logo.png', { type: 'image/png' });

    await updateTenant('tenant-1', { logo: logoFile });

    const sentFormData = vi.mocked(api.patch).mock.calls[0][1] as FormData;
    expect(sentFormData.get('logo')).toBe(logoFile);
  });

  it('omits fields that are not provided', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    await updateTenant('tenant-1', { slug: 'vela-updated' });

    const sentFormData = vi.mocked(api.patch).mock.calls[0][1] as FormData;
    expect(formDataToObject(sentFormData)).toEqual({ slug: 'vela-updated' });
  });

  it('appends primaryColor when provided', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    await updateTenant('tenant-1', { primaryColor: '#ff0000' });

    const sentFormData = vi.mocked(api.patch).mock.calls[0][1] as FormData;
    expect(formDataToObject(sentFormData)).toEqual({ primaryColor: '#ff0000' });
  });

  it('appends backgroundColor and logoWidth when provided', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });

    await updateTenant('tenant-1', { backgroundColor: '#0f172a', logoWidth: 200 });

    const sentFormData = vi.mocked(api.patch).mock.calls[0][1] as FormData;
    expect(formDataToObject(sentFormData)).toEqual({ backgroundColor: '#0f172a', logoWidth: '200' });
  });

  it('appends backgroundImage when provided', async () => {
    vi.mocked(api.patch).mockResolvedValueOnce({ data: MOCK_TENANTS[0] });
    const bgFile = new File(['fake-bg'], 'bg.png', { type: 'image/png' });

    await updateTenant('tenant-1', { backgroundImage: bgFile });

    const sentFormData = vi.mocked(api.patch).mock.calls[0][1] as FormData;
    expect(sentFormData.get('backgroundImage')).toBe(bgFile);
  });
});

describe('deleteTenant', () => {
  it('deletes /tenants/{id} with no query string by default', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: 'Tenant deleted' } });

    await deleteTenant('tenant-1');

    expect(api.delete).toHaveBeenCalledWith('/tenants/tenant-1', { params: undefined });
  });

  it('deletes /tenants/{id}?force=true when force is requested', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: 'Tenant deleted' } });

    await deleteTenant('tenant-1', { force: true });

    expect(api.delete).toHaveBeenCalledWith('/tenants/tenant-1', { params: { force: true } });
  });

  it('omits the force param when explicitly false', async () => {
    vi.mocked(api.delete).mockResolvedValueOnce({ data: { message: 'Tenant deleted' } });

    await deleteTenant('tenant-1', { force: false });

    expect(api.delete).toHaveBeenCalledWith('/tenants/tenant-1', { params: undefined });
  });
});

describe('fetchPublicTenants', () => {
  it('gets /tenants/public and returns the response data', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: MOCK_PUBLIC_TENANTS });

    const tenants = await fetchPublicTenants();

    expect(api.get).toHaveBeenCalledWith('/tenants/public');
    expect(tenants).toEqual(MOCK_PUBLIC_TENANTS);
  });
});

describe('joinTenant', () => {
  it('posts /auth/register with the given input and returns the created user', async () => {
    const mockResult = { id: 'user-1', email: 'new@vela.com', role: 'MEMBER', tenantId: 'tenant-1', createdAt: '2026-01-01T00:00:00.000Z' };
    vi.mocked(api.post).mockResolvedValueOnce({ data: mockResult });

    const input = { tenantId: 'tenant-1', role: 'MEMBER' as const, email: 'new@vela.com', password: 'secret123' };
    const result = await joinTenant(input);

    expect(api.post).toHaveBeenCalledWith('/auth/register', input);
    expect(result).toEqual(mockResult);
  });
});
