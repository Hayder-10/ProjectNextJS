import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listAllOrders } from '@/lib/queries/shop';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/lib/validation/shop';
import AdminNav from '@/components/admin/AdminNav';
import OrderCard from '@/components/shop/OrderCard';
import OrderStatusSelect from '@/components/shop/OrderStatusSelect';
import EmptyState from '@/components/ui/EmptyState';

export const metadata = { title: 'Admin · Commandes' };

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const all = await listAllOrders();
  const orders = status ? all.filter((o) => o.status === status) : all;

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/orders" />
      <h1 className="page-title">Commandes</h1>

      {/* Filtre par statut, avec le nombre de commandes dans chaque statut */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/orders" className={`chip ${!status ? 'chip-active' : ''}`}>Toutes ({all.length})</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`chip ${status === s ? 'chip-active' : ''}`}>
            {ORDER_STATUS_LABELS[s]} ({all.filter((o) => o.status === s).length})
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <EmptyState message="Aucune commande." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order}>
              <OrderStatusSelect orderId={order._id} status={order.status} />
            </OrderCard>
          ))}
        </div>
      )}
    </div>
  );
}
