import { api } from '../../../lib/api';

// Mirrors the tenant schema in swagger.json exactly.
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  primaryColor: string | null;
  logoUrl: string | null;
  createdAt: string;
}

// GET /api/tenants — authenticated, used by the admin Tenants management view.
export async function fetchTenants(): Promise<Tenant[]> {
  const { data } = await api.get<Tenant[]>('/tenants');
  return data;
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  primaryColor?: string;
  logo?: File;
}

// POST /api/tenants — admin only. multipart/form-data: the logo file (if any) is
// uploaded to S3 server-side, which sets logoUrl on the tenant.
export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const formData = new FormData();
  formData.append('name', input.name);
  formData.append('slug', input.slug);
  if (input.primaryColor) {
    formData.append('primaryColor', input.primaryColor);
  }
  if (input.logo) {
    formData.append('logo', input.logo);
  }

  const { data } = await api.post<Tenant>('/tenants', formData);
  return data;
}

// GET /api/tenants/{slug} — public. Used by the /$slug/login route loader for white-labeling.
export async function fetchTenantBySlug(slug: string): Promise<Tenant> {
  const { data } = await api.get<Tenant>(`/tenants/${slug}`);
  return data;
}

export interface UpdateTenantInput {
  name?: string;
  slug?: string;
  primaryColor?: string;
  logo?: File;
}

// PATCH /api/tenants/{id} — admin only. multipart/form-data; only send fields that
// changed. A new logo file (if any) is uploaded to S3 server-side, replacing logoUrl.
export async function updateTenant(id: string, input: UpdateTenantInput): Promise<Tenant> {
  const formData = new FormData();
  if (input.name !== undefined) {
    formData.append('name', input.name);
  }
  if (input.slug !== undefined) {
    formData.append('slug', input.slug);
  }
  if (input.primaryColor !== undefined) {
    formData.append('primaryColor', input.primaryColor);
  }
  if (input.logo !== undefined) {
    formData.append('logo', input.logo);
  }

  const { data } = await api.patch<Tenant>(`/tenants/${id}`, formData);
  return data;
}

// Only the non-sensitive fields exposed by GET /api/tenants/public.
export interface PublicTenant {
  id: string;
  name: string;
  slug: string;
}

// GET /api/tenants/public — public. Populates the tenant picker on the registration screen.
export async function fetchPublicTenants(): Promise<PublicTenant[]> {
  const { data } = await api.get<PublicTenant[]>('/tenants/public');
  return data;
}

export interface JoinTenantInput {
  tenantId: string;
  role: 'ADMIN' | 'MEMBER';
  email: string;
  password: string;
}

export interface JoinTenantResult {
  id: string;
  email: string;
  role: string;
  tenantId: string;
  createdAt: string;
}

// POST /api/auth/register — public. Joins an existing tenant as a MEMBER; swagger.json
// documents that `role` is accepted but ignored server-side — self-registration can
// never grant ADMIN. Does not log in — callers must POST /auth/login afterwards.
export async function joinTenant(input: JoinTenantInput): Promise<JoinTenantResult> {
  const { data } = await api.post<JoinTenantResult>('/auth/register', input);
  return data;
}
