/* eslint-disable jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role --
   The responsive layout switches the table to `display: block` cards on
   mobile, which strips the native table semantics - so every table role
   (rowgroup/row/cell/...) is declared explicitly to keep the table navigable
   for screen readers. The linter can't see CSS and reports them as redundant. */
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../lib/format';
import type { User } from '../api/users-api';

interface UsersTableProps {
  users: User[] | undefined;
  isLoading: boolean;
  isError: boolean;
  showTenantColumn: boolean;
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  VELA_ADMIN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  MEMBER: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
};

const DEFAULT_ROLE_BADGE_STYLE = 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300';

const BADGE_CLASSNAME = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

const CELL_CLASSNAME =
  'flex justify-between items-center md:table-cell py-3 px-4 border-b border-gray-100 dark:border-slate-700/60 last:border-0 md:border-0';
const CELL_LABEL_CLASSNAME = 'md:hidden font-bold text-gray-600 dark:text-gray-400';

export const UsersTable = ({ users, isLoading, isError, showTenantColumn }: UsersTableProps) => {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">
        {t('users.table.loading')}
      </p>
    );
  }

  if (isError) {
    return (
      <p role="alert" aria-live="polite" className="py-8 text-center text-sm text-red-600 dark:text-red-400">
        {t('users.table.error')}
      </p>
    );
  }

  if (!users || users.length === 0) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">
        {t('users.table.empty')}
      </p>
    );
  }

  return (
    <div className="w-full md:rounded-xl md:border md:border-gray-200 md:bg-white md:shadow-sm md:overflow-hidden dark:md:border-slate-700 dark:md:bg-slate-900">
      <table role="table" className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t('users.table.caption')}</caption>
        <thead role="rowgroup" className="hidden md:table-header-group">
          <tr role="row" className="bg-gray-50/80 text-left dark:bg-slate-800/80">
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
            >
              {t('users.fields.email')}
            </th>
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
            >
              {t('users.fields.role')}
            </th>
            {showTenantColumn ? (
              <th
                scope="col"
                role="columnheader"
                className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
              >
                {t('users.fields.tenant')}
              </th>
            ) : null}
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
            >
              {t('users.fields.dateJoined')}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block md:table-row-group">
          {users.map((user) => (
            <tr
              key={user.id}
              role="row"
              className="block md:table-row border border-gray-200 md:border-0 md:border-b md:last:border-0 mb-4 md:mb-0 bg-white rounded-xl shadow-sm md:shadow-none transition-colors hover:bg-gray-50/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/80"
            >
              <th
                scope="row"
                role="rowheader"
                className={`${CELL_CLASSNAME} text-left font-medium text-gray-900 dark:text-white`}
              >
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.email')}</span>
                {user.email}
              </th>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.role')}</span>
                <span className={`${BADGE_CLASSNAME} ${ROLE_BADGE_STYLES[user.role] ?? DEFAULT_ROLE_BADGE_STYLE}`}>
                  {user.role}
                </span>
              </td>
              {showTenantColumn ? (
                <td role="cell" className={`${CELL_CLASSNAME} text-gray-500 dark:text-gray-400`}>
                  <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.tenant')}</span>
                  {user.tenant.name}
                </td>
              ) : null}
              <td role="cell" className={`${CELL_CLASSNAME} text-gray-500 dark:text-gray-400`}>
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.dateJoined')}</span>
                {formatDate(user.createdAt, i18n.language)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
