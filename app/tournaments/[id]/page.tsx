import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTournament } from '@/lib/queries/tournaments';
import { TOURNAMENT_STATUS_LABELS } from '@/lib/validation/tournaments';
import { computeStandings } from '@/lib/standings';
import { formatDate } from '@/lib/utils';
import PlayTabs from '@/components/booking/PlayTabs';
import StandingsTable from '@/components/football/StandingsTable';
import RegisterTeamForm from '@/components/tournaments/RegisterTeamForm';
import MatchScoreForm from '@/components/tournaments/MatchScoreForm';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ActionButton from '@/components/ui/ActionButton';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import Icon from '@/components/ui/Icon';

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tournament, user] = await Promise.all([getTournament(id), getCurrentUser()]);
  if (!tournament) notFound();

  const isOrganizer = !!user && (tournament.organizer?._id === user.id || user.role === 'admin');
  const isOpen = tournament.status === 'open';
  const hasTeam = !!user && tournament.teams.some((t) => t.captain?._id === user.id);
  const isFull = tournament.teams.length >= tournament.maxTeams;

  // Classement calculé à l'affichage, à partir des matchs avec score
  const standings = computeStandings(
    tournament.matches.map((m) => ({ home: m.homeTeam, away: m.awayTeam, homeGoals: m.homeScore, awayGoals: m.awayScore })),
    tournament.teams.map((t) => t.name),
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PlayTabs active="tournaments" />
      <Link href="/tournaments" className="link text-sm">
        <Icon name="arrow-left" /> Tournois
      </Link>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="page-title"><Icon name="trophy" className="h-7 w-7 text-amber-400" /> {tournament.name}</h1>
          <Badge color={isOpen ? 'green' : tournament.status === 'ongoing' ? 'amber' : 'slate'}>{TOURNAMENT_STATUS_LABELS[tournament.status]}</Badge>
        </div>
        <p className="text-slate-400">
          <Icon name="pin" /> {tournament.pitch ? (
            <Link href={`/pitches/${tournament.pitch._id}`} className="text-green-400 underline">
              {tournament.pitch.name}
            </Link>
          ) : null}
          {tournament.pitch ? ', ' : ''}
          {tournament.city} · <Icon name="calendar" /> {formatDate(tournament.startDate)} · organisé par {tournament.organizer?.name ?? 'Compte supprimé'}
        </p>
        {tournament.description && <p className="whitespace-pre-line">{tournament.description}</p>}

        {isOrganizer && (
          <div className="flex flex-wrap gap-2 border-t border-white/10 pt-3">
            <Link href={`/tournaments/${tournament._id}/edit`} className="btn btn-secondary">
              Modifier
            </Link>
            {isOpen && (
              <ActionButton action="startTournament" args={[tournament._id]} variant="primary">
                ▶ Démarrer le tournoi
              </ActionButton>
            )}
            {tournament.status === 'ongoing' && (
              <ActionButton action="finishTournament" args={[tournament._id]} variant="primary">
                <Icon name="flag" /> Clôturer le tournoi
              </ActionButton>
            )}
            <ConfirmDeleteButton action="deleteTournament" args={[tournament._id]} confirmMessage="Supprimer ce tournoi ?" />
          </div>
        )}
      </Card>

      <h2 className="section-title">
        Équipes inscrites ({tournament.teams.length}/{tournament.maxTeams})
      </h2>
      {tournament.teams.length === 0 ? (
        <p className="text-slate-400">Aucune équipe inscrite pour le moment.</p>
      ) : (
        <Card className="divide-y divide-white/5 p-0">
          {tournament.teams.map((team) => (
            <div key={team._id} className="flex items-center justify-between gap-2 p-3">
              <div>
                <p className="font-semibold">{team.name}</p>
                <p className="text-xs text-slate-400">Capitaine : {team.captain?.name ?? 'Compte supprimé'}</p>
              </div>
              {isOpen && user && (team.captain?._id === user.id || isOrganizer) && (
                <ConfirmDeleteButton
                  action="withdrawTeam" args={[tournament._id, team._id]}
                  label="Retirer"
                  confirmMessage={`Retirer l'équipe « ${team.name} » ?`}
                  className="min-h-9 px-3 py-1 text-sm"
                />
              )}
            </div>
          ))}
        </Card>
      )}

      {isOpen && !hasTeam && !isFull && (
        <Card>
          {user ? (
            <RegisterTeamForm tournamentId={tournament._id} />
          ) : (
            <p className="text-slate-400">
              <Link href={`/login?callbackUrl=/tournaments/${tournament._id}`} className="link">
                Connectez-vous
              </Link>{' '}
              pour inscrire votre équipe.
            </p>
          )}
        </Card>
      )}
      {isOpen && isFull && <p className="text-sm font-semibold text-amber-400">Le tournoi est complet.</p>}
      {isOpen && isOrganizer && tournament.teams.length < 4 && (
        <p className="text-sm text-slate-400">Il faut au moins 4 équipes pour démarrer le tournoi.</p>
      )}

      {tournament.matches.length > 0 && (
        <>
          <h2 className="section-title">Classement</h2>
          <StandingsTable rows={standings} />

          <h2 className="section-title">Matchs</h2>
          <Card className="divide-y divide-white/5">
            {tournament.matches.map((m) =>
              isOrganizer && tournament.status === 'ongoing' ? (
                <MatchScoreForm key={m._id} tournamentId={tournament._id} match={m} />
              ) : (
                <div key={m._id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="flex-1 truncate text-right font-medium">{m.homeTeam}</span>
                  <span className="rounded-lg bg-black/40 px-2 py-1 ring-1 ring-white/10 font-bold text-amber-400">
                    {m.homeScore ?? '-'} : {m.awayScore ?? '-'}
                  </span>
                  <span className="flex-1 truncate font-medium">{m.awayTeam}</span>
                </div>
              ),
            )}
          </Card>
        </>
      )}
    </div>
  );
}
