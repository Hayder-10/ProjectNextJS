'use client';

import { useActionState, useEffect, useRef } from 'react';
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
  const formRef = useRef<HTMLFormElement>(null);

  // Met à jour le nom affiché dans le header après l'enregistrement
  useEffect(() => {
    const name = (formRef.current?.elements.namedItem('name') as HTMLInputElement | null)?.value;
    if (state?.ok && name) update({ name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <Input label="Nom" name="name" defaultValue={user.name} required minLength={2} maxLength={50} />
      <Input label="Ville" name="city" defaultValue={user.city ?? ''} />
      <Input label="URL de l'avatar" name="avatarUrl" type="url" defaultValue={user.avatarUrl ?? ''} placeholder="https://…" />
      <Select label="Club favori" name="favoriteClub" defaultValue={user.favoriteClub ?? ''}>
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
