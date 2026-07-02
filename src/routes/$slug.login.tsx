import axios from 'axios';
import { createFileRoute, notFound } from '@tanstack/react-router';
import { fetchTenantBySlug } from '../features/tenants/api/tenants-api';
import { NotFound } from '../components/NotFound';

export const Route = createFileRoute('/$slug/login')({
  loader: async ({ params }) => {
    try {
      const tenant = await fetchTenantBySlug(params.slug);
      return { tenant };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        throw notFound();
      }

      throw error;
    }
  },
  notFoundComponent: NotFound,
});
