import { CategoriesPanel } from '@/components/admin/categories-panel';

type AdminCategoriesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AdminCategoriesPage({
  params,
}: AdminCategoriesPageProps) {
  await params;

  return <CategoriesPanel />;
}
