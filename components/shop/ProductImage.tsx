import { PRODUCT_CATEGORY_ICONS } from '@/lib/validation/shop';
import type { ProductItem } from '@/lib/queries/shop';

/** Image du produit, ou une grande icône de la catégorie s'il n'y a pas d'URL */
export default function ProductImage({ product, className = '' }: { product: Pick<ProductItem, 'name' | 'imageUrl' | 'category'>; className?: string }) {
  if (product.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.imageUrl} alt={product.name} className={`w-full bg-white/5 object-cover ${className}`} />;
  }
  return (
    <div className={`flex w-full items-center justify-center bg-gradient-to-br from-green-600 to-slate-900 text-6xl ${className}`}>
      {PRODUCT_CATEGORY_ICONS[product.category]}
    </div>
  );
}
