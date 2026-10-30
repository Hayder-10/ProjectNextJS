'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Input from '@/components/ui/Input';

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  // La connexion passe par NextAuth (signIn), pas par une Server Action
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setPending(true);
    const form = new FormData(e.currentTarget);
    const result = await signIn('credentials', {
      email: form.get('email'),
      password: form.get('password'),
      redirect: false,
    });
    setPending(false);
    if (result?.error) {
      setError('E-mail ou mot de passe incorrect');
      return;
    }
    // Rechargement complet pour que tous les Server Components voient la session
    window.location.href = callbackUrl;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="E-mail" name="email" type="email" required autoComplete="email" />
      <Input label="Mot de passe" name="password" type="password" required autoComplete="current-password" />
      {error && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
        Se connecter
      </button>
    </form>
  );
}
