import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ChartTooltip, foldSlices, UserDistributionChart, type DistributionSlice } from './UserDistributionChart';

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
}));

const MOCK_DATA: DistributionSlice[] = [
  { name: 'Vela Corp', value: 10 },
  { name: 'Sicredi', value: 20 },
  { name: 'Nubank', value: 5 },
];

describe('UserDistributionChart', () => {
  it('renders a responsive donut wired up with the distribution sorted by size', () => {
    render(<UserDistributionChart data={MOCK_DATA} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    const pie = screen.getByTestId('pie');
    const sortedBySize = [MOCK_DATA[1], MOCK_DATA[0], MOCK_DATA[2]];
    expect(pie).toHaveAttribute('data-chart-data', JSON.stringify(sortedBySize));
    expect(pie).toHaveAttribute('data-key', 'value');
    expect(pie).toHaveAttribute('data-name-key', 'name');
    expect(screen.getAllByTestId('cell')).toHaveLength(3);
  });

  it('assigns the fixed categorical slots in order, never cycling hues', () => {
    render(<UserDistributionChart data={MOCK_DATA} />);

    const fills = screen.getAllByTestId('cell').map((cell) => cell.getAttribute('data-fill'));
    expect(fills).toEqual(['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)']);
  });

  it('shows the total in the donut center and a value-labeled legend row per slice', () => {
    render(<UserDistributionChart data={MOCK_DATA} />);

    expect(screen.getByText('35')).toBeInTheDocument();
    expect(screen.getByText('Sicredi')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.getByText('Vela Corp')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('folds slices beyond the five validated slots into a neutral "other" bucket', () => {
    const manySlices: DistributionSlice[] = Array.from({ length: 7 }, (_, index) => ({
      name: `Tenant ${index}`,
      value: index + 1,
    }));
    render(<UserDistributionChart data={manySlices} />);

    const cells = screen.getAllByTestId('cell');
    expect(cells).toHaveLength(5);
    expect(cells[4]).toHaveAttribute('data-fill', 'var(--chart-other)');

    // Kept slices are the four largest; the remaining 1+2+3 fold into "other".
    expect(screen.getByText('dashboard.charts.other')).toBeInTheDocument();
    expect(screen.getAllByText('6')).toHaveLength(2);
  });
});

describe('foldSlices', () => {
  it('returns the slices sorted by value when they fit the slots', () => {
    expect(foldSlices(MOCK_DATA, 'Other')).toEqual([
      { name: 'Sicredi', value: 20 },
      { name: 'Vela Corp', value: 10 },
      { name: 'Nubank', value: 5 },
    ]);
  });

  it('keeps the four largest and sums the rest into the other bucket', () => {
    const many = Array.from({ length: 6 }, (_, index) => ({ name: `T${index}`, value: index + 1 }));

    expect(foldSlices(many, 'Other')).toEqual([
      { name: 'T5', value: 6 },
      { name: 'T4', value: 5 },
      { name: 'T3', value: 4 },
      { name: 'T2', value: 3 },
      { name: 'Other', value: 3 },
    ]);
  });
});

describe('ChartTooltip', () => {
  it('renders the hovered slice name and value', () => {
    render(<ChartTooltip active payload={[{ name: 'Sicredi', value: 20 }]} />);

    expect(screen.getByText('Sicredi')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });

  it('renders nothing while no slice is hovered', () => {
    const { container } = render(<ChartTooltip active={false} payload={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
