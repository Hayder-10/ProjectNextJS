import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getMyTeam } from '@/lib/queries/myxi';
import Card from '@/components/ui/Card';
import TeamComposer from '@/components/myxi/TeamComposer';

export const metadata = { title: 'Modifier mon XI' };

export default async function EditMyXiPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const team = await getMyTeam(id);
  if (!team || team.owner !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Modifier « {team.name} »</h1>
      <Card>
        <TeamComposer id={team._id} team={team} />
      </Card>
    </div>
  );
}
