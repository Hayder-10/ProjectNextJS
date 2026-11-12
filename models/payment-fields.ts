// Champs de paiement communs aux réservations et aux commandes.
// Les documents créés avant le paiement en ligne n'ont pas ces champs : ils valent « cash ».
export const paymentFields = {
  paymentMethod: { type: String, enum: ['cash', 'online'], default: 'cash' },
  paymentStatus: { type: String, enum: ['unpaid', 'paid', 'refunded'], default: 'unpaid' },
  stripeSessionId: { type: String, index: true },
  stripePaymentIntentId: String,
  // Montant débité pour ce document, dans la plus petite unité : un seul paiement peut couvrir plusieurs commandes
  stripeAmount: Number,
  // Au-delà de cette date, un paiement en ligne non abouti libère le créneau ou le stock
  paymentExpiresAt: Date,
  paidAt: Date,
};
