'use client';

import { useActionState, useState } from 'react';
import { saveShop } from '@/app/actions/sellers';
import type { ShopItem } from '@/lib/queries/shops';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

export default function ShopForm({ shop, submitLabel }: { shop?: ShopItem | null; submitLabel: string }) {
  const [state, formAction] = useActionState(saveShop, null);
  // Champs contrôlés : React vide un formulaire après son action, la saisie doit survivre à une erreur
  const [values, setValues] = useState({
    name: shop?.name ?? '',
    description: shop?.description ?? '',
    city: shop?.city ?? '',
    logoUrl: shop?.logoUrl ?? '',
  });
  const bind = (field: keyof typeof values) => ({
    name: field,
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues((v) => ({ ...v, [field]: e.target.value })),
  });

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="Nom de la boutique" {...bind('name')} required minLength={2} maxLength={60} />
        <Input label="Ville" {...bind('city')} required maxLength={60} />
      </div>
      <Textarea label="Description" {...bind('description')} required minLength={10} maxLength={1000} rows={4} placeholder="Ce que vous vendez, d'où vous livrez…" />
      <Input label="URL du logo (facultatif)" type="url" {...bind('logoUrl')} placeholder="https://…" />
      <FormError state={state} />
      <Button>{submitLabel}</Button>
    </form>
  );
}
