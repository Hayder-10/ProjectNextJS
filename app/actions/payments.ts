'use server';

import { connectDB } from '@/lib/db';
import { requireUser } from '@/lib/auth';
import { objectId } from '@/lib/validation/common';
import { getStripe } from '@/lib/stripe';
import type { ActionResult } from '@/lib/utils';
import Booking from '@/models/Booking';
import Order from '@/models/Order';

/** Renvoie vers la page Stripe d'un paiement resté en attente, tant que la session est ouverte */
export async function resumePayment(kind: 'booking' | 'order', id: string): Promise<ActionResult> {
  const user = await requireUser();
  if (!objectId.safeParse(id).success) return { ok: false, error: 'Paiement introuvable' };

  await connectDB();
  const doc =
    kind === 'booking'
      ? await Booking.findOne({ _id: id, user: user.id, status: 'active' })
      : await Order.findOne({ _id: id, buyer: user.id, status: 'pending' });
  if (!doc || doc.paymentMethod !== 'online' || doc.paymentStatus !== 'unpaid' || !doc.stripeSessionId) {
    return { ok: false, error: 'Aucun paiement en attente' };
  }

  const session = await getStripe().checkout.sessions.retrieve(doc.stripeSessionId);
  if (session.status !== 'open' || !session.url) return { ok: false, error: 'Le délai de paiement est dépassé' };
  return { ok: true, redirectUrl: session.url };
}
