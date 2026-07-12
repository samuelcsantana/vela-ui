import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/Card';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const KpiCard = ({ label, value, icon: Icon }: KpiCardProps) => (
  <Card className="relative overflow-hidden">
    {/* Brand hairline anchoring the tile to the tenant's color. */}
    <span aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-brand/70 to-brand/10" />
    <CardHeader>
      <CardTitle>{label}</CardTitle>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-inset ring-brand/15">
        <Icon size={18} aria-hidden="true" />
      </span>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">{value}</p>
    </CardContent>
  </Card>
);
