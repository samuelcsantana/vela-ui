import { LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../features/auth/store/auth-store';
import { useMediaQuery } from '../../hooks/use-media-query';
import { getDisplayNameFromEmail } from '../../lib/format';
import { useLayoutStore } from '../../store/layout-store';
import { useThemeStore } from '../../store/theme-store';
import { LanguageToggle } from '../LanguageToggle';
import { SIDEBAR_ID } from './Sidebar';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

const ICON_BUTTON_CLASSNAME =
  'flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white';

export const Header = () => {
  const { t } = useTranslation();
  const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const prefersDark = useMediaQuery(DARK_MEDIA_QUERY);

  const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

  const handleLogout = () => {
    void logout();
  };

  const handleToggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-white/80 px-4 backdrop-blur-md md:px-6 dark:bg-slate-900/80">
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
        <LanguageToggle />

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
            <div className="ml-1 flex items-center gap-2.5 rounded-full border border-border py-1 pl-1 pr-3">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand"
              >
                {getDisplayNameFromEmail(user.email).charAt(0).toUpperCase()}
              </span>
              <div className="text-left leading-tight">
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {getDisplayNameFromEmail(user.email)}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{user.role}</p>
              </div>
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
