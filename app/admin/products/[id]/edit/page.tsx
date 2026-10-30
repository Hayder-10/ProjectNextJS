import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { getProduct } from '@/lib/queries/shop';
import Card from '@/components/ui/Card';
import ProductForm from '@/components/shop/ProductForm';

export const metadata = { title: 'Modifier le produit' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Modifier « {product.name} »</h1>
      <Card>
        <ProductForm id={product._id} product={product} />
      </Card>
    </div>
  );
}
