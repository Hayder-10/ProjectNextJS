'use client';

import { useActionState, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { updateProfile } from '@/app/actions/users';
import type { UserItem } from '@/lib/queries/users';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type ClubGroup = { competition: string; clubs: { _id: string; name: string }[] };

export default function ProfileForm({ user, clubGroups }: { user: UserItem; clubGroups: ClubGroup[] }) {
  const [state, formAction] = useActionState(updateProfile, null);
  const { update } = useSession();
  const [name, setName] = useState(user.name);
  const [city, setCity] = useState(user.city ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [favoriteClub, setFavoriteClub] = useState(user.favoriteClub ?? '');

  // Met à jour le nom affiché dans le header après l'enregistrement
  useEffect(() => {
    if (state?.ok && name) update({ name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Nom" name="name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={50} />
      <Input label="Ville" name="city" value={city} onChange={(e) => setCity(e.target.value)} />
      <Input label="URL de l'avatar" name="avatarUrl" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
      <Select label="Club favori" name="favoriteClub" value={favoriteClub} onChange={(e) => setFavoriteClub(e.target.value)}>
        <option value="">— Aucun —</option>
        {clubGroups.map((g) => (
          <optgroup key={g.competition} label={g.competition}>
            {g.clubs.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>
      <FormError state={state} />
      <Button>Enregistrer</Button>
    </form>
  );
}
