import type { OrderItem } from '@/lib/queries/shop';
import { ORDER_STATUS_LABELS } from '@/lib/validation/shop';
import { formatDate, formatTND } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Icon from '@/components/ui/Icon';

const STATUS_COLORS = { pending: 'amber', confirmed: 'blue', shipped: 'green', cancelled: 'red' } as const;

export default function OrderCard({ order, children }: { order: OrderItem; children?: React.ReactNode }) {
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-slate-400">
          Commande du {formatDate(order.createdAt)}
          {/* acheteur chargé seulement dans la vue admin */}
          {typeof order.buyer === 'object' && order.buyer && ` · ${order.buyer.name} (${order.buyer.email})`}
        </span>
        <Badge color={STATUS_COLORS[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>
      <ul className="text-sm">
        {order.items.map((item, i) => (
          <li key={i} className="flex justify-between">
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>{formatTND(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
        <span>Total</span>
        <span className="text-amber-400">{formatTND(order.total)}</span>
      </div>
      <p className="text-xs text-slate-400">
        <Icon name="pin" /> {order.shippingAddress} · <Icon name="phone" /> {order.phone} · Paiement à la livraison
      </p>
      {children}
    </Card>
  );
}
