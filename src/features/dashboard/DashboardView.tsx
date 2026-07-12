import { Building2, ShieldCheck, UserCheck, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import type { DashboardMetrics } from './api/dashboard-api';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { KpiCard } from './components/KpiCard';
import { RecentSignupsList } from './components/RecentSignupsList';
import { UserDistributionChart, type DistributionSlice } from './components/UserDistributionChart';
import { useDashboardMetrics } from './hooks/use-dashboard-metrics';

interface KpiViewModel {
  id: string;
  labelKey: string;
  value: string;
  icon: LucideIcon;
}

function buildKpis(data: DashboardMetrics): KpiViewModel[] {
  if (data.scope === 'GLOBAL') {
    return [
      { id: 'totalCompanies', labelKey: 'dashboard.kpis.totalCompanies', value: data.totalTenants.toLocaleString('en-US'), icon: Building2 },
      { id: 'totalUsers', labelKey: 'dashboard.kpis.totalUsers', value: data.totalUsers.toLocaleString('en-US'), icon: Users },
    ];
  }

  const adminCount = data.usersByRole.find((entry) => entry.role === 'ADMIN')?.count ?? 0;
  const memberCount = data.usersByRole.find((entry) => entry.role === 'MEMBER')?.count ?? 0;

  return [
    { id: 'totalUsers', labelKey: 'dashboard.kpis.totalUsers', value: data.totalUsers.toLocaleString('en-US'), icon: Users },
    { id: 'admins', labelKey: 'dashboard.kpis.admins', value: adminCount.toLocaleString('en-US'), icon: ShieldCheck },
    { id: 'members', labelKey: 'dashboard.kpis.members', value: memberCount.toLocaleString('en-US'), icon: UserCheck },
  ];
}

function buildDistribution(data: DashboardMetrics): { slices: DistributionSlice[]; titleKey: string } {
  if (data.scope === 'GLOBAL') {
    return {
      slices: data.usersByTenant.map((entry) => ({ name: entry.tenantName, value: entry.userCount })),
      titleKey: 'dashboard.charts.usersByCompany',
    };
  }

  return {
    slices: data.usersByRole.map((entry) => ({ name: entry.role, value: entry.count })),
    titleKey: 'dashboard.charts.usersByRole',
  };
}

interface DashboardMetricsSectionProps {
  data: DashboardMetrics;
}

function DashboardMetricsSection({ data }: DashboardMetricsSectionProps) {
  const { t } = useTranslation();
  const kpis = buildKpis(data);
  const { slices, titleKey } = buildDistribution(data);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} label={t(kpi.labelKey)} value={kpi.value} icon={kpi.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t(titleKey)}</CardTitle>
          </CardHeader>
          <CardContent>
            <UserDistributionChart data={slices} />
          </CardContent>
        </Card>

        {data.scope === 'GLOBAL' ? (
          <Card>
            <CardHeader>
              <CardTitle>{t('dashboard.recentSignups.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentSignupsList signups={data.recentSignups} />
            </CardContent>
          </Card>
        ) : null}
      </div>
    </>
  );
}

export const DashboardView = () => {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useDashboardMetrics();

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {t('dashboard.welcome', { appName: t('common.appName') })}
        </h1>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      {isLoading ? <DashboardSkeleton /> : null}

      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          {t('dashboard.error')}
        </p>
      ) : null}

      {!isLoading && !isError && data ? <DashboardMetricsSection data={data} /> : null}
    </div>
  );
};
