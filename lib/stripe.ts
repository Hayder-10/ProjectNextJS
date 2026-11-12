import Stripe from 'stripe';

let client: Stripe | null = null;

export function isOnlinePaymentEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY manquant');
  client ??= new Stripe(key);
  return client;
}

// Tous les prix sont en TND. Si le compte Stripe n'accepte pas le TND, STRIPE_CURRENCY et
// STRIPE_RATE_FROM_TND permettent de facturer dans une autre devise (ex. eur et 0.30).
export function stripeCurrency() {
  return (process.env.STRIPE_CURRENCY || 'tnd').toLowerCase();
}

/** Montant TND converti dans la plus petite unité de la devise Stripe */
export function toStripeAmount(amountTnd: number) {
  const amount = amountTnd * (Number(process.env.STRIPE_RATE_FROM_TND) || 1);
  // Le TND a 3 décimales, et Stripe demande que le dernier chiffre de ces devises soit 0
  if (stripeCurrency() === 'tnd') return Math.round(amount * 100) * 10;
  return Math.round(amount * 100);
}
