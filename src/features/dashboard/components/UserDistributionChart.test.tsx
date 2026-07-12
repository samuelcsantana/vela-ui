import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { UserDistributionChart, type DistributionSlice } from './UserDistributionChart';

// recharts primitives are stubbed because jsdom never gives ResponsiveContainer real
// dimensions (no ResizeObserver), so the real SVG output can't be asserted on.
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ data, dataKey, nameKey, children }: { data: DistributionSlice[]; dataKey: string; nameKey: string; children: ReactNode }) => (
    <div data-testid="pie" data-chart-data={JSON.stringify(data)} data-key={dataKey} data-name-key={nameKey}>
      {children}
    </div>
  ),
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

const MOCK_DATA: DistributionSlice[] = [
  { name: 'Vela Corp', value: 10 },
  { name: 'Sicredi', value: 20 },
  { name: 'Nubank', value: 5 },
];

describe('UserDistributionChart', () => {
  it('renders a responsive donut chart wired up with the given distribution data', () => {
    render(<UserDistributionChart data={MOCK_DATA} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    const pie = screen.getByTestId('pie');
    expect(pie).toHaveAttribute('data-chart-data', JSON.stringify(MOCK_DATA));
    expect(pie).toHaveAttribute('data-key', 'value');
    expect(pie).toHaveAttribute('data-name-key', 'name');
    expect(screen.getAllByTestId('cell')).toHaveLength(3);
  });

  it('cycles through the color palette, wrapping around when there are more slices than colors', () => {
    const manySlices: DistributionSlice[] = Array.from({ length: 7 }, (_, index) => ({
      name: `Tenant ${index}`,
      value: index + 1,
    }));
    render(<UserDistributionChart data={manySlices} />);

    const cells = screen.getAllByTestId('cell');
    expect(cells).toHaveLength(7);
    expect(cells[0]).toHaveAttribute('data-fill', cells[6].getAttribute('data-fill'));
  });
});
