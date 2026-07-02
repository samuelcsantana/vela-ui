import { createLazyFileRoute } from '@tanstack/react-router';
import { TenantLoginForm } from '../features/auth/components/TenantLoginForm';

export const Route = createLazyFileRoute('/$slug/login')({
  component: TenantLoginForm,
});
