import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { DistributionSlice } from '../mock-data';

const SLICE_COLORS = ['var(--color-brand)', '#32a852', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface UserDistributionChartProps {
  data: DistributionSlice[];
}

export const UserDistributionChart = ({ data }: UserDistributionChartProps) => (
  <div className="h-64 w-full">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={SLICE_COLORS[index % SLICE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);
