'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import {
  verificationQueueRoleValues,
  verificationStatusValues,
  type VerificationQueueRole,
  type VerificationStatus,
} from '@sawa-rh/shared';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/session';

type RoleFilter = VerificationQueueRole | 'ALL';

type VerificationItem = {
  id: string;
  email: string;
  role: VerificationQueueRole;
  createdAt: string;
  profile: {
    fullName: string | null;
    country: string | null;
    city: string | null;
    phone: string | null;
    headline: string | null;
    yearsExperience: number;
    completionStatus: 'INCOMPLETE' | 'COMPLETE';
    verificationStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
    verifiedBadge: boolean;
    updatedAt: string;
  } | null;
  reviewDecision: {
    decidedAt: string;
    decision: 'APPROVED' | 'REJECTED' | null;
    note: string | null;
    actor: {
      id: string;
      email: string;
      fullName: string | null;
    } | null;
  } | null;
};

export function VerificationsPanel() {
  const t = useTranslations('AdminVerifications');
  const locale = useLocale();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<RoleFilter>('ALL');
  const [selectedStatus, setSelectedStatus] =
    useState<VerificationStatus>('PENDING_REVIEW');
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    if (session.user.role !== 'ADMIN') {
      router.replace(`/${locale}/dashboard`);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          status: selectedStatus,
        });

        if (selectedRole !== 'ALL') {
          params.set('role', selectedRole);
        }

        const data = await apiFetch<VerificationItem[]>(
          `/admin/verifications?${params.toString()}`,
          {
            accessToken: session.tokens.accessToken,
          },
        );

        if (!cancelled) {
          setItems(data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : 'Unable to load verification requests.',
          );
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
  }, [locale, router, selectedRole, selectedStatus]);

  const pendingCount = items.filter(
    (item) => item.profile?.verificationStatus === 'PENDING_REVIEW',
  ).length;
  const resolvedCount = items.filter(
    (item) =>
      item.profile?.verificationStatus === 'APPROVED' ||
      item.profile?.verificationStatus === 'REJECTED',
  ).length;

  const activeScope = useMemo(() => {
    const roleLabel =
      selectedRole === 'ALL' ? t('roles.ALL') : t(`roles.${selectedRole}`);
    return `${roleLabel} | ${t(`statuses.${selectedStatus}`)}`;
  }, [selectedRole, selectedStatus, t]);

  const getStatusVariant = (
    status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | undefined,
  ) => {
    if (status === 'APPROVED') {
      return 'success' as const;
    }

    if (status === 'REJECTED') {
      return 'danger' as const;
    }

    return 'warning' as const;
  };

  const handleDecision = async (userId: string, decision: 'approve' | 'reject') => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    setProcessingId(userId);
    setError(null);

    try {
      await apiFetch(`/admin/verifications/${userId}/${decision}`, {
        method: 'POST',
        accessToken: session.tokens.accessToken,
        body: JSON.stringify({
          note: notes[userId]?.trim() || undefined,
        }),
      });

      setItems((currentItems) => currentItems.filter((item) => item.id !== userId));
      setNotes((currentNotes) => {
        const next = { ...currentNotes };
        delete next[userId];
        return next;
      });
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : 'The decision could not be saved.',
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
          <p className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
            {t('eyebrow')}
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            {t('title')}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
            {t('description')}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">{isLoading ? '--' : items.length}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricLoaded')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">{isLoading ? '--' : pendingCount}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricPending')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">
                {isLoading ? '--' : resolvedCount}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricResolved')}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-[#f6f2e7]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t('opsTitle')}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {t('opsHeadline')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{t('opsDescription')}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                {t('opsCardOneLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('opsCardOneTitle')}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-slate-950 ring-1 ring-slate-950/8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('opsCardTwoLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('opsCardTwoTitle')}</p>
            </div>
            <div className="rounded-3xl bg-amber-300 p-4 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {t('opsCardThreeLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('opsCardThreeTitle')}</p>
            </div>
            <div className="rounded-3xl bg-sky-300 p-4 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {t('opsCardFourLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('opsCardFourTitle')}</p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="border-white/10 bg-white/95">
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t('filtersEyebrow')}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {t('filtersTitle')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {t('filtersDescription')}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t('filterLabel')}
                </label>
                <Select
                  value={selectedRole}
                  onChange={(event) => setSelectedRole(event.target.value as RoleFilter)}
                >
                  <option value="ALL">{t('roles.ALL')}</option>
                  {verificationQueueRoleValues.map((role) => (
                    <option key={role} value={role}>
                      {t(`roles.${role}`)}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  {t('statusLabel')}
                </label>
                <Select
                  value={selectedStatus}
                  onChange={(event) =>
                    setSelectedStatus(event.target.value as VerificationStatus)
                  }
                >
                  {verificationStatusValues.map((status) => (
                    <option key={status} value={status}>
                      {t(`statuses.${status}`)}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              {t('queueNoteTitle')}
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight">{activeScope}</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">{t('queueNoteDescription')}</p>
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

      {!isLoading && items.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-600">{t('empty')}</p>
        </Card>
      ) : null}

      {!isLoading
        ? items.map((item) => {
            const status = item.profile?.verificationStatus || 'PENDING_REVIEW';
            const completionLabel =
              item.profile?.completionStatus === 'COMPLETE'
                ? t('completionComplete')
                : t('completionIncomplete');

            return (
              <Card key={item.id}>
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                          {t(`roles.${item.role}`)}
                        </span>
                        <Badge variant={getStatusVariant(status)}>
                          {t(`statuses.${status}`)}
                        </Badge>
                        {item.profile?.verifiedBadge ? (
                          <Badge variant="success">{t('verifiedBadge')}</Badge>
                        ) : null}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-950">
                          {item.profile?.fullName || t('anonymous')}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">{item.email}</p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {item.profile?.headline || t('noHeadline')}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:min-w-60">
                      <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {t('completionLabel')}
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {completionLabel}
                        </p>
                      </div>
                      <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {t('experience', {
                            value: item.profile?.yearsExperience ?? 0,
                          })}
                        </p>
                        <p className="mt-2 text-sm font-black text-slate-950">
                          {new Date(item.createdAt).toLocaleDateString(locale)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-4">
                    <p>
                      <span className="font-semibold text-slate-950">{t('emailLabel')}:</span>{' '}
                      {item.email}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">
                        {t('locationLabel')}:
                      </span>{' '}
                      {item.profile?.city || '-'} / {item.profile?.country || '-'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">{t('phoneLabel')}:</span>{' '}
                      {item.profile?.phone || '-'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">{t('updatedLabel')}:</span>{' '}
                      {new Date(
                        item.profile?.updatedAt || item.createdAt,
                      ).toLocaleDateString(locale)}
                    </p>
                  </div>

                  {item.reviewDecision ? (
                    <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-50/90 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {t('reviewTitle')}
                      </p>
                      <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('reviewerLabel')}:
                          </span>{' '}
                          {item.reviewDecision.actor?.fullName ||
                            item.reviewDecision.actor?.email ||
                            '-'}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('reviewDateLabel')}:
                          </span>{' '}
                          {new Date(item.reviewDecision.decidedAt).toLocaleDateString(locale)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-950">
                            {t('decisionLabel')}:
                          </span>{' '}
                          {item.reviewDecision.decision
                            ? t(`statuses.${item.reviewDecision.decision}`)
                            : '-'}
                        </p>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-slate-600">
                        {item.reviewDecision.note || t('noReviewNote')}
                      </p>
                    </div>
                  ) : null}

                  {status === 'PENDING_REVIEW' ? (
                    <div className="rounded-[1.8rem] border border-amber-200 bg-amber-50/90 p-5">
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
                          {t('pendingActionTitle')}
                        </p>
                        <p className="text-sm leading-7 text-amber-900">
                          {t('pendingActionDescription')}
                        </p>
                      </div>

                      <div className="mt-4 space-y-2">
                        <label className="text-sm font-medium text-slate-700">
                          {t('noteLabel')}
                        </label>
                        <Textarea
                          value={notes[item.id] ?? ''}
                          onChange={(event) =>
                            setNotes((currentNotes) => ({
                              ...currentNotes,
                              [item.id]: event.target.value,
                            }))
                          }
                          placeholder={t('notePlaceholder')}
                        />
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          disabled={processingId === item.id}
                          onClick={() => void handleDecision(item.id, 'approve')}
                        >
                          {processingId === item.id ? '...' : t('approve')}
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          disabled={processingId === item.id}
                          onClick={() => void handleDecision(item.id, 'reject')}
                        >
                          {processingId === item.id ? '...' : t('reject')}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>
            );
          })
        : null}
    </div>
  );
}
