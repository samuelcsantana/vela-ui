import { Pencil, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../../lib/format';
import type { Tenant } from '../api/tenants-api';

interface TenantsTableProps {
  tenants: Tenant[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onEdit: (tenant: Tenant) => void;
  onDelete: (tenant: Tenant) => void;
}

const CELL_CLASSNAME =
  'flex justify-between items-center md:table-cell py-3 px-4 border-b border-gray-100 dark:border-slate-700/60 last:border-0 md:border-0';
const CELL_LABEL_CLASSNAME = 'md:hidden font-bold text-gray-600 dark:text-gray-400';

export const TenantsTable = ({ tenants, isLoading, isError, onEdit, onDelete }: TenantsTableProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">
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
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-slate-500 dark:text-gray-400">
        {t('tenants.table.empty')}
      </p>
    );
  }

  return (
    <div className="w-full md:rounded-xl md:border md:border-gray-200 md:bg-white md:shadow-sm md:overflow-hidden dark:md:border-slate-700 dark:md:bg-slate-900">
      <table role="table" className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">{t('tenants.table.caption')}</caption>
        <thead role="rowgroup" className="hidden md:table-header-group">
          <tr role="row" className="bg-gray-50/80 text-left dark:bg-slate-800/80">
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
            >
              {t('tenants.fields.name')}
            </th>
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
            >
              {t('tenants.fields.slug')}
            </th>
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
            >
              {t('tenants.fields.primaryColor')}
            </th>
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
            >
              {t('tenants.fields.dateCreated')}
            </th>
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-slate-700 dark:text-gray-400"
            >
              {t('tenants.fields.actions')}
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block md:table-row-group">
          {tenants.map((tenant) => (
            <tr
              key={tenant.id}
              role="row"
              className="block md:table-row border border-gray-200 md:border-0 md:border-b md:last:border-0 mb-4 md:mb-0 bg-white rounded-xl shadow-sm md:shadow-none transition-colors hover:bg-gray-50/80 dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800/80"
            >
              <th
                scope="row"
                role="rowheader"
                className={`${CELL_CLASSNAME} text-left font-medium text-gray-900 dark:text-white`}
              >
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.name')}</span>
                {tenant.name}
              </th>
              <td role="cell" className={`${CELL_CLASSNAME} text-gray-500 dark:text-gray-400`}>
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.slug')}</span>
                {tenant.slug}
              </td>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.primaryColor')}</span>
                {tenant.primaryColor ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 rounded-full border border-gray-200 dark:border-slate-700"
                      style={{ backgroundColor: tenant.primaryColor }}
                    />
                    {tenant.primaryColor}
                  </span>
                ) : (
                  <span className="text-gray-400 dark:text-gray-500">—</span>
                )}
              </td>
              <td role="cell" className={`${CELL_CLASSNAME} text-gray-500 dark:text-gray-400`}>
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.dateCreated')}</span>
                {formatDate(tenant.createdAt)}
              </td>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>{t('tenants.fields.actions')}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(tenant)}
                    aria-label={t('tenants.editTenant')}
                    className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white"
                  >
                    <Pencil size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(tenant)}
                    aria-label={t('tenants.deleteTenant')}
                    className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 dark:text-gray-400 dark:hover:bg-red-950/40 dark:hover:text-red-400 dark:focus-visible:outline-white"
                  >
                    <Trash size={16} aria-hidden="true" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
