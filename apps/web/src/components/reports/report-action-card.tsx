'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import {
  reportCreateSchema,
  type ReportTargetType,
} from '@sawa-rh/shared';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import { getSession } from '@/lib/session';
import { cn } from '@/lib/utils';

type ReportActionCardProps = {
  targetType: ReportTargetType;
  targetId: string;
  className?: string;
};

export function ReportActionCard({
  targetType,
  targetId,
  className,
}: ReportActionCardProps) {
  const t = useTranslations('Reports');
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerLabel = targetType === 'CV' ? t('triggerCv') : t('triggerUser');
  const headline = targetType === 'CV' ? t('headlineCv') : t('headlineUser');

  const submit = async () => {
    const session = getSession();

    if (!session) {
      router.replace(`/${locale}/auth/login`);
      return;
    }

    const parsed = reportCreateSchema.safeParse({
      targetType,
      targetId,
      reason: reason.trim(),
    });

    if (!parsed.success) {
      setError(t('validationError'));
      setSuccess(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiFetch('/reports', {
        method: 'POST',
        accessToken: session.tokens.accessToken,
        body: JSON.stringify(parsed.data),
      });

      setReason('');
      setIsOpen(false);
      setSuccess(t('success'));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('actionError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {success ? (
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      {!isOpen ? (
        <Button type="button" variant="secondary" onClick={() => setIsOpen(true)}>
          {triggerLabel}
        </Button>
      ) : (
        <div className="rounded-[1.6rem] border border-slate-950/8 bg-slate-50/90 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            {t('eyebrow')}
          </p>
          <p className="mt-2 text-sm font-black text-slate-950">{headline}</p>
          <p className="mt-2 text-sm leading-7 text-slate-600">{t('description')}</p>

          <div className="mt-3 space-y-2">
            <label className="text-sm font-medium text-slate-700">{t('reasonLabel')}</label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t('reasonPlaceholder')}
              className="min-h-24"
            />
          </div>

          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button type="button" disabled={isSubmitting} onClick={() => void submit()}>
              {isSubmitting ? '...' : t('submit')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => {
                setIsOpen(false);
                setError(null);
              }}
            >
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
