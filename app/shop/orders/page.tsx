import { requireUser } from '@/lib/auth';
import { listMyOrders } from '@/lib/queries/shop';
import OrderCard from '@/components/shop/OrderCard';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';

export const metadata = { title: 'Mes commandes' };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await listMyOrders(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Mes commandes</h1>
      {orders.length === 0 ? (
        <EmptyState message="Vous n'avez passé aucune commande." actionLabel="Voir la boutique" actionHref="/shop" />
      ) : (
        orders.map((order) => (
          <OrderCard key={order._id} order={order}>
            {order.status === 'pending' && (
              <ConfirmDeleteButton
                action="cancelOrder" args={[order._id]}
                label="Annuler la commande"
                confirmMessage="Annuler cette commande ?"
              />
            )}
          </OrderCard>
        ))
      )}
    </div>
  );
}
