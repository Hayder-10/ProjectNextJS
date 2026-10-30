import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { getDashboardStats, getLowStockProducts } from '@/lib/queries/admin';
import { listAllOrders } from '@/lib/queries/shop';
import { ORDER_STATUS_LABELS } from '@/lib/validation/shop';
import { formatDate, formatTND } from '@/lib/utils';
import AdminNav from '@/components/admin/AdminNav';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export const metadata = { title: 'Administration' };

export default async function AdminDashboardPage() {
  await requireAdmin();
  const [stats, orders, lowStock] = await Promise.all([getDashboardStats(), listAllOrders(), getLowStockProducts()]);

  const tiles = [
    { label: "Chiffre d'affaires", value: formatTND(stats.revenue), href: '/admin/orders', accent: true },
    { label: 'Commandes en attente', value: stats.pendingOrders, href: '/admin/orders' },
    { label: 'Réservations à venir', value: stats.upcomingBookings, href: '/admin/bookings' },
    { label: 'Utilisateurs', value: stats.users, href: '/admin/users' },
    { label: 'Publications', value: stats.posts, href: '/admin/forum' },
    { label: 'Produits', value: stats.products, href: '/admin/products' },
    { label: 'Terrains actifs', value: stats.pitches, href: '/admin/pitches' },
    { label: 'Tournois en cours', value: stats.tournaments.ongoing, href: '/admin/tournaments' },
  ];

  return (
    <div className="space-y-6">
      <AdminNav active="/admin" />
      <h1 className="page-title">Tableau de bord</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href} className="card card-hover">
            <p className="text-xs uppercase tracking-wider text-slate-400">{t.label}</p>
            <p className={`mt-1 font-display text-3xl font-bold ${t.accent ? 'text-amber-400' : 'text-white'}`}>{t.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="space-y-3 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Dernières commandes</h2>
            <Link href="/admin/orders" className="link text-sm">Tout voir →</Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune commande.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {orders.slice(0, 6).map((o) => (
                <li key={o._id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="truncate">
                    {typeof o.buyer === 'object' && o.buyer ? o.buyer.name : 'Compte supprimé'} · <span className="text-slate-400">{formatDate(o.createdAt)}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-semibold text-amber-400">{formatTND(o.total)}</span>
                    <Badge color={o.status === 'pending' ? 'amber' : o.status === 'cancelled' ? 'red' : 'green'}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="space-y-3">
            <h2 className="section-title">Stock faible</h2>
            {lowStock.length === 0 ? (
              <p className="text-sm text-slate-400">Tous les produits sont bien approvisionnés ✓</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {lowStock.map((p) => (
                  <li key={p._id} className="flex justify-between gap-2">
                    <Link href={`/admin/products/${p._id}/edit`} className="truncate hover:underline">{p.name}</Link>
                    <Badge color={p.stock === 0 ? 'red' : 'amber'}>{p.stock === 0 ? 'Rupture' : `${p.stock} restant(s)`}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="space-y-2">
            <h2 className="section-title">Tournois</h2>
            <div className="grid grid-cols-3 gap-2">
              <div className="stat"><p className="font-display text-2xl font-bold">{stats.tournaments.open}</p><p className="text-xs text-slate-400">Ouverts</p></div>
              <div className="stat"><p className="font-display text-2xl font-bold">{stats.tournaments.ongoing}</p><p className="text-xs text-slate-400">En cours</p></div>
              <div className="stat"><p className="font-display text-2xl font-bold">{stats.tournaments.finished}</p><p className="text-xs text-slate-400">Terminés</p></div>
            </div>
            <p className="text-xs text-slate-400">{stats.teams} XI composés par les utilisateurs</p>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href="/admin/products/new" className="btn btn-primary">+ Nouveau produit</Link>
        <Link href="/admin/pitches/new" className="btn btn-secondary">+ Nouveau terrain</Link>
        <Link href="/tournaments/new" className="btn btn-secondary">+ Nouveau tournoi</Link>
      </div>
    </div>
  );
}
