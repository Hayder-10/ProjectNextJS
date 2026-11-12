import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { releaseExpiredPayments } from '@/lib/payments';
import { getMyShop, listShopOrders } from '@/lib/queries/shops';
import { formatTND } from '@/lib/utils';
import SellerNav from '@/components/seller/SellerNav';
import OrderCard from '@/components/shop/OrderCard';
import OrderStatusSelect from '@/components/shop/OrderStatusSelect';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = { title: 'Mes ventes' };

export default async function SellerOrdersPage() {
  const user = await requireUser();
  const shop = await getMyShop(user.id);
  // Une boutique suspendue doit encore pouvoir livrer les commandes déjà passées
  if (!shop || (shop.status !== 'approved' && shop.status !== 'suspended')) redirect('/seller');
  await releaseExpiredPayments();
  const orders = await listShopOrders(shop._id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Mes ventes</h1>
      {shop.status === 'approved' && <SellerNav active="/seller/orders" />}

      {orders.length === 0 ? (
        <EmptyState message="Aucune vente pour le moment." />
      ) : (
        orders.map((order) => (
          <OrderCard key={order._id} order={order}>
            <p className="text-sm text-slate-300">
              Commission {order.commissionRate} % : {formatTND(order.commissionAmount ?? 0)} · Votre part :{' '}
              <span className="font-semibold text-amber-400">{formatTND(order.sellerAmount ?? order.total)}</span>
              {order.settledAt && ' · réglé'}
            </p>
            {order.status === 'shipped' ? (
              <p className="text-sm text-slate-400">Commande expédiée : elle ne peut plus être modifiée ici.</p>
            ) : (
              <OrderStatusSelect orderId={order._id} status={order.status} />
            )}
          </OrderCard>
        ))
      )}
    </div>
  );
}
