import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { listShopsForAdmin } from '@/lib/queries/shops';
import { SHOP_STATUS_COLORS, SHOP_STATUS_LABELS } from '@/lib/validation/shops';
import { formatDate, formatTND } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import RejectShopForm from '@/components/admin/RejectShopForm';
import ActionButton from '@/components/ui/ActionButton';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Admin · Boutiques' };

const STATUSES = ['pending', 'approved', 'rejected', 'suspended'] as const;

export default async function AdminShopsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin();
  const { status } = await searchParams;
  const shops = await listShopsForAdmin(STATUSES.some((s) => s === status) ? status : undefined);

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/shops" />
      <h1 className="page-title">Boutiques</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/admin/shops" className={`chip ${!status ? 'chip-active' : ''}`}>Toutes</Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/shops?status=${s}`} className={`chip ${status === s ? 'chip-active' : ''}`}>
            {SHOP_STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {shops.length === 0 ? (
        <EmptyState message="Aucune boutique." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shops.map((shop) => (
            <Card key={shop._id} className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-bold">{shop.name}</h2>
                  <p className="text-sm text-slate-400">
                    {shop.owner ? `${shop.owner.name} (${shop.owner.email})` : 'Compte supprimé'} · {shop.city} · {formatDate(shop.createdAt)}
                  </p>
                </div>
                <Badge color={SHOP_STATUS_COLORS[shop.status]}>{SHOP_STATUS_LABELS[shop.status]}</Badge>
              </div>
              <p className="whitespace-pre-line text-sm text-slate-300">{shop.description}</p>
              {shop.rejectionReason && <p className="text-sm text-red-300">Motif du refus : {shop.rejectionReason}</p>}

              {shop.status !== 'pending' && shop.status !== 'rejected' && (
                <div className="space-y-1 border-t border-white/10 pt-3 text-sm text-slate-300">
                  <p>
                    {shop.productsCount} produit(s) · {shop.figures.ordersCount} vente(s) · {formatTND(shop.figures.revenue)} · commission {formatTND(shop.figures.commission)}
                  </p>
                  {shop.figures.balance > 0 && <p>FootHub doit <span className="font-bold text-amber-400">{formatTND(shop.figures.balance)}</span> au vendeur.</p>}
                  {shop.figures.balance < 0 && <p>Le vendeur doit <span className="font-bold text-amber-400">{formatTND(-shop.figures.balance)}</span> à FootHub.</p>}
                  {shop.figures.balance === 0 && <p className="text-slate-400">Aucun solde à régler.</p>}
                </div>
              )}

              <div className="flex flex-wrap items-start gap-2">
                {(shop.status === 'pending' || shop.status === 'suspended') && (
                  <ActionButton action="approveShop" args={[shop._id]} variant="primary">
                    <Icon name="check" /> {shop.status === 'pending' ? 'Valider' : 'Rouvrir'}
                  </ActionButton>
                )}
                {shop.status === 'approved' && (
                  <ConfirmDeleteButton action="suspendShop" args={[shop._id]} label="Suspendre" confirmMessage={`Suspendre « ${shop.name} » ? Ses produits ne seront plus visibles.`} />
                )}
                {shop.figures.ordersToSettle > 0 && (
                  <ActionButton action="settleShop" args={[shop._id]}>Marquer comme réglé</ActionButton>
                )}
                {shop.status === 'approved' && (
                  <Link href={`/shop/boutiques/${shop._id}`} className="btn btn-secondary">Voir la page</Link>
                )}
                {shop.status === 'pending' && <RejectShopForm shopId={shop._id} />}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
