import { Link } from '@tanstack/react-router';
import type { LinkProps } from '@tanstack/react-router';
import { Building2, LayoutDashboard, Sailboat, Settings, Users } from 'lucide-react';
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
  { labelKey: 'sidebar.tenants', icon: Building2, to: '/tenants' },
  { labelKey: 'sidebar.settings', icon: Settings },
];

const NAV_ITEM_CLASSNAME =
  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white';

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
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
        />
      ) : null}

      <nav
        id={SIDEBAR_ID}
        aria-label={t('sidebar.nav')}
        inert={isOffCanvasHidden}
        className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-gradient-to-b from-slate-900 to-slate-950 transition-transform duration-300 ease-in-out md:sticky md:top-0 md:z-auto md:border-r md:border-slate-800/70 md:transition-[width] md:duration-300 md:ease-in-out md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isSidebarOpen ? 'md:w-60' : 'md:w-16'}`}
      >
        <div className={`flex h-16 items-center gap-2.5 border-b border-white/5 ${isSidebarOpen ? 'px-4' : 'justify-center px-0'}`}>
          {isSidebarOpen ? (
            <>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white shadow-lg shadow-brand/30">
                <Sailboat size={17} aria-hidden="true" />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-white">{t('sidebar.brand')}</span>
            </>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white shadow-lg shadow-brand/30">
              V
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1 p-3">
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
                  className={`${NAV_ITEM_CLASSNAME} cursor-not-allowed text-left opacity-40`}
                >
                  <Icon size={19} className="shrink-0" aria-hidden="true" />
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
                activeProps={{
                  className: 'bg-brand text-white font-semibold shadow-lg shadow-brand/25 hover:bg-brand',
                }}
              >
                <Icon size={19} className="shrink-0" aria-hidden="true" />
                {labelSpan}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
