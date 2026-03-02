import type { ReactNode } from 'react';

import { privatePageMetadata } from '@/lib/seo';

export const metadata = privatePageMetadata;

type RhLayoutProps = {
  children: ReactNode;
};

export default function RhLayout({ children }: RhLayoutProps) {
  return children;
}
