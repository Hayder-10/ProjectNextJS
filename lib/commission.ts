// Commission de FootHub sur les ventes des boutiques. Fonctions pures, sans accès à la base.
import { round3 } from '@/lib/utils';

const DEFAULT_COMMISSION_PERCENT = 10;

export function commissionPercent() {
  const value = Number(process.env.PLATFORM_COMMISSION_PERCENT);
  return Number.isFinite(value) && value >= 0 && value <= 100 && process.env.PLATFORM_COMMISSION_PERCENT ? value : DEFAULT_COMMISSION_PERCENT;
}

/** Part de FootHub et part du vendeur sur une commande : le taux est copié pour ne jamais changer ensuite */
export function splitSale(total: number, percent = commissionPercent()) {
  const commissionAmount = round3((total * percent) / 100);
  return { commissionRate: percent, commissionAmount, sellerAmount: round3(total - commissionAmount) };
}

type SaleForBalance = {
  total: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
  commissionAmount?: number;
  sellerAmount?: number;
  settledAt?: unknown;
};

/**
 * Ce qui reste à régler entre FootHub et un vendeur, sur les commandes expédiées et pas encore réglées.
 * En ligne, FootHub a reçu l'argent et doit la part du vendeur. À la livraison, le vendeur a
 * encaissé et doit la commission. Positif : FootHub doit au vendeur. Négatif : le vendeur doit à FootHub.
 */
export function shopBalance(orders: SaleForBalance[]) {
  const due = orders.filter((o) => o.status === 'shipped' && !o.settledAt);
  const balance = due.reduce((sum, o) => {
    if (o.paymentMethod === 'online') return o.paymentStatus === 'paid' ? sum + (o.sellerAmount ?? 0) : sum;
    return sum - (o.commissionAmount ?? 0);
  }, 0);
  return { balance: round3(balance), ordersCount: due.length };
}

/** Ventes non annulées et commission correspondante */
export function shopSales(orders: SaleForBalance[]) {
  const sold = orders.filter((o) => o.status !== 'cancelled');
  return {
    ordersCount: sold.length,
    revenue: round3(sold.reduce((sum, o) => sum + o.total, 0)),
    commission: round3(sold.reduce((sum, o) => sum + (o.commissionAmount ?? 0), 0)),
  };
}
