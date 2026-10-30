'use client';

import { useActionState } from 'react';
import { createTournament, updateTournament } from '@/app/actions/tournaments';
import type { TournamentItem } from '@/lib/queries/tournaments';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type Props = {
  /** En modification : identifiant de l'élément (sinon : création) */
  id?: string;
  pitches: { _id: string; name: string; city: string }[];
  tournament?: TournamentItem;
  minDate: string;
};

export default function TournamentForm({ id, pitches, tournament, minDate }: Props) {
  const [state, formAction] = useActionState(id ? updateTournament.bind(null, id) : createTournament, null);

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Nom du tournoi" name="name" defaultValue={tournament?.name} required minLength={3} maxLength={80} />
      <Textarea label="Description (facultatif)" name="description" defaultValue={tournament?.description ?? ''} rows={3} maxLength={1000} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Ville" name="city" defaultValue={tournament?.city} required />
        <Input label="Date de début" name="startDate" type="date" min={tournament ? undefined : minDate} defaultValue={tournament?.startDate} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Select label="Terrain (facultatif)" name="pitch" defaultValue={tournament?.pitch?._id ?? ''}>
          <option value="">— Aucun —</option>
          {pitches.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.city})
            </option>
          ))}
        </Select>
        <Select label="Nombre d'équipes max" name="maxTeams" defaultValue={tournament?.maxTeams ?? 8}>
          <option value={4}>4</option>
          <option value={8}>8</option>
          <option value={16}>16</option>
        </Select>
      </div>
      <FormError state={state} />
      <Button>{tournament ? 'Enregistrer' : 'Créer le tournoi'}</Button>
    </form>
  );
}
