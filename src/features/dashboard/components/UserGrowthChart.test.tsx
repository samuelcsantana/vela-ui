import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { MonthlyGrowthPoint } from '../mock-data';
import { UserGrowthChart } from './UserGrowthChart';

// jsdom has no ResizeObserver and never reports real element dimensions, so recharts'
// ResponsiveContainer renders nothing meaningful there. Stub the primitives instead so
// this test can assert what data/props the chart is actually wired up with.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ data, children }: { data: MonthlyGrowthPoint[]; children: ReactNode }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid="line" data-key={dataKey} data-stroke={stroke} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => <div data-testid="x-axis" data-key={dataKey} />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const MOCK_DATA: MonthlyGrowthPoint[] = [
  { month: 'Jan', users: 10 },
  { month: 'Feb', users: 20 },
];

describe('UserGrowthChart', () => {
  it('renders a responsive line chart wired up with the given monthly data', () => {
    render(<UserGrowthChart data={MOCK_DATA} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toHaveAttribute('data-chart-data', JSON.stringify(MOCK_DATA));
    expect(screen.getByTestId('x-axis')).toHaveAttribute('data-key', 'month');
    expect(screen.getByTestId('line')).toHaveAttribute('data-key', 'users');
  });
});
