import type { PropsWithChildren } from 'react';

import { cn } from '@/lib/utils';

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[2rem] border border-white/10 bg-white/92 p-6 text-slate-950 shadow-[0_28px_90px_rgba(2,6,23,0.24)] ring-1 ring-black/5 backdrop-blur-2xl',
        className,
      )}
    >
      {children}
    </div>
  );
}
