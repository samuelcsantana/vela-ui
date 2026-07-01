import { createLazyFileRoute } from '@tanstack/react-router';
import { UsersView } from '../features/users/UsersView';

export const Route = createLazyFileRoute('/_protected/users')({
  component: UsersView,
});
