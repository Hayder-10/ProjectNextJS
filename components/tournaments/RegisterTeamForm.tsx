'use client';

import { useActionState } from 'react';
import { registerTeam } from '@/app/actions/tournaments';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

export default function RegisterTeamForm({ tournamentId }: { tournamentId: string }) {
  const [state, formAction] = useActionState(registerTeam.bind(null, tournamentId), null);

  return (
    <form action={formAction} className="space-y-3">
      <Input label="Nom de votre équipe" name="name" required minLength={2} maxLength={40} />
      <FormError state={state} />
      <Button>Inscrire mon équipe</Button>
    </form>
  );
}
