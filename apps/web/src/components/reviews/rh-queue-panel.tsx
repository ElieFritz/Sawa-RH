'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { type AppSession, getSession } from '@/lib/session';

type QueueItem = {
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
    category: {
      id: string;
      nameFr: string;
      nameEn: string;
      slug: string;
    };
  };
};

type QueueResponse = {
  openRequests: QueueItem[];
  myAssignedRequests: QueueItem[];
};

export function RhQueuePanel() {
  const t = useTranslations('Reviews');
  const locale = useLocale();
  const router = useRouter();
  const [data, setData] = useState<QueueResponse>({
    openRequests: [],
    myAssignedRequests: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const totalQueue = data.openRequests.length + data.myAssignedRequests.length;

  useEffect(() => {
    void loadQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

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

  const loadQueue = async () => {
    const session = getSession();
    const blockedPath = getBlockedPath(session);

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch<QueueResponse>('/rh/queue', {
        accessToken: session.tokens.accessToken,
      });

      setData(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadError'));
      setData({
        openRequests: [],
        myAssignedRequests: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const assignRequest = async (requestId: string) => {
    const session = getSession();
    const blockedPath = getBlockedPath(session);

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    if (!session) {
      return;
    }

    setProcessingId(requestId);
    setError(null);

    try {
      await apiFetch(`/rh/requests/${requestId}/assign`, {
        method: 'POST',
        accessToken: session.tokens.accessToken,
      });

      router.push(`/${locale}/rh/request/${requestId}`);
    } catch (assignError) {
      setError(assignError instanceof Error ? assignError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const renderItem = (item: QueueItem, canAssign: boolean) => (
    <Card key={item.id} className="border-slate-950/8 bg-white text-slate-950">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
              {t(`status.${item.status}`)}
            </span>
            <h2 className="text-xl font-black tracking-tight text-slate-950">
              {item.cv.title}
            </h2>
            <p className="text-sm text-slate-600">
              {item.candidate.profile?.fullName || item.candidate.email}
            </p>
            <p className="text-sm text-slate-600">
              {item.candidate.profile?.headline || '-'}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-slate-950/8 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              {new Date(item.createdAt).toLocaleDateString(locale)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-[1.6rem] border border-slate-950/8 bg-slate-50 px-4 py-4 text-sm text-slate-600 sm:grid-cols-3">
          <p>
            <span className="font-semibold text-slate-950">{t('categoryLabel')}:</span>{' '}
            {locale === 'en' ? item.cv.category.nameEn : item.cv.category.nameFr}
          </p>
          <p>
            <span className="font-semibold text-slate-950">{t('locationLabel')}:</span>{' '}
            {item.candidate.profile?.city || '-'} / {item.candidate.profile?.country || '-'}
          </p>
          <p>
            <span className="font-semibold text-slate-950">{t('experienceLabel')}:</span>{' '}
            {t('experience', { value: item.candidate.profile?.yearsExperience ?? 0 })}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/${locale}/rh/request/${item.id}`}
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-border bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm"
          >
            {t('openRequest')}
          </Link>
          {canAssign ? (
            <Button
              type="button"
              disabled={processingId === item.id}
              onClick={() => void assignRequest(item.id)}
            >
              {processingId === item.id ? '...' : t('assignRequest')}
            </Button>
          ) : null}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
          <p className="inline-flex rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-100">
            {t('rhQueueEyebrow')}
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            {t('rhQueueTitle')}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
            {t('rhQueueDescription')}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">
                {isLoading ? '--' : data.openRequests.length}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricOpen')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">
                {isLoading ? '--' : data.myAssignedRequests.length}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricAssigned')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">
                {isLoading ? '--' : totalQueue}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricTotal')}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-[#f6f2e7]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t('queueOpsTitle')}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {t('queueOpsHeadline')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{t('queueOpsDescription')}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-200">
                {t('queueOpsCardOneLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('queueOpsCardOneTitle')}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-slate-950 ring-1 ring-slate-950/8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('queueOpsCardTwoLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('queueOpsCardTwoTitle')}</p>
            </div>
            <div className="rounded-3xl bg-amber-300 p-4 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {t('queueOpsCardThreeLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('queueOpsCardThreeTitle')}</p>
            </div>
            <div className="rounded-3xl bg-emerald-300 p-4 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {t('queueOpsCardFourLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('queueOpsCardFourTitle')}</p>
            </div>
          </div>
        </Card>
      </section>

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

      {!isLoading ? (
        <>
          <Card className="border-white/10 bg-white/95">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {t('openQueueEyebrow')}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {t('openQueue')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {t('openQueueDescription')}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t('openQueueStatLabel')}
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {data.openRequests.length}
                </p>
              </div>
            </div>
          </Card>
          {data.openRequests.length ? (
            data.openRequests.map((item) => renderItem(item, true))
          ) : (
            <Card>
              <p className="text-sm text-slate-600">{t('emptyOpen')}</p>
            </Card>
          )}

          <Card className="border-white/10 bg-white/95">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                  {t('myAssignedEyebrow')}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                  {t('myAssigned')}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {t('myAssignedDescription')}
                </p>
              </div>
              <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                  {t('myAssignedStatLabel')}
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {data.myAssignedRequests.length}
                </p>
              </div>
            </div>
          </Card>
          {data.myAssignedRequests.length ? (
            data.myAssignedRequests.map((item) => renderItem(item, false))
          ) : (
            <Card>
              <p className="text-sm text-slate-600">{t('emptyAssigned')}</p>
            </Card>
          )}
        </>
      ) : null}
    </div>
  );
}
