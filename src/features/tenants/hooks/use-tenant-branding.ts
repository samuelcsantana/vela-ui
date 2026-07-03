import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from '../../auth/store/auth-store';
import { fetchTenants } from '../api/tenants-api';
import { DEFAULT_BRAND_COLOR, TENANT_THEME_FALLBACK } from '../theme';

const TENANTS_QUERY_KEY = ['tenants'] as const;
export const TENANT_BRAND_CSS_VAR = '--tenant-brand';

// GET /api/tenants/{slug} is the public white-label lookup, but at this point we only
// have the caller's tenantId (from the login response), not their slug — so this reads
// the authenticated GET /api/tenants list and matches on id, per swagger.json.
export function useTenantBranding(): void {
  const tenantId = useAuthStore((state) => state.user?.tenantId);

  const { data: brandColor } = useQuery({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: fetchTenants,
    enabled: Boolean(tenantId),
    staleTime: 5 * 60 * 1000,
    select: (tenants) => {
      const tenant = tenants.find((item) => item.id === tenantId);
      return tenant?.primaryColor ?? TENANT_THEME_FALLBACK[tenant?.slug ?? ''] ?? DEFAULT_BRAND_COLOR;
    },
  });

  useEffect(() => {
    document.documentElement.style.setProperty(TENANT_BRAND_CSS_VAR, brandColor ?? DEFAULT_BRAND_COLOR);
  }, [brandColor]);
}
