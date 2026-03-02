'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/session';

type CvItem = {
  id: string;
  title: string;
  fileType: 'PDF' | 'DOCX';
  status: 'DRAFT' | 'ACTIVE' | 'HIDDEN' | 'DELETED';
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    nameFr: string;
    nameEn: string;
    slug: string;
  };
};

export function CvsPanel() {
  const t = useTranslations('CVs');
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<CvItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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
        const data = await apiFetch<CvItem[]>('/cvs/me', {
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
  const activeCount = items.filter((item) => item.status === 'ACTIVE').length;
  const hiddenCount = items.filter((item) => item.status === 'HIDDEN').length;

  const getStatusVariant = (status: CvItem['status']) => {
    if (status === 'ACTIVE') {
      return 'success' as const;
    }

    if (status === 'HIDDEN' || status === 'DELETED') {
      return 'danger' as const;
    }

    return 'warning' as const;
  };

  const handleSignedLink = async (cvId: string, type: 'view' | 'download') => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    setProcessingId(cvId);

    try {
      const result = await apiFetch<{ url: string }>(
        `/cvs/${cvId}/${type === 'view' ? 'view-url' : 'download-url'}`,
        {
          accessToken: session.tokens.accessToken,
        },
      );

      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleVisibility = async (item: CvItem) => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    setProcessingId(item.id);

    try {
      const updated = await apiFetch<CvItem>(`/cvs/${item.id}`, {
        method: 'PATCH',
        accessToken: session.tokens.accessToken,
        body: JSON.stringify({
          status: item.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN',
        }),
      });

      setItems((currentItems) =>
        currentItems.map((currentItem) =>
          currentItem.id === item.id ? { ...currentItem, ...updated } : currentItem,
        ),
      );
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (cvId: string) => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    setProcessingId(cvId);

    try {
      await apiFetch(`/cvs/${cvId}`, {
        method: 'DELETE',
        accessToken: session.tokens.accessToken,
      });

      setItems((currentItems) => currentItems.filter((item) => item.id !== cvId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleRequestReview = async (cvId: string) => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    setProcessingId(cvId);

    try {
      await apiFetch('/review-requests', {
        method: 'POST',
        accessToken: session.tokens.accessToken,
        body: JSON.stringify({
          cvId,
        }),
      });

      router.push(`/${locale}/dashboard/reviews`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('actionError'));
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
            {t('libraryTitle')}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
            {t('libraryDescription')}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">{isLoading ? '--' : totalCount}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricTotal')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">{isLoading ? '--' : activeCount}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricActive')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">{isLoading ? '--' : hiddenCount}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricHidden')}
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t('resultsEyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {t('resultsTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t('resultsDescription')}</p>
          </div>
          <Link
            href={`/${locale}/dashboard/cvs/new`}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto"
          >
            {t('newCv')}
          </Link>
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
            const reviewEnabled = item.status === 'ACTIVE';

            return (
              <Card key={item.id}>
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                          {item.fileType}
                        </span>
                        <Badge variant={getStatusVariant(item.status)}>
                          {t(`status.${item.status}`)}
                        </Badge>
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-950">
                          {item.title}
                        </h2>
                        <p className="mt-2 text-sm text-slate-600">
                          {locale === 'en' ? item.category.nameEn : item.category.nameFr}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3 sm:min-w-56">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {t('requestStateLabel')}
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-950">
                        {reviewEnabled ? t('requestReady') : t('requestBlocked')}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-4">
                    <p>
                      <span className="font-semibold text-slate-950">
                        {t('categoryLabel')}:
                      </span>{' '}
                      {locale === 'en' ? item.category.nameEn : item.category.nameFr}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">
                        {t('fileTypeLabel')}:
                      </span>{' '}
                      {item.fileType}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">
                        {t('createdLabel')}:
                      </span>{' '}
                      {new Date(item.createdAt).toLocaleDateString(locale)}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-950">
                        {t('updatedLabel')}:
                      </span>{' '}
                      {new Date(item.updatedAt).toLocaleDateString(locale)}
                    </p>
                  </div>

                  <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-50/90 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      {t('actionsLabel')}
                    </p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={processingId === item.id || !reviewEnabled}
                        onClick={() => void handleRequestReview(item.id)}
                      >
                        {t('requestReview')}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={processingId === item.id}
                        onClick={() => void handleSignedLink(item.id, 'view')}
                      >
                        {t('view')}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={processingId === item.id}
                        onClick={() => void handleSignedLink(item.id, 'download')}
                      >
                        {t('download')}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={processingId === item.id}
                        onClick={() => void handleToggleVisibility(item)}
                      >
                        {item.status === 'HIDDEN' ? t('show') : t('hide')}
                      </Button>
                      <Button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => void handleDelete(item.id)}
                      >
                        {t('delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        : null}
    </div>
  );
}
