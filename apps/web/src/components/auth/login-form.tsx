'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { loginSchema, type LoginInput } from '@sawa-rh/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import { saveSession, type AppSession } from '@/lib/session';

type AuthResponse = AppSession;

export function LoginForm() {
  const t = useTranslations('Auth');
  const locale = useLocale();
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const response = await apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      });

      saveSession(response);

      if (response.user.profile?.completionStatus !== 'COMPLETE') {
        router.push(`/${locale}/onboarding/profile`);
        return;
      }

      if (
        (response.user.role === 'RH_PRO' || response.user.role === 'RECRUITER') &&
        response.user.profile?.verificationStatus !== 'APPROVED'
      ) {
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
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{t('email')}</label>
        <Input type="email" autoComplete="email" {...register('email')} />
        {errors.email ? (
          <p className="text-xs text-rose-600">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">{t('password')}</label>
        <Input
          type="password"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password ? (
          <p className="text-xs text-rose-600">{errors.password.message}</p>
        ) : null}
      </div>

      {errors.root ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errors.root.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '...' : t('ctaLogin')}
      </Button>

      <Link
        href={`/${locale}/auth/register`}
        className="block text-center text-sm font-medium text-slate-600 underline-offset-4 hover:underline"
      >
        {t('switchToRegister')}
      </Link>
    </form>
  );
}
