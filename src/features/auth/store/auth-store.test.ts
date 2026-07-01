import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore, type AuthUser } from './auth-store';

const MOCK_USER: AuthUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@velaui.demo',
  role: 'admin',
  tenantId: 'tenant-demo',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('defaults to a logged-out state', () => {
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logs a user in', () => {
    useAuthStore.getState().login(MOCK_USER);

    expect(useAuthStore.getState().user).toEqual(MOCK_USER);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logs a user out', () => {
    useAuthStore.getState().login(MOCK_USER);
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('persists only user and isAuthenticated to localStorage', () => {
    useAuthStore.getState().login(MOCK_USER);

    const stored = JSON.parse(localStorage.getItem('vela-ui-auth') as string);
    expect(stored.state).toEqual({ user: MOCK_USER, isAuthenticated: true });
  });
});
