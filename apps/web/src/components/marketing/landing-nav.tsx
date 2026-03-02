'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { LogoMark } from '@/components/layout/logo-mark';
import { clearSession, getSession, type AppSession } from '@/lib/session';

type LandingNavProps = {
  locale: string;
};

export function LandingNav({ locale }: LandingNavProps) {
  const t = useTranslations('Landing');
  const router = useRouter();
  const [session, setSession] = useState<AppSession | null>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    router.replace(`/${locale}/auth/login`);
  };

  return (
    <header className="rounded-[2rem] border border-white/10 bg-slate-950/78 px-4 py-3 shadow-[0_24px_70px_rgba(2,6,23,0.4)] backdrop-blur-2xl sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2">
            <LogoMark compact />
          </div>
          <LanguageSwitcher currentLocale={locale} />
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300">
            {t('navPlatform')}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300">
            {t('navWorkflow')}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-300">
            {t('navTrust')}
          </span>
        </nav>

        <div className="flex flex-wrap items-center gap-2">
          {session ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
              >
                {t('navDashboard')}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                {t('navLogout')}
              </button>
            </>
          ) : (
            <>
              <Link
                href={`/${locale}/auth/login`}
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
              >
                {t('navLogin')}
              </Link>
              <Link
                href={`/${locale}/auth/register`}
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-200"
              >
                {t('navPrimary')}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
