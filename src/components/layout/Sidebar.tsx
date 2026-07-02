import { Link } from '@tanstack/react-router';
import type { LinkProps } from '@tanstack/react-router';
import { LayoutDashboard, Settings, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '../../hooks/use-media-query';
import { useLayoutStore } from '../../store/layout-store';

interface NavItem {
  labelKey: string;
  icon: LucideIcon;
  to?: LinkProps['to'];
}

const NAV_ITEMS: NavItem[] = [
  { labelKey: 'sidebar.dashboard', icon: LayoutDashboard, to: '/' },
  { labelKey: 'sidebar.users', icon: Users, to: '/users' },
  { labelKey: 'sidebar.settings', icon: Settings },
];

const NAV_ITEM_CLASSNAME =
  'flex min-h-11 items-center gap-3 rounded-md px-3 py-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

const MOBILE_BREAKPOINT_QUERY = '(max-width: 767px)';

export const SIDEBAR_ID = 'app-sidebar';

export const Sidebar = () => {
  const { t } = useTranslation();
  const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const isMobile = useMediaQuery(MOBILE_BREAKPOINT_QUERY);
  const isOffCanvasHidden = isMobile && !isSidebarOpen;

  useEffect(() => {
    if (!isSidebarOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggleSidebar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, toggleSidebar]);

  const handleNavLinkClick = () => {
    if (window.matchMedia(MOBILE_BREAKPOINT_QUERY).matches) {
      toggleSidebar();
    }
  };

  return (
    <>
      {isSidebarOpen ? (
        <div
          aria-hidden="true"
          onClick={toggleSidebar}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      ) : null}

      <nav
        id={SIDEBAR_ID}
        aria-label={t('sidebar.nav')}
        inert={isOffCanvasHidden}
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-slate-900 transition-transform duration-300 ease-in-out md:sticky md:top-0 md:z-auto md:border-r md:border-slate-200 dark:md:border-slate-700 md:transition-[width] md:duration-300 md:ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarOpen ? 'md:w-60' : 'md:w-16'}`}
      >
        <div className="flex h-14 items-center justify-center border-b border-slate-800">
          <span className="text-lg font-semibold text-white">{isSidebarOpen ? t('sidebar.brand') : 'V'}</span>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-2">
          {NAV_ITEMS.map(({ labelKey, icon: Icon, to }) => {
            const label = t(labelKey);
            const labelSpan = (
              <span
                className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${
                  isSidebarOpen ? 'w-auto opacity-100' : 'md:w-0 md:opacity-0'
                }`}
              >
                {label}
              </span>
            );

            if (!to) {
              return (
                <button
                  key={labelKey}
                  type="button"
                  disabled
                  aria-disabled="true"
                  className={`${NAV_ITEM_CLASSNAME} cursor-not-allowed text-left opacity-50`}
                >
                  <Icon size={20} className="shrink-0" aria-hidden="true" />
                  {labelSpan}
                </button>
              );
            }

            return (
              <Link
                key={labelKey}
                to={to}
                onClick={handleNavLinkClick}
                className={NAV_ITEM_CLASSNAME}
                activeProps={{ className: 'bg-brand text-white font-semibold' }}
              >
                <Icon size={20} className="shrink-0" aria-hidden="true" />
                {labelSpan}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
