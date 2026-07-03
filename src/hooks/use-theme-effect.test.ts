import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useThemeStore } from '../store/theme-store';
import { useThemeEffect } from './use-theme-effect';

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

describe('useThemeEffect', () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    useThemeStore.setState({ theme: 'system' });
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    document.documentElement.classList.remove('dark');
  });

  it('adds the dark class when the theme is explicitly dark', () => {
    useThemeStore.setState({ theme: 'dark' });
    const { matchMedia } = createMatchMediaMock(false);
    window.matchMedia = matchMedia;

    renderHook(() => useThemeEffect());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the dark class when the theme is explicitly light', () => {
    useThemeStore.setState({ theme: 'light' });
    document.documentElement.classList.add('dark');
    const { matchMedia } = createMatchMediaMock(true);
    window.matchMedia = matchMedia;

    renderHook(() => useThemeEffect());

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('does not subscribe to media query changes for explicit themes', () => {
    useThemeStore.setState({ theme: 'dark' });
    const mock = createMatchMediaMock(false);
    window.matchMedia = mock.matchMedia;

    renderHook(() => useThemeEffect());

    expect(mock.listenerCount()).toBe(0);
  });

  it('follows the system preference when theme is system', () => {
    useThemeStore.setState({ theme: 'system' });
    const mock = createMatchMediaMock(true);
    window.matchMedia = mock.matchMedia;

    renderHook(() => useThemeEffect());

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(mock.listenerCount()).toBe(1);
  });

  it('reacts to system preference changes while theme is system', () => {
    useThemeStore.setState({ theme: 'system' });
    const mock = createMatchMediaMock(false);
    window.matchMedia = mock.matchMedia;

    renderHook(() => useThemeEffect());
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    act(() => {
      mock.setMatches(true);
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes the media query listener on unmount when theme is system', () => {
    useThemeStore.setState({ theme: 'system' });
    const mock = createMatchMediaMock(false);
    window.matchMedia = mock.matchMedia;

    const { unmount } = renderHook(() => useThemeEffect());
    expect(mock.listenerCount()).toBe(1);

    unmount();
    expect(mock.listenerCount()).toBe(0);
  });
});
