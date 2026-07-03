import { Building2, DollarSign, ShieldCheck, UserCheck, UserPlus, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/Card';
import { useAuthStore } from '../auth/store/auth-store';
import { KpiCard } from './components/KpiCard';
import { UserDistributionChart } from './components/UserDistributionChart';
import { UserGrowthChart } from './components/UserGrowthChart';
import { mockTenantAdminDashboard, mockVelaAdminDashboard, type KpiId } from './mock-data';

const KPI_ICONS: Record<KpiId, LucideIcon> = {
  totalCompanies: Building2,
  totalUsers: Users,
  activeUsers: UserCheck,
  mrr: DollarSign,
  newSignups: UserPlus,
  teamAdmins: ShieldCheck,
};

export const DashboardView = () => {
  const { t } = useTranslation();
  const role = useAuthStore((state) => state.user?.role);
  const data = role === 'VELA_ADMIN' ? mockVelaAdminDashboard : mockTenantAdminDashboard;

  return (
    <div className="flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {t('dashboard.welcome', { appName: t('common.appName') })}
        </h1>
        <p className="text-slate-500 dark:text-gray-400">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} label={t(`dashboard.kpis.${kpi.id}`)} value={kpi.value} icon={KPI_ICONS[kpi.id]} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.charts.userGrowth')}</CardTitle>
          </CardHeader>
          <CardContent>
            <UserGrowthChart data={data.userGrowth} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t(data.distributionLabelKey)}</CardTitle>
          </CardHeader>
          <CardContent>
            <UserDistributionChart data={data.distribution} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
