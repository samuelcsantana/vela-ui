import axios from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './api';

describe('getApiErrorMessage', () => {
  it('extracts the error message from an Axios error response', () => {
    const error = new axios.AxiosError('Request failed', '409', undefined, undefined, {
      status: 409,
      statusText: 'Conflict',
      headers: {},
      config: {} as never,
      data: { error: 'A tenant with this slug already exists' },
    });

    expect(getApiErrorMessage(error)).toBe('A tenant with this slug already exists');
  });

  it('returns undefined when the Axios error has no response', () => {
    const error = new axios.AxiosError('Network Error');

    expect(getApiErrorMessage(error)).toBeUndefined();
  });

  it('returns undefined for a non-Axios error', () => {
    expect(getApiErrorMessage(new Error('boom'))).toBeUndefined();
  });
});
