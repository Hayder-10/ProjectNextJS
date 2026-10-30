import type { StandingRow } from '@/lib/standings';

/** Tableau de classement : utilisé par les compétitions et les tournois */
export default function StandingsTable({ rows }: { rows: StandingRow[] }) {
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
            <th className="p-2">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.team} className="border-t border-white/10 text-center">
              <td className="p-2 text-left text-slate-400">{i + 1}</td>
              <td className="p-2 text-left font-medium">{r.team}</td>
              <td className="p-2">{r.played}</td>
              <td className="p-2">{r.won}</td>
              <td className="p-2">{r.drawn}</td>
              <td className="p-2">{r.lost}</td>
              <td className="hidden p-2 sm:table-cell">{r.goalsFor}</td>
              <td className="hidden p-2 sm:table-cell">{r.goalsAgainst}</td>
              <td className="p-2">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
              <td className="p-2 font-bold text-amber-400">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
