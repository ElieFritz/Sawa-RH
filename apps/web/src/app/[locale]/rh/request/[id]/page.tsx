import { RhRequestDetail } from '@/components/reviews/rh-request-detail';

type RhRequestPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RhRequestPage({ params }: RhRequestPageProps) {
  const { id } = await params;

  return <RhRequestDetail requestId={id} />;
}
