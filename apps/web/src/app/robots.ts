import type { MetadataRoute } from 'next';

import { getAbsoluteUrl, getSiteUrl } from '@/lib/seo';
import { routing } from '@/i18n/routing';

export default function robots(): MetadataRoute.Robots {
  const privatePrefixes = ['/auth/', '/onboarding/', '/dashboard', '/admin', '/moderation', '/rh', '/search'];
  const disallow = routing.locales.flatMap((locale) =>
    privatePrefixes.map((prefix) => `/${locale}${prefix}`),
  );

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow,
    },
    sitemap: getAbsoluteUrl('/sitemap.xml'),
    host: getSiteUrl(),
  };
}
