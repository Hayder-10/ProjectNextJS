'use client';

import { signOut } from 'next-auth/react';
import { deleteMyAccount } from '@/app/actions/users';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export default function DeleteAccountButton() {
  return (
    <ConfirmDeleteButton
      label="Supprimer mon compte"
      confirmMessage="Supprimer définitivement votre compte ?"
      action={async () => {
        const result = await deleteMyAccount();
        if (result?.ok) await signOut({ callbackUrl: '/' });
        return result;
      }}
    />
  );
}
