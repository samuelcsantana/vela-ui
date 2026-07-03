import { beforeEach, describe, expect, it } from 'vitest';
import { useLayoutStore } from './layout-store';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.setState({ isSidebarOpen: false });
  });

  it('defaults to a closed sidebar', () => {
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
  });

  it('toggles the sidebar open state', () => {
    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().isSidebarOpen).toBe(true);

    useLayoutStore.getState().toggleSidebar();
    expect(useLayoutStore.getState().isSidebarOpen).toBe(false);
  });
});
