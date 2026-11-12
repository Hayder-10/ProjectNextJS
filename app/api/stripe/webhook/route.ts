import type Stripe from 'stripe';
import { confirmPayment, handleExpiredSession } from '@/lib/payments';
import { getStripe } from '@/lib/stripe';

// Stripe appelle cette route sans session : seule la signature prouve que l'événement vient de lui
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) return new Response('Webhook non configuré', { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return new Response('Signature invalide', { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    await confirmPayment(event.data.object);
  } else if (event.type === 'checkout.session.expired') {
    await handleExpiredSession(event.data.object.id);
  }

  return Response.json({ received: true });
}
