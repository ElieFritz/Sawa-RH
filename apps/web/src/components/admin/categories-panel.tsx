'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/session';

type CategoryItem = {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function CategoriesPanel() {
  const t = useTranslations('JobCategories');
  const locale = useLocale();
  const router = useRouter();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    void loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  const summary = useMemo(() => {
    const active = items.filter((item) => item.isActive).length;

    return {
      total: items.length,
      active,
      inactive: items.length - active,
    };
  }, [items]);

  const getBlockedPath = () => {
    const session = getSession();

    if (!session) {
      return `/${locale}/auth/login`;
    }

    if (session.user.role !== 'ADMIN' && session.user.role !== 'MODERATOR') {
      return `/${locale}/dashboard`;
    }

    return null;
  };

  const getAccessToken = () => {
    const blockedPath = getBlockedPath();

    if (blockedPath) {
      router.replace(blockedPath);
      return null;
    }

    const session = getSession();

    return session?.tokens.accessToken ?? null;
  };

  const loadCategories = async () => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiFetch<CategoryItem[]>('/admin/categories', {
        accessToken,
      });
      setItems(data);
    } catch (loadError) {
      setItems([]);
      setError(loadError instanceof Error ? loadError.message : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setNameFr('');
    setNameEn('');
    setSlug('');
    setSortOrder('');
  };

  const handleCreate = async () => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    if (!nameFr.trim() || !nameEn.trim()) {
      setError(t('validationError'));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await apiFetch<CategoryItem>('/admin/categories', {
        method: 'POST',
        accessToken,
        body: JSON.stringify({
          nameFr: nameFr.trim(),
          nameEn: nameEn.trim(),
          slug: slug.trim() || undefined,
          sortOrder: sortOrder ? Number(sortOrder) : undefined,
        }),
      });

      setItems((current) =>
        [...current, created].sort((left, right) => left.sortOrder - right.sortOrder),
      );
      resetForm();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : t('createError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (item: CategoryItem) => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    setProcessingId(item.id);
    setError(null);

    try {
      const updated = await apiFetch<CategoryItem>(`/admin/categories/${item.id}`, {
        method: 'PATCH',
        accessToken,
        body: JSON.stringify({
          isActive: !item.isActive,
        }),
      });

      setItems((current) =>
        current
          .map((entry) => (entry.id === updated.id ? updated : entry))
          .sort((left, right) => left.sortOrder - right.sortOrder),
      );
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (item: CategoryItem) => {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return;
    }

    setProcessingId(item.id);
    setError(null);

    try {
      const removed = await apiFetch<CategoryItem>(`/admin/categories/${item.id}`, {
        method: 'DELETE',
        accessToken,
      });

      setItems((current) => {
        const withoutRemoved = current.filter((entry) => entry.id !== item.id);

        if (!removed.isActive) {
          return [...withoutRemoved, removed].sort(
            (left, right) => left.sortOrder - right.sortOrder,
          );
        }

        return withoutRemoved;
      });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : t('actionError'));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.45)] backdrop-blur-2xl sm:p-8">
        <p className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
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
              <p className="text-2xl font-black text-white">{summary.total}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricTotal')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">{summary.active}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricActive')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">{summary.inactive}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricInactive')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-slate-950/8 bg-[#f6f2e7] text-slate-950">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t('formEyebrow')}
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {t('formTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t('formDescription')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-slate-700">
                {t('nameFrLabel')}
              </span>
              <Input
                value={nameFr}
                onChange={(event) => setNameFr(event.target.value)}
                placeholder={t('nameFrLabel')}
                className="border-slate-950/10 bg-white text-slate-950"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-slate-700">
                {t('nameEnLabel')}
              </span>
              <Input
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                placeholder={t('nameEnLabel')}
                className="border-slate-950/10 bg-white text-slate-950"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-slate-700">
                {t('slugLabel')}
              </span>
              <Input
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder={t('slugLabel')}
                className="border-slate-950/10 bg-white text-slate-950"
              />
            </label>
            <label className="space-y-2">
              <span className="block text-sm font-semibold text-slate-700">
                {t('sortOrderLabel')}
              </span>
              <Input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                placeholder={t('sortOrderLabel')}
                className="border-slate-950/10 bg-white text-slate-950"
              />
            </label>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              disabled={isSubmitting}
              className="sm:w-auto"
              onClick={() => void handleCreate()}
            >
              {isSubmitting ? '...' : t('createAction')}
            </Button>
            <p className="text-sm text-slate-500">{t('formHint')}</p>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="border-rose-200 bg-rose-50/95 text-slate-950">
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </Card>
      ) : null}

      <Card className="border-slate-950/8 bg-white text-slate-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t('listEyebrow')}
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {t('listTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t('listDescription')}</p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card className="border-slate-950/8 bg-white text-slate-950">
          <p className="text-sm text-slate-600">{t('loading')}</p>
        </Card>
      ) : null}

      {!isLoading && items.length === 0 ? (
        <Card className="border-slate-950/8 bg-white text-slate-950">
          <p className="text-sm text-slate-600">{t('empty')}</p>
        </Card>
      ) : null}

      {!isLoading
        ? items.map((item) => (
            <Card key={item.id} className="border-slate-950/8 bg-white text-slate-950">
              <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] ${
                          item.isActive
                            ? 'bg-emerald-300 text-slate-950'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {item.isActive ? t('statusActive') : t('statusInactive')}
                      </span>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                        #{item.sortOrder}
                      </span>
                    </div>
                    <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                      {locale === 'en' ? item.nameEn : item.nameFr}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {locale === 'en' ? item.nameFr : item.nameEn}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-500">{item.slug}</p>
                  </div>

                  <div className="flex flex-col gap-2 sm:items-end">
                    <Button
                      type="button"
                      variant="secondary"
                      className="sm:w-auto border border-slate-950/8 bg-slate-950 text-white ring-0 hover:bg-slate-900"
                      disabled={processingId === item.id}
                      onClick={() => void handleToggle(item)}
                    >
                      {processingId === item.id
                        ? '...'
                        : item.isActive
                          ? t('deactivateAction')
                          : t('activateAction')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="sm:w-auto border border-slate-950/8 bg-slate-100 text-slate-900 ring-0 hover:bg-slate-200"
                      disabled={processingId === item.id}
                      onClick={() => void handleDelete(item)}
                    >
                      {processingId === item.id ? '...' : t('deleteAction')}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <p>
                    <span className="font-semibold text-slate-950">{t('createdLabel')}:</span>{' '}
                    {new Date(item.createdAt).toLocaleDateString(locale)}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">{t('updatedLabel')}:</span>{' '}
                    {new Date(item.updatedAt).toLocaleDateString(locale)}
                  </p>
                </div>
              </div>
            </Card>
          ))
        : null}
    </div>
  );
}
