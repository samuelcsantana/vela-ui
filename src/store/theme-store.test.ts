import { beforeEach, describe, expect, it } from 'vitest';
import { useThemeStore } from './theme-store';

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ theme: 'system' });
  });

  it('defaults to the system theme', () => {
    expect(useThemeStore.getState().theme).toBe('system');
  });

  it('updates the theme via setTheme', () => {
    useThemeStore.getState().setTheme('dark');
    expect(useThemeStore.getState().theme).toBe('dark');

    useThemeStore.getState().setTheme('light');
    expect(useThemeStore.getState().theme).toBe('light');
  });

  it('persists the theme to localStorage under the vela-ui-theme key', () => {
    useThemeStore.getState().setTheme('dark');

    const stored = localStorage.getItem('vela-ui-theme');
    expect(stored).not.toBeNull();
    expect(JSON.parse(stored as string)).toMatchObject({ state: { theme: 'dark' } });
  });
});
