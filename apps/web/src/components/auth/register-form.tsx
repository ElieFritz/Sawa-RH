'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { registerSchema, type RegisterInput } from '@sawa-rh/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { apiFetch } from '@/lib/api';
import { saveSession, type AppSession } from '@/lib/session';

type AuthResponse = AppSession;

export function RegisterForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      locale: locale === 'en' ? 'en' : 'fr',
      role: 'CANDIDATE',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      saveSession(response);
      router.push(`/${locale}/onboarding/profile`);
    } catch (error) {
      setError('root', {
        message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{t('email')}</label>
        <Input type="email" autoComplete="email" {...register('email')} />
        {errors.email ? (
          <p className="text-xs text-rose-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{t('password')}</label>
        <Input type="password" autoComplete="new-password" {...register('password')} />
        {errors.password ? (
          <p className="text-xs text-rose-600">{errors.password.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{t('role')}</label>
        <Select {...register('role')}>
          <option value="CANDIDATE">{t('candidate')}</option>
          <option value="RH_PRO">{t('rhPro')}</option>
          <option value="RECRUITER">{t('recruiter')}</option>
        </Select>
        {errors.role ? (
          <p className="text-xs text-rose-600">{errors.role.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{t('locale')}</label>
        <Select {...register('locale')}>
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </Select>
        {errors.locale ? (
          <p className="text-xs text-rose-600">{errors.locale.message}</p>
        ) : null}
      </div>

      {errors.root ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '...' : t('ctaRegister')}
      </Button>

      <Link
        href={`/${locale}/auth/login`}
        className="block text-center text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
      >
        {t('switchToLogin')}
      </Link>
    </form>
  );
}
