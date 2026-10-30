import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCompetitionNames, getPlayerByTmId, POSITION_LABELS } from '@/lib/queries/football';
import { formatDate, formatEUR, seasonLabel } from '@/lib/utils';
import FootballTabs from '@/components/football/FootballTabs';
import Avatar from '@/components/football/Avatar';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

function age(birthDate?: string) {
  if (!birthDate) return null;
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [player, competitionNames] = await Promise.all([getPlayerByTmId(Number(id)), getCompetitionNames()]);
  if (!player) notFound();

  const totals = [
    { label: 'Matchs', value: player.totals.appearances },
    { label: 'Buts', value: player.totals.goals },
    { label: 'Passes D.', value: player.totals.assists },
    { label: 'Minutes', value: player.totals.minutes },
    { label: 'Jaunes', value: player.totals.yellowCards },
    { label: 'Rouges', value: player.totals.redCards },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <FootballTabs active="players" />
      <Link href="/football/players" className="link text-sm">
        <Icon name="arrow-left" /> Joueurs
      </Link>

      <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar src={player.imageUrl} name={player.name} size={96} />
        <div className="space-y-1">
          <h1 className="page-title">{player.name}</h1>
          <p className="text-slate-400">
            {POSITION_LABELS[player.position]}
            {player.subPosition && ` · ${player.subPosition}`}
          </p>
          <p className="text-sm text-slate-400">
            {player.nationality && <><Icon name="globe" /> {player.nationality} · </>}
            {player.birthDate && `${age(player.birthDate)} ans (${formatDate(player.birthDate)})`}
          </p>
          {player.clubTmId && (
            <Link href={`/football/clubs/${player.clubTmId}`} className="link text-sm">
              {player.clubName}
            </Link>
          )}
          <p className="font-display text-2xl font-bold text-amber-400">{formatEUR(player.marketValueEur)}</p>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {totals.map((t) => (
          <div key={t.label} className="stat">
            <p className="font-display text-2xl font-bold text-amber-400">{t.value}</p>
            <p className="text-xs">{t.label}</p>
          </div>
        ))}
      </div>

      <h2 className="section-title">Statistiques par saison</h2>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th className="p-2 text-left">Saison</th>
              <th className="p-2 text-left">Compétition</th>
              <th className="p-2">MJ</th>
              <th className="p-2">B</th>
              <th className="p-2">PD</th>
              <th className="p-2">Min</th>
              <th className="p-2" aria-label="Cartons jaunes"><span className="inline-block h-3.5 w-2.5 rounded-sm bg-yellow-400" /></th>
              <th className="p-2" aria-label="Cartons rouges"><span className="inline-block h-3.5 w-2.5 rounded-sm bg-red-500" /></th>
            </tr>
          </thead>
          <tbody>
            {player.seasons.map((s) => (
              <tr key={`${s.season}-${s.competitionTmId}`} className="border-t border-white/10 text-center">
                <td className="p-2 text-left whitespace-nowrap">{seasonLabel(s.season)}</td>
                <td className="p-2 text-left">{competitionNames[s.competitionTmId] ?? s.competitionTmId}</td>
                <td className="p-2">{s.appearances}</td>
                <td className="p-2 font-semibold">{s.goals}</td>
                <td className="p-2">{s.assists}</td>
                <td className="p-2">{s.minutes}</td>
                <td className="p-2">{s.yellowCards}</td>
                <td className="p-2">{s.redCards}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
