'use client';

import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import type { ProductItem } from '@/lib/queries/shop';
import Icon from '@/components/ui/Icon';

export default function AddToCartButton({ product }: { product: ProductItem }) {
  const { add, items } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const inCart = items.find((i) => i.productId === product._id)?.quantity ?? 0;
  const max = product.stock - inCart;

  if (product.stock === 0) {
    return <p className="font-semibold text-red-400">Rupture de stock</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="number"
        min={1}
        max={Math.max(1, max)}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
        className="field w-20"
        aria-label="Quantité"
      />
      <button
        type="button"
        disabled={max < quantity}
        onClick={() => {
          add({ productId: product._id, name: product.name, price: product.price, imageUrl: product.imageUrl }, quantity);
          setAdded(true);
          setTimeout(() => setAdded(false), 1500);
        }}
        className="btn btn-primary flex-1"
      >
        {added ? <><Icon name="check" /> Ajouté au panier</> : <><Icon name="cart" /> Ajouter au panier</>}
      </button>
      {inCart > 0 && <p className="w-full text-sm text-slate-400">{inCart} déjà dans votre panier</p>}
    </div>
  );
}
