import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getTournament, type TournamentItem } from '@/lib/queries/tournaments';
import { listTeams } from '@/lib/queries/teams';
import { TOURNAMENT_STATUS_LABELS } from '@/lib/validation/tournaments';
import { groupByRound, groupStandings, isKnockout, isMatchLocked, nextStep, qualifiedCount } from '@/lib/tournament-format';
import { formatDate } from '@/lib/utils';
import StandingsTable from '@/components/football/StandingsTable';
import RegisterTeamForm from '@/components/tournaments/RegisterTeamForm';
import MatchScoreForm from '@/components/tournaments/MatchScoreForm';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import ActionButton from '@/components/ui/ActionButton';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import Icon from '@/components/ui/Icon';

const FORMAT_LABELS: Record<number, string> = {
  4: 'Chaque équipe joue 3 matchs. Le premier du classement remporte le tournoi.',
  8: 'Chaque équipe joue 3 matchs contre des adversaires tirés au sort. Le classement fixe ensuite les éliminatoires : le 1er contre le 8e, le 2e contre le 7e, etc.',
  16: 'Chaque équipe joue 3 matchs contre des adversaires tirés au sort. Les 8 premiers se qualifient pour les éliminatoires : le 1er contre le 8e, le 2e contre le 7e, etc.',
};

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tournament, user] = await Promise.all([getTournament(id), getCurrentUser()]);
  if (!tournament) notFound();

  const isOrganizer = !!user && (tournament.organizer?._id === user.id || user.role === 'admin');
  const isOpen = tournament.status === 'open';
  const isOngoing = tournament.status === 'ongoing';
  const hasTeam = !!user && tournament.teams.some((t) => t.captain?._id === user.id);
  const isFull = tournament.teams.length >= tournament.maxTeams;
  const myTeams = user && isOpen && !hasTeam && !isFull ? await listTeams(user.id) : [];

  const teamNames = tournament.teams.map((t) => t.name);
  const groupMatches = tournament.matches.filter((m) => !isKnockout(m));
  const knockoutMatches = tournament.matches.filter(isKnockout);
  // Classement calculé à l'affichage, à partir des matchs avec score
  const standings = groupStandings(tournament.matches, teamNames);
  const step = isOngoing ? nextStep(tournament.matches, teamNames) : null;

  const matchList = (matches: TournamentItem['matches']) => (
    <Card className="divide-y divide-white/5">
      {matches.map((m) =>
        isOrganizer && isOngoing && !isMatchLocked(m, tournament.matches) ? (
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
  );

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/tournaments" className="link text-sm">
        <Icon name="arrow-left" /> Tournois
      </Link>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="page-title"><Icon name="trophy" className="h-7 w-7 text-amber-400" /> {tournament.name}</h1>
          <Badge color={isOpen ? 'green' : isOngoing ? 'amber' : 'slate'}>{TOURNAMENT_STATUS_LABELS[tournament.status]}</Badge>
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
        <p className="text-sm text-slate-400">{FORMAT_LABELS[tournament.maxTeams]}</p>

        {isOrganizer && (
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <Link href={`/tournaments/${tournament._id}/edit`} className="btn btn-secondary">
              Modifier
            </Link>
            {isOpen && isFull && (
              <ActionButton action="startTournament" args={[tournament._id]} variant="primary">
                ▶ Démarrer le tournoi
              </ActionButton>
            )}
            {step?.type === 'knockout' && (
              <ActionButton action="advanceTournament" args={[tournament._id]} variant="primary">
                <Icon name="arrow-right" /> Lancer les éliminatoires
              </ActionButton>
            )}
            {step?.type === 'next-round' && (
              <ActionButton action="advanceTournament" args={[tournament._id]} variant="primary">
                <Icon name="arrow-right" /> Créer le tour suivant
              </ActionButton>
            )}
            {step?.type === 'finish' && (
              <ActionButton action="finishTournament" args={[tournament._id]} variant="primary">
                <Icon name="flag" /> Clôturer le tournoi
              </ActionButton>
            )}
            <ConfirmDeleteButton action="deleteTournament" args={[tournament._id]} confirmMessage="Supprimer ce tournoi ?" />
          </div>
        )}
        {isOrganizer && isOpen && !isFull && (
          <p className="text-sm text-slate-400">
            Le tournoi démarre quand les {tournament.maxTeams} équipes sont inscrites ({tournament.teams.length}/{tournament.maxTeams}).
          </p>
        )}
        {isOrganizer && step?.type === 'scores' && <p className="text-sm text-slate-400">Saisissez les scores de tous les matchs pour passer à la suite.</p>}
      </Card>

      {tournament.champion && (
        <Card className="text-center">
          <Icon name="trophy" className="mx-auto h-10 w-10 text-amber-400" />
          <p className="font-display text-3xl font-bold uppercase text-white">{tournament.champion}</p>
          <p className="text-sm text-slate-400">Vainqueur du tournoi</p>
        </Card>
      )}

      {knockoutMatches.length > 0 && (
        <>
          <h2 className="section-title">Éliminatoires</h2>
          {groupByRound(knockoutMatches).reverse().map((r) => (
            <div key={r.round} className="space-y-2">
              <h3 className="font-semibold text-green-400">{r.round}</h3>
              {matchList(r.matches)}
            </div>
          ))}
        </>
      )}

      {groupMatches.length > 0 && (
        <>
          <h2 className="section-title">Classement</h2>
          <StandingsTable rows={standings} showYellowCards qualified={qualifiedCount(teamNames.length)} />
          <p className="text-xs text-slate-400">À égalité de points : matchs directs, puis différence de buts, puis le moins de cartons jaunes.</p>

          <h2 className="section-title">Matchs de classement</h2>
          {groupByRound(groupMatches).map((r) => (
            <div key={r.round} className="space-y-2">
              <h3 className="font-semibold text-green-400">{r.round}</h3>
              {matchList(r.matches)}
            </div>
          ))}
        </>
      )}

      <h2 className="section-title">
        Équipes inscrites ({tournament.teams.length}/{tournament.maxTeams})
      </h2>
      {tournament.teams.length === 0 ? (
        <p className="text-slate-400">Aucune équipe inscrite pour le moment.</p>
      ) : (
        <Card className="divide-y divide-white/5 p-0">
          {tournament.teams.map((team) => (
            <div key={team._id} className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="font-semibold">{team.name}</p>
                <p className="text-xs text-slate-400">Capitaine : {team.captain?.name ?? 'Compte supprimé'}</p>
                {!!team.players?.length && (
                  <details className="mt-1 text-sm">
                    <summary className="cursor-pointer text-green-400">{team.players.length} joueurs</summary>
                    <p className="mt-1 text-slate-300">{team.players.join(', ')}</p>
                  </details>
                )}
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
            <RegisterTeamForm tournamentId={tournament._id} teams={myTeams} />
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
    </div>
  );
}
