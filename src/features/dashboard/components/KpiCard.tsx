import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/Card';

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const KpiCard = ({ label, value, icon: Icon }: KpiCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{label}</CardTitle>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon size={18} aria-hidden="true" />
      </span>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </CardContent>
  </Card>
);
