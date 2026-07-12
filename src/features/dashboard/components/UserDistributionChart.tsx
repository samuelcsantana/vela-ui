import { useTranslation } from 'react-i18next';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export interface DistributionSlice {
  name: string;
  value: number;
}

// Fixed categorical slots (--chart-1..5 in globals.css), validated for CVD
// separation and surface contrast in both themes. The order is part of the
// validation — assign in order, never cycle.
const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];
const OTHER_COLOR = 'var(--chart-other)';
const MAX_SLICES = SERIES_COLORS.length;

// A 6th series is never a 6th hue: beyond the validated slots the smallest
// slices fold into a single neutral "other" bucket.
export function foldSlices(data: DistributionSlice[], otherLabel: string): DistributionSlice[] {
  const sorted = [...data].sort((a, b) => b.value - a.value);

  if (sorted.length <= MAX_SLICES) {
    return sorted;
  }

  const kept = sorted.slice(0, MAX_SLICES - 1);
  const folded = sorted.slice(MAX_SLICES - 1);

  return [...kept, { name: otherLabel, value: folded.reduce((sum, slice) => sum + slice.value, 0) }];
}

function sliceColor(index: number, sliceCount: number, wasFolded: boolean): string {
  const isOtherBucket = wasFolded && index === sliceCount - 1;
  return isOtherBucket ? OTHER_COLOR : SERIES_COLORS[index];
}

interface TooltipEntry {
  name: string;
  value: number;
}

// Recharts injects active/payload; exported so both branches are unit-testable.
export function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-1.5 text-xs shadow-md">
      <span className="font-medium text-popover-foreground">{payload[0].name}</span>
      <span className="ml-2 tabular-nums text-muted-foreground">{payload[0].value.toLocaleString('en-US')}</span>
    </div>
  );
}

interface UserDistributionChartProps {
  data: DistributionSlice[];
}

export const UserDistributionChart = ({ data }: UserDistributionChartProps) => {
  const { t } = useTranslation();
  const slices = foldSlices(data, t('dashboard.charts.other'));
  const wasFolded = data.length > MAX_SLICES;
  const total = data.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div className="relative h-52 w-52 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="72%"
              outerRadius="92%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((slice, index) => (
                <Cell key={slice.name} fill={sliceColor(index, slices.length, wasFolded)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {total.toLocaleString('en-US')}
          </span>
          <span className="max-w-24 text-center text-[11px] leading-tight text-muted-foreground">
            {t('dashboard.kpis.totalUsers')}
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-1 flex-col gap-1.5">
        {slices.map((slice, index) => (
          <li key={slice.name} className="flex min-w-0 items-center gap-2.5 rounded-md px-2 py-1 text-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: sliceColor(index, slices.length, wasFolded) }}
            />
            <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">{slice.name}</span>
            <span className="shrink-0 font-medium tabular-nums text-slate-900 dark:text-white">
              {slice.value.toLocaleString('en-US')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
