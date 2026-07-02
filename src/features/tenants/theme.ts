// swagger.json's tenant schema does declare `primaryColor`, but it's nullable — this
// map is a temporary fallback for tenants that haven't set one yet, keyed by slug.
export const TENANT_THEME_FALLBACK: Record<string, string> = {
  vela: '#0052cc',
  sicredi: '#32a852',
};

export const DEFAULT_BRAND_COLOR = '#0052cc';
