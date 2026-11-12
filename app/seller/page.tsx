import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { commissionPercent } from '@/lib/commission';
import { getMyShop, getShopFigures } from '@/lib/queries/shops';
import { SHOP_STATUS_COLORS, SHOP_STATUS_LABELS } from '@/lib/validation/shops';
import { formatTND } from '@/lib/utils';
import ShopForm from '@/components/seller/ShopForm';
import SellerNav from '@/components/seller/SellerNav';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Ma boutique' };

export default async function SellerPage() {
  const user = await requireUser();
  const shop = await getMyShop(user.id);
  const percent = commissionPercent();

  if (!shop) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h1 className="page-title">Ouvrir ma boutique</h1>
        <p className="text-slate-300">
          Vendez vos produits sur FootHub. Un administrateur valide votre boutique avant son ouverture. FootHub prélève {percent} % sur chaque vente.
        </p>
        <Card>
          <ShopForm submitLabel="Envoyer ma demande" />
        </Card>
      </div>
    );
  }

  const header = (
    <div className="flex flex-wrap items-center gap-2">
      <h1 className="page-title">{shop.name}</h1>
      <Badge color={SHOP_STATUS_COLORS[shop.status]}>{SHOP_STATUS_LABELS[shop.status]}</Badge>
    </div>
  );

  if (shop.status !== 'approved') {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {header}
        {shop.status === 'pending' && <p className="text-slate-300">Votre demande est en cours de validation. Vous recevrez un e-mail dès la décision. Vous pouvez encore modifier ces informations.</p>}
        {shop.status === 'rejected' && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <Icon name="alert" /> Demande refusée : {shop.rejectionReason ?? 'aucun motif indiqué'}. Corrigez vos informations pour la renvoyer.
          </p>
        )}
        {shop.status === 'suspended' && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            <Icon name="alert" /> Votre boutique et ses produits ne sont plus visibles. Contactez un administrateur.
          </p>
        )}
        {shop.status !== 'suspended' && (
          <Card>
            <ShopForm shop={shop} submitLabel={shop.status === 'rejected' ? 'Renvoyer ma demande' : 'Enregistrer'} />
          </Card>
        )}
      </div>
    );
  }

  const figures = await getShopFigures(shop._id);
  const stats = [
    { label: 'Ventes', value: figures.ordersCount },
    { label: 'À traiter', value: figures.pendingOrders },
    { label: "Chiffre d'affaires", value: formatTND(figures.revenue) },
    { label: `Commission (${percent} %)`, value: formatTND(figures.commission) },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      {header}
      <SellerNav active="/seller" />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <p className="font-display text-xl font-bold text-amber-400">{s.value}</p>
            <p className="text-xs text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      <Card className="space-y-1">
        <h2 className="section-title">Solde à régler</h2>
        {figures.balance === 0 ? (
          <p className="text-slate-300">Rien à régler pour le moment.</p>
        ) : figures.balance > 0 ? (
          <p className="text-slate-300">FootHub vous doit <span className="font-bold text-amber-400">{formatTND(figures.balance)}</span>, sur {figures.ordersToSettle} commande(s) expédiée(s).</p>
        ) : (
          <p className="text-slate-300">Vous devez <span className="font-bold text-amber-400">{formatTND(-figures.balance)}</span> à FootHub en commission, sur {figures.ordersToSettle} commande(s) expédiée(s).</p>
        )}
        <p className="text-xs text-slate-400">Les paiements en ligne arrivent chez FootHub, qui vous reverse votre part à la main. À la livraison, vous encaissez et devez la commission.</p>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Link href="/seller/products/new" className="btn btn-primary"><Icon name="plus" /> Nouveau produit</Link>
        <Link href={`/shop/boutiques/${shop._id}`} className="btn btn-secondary">Voir ma page publique</Link>
      </div>

      <h2 className="section-title">Informations de la boutique</h2>
      <Card>
        <ShopForm shop={shop} submitLabel="Enregistrer" />
      </Card>
    </div>
  );
}
