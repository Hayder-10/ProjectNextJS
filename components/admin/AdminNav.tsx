import Tabs from '@/components/ui/Tabs';
import type { IconName } from '@/components/ui/Icon';

export const ADMIN_SECTIONS: { href: string; label: string; icon: IconName }[] = [
  { href: '/admin', label: 'Tableau de bord', icon: 'dashboard' },
  { href: '/admin/users', label: 'Utilisateurs', icon: 'users' },
  { href: '/admin/products', label: 'Produits', icon: 'cart' },
  { href: '/admin/orders', label: 'Commandes', icon: 'package' },
  { href: '/admin/pitches', label: 'Terrains', icon: 'goal' },
  { href: '/admin/bookings', label: 'Réservations', icon: 'calendar' },
  { href: '/admin/forum', label: 'Forum', icon: 'chat' },
  { href: '/admin/tournaments', label: 'Tournois', icon: 'trophy' },
  { href: '/admin/teams', label: 'Mes XI', icon: 'ball' },
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
