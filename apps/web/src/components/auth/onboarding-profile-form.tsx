'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import {
  onboardingProfileSchema,
  type OnboardingProfileInput,
} from '@sawa-rh/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { getSession, saveSession } from '@/lib/session';

export function OnboardingProfileForm() {
  const t = useTranslations('Onboarding');
  const locale = useLocale();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<OnboardingProfileInput>({
    resolver: zodResolver(onboardingProfileSchema),
    defaultValues: {
      locale: locale === 'en' ? 'en' : 'fr',
      yearsExperience: 0,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const session = getSession();

    if (!session) {
      setError('root', { message: 'Please sign in first.' });
      return;
    }

    try {
      await apiFetch('/me/profile', {
        method: 'PATCH',
        accessToken: session.tokens.accessToken,
        body: JSON.stringify(values),
      });

      const submitResponse = await apiFetch<{
        profile: {
          completionStatus: 'INCOMPLETE' | 'COMPLETE';
          verificationStatus: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
        };
      }>('/me/profile/submit', {
        method: 'POST',
        accessToken: session.tokens.accessToken,
      });

      saveSession({
        ...session,
        user: {
          ...session.user,
          profile: {
            completionStatus: submitResponse.profile.completionStatus,
            verificationStatus: submitResponse.profile.verificationStatus,
          },
        },
      });

      if (session.user.role === 'RH_PRO' || session.user.role === 'RECRUITER') {
        router.push(`/${locale}/onboarding/pending`);
        return;
      }

      router.push(`/${locale}/dashboard`);
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">{t('fullName')}</label>
          <Input {...register('fullName')} />
          {errors.fullName ? (
            <p className="text-xs text-rose-600">{errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t('country')}</label>
          <Input {...register('country')} />
          {errors.country ? (
            <p className="text-xs text-rose-600">{errors.country.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t('city')}</label>
          <Input {...register('city')} />
          {errors.city ? (
            <p className="text-xs text-rose-600">{errors.city.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">{t('phone')}</label>
          <Input {...register('phone')} />
          {errors.phone ? (
            <p className="text-xs text-rose-600">{errors.phone.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            {t('yearsExperience')}
          </label>
          <Input type="number" min={0} max={60} {...register('yearsExperience')} />
          {errors.yearsExperience ? (
            <p className="text-xs text-rose-600">
              {errors.yearsExperience.message?.toString()}
            </p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">{t('headline')}</label>
          <Input {...register('headline')} />
          {errors.headline ? (
            <p className="text-xs text-rose-600">{errors.headline.message}</p>
          ) : null}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-slate-700">Locale</label>
          <Select {...register('locale')}>
            <option value="fr">FR</option>
            <option value="en">EN</option>
          </Select>
          {errors.locale ? (
            <p className="text-xs text-rose-600">{errors.locale.message}</p>
          ) : null}
        </div>
      </div>

      {errors.root ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '...' : t('submit')}
      </Button>
    </form>
  );
}
