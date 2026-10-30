import Link from 'next/link';
import { listProducts } from '@/lib/queries/shop';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/validation/shop';
import { formatTND } from '@/lib/utils';
import ProductImage from '@/components/shop/ProductImage';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';

export const metadata = { title: 'Boutique' };

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category, q } = await searchParams;
  const products = await listProducts({ category, q: q?.trim() });

  const tabClass = (active: boolean) =>
    `chip ${active ? 'chip-active' : ''}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="page-title">Boutique</h1>
        <Link href="/shop/orders" className="link text-sm">
          Mes commandes →
        </Link>
      </div>

      <form className="flex gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="flex-1">
          <Input name="q" defaultValue={q} placeholder="Rechercher un produit" />
        </div>
        <button className="btn btn-primary">🔍</button>
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <Link href="/shop" className={tabClass(!category)}>
          Tout
        </Link>
        {PRODUCT_CATEGORIES.map((c) => (
          <Link key={c} href={`/shop?category=${c}`} className={tabClass(category === c)}>
            {PRODUCT_CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState message="Aucun produit trouvé." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Link key={p._id} href={`/shop/${p._id}`} className="overflow-hidden card p-0 card-hover">
              <ProductImage product={p} className="h-44" />
              <div className="space-y-1 p-4">
                <p className="text-xs text-slate-400">{PRODUCT_CATEGORY_LABELS[p.category]}</p>
                <h2 className="font-bold">{p.name}</h2>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-400">{formatTND(p.price)}</span>
                  <span className={`text-xs ${p.stock > 0 ? 'text-slate-400' : 'font-semibold text-red-400'}`}>
                    {p.stock > 0 ? `${p.stock} en stock` : 'Rupture'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
