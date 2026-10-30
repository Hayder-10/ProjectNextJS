'use client';

import { useActionState } from 'react';
import { setMatchScore } from '@/app/actions/tournaments';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';

type Props = {
  tournamentId: string;
  match: { _id: string; homeTeam: string; awayTeam: string; homeScore?: number; awayScore?: number };
};

/** Organisateur : saisie du score d'un match */
export default function MatchScoreForm({ tournamentId, match }: Props) {
  const [state, formAction] = useActionState(setMatchScore.bind(null, tournamentId, match._id), null);
  const inputClass = 'h-11 w-14 rounded-xl border border-white/10 text-center font-bold';

  return (
    <form action={formAction} className="py-2">
      <div className="flex items-center gap-2 text-sm">
        <span className="flex-1 truncate text-right font-medium">{match.homeTeam}</span>
        <input name="homeScore" type="number" min={0} max={99} defaultValue={match.homeScore} required className={inputClass} aria-label={`Buts ${match.homeTeam}`} />
        <span>-</span>
        <input name="awayScore" type="number" min={0} max={99} defaultValue={match.awayScore} required className={inputClass} aria-label={`Buts ${match.awayTeam}`} />
        <span className="flex-1 truncate font-medium">{match.awayTeam}</span>
        <Button className="px-3" aria-label="Enregistrer le score">
          <Icon name="check" />
        </Button>
      </div>
      {state && !state.ok && <p className="mt-1 text-center text-sm text-red-400">{state.error}</p>}
    </form>
  );
}
