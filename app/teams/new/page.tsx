import { requireUser } from '@/lib/auth';
import Card from '@/components/ui/Card';
import TeamForm from '@/components/teams/TeamForm';

export const metadata = { title: 'Nouvelle équipe' };

export default async function NewTeamPage({ searchParams }: { searchParams: Promise<{ tournament?: string }> }) {
  await requireUser();
  const { tournament } = await searchParams;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Créer mon équipe</h1>
      <Card>
        <TeamForm tournamentId={tournament} />
      </Card>
    </div>
  );
}
