import Link from 'next/link';
import { listProducts } from '@/lib/queries/shop';
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABELS } from '@/lib/validation/shop';
import ProductGrid from '@/components/shop/ProductGrid';
import EmptyState from '@/components/ui/EmptyState';
import Input from '@/components/ui/Input';
import Icon from '@/components/ui/Icon';

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
        <Link href="/seller" className="link text-sm">
          Vendre sur FootHub <Icon name="arrow-right" />
        </Link>
      </div>

      <form className="flex gap-2">
        {category && <input type="hidden" name="category" value={category} />}
        <div className="flex-1">
          <Input name="q" defaultValue={q} placeholder="Rechercher un produit" />
        </div>
        <button className="btn btn-primary" aria-label="Rechercher"><Icon name="search" /></button>
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
        <ProductGrid products={products} />
      )}
    </div>
  );
}
