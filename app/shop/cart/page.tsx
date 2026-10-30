import { requireUser } from '@/lib/auth';
import CartView from '@/components/shop/CartView';

export const metadata = { title: 'Panier' };

export default async function CartPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="page-title">Mon panier</h1>
      <CartView />
    </div>
  );
}
