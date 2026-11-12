import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getMyShop, listShopProducts } from '@/lib/queries/shops';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/validation/shop';
import { formatTND } from '@/lib/utils';
import SellerNav from '@/components/seller/SellerNav';
import ProductImage from '@/components/shop/ProductImage';
import Badge from '@/components/ui/Badge';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';
import SavedBanner from '@/components/ui/SavedBanner';

export const metadata = { title: 'Mes produits' };

export default async function SellerProductsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser();
  const { saved } = await searchParams;
  const shop = await getMyShop(user.id);
  if (shop?.status !== 'approved') redirect('/seller');
  const products = await listShopProducts(shop._id);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Mes produits</h1>
        <Link href="/seller/products/new" className="btn btn-primary"><Icon name="plus" /> Ajouter</Link>
      </div>
      <SellerNav active="/seller/products" />
      <SavedBanner saved={saved} />

      {products.length === 0 ? (
        <EmptyState message="Votre boutique n'a pas encore de produit." actionLabel="Ajouter un produit" actionHref="/seller/products/new" />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Prix</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                        <ProductImage product={p} className="h-10 text-xl" />
                      </div>
                      <div className="min-w-0">
                        <Link href={`/shop/${p._id}`} className="font-medium text-white hover:underline">{p.name}</Link>
                        <p className="text-xs text-slate-400">{PRODUCT_CATEGORY_LABELS[p.category]}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap font-semibold text-amber-400">{formatTND(p.price)}</td>
                  <td><Badge color={p.stock === 0 ? 'red' : p.stock <= 3 ? 'amber' : 'green'}>{p.stock === 0 ? 'Rupture' : p.stock}</Badge></td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/seller/products/${p._id}/edit`} className="btn btn-secondary btn-sm">Modifier</Link>
                      <ConfirmDeleteButton action="deleteSellerProduct" args={[p._id]} confirmMessage={`Supprimer « ${p.name} » ?`} className="btn-sm" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
