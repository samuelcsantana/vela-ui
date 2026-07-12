import { Sailboat } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoginPreviewProps {
  backgroundColor: string;
  backgroundImageUrl: string | null;
  logoUrl: string | null;
  logoWidth?: number;
  name: string;
  primaryColor: string;
}

export const LoginPreview = ({
  backgroundColor,
  backgroundImageUrl,
  logoUrl,
  logoWidth,
  name,
  primaryColor,
}: LoginPreviewProps) => {
  const { t } = useTranslation();

  const previewBg: React.CSSProperties = {};
  if (backgroundImageUrl) {
    previewBg.backgroundImage = `url(${backgroundImageUrl})`;
    previewBg.backgroundSize = 'cover';
    previewBg.backgroundPosition = 'center';
  }
  if (backgroundColor) {
    previewBg.backgroundColor = backgroundColor;
  } else if (!backgroundImageUrl) {
    previewBg.backgroundColor = '#0f172a';
  }

  const previewLogoWidth =
    logoWidth && logoWidth >= 16 ? `${logoWidth}px` : undefined;

  return (
    <div className="flex min-h-[500px] flex-1 bg-slate-50">
      {/* Hero panel */}
      <div
        className="relative flex w-[44%] flex-col justify-between overflow-hidden p-6"
        style={previewBg}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_color-mix(in_srgb,_var(--tenant-brand)_35%,transparent),_transparent_55%),radial-gradient(ellipse_at_bottom_right,_color-mix(in_srgb,_var(--tenant-brand)_25%,transparent),_transparent_60%)]"
          style={{ '--tenant-brand': primaryColor } as React.CSSProperties}
        />
        <div className="relative flex items-center gap-2">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white shadow-lg shadow-brand/40"
            style={{ backgroundColor: primaryColor }}
          >
            <Sailboat size={15} aria-hidden="true" />
          </span>
          <span className="text-sm font-semibold tracking-tight text-white">{name}</span>
        </div>
        <div className="relative">
          <h3 className="text-xl font-semibold leading-tight tracking-tight text-white">
            {t('auth.hero.title')}
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{t('auth.hero.subtitle')}</p>
        </div>
        <p className="relative text-[10px] text-slate-500">Vela — multi-tenant SaaS portfolio demo</p>
      </div>

      {/* Login form panel */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-[240px]">
          {logoUrl ? (
            <div className="mb-4 flex justify-center">
              <img
                src={logoUrl}
                alt=""
                className="max-w-full object-contain"
                style={{
                  width: previewLogoWidth ?? 'auto',
                  maxWidth: previewLogoWidth ? previewLogoWidth : '60%',
                  height: 'auto',
                }}
              />
            </div>
          ) : (
            <div className="mb-5 flex justify-center">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg shadow-brand/30"
                style={{ backgroundColor: primaryColor }}
              >
                <Sailboat size={20} aria-hidden="true" />
              </span>
            </div>
          )}
          <h4 className="mb-1 text-center text-base font-semibold tracking-tight text-slate-900">
            {name}
          </h4>
          <p className="mb-5 text-center text-[11px] leading-relaxed text-slate-500">
            {t('auth.tenantLoginSubtitle')}
          </p>
          <div className="flex flex-col gap-2">
            <div className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-400 leading-9">
              {t('users.fields.email')}
            </div>
            <div className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-400 leading-9">
              {t('users.fields.password')}
            </div>
            <div
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-white shadow-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {t('auth.loginSubmit')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
