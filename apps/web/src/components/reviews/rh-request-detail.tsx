'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ReportActionCard } from '@/components/reports/report-action-card';
import { apiFetch } from '@/lib/api';
import { type AppSession, getSession } from '@/lib/session';

type RequestDetail = {
  id: string;
  status: 'OPEN' | 'ASSIGNED' | 'SUBMITTED' | 'CLOSED';
  assignedRhId: string | null;
  createdAt: string;
  updatedAt: string;
  candidate: {
    id: string;
    email: string;
    profile: {
      fullName: string | null;
      country: string | null;
      city: string | null;
      phone: string | null;
      headline: string | null;
      yearsExperience: number;
    } | null;
  };
  cv: {
    id: string;
    title: string;
    fileType: 'PDF' | 'DOCX';
    searchableText: string | null;
    category: {
      id: string;
      nameFr: string;
      nameEn: string;
      slug: string;
    };
  };
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

type RhRequestDetailProps = {
  requestId: string;
};

const initialReviewForm = {
  scoreAts: '80',
  scoreReadability: '80',
  scoreConsistency: '80',
  globalNote: '',
  sectionProfile: '',
  sectionExperience: '',
  sectionSkills: '',
  suggestions: '',
  recommendedTemplate: '',
};

export function RhRequestDetail({ requestId }: RhRequestDetailProps) {
  const t = useTranslations('Reviews');
  const locale = useLocale();
  const router = useRouter();
  const [item, setItem] = useState<RequestDetail | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(initialReviewForm);

  useEffect(() => {
    void loadDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, locale, router]);

  const getBlockedPath = (session: AppSession | null) => {
    if (!session) {
      return `/${locale}/auth/login`;
    }

    if (session.user.role === 'ADMIN') {
      return null;
    }

    if (session.user.role !== 'RH_PRO') {
      return `/${locale}/dashboard`;
    }

    if (!session.user.profile || session.user.profile.completionStatus !== 'COMPLETE') {
      return `/${locale}/onboarding/profile`;
    }

    if (
      session.user.profile.verificationStatus !== 'APPROVED' ||
      !session.user.profile.verifiedBadge
    ) {
      return `/${locale}/onboarding/pending`;
    }

    return null;
  };

  const loadDetail = async () => {
    const session = getSession();
    const blockedPath = getBlockedPath(session);

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    if (!session) {
      return;
    }

    setViewerUserId(session.user.id);
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<RequestDetail>(`/rh/requests/${requestId}`, {
        accessToken: session.tokens.accessToken,
      });

      setItem(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadError'));
      setItem(null);
    } finally {
      setIsLoading(false);
    }
  };

  const assignRequest = async () => {
    const session = getSession();
    const blockedPath = getBlockedPath(session);

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    if (!session) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch<RequestDetail>(`/rh/requests/${requestId}/assign`, {
        method: 'POST',
        accessToken: session.tokens.accessToken,
      });

      setItem(response);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : t('actionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitReview = async () => {
    const session = getSession();
    const blockedPath = getBlockedPath(session);

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    if (!session) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiFetch(`/rh/requests/${requestId}/submit`, {
        method: 'POST',
        accessToken: session.tokens.accessToken,
        body: JSON.stringify({
          scoreAts: Number(form.scoreAts),
          scoreReadability: Number(form.scoreReadability),
          scoreConsistency: Number(form.scoreConsistency),
          globalNote: form.globalNote,
          sectionProfile: form.sectionProfile,
          sectionExperience: form.sectionExperience,
          sectionSkills: form.sectionSkills,
          suggestions: form.suggestions,
          recommendedTemplate: form.recommendedTemplate,
        }),
      });

      await loadDetail();
      setForm(initialReviewForm);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('actionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    !!item &&
    item.status === 'ASSIGNED' &&
    !item.review &&
    item.assignedRhId === viewerUserId;

  const canAssign = !!item && item.status === 'OPEN';

  const statusVariant = useMemo(() => {
    if (!item) {
      return 'default' as const;
    }

    if (item.status === 'SUBMITTED' || item.status === 'CLOSED') {
      return 'success' as const;
    }

    if (item.status === 'ASSIGNED') {
      return 'warning' as const;
    }

    return 'default' as const;
  }, [item]);

  const scoreCards = item?.review
    ? [
        {
          label: t('scoreAtsLabel'),
          value: item.review.scoreAts,
        },
        {
          label: t('scoreReadabilityLabel'),
          value: item.review.scoreReadability,
        },
        {
          label: t('scoreConsistencyLabel'),
          value: item.review.scoreConsistency,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {error ? (
        <Card className="border-rose-200 bg-rose-50/90">
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </Card>
      ) : null}

      {isLoading || !item ? (
        <Card>
          <p className="text-sm text-slate-600">{t('loading')}</p>
        </Card>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[2.2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
              <p className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
                {t('detailEyebrow')}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Badge variant={statusVariant}>{t(`status.${item.status}`)}</Badge>
                <span className="inline-flex rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                  {item.cv.fileType}
                </span>
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                {item.cv.title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
                {t('detailDescription')}
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-3xl font-black text-white">
                    {item.candidate.profile?.yearsExperience ?? 0}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('metricCandidateExperience')}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="truncate text-lg font-black text-white">
                    {locale === 'en' ? item.cv.category.nameEn : item.cv.category.nameFr}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('metricCategory')}
                  </p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-lg font-black text-white">
                    {new Date(item.createdAt).toLocaleDateString(locale)}
                  </p>
                  <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('metricOpened')}
                  </p>
                </div>
              </div>
            </div>

            <Card className="border-white/10 bg-[#f6f2e7]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t('detailOpsTitle')}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {t('detailOpsHeadline')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {t('detailOpsDescription')}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950 p-4 text-white">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
                    {t('detailOpsCardOneLabel')}
                  </p>
                  <p className="mt-2 text-lg font-black">{t('detailOpsCardOneTitle')}</p>
                </div>
                <div className="rounded-3xl bg-white p-4 text-slate-950 ring-1 ring-slate-950/8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t('detailOpsCardTwoLabel')}
                  </p>
                  <p className="mt-2 text-lg font-black">{t('detailOpsCardTwoTitle')}</p>
                </div>
                <div className="rounded-3xl bg-amber-300 p-4 text-slate-950">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                    {t('detailOpsCardThreeLabel')}
                  </p>
                  <p className="mt-2 text-lg font-black">{t('detailOpsCardThreeTitle')}</p>
                </div>
                <div className="rounded-3xl bg-emerald-300 p-4 text-slate-950">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                    {t('detailOpsCardFourLabel')}
                  </p>
                  <p className="mt-2 text-lg font-black">{t('detailOpsCardFourTitle')}</p>
                </div>
              </div>
            </Card>
          </section>

          <Card className="border-white/10 bg-white/95">
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    {t('candidateBriefEyebrow')}
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {t('candidateBriefTitle')}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {t('candidateBriefDescription')}
                  </p>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-950">{t('candidateLabel')}:</span>{' '}
                    {item.candidate.profile?.fullName || item.candidate.email}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">{t('contactLabel')}:</span>{' '}
                    {item.candidate.email} | {item.candidate.profile?.phone || '-'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">{t('locationLabel')}:</span>{' '}
                    {item.candidate.profile?.city || '-'} /{' '}
                    {item.candidate.profile?.country || '-'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">{t('experienceLabel')}:</span>{' '}
                    {t('experience', { value: item.candidate.profile?.yearsExperience ?? 0 })}
                  </p>
                </div>

                <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-50/90 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    {t('candidateHeadlineLabel')}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.candidate.profile?.headline || '-'}
                  </p>
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-950 p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
                  {t('cvBriefTitle')}
                </p>
                <p className="mt-3 text-2xl font-black tracking-tight">
                  {locale === 'en' ? item.cv.category.nameEn : item.cv.category.nameFr}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{t('cvBriefDescription')}</p>
                <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
                  <p>
                    <span className="font-semibold text-white">{t('fileTypeLabel')}:</span>{' '}
                    {item.cv.fileType}
                  </p>
                  <p>
                    <span className="font-semibold text-white">{t('statusLabel')}:</span>{' '}
                    {t(`status.${item.status}`)}
                  </p>
                  <p>
                    <span className="font-semibold text-white">{t('requestOpenedLabel')}:</span>{' '}
                    {new Date(item.createdAt).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="border-white/10 bg-white/95">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t('reportBlockTitle')}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {t('reportBlockHeadline')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {t('reportBlockDescription')}
            </p>
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <ReportActionCard targetType="CV" targetId={item.cv.id} />
              <ReportActionCard targetType="USER" targetId={item.candidate.id} />
            </div>
          </Card>

          <Card className="border-white/10 bg-white/95">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t('cvTextEyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {t('cvTextTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {t('cvTextDescription')}
            </p>
            <div className="mt-5 rounded-[1.8rem] border border-slate-950/8 bg-slate-50/90 p-5">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {item.cv.searchableText || t('noSnippet')}
              </p>
            </div>
          </Card>

          {canAssign ? (
            <Card className="border-white/10 bg-white/95">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    {t('assignBlockTitle')}
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {t('assignBlockHeadline')}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {t('assignBlockDescription')}
                  </p>
                </div>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  className="lg:max-w-56"
                  onClick={() => void assignRequest()}
                >
                  {isSubmitting ? '...' : t('assignRequest')}
                </Button>
              </div>
            </Card>
          ) : null}

          {item.review ? (
            <div className="space-y-6">
              <Card className="border-white/10 bg-white/95">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {t('scoresTitle')}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {t('reportSummaryTitle')}
                </h2>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {scoreCards.map((score) => (
                    <div
                      key={score.label}
                      className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {score.label}
                      </p>
                      <p className="mt-2 text-2xl font-black text-slate-950">
                        {score.value}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="border-white/10 bg-white/95">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
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
                </Card>

                <Card className="border-white/10 bg-slate-950 text-white">
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
                </Card>
              </div>
            </div>
          ) : null}

          {canSubmit ? (
            <Card className="border-white/10 bg-white/95">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                    {t('reviewComposerTitle')}
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {t('reviewComposerHeadline')}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {t('reviewComposerDescription')}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {t('scoreAtsLabel')}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.scoreAts}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, scoreAts: event.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {t('scoreReadabilityLabel')}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.scoreReadability}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          scoreReadability: event.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {t('scoreConsistencyLabel')}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.scoreConsistency}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          scoreConsistency: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  <Textarea
                    value={form.globalNote}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, globalNote: event.target.value }))
                    }
                    placeholder={t('globalNote')}
                  />
                  <Textarea
                    value={form.sectionProfile}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sectionProfile: event.target.value,
                      }))
                    }
                    placeholder={t('sectionProfile')}
                  />
                  <Textarea
                    value={form.sectionExperience}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sectionExperience: event.target.value,
                      }))
                    }
                    placeholder={t('sectionExperience')}
                  />
                  <Textarea
                    value={form.sectionSkills}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        sectionSkills: event.target.value,
                      }))
                    }
                    placeholder={t('sectionSkills')}
                  />
                  <Textarea
                    value={form.suggestions}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        suggestions: event.target.value,
                      }))
                    }
                    placeholder={t('suggestions')}
                  />
                  <Textarea
                    value={form.recommendedTemplate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        recommendedTemplate: event.target.value,
                      }))
                    }
                    placeholder={t('recommendedTemplate')}
                  />
                </div>

                <div className="flex justify-start">
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    className="sm:max-w-56"
                    onClick={() => void submitReview()}
                  >
                    {isSubmitting ? '...' : t('submitReview')}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
