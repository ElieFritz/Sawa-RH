import type { PropsWithChildren } from 'react';

import { Card } from '@/components/ui/card';

type AuthPanelHighlight = {
  label: string;
  value: string;
  description: string;
  tone?: 'amber' | 'sky' | 'emerald';
};

type AuthPanelProps = PropsWithChildren<{
  eyebrow: string;
  title: string;
  description: string;
  railTitle: string;
  railDescription: string;
  highlights: AuthPanelHighlight[];
  footerNote: string;
}>;

export function AuthPanel({
  eyebrow,
  title,
  description,
  railTitle,
  railDescription,
  highlights,
  footerNote,
  children,
}: AuthPanelProps) {
  const toneClassMap: Record<NonNullable<AuthPanelHighlight['tone']>, string> = {
    amber: 'bg-amber-300 text-slate-950',
    sky: 'bg-sky-300 text-slate-950',
    emerald: 'bg-emerald-300 text-slate-950',
  };

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
      <div className="rounded-[2.2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_32px_110px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
        <div className="space-y-4">
          <p className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
            {eyebrow}
          </p>
          <h2 className="text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            {railTitle}
          </h2>
          <p className="text-sm leading-7 text-slate-300">{railDescription}</p>
        </div>

        <div className="mt-6 grid gap-4">
          {highlights.map((item) => (
            <div
              key={`${item.label}-${item.value}`}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {item.label}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                    toneClassMap[item.tone ?? 'amber']
                  }`}
                >
                  {item.value}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-300">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-0">
        <div className="border-b border-slate-950/6 px-6 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            SAWA RH
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
          <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
        </div>
        <div className="px-6 py-6 sm:px-8">{children}</div>
        <div className="border-t border-slate-950/6 px-6 py-4 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            {footerNote}
          </p>
        </div>
      </Card>
    </section>
  );
}
