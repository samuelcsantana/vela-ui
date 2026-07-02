import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import { registerTenant, type RegisterTenantResult } from '../api/tenants-api';
import type { RegisterValues } from '../schema';

export function useRegisterTenant(): UseMutationResult<RegisterTenantResult, unknown, RegisterValues> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
