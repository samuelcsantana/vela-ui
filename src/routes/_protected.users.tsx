import { createFileRoute } from '@tanstack/react-router';
import { usersSearchSchema } from '../features/users/schema';

export const Route = createFileRoute('/_protected/users')({
  validateSearch: usersSearchSchema,
});
