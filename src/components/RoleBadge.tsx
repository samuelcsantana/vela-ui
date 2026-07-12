const ROLE_BADGE_STYLES: Record<string, string> = {
  VELA_ADMIN: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300',
  MEMBER: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
};

const DEFAULT_ROLE_BADGE_STYLE = 'bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-300';

interface RoleBadgeProps {
  role: string;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      ROLE_BADGE_STYLES[role] ?? DEFAULT_ROLE_BADGE_STYLE
    }`}
  >
    {role}
  </span>
);
