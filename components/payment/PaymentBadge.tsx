import Badge from '@/components/ui/Badge';

type Props = {
  method?: 'cash' | 'online';
  status?: 'unpaid' | 'paid' | 'refunded';
  /** Libellé du paiement hors ligne : « Sur place » ou « À la livraison » */
  cashLabel: string;
  cancelled?: boolean;
};

export default function PaymentBadge({ method, status, cashLabel, cancelled }: Props) {
  if (method !== 'online') return <Badge>{cashLabel}</Badge>;
  if (status === 'paid') return <Badge color="green">Payé en ligne</Badge>;
  if (status === 'refunded') return <Badge color="blue">Remboursé</Badge>;
  if (cancelled) return <Badge>Non payé</Badge>;
  return <Badge color="amber">Paiement en attente</Badge>;
}
