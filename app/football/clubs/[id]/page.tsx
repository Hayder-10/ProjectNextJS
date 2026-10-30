import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getClubByTmId, getClubLastGames, getSquad, POSITION_LABELS } from '@/lib/queries/football';
import { formatEUR } from '@/lib/utils';
import FootballTabs from '@/components/football/FootballTabs';
import Avatar from '@/components/football/Avatar';
import GameRow from '@/components/football/GameRow';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';

const POSITIONS = ['GK', 'DEF', 'MID', 'FWD'] as const;

export default async function ClubPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await getClubByTmId(Number(id));
  if (!club) notFound();

  const [squad, games] = await Promise.all([getSquad(club.tmId), getClubLastGames(club.tmId, 10)]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <FootballTabs active="competitions" />
      <Link href={`/football/competitions/${club.competitionTmId}`} className="link text-sm">
        ← Championnat
      </Link>

      <Card className="flex items-center gap-4">
        <Avatar src={club.logoUrl} name={club.name} size={64} rounded={false} />
        <div>
          <h1 className="page-title">{club.name}</h1>
          {club.stadium && <p className="text-sm text-slate-400">🏟️ {club.stadium}</p>}
        </div>
      </Card>

      <h2 className="section-title">Effectif</h2>
      {squad.length === 0 ? (
        <EmptyState message="Aucun joueur importé pour ce club." />
      ) : (
        POSITIONS.map((pos) => {
          const players = squad.filter((p) => p.position === pos);
          if (players.length === 0) return null;
          return (
            <Card key={pos}>
              <h3 className="mb-2 font-semibold text-green-400">{POSITION_LABELS[pos]}s</h3>
              <ul className="divide-y divide-white/5">
                {players.map((p) => (
                  <li key={p.tmId}>
                    <Link href={`/football/players/${p.tmId}`} className="flex items-center gap-3 py-2 hover:bg-white/5">
                      <Avatar src={p.imageUrl} name={p.name} size={36} />
                      <span className="flex-1 font-medium">{p.name}</span>
                      <span className="text-sm font-semibold text-amber-400">{formatEUR(p.marketValueEur)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })
      )}

      <h2 className="section-title">Derniers matchs</h2>
      {games.length === 0 ? (
        <EmptyState message="Aucun match." />
      ) : (
        <Card>
          {games.map((g) => (
            <GameRow key={g.tmId} game={g} />
          ))}
        </Card>
      )}
    </div>
  );
}
