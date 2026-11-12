import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getMyShop, getShopProduct } from '@/lib/queries/shops';
import Card from '@/components/ui/Card';
import ProductForm from '@/components/shop/ProductForm';

export const metadata = { title: 'Modifier le produit' };

export default async function EditSellerProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const shop = await getMyShop(user.id);
  if (shop?.status !== 'approved') redirect('/seller');
  const product = await getShopProduct(shop._id, id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Modifier « {product.name} »</h1>
      <Card>
        <ProductForm id={product._id} product={product} seller />
      </Card>
    </div>
  );
}
