import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { listMyTeams } from '@/lib/queries/myxi';
import { getUserById } from '@/lib/queries/users';
import { getClubById } from '@/lib/queries/football';
import { formatEUR } from '@/lib/utils';
import FootballTabs from '@/components/football/FootballTabs';
import Avatar from '@/components/football/Avatar';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Mon XI' };

export default async function MyXiPage() {
  const user = await requireUser();
  const [teams, profile] = await Promise.all([listMyTeams(user.id), getUserById(user.id)]);
  const favoriteClub = profile?.favoriteClub ? await getClubById(profile.favoriteClub) : null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <FootballTabs active="myxi" />

      {/* Club favori en haut */}
      {favoriteClub ? (
        <Link href={`/football/clubs/${favoriteClub.tmId}`}>
          <Card className="card-hover flex items-center gap-3 bg-linear-to-r from-green-600/30 to-slate-900/60">
            <Avatar src={favoriteClub.logoUrl} name={favoriteClub.name} size={48} rounded={false} />
            <div>
              <p className="text-xs text-slate-300">Mon club favori</p>
              <p className="font-display text-2xl font-bold uppercase">❤️ {favoriteClub.name}</p>
            </div>
          </Card>
        </Link>
      ) : (
        <Link href="/profile" className="card card-hover block text-sm text-slate-300">
          ❤️ Choisissez votre club favori dans votre profil →
        </Link>
      )}

      <div className="flex items-center justify-between">
        <h1 className="page-title">Mes XI</h1>
        <Link href="/my-xi/new" className="btn btn-primary">
          + Nouveau XI
        </Link>
      </div>

      {teams.length === 0 ? (
        <EmptyState message="Vous n'avez pas encore composé de XI." actionLabel="Composer mon XI" actionHref="/my-xi/new" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((team) => {
            const value = team.players.reduce((s, p) => s + (p.marketValueEur ?? 0), 0);
            const goals = team.players.reduce((s, p) => s + p.goals, 0);
            const assists = team.players.reduce((s, p) => s + p.assists, 0);
            return (
              <Card key={team._id} className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-bold">{team.name}</h2>
                    <div className="mt-1 flex gap-2">
                      <Badge color="green">{team.formation}</Badge>
                      <Badge>{team.isPublic ? 'Public' : 'Privé'}</Badge>
                    </div>
                  </div>
                  <p className="font-bold text-amber-400">{formatEUR(value)}</p>
                </div>
                <p className="line-clamp-2 text-sm text-slate-400">{team.players.map((p) => p.name).join(', ')}</p>
                <p className="text-sm text-slate-400">
                  ⚽ {goals} buts · 🅰️ {assists} passes
                </p>
                <div className="flex gap-2">
                  <Link href={`/my-xi/${team._id}/edit`} className="btn btn-secondary">
                    Modifier
                  </Link>
                  <ConfirmDeleteButton action="deleteMyTeam" args={[team._id]} confirmMessage={`Supprimer « ${team.name} » ?`} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
