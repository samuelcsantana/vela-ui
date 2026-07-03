import { useMutation, type UseMutationResult } from '@tanstack/react-query';
import { joinTenant, type JoinTenantInput, type JoinTenantResult } from '../api/tenants-api';

export function useJoinTenant(): UseMutationResult<JoinTenantResult, unknown, JoinTenantInput> {
  return useMutation({
    mutationFn: joinTenant,
  });
}
