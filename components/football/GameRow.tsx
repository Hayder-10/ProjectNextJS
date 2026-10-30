import Link from 'next/link';
import type { GameItem } from '@/lib/queries/football';
import { formatDate } from '@/lib/utils';

export default function GameRow({ game }: { game: GameItem }) {
  return (
    <div className="flex items-center gap-2 border-t border-white/10 py-2 text-sm first:border-t-0">
      <span className="w-20 shrink-0 text-xs text-slate-400">{formatDate(game.date)}</span>
      <Link href={`/football/clubs/${game.homeClubTmId}`} className="flex-1 truncate text-right font-medium hover:underline">
        {game.homeClubName}
      </Link>
      <span className="rounded-lg bg-black/40 px-2 py-1 ring-1 ring-white/10 font-bold text-amber-400">
        {game.homeGoals} - {game.awayGoals}
      </span>
      <Link href={`/football/clubs/${game.awayClubTmId}`} className="flex-1 truncate font-medium hover:underline">
        {game.awayClubName}
      </Link>
    </div>
  );
}
