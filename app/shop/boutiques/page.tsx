import Link from 'next/link';
import { listOpenShops } from '@/lib/queries/shops';
import Avatar from '@/components/football/Avatar';
import EmptyState from '@/components/ui/EmptyState';
import Icon from '@/components/ui/Icon';

export const metadata = { title: 'Boutiques' };

// Lu dans MongoDB à chaque requête (pas de pré-rendu au build)
export const dynamic = 'force-dynamic';

export default async function ShopsPage() {
  const shops = await listOpenShops();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Boutiques</h1>
        <Link href="/seller" className="btn btn-secondary">
          <Icon name="plus" /> Ouvrir ma boutique
        </Link>
      </div>

      {shops.length === 0 ? (
        <EmptyState message="Aucune boutique ouverte pour le moment." actionLabel="Ouvrir la première" actionHref="/seller" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => (
            <Link key={shop._id} href={`/shop/boutiques/${shop._id}`} className="card card-hover flex gap-3">
              <Avatar src={shop.logoUrl} name={shop.name} size={48} rounded={false} />
              <div className="min-w-0">
                <h2 className="truncate font-bold">{shop.name}</h2>
                <p className="text-sm text-slate-400"><Icon name="pin" /> {shop.city}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-300">{shop.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
