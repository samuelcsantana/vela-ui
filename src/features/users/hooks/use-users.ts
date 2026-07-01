import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { createUser, fetchUsers, type CreateUserInput, type User } from '../api/mock-api';
import type { UsersSearchValues } from '../schema';

const USERS_QUERY_KEY = ['users'] as const;

export function useUsers({ search, page }: UsersSearchValues): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: [...USERS_QUERY_KEY, { search, page }],
    queryFn: () => fetchUsers(search),
  });
}

interface CreateUserContext {
  previousQueries: Array<[QueryKey, User[] | undefined]>;
}

export function useCreateUser(): UseMutationResult<User, Error, CreateUserInput, CreateUserContext> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: USERS_QUERY_KEY });

      const previousQueries = queryClient.getQueriesData<User[]>({ queryKey: USERS_QUERY_KEY });

      const optimisticUser: User = {
        id: `optimistic-${crypto.randomUUID()}`,
        tenantId: 'tenant-alpha',
        ...newUser,
      };

      queryClient.setQueriesData<User[]>({ queryKey: USERS_QUERY_KEY }, (old) =>
        old ? [...old, optimisticUser] : [optimisticUser],
      );

      return { previousQueries };
    },
    onError: (_error, _newUser, context) => {
      context?.previousQueries.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
