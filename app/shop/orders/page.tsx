import { requireUser } from '@/lib/auth';
import { listMyOrders } from '@/lib/queries/shop';
import { releaseExpiredPayments } from '@/lib/payments';
import PaymentCancelledNotice from '@/components/payment/PaymentCancelledNotice';
import PayNowButton from '@/components/payment/PayNowButton';
import OrderCard from '@/components/shop/OrderCard';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Mes commandes' };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ payment?: string }> }) {
  const user = await requireUser();
  const { payment } = await searchParams;
  await releaseExpiredPayments();
  const orders = await listMyOrders(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Mes commandes</h1>
      {payment === 'cancelled' && orders.some((o) => o.status === 'pending' && o.paymentMethod === 'online' && o.paymentStatus === 'unpaid') && <PaymentCancelledNotice what="la commande" />}
      {orders.length === 0 ? (
        <EmptyState message="Vous n'avez passé aucune commande." actionLabel="Voir la boutique" actionHref="/shop" />
      ) : (
        orders.map((order) => (
          <OrderCard key={order._id} order={order}>
            <div className="flex flex-wrap items-start gap-2">
              {order.status === 'pending' && order.paymentMethod === 'online' && order.paymentStatus === 'unpaid' && <PayNowButton kind="order" id={order._id} />}
              {(order.status === 'pending' || (order.status === 'confirmed' && order.paymentStatus === 'paid')) && (
                <ConfirmDeleteButton
                  action="cancelOrder" args={[order._id]}
                  label="Annuler la commande"
                  confirmMessage={
                    order.paymentStatus === 'paid'
                      ? 'Annuler cette commande ? Elle sera remboursée sur votre carte.'
                      : orders.some((o) => o._id !== order._id && o.stripeSessionId && o.stripeSessionId === order.stripeSessionId && o.status === 'pending')
                        ? 'Annuler ce paiement ? Toutes les commandes du même panier seront annulées.'
                        : 'Annuler cette commande ?'
                  }
                />
              )}
            </div>
          </OrderCard>
        ))
      )}
    </div>
  );
}
