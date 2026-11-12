// Format des tournois : 3 matchs par équipe contre des adversaires tirés au sort, puis éliminatoires.
// Fonctions pures : aucun accès à la base, utilisées par les actions et par la page du tournoi.
import { computeTournamentStandings } from '@/lib/standings';

export const GROUP_MATCHES_PER_TEAM = 3;

export type TournamentMatch = {
  homeTeam: string;
  awayTeam: string;
  homeScore?: number | null;
  awayScore?: number | null;
  homeYellow?: number | null;
  awayYellow?: number | null;
  round: string;
  stage?: 'group' | 'knockout';
};

type NewMatch = Pick<TournamentMatch, 'homeTeam' | 'awayTeam' | 'round' | 'stage'>;

/** Les matchs créés avant l'ajout des éliminatoires n'ont pas de stage : ce sont des matchs de groupe */
export const isKnockout = (m: Pick<TournamentMatch, 'stage'>) => m.stage === 'knockout';
export const isPlayed = (m: TournamentMatch) => m.homeScore != null && m.awayScore != null;

function shuffle<T>(items: T[], random: () => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Tire au sort 3 journées. Le calendrier d'un championnat (méthode de la rotation) ne fait jamais
 * se croiser deux fois les mêmes équipes : ses 3 premières journées donnent 3 adversaires différents à chacun.
 * Le nombre d'équipes doit être pair (4, 8 ou 16).
 */
export function generateGroupMatches(teams: string[], random: () => number = Math.random): NewMatch[] {
  const order = shuffle(teams, random);
  const matches: NewMatch[] = [];

  for (let day = 1; day <= GROUP_MATCHES_PER_TEAM; day++) {
    for (let i = 0; i < order.length / 2; i++) {
      const [a, b] = [order[i], order[order.length - 1 - i]];
      const [homeTeam, awayTeam] = random() < 0.5 ? [a, b] : [b, a];
      matches.push({ homeTeam, awayTeam, round: `Journée ${day}`, stage: 'group' });
    }
    // La première équipe reste en place, les autres tournent d'un cran
    order.splice(1, 0, order.pop()!);
  }
  return matches;
}

/** Nombre d'équipes qualifiées : 4 équipes = classement seul, 8 équipes = toutes, 16 équipes = les 8 premières */
export function qualifiedCount(teamCount: number) {
  if (teamCount <= 4) return 0;
  return teamCount >= 8 ? 8 : 4;
}

function knockoutRoundName(teamsLeft: number) {
  if (teamsLeft === 2) return 'Finale';
  if (teamsLeft === 4) return 'Demi-finales';
  return 'Quarts de finale';
}

/**
 * Le 1er joue contre le dernier qualifié, le 2e contre l'avant-dernier, etc.
 * L'ordre des matchs prépare le tableau : le 1er et le 2e ne peuvent se croiser qu'en finale.
 */
export function firstKnockoutRound(ranking: string[]): NewMatch[] {
  const count = ranking.length;
  const seedsInOrder = count === 8 ? [0, 3, 1, 2] : [0, 1];
  const round = knockoutRoundName(count);
  return seedsInOrder.map((seed) => ({
    homeTeam: ranking[seed],
    awayTeam: ranking[count - 1 - seed],
    round,
    stage: 'knockout',
  }));
}

export function matchWinner(m: TournamentMatch) {
  return (m.homeScore ?? 0) > (m.awayScore ?? 0) ? m.homeTeam : m.awayTeam;
}

/** Les vainqueurs de deux matchs voisins se rencontrent au tour suivant */
export function nextKnockoutRound(previous: TournamentMatch[]): NewMatch[] {
  const round = knockoutRoundName(previous.length);
  const matches: NewMatch[] = [];
  for (let i = 0; i < previous.length; i += 2) {
    matches.push({ homeTeam: matchWinner(previous[i]), awayTeam: matchWinner(previous[i + 1]), round, stage: 'knockout' });
  }
  return matches;
}

/** Regroupe les matchs par tour, dans l'ordre où ils ont été créés */
export function groupByRound<T extends { round: string }>(matches: T[]) {
  const rounds: { round: string; matches: T[] }[] = [];
  for (const m of matches) {
    const last = rounds[rounds.length - 1];
    if (last?.round === m.round) last.matches.push(m);
    else rounds.push({ round: m.round, matches: [m] });
  }
  return rounds;
}

export type NextStep =
  | { type: 'scores' } // des scores restent à saisir
  | { type: 'knockout' } // lancer les éliminatoires
  | { type: 'next-round' } // créer le tour suivant
  | { type: 'finish'; champion: string }; // clôturer le tournoi

/** Ce que l'organisateur doit faire ensuite, d'après les matchs déjà joués */
export function nextStep<T extends TournamentMatch>(matches: T[], teams: string[]): NextStep {
  const group = matches.filter((m) => !isKnockout(m));
  const knockout = matches.filter(isKnockout);
  if (!group.every(isPlayed)) return { type: 'scores' };

  if (knockout.length === 0) {
    if (qualifiedCount(teams.length) > 0) return { type: 'knockout' };
    return { type: 'finish', champion: groupRanking(group, teams)[0] };
  }

  const lastRound = groupByRound(knockout).at(-1)!.matches;
  if (!lastRound.every(isPlayed)) return { type: 'scores' };
  if (lastRound.length > 1) return { type: 'next-round' };
  return { type: 'finish', champion: matchWinner(lastRound[0]) };
}

export function groupStandings<T extends TournamentMatch>(matches: T[], teams: string[]) {
  const results = matches.filter((m) => !isKnockout(m)).map((m) => ({
    home: m.homeTeam,
    away: m.awayTeam,
    homeGoals: m.homeScore,
    awayGoals: m.awayScore,
    homeYellow: m.homeYellow,
    awayYellow: m.awayYellow,
  }));
  return computeTournamentStandings(results, teams);
}

export function groupRanking<T extends TournamentMatch>(matches: T[], teams: string[]) {
  return groupStandings(matches, teams).map((r) => r.team);
}

/** Un score n'est plus modifiable une fois le tour suivant créé : il en a déjà décidé les affiches */
export function isMatchLocked<T extends TournamentMatch>(match: T, matches: T[]) {
  const knockout = matches.filter(isKnockout);
  if (!isKnockout(match)) return knockout.length > 0;
  return groupByRound(knockout).at(-1)!.round !== match.round;
}
