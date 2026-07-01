import { describe, expect, it } from 'vitest';
import { queryClient } from './query-client';

describe('queryClient', () => {
  it('configures a shared staleTime, disables refetch on focus, and limits retries', () => {
    const { queries } = queryClient.getDefaultOptions();

    expect(queries?.staleTime).toBe(60 * 1000);
    expect(queries?.refetchOnWindowFocus).toBe(false);
    expect(queries?.retry).toBe(1);
  });
});
