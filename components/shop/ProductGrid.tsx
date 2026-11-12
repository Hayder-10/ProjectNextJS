import Link from 'next/link';
import type { ProductItem } from '@/lib/queries/shop';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/validation/shop';
import { formatTND } from '@/lib/utils';
import ProductImage from '@/components/shop/ProductImage';

/** Grille de produits : page Boutique et page d'un vendeur */
export default function ProductGrid({ products, showSeller = true }: { products: ProductItem[]; showSeller?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <Link key={p._id} href={`/shop/${p._id}`} className="overflow-hidden card p-0 card-hover">
          <ProductImage product={p} className="h-44" />
          <div className="space-y-1 p-4">
            <p className="text-xs text-slate-400">
              {PRODUCT_CATEGORY_LABELS[p.category]}
              {showSeller && p.shop && ` · ${p.shop.name}`}
            </p>
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
  );
}
