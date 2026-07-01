import { useNavigate } from '@tanstack/react-router';
import { ShieldCheck, UserRound } from 'lucide-react';
import { useAuthStore, type AuthUser } from '../store/auth-store';

const DEMO_ADMIN: AuthUser = {
  id: 'demo-admin',
  name: 'Ana Souza',
  email: 'admin@velaui.demo',
  role: 'admin',
  tenantId: 'tenant-demo',
};

const DEMO_USER: AuthUser = {
  id: 'demo-user',
  name: 'Carlos Lima',
  email: 'user@velaui.demo',
  role: 'user',
  tenantId: 'tenant-demo',
};

const DEMO_BUTTON_CLASSNAME =
  'flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900';

export const LoginForm = () => {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleDemoLogin = (user: AuthUser) => {
    login(user);
    navigate({ to: '/' });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Vela UI</h1>
          <p className="mt-2 text-sm text-slate-500">
            This is a portfolio project. Choose a demo access below — no password required.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleDemoLogin(DEMO_ADMIN)}
            className={`${DEMO_BUTTON_CLASSNAME} bg-slate-900 text-white hover:bg-slate-700`}
          >
            <ShieldCheck size={18} aria-hidden="true" />
            Access Demo as Admin
          </button>

          <button
            type="button"
            onClick={() => handleDemoLogin(DEMO_USER)}
            className={`${DEMO_BUTTON_CLASSNAME} border border-slate-300 text-slate-700 hover:bg-slate-100`}
          >
            <UserRound size={18} aria-hidden="true" />
            Access Demo as User
          </button>
        </div>
      </div>
    </main>
  );
};
