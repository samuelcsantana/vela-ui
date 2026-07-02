import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { createUser } from '../../users/api/users-api';
import { createTenant } from '../api/tenants-api';
import type { RegisterValues } from '../schema';

export interface RegisterResult {
  tenantId: string;
  userId: string;
}

// No single "sign up" endpoint exists in swagger.json — POST /api/tenants and
// POST /api/users are both admin-only, so registration is two sequential calls.
export function useRegisterTenant(): UseMutationResult<RegisterResult, unknown, RegisterValues> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values) => {
      const tenant = await createTenant({ name: values.companyName, slug: values.slug });
      const user = await createUser({ email: values.email, password: values.password, tenantId: tenant.id });
      return { tenantId: tenant.id, userId: user.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
