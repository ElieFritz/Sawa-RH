import type { ReactNode } from 'react';

import { privatePageMetadata } from '@/lib/seo';

export const metadata = privatePageMetadata;

type AdminLayoutProps = {
  children: ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  return children;
}
