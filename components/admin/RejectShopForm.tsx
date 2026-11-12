'use client';

import { useActionState } from 'react';
import { rejectShop } from '@/app/actions/sellers';
import FormError from '@/components/ui/FormError';
import Input from '@/components/ui/Input';

/** Admin : refuse une demande de boutique en indiquant le motif, envoyé au vendeur */
export default function RejectShopForm({ shopId }: { shopId: string }) {
  const [state, formAction] = useActionState(rejectShop.bind(null, shopId), null);

  return (
    <form action={formAction} className="w-full space-y-2">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input name="reason" placeholder="Motif du refus" required minLength={3} maxLength={300} aria-label="Motif du refus" />
        </div>
        <button className="btn btn-danger">Refuser</button>
      </div>
      <FormError state={state} />
    </form>
  );
}
