import { createLazyFileRoute } from '@tanstack/react-router';
import { DashboardView } from '../features/dashboard/DashboardView';

export const Route = createLazyFileRoute('/_protected/')({
  component: DashboardView,
});
