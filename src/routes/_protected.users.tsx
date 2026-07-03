import { createFileRoute, redirect } from '@tanstack/react-router';
import { useAuthStore } from '../features/auth/store/auth-store';
import { usersSearchSchema } from '../features/users/schema';

export const Route = createFileRoute('/_protected/users')({
  beforeLoad: () => {
    const { user } = useAuthStore.getState();

    if (user?.role !== 'VELA_ADMIN' && user?.role !== 'ADMIN') {
      throw redirect({ to: '/' });
    }
  },
  validateSearch: usersSearchSchema,
});
