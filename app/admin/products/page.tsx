import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { listProducts } from '@/lib/queries/shop';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/validation/shop';
import { formatTND } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import ProductImage from '@/components/shop/ProductImage';
import Badge from '@/components/ui/Badge';
import SavedBanner from '@/components/ui/SavedBanner';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDeleteButton from '@/components/ui/ConfirmDeleteButton';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Admin · Produits' };

type SearchParams = Promise<{ tab?: string; q?: string; category?: string; saved?: string }>;

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const { tab, q, category, saved } = await searchParams;
  // Ancienne adresse de la liste des commandes (section 7.4 de la spécification)
  if (tab === 'orders') redirect('/admin/orders');

  const products = await listProducts({ q: q?.trim(), category });

  return (
    <div className="space-y-6">
      <AdminNav active="/admin/products" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">Produits</h1>
        <Link href="/admin/products/new" className="btn btn-primary"><Icon name="plus" /> Nouveau produit</Link>
      </div>
      <SavedBanner saved={saved} />

      <form className="grid gap-2 sm:grid-cols-[1fr_200px_auto]">
        <Input name="q" defaultValue={q} placeholder="Rechercher un produit" />
        <Select name="category" defaultValue={category ?? ''}>
          <option value="">Toutes les catégories</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{PRODUCT_CATEGORY_LABELS[c]}</option>
          ))}
        </Select>
        <button className="btn btn-secondary">Filtrer</button>
      </form>

      {products.length === 0 ? (
        <EmptyState message="Aucun produit." actionLabel="Créer un produit" actionHref="/admin/products/new" />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Prix</th>
                <th>Stock</th>
                <th>Actions</th>
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
                      <Link href={`/shop/${p._id}`} className="font-medium text-white hover:underline">{p.name}</Link>
                    </div>
                  </td>
                  <td>{PRODUCT_CATEGORY_LABELS[p.category]}</td>
                  <td className="whitespace-nowrap font-semibold text-amber-400">{formatTND(p.price)}</td>
                  <td>
                    <Badge color={p.stock === 0 ? 'red' : p.stock <= 3 ? 'amber' : 'green'}>{p.stock === 0 ? 'Rupture' : p.stock}</Badge>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/admin/products/${p._id}/edit`} className="btn btn-secondary btn-sm">Modifier</Link>
                      <ConfirmDeleteButton action="deleteProduct" args={[p._id]} confirmMessage={`Supprimer « ${p.name} » ?`} className="btn-sm" />
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
