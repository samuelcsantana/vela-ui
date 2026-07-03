import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { AppLayout } from '../components/layout/AppLayout';
import { useAuthStore } from '../features/auth/store/auth-store';

export const Route = createFileRoute('/_protected')({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();

    if (!isAuthenticated) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
