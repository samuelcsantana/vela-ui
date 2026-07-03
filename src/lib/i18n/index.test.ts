import { describe, expect, it, vi } from 'vitest';
import i18n from './index';

describe('i18n setup', () => {
  it('initializes with english and portuguese resources and an english fallback', async () => {
    await vi.waitFor(() => expect(i18n.isInitialized).toBe(true));

    expect(i18n.options.fallbackLng).toEqual(['en']);
    expect(i18n.options.supportedLngs).toEqual(expect.arrayContaining(['en', 'pt']));
    expect(['en', 'pt']).toContain(i18n.language);

    expect(i18n.getResourceBundle('en', 'translation')).toHaveProperty('common.appName');
    expect(i18n.getResourceBundle('pt', 'translation')).toHaveProperty('common.appName');
  });

  it('caches the resolved language in localStorage', async () => {
    await vi.waitFor(() => expect(i18n.isInitialized).toBe(true));

    expect(localStorage.getItem('vela-ui-language')).toBe(i18n.language);
  });
});
