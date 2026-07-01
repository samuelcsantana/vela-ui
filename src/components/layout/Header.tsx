import { useNavigate } from '@tanstack/react-router';
import { LogOut, Menu } from 'lucide-react';
import { useAuthStore, type AuthRole } from '../../features/auth/store/auth-store';
import { useLayoutStore } from '../../store/layout-store';
import { SIDEBAR_ID } from './Sidebar';

const ROLE_LABELS: Record<AuthRole, string> = {
  admin: 'Admin',
  user: 'Usuário',
};

const ICON_BUTTON_CLASSNAME =
  'flex min-h-11 min-w-11 items-center justify-center rounded-md text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

export const Header = () => {
  const isSidebarOpen = useLayoutStore((state) => state.isSidebarOpen);
  const toggleSidebar = useLayoutStore((state) => state.toggleSidebar);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate({ to: '/login' });
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Alternar menu lateral"
        aria-expanded={isSidebarOpen}
        aria-controls={SIDEBAR_ID}
        className={ICON_BUTTON_CLASSNAME}
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      {user ? (
        <div className="flex items-center gap-3">
          <div className="text-right leading-tight">
            <p className="text-sm font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{ROLE_LABELS[user.role]}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Sair"
            className={ICON_BUTTON_CLASSNAME}
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </header>
  );
};
