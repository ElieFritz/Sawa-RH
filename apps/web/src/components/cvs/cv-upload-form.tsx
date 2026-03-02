'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { cvUploadSchema, type CvUploadInput } from '@sawa-rh/shared';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/session';

type JobCategory = {
  id: string;
  nameFr: string;
  nameEn: string;
  slug: string;
};

export function CvUploadForm() {
  const t = useTranslations('CVs');
  const locale = useLocale();
  const router = useRouter();
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [candidateName, setCandidateName] = useState<string>('');
  const [profileState, setProfileState] = useState<string>('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
  } = useForm<CvUploadInput>({
    resolver: zodResolver(cvUploadSchema),
  });

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

    if (
      session.user.role !== 'ADMIN' &&
      (!session.user.profile || session.user.profile.completionStatus !== 'COMPLETE')
    ) {
      router.replace(`/${locale}/onboarding/profile`);
      return;
    }

    let cancelled = false;

    const loadCategories = async () => {
      try {
        const [data, me] = await Promise.all([
          apiFetch<JobCategory[]>('/job-categories/active', {
            accessToken: session.tokens.accessToken,
          }),
          apiFetch<{
            email: string;
            profile: {
              fullName: string | null;
              completionStatus: 'INCOMPLETE' | 'COMPLETE';
            } | null;
          }>('/me', {
            accessToken: session.tokens.accessToken,
          }),
        ]);

        if (!cancelled) {
          setCategories(data);
          setCandidateName(
            me.profile?.fullName || session.user.profile?.fullName || me.email,
          );
          setProfileState(
            me.profile?.completionStatus === 'COMPLETE'
              ? t('uploadProfileComplete')
              : t('uploadProfileIncomplete'),
          );
        }
      } catch (loadError) {
        if (!cancelled) {
          setCandidateName(session.user.profile?.fullName || session.user.email);
          setProfileState(
            session.user.profile?.completionStatus === 'COMPLETE'
              ? t('uploadProfileComplete')
              : t('uploadProfileIncomplete'),
          );
          setError('root', {
            message:
              loadError instanceof Error
                ? loadError.message
                : 'Unable to load categories.',
          });
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, [locale, router, setError, t]);

  const fileSizeMb = file ? (file.size / (1024 * 1024)).toFixed(2) : '0.00';

  const onSubmit = handleSubmit(async (values) => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    if (!file) {
      setError('root', { message: t('fileRequired') });
      return;
    }

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('categoryId', values.categoryId);
    formData.append('file', file);

    try {
      await apiFetch('/cvs', {
        method: 'POST',
        accessToken: session.tokens.accessToken,
        body: formData,
      });

      router.push(`/${locale}/dashboard/cvs`);
    } catch (uploadError) {
      setError('root', {
        message:
          uploadError instanceof Error
            ? uploadError.message
            : 'Unable to upload this CV.',
      });
    }
  });

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2.2rem] border border-white/10 bg-slate-950/78 p-6 text-white shadow-[0_35px_120px_rgba(2,6,23,0.55)] backdrop-blur-2xl sm:p-8">
          <p className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
            {t('uploadEyebrow')}
          </p>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            {t('uploadTitle')}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 sm:text-base">
            {t('uploadDescription')}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">{categories.length}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('uploadMetricCategories')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="truncate text-lg font-black text-white">{candidateName || '-'}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('uploadMetricProfile')}
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-3xl font-black text-white">{fileSizeMb}</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('uploadMetricSize')}
              </p>
            </div>
          </div>
        </div>

        <Card className="border-white/10 bg-[#f6f2e7]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            {t('uploadOpsTitle')}
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {t('uploadOpsHeadline')}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">{t('uploadOpsDescription')}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-950 p-4 text-white">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                {t('uploadOpsCardOneLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('uploadOpsCardOneTitle')}</p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-slate-950 ring-1 ring-slate-950/8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('uploadOpsCardTwoLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('uploadOpsCardTwoTitle')}</p>
            </div>
            <div className="rounded-3xl bg-amber-300 p-4 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {t('uploadOpsCardThreeLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('uploadOpsCardThreeTitle')}</p>
            </div>
            <div className="rounded-3xl bg-sky-300 p-4 text-slate-950">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                {t('uploadOpsCardFourLabel')}
              </p>
              <p className="mt-2 text-lg font-black">{t('uploadOpsCardFourTitle')}</p>
            </div>
          </div>
        </Card>
      </section>

      <Card className="border-white/10 bg-white/95">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t('formEyebrow')}
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                {t('formTitle')}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{t('formDescription')}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('titleLabel')}</label>
              <Input {...register('title')} />
              {errors.title ? (
                <p className="text-xs text-rose-600">{errors.title.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('categoryLabel')}</label>
              <Select {...register('categoryId')} value={watch('categoryId') ?? ''}>
                <option value="">{t('categoryPlaceholder')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {locale === 'en' ? category.nameEn : category.nameFr}
                  </option>
                ))}
              </Select>
              {errors.categoryId ? (
                <p className="text-xs text-rose-600">{errors.categoryId.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">{t('fileLabel')}</label>
              <Input
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <p className="text-xs text-slate-500">{t('fileHint')}</p>
            </div>

            {errors.root ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errors.root.message}
              </p>
            ) : null}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '...' : t('uploadAction')}
            </Button>
          </form>

          <div className="rounded-[1.8rem] border border-slate-950/8 bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-200">
              {t('uploadChecklistTitle')}
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight">
              {t('uploadChecklistHeadline')}
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {t('uploadChecklistDescription')}
            </p>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {t('uploadProfileLabel')}
              </p>
              <p className="mt-2 text-sm font-black text-white">{candidateName || '-'}</p>
              <p className="mt-2 text-sm leading-7 text-slate-300">{profileState || '-'}</p>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-black text-white">{t('uploadChecklistOneTitle')}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {t('uploadChecklistOneDescription')}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-black text-white">{t('uploadChecklistTwoTitle')}</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {t('uploadChecklistTwoDescription')}
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-sm font-black text-white">
                  {file ? file.name : t('uploadChecklistThreeTitle')}
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {file
                    ? t('uploadChecklistThreeReady')
                    : t('uploadChecklistThreeDescription')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
