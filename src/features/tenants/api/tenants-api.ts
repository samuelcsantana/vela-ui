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

export async function fetchTenants(): Promise<Tenant[]> {
  const { data } = await api.get<Tenant[]>('/tenants');
  return data;
}

export interface RegisterTenantInput {
  companyName: string;
  slug: string;
  email: string;
  password: string;
}

export interface RegisterTenantResult {
  tenantId: string;
  userId: string;
}

// Public. Creates the Tenant and its first ADMIN user in a single backend transaction.
// Does not log the user in — callers must POST /auth/login afterwards.
export async function registerTenant(input: RegisterTenantInput): Promise<RegisterTenantResult> {
  const { data } = await api.post<RegisterTenantResult>('/auth/register', input);
  return data;
}
