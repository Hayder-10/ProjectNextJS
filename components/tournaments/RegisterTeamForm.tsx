'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { registerTeam } from '@/app/actions/tournaments';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type Props = {
  tournamentId: string;
  teams: { _id: string; name: string; players: string[] }[];
};

export default function RegisterTeamForm({ tournamentId, teams }: Props) {
  const [state, formAction] = useActionState(registerTeam.bind(null, tournamentId), null);
  const createHref = `/teams/new?tournament=${tournamentId}`;

  if (teams.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-slate-300">Pour participer, créez d&apos;abord votre équipe avec le nom de vos joueurs.</p>
        <Link href={createHref} className="btn btn-primary">Créer mon équipe</Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <Select label="Équipe à inscrire" name="teamId" required>
        {teams.map((t) => (
          <option key={t._id} value={t._id}>
            {t.name} ({t.players.length} joueurs)
          </option>
        ))}
      </Select>
      <FormError state={state} />
      <div className="flex flex-wrap items-center gap-3">
        <Button>Inscrire mon équipe</Button>
        <Link href={createHref} className="link text-sm">Créer une autre équipe</Link>
      </div>
    </form>
  );
}
