import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { createUser, fetchUsers, type CreatedUser, type CreateUserInput, type User } from '../api/users-api';
import type { UsersSearchValues } from '../schema';

const USERS_QUERY_KEY = ['users'] as const;

export function useUsers({ search }: UsersSearchValues): UseQueryResult<User[], Error> {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: fetchUsers,
    select: (users) => {
      if (!search) {
        return users;
      }

      const normalizedSearch = search.trim().toLowerCase();
      return users.filter((user) => user.email.toLowerCase().includes(normalizedSearch));
    },
  });
}

export function useCreateUser(): UseMutationResult<CreatedUser, Error, CreateUserInput> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });
}
