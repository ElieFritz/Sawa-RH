import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { Card } from '@/components/ui/card';

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Dashboard');
  const quickLinks = [
    {
      href: `/${locale}/dashboard/cvs`,
      label: t('candidateManage'),
      value: '01',
      tone: 'bg-amber-300 text-slate-950',
    },
    {
      href: `/${locale}/dashboard/cvs/new`,
      label: t('candidateUpload'),
      value: '02',
      tone: 'bg-white text-slate-950',
    },
    {
      href: `/${locale}/dashboard/reviews`,
      label: t('candidateReviews'),
      value: '03',
      tone: 'bg-sky-300 text-slate-950',
    },
    {
      href: `/${locale}/search/cvs`,
      label: t('searchCvBank'),
      value: '04',
      tone: 'bg-emerald-300 text-slate-950',
    },
    {
      href: `/${locale}/rh/queue`,
      label: t('rhQueue'),
      value: '05',
      tone: 'bg-white text-slate-950',
    },
    {
      href: `/${locale}/admin/verifications`,
      label: t('adminVerifications'),
      value: '06',
      tone: 'bg-white text-slate-950',
    },
    {
      href: `/${locale}/moderation/reports`,
      label: t('moderationReports'),
      value: '07',
      tone: 'bg-rose-300 text-slate-950',
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
        <p className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
          {t('eyebrow')}
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-3xl font-black tracking-tight sm:text-4xl">
              {t('title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {t('description')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">6</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricModules')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">5</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricRoles')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">1</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricAudit')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t('quickAccess')}
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {t('quickAccessTitle')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{t('quickAccessDescription')}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group rounded-3xl border border-slate-950/6 bg-slate-50 p-4 transition hover:border-slate-950/12"
              >
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${link.tone}`}
                >
                  {link.value}
                </span>
                <p className="mt-4 text-base font-black text-slate-950">{link.label}</p>
                <p className="mt-2 text-sm text-slate-600">
                  {t('quickAccessHint')}
                </p>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="border-white/10 bg-slate-950 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
            {t('governanceTitle')}
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
            {t('governanceHeadline')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-300">{t('governanceDescription')}</p>

          <div className="mt-6 space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-black text-white">{t('governancePointOneTitle')}</p>
              <p className="mt-2 text-sm text-slate-300">
                {t('governancePointOneDescription')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-black text-white">{t('governancePointTwoTitle')}</p>
              <p className="mt-2 text-sm text-slate-300">
                {t('governancePointTwoDescription')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-sm font-black text-white">{t('governancePointThreeTitle')}</p>
              <p className="mt-2 text-sm text-slate-300">
                {t('governancePointThreeDescription')}
              </p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
