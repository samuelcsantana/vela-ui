import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './use-media-query';

function createMatchMediaMock(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<() => void>();

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn((_event: string, listener: () => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_event: string, listener: () => void) => {
      listeners.delete(listener);
    }),
  };

  return {
    matchMedia: vi.fn().mockReturnValue(mediaQueryList),
    setMatches: (value: boolean) => {
      matches = value;
      listeners.forEach((listener) => listener());
    },
    listenerCount: () => listeners.size,
  };
}

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('returns the initial match state', () => {
    const { matchMedia } = createMatchMediaMock(true);
    window.matchMedia = matchMedia;

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(true);
  });

  it('updates when the media query match state changes', () => {
    const mock = createMatchMediaMock(false);
    window.matchMedia = mock.matchMedia;

    const { result } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(result.current).toBe(false);

    act(() => {
      mock.setMatches(true);
    });
    expect(result.current).toBe(true);
  });

  it('removes the change listener on unmount', () => {
    const mock = createMatchMediaMock(false);
    window.matchMedia = mock.matchMedia;

    const { unmount } = renderHook(() => useMediaQuery('(max-width: 767px)'));
    expect(mock.listenerCount()).toBe(1);

    unmount();
    expect(mock.listenerCount()).toBe(0);
  });
});
