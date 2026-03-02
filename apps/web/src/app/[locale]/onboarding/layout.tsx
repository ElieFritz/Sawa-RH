import type { ReactNode } from 'react';

import { privatePageMetadata } from '@/lib/seo';

export const metadata = privatePageMetadata;

type OnboardingLayoutProps = {
  children: ReactNode;
};

export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return children;
}
