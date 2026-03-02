import type { MetadataRoute } from 'next';

import { getAbsoluteUrl } from '@/lib/seo';
import { routing } from '@/i18n/routing';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const languageAlternates = Object.fromEntries(
    routing.locales.map((locale) => [locale, getAbsoluteUrl(`/${locale}`)]),
  );

  return routing.locales.map((locale) => ({
    url: getAbsoluteUrl(`/${locale}`),
    lastModified,
    changeFrequency: 'weekly',
    priority: locale === routing.defaultLocale ? 1 : 0.9,
    alternates: {
      languages: languageAlternates,
    },
  }));
}
