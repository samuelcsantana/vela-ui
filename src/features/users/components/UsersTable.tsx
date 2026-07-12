/* eslint-disable jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role --
   The responsive layout switches the table to `display: block` cards on
   mobile, which strips the native table semantics - so every table role
   (rowgroup/row/cell/...) is declared explicitly to keep the table navigable
   for screen readers. The linter can't see CSS and reports them as redundant. */
import { Pencil, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RoleBadge } from '../../../components/RoleBadge';
import { formatDate } from '../../../lib/format';
import type { User } from '../api/users-api';

interface UsersTableProps {
  users: User[] | undefined;
  isLoading: boolean;
  isError: boolean;
  showTenantColumn: boolean;
  onEdit: (user: User) => void;
  onDelete?: (user: User) => void;
}

const HEADER_CELL_CLASSNAME =
  'border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground';
const CELL_CLASSNAME =
  'flex justify-between items-center md:table-cell py-3 px-4 border-b border-border/70 last:border-0 md:border-0';
const CELL_LABEL_CLASSNAME = 'md:hidden font-bold text-gray-600 dark:text-gray-400';

export const UsersTable = ({ users, isLoading, isError, showTenantColumn, onEdit, onDelete }: UsersTableProps) => {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-muted-foreground">
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
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-muted-foreground">
        {t('users.table.empty')}
      </p>
    );
  }

  return (
    <div className="w-full md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm">
      <table role="table" className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t('users.table.caption')}</caption>
        <thead role="rowgroup" className="hidden md:table-header-group">
          <tr role="row" className="bg-muted/60 text-left">
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('users.fields.email')}
            </th>
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('users.fields.role')}
            </th>
            {showTenantColumn ? (
              <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
                {t('users.fields.tenant')}
              </th>
            ) : null}
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('users.fields.dateJoined')}
            </th>
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('users.fields.actions')}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block md:table-row-group">
          {users.map((user) => (
            <tr
              key={user.id}
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
                    {user.email.charAt(0).toUpperCase()}
                  </span>
                  {user.email}
                </span>
              </th>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.role')}</span>
                <RoleBadge role={user.role} />
              </td>
              {showTenantColumn ? (
                <td role="cell" className={`${CELL_CLASSNAME} text-muted-foreground`}>
                  <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.tenant')}</span>
                  {user.tenant.name}
                </td>
              ) : null}
              <td role="cell" className={`${CELL_CLASSNAME} text-muted-foreground`}>
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.dateJoined')}</span>
                {formatDate(user.createdAt, i18n.language)}
              </td>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>{t('users.fields.actions')}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    aria-label={t('users.editUser')}
                    className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(user)}
                      aria-label={t('users.deleteUser')}
                      className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:focus-visible:outline-white"
                    >
                      <Trash size={16} aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
