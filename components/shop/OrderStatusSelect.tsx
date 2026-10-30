'use client';

import { useState, useTransition } from 'react';
import { adminSetOrderStatus } from '@/app/actions/shop';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/validation/shop';

/** Admin : change le statut d'une commande dès qu'on choisit une valeur */
export default function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  return (
    <div>
      <select
        defaultValue={status}
        disabled={pending || status === 'cancelled'}
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'cancelled' && !confirm('Annuler cette commande ? Le stock sera remis.')) {
            e.target.value = status;
            return;
          }
          startTransition(async () => {
            setError('');
            const result = await adminSetOrderStatus(orderId, value);
            if (result && !result.ok) setError(result.error);
          });
        }}
        className="field w-auto"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
    </div>
  );
}
