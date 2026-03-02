import { getTranslations } from 'next-intl/server';

import { Card } from '@/components/ui/card';

export default async function PendingOnboardingPage() {
  const t = await getTranslations('Onboarding');

  return (
    <div className="mx-auto grid min-h-[70vh] max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="rounded-[2.2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_32px_110px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
        <p className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
          {t('pendingEyebrow')}
        </p>
        <h2 className="mt-4 text-3xl font-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          {t('pendingRailTitle')}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-300">{t('pendingRailDescription')}</p>
      </div>

      <Card className="mx-auto w-full max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          SAWA RH
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          {t('pendingTitle')}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {t('pendingDescription')}
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-950/6 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              01
            </p>
            <p className="mt-2 text-sm font-black text-slate-950">{t('pendingStepOne')}</p>
          </div>
          <div className="rounded-3xl border border-slate-950/6 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              02
            </p>
            <p className="mt-2 text-sm font-black text-slate-950">{t('pendingStepTwo')}</p>
          </div>
          <div className="rounded-3xl border border-slate-950/6 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              03
            </p>
            <p className="mt-2 text-sm font-black text-slate-950">{t('pendingStepThree')}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
