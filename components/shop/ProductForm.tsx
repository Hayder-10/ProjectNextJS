'use client';

import { useActionState } from 'react';
import { createProduct, updateProduct } from '@/app/actions/shop';
import { createSellerProduct, updateSellerProduct } from '@/app/actions/sellers';
import type { ProductItem } from '@/lib/queries/shop';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/validation/shop';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type Props = {
  /** En modification : identifiant de l'élément (sinon : création) */
  id?: string;
  product?: ProductItem;
  /** Formulaire d'un vendeur : le produit appartient à sa boutique */
  seller?: boolean;
};

export default function ProductForm({ id, product, seller = false }: Props) {
  const create = seller ? createSellerProduct : createProduct;
  const update = seller ? updateSellerProduct : updateProduct;
  const [state, formAction] = useActionState(id ? update.bind(null, id) : create, null);

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Nom" name="name" defaultValue={product?.name} required />
      <Select label="Catégorie" name="category" defaultValue={product?.category ?? 'jerseys'}>
        {PRODUCT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {PRODUCT_CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>
      <Textarea label="Description" name="description" defaultValue={product?.description} required rows={4} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Prix (TND)" name="price" type="number" step="0.001" min="0.001" defaultValue={product?.price} required />
        <Input label="Stock" name="stock" type="number" step="1" min="0" defaultValue={product?.stock ?? 0} required />
      </div>
      <Input label="URL de l'image (facultatif)" name="imageUrl" type="url" defaultValue={product?.imageUrl ?? ''} placeholder="https://…" />
      <FormError state={state} />
      <Button>{product ? 'Enregistrer' : 'Créer le produit'}</Button>
    </form>
  );
}
