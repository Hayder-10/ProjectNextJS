'use client';

import { useActionState } from 'react';
import { createPitch, updatePitch } from '@/app/actions/booking';
import type { PitchItem } from '@/lib/queries/booking';
import { PITCH_TYPES } from '@/lib/validation/booking';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type Props = {
  /** En modification : identifiant de l'élément (sinon : création) */
  id?: string;
  pitch?: PitchItem;
};

export default function PitchForm({ id, pitch }: Props) {
  const [state, formAction] = useActionState(id ? updatePitch.bind(null, id) : createPitch, null);

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Nom" name="name" defaultValue={pitch?.name} required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Ville" name="city" defaultValue={pitch?.city} required />
        <Select label="Type" name="type" defaultValue={pitch?.type ?? '5v5'}>
          {PITCH_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </Select>
      </div>
      <Input label="Adresse" name="address" defaultValue={pitch?.address} required />
      <div className="grid grid-cols-3 gap-3">
        <Input label="Prix / heure (TND)" name="pricePerHour" type="number" step="0.001" min="0.001" defaultValue={pitch?.pricePerHour} required />
        <Input label="Ouverture (h)" name="openHour" type="number" min="0" max="23" defaultValue={pitch?.openHour ?? 8} required />
        <Input label="Fermeture (h)" name="closeHour" type="number" min="1" max="24" defaultValue={pitch?.closeHour ?? 23} required />
      </div>
      <Input label="URL de l'image (facultatif)" name="imageUrl" type="url" defaultValue={pitch?.imageUrl ?? ''} placeholder="https://…" />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isActive" defaultChecked={pitch?.isActive ?? true} className="h-5 w-5 accent-green-600" />
        <span>Terrain actif (réservable)</span>
      </label>
      <FormError state={state} />
      <Button>{pitch ? 'Enregistrer' : 'Créer le terrain'}</Button>
    </form>
  );
}
