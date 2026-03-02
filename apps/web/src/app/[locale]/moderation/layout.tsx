import type { ReactNode } from 'react';

import { privatePageMetadata } from '@/lib/seo';

export const metadata = privatePageMetadata;

type ModerationLayoutProps = {
  children: ReactNode;
};

export default function ModerationLayout({ children }: ModerationLayoutProps) {
  return children;
}
