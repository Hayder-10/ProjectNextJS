'use client';

import { useTransition, useState } from 'react';
import { runClientAction, type ClientActionArgs, type ClientActionName } from '@/lib/client-actions';

type Result = { ok: boolean; error?: string } | null | void;

type Props<K extends ClientActionName> = {
  /**
   * Nom de la Server Action (voir lib/client-actions.ts), ex. "deleteProduct",
   * ou une fonction définie dans un composant client.
   */
  action: K | (() => Promise<Result>);
  args?: ClientActionArgs<K>;
  label?: string;
  confirmMessage?: string;
  className?: string;
};

/** Demande confirmation, puis appelle l'action de suppression */
export default function ConfirmDeleteButton<K extends ClientActionName>({
  action,
  args,
  label = 'Supprimer',
  confirmMessage = 'Confirmer la suppression ?',
  className = '',
}: Props<K>) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  function handleClick() {
    if (!confirm(confirmMessage)) return;
    setError('');
    startTransition(async () => {
      const result: Result = typeof action === 'function' ? await action() : await runClientAction(action, args as ClientActionArgs<K>);
      if (result && !result.ok) setError(result.error ?? 'Erreur');
    });
  }

  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={handleClick} disabled={pending} className={`btn btn-danger ${className}`}>
        {pending ? '…' : label}
      </button>
      {error && <span className="mt-1 text-sm text-red-400">{error}</span>}
    </span>
  );
}
