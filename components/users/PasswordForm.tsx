'use client';

import { useActionState } from 'react';
import { changePassword } from '@/app/actions/users';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

export default function PasswordForm() {
  const [state, formAction] = useActionState(changePassword, null);

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Mot de passe actuel" name="current" type="password" required autoComplete="current-password" />
      <Input label="Nouveau mot de passe" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <Input label="Confirmation" name="confirm" type="password" required autoComplete="new-password" />
      <FormError state={state} />
      <Button>Changer le mot de passe</Button>
    </form>
  );
}
