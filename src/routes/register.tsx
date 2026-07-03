import { createFileRoute } from '@tanstack/react-router';
import { RegisterForm } from '../features/tenants/components/RegisterForm';

export const Route = createFileRoute('/register')({
  component: RegisterForm,
});
