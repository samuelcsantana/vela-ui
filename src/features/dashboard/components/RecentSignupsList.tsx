import { useTranslation } from 'react-i18next';
import { RoleBadge } from '../../../components/RoleBadge';
import { formatDate } from '../../../lib/format';
import type { RecentSignup } from '../api/dashboard-api';

interface RecentSignupsListProps {
  signups: RecentSignup[];
}

export const RecentSignupsList = ({ signups }: RecentSignupsListProps) => {
  const { t, i18n } = useTranslation();

  if (signups.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('dashboard.recentSignups.empty')}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border/70">
      {signups.map((signup) => (
        <li key={signup.id} className="flex items-center gap-3 py-2.5 text-sm">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand"
          >
            {signup.email.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-slate-900 dark:text-white">{signup.email}</span>
          <RoleBadge role={signup.role} />
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatDate(signup.createdAt, i18n.language)}
          </span>
        </li>
      ))}
    </ul>
  );
};
