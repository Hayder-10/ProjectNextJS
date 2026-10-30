import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/queries/shop';
import { PRODUCT_CATEGORY_LABELS } from '@/lib/validation/shop';
import { formatTND } from '@/lib/utils';
import ProductImage from '@/components/shop/ProductImage';
import AddToCartButton from '@/components/shop/AddToCartButton';
import Badge from '@/components/ui/Badge';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href="/shop" className="link text-sm">
        ← Boutique
      </Link>
      <div className="overflow-hidden card p-0 md:grid md:grid-cols-2">
        <ProductImage product={product} className="h-64 md:h-full" />
        <div className="space-y-3 p-4">
          <Badge color="green">{PRODUCT_CATEGORY_LABELS[product.category]}</Badge>
          <h1 className="page-title">{product.name}</h1>
          <p className="font-display text-3xl font-bold text-amber-400">{formatTND(product.price)}</p>
          <p className="whitespace-pre-line text-slate-400">{product.description}</p>
          <p className="text-sm text-slate-400">{product.stock} en stock · Paiement à la livraison</p>
          <AddToCartButton product={product} />
        </div>
      </div>
    </div>
  );
}
