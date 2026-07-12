import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export const Card = ({ children, className = '' }: CardProps) => (
  <div
    className={`rounded-xl border border-border bg-card p-5 shadow-sm shadow-slate-900/[0.03] transition-shadow hover:shadow-md hover:shadow-slate-900/[0.05] dark:shadow-none ${className}`}
  >
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: CardProps) => (
  <div className={`mb-3 flex items-center justify-between gap-2 ${className}`}>{children}</div>
);

export const CardTitle = ({ children, className = '' }: CardProps) => (
  <h3 className={`text-sm font-medium text-muted-foreground ${className}`}>{children}</h3>
);

export const CardContent = ({ children, className = '' }: CardProps) => <div className={className}>{children}</div>;
