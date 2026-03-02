'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ReportActionCard } from '@/components/reports/report-action-card';
import { apiFetch } from '@/lib/api';
import { type AppSession, getSession } from '@/lib/session';

type JobCategory = {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
};

type SearchResult = {
  id: string;
  title: string;
  fileType: 'PDF' | 'DOCX';
  createdAt: string;
  updatedAt: string;
  snippet: string | null;
  relevance: number;
  category: {
    id: string;
    nameFr: string;
    nameEn: string;
    slug: string;
  };
  owner: {
    userId: string;
    fullName: string | null;
    email: string;
    phone: string | null;
    country: string | null;
    city: string | null;
    headline: string | null;
    yearsExperience: number;
  };
};

type SearchResponse = {
  items: SearchResult[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export function SearchCvsPanel() {
  const t = useTranslations('Search');
  const locale = useLocale();
  const router = useRouter();
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [items, setItems] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [expMin, setExpMin] = useState('');
  const [expMax, setExpMax] = useState('');
  const [sort, setSort] = useState<'recent' | 'relevance'>('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkLoadingId, setLinkLoadingId] = useState<string | null>(null);
  const activeFilterCount = [
    query.trim(),
    category,
    country.trim(),
    city.trim(),
    expMin,
    expMax,
    sort === 'relevance' ? 'relevance' : '',
  ].filter(Boolean).length;

  useEffect(() => {
    void loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, router]);

  const getBlockedPath = (session: AppSession | null) => {
    if (!session) {
      return `/${locale}/auth/login`;
    }

    const { role, profile } = session.user;

    if (role === 'CANDIDATE') {
      return `/${locale}/dashboard`;
    }

    if (role === 'RH_PRO' || role === 'RECRUITER') {
      if (!profile || profile.completionStatus !== 'COMPLETE') {
        return `/${locale}/onboarding/profile`;
      }

      if (profile.verificationStatus !== 'APPROVED') {
        return `/${locale}/onboarding/pending`;
      }

      if (role === 'RH_PRO' && !profile.verifiedBadge) {
        return `/${locale}/onboarding/pending`;
      }
    }

    return null;
  };

  const loadInitialData = async () => {
    const session = getSession();
    const blockedPath = getBlockedPath(session);

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    if (!session) {
      return;
    }

    try {
      const data = await apiFetch<JobCategory[]>('/job-categories/active', {
        accessToken: session.tokens.accessToken,
      });
      setCategories(data);
    } catch {
      setCategories([]);
    }

    await performSearch(1);
  };

  const performSearch = async (nextPage = page) => {
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
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: '10',
        sort,
      });

      if (query.trim()) params.set('query', query.trim());
      if (category) params.set('category', category);
      if (country.trim()) params.set('country', country.trim());
      if (city.trim()) params.set('city', city.trim());
      if (expMin) params.set('expMin', expMin);
      if (expMax) params.set('expMax', expMax);

      const response = await apiFetch<SearchResponse>(`/search/cvs?${params.toString()}`, {
        accessToken: session.tokens.accessToken,
      });

      setItems(response.items);
      setPage(response.page);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (searchError) {
      setItems([]);
      setTotalPages(0);
      setTotal(0);
      setError(searchError instanceof Error ? searchError.message : t('loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  const openSignedUrl = async (cvId: string, type: 'view' | 'download') => {
    const session = getSession();
    const blockedPath = getBlockedPath(session);

    if (blockedPath) {
      router.replace(blockedPath);
      return;
    }

    if (!session) {
      return;
    }

    setLinkLoadingId(cvId);
    setError(null);

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
      setLinkLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
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
              <p className="text-2xl font-black text-white">{isLoading ? '--' : total}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricResults')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">{activeFilterCount}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricFilters')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-2xl font-black text-white">{categories.length}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('metricCategories')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Card className="border-white/10 bg-white/95">
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t('filterEyebrow')}
            </p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              {t('filterTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t('filterDescription')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('queryPlaceholder')}</label>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('queryPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('categoryLabel')}</label>
              <Select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">{t('allCategories')}</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {locale === 'en' ? item.nameEn : item.nameFr}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('resultModeLabel')}</label>
              <Select
                value={sort}
                onChange={(event) => setSort(event.target.value as 'recent' | 'relevance')}
              >
                <option value="recent">{t('sortRecent')}</option>
                <option value="relevance">{t('sortRelevance')}</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                {t('countryPlaceholder')}
              </label>
              <Input
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                placeholder={t('countryPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('cityPlaceholder')}</label>
              <Input
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder={t('cityPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('expMin')}</label>
                <Input
                  type="number"
                  min={0}
                  value={expMin}
                  onChange={(event) => setExpMin(event.target.value)}
                  placeholder={t('expMin')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">{t('expMax')}</label>
                <Input
                  type="number"
                  min={0}
                  value={expMax}
                  onChange={(event) => setExpMax(event.target.value)}
                  placeholder={t('expMax')}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Button type="button" className="sm:max-w-48" onClick={() => void performSearch(1)}>
              {t('searchAction')}
            </Button>
            <div className="rounded-2xl border border-slate-950/8 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              {t('activeFilterCount', { count: activeFilterCount })}
            </div>
            <div className="rounded-2xl border border-slate-950/8 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
              {totalPages > 0 ? t('pageInfo', { page, totalPages }) : t('pageZero')}
            </div>
          </div>
        </div>
      </Card>

      {error ? (
        <Card className="border-rose-200 bg-rose-50/90">
          <p className="text-sm font-medium text-rose-700">{error}</p>
        </Card>
      ) : null}

      <Card className="border-white/10 bg-white/95">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {t('resultsEyebrow')}
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              {t('resultsTitle')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{t('resultsCount', { total })}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('resultModeLabel')}
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {sort === 'relevance' ? t('sortRelevance') : t('sortRecent')}
              </p>
            </div>
            <div className="rounded-3xl border border-slate-950/6 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('resultPagesLabel')}
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {totalPages > 0 ? t('pageInfo', { page, totalPages }) : t('pageZero')}
              </p>
            </div>
          </div>
        </div>
      </Card>

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
            <Card key={item.id} className="border-slate-950/8 bg-white text-slate-950">
              <div className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white">
                      {item.fileType}
                    </span>
                    <h2 className="text-xl font-black tracking-tight text-slate-950">
                      {item.title}
                    </h2>
                    <p className="text-sm text-slate-600">
                      {locale === 'en' ? item.category.nameEn : item.category.nameFr}
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {item.owner.fullName || t('anonymous')}
                    </p>
                    <p className="text-sm text-slate-600">
                      {t('contactLine', {
                        email: item.owner.email,
                        phone: item.owner.phone || '-',
                      })}
                    </p>
                  </div>
                  <div className="grid gap-3 rounded-[1.4rem] border border-slate-950/8 bg-slate-50 px-4 py-3 text-xs text-slate-500 sm:text-right">
                    <p>{new Date(item.createdAt).toLocaleDateString(locale)}</p>
                    <p>{t('experience', { value: item.owner.yearsExperience })}</p>
                    {sort === 'relevance' ? (
                      <p>{t('relevanceValue', { value: item.relevance.toFixed(2) })}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 rounded-[1.6rem] border border-slate-950/8 bg-slate-50 px-4 py-4 text-sm text-slate-600 sm:grid-cols-3">
                  <p>
                    <span className="font-semibold text-slate-950">{t('locationLabel')}:</span>{' '}
                    {item.owner.city || '-'} / {item.owner.country || '-'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">{t('phoneLabel')}:</span>{' '}
                    {item.owner.phone || '-'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-950">{t('categoryLabel')}:</span>{' '}
                    {locale === 'en' ? item.category.nameEn : item.category.nameFr}
                  </p>
                </div>

                <div className="rounded-[1.6rem] border border-slate-950/8 bg-slate-50 px-4 py-4">
                  <p className="text-sm leading-7 text-slate-600">
                    {item.owner.headline || item.snippet || t('noSnippet')}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={linkLoadingId === item.id}
                      onClick={() => void openSignedUrl(item.id, 'view')}
                    >
                      {t('viewCv')}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={linkLoadingId === item.id}
                      onClick={() => void openSignedUrl(item.id, 'download')}
                    >
                      {t('downloadCv')}
                    </Button>
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    <ReportActionCard targetType="CV" targetId={item.id} />
                    <ReportActionCard targetType="USER" targetId={item.owner.userId} />
                  </div>
                </div>
              </div>
            </Card>
          ))
        : null}

      {!isLoading && totalPages > 1 ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              {t('pageInfo', { page, totalPages })}
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => void performSearch(page - 1)}
              >
                {t('previous')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => void performSearch(page + 1)}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
