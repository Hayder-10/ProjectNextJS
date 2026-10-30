import { requireUser } from '@/lib/auth';
import Card from '@/components/ui/Card';
import TeamComposer from '@/components/myxi/TeamComposer';

export const metadata = { title: 'Nouveau XI' };

export default async function NewMyXiPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Composer mon XI</h1>
      <Card>
        <TeamComposer />
      </Card>
    </div>
  );
}
