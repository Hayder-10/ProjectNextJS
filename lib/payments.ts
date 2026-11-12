import type Stripe from 'stripe';
import { connectDB } from '@/lib/db';
import { notifyOrders, sendBookingConfirmation } from '@/lib/email';
import { getStripe, stripeCurrency } from '@/lib/stripe';
import Booking from '@/models/Booking';
import Order from '@/models/Order';
import Product from '@/models/Product';

export type PaymentKind = 'booking' | 'order';

// Stripe impose au moins 30 minutes de validité pour une session de paiement.
const SESSION_MINUTES = 31;
// Marge après l'expiration Stripe avant de libérer le créneau ou le stock
const RELEASE_MARGIN_MINUTES = 5;

export async function restoreStock(items: { product: unknown; quantity: number }[]) {
  for (const item of items) await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } });
}

type CheckoutInput = {
  kind: PaymentKind;
  /** Documents couverts par ce paiement : une réservation, ou les commandes d'un même panier */
  ids: string[];
  userId: string;
  email?: string | null;
  label: string;
  /** Montant total, déjà dans la plus petite unité de la devise Stripe */
  stripeAmount: number;
};

/** Crée la session Stripe Checkout et renvoie l'URL de la page de paiement */
export async function createCheckout({ kind, ids, userId, email, label, stripeAmount }: CheckoutInput) {
  const id = ids[0];
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60;

  const session = await getStripe().checkout.sessions.create(
    {
      mode: 'payment',
      // Carte uniquement : le paiement est confirmé tout de suite, le créneau n'attend pas un virement
      allowed_payment_method_types: ['card'],
      customer_email: email ?? undefined,
      client_reference_id: id,
      expires_at: expiresAt,
      metadata: { kind, id, userId },
      line_items: [
        {
          quantity: 1,
          price_data: { currency: stripeCurrency(), unit_amount: stripeAmount, product_data: { name: label } },
        },
      ],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}${kind === 'booking' ? '/bookings' : '/shop/orders'}?payment=cancelled`,
    },
    { idempotencyKey: `checkout-${id}` },
  );

  const fields = {
    stripeSessionId: session.id,
    paymentExpiresAt: new Date((expiresAt + RELEASE_MARGIN_MINUTES * 60) * 1000),
  };
  if (kind === 'booking') await Booking.updateOne({ _id: id }, fields);
  else await Order.updateMany({ _id: { $in: ids } }, fields);
  return session.url!;
}

function paymentIntentId(session: Stripe.Checkout.Session) {
  return typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id;
}

/**
 * Enregistre un paiement réussi. Appelé par le webhook et par la page de retour : la mise à jour
 * conditionnelle garantit qu'un seul des deux confirme le paiement et envoie l'e-mail.
 */
export async function confirmPayment(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return;
  const { kind, id } = session.metadata ?? {};
  if (!id) return;
  await connectDB();

  const paid = { paymentStatus: 'paid', paidAt: new Date(), stripePaymentIntentId: paymentIntentId(session) };

  if (kind === 'booking') {
    const booking = await Booking.findOneAndUpdate(
      { _id: id, stripeSessionId: session.id, paymentStatus: 'unpaid', status: 'active' },
      paid,
      { returnDocument: 'after' },
    );
    if (booking) await sendBookingConfirmation(booking);
    else await refundLatePayment(Booking, id, session);
  } else if (kind === 'order') {
    // Un panier à plusieurs boutiques : toutes ses commandes partagent cette session
    const orders = await Order.find({ stripeSessionId: session.id }).select('_id');
    const confirmed = [];
    for (const { _id } of orders) {
      const order = await Order.findOneAndUpdate(
        { _id, paymentStatus: 'unpaid', status: 'pending' },
        { ...paid, status: 'confirmed' },
        { returnDocument: 'after' },
      );
      if (order) confirmed.push(order);
      else await refundLatePayment(Order, String(_id), session);
    }
    if (confirmed.length > 0) await notifyOrders(confirmed);
  }
}

/** Paiement arrivé après l'annulation : le créneau ou le stock n'est plus garanti, on rembourse */
async function refundLatePayment(model: typeof Booking, id: string, session: Stripe.Checkout.Session) {
  const doc = await model.findOne({ _id: id, stripeSessionId: session.id, paymentStatus: 'unpaid', status: 'cancelled' });
  const intent = paymentIntentId(session);
  if (!doc || !intent) return;
  await getStripe().refunds.create({ payment_intent: intent, amount: doc.stripeAmount ?? undefined }, { idempotencyKey: `refund-${id}` });
  doc.paymentStatus = 'refunded';
  doc.stripePaymentIntentId = intent;
  await doc.save();
}

/** Annule les paiements en ligne non aboutis qui correspondent au filtre */
async function cancelUnpaid(filter: Record<string, unknown>) {
  const unpaid = { paymentMethod: 'online', paymentStatus: 'unpaid', ...filter };
  await Booking.updateMany({ ...unpaid, status: 'active' }, { status: 'cancelled' });

  const orders = await Order.find({ ...unpaid, status: 'pending' }).select('_id');
  for (const { _id } of orders) {
    // La condition sur le statut évite de remettre le stock deux fois
    const order = await Order.findOneAndUpdate({ _id, status: 'pending', paymentStatus: 'unpaid' }, { status: 'cancelled' });
    if (order) await restoreStock(order.items);
  }
}

/** Session expirée, reçue par le webhook */
export async function handleExpiredSession(sessionId: string) {
  await connectDB();
  await cancelUnpaid({ stripeSessionId: sessionId });
}

/** Libère les créneaux et le stock même si le webhook n'a pas été reçu */
export async function releaseExpiredPayments() {
  await connectDB();
  await cancelUnpaid({ paymentExpiresAt: { $lt: new Date() } });
}

type PaymentDoc = {
  _id: unknown;
  paymentMethod?: string;
  paymentStatus?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeAmount?: number;
};

/**
 * À appeler avant d'annuler une réservation ou une commande : rembourse si elle est payée,
 * sinon ferme la session Stripe encore ouverte. Renvoie un message si le remboursement échoue.
 */
export async function settleBeforeCancel(doc: PaymentDoc): Promise<string | null> {
  if (doc.paymentMethod !== 'online') return null;

  if (doc.paymentStatus === 'paid') {
    try {
      // Sans montant, Stripe rembourse tout ce qui reste : les commandes d'un même panier ont chacune le leur
      await getStripe().refunds.create({ payment_intent: doc.stripePaymentIntentId!, amount: doc.stripeAmount ?? undefined }, { idempotencyKey: `refund-${doc._id}` });
    } catch (err) {
      console.error('[stripe] Échec du remboursement :', err);
      return 'Le remboursement a échoué : rien n\'a été annulé, réessayez plus tard';
    }
    doc.paymentStatus = 'refunded';
    return null;
  }

  if (doc.paymentStatus === 'unpaid' && doc.stripeSessionId) {
    // La session peut déjà être expirée : un paiement tardif serait de toute façon remboursé
    await getStripe().checkout.sessions.expire(doc.stripeSessionId).catch(() => null);
  }
  return null;
}

type CancellableOrder = PaymentDoc & { status: string; items: { product: unknown; quantity: number }[]; save(): Promise<unknown> };

/**
 * Annule une commande : rembourse sa part si elle est payée et remet le stock. Si elle attend
 * encore son paiement, la session Stripe est fermée : toutes les commandes du même panier sont annulées.
 */
export async function cancelOrderAndSettle(order: CancellableOrder): Promise<string | null> {
  const paymentError = await settleBeforeCancel(order);
  if (paymentError) return paymentError;

  if (order.paymentMethod === 'online' && order.paymentStatus === 'unpaid' && order.stripeSessionId) {
    await handleExpiredSession(order.stripeSessionId);
    return null;
  }
  order.status = 'cancelled';
  await order.save();
  await restoreStock(order.items);
  return null;
}
