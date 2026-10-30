import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCompetition,
  getCompetitionSeasons,
  getCompetitionStandings,
  listClubsOfCompetition,
} from '@/lib/queries/football';
import { seasonLabel } from '@/lib/utils';
import FootballTabs from '@/components/football/FootballTabs';
import StandingsTable from '@/components/football/StandingsTable';
import Avatar from '@/components/football/Avatar';
import EmptyState from '@/components/ui/EmptyState';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ season?: string }> };

export default async function CompetitionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { season: seasonParam } = await searchParams;

  const competition = await getCompetition(id);
  if (!competition) notFound();

  const seasons = await getCompetitionSeasons(id);
  const season = seasons.includes(Number(seasonParam)) ? Number(seasonParam) : seasons[0];

  const [standings, clubs] = await Promise.all([
    season !== undefined ? getCompetitionStandings(id, season) : [],
    listClubsOfCompetition(id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <FootballTabs active="competitions" />
      <Link href="/football" className="link text-sm">
        ← Compétitions
      </Link>
      <h1 className="page-title">{competition.name}</h1>

      {/* Sélecteur de saison : simples liens ?season= */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {seasons.map((s) => (
          <Link
            key={s}
            href={`/football/competitions/${id}?season=${s}`}
            className={`chip ${s === season ? 'chip-active' : ''}`}
          >
            {seasonLabel(s)}
          </Link>
        ))}
      </div>

      <h2 className="section-title">Classement {season !== undefined && seasonLabel(season)}</h2>
      {standings.length === 0 ? <EmptyState message="Aucun match pour cette saison." /> : <StandingsTable rows={standings} />}
      {competition.type !== 'domestic_league' && (
        <p className="text-xs text-slate-400">Coupe : classement calculé sur tous les matchs de la saison (phase de groupes et élimination directe).</p>
      )}

      {clubs.length > 0 && (
        <>
          <h2 className="section-title">Clubs</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {clubs.map((club) => (
              <Link key={club.tmId} href={`/football/clubs/${club.tmId}`} className="flex items-center gap-2 card p-3 hover:bg-green-500/10">
                <Avatar src={club.logoUrl} name={club.name} size={32} rounded={false} />
                <span className="truncate text-sm font-medium">{club.name}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
