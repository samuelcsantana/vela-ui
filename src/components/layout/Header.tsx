import { useNavigate } from '@tanstack/react-router';
import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../features/auth/store/auth-store';
import { useMediaQuery } from '../../hooks/use-media-query';
import { useLayoutStore } from '../../store/layout-store';
import { useThemeStore } from '../../store/theme-store';
import { SIDEBAR_ID } from './Sidebar';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const ICON_BUTTON_CLASSNAME =
  'flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white';

export const Header = () => {
  const { t, i18n } = useTranslation();
  const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const prefersDark = useMediaQuery(DARK_MEDIA_QUERY);
  const navigate = useNavigate();

  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
  const isPortuguese = i18n.language === 'pt';

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  const handleToggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleToggleLanguage = () => {
    i18n.changeLanguage(isPortuguese ? 'en' : 'pt');
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={t('header.toggleSidebar')}
        aria-expanded={isSidebarOpen}
        aria-controls={SIDEBAR_ID}
        className={ICON_BUTTON_CLASSNAME}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggleLanguage}
          aria-label={isPortuguese ? 'English' : 'Português'}
          className={`${ICON_BUTTON_CLASSNAME} text-xs font-semibold`}
        >
          {isPortuguese ? 'PT' : 'EN'}
        </button>

        <button
          type="button"
          onClick={handleToggleTheme}
          aria-label={isDark ? t('header.toggleThemeToLight') : t('header.toggleThemeToDark')}
          className={ICON_BUTTON_CLASSNAME}
        >
          {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>

        {user ? (
          <>
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">{t(`header.role.${user.role}`)}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label={t('header.logout')}
              className={ICON_BUTTON_CLASSNAME}
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
};
