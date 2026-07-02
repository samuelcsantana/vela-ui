import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '../../../lib/api';
import { useAuthStore, type AuthUser } from './auth-store';

vi.mock('../../../lib/api', () => ({
  api: { post: vi.fn() },
}));

const MOCK_USER: AuthUser = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@velaui.demo',
  role: 'admin',
  tenantId: 'tenant-demo',
};

const MOCK_CREDENTIALS = { email: 'test@velaui.demo', password: 'secret' };

describe('useAuthStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useAuthStore.setState({ user: null, isAuthenticated: false });
  });

  it('defaults to a logged-out state', () => {
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('logs a user in by posting credentials and storing only the returned user', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { user: MOCK_USER } });

    await useAuthStore.getState().login(MOCK_CREDENTIALS);

    expect(api.post).toHaveBeenCalledWith('/auth/login', MOCK_CREDENTIALS);
    expect(useAuthStore.getState().user).toEqual(MOCK_USER);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logs a user out', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { user: MOCK_USER } });
    await useAuthStore.getState().login(MOCK_CREDENTIALS);

    useAuthStore.getState().logout();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('persists only user and isAuthenticated to localStorage', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { user: MOCK_USER } });
    await useAuthStore.getState().login(MOCK_CREDENTIALS);

    const stored = JSON.parse(localStorage.getItem('vela-ui-auth') as string);
    expect(stored.state).toEqual({ user: MOCK_USER, isAuthenticated: true });
  });
});
