import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getMyShop } from '@/lib/queries/shops';
import Card from '@/components/ui/Card';
import ProductForm from '@/components/shop/ProductForm';

export const metadata = { title: 'Nouveau produit' };

export default async function NewSellerProductPage() {
  const user = await requireUser();
  const shop = await getMyShop(user.id);
  if (shop?.status !== 'approved') redirect('/seller');

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Nouveau produit</h1>
      <Card>
        <ProductForm seller />
      </Card>
    </div>
  );
}
