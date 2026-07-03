import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardSkeleton } from './DashboardSkeleton';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('DashboardSkeleton', () => {
  it('renders an accessible loading status', () => {
    render(<DashboardSkeleton />);

    expect(screen.getByRole('status')).toHaveTextContent('dashboard.loading');
  });
});
