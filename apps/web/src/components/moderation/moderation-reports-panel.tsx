'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import {
  reportStatusValues,
  reportTargetTypeValues,
  type ReportStatus,
  type ReportTargetType,
} from '@sawa-rh/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/session';

type StatusFilter = ReportStatus | 'ALL';
type TargetFilter = ReportTargetType | 'ALL';

type ModerationItem = {
  id: string;
  reason: string;
  status: ReportStatus;
  createdAt: string;
  resolvedAt: string | null;
  targetType: ReportTargetType;
  targetId: string;
  reporter: {
    id: string;
    email: string;
    role: 'ADMIN' | 'MODERATOR' | 'RH_PRO' | 'CANDIDATE' | 'RECRUITER';
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    fullName: string | null;
  };
  targetCv: null | {
    id: string;
    title: string;
    status: 'DRAFT' | 'ACTIVE' | 'HIDDEN' | 'DELETED';
    fileType: 'PDF' | 'DOCX';
    category: {
      id: string;
      nameFr: string;
      nameEn: string;
      slug: string;
    };
    owner: {
      id: string;
      email: string;
      status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
      fullName: string | null;
    };
  };
  targetUser: null | {
    id: string;
    email: string;
    role: 'ADMIN' | 'MODERATOR' | 'RH_PRO' | 'CANDIDATE' | 'RECRUITER';
    status: 'ACTIVE' | 'SUSPENDED' | 'BANNED';
    profile: null | {
      fullName: string | null;
      country: string | null;
      city: string | null;
      phone: string | null;
      headline: string | null;
    };
  };
};

type ModerationResponse = {
  summary: {
    total: number;
    open: number;
    resolved: number;
    rejected: number;
    cvTargets: number;
    userTargets: number;
  };
  items: ModerationItem[];
};

const emptySummary: ModerationResponse['summary'] = {
  total: 0,
  open: 0,
  resolved: 0,
  rejected: 0,
  cvTargets: 0,
  userTargets: 0,
};

