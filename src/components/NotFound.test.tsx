import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotFound } from './NotFound';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('NotFound', () => {
  it('renders the title, message, and a link back to login', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { name: 'notFound.title' })).toBeInTheDocument();
    expect(screen.getByText('notFound.message')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'notFound.backToLogin' })).toHaveAttribute('href', '/login');
  });
});
