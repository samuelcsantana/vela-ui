import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createUser, fetchUsers } from './mock-api';

describe('mock-api', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fetchUsers', () => {
    it('returns every mock user when no search term is provided', async () => {
      const promise = fetchUsers();
      await vi.advanceTimersByTimeAsync(1000);
      const users = await promise;

      expect(users.length).toBeGreaterThanOrEqual(6);
      expect(users.map((user) => user.name)).toContain('Ana Silva');
    });

    it('filters users by a case-insensitive, trimmed name match', async () => {
      const promise = fetchUsers('  ana  ');
      await vi.advanceTimersByTimeAsync(1000);
      const users = await promise;

      expect(users).toHaveLength(1);
      expect(users[0].name).toBe('Ana Silva');
    });

    it('returns an empty array when nothing matches the search term', async () => {
      const promise = fetchUsers('nonexistent-user-xyz');
      await vi.advanceTimersByTimeAsync(1000);
      const users = await promise;

      expect(users).toEqual([]);
    });
  });

  describe('createUser', () => {
    it('creates a user with a generated id and the current tenant, and persists it for later fetches', async () => {
      const createPromise = createUser({ name: 'New Person', email: 'new@velaui.demo', role: 'editor' });
      await vi.advanceTimersByTimeAsync(1500);
      const created = await createPromise;

      expect(created.id).toBeTruthy();
      expect(created.tenantId).toBe('tenant-alpha');
      expect(created.name).toBe('New Person');
      expect(created.email).toBe('new@velaui.demo');
      expect(created.role).toBe('editor');

      const fetchPromise = fetchUsers('New Person');
      await vi.advanceTimersByTimeAsync(1000);
      const users = await fetchPromise;
      expect(users).toContainEqual(created);
    });
  });
});
