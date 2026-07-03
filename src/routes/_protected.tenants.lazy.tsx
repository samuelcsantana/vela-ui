import { createLazyFileRoute } from '@tanstack/react-router';
import { TenantsView } from '../features/tenants/TenantsView';

export const Route = createLazyFileRoute('/_protected/tenants')({
  component: TenantsView,
});
