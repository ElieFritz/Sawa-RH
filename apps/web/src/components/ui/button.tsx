import * as React from 'react';

import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'secondary' | 'ghost';
};

export function Button({
  className,
  variant = 'default',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'default' &&
          'bg-primary text-primary-foreground shadow-glow hover:-translate-y-0.5',
        variant === 'secondary' &&
          'bg-white/80 text-slate-900 ring-1 ring-white/60 backdrop-blur hover:bg-white',
        variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-white/60',
        className,
      )}
      {...props}
    />
  );
}
