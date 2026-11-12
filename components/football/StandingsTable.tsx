import type { StandingRow } from '@/lib/standings';

/** Tableau de classement : utilisé par les compétitions et les tournois */
type Props = {
  rows: StandingRow[];
  /** Tournois : affiche les cartons jaunes */
  showYellowCards?: boolean;
  /** Tournois : nombre d'équipes qualifiées pour les éliminatoires, mises en évidence */
  qualified?: number;
};

export default function StandingsTable({ rows, showYellowCards = false, qualified = 0 }: Props) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            <th className="p-2 text-left">#</th>
            <th className="p-2 text-left">Équipe</th>
            <th className="p-2">J</th>
            <th className="p-2">G</th>
            <th className="p-2">N</th>
            <th className="p-2">P</th>
            <th className="hidden p-2 sm:table-cell">BP</th>
            <th className="hidden p-2 sm:table-cell">BC</th>
            <th className="p-2">Diff</th>
            {showYellowCards && <th className="p-2" title="Cartons jaunes">CJ</th>}
            <th className="p-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className="border-t border-white/10 text-center">
              <td className={`p-2 text-left ${i < qualified ? 'font-bold text-green-400' : 'text-slate-400'}`}>{i + 1}</td>
              <td className="p-2 text-left font-medium">{r.team}</td>
              <td className="p-2">{r.played}</td>
              <td className="p-2">{r.won}</td>
              <td className="p-2">{r.drawn}</td>
              <td className="p-2">{r.lost}</td>
              <td className="hidden p-2 sm:table-cell">{r.goalsFor}</td>
              <td className="hidden p-2 sm:table-cell">{r.goalsAgainst}</td>
              <td className="p-2">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
              {showYellowCards && <td className="p-2">{r.yellowCards}</td>}
              <td className="p-2 font-bold text-amber-400">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
