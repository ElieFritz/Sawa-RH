'use client';

import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { clearSession, getSession, type AppSession } from '@/lib/session';
import { cn } from '@/lib/utils';

import { LanguageSwitcher } from './language-switcher';
import { LogoMark } from './logo-mark';

type AppShellProps = PropsWithChildren<{
  locale: string;
}>;

type NavItem = {
  href: string;
  label: string;
};

export function AppShell({ children, locale }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('Shell');
  const [session, setSession] = useState<AppSession | null>(null);
  const isLandingRoute = pathname === `/${locale}`;

  useEffect(() => {
    setSession(getSession());
  }, [pathname]);

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [{ href: `/${locale}`, label: t('routes.home') }];

    if (!session) {
      return items;
    }

    items.push({
      href: `/${locale}/dashboard`,
      label: t('routes.dashboard'),
    });

    switch (session.user.role) {
      case 'CANDIDATE':
        items.push(
          {
            href: `/${locale}/dashboard/cvs`,
            label: t('routes.candidateCvs'),
          },
          {
            href: `/${locale}/dashboard/cvs/new`,
            label: t('routes.candidateUpload'),
          },
          {
            href: `/${locale}/dashboard/reviews`,
            label: t('routes.candidateReviews'),
          },
        );
        break;
      case 'RH_PRO':
        items.push(
          {
            href: `/${locale}/search/cvs`,
            label: t('routes.searchCvs'),
          },
          {
            href: `/${locale}/rh/queue`,
            label: t('routes.rhQueue'),
          },
        );
        break;
      case 'RECRUITER':
        items.push({
          href: `/${locale}/search/cvs`,
          label: t('routes.searchCvs'),
        });
        break;
      case 'MODERATOR':
        items.push(
          {
            href: `/${locale}/search/cvs`,
            label: t('routes.searchCvs'),
          },
          {
            href: `/${locale}/admin/categories`,
            label: t('routes.adminCategories'),
          },
          {
            href: `/${locale}/moderation/reports`,
            label: t('routes.moderationReports'),
          },
        );
        break;
      case 'ADMIN':
        items.push(
          {
            href: `/${locale}/dashboard/cvs`,
            label: t('routes.candidateCvs'),
          },
          {
            href: `/${locale}/dashboard/cvs/new`,
            label: t('routes.candidateUpload'),
          },
          {
            href: `/${locale}/dashboard/reviews`,
            label: t('routes.candidateReviews'),
          },
          {
            href: `/${locale}/search/cvs`,
            label: t('routes.searchCvs'),
          },
          {
            href: `/${locale}/rh/queue`,
            label: t('routes.rhQueue'),
          },
          {
            href: `/${locale}/admin/verifications`,
            label: t('routes.adminVerifications'),
          },
          {
            href: `/${locale}/admin/categories`,
            label: t('routes.adminCategories'),
          },
          {
            href: `/${locale}/moderation/reports`,
            label: t('routes.moderationReports'),
          },
        );
        break;
      default:
        break;
    }

    return items;
  }, [locale, session, t]);

  const roleLabel = session ? t(`roles.${session.user.role}`) : t('guestLabel');
  const userLabel =
    session?.user.profile?.fullName || session?.user.email || t('guestLabel');

  const accessState = useMemo(() => {
    if (!session) {
      return t('stateGuest');
    }

    if (session.user.role === 'ADMIN' || session.user.role === 'MODERATOR') {
      return t('stateReady');
    }

    const profile = session.user.profile;

    if (!profile || profile.completionStatus !== 'COMPLETE') {
      return t('stateProfileIncomplete');
    }

    if (session.user.role === 'CANDIDATE') {
      return t('stateReady');
    }

    if (profile.verificationStatus === 'PENDING_REVIEW') {
      return t('statePendingReview');
    }

    if (profile.verificationStatus === 'REJECTED') {
      return t('stateRejected');
    }

    if (session.user.role === 'RH_PRO' && profile.verifiedBadge) {
      return t('stateVerified');
    }

    if (profile.verificationStatus === 'APPROVED') {
      return t('stateApproved');
    }

    return t('stateReady');
  }, [session, t]);

  const accessTone = useMemo(() => {
    if (!session) {
      return 'border-slate-700 bg-slate-800/80 text-slate-200';
    }

    const profile = session.user.profile;

    if (!profile || profile.completionStatus !== 'COMPLETE') {
      return 'border-slate-700 bg-slate-800/80 text-slate-200';
    }

    if (profile.verificationStatus === 'PENDING_REVIEW') {
      return 'border-amber-300/30 bg-amber-300/10 text-amber-100';
    }

    if (profile.verificationStatus === 'REJECTED') {
      return 'border-rose-300/30 bg-rose-300/10 text-rose-100';
    }

    return 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100';
  }, [session]);

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
    router.replace(`/${locale}/auth/login`);
  };

  if (isLandingRoute) {
    return <div className="min-h-screen">{children}</div>;
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-3 sm:px-6 lg:px-8">
        <header className="sticky top-3 z-20 rounded-[1.75rem] border border-white/10 bg-slate-950/84 px-4 py-3 shadow-[0_20px_60px_rgba(2,6,23,0.35)] backdrop-blur-2xl sm:px-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Link href={`/${locale}`} className="shrink-0" aria-label={t('routes.home')}>
                  <LogoMark compact />
                </Link>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white sm:text-base">
                    {userLabel}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {session ? (
                      <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200">
                        {roleLabel}
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        'rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                        accessTone,
                      )}
                    >
                      {accessState}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <LanguageSwitcher currentLocale={locale} />
                {session ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.12]"
                  >
                    {t('logout')}
                  </button>
                ) : (
                  <>
                    <Link
                      href={`/${locale}/auth/login`}
                      className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:bg-white/[0.12]"
                    >
                      {t('routes.login')}
                    </Link>
                    <Link
                      href={`/${locale}/auth/register`}
                      className="inline-flex items-center justify-center rounded-full bg-amber-300 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-950 transition hover:bg-amber-200"
                    >
                      {t('routes.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>

            <nav className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'inline-flex shrink-0 rounded-full border px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] transition',
                    isActive(item.href)
                      ? 'border-amber-300 bg-amber-300 text-slate-950'
                      : 'border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]',
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="flex-1 py-4 sm:py-6">{children}</main>
        <footer className="pb-5 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500">
          {t('footer')}
        </footer>
      </div>
    </div>
  );
}
