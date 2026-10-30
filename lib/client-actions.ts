// Registre des Server Actions appelées par les boutons ConfirmDeleteButton et ActionButton.
//
// Les pages serveur passent le NOM de l'action (ex. action="deleteProduct") et ses arguments,
// jamais la fonction elle-même : transmettre beaucoup d'actions d'une page serveur à des
// composants clients bloquait aléatoirement l'affichage en production (Next 15.5).
// Les composants clients importent donc les actions ici, directement.

import { deleteProduct, cancelOrder } from '@/app/actions/shop';
import { deletePitch, cancelBooking } from '@/app/actions/booking';
import { deletePost, deleteReply, adminDeletePost } from '@/app/actions/forum';
import { deleteMyTeam, adminDeleteMyTeam } from '@/app/actions/myxi';
import { deleteTournament, withdrawTeam, startTournament, finishTournament, adminDeleteTournament } from '@/app/actions/tournaments';
import { adminSetRole, adminDeleteUser } from '@/app/actions/users';
import type { ActionResult } from '@/lib/utils';

export const CLIENT_ACTIONS = {
  deleteProduct,
  cancelOrder,
  deletePitch,
  cancelBooking,
  deletePost,
  deleteReply,
  adminDeletePost,
  deleteMyTeam,
  adminDeleteMyTeam,
  deleteTournament,
  withdrawTeam,
  startTournament,
  finishTournament,
  adminDeleteTournament,
  adminSetRole,
  adminDeleteUser,
};

export type ClientActionName = keyof typeof CLIENT_ACTIONS;
export type ClientActionArgs<K extends ClientActionName> = Parameters<(typeof CLIENT_ACTIONS)[K]>;

/** Appelle l'action enregistrée sous ce nom avec ses arguments */
export function runClientAction<K extends ClientActionName>(name: K, args: ClientActionArgs<K>): Promise<ActionResult> {
  const action = CLIENT_ACTIONS[name] as unknown as (...a: ClientActionArgs<K>) => Promise<ActionResult>;
  return action(...args);
}
