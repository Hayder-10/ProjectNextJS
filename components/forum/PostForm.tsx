'use client';

import { useActionState } from 'react';
import { createPost, updatePost } from '@/app/actions/forum';
import { CATEGORIES, CATEGORY_LABELS } from '@/lib/validation/forum';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

type Props = {
  /** En modification : identifiant de l'élément (sinon : création) */
  id?: string;
  post?: { title: string; content: string; category: string };
};

/** Formulaire de création et de modification d'une publication */
export default function PostForm({ id, post }: Props) {
  const [state, formAction] = useActionState(id ? updatePost.bind(null, id) : createPost, null);

  return (
    <form action={formAction} className="space-y-4">
      <Input label="Titre" name="title" defaultValue={post?.title} required minLength={3} maxLength={120} />
      <Select label="Catégorie" name="category" defaultValue={post?.category ?? 'general'}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </Select>
      <Textarea label="Contenu" name="content" defaultValue={post?.content} required maxLength={5000} rows={8} />
      <FormError state={state} />
      <Button>{post ? 'Enregistrer' : 'Publier'}</Button>
    </form>
  );
}
