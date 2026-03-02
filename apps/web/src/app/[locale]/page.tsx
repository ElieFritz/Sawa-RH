import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

import { LandingNav } from '@/components/marketing/landing-nav';
import { getAbsoluteUrl, getLocaleAlternates } from '@/lib/seo';

type LandingPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Landing' });
  const title = t('heroTitle');
  const description = t('heroDescription');
  const canonical = getAbsoluteUrl(`/${locale}`);

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: getLocaleAlternates(),
    },
    openGraph: {
      type: 'website',
      url: canonical,
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      title,
      description,
      siteName: 'SAWA RH',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function LandingPage({ params }: LandingPageProps) {
  const { locale } = await params;
  const t = await getTranslations('Landing');
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'SAWA RH',
      url: getAbsoluteUrl(`/${locale}`),
      description: t('heroDescription'),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'SAWA RH',
      url: getAbsoluteUrl(`/${locale}`),
      inLanguage: locale,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'SAWA RH',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: getAbsoluteUrl(`/${locale}`),
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'EUR',
      },
      description: t('heroDescription'),
    },
  ];

  const challenges = [
    {
      accent: 'bg-amber-300',
      title: t('challengeCardOneTitle'),
      description: t('challengeCardOneDescription'),
    },
    {
      accent: 'bg-sky-300',
      title: t('challengeCardTwoTitle'),
      description: t('challengeCardTwoDescription'),
    },
    {
      accent: 'bg-emerald-300',
      title: t('challengeCardThreeTitle'),
      description: t('challengeCardThreeDescription'),
    },
  ];

  const tools = [
    {
      title: t('toolOneTitle'),
      description: t('toolOneDescription'),
      cta: t('toolOneCta'),
      accent: 'bg-amber-300',
    },
    {
      title: t('toolTwoTitle'),
      description: t('toolTwoDescription'),
      cta: t('toolTwoCta'),
      accent: 'bg-sky-300',
    },
    {
      title: t('toolThreeTitle'),
      description: t('toolThreeDescription'),
      cta: t('toolThreeCta'),
      accent: 'bg-emerald-300',
    },
  ];

  const plans = [
    {
      name: t('planCardOneTitle'),
      price: t('planCardOnePrice'),
      tone: 'border-slate-950/8 bg-white',
      points: [
        t('planCardOnePointOne'),
        t('planCardOnePointTwo'),
        t('planCardOnePointThree'),
      ],
    },
    {
      name: t('planCardTwoTitle'),
      price: t('planCardTwoPrice'),
      tone: 'border-amber-300/40 bg-white',
      points: [
        t('planCardTwoPointOne'),
        t('planCardTwoPointTwo'),
        t('planCardTwoPointThree'),
      ],
    },
  ];

  const integrations = [
    'API',
    'SMTP',
    'PDF',
    'DOCX',
    'RBAC',
    'Audit',
    'Storage',
    'Prisma',
  ];

  const faqs = [
    {
      question: t('faqOneQuestion'),
      answer: t('faqOneAnswer'),
    },
    {
      question: t('faqTwoQuestion'),
      answer: t('faqTwoAnswer'),
    },
    {
      question: t('faqThreeQuestion'),
      answer: t('faqThreeAnswer'),
    },
  ];

  return (
    <div className="min-h-screen text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="relative overflow-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10%] top-0 h-80 w-80 rounded-full bg-amber-300/15 blur-3xl" />
          <div className="absolute right-[-8%] top-16 h-96 w-96 rounded-full bg-sky-300/15 blur-3xl" />
          <div className="absolute bottom-20 left-1/3 h-72 w-72 rounded-full bg-orange-400/12 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-[520px] bg-[radial-gradient(circle_at_top,rgba(250,204,21,0.1),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl space-y-8">
          <LandingNav locale={locale} />

          <div className="grid gap-8 xl:grid-cols-[1.32fr_0.68fr]">
            <div className="space-y-8">
              <section className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-slate-950/78 p-3 shadow-[0_35px_120px_rgba(2,6,23,0.5)] backdrop-blur-2xl sm:p-4">
                <div className="rounded-[2.1rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.92))] p-5 sm:p-8">
                  <div className="mx-auto max-w-4xl text-center">
                    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                      {t('heroBadge')}
                    </span>
                    <h1
                      className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {t('heroTitle')}
                    </h1>
                    <p className="mx-auto mt-4 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
                      {t('heroDescription')}
                    </p>

                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <Link
                        href={`/${locale}/auth/register`}
                        className="inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-amber-200"
                      >
                        {t('primaryCta')}
                      </Link>
                      <Link
                        href={`/${locale}/auth/login`}
                        className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"
                      >
                        {t('secondaryCta')}
                      </Link>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left">
                        <p className="text-2xl font-black text-white">{t('heroMetricOneValue')}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {t('heroMetricOne')}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left">
                        <p className="text-2xl font-black text-white">{t('heroMetricTwoValue')}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {t('heroMetricTwo')}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left">
                        <p className="text-2xl font-black text-white">{t('heroMetricThreeValue')}</p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {t('heroMetricThree')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative mt-10 min-h-[320px] sm:min-h-[420px]">
                    <div className="absolute left-0 top-12 hidden w-40 rounded-[1.9rem] border border-white/10 bg-slate-950/82 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.35)] md:block lg:w-48">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {t('heroMenuTitle')}
                      </p>
                      <div className="mt-4 space-y-2">
                        <div className="rounded-2xl bg-amber-300 px-3 py-2 text-sm font-semibold text-slate-950">
                          {t('heroMenuOne')}
                        </div>
                        <div className="rounded-2xl bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-300">
                          {t('heroMenuTwo')}
                        </div>
                        <div className="rounded-2xl bg-white/[0.06] px-3 py-2 text-sm font-semibold text-slate-300">
                          {t('heroMenuThree')}
                        </div>
                      </div>
                    </div>

                    <div className="relative mx-auto max-w-4xl rounded-[2.6rem] border-[5px] border-slate-950 bg-slate-950 p-2 shadow-[0_40px_100px_rgba(15,23,42,0.35)]">
                      <div className="rounded-[2.1rem] bg-[#f6f2e7] p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-950/8 pb-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                              {t('heroSurfaceGreeting')}
                            </p>
                            <p className="mt-1 text-xl font-black text-slate-950">
                              {t('heroSurfaceTitle')}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white">
                            {t('heroSurfaceAudit')}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                          <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-3">
                              <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  {t('heroSurfaceQueue')}
                                </p>
                                <p className="mt-2 text-2xl font-black text-slate-950">12</p>
                              </div>
                              <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  {t('heroSurfaceAssigned')}
                                </p>
                                <p className="mt-2 text-2xl font-black text-slate-950">4</p>
                              </div>
                              <div className="rounded-3xl bg-slate-50 p-4">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                  {t('heroSurfaceCoverage')}
                                </p>
                                <p className="mt-2 text-2xl font-black text-slate-950">92%</p>
                              </div>
                            </div>

                            <div className="rounded-[1.8rem] bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-slate-700">
                                  {t('heroSurfaceSearch')}
                                </p>
                                <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-950">
                                  ATS
                                </span>
                              </div>
                              <div className="mt-5 grid h-36 grid-cols-6 items-end gap-3">
                                <div className="rounded-full bg-amber-200" style={{ height: '48%' }} />
                                <div className="rounded-full bg-sky-300" style={{ height: '68%' }} />
                                <div className="rounded-full bg-sky-500" style={{ height: '86%' }} />
                                <div className="rounded-full bg-slate-200" style={{ height: '42%' }} />
                                <div className="rounded-full bg-slate-300" style={{ height: '74%' }} />
                                <div className="rounded-full bg-emerald-400" style={{ height: '100%' }} />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="rounded-[1.8rem] bg-slate-50 p-4">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                                {t('heroPanelOneLabel')}
                              </p>
                              <div className="mt-4 space-y-3">
                                <div className="rounded-2xl bg-white p-3 shadow-[0_10px_25px_rgba(148,163,184,0.1)]">
                                  <p className="text-sm font-semibold text-slate-700">
                                    {t('heroPanelOneItemOne')}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-amber-300 p-3 text-slate-950 shadow-[0_14px_30px_rgba(250,204,21,0.24)]">
                                  <p className="text-sm font-semibold">
                                    {t('heroPanelOneItemTwo')}
                                  </p>
                                </div>
                                <div className="rounded-2xl bg-white p-3 shadow-[0_10px_25px_rgba(148,163,184,0.1)]">
                                  <p className="text-sm font-semibold text-slate-700">
                                    {t('heroPanelOneItemThree')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-[1.8rem] bg-slate-950 p-4 text-white">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                                {t('heroPanelTwoLabel')}
                              </p>
                              <p className="mt-2 text-lg font-black">
                                {t('heroPanelTwoTitle')}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-300">
                                {t('heroPanelTwoDescription')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-4 right-0 hidden w-44 rounded-[1.8rem] border border-white/10 bg-slate-950/82 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.35)] lg:block">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {t('heroFloatingLabel')}
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">36</p>
                      <p className="mt-1 text-sm text-slate-300">{t('heroFloatingDescription')}</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-[#f6f2e7] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.18)] sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                      {t('challengeEyebrow')}
                    </p>
                    <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      {t('challengeTitle')}
                    </h2>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                      {t('challengeDescription')}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">{t('challengeAnchor')}</span>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {challenges.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.8rem] border border-slate-100 bg-slate-50 p-4"
                    >
                      <div className={`h-2 w-14 rounded-full ${item.accent}`} />
                      <div className="mt-5 rounded-3xl border border-white/80 bg-white p-4 shadow-[0_12px_30px_rgba(148,163,184,0.08)]">
                        <div className="grid h-16 grid-cols-5 items-end gap-2">
                          <div className="rounded-full bg-slate-100" style={{ height: '42%' }} />
                          <div className="rounded-full bg-blue-200" style={{ height: '58%' }} />
                          <div className="rounded-full bg-blue-500" style={{ height: '74%' }} />
                          <div className="rounded-full bg-slate-200" style={{ height: '36%' }} />
                          <div className="rounded-full bg-emerald-400" style={{ height: '64%' }} />
                        </div>
                      </div>
                      <h3 className="mt-5 text-lg font-black text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-slate-950/78 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.22)] sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-100">
                  {t('toolsEyebrow')}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {t('toolsTitle')}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                  {t('toolsDescription')}
                </p>

                <div className="mt-8 grid gap-4 lg:grid-cols-3">
                  {tools.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-[1.8rem] border border-white/80 bg-white p-5 shadow-[0_16px_40px_rgba(148,163,184,0.12)]"
                    >
                      <div className="rounded-[1.4rem] bg-slate-50 p-4">
                        <div className="grid grid-cols-4 gap-2">
                          <div className={`h-3 rounded-full ${item.accent}`} />
                          <div className="h-3 rounded-full bg-slate-200" />
                          <div className="h-3 rounded-full bg-slate-100" />
                          <div className="h-3 rounded-full bg-slate-200" />
                        </div>
                        <div className="mt-4 grid gap-2">
                          <div className="h-3 rounded-full bg-slate-100" />
                          <div className="h-3 w-4/5 rounded-full bg-slate-200" />
                          <div className="h-3 w-3/5 rounded-full bg-slate-100" />
                        </div>
                      </div>
                      <h3 className="mt-5 text-lg font-black text-slate-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-slate-600">{item.description}</p>
                      <div className="mt-5">
                        <span className="inline-flex rounded-full bg-amber-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950">
                          {item.cta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[2rem] border border-white/10 bg-[#f6f2e7] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.18)]">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">
                    {t('planTitle')}
                  </h2>
                  <div className="inline-flex rounded-full bg-slate-100 p-1">
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                      {t('planPeriodMonth')}
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold text-slate-500">
                      {t('planPeriodYear')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4">
                  {plans.map((plan) => (
                    <div
                      key={plan.name}
                      className={`rounded-[1.8rem] border p-5 ${plan.tone}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-500">{plan.name}</p>
                          <p className="mt-2 text-2xl font-black text-slate-950">{plan.price}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                          SAWA
                        </span>
                      </div>
                      <div className="mt-5 space-y-3">
                        {plan.points.map((point) => (
                          <div key={point} className="flex items-start gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary" />
                            <p className="text-sm leading-6 text-slate-600">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-500">{t('planFootnote')}</p>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-slate-950/78 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.22)]">
                <h2 className="text-2xl font-black tracking-tight text-white">
                  {t('integrationsTitle')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  {t('integrationsDescription')}
                </p>
                <div className="mt-6 grid grid-cols-4 gap-3">
                  {integrations.map((item) => (
                    <div
                      key={item}
                      className="grid h-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-semibold uppercase tracking-[0.16em] text-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-white/10 bg-[#f6f2e7] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.18)]">
                <h2 className="text-2xl font-black tracking-tight text-slate-950">
                  {t('faqTitle')}
                </h2>
                <div className="mt-6 space-y-4">
                  {faqs.map((item, index) => (
                    <div key={item.question} className="rounded-[1.4rem] bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-black text-slate-950">{item.question}</p>
                        <span className="text-sm font-semibold text-primary">
                          0{index + 1}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/78 p-3 shadow-[0_24px_70px_rgba(2,6,23,0.22)]">
                <div className="rounded-[1.6rem] bg-[linear-gradient(135deg,rgba(15,23,42,0.96)_0%,rgba(2,6,23,0.96)_55%,rgba(17,24,39,0.96)_100%)] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
                    {t('newsletterEyebrow')}
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-white">
                    {t('newsletterTitle')}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    {t('newsletterDescription')}
                  </p>

                  <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4 shadow-[0_12px_35px_rgba(2,6,23,0.18)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          {t('newsletterCardLabel')}
                        </p>
                        <p className="mt-1 text-sm font-black text-white">
                          {t('newsletterCardTitle')}
                        </p>
                      </div>
                      <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-semibold text-slate-950">
                        +12
                      </span>
                    </div>
                    <div className="mt-4 grid gap-2">
                      <div className="h-3 rounded-full bg-white/20" />
                      <div className="h-3 w-4/5 rounded-full bg-white/10" />
                      <div className="h-3 w-3/5 rounded-full bg-white/15" />
                    </div>
                  </div>

                  <Link
                    href={`/${locale}/auth/register`}
                    className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-amber-200"
                  >
                    {t('newsletterCta')}
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
