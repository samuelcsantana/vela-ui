import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { fetchPublicTenants, type PublicTenant } from '../api/tenants-api';

const PUBLIC_TENANTS_QUERY_KEY = ['tenants', 'public'] as const;

export function usePublicTenants(): UseQueryResult<PublicTenant[], Error> {
  return useQuery({
    queryKey: PUBLIC_TENANTS_QUERY_KEY,
    queryFn: fetchPublicTenants,
  });
}
