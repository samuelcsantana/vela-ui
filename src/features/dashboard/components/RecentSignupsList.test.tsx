import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RecentSignup } from '../api/dashboard-api';
import { RecentSignupsList } from './RecentSignupsList';

const { mockUseTranslation } = vi.hoisted(() => ({
  mockUseTranslation: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => mockUseTranslation(),
}));

const MOCK_SIGNUPS: RecentSignup[] = [
  { id: 'user-1', email: 'ana@velaui.demo', role: 'MEMBER', tenantId: 'tenant-1', createdAt: '2026-01-15T00:00:00.000Z' },
  { id: 'user-2', email: 'bruno@velaui.demo', role: 'ADMIN', tenantId: 'tenant-2', createdAt: '2026-02-20T00:00:00.000Z' },
];

describe('RecentSignupsList', () => {
  beforeEach(() => {
    mockUseTranslation.mockReturnValue({ t: (key: string) => key, i18n: { language: 'en' } });
  });

  it('shows an empty state message when there are no signups', () => {
    render(<RecentSignupsList signups={[]} />);
    expect(screen.getByText('dashboard.recentSignups.empty')).toBeInTheDocument();
  });

  it('renders every signup with its email and formatted date', () => {
    render(<RecentSignupsList signups={MOCK_SIGNUPS} />);

    expect(screen.getByText('ana@velaui.demo')).toBeInTheDocument();
    expect(screen.getByText('bruno@velaui.demo')).toBeInTheDocument();
    expect(screen.getByText('Jan 15, 2026')).toBeInTheDocument();
    expect(screen.getByText('Feb 20, 2026')).toBeInTheDocument();
  });

  it('formats the signup date using the active i18n language', () => {
    mockUseTranslation.mockReturnValue({ t: (key: string) => key, i18n: { language: 'pt' } });
    render(<RecentSignupsList signups={MOCK_SIGNUPS} />);

    expect(screen.getByText('15 de jan. de 2026')).toBeInTheDocument();
  });
});
