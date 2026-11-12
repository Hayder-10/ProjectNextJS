'use client';

import { useState, useTransition } from 'react';
import { resumePayment } from '@/app/actions/payments';
import Icon from '@/components/ui/Icon';

/** Reprend un paiement en ligne resté en attente */
export default function PayNowButton({ kind, id }: { kind: 'booking' | 'order'; id: string }) {
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
            const result = await resumePayment(kind, id);
            if (result?.ok && result.redirectUrl) window.location.assign(result.redirectUrl);
            else if (result && !result.ok) setError(result.error);
          })
        }
        className="btn btn-primary"
      >
        {pending ? '…' : <><Icon name="card" /> Payer maintenant</>}
      </button>
      {error && <span className="mt-1 text-sm text-red-400">{error}</span>}
    </span>
  );
}
