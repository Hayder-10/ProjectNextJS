// Calcul du classement : utilisé par les tournois et par les compétitions importées.
// Rien n'est stocké : on recalcule à chaque affichage à partir des matchs joués.

export type MatchResult = { home: string; away: string; homeGoals?: number | null; awayGoals?: number | null };

export type StandingRow = {
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

/**
 * @param matches les matchs ; ceux sans score sont ignorés
 * @param teams   équipes à afficher même sans match joué (facultatif)
 */
export function computeStandings(matches: MatchResult[], teams: string[] = []): StandingRow[] {
  const table = new Map<string, StandingRow>();

  const row = (team: string) => {
    if (!table.has(team)) {
      table.set(team, { team, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0 });
    }
    return table.get(team)!;
  };

  teams.forEach(row);

  for (const m of matches) {
    if (m.homeGoals == null || m.awayGoals == null) continue;
    const home = row(m.home);
    const away = row(m.away);

    home.played++;
    away.played++;
    home.goalsFor += m.homeGoals;
    home.goalsAgainst += m.awayGoals;
    away.goalsFor += m.awayGoals;
    away.goalsAgainst += m.homeGoals;

    if (m.homeGoals > m.awayGoals) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (m.homeGoals < m.awayGoals) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  const rows = [...table.values()];
  rows.forEach((r) => (r.goalDiff = r.goalsFor - r.goalsAgainst));

  // Tri : points, puis différence de buts, puis buts marqués
  return rows.sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff || b.goalsFor - a.goalsFor);
}
