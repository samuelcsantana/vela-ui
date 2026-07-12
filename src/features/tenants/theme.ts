import type { CSSProperties } from 'react';
import { HEX_COLOR_REGEX } from './schema';

// swagger.json's tenant schema does declare `primaryColor`, but it's nullable — this
// map is a temporary fallback for tenants that haven't set one yet, keyed by slug.
export const TENANT_THEME_FALLBACK: Record<string, string> = {
  vela: '#4f46e5',
  sicredi: '#32a852',
};

export const DEFAULT_BRAND_COLOR = '#4f46e5';

// Builds the tenant login page background from the branding fields. Used by the
// real /$slug/login page AND by the edit dialog's live preview, so what the admin
// sees in the preview is what visitors get — by construction, not by convention.
export function buildLoginBackgroundStyle(
  backgroundColor: string | null | undefined,
  backgroundImageUrl: string | null | undefined,
): CSSProperties {
  const style: CSSProperties = {};

  if (backgroundImageUrl) {
    style.backgroundImage = `url(${backgroundImageUrl})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  }

  if (backgroundColor && HEX_COLOR_REGEX.test(backgroundColor)) {
    style.backgroundColor = backgroundColor;
  }

  return style;
}
