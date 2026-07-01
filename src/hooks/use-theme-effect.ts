import { useEffect } from 'react';
import { useThemeStore } from '../store/theme-store';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

export function useThemeEffect(): void {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(DARK_MEDIA_QUERY);

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQueryList.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    applyTheme();

    if (theme !== 'system') {
      return;
    }

    mediaQueryList.addEventListener('change', applyTheme);
    return () => mediaQueryList.removeEventListener('change', applyTheme);
  }, [theme]);
}