export function ModerationReportsPanel() {
  const t = useTranslations('Moderation');
  const locale = useLocale();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>('OPEN');
  const [selectedTargetType, setSelectedTargetType] = useState<TargetFilter>('ALL');
  const [data, setData] = useState<ModerationResponse>({
    summary: emptySummary,
    items: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    void loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router, selectedStatus, selectedTargetType]);

  const activeScope = useMemo(() => {
    const statusLabel =
      selectedStatus === 'ALL' ? t('filters.allStatuses') : t(`statuses.${selectedStatus}`);
    const targetLabel =
      selectedTargetType === 'ALL'
        ? t('filters.allTargets')
        : t(`targetTypes.${selectedTargetType}`);

    return `${targetLabel} | ${statusLabel}`;
  }, [selectedStatus, selectedTargetType, t]);

  const getBlockedPath = () => {
    const session = getSession();

    if (!session) {
      return `/${locale}/auth/login`;
    }

    if (session.user.role !== 'MODERATOR' && session.user.role !== 'ADMIN') {
      return `/${locale}/dashboard`;
    }

    return null;
  };

  const loadReports = async () => {
    const blockedPath = getBlockedPath();

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    const session = getSession();

    if (!session) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (selectedStatus !== 'ALL') {
        params.set('status', selectedStatus);
      }

      if (selectedTargetType !== 'ALL') {
        params.set('targetType', selectedTargetType);
      }

      const response = await apiFetch<ModerationResponse>(
        `/moderation/reports${params.size ? `?${params.toString()}` : ''}`,
        {
          accessToken: session.tokens.accessToken,
        },
      );

      setData(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t('loadError'));
      setData({
        summary: emptySummary,
        items: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resolveReport = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    const blockedPath = getBlockedPath();

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    const session = getSession();

    if (!session) {
      return;
    }

    setProcessingId(reportId);
    setError(null);

    try {
      await apiFetch(`/moderation/reports/${reportId}/resolve`, {
        method: 'POST',
        accessToken: session.tokens.accessToken,
        body: JSON.stringify({ status }),
      });

      await loadReports();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const hideCv = async (report: ModerationItem) => {
    const blockedPath = getBlockedPath();

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    const session = getSession();

    if (!session || !report.targetCv) {
      return;
    }

    setProcessingId(report.id);
    setError(null);

    try {
      await apiFetch(`/moderation/cvs/${report.targetCv.id}/hide`, {
        method: 'POST',
        accessToken: session.tokens.accessToken,
      });

      if (report.status === 'OPEN') {
        await apiFetch(`/moderation/reports/${report.id}/resolve`, {
          method: 'POST',
          accessToken: session.tokens.accessToken,
          body: JSON.stringify({ status: 'RESOLVED' }),
        });
      }

      await loadReports();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const banUser = async (report: ModerationItem) => {
    const blockedPath = getBlockedPath();

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    const session = getSession();
    const userId =
      report.targetType === 'USER' ? report.targetUser?.id : report.targetCv?.owner.id;

    if (!session || !userId) {
      return;
    }

    setProcessingId(report.id);
    setError(null);

    try {
      await apiFetch(`/moderation/users/${userId}/ban`, {
        method: 'POST',
        accessToken: session.tokens.accessToken,
      });

      if (report.status === 'OPEN') {
        await apiFetch(`/moderation/reports/${report.id}/resolve`, {
          method: 'POST',
          accessToken: session.tokens.accessToken,
          body: JSON.stringify({ status: 'RESOLVED' }),
        });
      }

      await loadReports();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusVariant = (status: ReportStatus) => {
    if (status === 'RESOLVED') {
      return 'success' as const;
    }

    if (status === 'REJECTED') {
      return 'danger' as const;
    }

    return 'warning' as const;
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
        <p className="inline-flex rounded-full border border-rose-300/20 bg-rose-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-rose-100">
          {t('eyebrow')}
        </p>
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{t('title')}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
              {t('description')}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">
                {isLoading ? '--' : data.summary.open}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricOpen')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">
                {isLoading ? '--' : data.summary.total}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricTotal')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">
                {isLoading ? '--' : data.summary.cvTargets + data.summary.userTargets}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricTargets')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-white/10 bg-white/95">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t('filters.title')}
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {t('filters.headline')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {t('filters.description')}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t('filters.statusLabel')}
              </label>
              <Select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as StatusFilter)}
              >
                <option value="ALL">{t('filters.allStatuses')}</option>
                {reportStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {t(`statuses.${status}`)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {t('filters.targetLabel')}
              </label>
              <Select
                value={selectedTargetType}
                onChange={(event) =>
                  setSelectedTargetType(event.target.value as TargetFilter)
                }
              >
                <option value="ALL">{t('filters.allTargets')}</option>
                {reportTargetTypeValues.map((targetType) => (
                  <option key={targetType} value={targetType}>
                    {t(`targetTypes.${targetType}`)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-950/8 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('scopeTitle')}
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">{activeScope}</p>
            </div>
            <div className="rounded-2xl border border-slate-950/8 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricResolved')}
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">{data.summary.resolved}</p>
            </div>
            <div className="rounded-2xl border border-slate-950/8 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricRejected')}
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">{data.summary.rejected}</p>
            </div>
          </div>
        </div>
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

      {!isLoading && data.items.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">{t('empty')}</p>
        </Card>
      ) : null}

      {!isLoading
        ? data.items.map((item) => {
            const targetLabel = t(`targetTypes.${item.targetType}`);
            const isOpen = item.status === 'OPEN';
            const isCvTarget = item.targetType === 'CV';
            const cvTarget = item.targetCv;
            const userTarget = item.targetUser;
            const canHide = isOpen && !!cvTarget && cvTarget.status !== 'HIDDEN';
            const canBan =
              isOpen &&
              ((item.targetType === 'USER' && !!userTarget && userTarget.status !== 'BANNED') ||
                (item.targetType === 'CV' &&
                  !!cvTarget?.owner &&
                  cvTarget.owner.status !== 'BANNED'));

            return (
              <Card key={item.id}>
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                          {targetLabel}
                        </span>
                        <Badge variant={getStatusVariant(item.status)}>
                          {t(`statuses.${item.status}`)}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-950">
                          {isCvTarget
                            ? cvTarget?.title || t('missingTargetTitle')
                            : userTarget?.profile?.fullName ||
                              userTarget?.email ||
                              t('missingTargetTitle')}
                        </h2>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{item.reason}</p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:min-w-60">
                      <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {t('createdLabel')}
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {new Date(item.createdAt).toLocaleDateString(locale)}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {t('resolvedLabel')}
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {item.resolvedAt
                            ? new Date(item.resolvedAt).toLocaleDateString(locale)
                            : t('pendingLabel')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                    <p>
                      <span className="font-semibold text-slate-950">{t('reporterLabel')}:</span>{' '}
                      {item.reporter.fullName || item.reporter.email}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">
                        {t('reporterRoleLabel')}:
                      </span>{' '}
                      {t(`roleLabels.${item.reporter.role}`)}
                    </p>
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-50/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t('targetCardTitle')}
                    </p>

                    {isCvTarget ? (
                      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('cvLabel')}:
                          </span>{' '}
                          {cvTarget?.title || t('missingTargetTitle')}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('categoryLabel')}:
                          </span>{' '}
                          {cvTarget
                            ? locale === 'en'
                              ? cvTarget.category.nameEn
                              : cvTarget.category.nameFr
                            : '-'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('targetOwnerLabel')}:
                          </span>{' '}
                          {cvTarget?.owner.fullName || cvTarget?.owner.email || '-'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('targetStatusLabel')}:
                          </span>{' '}
                          {cvTarget ? t(`cvStatuses.${cvTarget.status}`) : '-'}
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('userLabel')}:
                          </span>{' '}
                          {userTarget?.profile?.fullName || userTarget?.email || '-'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('targetRoleLabel')}:
                          </span>{' '}
                          {userTarget ? t(`roleLabels.${userTarget.role}`) : '-'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('targetStatusLabel')}:
                          </span>{' '}
                          {userTarget ? t(`userStatuses.${userTarget.status}`) : '-'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('targetContactLabel')}:
                          </span>{' '}
                          {userTarget?.email || '-'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {isOpen ? (
                      <>
                        <Button
                          type="button"
                          disabled={processingId === item.id}
                          onClick={() => void resolveReport(item.id, 'RESOLVED')}
                        >
                          {processingId === item.id ? '...' : t('resolveAction')}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={processingId === item.id}
                          onClick={() => void resolveReport(item.id, 'REJECTED')}
                        >
                          {processingId === item.id ? '...' : t('rejectAction')}
                        </Button>
                        {canHide ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={processingId === item.id}
                            onClick={() => void hideCv(item)}
                          >
                            {processingId === item.id ? '...' : t('hideCvAction')}
                          </Button>
                        ) : null}
                        {canBan ? (
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={processingId === item.id}
                            onClick={() => void banUser(item)}
                          >
                            {processingId === item.id ? '...' : t('banUserAction')}
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">{t('resolvedHint')}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        : null}
    </div>
  );
}
