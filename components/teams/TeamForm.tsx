'use client';

import { useActionState, useState } from 'react';
import { createTeam, updateTeam } from '@/app/actions/teams';
import { MAX_TEAM_PLAYERS, MIN_TEAM_PLAYERS } from '@/lib/validation/teams';
import type { TeamItem } from '@/lib/queries/teams';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type Props = {
  team?: TeamItem;
  /** Tournoi vers lequel revenir après la création */
  tournamentId?: string;
};

export default function TeamForm({ team, tournamentId }: Props) {
  const [state, formAction] = useActionState(team ? updateTeam.bind(null, team._id) : createTeam.bind(null, tournamentId), null);
  // Champs contrôlés : React vide un formulaire après son action, la saisie doit survivre à une erreur
  const [name, setName] = useState(team?.name ?? '');
  const [players, setPlayers] = useState(team?.players.join('\n') ?? '');

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Nom de l'équipe" name="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} />
      <Textarea
        label={`Joueurs : un nom par ligne (${MIN_TEAM_PLAYERS} à ${MAX_TEAM_PLAYERS})`}
        name="players"
        value={players}
        onChange={(e) => setPlayers(e.target.value)}
        rows={10}
        required
        placeholder={'Sami Ben Ali\nYassine Trabelsi\nOmar Gharbi'}
      />
      <FormError state={state} />
      <Button>{team ? 'Enregistrer' : "Créer l'équipe"}</Button>
    </form>
  );
}
