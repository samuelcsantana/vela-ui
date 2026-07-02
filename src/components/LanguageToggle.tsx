import { useTranslation } from 'react-i18next';

const BUTTON_CLASSNAME =
  'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white';

export const LanguageToggle = () => {
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
      className={BUTTON_CLASSNAME}
    >
      {isPortuguese ? 'PT' : 'EN'}
    </button>
  );
};
