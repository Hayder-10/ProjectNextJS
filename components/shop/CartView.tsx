'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { placeOrder } from '@/app/actions/shop';
import { formatTND, type ActionResult } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';
import EmptyState from '@/components/ui/EmptyState';

export default function CartView() {
  const { items, setQuantity, remove, clear, total } = useCart();
  const router = useRouter();

  const [state, formAction] = useActionState(async (_prev: ActionResult, formData: FormData) => {
    // Seuls les ids et quantités sont envoyés : le serveur recharge les prix
    const result = await placeOrder(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      formData,
    );
    if (result?.ok) {
      clear();
      router.push('/shop/orders');
    }
    return result;
  }, null);

  if (items.length === 0) {
    return <EmptyState message="Votre panier est vide." actionLabel="Voir la boutique" actionHref="/shop" />;
  }

  return (
    <div className="space-y-4">
      <Card className="divide-y divide-white/5 p-0">
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{item.name}</p>
              <p className="text-sm text-amber-400">{formatTND(item.price)}</p>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setQuantity(item.productId, item.quantity - 1)} className="h-11 w-11 rounded-xl bg-white/5 font-bold" aria-label="Moins">
                −
              </button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <button type="button" onClick={() => setQuantity(item.productId, item.quantity + 1)} className="h-11 w-11 rounded-xl bg-white/5 font-bold" aria-label="Plus">
                +
              </button>
            </div>
            <button type="button" onClick={() => remove(item.productId)} className="h-11 w-11 rounded-xl text-red-400 hover:bg-red-500/10" aria-label="Retirer">
              🗑
            </button>
          </div>
        ))}
        <div className="flex justify-between p-4 font-display text-2xl font-bold">
          <span>Total</span>
          <span className="text-amber-400">{formatTND(total)}</span>
        </div>
      </Card>

      <Card>
        <h2 className="section-title mb-3">Livraison</h2>
        <form action={formAction} className="space-y-4">
          <Textarea label="Adresse de livraison" name="shippingAddress" rows={3} required minLength={5} />
          <Input label="Téléphone" name="phone" type="tel" placeholder="+216 20 123 456" required />
          <p className="rounded-xl bg-amber-400/10 p-3 text-sm text-amber-300">💵 Paiement à la livraison</p>
          <FormError state={state} />
          <Button className="w-full">Commander · {formatTND(total)}</Button>
        </form>
      </Card>
    </div>
  );
}
