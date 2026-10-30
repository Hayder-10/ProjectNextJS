import Tabs from '@/components/ui/Tabs';

export const ADMIN_SECTIONS = [
  { href: '/admin', label: '📊 Tableau de bord' },
  { href: '/admin/users', label: '👤 Utilisateurs' },
  { href: '/admin/products', label: '🛒 Produits' },
  { href: '/admin/orders', label: '📦 Commandes' },
  { href: '/admin/pitches', label: '🥅 Terrains' },
  { href: '/admin/bookings', label: '📅 Réservations' },
  { href: '/admin/forum', label: '💬 Forum' },
  { href: '/admin/tournaments', label: '🏆 Tournois' },
  { href: '/admin/teams', label: '⚽ Mes XI' },
];

/** Navigation commune à toutes les pages d'administration */
export default function AdminNav({ active }: { active: string }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-amber-400/15 px-2 py-1 text-xs font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">Admin</span>
        <p className="text-sm text-slate-400">Gestion complète de FootHub</p>
      </div>
      <Tabs tabs={ADMIN_SECTIONS} active={active} />
    </div>
  );
}
