import type { User } from '../api/mock-api';

interface UsersTableProps {
  users: User[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

const ROLE_LABELS: Record<User['role'], string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

const ROLE_BADGE_STYLES: Record<User['role'], string> = {
  admin: 'bg-purple-100 text-purple-700',
  editor: 'bg-blue-100 text-blue-700',
  viewer: 'bg-gray-100 text-gray-600',
};

const BADGE_CLASSNAME = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

const CELL_CLASSNAME =
  'flex justify-between items-center md:table-cell py-3 px-4 border-b border-gray-100 last:border-0 md:border-0';
const CELL_LABEL_CLASSNAME = 'md:hidden font-bold text-gray-600';

export const UsersTable = ({ users, isLoading, isError }: UsersTableProps) => {
  if (isLoading) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-slate-500">
        Loading users...
      </p>
    );
  }

  if (isError) {
    return (
      <p role="alert" aria-live="polite" className="py-8 text-center text-sm text-red-600">
        Unable to load users.
      </p>
    );
  }

  if (!users || users.length === 0) {
    return (
      <p role="status" aria-live="polite" className="py-8 text-center text-sm text-slate-500">
        No users found.
      </p>
    );
  }

  return (
    <div className="w-full md:rounded-xl md:border md:border-gray-200 md:bg-white md:shadow-sm md:overflow-hidden">
      <table role="table" className="w-full border-collapse text-left text-sm">
        <caption className="sr-only">List of registered users, with name, email, role and tenant</caption>
        <thead role="rowgroup" className="hidden md:table-header-group">
          <tr role="row" className="bg-gray-50/80 text-left">
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              Name
            </th>
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              Email
            </th>
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              Role
            </th>
            <th
              scope="col"
              role="columnheader"
              className="border-b border-gray-200 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500"
            >
              Tenant
            </th>
          </tr>
        </thead>
        <tbody role="rowgroup" className="block md:table-row-group">
          {users.map((user) => (
            <tr
              key={user.id}
              role="row"
              className="block md:table-row border border-gray-200 md:border-0 md:border-b md:last:border-0 mb-4 md:mb-0 bg-white rounded-xl shadow-sm md:shadow-none transition-colors hover:bg-gray-50/80"
            >
              <th scope="row" role="rowheader" className={`${CELL_CLASSNAME} text-left font-medium text-gray-900`}>
                <span className={CELL_LABEL_CLASSNAME}>Name</span>
                {user.name}
              </th>
              <td role="cell" className={`${CELL_CLASSNAME} text-gray-500`}>
                <span className={CELL_LABEL_CLASSNAME}>Email</span>
                {user.email}
              </td>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>Role</span>
                <span className={`${BADGE_CLASSNAME} ${ROLE_BADGE_STYLES[user.role]}`}>
                  {ROLE_LABELS[user.role]}
                </span>
              </td>
              <td role="cell" className={CELL_CLASSNAME}>
                <span className={CELL_LABEL_CLASSNAME}>Tenant</span>
                <span className={`${BADGE_CLASSNAME} bg-gray-100 text-gray-600`}>{user.tenantId}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
