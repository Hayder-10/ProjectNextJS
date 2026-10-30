import { requireAdmin } from '@/lib/auth';
import Card from '@/components/ui/Card';
import PitchForm from '@/components/booking/PitchForm';

export const metadata = { title: 'Nouveau terrain' };

export default async function NewPitchPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Nouveau terrain</h1>
      <Card>
        <PitchForm />
      </Card>
    </div>
  );
}
