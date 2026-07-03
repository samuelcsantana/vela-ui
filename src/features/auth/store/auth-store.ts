import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../../../lib/api';

// Mirrors the `role` enum documented in swagger.json for POST /api/auth/login.
export type UserRole = 'VELA_ADMIN' | 'ADMIN' | 'MEMBER';

// Mirrors the response of POST /api/auth/login in swagger.json exactly.
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (credentials) => {
        const { data } = await api.post<AuthUser>('/auth/login', credentials);
        set({ user: data, isAuthenticated: true });
      },
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Logout request failed', error);
        }

        set({ user: null, isAuthenticated: false });

        // Dynamic import avoids a circular dependency: router.tsx -> routeTree.gen.ts
        // -> _protected.tsx -> this store.
        const { router } = await import('../../../router');
        router.navigate({ to: '/login' });
      },
    }),
    {
      name: 'vela-ui-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);
