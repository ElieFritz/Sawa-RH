import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';

import { AppShell } from '@/components/layout/app-shell';
import { routing } from '@/i18n/routing';

const headingFont = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-heading',
});

const bodyFont = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
});

type LocaleLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className={`${headingFont.variable} ${bodyFont.variable}`}>
        <AppShell locale={locale}>{children}</AppShell>
      </div>
    </NextIntlClientProvider>
  );
}
