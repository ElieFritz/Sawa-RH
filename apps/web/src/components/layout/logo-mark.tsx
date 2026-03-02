import { cn } from '@/lib/utils';

type LogoMarkProps = {
  compact?: boolean;
};

export function LogoMark({ compact = false }: LogoMarkProps) {
  return (
    <div className={cn('flex items-center gap-3', compact && 'gap-2')}>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-lg font-black text-primary-foreground shadow-[0_10px_30px_rgba(250,204,21,0.25)]">
        S
      </div>
      <div className="leading-none">
        <p className="text-lg font-black tracking-tight text-white">SAWA</p>
        <p className="-mt-0.5 text-lg font-black tracking-tight text-amber-300">RH</p>
      </div>
    </div>
  );
}
