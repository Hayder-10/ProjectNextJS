import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicShop, listShopProducts } from '@/lib/queries/shops';
import Avatar from '@/components/football/Avatar';
import ProductGrid from '@/components/shop/ProductGrid';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';

export default async function PublicShopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const shop = await getPublicShop(id);
  if (!shop) notFound();
  const products = await listShopProducts(shop._id);

  return (
    <div className="space-y-4">
      <Link href="/shop/boutiques" className="link text-sm">
        <Icon name="arrow-left" /> Boutiques
      </Link>
      <Card className="flex items-start gap-4">
        <Avatar src={shop.logoUrl} name={shop.name} size={64} rounded={false} />
        <div className="min-w-0 space-y-1">
          <h1 className="page-title">{shop.name}</h1>
          <p className="text-sm text-slate-400"><Icon name="pin" /> {shop.city}</p>
          <p className="whitespace-pre-line text-slate-300">{shop.description}</p>
        </div>
      </Card>

      <h2 className="section-title">Produits ({products.length})</h2>
      {products.length === 0 ? <EmptyState message="Cette boutique n'a pas encore de produit." /> : <ProductGrid products={products} showSeller={false} />}
    </div>
  );
}
