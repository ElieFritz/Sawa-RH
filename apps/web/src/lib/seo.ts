import type { Metadata } from 'next';

import { routing } from '@/i18n/routing';

const LOCAL_DEV_URL = 'http://localhost:3000';

function normalizeUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

export function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
    LOCAL_DEV_URL;

  return normalizeUrl(configuredUrl);
}

export function getAbsoluteUrl(path = '') {
  if (!path) {
    return getSiteUrl();
  }

  return new URL(path, `${getSiteUrl()}/`).toString();
}

export function getLocaleAlternates(path = '') {
  const cleanPath = path === '/' || path === '' ? '' : path;
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, getAbsoluteUrl(`/${locale}${cleanPath}`)]),
  );

  return {
    ...languages,
    'x-default': getAbsoluteUrl(`/${routing.defaultLocale}${cleanPath}`),
  };
}

export const privatePageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};
