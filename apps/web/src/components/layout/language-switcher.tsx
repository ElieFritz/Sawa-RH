'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { routing } from '@/i18n/routing';

type LanguageSwitcherProps = {
  currentLocale: string;
};

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const normalizedPath = pathname.replace(/^\/(fr|en)/, '') || '/';

  return (
    <div className="inline-flex rounded-full border border-white/60 bg-white/80 p-1 text-xs font-semibold text-slate-600">
      {routing.locales.map((locale) => {
        const href = `/${locale}${normalizedPath}`;
        const isActive = locale === currentLocale;

        return (
          <Link
            key={locale}
            href={href}
            className={`rounded-full px-3 py-1.5 transition ${
              isActive ? 'bg-slate-950 text-white' : 'hover:bg-white'
            }`}
          >
            {locale.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
