// Vérifie la configuration de Stripe et des e-mails, sans rien débiter ni envoyer.
// Lancer avec : npm run check:services

import nodemailer from 'nodemailer';
import { getStripe, isOnlinePaymentEnabled, stripeCurrency, toStripeAmount } from '../lib/stripe';

async function checkStripe() {
  if (!isOnlinePaymentEnabled()) {
    console.log('Stripe : non configuré (STRIPE_SECRET_KEY vide). Le paiement en ligne reste masqué.');
    return true;
  }
  const mode = process.env.STRIPE_SECRET_KEY!.startsWith('sk_live') ? 'PRODUCTION' : 'test';
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  try {
    // Une session jamais payée, fermée aussitôt : c'est le seul moyen sûr de savoir si la devise est acceptée
    const session = await getStripe().checkout.sessions.create({
      mode: 'payment',
      line_items: [{ quantity: 1, price_data: { currency: stripeCurrency(), unit_amount: toStripeAmount(100), product_data: { name: 'Vérification FootHub' } } }],
      success_url: `${baseUrl}/`,
      cancel_url: `${baseUrl}/`,
    });
    await getStripe().checkout.sessions.expire(session.id);
    console.log(`Stripe : OK (mode ${mode}, devise ${stripeCurrency()} acceptée).`);
  } catch (err) {
    console.error(`Stripe : ÉCHEC avec la devise ${stripeCurrency()} : ${(err as Error).message}`);
    console.error('Si la devise est refusée, renseignez STRIPE_CURRENCY et STRIPE_RATE_FROM_TND dans .env.local.');
    return false;
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.log('Stripe : pas de STRIPE_WEBHOOK_SECRET. Suffisant en local, obligatoire en production.');
  }
  return true;
}

async function checkEmail() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) {
    console.log('E-mail : non configuré (SMTP_HOST vide). Les e-mails sont seulement notés dans la console.');
    return true;
  }
  const port = Number(SMTP_PORT) || 587;
  try {
    await nodemailer
      .createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined, connectionTimeout: 10_000 })
      .verify();
    console.log(`E-mail : OK (connexion à ${SMTP_HOST}:${port}).`);
    return true;
  } catch (err) {
    console.error(`E-mail : ÉCHEC : ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  const results = [await checkStripe(), await checkEmail()];
  if (results.includes(false)) process.exit(1);
}

main();
