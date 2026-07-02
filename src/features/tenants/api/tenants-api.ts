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

export interface CreateTenantInput {
  name: string;
  slug: string;
}

export async function createTenant(input: CreateTenantInput): Promise<Tenant> {
  const { data } = await api.post<Tenant>('/tenants', input);
  return data;
}
