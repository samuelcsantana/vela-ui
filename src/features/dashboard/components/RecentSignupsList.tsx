import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../lib/format';
import type { RecentSignup } from '../api/dashboard-api';

interface RecentSignupsListProps {
  signups: RecentSignup[];
}

export const RecentSignupsList = ({ signups }: RecentSignupsListProps) => {
  const { t } = useTranslation();

  if (signups.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-gray-400">{t('dashboard.recentSignups.empty')}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-gray-100 dark:divide-slate-700/60">
      {signups.map((signup) => (
        <li key={signup.id} className="flex items-center justify-between gap-2 py-2 text-sm">
          <span className="truncate font-medium text-slate-900 dark:text-white">{signup.email}</span>
          <span className="shrink-0 text-slate-500 dark:text-gray-400">{formatDate(signup.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
};
