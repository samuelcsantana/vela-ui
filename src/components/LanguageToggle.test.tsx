import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LanguageToggle, LIGHT_TOGGLE_CLASSNAME } from './LanguageToggle';

const { mockChangeLanguage, mockI18n } = vi.hoisted(() => ({
  mockChangeLanguage: vi.fn(),
  mockI18n: { language: 'en' },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { ...mockI18n, changeLanguage: mockChangeLanguage } }),
}));

describe('LanguageToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockI18n.language = 'en';
  });

  it('shows the target language and switches from English to Portuguese', async () => {
    mockI18n.language = 'en';
    const user = userEvent.setup();
    render(<LanguageToggle />);

    const langButton = screen.getByRole('button', { name: 'Português' });
    expect(langButton).toHaveTextContent('EN');

    await user.click(langButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('pt');
  });

  it('shows the target language and switches from Portuguese to English', async () => {
    mockI18n.language = 'pt';
    const user = userEvent.setup();
    render(<LanguageToggle />);

    const langButton = screen.getByRole('button', { name: 'English' });
    expect(langButton).toHaveTextContent('PT');

    await user.click(langButton);
    expect(mockChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('does not include dark: text classes when using the light variant, avoiding invisible text on light-only pages', () => {
    render(<LanguageToggle className={LIGHT_TOGGLE_CLASSNAME} />);

    const langButton = screen.getByRole('button', { name: 'Português' });
    expect(langButton).toHaveClass(...LIGHT_TOGGLE_CLASSNAME.split(' '));
    expect(langButton.className).not.toContain('dark:');
  });
});
