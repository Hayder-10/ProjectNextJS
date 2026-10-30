import Link from 'next/link';
import type { TournamentItem } from '@/lib/queries/tournaments';
import { TOURNAMENT_STATUS_LABELS } from '@/lib/validation/tournaments';
import { formatDate } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

const STATUS_COLORS = { open: 'green', ongoing: 'amber', finished: 'slate' } as const;

export default function TournamentCard({ tournament }: { tournament: TournamentItem }) {
  return (
    <Link href={`/tournaments/${tournament._id}`} className="block">
      <Card className="h-full space-y-2 card-hover">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-bold">🏆 {tournament.name}</h2>
          <Badge color={STATUS_COLORS[tournament.status]}>{TOURNAMENT_STATUS_LABELS[tournament.status]}</Badge>
        </div>
        <p className="text-sm text-slate-400">
          📍 {tournament.pitch ? `${tournament.pitch.name}, ` : ''}
          {tournament.city} · 📅 {formatDate(tournament.startDate)}
        </p>
        <p className="text-sm">
          <span className="font-semibold text-amber-400">
            {tournament.teams.length}/{tournament.maxTeams}
          </span>{' '}
          équipes · organisé par {tournament.organizer?.name ?? 'Compte supprimé'}
        </p>
      </Card>
    </Link>
  );
}
