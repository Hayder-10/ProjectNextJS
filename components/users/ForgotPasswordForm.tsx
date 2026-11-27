'use client';

import { useActionState, useState } from 'react';
import { requestPasswordReset, resetPasswordWithOtp } from '@/app/actions/users';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

export default function ForgotPasswordForm() {
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [requestState, requestAction] = useActionState(requestPasswordReset, null);
  const [resetState, resetAction] = useActionState(resetPasswordWithOtp, null);

  const showReset = Boolean(requestState?.ok) && !editingEmail;

  if (showReset) {
    return (
      <form action={resetAction} className="space-y-4">
        <input type="hidden" name="email" value={email} />
        {requestState?.ok && (
          <p className="rounded-xl bg-green-500/10 p-3 text-sm text-green-400">
            {requestState.message}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>E-mail : {email}</span>
          <button
            type="button"
            onClick={() => setEditingEmail(true)}
            className="link"
          >
            Modifier / Renvoyer
          </button>
        </div>
        <Input
          label="Code OTP (6 chiffres)"
          name="otp"
          type="text"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          placeholder="123456"
          required
          autoComplete="one-time-code"
        />
        <Input
          label="Nouveau mot de passe (8 caractères minimum)"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Input
          label="Confirmation du mot de passe"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <FormError state={resetState} />
        <Button className="w-full">Réinitialiser le mot de passe</Button>
      </form>
    );
  }

  return (
    <form action={requestAction} onSubmit={() => setEditingEmail(false)} className="space-y-4">
      <p className="text-sm text-slate-400">
        Saisissez votre adresse e-mail pour recevoir un code de vérification (OTP) valable 10 minutes.
      </p>
      <Input
        label="E-mail"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <FormError state={requestState} />
      <Button className="w-full">Envoyer le code OTP</Button>
    </form>
  );
}
