import type { ReactNode } from 'react';

import { privatePageMetadata } from '@/lib/seo';

export const metadata = privatePageMetadata;

type SearchLayoutProps = {
  children: ReactNode;
};

export default function SearchLayout({ children }: SearchLayoutProps) {
  return children;
}
