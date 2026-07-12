/* eslint-disable jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role --
   The responsive layout switches the table to `display: block` cards on
   mobile, which strips the native table semantics - so every table role
   (rowgroup/row/cell/...) is declared explicitly to keep the table navigable
   for screen readers. The linter can't see CSS and reports them as redundant. */
import { useTranslation } from 'react-i18next';
import { RoleBadge } from '../../../components/RoleBadge';
import { formatDate } from '../../../lib/format';
import type { RecentSignup } from '../api/dashboard-api';

interface RecentSignupsListProps {
  signups: RecentSignup[];
}

const HEADER_CELL_CLASSNAME =
  'border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground';
const CELL_CLASSNAME =
  'flex justify-between items-center md:table-cell py-3 px-4 border-b border-border/70 last:border-0 md:border-0';
const CELL_LABEL_CLASSNAME = 'md:hidden font-bold text-gray-600 dark:text-gray-400';

export const RecentSignupsList = ({ signups }: RecentSignupsListProps) => {
  const { t, i18n } = useTranslation();

  if (signups.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('dashboard.recentSignups.empty')}</p>;
  }

  return (
    <div className="w-full md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm">
      <table role="table" className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t('dashboard.recentSignups.caption')}</caption>
        <thead role="rowgroup" className="hidden md:table-header-group">
          <tr role="row" className="bg-muted/60 text-left">
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('users.fields.email')}
            </th>
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('users.fields.role')}
            </th>
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('users.fields.dateJoined')}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block md:table-row-group">
          {signups.map((signup) => (
            <tr
              key={signup.id}
              role="row"
              className="mb-4 block rounded-xl border border-border bg-card shadow-sm transition-colors hover:bg-muted/40 md:mb-0 md:table-row md:border-0 md:border-b md:shadow-none md:last:border-0"
            >
              <th
                scope="row"
                role="rowheader"
                className={`${CELL_CLASSNAME} text-left font-medium text-slate-900 dark:text-white`}
              >
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.email')}</span>
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-semibold text-brand md:flex"
                  >
                    {signup.email.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{signup.email}</span>
                </span>
              </th>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.role')}</span>
                <RoleBadge role={signup.role} />
              </td>
              <td role="cell" className={`${CELL_CLASSNAME} text-muted-foreground`}>
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.dateJoined')}</span>
                <span className="tabular-nums">{formatDate(signup.createdAt, i18n.language)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
