'use client';

import { useActionState } from 'react';
import { registerUser } from '@/app/actions/users';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

export default function RegisterForm() {
  const [state, formAction] = useActionState(registerUser, null);

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Nom" name="name" required minLength={2} maxLength={50} />
      <Input label="E-mail" name="email" type="email" required autoComplete="email" />
      <Input label="Mot de passe (8 caractères minimum)" name="password" type="password" required minLength={8} autoComplete="new-password" />
      <Input label="Confirmation du mot de passe" name="confirm" type="password" required autoComplete="new-password" />
      <FormError state={state} />
      <Button className="w-full">Créer mon compte</Button>
    </form>
  );
}
