'use client';

import { useActionState } from 'react';
import { addReply } from '@/app/actions/forum';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import FormError from '@/components/ui/FormError';

export default function ReplyForm({ postId }: { postId: string }) {
  const [state, formAction] = useActionState(addReply.bind(null, postId), null);

  return (
    <form action={formAction} className="space-y-3">
      <Textarea name="content" placeholder="Votre réponse…" required maxLength={5000} rows={3} />
      <FormError state={state} />
      <Button>Répondre</Button>
    </form>
  );
}
