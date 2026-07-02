import { useMutation, useQuery, useQueryClient, type UseMutationResult, type UseQueryResult } from '@tanstack/react-query';
import {
  createTenant,
  deleteTenant,
  fetchTenants,
  updateTenant,
  type CreateTenantInput,
  type Tenant,
  type UpdateTenantInput,
} from '../api/tenants-api';

const TENANTS_QUERY_KEY = ['tenants'] as const;

export function useTenants(): UseQueryResult<Tenant[], Error> {
  return useQuery({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: fetchTenants,
  });
}

export function useCreateTenant(): UseMutationResult<Tenant, Error, CreateTenantInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
    },
  });
}

interface UpdateTenantVariables {
  id: string;
  input: UpdateTenantInput;
}

export function useUpdateTenant(): UseMutationResult<Tenant, unknown, UpdateTenantVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: UpdateTenantVariables) => updateTenant(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
    },
  });
}

export function useDeleteTenant(): UseMutationResult<void, unknown, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTenant(id),
    // Removes the row from the cache directly instead of refetching, so the table updates instantly.
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Tenant[]>(TENANTS_QUERY_KEY, (previous) => previous?.filter((tenant) => tenant.id !== id));
    },
  });
}
