import { createLazyFileRoute } from '@tanstack/react-router';
import { RegisterForm } from '../features/tenants/components/RegisterForm';

export const Route = createLazyFileRoute('/_protected/register')({
  component: RegisterForm,
});
