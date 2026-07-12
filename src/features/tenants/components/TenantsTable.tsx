/* eslint-disable jsx-a11y/no-redundant-roles, jsx-a11y/no-interactive-element-to-noninteractive-role --
   The responsive layout switches the table to `display: block` cards on
   mobile, which strips the native table semantics - so every table role
   (rowgroup/row/cell/...) is declared explicitly to keep the table navigable
   for screen readers. The linter can't see CSS and reports them as redundant. */
import { Pencil, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../lib/format';
import type { Tenant } from '../api/tenants-api';

interface TenantsTableProps {
  tenants: Tenant[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
}

const HEADER_CELL_CLASSNAME =
  'border-b border-border px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground';
const CELL_CLASSNAME =
  'flex justify-between items-center md:table-cell py-3 px-4 border-b border-border/70 last:border-0 md:border-0';
const CELL_LABEL_CLASSNAME = 'md:hidden font-bold text-gray-600 dark:text-gray-400';

export const TenantsTable = ({ tenants, isLoading, isError, onEdit, onDelete }: TenantsTableProps) => {
  const { t, i18n } = useTranslation();

  if (isLoading) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-muted-foreground">
        {t('tenants.table.loading')}
      </p>
    );
  }

  if (isError) {
    return (
      <p role="alert" aria-live="polite" className="py-8 text-center text-sm text-red-600 dark:text-red-400">
        {t('tenants.table.error')}
      </p>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-muted-foreground">
        {t('tenants.table.empty')}
      </p>
    );
  }

  return (
    <div className="w-full md:overflow-hidden md:rounded-xl md:border md:border-border md:bg-card md:shadow-sm">
      <table role="table" className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t('tenants.table.caption')}</caption>
        <thead role="rowgroup" className="hidden md:table-header-group">
          <tr role="row" className="bg-muted/60 text-left">
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('tenants.fields.name')}
            </th>
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('tenants.fields.slug')}
            </th>
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('tenants.fields.primaryColor')}
            </th>
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('tenants.fields.dateCreated')}
            </th>
            <th scope="col" role="columnheader" className={HEADER_CELL_CLASSNAME}>
              {t('tenants.fields.actions')}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block md:table-row-group">
          {tenants.map((tenant) => (
            <tr
              key={tenant.id}
              role="row"
              className="mb-4 block rounded-xl border border-border bg-card shadow-sm transition-colors hover:bg-muted/40 md:mb-0 md:table-row md:border-0 md:border-b md:shadow-none md:last:border-0"
            >
              <th
                scope="row"
                role="rowheader"
                className={`${CELL_CLASSNAME} text-left font-medium text-gray-900 dark:text-white`}
              >
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.name')}</span>
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-sm font-semibold text-brand md:flex"
                  >
                    {tenant.name.charAt(0).toUpperCase()}
                  </span>
                  {tenant.name}
                </span>
              </th>
              <td role="cell" className={`${CELL_CLASSNAME} text-muted-foreground`}>
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.slug')}</span>
                <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-slate-700 dark:text-slate-300">
                  {tenant.slug}
                </code>
              </td>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.primaryColor')}</span>
                {tenant.primaryColor ? (
                  <span className="inline-flex items-center gap-2 tabular-nums">
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-md shadow-sm ring-1 ring-inset ring-slate-900/10 dark:ring-white/20"
                      style={{ backgroundColor: tenant.primaryColor }}
                    />
                    {tenant.primaryColor}
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </td>
              <td role="cell" className={`${CELL_CLASSNAME} text-muted-foreground`}>
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.dateCreated')}</span>
                {formatDate(tenant.createdAt, i18n.language)}
              </td>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.actions')}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(tenant)}
                    aria-label={t('tenants.editTenant')}
                    className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  {onDelete ? (
                    <button
                      type="button"
                      onClick={() => onDelete(tenant)}
                      aria-label={t('tenants.deleteTenant')}
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
