import { useTranslation } from 'react-i18next';

const DEFAULT_CLASSNAME =
  'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

// For light-only surfaces (e.g. the pre-auth Login/Register pages), which have no
// dark: background of their own — using DEFAULT_CLASSNAME there would render
// dark:text-gray-300 on a plain white card when the app theme is dark, making the
// text nearly invisible.
export const LIGHT_TOGGLE_CLASSNAME =
  'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

interface LanguageToggleProps {
  className?: string;
}

export const LanguageToggle = ({ className = DEFAULT_CLASSNAME }: LanguageToggleProps) => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt';

  const handleToggleLanguage = () => {
    i18n.changeLanguage(isPortuguese ? 'en' : 'pt');
  };

  return (
    <button
      type="button"
      onClick={handleToggleLanguage}
      aria-label={isPortuguese ? 'English' : 'Português'}
      className={className}
    >
      {isPortuguese ? 'PT' : 'EN'}
    </button>
  );
};
