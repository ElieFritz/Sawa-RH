import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type BadgeProps = PropsWithChildren<{
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}>;

export function Badge({
  children,
  className,
  variant = 'default',
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        variant === 'default' && 'bg-slate-100 text-slate-700',
        variant === 'success' && 'bg-emerald-100 text-emerald-700',
        variant === 'warning' && 'bg-amber-100 text-amber-700',
        variant === 'danger' && 'bg-rose-100 text-rose-700',
        className,
      )}
    >
      {children}
    </span>
  );
}
