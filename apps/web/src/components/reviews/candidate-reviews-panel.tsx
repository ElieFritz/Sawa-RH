'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ReportActionCard } from '@/components/reports/report-action-card';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/session';

type ReviewRequestItem = {
  id: string;
  status: 'OPEN' | 'ASSIGNED' | 'SUBMITTED' | 'CLOSED';
  assignedRhId: string | null;
  createdAt: string;
  updatedAt: string;
  cv: {
    id: string;
    title: string;
    fileType: 'PDF' | 'DOCX';
    category: {
      id: string;
      nameFr: string;
      nameEn: string;
      slug: string;
    };
  };
  assignedRh: {
    id: string;
    email: string;
    profile: {
      fullName: string | null;
    } | null;
  } | null;
  review: {
    id: string;
    scoreAts: number;
    scoreReadability: number;
    scoreConsistency: number;
    globalNote: string;
    sectionProfile: string;
    sectionExperience: string;
    sectionSkills: string;
    suggestions: string;
    recommendedTemplate: string;
    createdAt: string;
  } | null;
};

export function CandidateReviewsPanel() {
  const t = useTranslations('Reviews');
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<ReviewRequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    if (session.user.role !== 'CANDIDATE' && session.user.role !== 'ADMIN') {
      router.replace(`/${locale}/dashboard`);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await apiFetch<ReviewRequestItem[]>('/review-requests/me', {
          accessToken: session.tokens.accessToken,
        });

        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : t('loadError'));
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [locale, router, t]);

  const totalCount = items.length;
  const reportReadyCount = items.filter((item) => item.review).length;
  const pendingCount = items.filter((item) => !item.review).length;

  const getStatusVariant = (status: ReviewRequestItem['status']) => {
    if (status === 'SUBMITTED' || status === 'CLOSED') {
      return 'success' as const;
    }

    if (status === 'ASSIGNED') {
      return 'warning' as const;
    }

    return 'default' as const;
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
          <p className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-100">
            {t('candidateEyebrow')}
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            {t('candidateTitle')}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
            {t('candidateDescription')}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">{isLoading ? '--' : totalCount}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricReviewTotal')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">
                {isLoading ? '--' : reportReadyCount}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricReviewReady')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">
                {isLoading ? '--' : pendingCount}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricReviewPending')}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-[#f6f2e7]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t('candidateOpsTitle')}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {t('candidateOpsHeadline')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {t('candidateOpsDescription')}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200">
                {t('candidateOpsCardOneLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('candidateOpsCardOneTitle')}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-slate-950 ring-1 ring-slate-950/8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('candidateOpsCardTwoLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('candidateOpsCardTwoTitle')}</p>
            </div>
            <div className="rounded-3xl bg-amber-300 p-4 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {t('candidateOpsCardThreeLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('candidateOpsCardThreeTitle')}</p>
            </div>
            <div className="rounded-3xl bg-sky-300 p-4 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {t('candidateOpsCardFourLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('candidateOpsCardFourTitle')}</p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="border-white/10 bg-white/95">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
          {t('reviewFeedEyebrow')}
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
          {t('reviewFeedTitle')}
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{t('reviewFeedDescription')}</p>
      </Card>

      {error ? (
        <Card className="border-rose-200 bg-rose-50/90">
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </Card>
      ) : null}

      {isLoading ? (
        <Card>
          <p className="text-sm text-slate-600">{t('loading')}</p>
        </Card>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">{t('empty')}</p>
        </Card>
      ) : null}

      {!isLoading
        ? items.map((item) => (
            <Card key={item.id}>
              <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                        {item.cv.fileType}
                      </span>
                      <Badge variant={getStatusVariant(item.status)}>
                        {t(`status.${item.status}`)}
                      </Badge>
                    </div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-950">
                        {item.cv.title}
                      </h2>
                      <p className="mt-2 text-sm text-slate-600">
                        {locale === 'en' ? item.cv.category.nameEn : item.cv.category.nameFr}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3 sm:min-w-56">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {t('requestOpenedLabel')}
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-950">
                      {new Date(item.createdAt).toLocaleDateString(locale)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                  <p>
                    <span className="font-semibold text-slate-950">{t('statusLabel')}:</span>{' '}
                    {t(`status.${item.status}`)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">{t('assignedRh')}:</span>{' '}
                    {item.assignedRh
                      ? item.assignedRh.profile?.fullName || item.assignedRh.email
                      : '-'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">{t('submittedAtLabel')}:</span>{' '}
                    {item.review
                      ? new Date(item.review.createdAt).toLocaleDateString(locale)
                      : '-'}
                  </p>
                </div>

                {item.assignedRh ? (
                  <ReportActionCard targetType="USER" targetId={item.assignedRh.id} />
                ) : null}

                {item.review ? (
                  <div className="space-y-4">
                    <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-50/90 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {t('scoresTitle')}
                      </p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-3xl border border-slate-950/6 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {t('scoreAtsLabel')}
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {item.review.scoreAts}
                          </p>
                        </div>
                        <div className="rounded-3xl border border-slate-950/6 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {t('scoreReadabilityLabel')}
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {item.review.scoreReadability}
                          </p>
                        </div>
                        <div className="rounded-3xl border border-slate-950/6 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                            {t('scoreConsistencyLabel')}
                          </p>
                          <p className="mt-2 text-2xl font-black text-slate-950">
                            {item.review.scoreConsistency}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-50/90 p-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                          {t('reportSummaryTitle')}
                        </p>
                        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
                          <div>
                            <p className="font-semibold text-slate-950">{t('reviewSummaryLabel')}</p>
                            <p className="mt-1">{item.review.globalNote}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">
                              {t('reviewSuggestionsLabel')}
                            </p>
                            <p className="mt-1">{item.review.suggestions}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950">
                              {t('reviewTemplateLabel')}
                            </p>
                            <p className="mt-1">{item.review.recommendedTemplate}</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-950 p-5 text-white">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                          {t('reportDetailTitle')}
                        </p>
                        <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
                          <div>
                            <p className="font-semibold text-white">{t('reviewProfileLabel')}</p>
                            <p className="mt-1">{item.review.sectionProfile}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-white">
                              {t('reviewExperienceLabel')}
                            </p>
                            <p className="mt-1">{item.review.sectionExperience}</p>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{t('reviewSkillsLabel')}</p>
                            <p className="mt-1">{item.review.sectionSkills}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-[1.8rem] border border-amber-200 bg-amber-50/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                      {t('reportPendingTitle')}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-amber-900">
                      {t('reportPendingDescription')}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          ))
        : null}
    </div>
  );
}
