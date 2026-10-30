'use client';

import { useState, useTransition } from 'react';
import { runClientAction, type ClientActionArgs, type ClientActionName } from '@/lib/client-actions';

type Props<K extends ClientActionName> = {
  /** Nom de la Server Action (voir lib/client-actions.ts), ex. "startTournament" */
  action: K;
  args: ClientActionArgs<K>;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
};

/** Bouton qui appelle une Server Action sans formulaire (rôle, statut, démarrage…) */
export default function ActionButton<K extends ClientActionName>({ action, args, children, variant = 'secondary', className = '' }: Props<K>) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError('');
            const result = await runClientAction(action, args);
            if (result && !result.ok) setError(result.error ?? 'Erreur');
          })
        }
        className={`btn btn-${variant} ${className}`}
      >
        {pending ? '…' : children}
      </button>
      {error && <span className="mt-1 text-sm text-red-400">{error}</span>}
    </span>
  );
}
