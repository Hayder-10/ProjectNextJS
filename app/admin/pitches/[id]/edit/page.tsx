import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getPitch } from '@/lib/queries/booking';
import Card from '@/components/ui/Card';
import PitchForm from '@/components/booking/PitchForm';

export const metadata = { title: 'Modifier le terrain' };

export default async function EditPitchPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const pitch = await getPitch(id);
  if (!pitch) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Modifier « {pitch.name} »</h1>
      <Card>
        <PitchForm id={pitch._id} pitch={pitch} />
      </Card>
    </div>
  );
}
