import type { ReactNode } from 'react';

import { privatePageMetadata } from '@/lib/seo';

export const metadata = privatePageMetadata;

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return children;
}
