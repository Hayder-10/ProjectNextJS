import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getTeam } from '@/lib/queries/teams';
import Card from '@/components/ui/Card';
import TeamForm from '@/components/teams/TeamForm';

export const metadata = { title: "Modifier l'équipe" };

export default async function EditTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const team = await getTeam(id);
  if (!team || team.owner !== user.id) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Modifier « {team.name} »</h1>
      <p className="text-sm text-slate-400">Les tournois où l&apos;équipe est déjà inscrite gardent la liste de joueurs enregistrée à l&apos;inscription.</p>
      <Card>
        <TeamForm team={team} />
      </Card>
    </div>
  );
}
