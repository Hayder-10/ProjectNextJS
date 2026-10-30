import { requireAdmin } from '@/lib/auth';
import Card from '@/components/ui/Card';
import ProductForm from '@/components/shop/ProductForm';

export const metadata = { title: 'Nouveau produit' };

export default async function NewProductPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Nouveau produit</h1>
      <Card>
        <ProductForm />
      </Card>
    </div>
  );
}
