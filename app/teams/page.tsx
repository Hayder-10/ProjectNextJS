import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listTeams } from '@/lib/queries/teams';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Mes équipes' };

export default async function TeamsPage() {
  const user = await requireUser();
  const teams = await listTeams(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Mes équipes</h1>
        <Link href="/teams/new" className="btn btn-primary">
          <Icon name="plus" /> Créer
        </Link>
      </div>
      <p className="text-sm text-slate-400">Créez votre équipe une fois, puis inscrivez-la à autant de tournois que vous voulez.</p>

      {teams.length === 0 ? (
        <EmptyState message="Vous n'avez pas encore d'équipe." actionLabel="Créer mon équipe" actionHref="/teams/new" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((team) => (
            <Card key={team._id} className="space-y-3">
              <div>
                <h2 className="font-bold">{team.name}</h2>
                <p className="text-sm text-slate-400"><Icon name="users" /> {team.players.length} joueurs</p>
              </div>
              <p className="line-clamp-3 text-sm text-slate-300">{team.players.join(', ')}</p>
              <div className="flex gap-2">
                <Link href={`/teams/${team._id}/edit`} className="btn btn-secondary">Modifier</Link>
                <ConfirmDeleteButton action="deleteTeam" args={[team._id]} confirmMessage={`Supprimer l'équipe « ${team.name} » ? Elle reste inscrite aux tournois en cours.`} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
